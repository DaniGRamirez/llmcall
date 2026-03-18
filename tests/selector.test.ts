import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../src/cli-spawn.js", () => ({
  resolveExecutable: vi.fn((cmd: string) => {
    if (cmd === "claude" || cmd === "ollama") return { command: cmd, args: [], shell: false };
    throw new Error(`not found: ${cmd}`);
  }),
}));

import { selectModel, isAvailable, clearAvailabilityCache } from "../src/selector.js";

describe("selector", () => {
  beforeEach(() => {
    clearAvailabilityCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearAvailabilityCache();
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.CEREBRAS_API_KEY;
  });

  it("selects a model for tier 'free' (openrouter)", async () => {
    process.env.OPENROUTER_API_KEY = "test";
    const m = await selectModel({ tier: "free" });
    expect(m.tier).toBe("free");
    expect(m.provider).toBe("openrouter");
  });

  it("selects a model for tier 'local' (ollama available)", async () => {
    const m = await selectModel({ tier: "local" });
    expect(m.tier).toBe("local");
    expect(m.provider).toBe("ollama");
  });

  it("selects a premium model (claude CLI available)", async () => {
    const m = await selectModel({ tier: "premium" });
    expect(m).toBeDefined();
    expect(m.provider).toBe("claude-cli");
  });

  it("throws when no models available", async () => {
    // free tier needs OPENROUTER_API_KEY which we haven't set
    delete process.env.OPENROUTER_API_KEY;
    await expect(selectModel({ tier: "free" })).rejects.toThrow(/no available model/i);
  });

  it("throws listing tried models in error message", async () => {
    delete process.env.OPENROUTER_API_KEY;
    try {
      await selectModel({ tier: "free" });
      expect.fail("Should have thrown");
    } catch (err: unknown) {
      const message = (err as Error).message;
      expect(message).toMatch(/openrouter/);
    }
  });

  it("caches CLI availability results", async () => {
    const { resolveExecutable } = await import("../src/cli-spawn.js");
    const mockResolve = vi.mocked(resolveExecutable);

    // First call
    isAvailable("claude-cli");
    const firstCallCount = mockResolve.mock.calls.length;

    // Second call — should use cache
    isAvailable("claude-cli");
    expect(mockResolve.mock.calls.length).toBe(firstCallCount); // no new calls
  });

  it("isAvailable returns true for claude-cli when claude resolves", () => {
    expect(isAvailable("claude-cli")).toBe(true);
  });

  it("isAvailable returns false for gemini-cli when gemini throws", () => {
    expect(isAvailable("gemini-cli")).toBe(false);
  });

  it("isAvailable returns true for openrouter when key is set", () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    expect(isAvailable("openrouter")).toBe(true);
  });

  it("isAvailable returns false for openrouter when key is missing", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(isAvailable("openrouter")).toBe(false);
  });

  it("isAvailable returns false for unknown provider", () => {
    expect(isAvailable("unknown-provider")).toBe(false);
  });

  it("clearAvailabilityCache resets cached results", async () => {
    const { resolveExecutable } = await import("../src/cli-spawn.js");
    const mockResolve = vi.mocked(resolveExecutable);
    const callsBefore = mockResolve.mock.calls.length;

    isAvailable("claude-cli"); // populates cache
    clearAvailabilityCache();
    isAvailable("claude-cli"); // should call resolveExecutable again

    expect(mockResolve.mock.calls.length).toBeGreaterThan(callsBefore + 1);
  });

  it("selectModel throws with helpful message for invalid tier with no models", async () => {
    // 'speed' tier: gemini-cli, codex-cli, cerebras — all unavailable (neither in mock)
    delete process.env.CEREBRAS_API_KEY;
    await expect(selectModel({ tier: "speed" })).rejects.toThrow(/no available model/i);
  });
});
