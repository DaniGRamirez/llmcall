import yargs from "yargs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { resolveTargets, runBenchmark } from "./benchmark.js";
import { generateBenchmarkHtml } from "./benchmark-html.js";
import type { BenchmarkResult } from "./benchmark.js";
import type { TierName } from "./types.js";

export interface BenchmarkCliArgs {
  prompt: string;
  models?: string;
  tier?: TierName;
  concurrency: number;
  output?: string;
  system?: string;
}

export function parseBenchmarkArgs(argv: string[]): BenchmarkCliArgs {
  const parsed = yargs(argv)
    .usage("$0 <prompt>", "Benchmark multiple models", (y) =>
      y.positional("prompt", { type: "string", demandOption: true })
    )
    .option("models", { type: "string", describe: "Comma-separated provider:model pairs" })
    .option("tier", { type: "string", describe: "Run all available models of this tier", choices: ["premium", "budget", "speed", "free", "local"] })
    .option("concurrency", { type: "number", describe: "Max parallel calls", default: 3 })
    .option("output", { type: "string", describe: "Write HTML report to file" })
    .option("system", { type: "string", describe: "System prompt" })
    .help()
    .parseSync();

  return {
    prompt: parsed.prompt as string,
    models: parsed.models,
    tier: parsed.tier as TierName | undefined,
    concurrency: parsed.concurrency,
    output: parsed.output,
    system: parsed.system,
  };
}

function formatTable(results: BenchmarkResult[]): string {
  const lines: string[] = [];
  const pad = (s: string, n: number) => s.length > n ? s.slice(0, n - 3) + "..." : s.padEnd(n);
  const formatMs = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  lines.push(`  ${pad("Provider", 16)}${pad("Model", 30)}${pad("Time", 10)}${pad("Status", 10)}Preview`);
  for (const r of results) {
    const time = r.error ? "-" : formatMs(r.durationMs);
    const status = r.error ? "error" : "ok";
    const preview = r.error ? r.error : (r.response || "").slice(0, 50).replace(/\n/g, " ");
    lines.push(`  ${pad(r.provider, 16)}${pad(r.model, 30)}${pad(time, 10)}${pad(status, 10)}${preview}`);
  }

  const succeeded = results.filter((r) => !r.error);
  const avgMs = succeeded.length > 0
    ? succeeded.reduce((sum, r) => sum + r.durationMs, 0) / succeeded.length
    : 0;
  const fastest = succeeded[0];
  lines.push("");
  lines.push(`  ${succeeded.length}/${results.length} succeeded | Avg: ${formatMs(avgMs)}${fastest ? ` | Fastest: ${fastest.provider}/${fastest.model} (${formatMs(fastest.durationMs)})` : ""}`);

  return lines.join("\n");
}

function tryOpen(filePath: string): void {
  try {
    if (process.platform === "win32") {
      execSync(`start "" "${filePath}"`, { stdio: "ignore" });
    } else {
      const cmd = process.platform === "darwin" ? "open" : "xdg-open";
      execSync(`${cmd} "${filePath}"`, { stdio: "ignore" });
    }
  } catch { /* best-effort */ }
}

export async function benchmarkCommand(argv: string[]): Promise<void> {
  const args = parseBenchmarkArgs(argv);

  const targets = resolveTargets({ models: args.models, tier: args.tier });

  process.stderr.write(`Benchmark: "${args.prompt}"\n`);
  process.stderr.write(`Models: ${targets.length} | Concurrency: ${args.concurrency}\n\n`);

  const results = await runBenchmark({
    prompt: args.prompt,
    targets,
    concurrency: args.concurrency,
    system: args.system,
  });

  process.stderr.write(formatTable(results) + "\n");

  if (args.output) {
    const html = generateBenchmarkHtml(args.prompt, results);
    const outPath = resolve(args.output);
    writeFileSync(outPath, html, "utf-8");
    process.stderr.write(`\nReport written to ${outPath}\n`);
    tryOpen(outPath);
  }
}
