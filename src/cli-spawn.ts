import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ResolvedExecutable {
  command: string;
  args: string[];
  shell: boolean;
}

export interface SpawnOptions {
  command: string;
  args: string[];
  stdin: string;
  timeoutMs: number;
}

/**
 * Resolve how to spawn a CLI command.
 *
 * On Windows, `shell: true` causes cmd.exe to:
 * - Strip double quotes → corrupts JSON arguments
 * - Interpret < > as I/O redirection → "file not found" errors
 *
 * Fix: find the .cmd wrapper via `where`, parse it to get the real node script,
 * then spawn `node <script>` with `shell: false` to bypass cmd.exe entirely.
 */
export function resolveExecutable(cmd: string): ResolvedExecutable {
  if (process.platform !== "win32") {
    return { command: cmd, args: [], shell: false };
  }

  // Windows: try to resolve past the .cmd wrapper
  try {
    const whereOutput = execSync(`where ${cmd}`, { encoding: "utf-8" });
    const cmdPath = whereOutput
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.toLowerCase().endsWith(".cmd"));

    if (!cmdPath) {
      return { command: cmd, args: [], shell: true };
    }

    const cmdContent = readFileSync(cmdPath, "utf-8");

    // Pattern 1a: direct node invocation — node "path\to\script.js"
    // Pattern 1b: npm global .cmd wrapper — "%_prog%"  "%dp0%\node_modules\...\index.js"
    const cmdDir = cmdPath.replace(/[/\\][^/\\]+\.cmd$/i, "");

    // Try both patterns: literal "node" and "%_prog%" (which resolves to node)
    const scriptPatterns = [
      /node\s+"([^"]+\.js)"/i,
      /"%_prog%"\s+"([^"]+\.js)"/i,
    ];
    for (const pattern of scriptPatterns) {
      const match = cmdContent.match(pattern);
      if (match) {
        const scriptPath = match[1];
        const resolvedScript = scriptPath
          .replace(/%~dp0/gi, cmdDir + "\\")
          .replace(/%dp0%/gi, cmdDir + "\\")
          .replace(/\//g, "\\");
        if (existsSync(resolvedScript)) {
          return { command: "node", args: [resolvedScript], shell: false };
        }
      }
    }

    // Pattern 2: npm global bin layout — cmd lives at <prefix>\claude.cmd
    // cli.js is at <prefix>\node_modules\<scope>\<pkg>\cli.js
    // Try standard npm package name conventions
    const npmDir = cmdPath.replace(/[/\\][^/\\]+\.cmd$/i, "");
    const possiblePaths = [
      join(npmDir, "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
      join(npmDir, "node_modules", cmd, "cli.js"),
      join(npmDir, "node_modules", ".bin", cmd + ".js"),
    ];
    for (const candidate of possiblePaths) {
      if (existsSync(candidate)) {
        return { command: "node", args: [candidate], shell: false };
      }
    }

    // Pattern 3: standalone .exe referenced in .cmd
    // e.g. "@echo off\n"C:\path\to\claude.exe" %*"
    const exeMatch = cmdContent.match(/"([^"]+\.exe)"/i);
    if (exeMatch && existsSync(exeMatch[1])) {
      return { command: exeMatch[1], args: [], shell: false };
    }

    // Fallback: use shell: true as last resort
    return { command: cmd, args: [], shell: true };
  } catch {
    // where failed or file read failed — fall back to shell
    return { command: cmd, args: [], shell: true };
  }
}

/**
 * Spawn a CLI process, write stdin, collect stdout/stderr, handle timeout.
 *
 * Resolves with stdout when:
 * - Exit code is 0, OR
 * - Exit code is non-zero but stdout has content (some CLIs return non-zero on warnings)
 *
 * Rejects when:
 * - Timeout exceeded
 * - Non-zero exit code with no stdout (uses stderr as error message)
 */
export function spawnCli(options: SpawnOptions): Promise<string> {
  const { command, args, stdin, timeoutMs } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
      reject(new Error(`Process timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) return; // already rejected

      if (code === 0) {
        resolve(stdout);
      } else if (stdout.length > 0) {
        // Non-zero exit but has output — resolve (warnings, etc.)
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Process exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (!timedOut) {
        reject(err);
      }
    });

    // Write stdin and close the pipe
    if (stdin.length > 0) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}
