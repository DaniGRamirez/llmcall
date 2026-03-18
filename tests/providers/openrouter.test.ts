import { describe, it, expect, vi } from "vitest";
import { createOpenRouterProvider } from "../../src/providers/openrouter.js";

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => "mock-model")),
}));
vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({ text: "hello" })),
  generateObject: vi.fn(async () => ({ object: { name: "test" } })),
}));

describe("openrouter provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createOpenRouterProvider("meta-llama/llama-3.1-8b-instruct:free");
    expect(p.name).toBe("openrouter");
    expect(p.model).toBe("meta-llama/llama-3.1-8b-instruct:free");
  });

  it("has generateText method", () => {
    const p = createOpenRouterProvider("meta-llama/llama-3.1-8b-instruct:free");
    expect(typeof p.generateText).toBe("function");
  });

  it("has generateObject method", () => {
    const p = createOpenRouterProvider("meta-llama/llama-3.1-8b-instruct:free");
    expect(typeof p.generateObject).toBe("function");
  });
});
