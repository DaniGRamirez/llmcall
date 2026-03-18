import { describe, it, expect, vi } from "vitest";
import { createOpenAIProvider } from "../../src/providers/openai.js";

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => "mock-model")),
}));
vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({ text: "hello" })),
  generateObject: vi.fn(async () => ({ object: { name: "test" } })),
}));

describe("openai provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createOpenAIProvider("gpt-4o");
    expect(p.name).toBe("openai");
    expect(p.model).toBe("gpt-4o");
  });

  it("has generateText method", () => {
    const p = createOpenAIProvider("gpt-4o");
    expect(typeof p.generateText).toBe("function");
  });

  it("has generateObject method", () => {
    const p = createOpenAIProvider("gpt-4o");
    expect(typeof p.generateObject).toBe("function");
  });
});
