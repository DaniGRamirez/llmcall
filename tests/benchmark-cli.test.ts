import { describe, it, expect } from "vitest";
import { parseBenchmarkArgs } from "../src/benchmark-cli.js";

describe("benchmark CLI arg parsing", () => {
  it("parses prompt and --models", () => {
    const args = parseBenchmarkArgs(["hello", "--models", "claude-cli:claude-haiku-4-5-20251001"]);
    expect(args.prompt).toBe("hello");
    expect(args.models).toBe("claude-cli:claude-haiku-4-5-20251001");
  });

  it("parses --tier", () => {
    const args = parseBenchmarkArgs(["hello", "--tier", "free"]);
    expect(args.tier).toBe("free");
  });

  it("parses --concurrency with default 3", () => {
    const args = parseBenchmarkArgs(["hello", "--tier", "free"]);
    expect(args.concurrency).toBe(3);
  });

  it("parses custom --concurrency", () => {
    const args = parseBenchmarkArgs(["hello", "--tier", "free", "--concurrency", "5"]);
    expect(args.concurrency).toBe(5);
  });

  it("parses --output", () => {
    const args = parseBenchmarkArgs(["hello", "--tier", "free", "--output", "report.html"]);
    expect(args.output).toBe("report.html");
  });

  it("parses --system", () => {
    const args = parseBenchmarkArgs(["hello", "--tier", "free", "--system", "Be brief"]);
    expect(args.system).toBe("Be brief");
  });
});
