import type { ProviderName, TierName } from "./types.js";
import { createProvider } from "./factory.js";
import { isAvailable } from "./selector.js";
import { getModelsByTier } from "./catalog.js";

export interface BenchmarkTarget {
  provider: ProviderName;
  model: string;
}

export interface BenchmarkResult {
  provider: ProviderName;
  model: string;
  response?: string;
  durationMs: number;
  error?: string;
}

export interface BenchmarkOptions {
  prompt: string;
  targets: BenchmarkTarget[];
  concurrency: number;
  system?: string;
}

export function resolveTargets(opts: {
  models?: string;
  tier?: string;
}): BenchmarkTarget[] {
  const targets: BenchmarkTarget[] = [];
  const seen = new Set<string>();

  if (opts.models) {
    for (const entry of opts.models.split(",")) {
      const colonIdx = entry.indexOf(":");
      if (colonIdx === -1) throw new Error(`Invalid model format: "${entry}". Use provider:model`);
      const provider = entry.slice(0, colonIdx) as ProviderName;
      const model = entry.slice(colonIdx + 1);
      const key = `${provider}:${model}`;
      if (!seen.has(key)) {
        seen.add(key);
        targets.push({ provider, model });
      }
    }
  }

  if (opts.tier) {
    const tierModels = getModelsByTier(opts.tier as TierName);
    for (const m of tierModels) {
      if (isAvailable(m.provider)) {
        const key = `${m.provider}:${m.model}`;
        if (!seen.has(key)) {
          seen.add(key);
          targets.push({ provider: m.provider, model: m.model });
        }
      }
    }
  }

  if (targets.length === 0) {
    throw new Error("No targets: specify --models or --tier");
  }

  return targets;
}

export async function runBenchmark(opts: BenchmarkOptions): Promise<BenchmarkResult[]> {
  const { prompt, targets, concurrency, system } = opts;
  const results: BenchmarkResult[] = [];

  let running = 0;
  const queue = [...targets];

  const runOne = async (target: BenchmarkTarget): Promise<BenchmarkResult> => {
    const start = Date.now();
    try {
      const provider = createProvider({ provider: target.provider, model: target.model });
      const response = await provider.generateText(prompt, { system });
      return {
        provider: target.provider,
        model: target.model,
        response,
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        provider: target.provider,
        model: target.model,
        durationMs: Date.now() - start,
        error: err.message,
      };
    }
  };

  await new Promise<void>((resolve) => {
    const next = () => {
      while (running < concurrency && queue.length > 0) {
        const target = queue.shift()!;
        running++;
        runOne(target).then((result) => {
          results.push(result);
          running--;
          if (queue.length === 0 && running === 0) {
            resolve();
          } else {
            next();
          }
        });
      }
      if (queue.length === 0 && running === 0) resolve();
    };
    next();
  });

  results.sort((a, b) => a.durationMs - b.durationMs);
  return results;
}
