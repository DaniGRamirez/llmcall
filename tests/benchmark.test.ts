import { describe, it, expect, vi } from "vitest";
import type { BenchmarkTarget, BenchmarkResult } from "../src/benchmark.js";
import { resolveTargets, runBenchmark } from "../src/benchmark.js";

vi.mock("../src/factory.js", () => ({
  createProvider: vi.fn((spec: any) => ({
    name: spec.provider,
    model: spec.model,
    generateText: vi.fn(async () => `response from ${spec.provider}/${spec.model}`),
    generateObject: vi.fn(),
  })),
}));

vi.mock("../src/selector.js", () => ({
  isAvailable: vi.fn((provider: string) => {
    return ["claude-cli", "openrouter"].includes(provider);
  }),
}));

vi.mock("../src/catalog.js", () => ({
  getModelsByTier: vi.fn((tier: string) => {
    if (tier === "free") return [
      { provider: "openrouter", model: "deepseek/deepseek-r1", tier: "free" },
      { provider: "openrouter", model: "meta-llama/llama-4-maverick", tier: "free" },
    ];
    return [];
  }),
}));

describe("resolveTargets", () => {
  it("parses --models with colon separator", () => {
    const targets = resolveTargets({
      models: "claude-cli:claude-sonnet-4-20250514,openrouter:deepseek/deepseek-r1",
    });
    expect(targets).toEqual([
      { provider: "claude-cli", model: "claude-sonnet-4-20250514" },
      { provider: "openrouter", model: "deepseek/deepseek-r1" },
    ]);
  });

  it("resolves --tier to available models", () => {
    const targets = resolveTargets({ tier: "free" });
    expect(targets).toHaveLength(2);
    expect(targets[0].provider).toBe("openrouter");
  });

  it("combines --models and --tier, deduplicates", () => {
    const targets = resolveTargets({
      models: "openrouter:deepseek/deepseek-r1",
      tier: "free",
    });
    expect(targets).toHaveLength(2);
  });

  it("throws if no --models and no --tier", () => {
    expect(() => resolveTargets({})).toThrow(/specify --models or --tier/i);
  });
});

describe("runBenchmark", () => {
  it("runs prompt against all targets", async () => {
    const results = await runBenchmark({
      prompt: "hello",
      targets: [
        { provider: "claude-cli", model: "claude-sonnet-4-20250514" },
        { provider: "openrouter", model: "deepseek/deepseek-r1" },
      ],
      concurrency: 3,
    });
    expect(results).toHaveLength(2);
    expect(results[0].response).toContain("response from");
    expect(results[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("captures errors without throwing", async () => {
    const { createProvider } = await import("../src/factory.js");
    (createProvider as any).mockImplementationOnce(() => ({
      name: "bad",
      model: "bad",
      generateText: vi.fn(async () => { throw new Error("API error"); }),
      generateObject: vi.fn(),
    }));

    const results = await runBenchmark({
      prompt: "hello",
      targets: [{ provider: "bad" as any, model: "bad" }],
      concurrency: 1,
    });
    expect(results).toHaveLength(1);
    expect(results[0].error).toBe("API error");
    expect(results[0].response).toBeUndefined();
  });

  it("respects concurrency limit", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const { createProvider } = await import("../src/factory.js");
    (createProvider as any).mockImplementation((spec: any) => ({
      name: spec.provider,
      model: spec.model,
      generateText: vi.fn(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 50));
        concurrent--;
        return "ok";
      }),
      generateObject: vi.fn(),
    }));

    const targets = Array.from({ length: 6 }, (_, i) => ({
      provider: "openrouter" as const,
      model: `model-${i}`,
    }));

    await runBenchmark({ prompt: "test", targets, concurrency: 2 });
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });
});
