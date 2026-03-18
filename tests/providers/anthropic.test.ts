import { describe, it, expect, vi } from "vitest";
import { createAnthropicProvider } from "../../src/providers/anthropic.js";

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => vi.fn(() => "mock-model")),
}));
vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({ text: "hello" })),
  generateObject: vi.fn(async () => ({ object: { name: "test" } })),
}));

describe("anthropic provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createAnthropicProvider("claude-sonnet-4-20250514");
    expect(p.name).toBe("anthropic");
    expect(p.model).toBe("claude-sonnet-4-20250514");
  });

  it("has generateText method", () => {
    const p = createAnthropicProvider("claude-sonnet-4-20250514");
    expect(typeof p.generateText).toBe("function");
  });

  it("has generateObject method", () => {
    const p = createAnthropicProvider("claude-sonnet-4-20250514");
    expect(typeof p.generateObject).toBe("function");
  });
});
