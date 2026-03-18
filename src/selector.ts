import type { ModelSpec, TierName } from "./types.js";
import { getModelsByTier } from "./catalog.js";
import { resolveExecutable } from "./cli-spawn.js";

const availabilityCache = new Map<string, boolean>();

const CLI_COMMANDS: Record<string, string> = {
  "claude-cli": "claude",
  "gemini-cli": "gemini",
  "codex-cli": "codex",
  "ollama": "ollama",
};

const API_KEY_ENVS: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  cerebras: "CEREBRAS_API_KEY",
};

export function isAvailable(provider: string): boolean {
  if (availabilityCache.has(provider)) return availabilityCache.get(provider)!;

  let available = false;
  const cliCmd = CLI_COMMANDS[provider];
  if (cliCmd !== undefined) {
    try {
      resolveExecutable(cliCmd);
      available = true;
    } catch {
      available = false;
    }
  } else {
    const envVar = API_KEY_ENVS[provider];
    available = envVar ? !!process.env[envVar] : false;
  }

  availabilityCache.set(provider, available);
  return available;
}

export function clearAvailabilityCache(): void {
  availabilityCache.clear();
}

export async function selectModel(opts: { tier: TierName }): Promise<ModelSpec> {
  const models = getModelsByTier(opts.tier);
  if (models.length === 0) {
    throw new Error(`No models defined for tier: ${opts.tier}`);
  }

  for (const model of models) {
    if (isAvailable(model.provider)) return model;
  }

  const tried = models.map((m) => `${m.provider}/${m.model}`).join(", ");
  throw new Error(`No available model for tier "${opts.tier}". Tried: ${tried}`);
}
