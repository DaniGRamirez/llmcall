import { describe, it, expect } from "vitest";
import type {
  LLMProvider,
  GenerateOptions,
  ModelSpec,
  ProviderName,
  TierName,
} from "../src/types.js";

describe("types", () => {
  it("ProviderName accepts valid providers", () => {
    const providers: ProviderName[] = [
      "anthropic", "openai", "openrouter", "ollama", "cerebras",
      "claude-cli", "gemini-cli", "codex-cli",
    ];
    expect(providers).toHaveLength(8);
  });

  it("TierName accepts valid tiers", () => {
    const tiers: TierName[] = ["premium", "budget", "speed", "free", "local"];
    expect(tiers).toHaveLength(5);
  });

  it("ModelSpec has required fields", () => {
    const spec: ModelSpec = {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      tier: "premium",
    };
    expect(spec.provider).toBe("anthropic");
    expect(spec.model).toBe("claude-sonnet-4-20250514");
    expect(spec.tier).toBe("premium");
  });
});
