import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import * as fs from "node:fs";

describe("config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("returns defaults when no config file exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const { loadConfig } = await import("../src/config.js");
    const config = loadConfig();
    expect(config).toEqual({});
  });

  it("parses valid config yaml", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "default:\n  provider: anthropic\n  model: claude-sonnet-4-20250514\n"
    );
    const { loadConfig } = await import("../src/config.js");
    const config = loadConfig();
    expect(config.default?.provider).toBe("anthropic");
    expect(config.default?.model).toBe("claude-sonnet-4-20250514");
  });

  it("parses tier overrides", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "tiers:\n  budget:\n    provider: claude-cli\n    model: claude-haiku-4-5-20251001\n"
    );
    const { loadConfig } = await import("../src/config.js");
    const config = loadConfig();
    expect(config.tiers?.budget?.provider).toBe("claude-cli");
  });
});
