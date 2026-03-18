import { describe, it, expect } from "vitest";
import { parseArgs, isBenchmarkCommand } from "../src/cli.js";

describe("cli arg parsing", () => {
  it("parses bare prompt", () => {
    const args = parseArgs(["hello world"]);
    expect(args.prompt).toBe("hello world");
    expect(args.json).toBeFalsy();
  });

  it("parses --provider and --model", () => {
    const args = parseArgs(["hello", "--provider", "anthropic", "--model", "claude-sonnet-4-20250514"]);
    expect(args.provider).toBe("anthropic");
    expect(args.model).toBe("claude-sonnet-4-20250514");
  });

  it("parses --tier", () => {
    const args = parseArgs(["hello", "--tier", "budget"]);
    expect(args.tier).toBe("budget");
  });

  it("parses --json flag", () => {
    const args = parseArgs(["hello", "--json"]);
    expect(args.json).toBe(true);
  });

  it("parses --json --schema", () => {
    const args = parseArgs(["hello", "--json", "--schema", '{"name":"string"}']);
    expect(args.json).toBe(true);
    expect(args.schema).toBe('{"name":"string"}');
  });

  it("parses --system", () => {
    const args = parseArgs(["hello", "--system", "You are a translator"]);
    expect(args.system).toBe("You are a translator");
  });
});

describe("benchmark subcommand detection", () => {
  it("detects benchmark subcommand", () => {
    expect(isBenchmarkCommand(["benchmark", "hello"])).toBe(true);
    expect(isBenchmarkCommand(["hello"])).toBe(false);
    expect(isBenchmarkCommand(["--help"])).toBe(false);
  });
});
