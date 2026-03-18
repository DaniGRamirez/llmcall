import { describe, it, expect, vi } from "vitest";
import { createClaudeCliProvider } from "../../src/providers/claude-cli.js";

vi.mock("../../src/cli-spawn.js", () => ({
  resolveExecutable: vi.fn(() => ({ command: "claude", args: [], shell: false })),
  spawnCli: vi.fn(async () => "mocked response"),
}));

describe("claude-cli provider", () => {
  it("creates provider with correct name and model", () => {
    const p = createClaudeCliProvider("claude-sonnet-4-20250514");
    expect(p.name).toBe("claude-cli");
    expect(p.model).toBe("claude-sonnet-4-20250514");
  });

  it("generateText calls spawnCli", async () => {
    const { spawnCli } = await import("../../src/cli-spawn.js");
    const p = createClaudeCliProvider("claude-sonnet-4-20250514");
    const result = await p.generateText("hello");
    expect(result).toBe("mocked response");
    expect(spawnCli).toHaveBeenCalled();
  });

  it("has generateObject method", () => {
    const p = createClaudeCliProvider("claude-sonnet-4-20250514");
    expect(typeof p.generateObject).toBe("function");
  });
});
