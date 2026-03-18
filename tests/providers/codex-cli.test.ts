import { describe, it, expect, vi } from "vitest";
import { createCodexCliProvider } from "../../src/providers/codex-cli.js";

vi.mock("../../src/cli-spawn.js", () => ({
  resolveExecutable: vi.fn(() => ({ command: "codex", args: [], shell: false })),
  spawnCli: vi.fn(async () => "mocked response"),
}));

describe("codex-cli provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createCodexCliProvider("o4-mini");
    expect(p.name).toBe("codex-cli");
    expect(p.model).toBe("o4-mini");
  });

  it("generateText calls spawnCli", async () => {
    const { spawnCli } = await import("../../src/cli-spawn.js");
    const p = createCodexCliProvider("o4-mini");
    const result = await p.generateText("hello");
    expect(result).toBe("mocked response");
    expect(spawnCli).toHaveBeenCalled();
  });

  it("has generateObject method", () => {
    const p = createCodexCliProvider("o4-mini");
    expect(typeof p.generateObject).toBe("function");
  });
});
