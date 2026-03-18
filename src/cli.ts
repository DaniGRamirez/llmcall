#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createProvider } from "./factory.js";
import { selectModel } from "./selector.js";
import { loadConfig } from "./config.js";
import type { ProviderName, TierName } from "./types.js";

export interface CliArgs {
  prompt: string;
  provider?: ProviderName;
  model?: string;
  tier?: TierName;
  json?: boolean;
  schema?: string;
  system?: string;
}

/**
 * Validate a parsed JSON object against a simple schema string.
 * Schema format: '{"key":"type", ...}' where type is "string"|"number"|"boolean"|"object"|"array"
 * Throws if validation fails.
 */
function validateAgainstSchema(obj: unknown, schemaStr: string): void {
  const schema = JSON.parse(schemaStr);
  if (typeof obj !== "object" || obj === null) {
    throw new Error(`Expected object, got ${typeof obj}`);
  }
  for (const [key, expectedType] of Object.entries(schema)) {
    if (!(key in (obj as Record<string, unknown>))) {
      throw new Error(`Missing required key: ${key}`);
    }
    const actual = typeof (obj as Record<string, unknown>)[key];
    if (expectedType === "array") {
      if (!Array.isArray((obj as Record<string, unknown>)[key])) {
        throw new Error(`Key "${key}": expected array, got ${actual}`);
      }
    } else if (actual !== expectedType) {
      throw new Error(`Key "${key}": expected ${expectedType}, got ${actual}`);
    }
  }
}

export function parseArgs(argv: string[]): CliArgs {
  const parsed = yargs(argv)
    .usage("$0 <prompt>", "Call an LLM", (y) =>
      y.positional("prompt", { type: "string", demandOption: true })
    )
    .option("provider", { type: "string", describe: "LLM provider" })
    .option("model", { type: "string", describe: "Model ID" })
    .option("tier", { type: "string", describe: "Model tier", choices: ["premium", "budget", "speed", "free", "local"] })
    .option("json", { type: "boolean", describe: "Request JSON output" })
    .option("schema", { type: "string", describe: "JSON schema for validation" })
    .option("system", { type: "string", describe: "System prompt" })
    .help()
    .parseSync();

  return {
    prompt: parsed.prompt as string,
    provider: parsed.provider as ProviderName | undefined,
    model: parsed.model,
    tier: parsed.tier as TierName | undefined,
    json: parsed.json,
    schema: parsed.schema,
    system: parsed.system,
  };
}

async function main() {
  try {
    const args = parseArgs(hideBin(process.argv));
    const config = loadConfig();

    let provider: ProviderName;
    let model: string;

    if (args.provider && args.model) {
      provider = args.provider;
      model = args.model;
    } else if (args.tier) {
      const tierOverride = config.tiers?.[args.tier];
      if (tierOverride) {
        provider = tierOverride.provider;
        model = tierOverride.model;
      } else {
        const spec = await selectModel({ tier: args.tier });
        provider = spec.provider;
        model = spec.model;
      }
    } else if (config.default) {
      provider = config.default.provider;
      model = config.default.model;
    } else {
      process.stderr.write("Error: specify --provider/--model, --tier, or set default in ~/.llmcall/config.yaml\n");
      process.exit(1);
    }

    const llm = createProvider({ provider, model });

    let prompt = args.prompt;
    if (args.json && !args.schema) {
      prompt += "\n\nRespond ONLY with valid JSON. No markdown, no explanation.";
    }

    const result = await llm.generateText(prompt, { system: args.system });

    if (args.json) {
      try {
        const parsed = JSON.parse(result);
        if (args.schema) {
          validateAgainstSchema(parsed, args.schema);
        }
        process.stdout.write(JSON.stringify(parsed, null, 2) + "\n");
      } catch (e: any) {
        if (e instanceof SyntaxError) {
          process.stderr.write(`Error: response is not valid JSON:\n${result}\n`);
        } else {
          process.stderr.write(`Error: ${e.message}\n`);
        }
        process.exit(1);
      }
    } else {
      process.stdout.write(result + "\n");
    }
  } catch (err: any) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (e.g., in tests)
const isMain = process.argv[1] && import.meta.url.endsWith(
  process.argv[1].replace(/\\/g, "/").replace(/^[A-Z]:/, "")
) || process.argv[1]?.endsWith("cli.js") || process.argv[1]?.endsWith("cli.ts");

if (isMain) {
  main();
}
