import { describe, it, expect, vi } from "vitest";
import { createCerebrasProvider } from "../../src/providers/cerebras.js";

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => "mock-model")),
}));
vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({ text: "hello" })),
  generateObject: vi.fn(async () => ({ object: { name: "test" } })),
}));

describe("cerebras provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createCerebrasProvider("llama-3.3-70b");
    expect(p.name).toBe("cerebras");
    expect(p.model).toBe("llama-3.3-70b");
  });

  it("has generateText method", () => {
    const p = createCerebrasProvider("llama-3.3-70b");
    expect(typeof p.generateText).toBe("function");
  });

  it("has generateObject method", () => {
    const p = createCerebrasProvider("llama-3.3-70b");
    expect(typeof p.generateObject).toBe("function");
  });
});
