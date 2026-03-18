import { describe, it, expect } from "vitest";
import { resolveExecutable, spawnCli } from "../src/cli-spawn.js";

describe("cli-spawn", () => {
  it("resolveExecutable returns command as-is on non-Windows", () => {
    // On any platform, it should return an object with command, args, shell
    const result = resolveExecutable("claude");
    expect(result).toHaveProperty("command");
    expect(result).toHaveProperty("args");
    expect(result).toHaveProperty("shell");
    expect(Array.isArray(result.args)).toBe(true);
    expect(typeof result.shell).toBe("boolean");
  });

  it("resolveExecutable returns correct structure on Unix", () => {
    if (process.platform === "win32") return;
    const result = resolveExecutable("claude");
    expect(result.command).toBe("claude");
    expect(result.args).toEqual([]);
    expect(result.shell).toBe(false);
  });

  it("resolveExecutable on Windows returns an object with expected shape", () => {
    if (process.platform !== "win32") return;
    // node.exe is always available; it may or may not have a .cmd wrapper
    // We just verify the structure is correct regardless of resolution path
    const result = resolveExecutable("node");
    expect(result).toHaveProperty("command");
    expect(result).toHaveProperty("args");
    expect(result).toHaveProperty("shell");
    expect(typeof result.command).toBe("string");
    expect(Array.isArray(result.args)).toBe(true);
    expect(typeof result.shell).toBe("boolean");
  });

  it("spawnCli rejects on timeout", async () => {
    await expect(
      spawnCli({
        command: "node",
        args: ["-e", "setTimeout(() => {}, 60000)"],
        stdin: "",
        timeoutMs: 500,
      })
    ).rejects.toThrow(/timeout/i);
  }, 10000);

  it("spawnCli captures stdout", async () => {
    const result = await spawnCli({
      command: "node",
      args: ["-e", "process.stdout.write('hello')"],
      stdin: "",
      timeoutMs: 5000,
    });
    expect(result).toBe("hello");
  });

  it("spawnCli sends stdin to process", async () => {
    const result = await spawnCli({
      command: "node",
      args: ["-e", "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(d))"],
      stdin: "input data",
      timeoutMs: 5000,
    });
    expect(result).toBe("input data");
  });

  it("spawnCli resolves with stdout even on non-zero exit code if stdout has content", async () => {
    const result = await spawnCli({
      command: "node",
      args: ["-e", "process.stdout.write('output');process.exit(1)"],
      stdin: "",
      timeoutMs: 5000,
    });
    expect(result).toBe("output");
  });

  it("spawnCli rejects with stderr when no stdout on non-zero exit", async () => {
    await expect(
      spawnCli({
        command: "node",
        args: ["-e", "process.stderr.write('error message');process.exit(1)"],
        stdin: "",
        timeoutMs: 5000,
      })
    ).rejects.toThrow(/error message/);
  });
});
