import { describe, it, expect } from "vitest";
import { createProvider } from "../src/factory.js";

describe("factory", () => {
  it("throws on unknown provider", () => {
    expect(() => createProvider({ provider: "unknown" as any, model: "x" })).toThrow(
      /unknown provider/i
    );
  });

  it("returns provider with correct name for each known provider", () => {
    const providers = [
      { provider: "anthropic" as const, model: "claude-sonnet-4-20250514" },
      { provider: "openai" as const, model: "gpt-4o" },
      { provider: "openrouter" as const, model: "deepseek/deepseek-r1" },
      { provider: "cerebras" as const, model: "llama-4-scout-17b-16e-instruct" },
      { provider: "claude-cli" as const, model: "claude-sonnet-4-20250514" },
      { provider: "gemini-cli" as const, model: "gemini-2.5-pro" },
      { provider: "codex-cli" as const, model: "o3" },
    ];

    for (const spec of providers) {
      const p = createProvider(spec);
      expect(p.name).toBe(spec.provider);
      expect(p.model).toBe(spec.model);
    }
  });
});
