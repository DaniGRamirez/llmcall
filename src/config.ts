import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { parse as parseYaml } from "yaml";
import type { LLMCallConfig } from "./types.js";

export function loadConfig(): LLMCallConfig {
  const configPath = join(homedir(), ".llmcall", "config.yaml");
  if (!existsSync(configPath)) return {};
  const raw = readFileSync(configPath, "utf-8");
  return (parseYaml(raw) as LLMCallConfig) ?? {};
}
