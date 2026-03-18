import { describe, it, expect, vi } from "vitest";
import { createGeminiCliProvider } from "../../src/providers/gemini-cli.js";

vi.mock("../../src/cli-spawn.js", () => ({
  resolveExecutable: vi.fn(() => ({ command: "gemini", args: [], shell: false })),
  spawnCli: vi.fn(async () => "mocked response"),
}));

describe("gemini-cli provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createGeminiCliProvider("gemini-2.0-flash");
    expect(p.name).toBe("gemini-cli");
    expect(p.model).toBe("gemini-2.0-flash");
  });

  it("generateText calls spawnCli", async () => {
    const { spawnCli } = await import("../../src/cli-spawn.js");
    const p = createGeminiCliProvider("gemini-2.0-flash");
    const result = await p.generateText("hello");
    expect(result).toBe("mocked response");
    expect(spawnCli).toHaveBeenCalled();
  });

  it("has generateObject method", () => {
    const p = createGeminiCliProvider("gemini-2.0-flash");
    expect(typeof p.generateObject).toBe("function");
  });
});
