import { describe, it, expect } from "vitest";
import { generateBenchmarkHtml } from "../src/benchmark-html.js";

// Inline the type to avoid importing from benchmark.ts (may not exist yet)
interface BenchmarkResult {
  provider: string;
  model: string;
  response?: string;
  durationMs: number;
  error?: string;
}

describe("benchmark-html", () => {
  const results: BenchmarkResult[] = [
    { provider: "claude-cli", model: "claude-haiku-4-5-20251001", response: "Hello", durationMs: 1200 },
    { provider: "openrouter", model: "deepseek/deepseek-r1", response: "Hi there", durationMs: 2800 },
    { provider: "openrouter", model: "qwen/qwen3-235b", durationMs: 0, error: "Rate limit" },
  ];

  it("returns valid HTML", () => {
    const html = generateBenchmarkHtml("say hello", results);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes the prompt", () => {
    const html = generateBenchmarkHtml("say hello", results);
    expect(html).toContain("say hello");
  });

  it("includes all model names", () => {
    const html = generateBenchmarkHtml("say hello", results);
    expect(html).toContain("claude-haiku-4-5-20251001");
    expect(html).toContain("deepseek/deepseek-r1");
    expect(html).toContain("qwen/qwen3-235b");
  });

  it("includes responses", () => {
    const html = generateBenchmarkHtml("say hello", results);
    expect(html).toContain("Hello");
    expect(html).toContain("Hi there");
  });

  it("includes errors", () => {
    const html = generateBenchmarkHtml("say hello", results);
    expect(html).toContain("Rate limit");
  });

  it("includes timing info", () => {
    const html = generateBenchmarkHtml("say hello", results);
    expect(html).toContain("1.2s");
    expect(html).toContain("2.8s");
  });

  it("includes summary stats", () => {
    const html = generateBenchmarkHtml("say hello", results);
    expect(html).toContain("2/3");
  });
});
