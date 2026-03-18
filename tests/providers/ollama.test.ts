import { describe, it, expect, vi } from "vitest";
import { createOllamaProvider } from "../../src/providers/ollama.js";

vi.mock("ollama-ai-provider", () => ({
  createOllama: vi.fn(() => vi.fn(() => "mock-model")),
}));
vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({ text: "hello" })),
  generateObject: vi.fn(async () => ({ object: { name: "test" } })),
}));

describe("ollama provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createOllamaProvider("llama3.2");
    expect(p.name).toBe("ollama");
    expect(p.model).toBe("llama3.2");
  });

  it("has generateText method", () => {
    const p = createOllamaProvider("llama3.2");
    expect(typeof p.generateText).toBe("function");
  });

  it("has generateObject method", () => {
    const p = createOllamaProvider("llama3.2");
    expect(typeof p.generateObject).toBe("function");
  });
});
