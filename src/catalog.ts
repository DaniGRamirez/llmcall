import type { ModelSpec, TierName, ProviderName } from "./types.js";

export const MODEL_CATALOG: ModelSpec[] = [
  // === premium ===
  { provider: "claude-cli", model: "claude-opus-4-20250514", tier: "premium" },
  { provider: "claude-cli", model: "claude-sonnet-4-20250514", tier: "premium" },
  { provider: "gemini-cli", model: "gemini-2.5-pro", tier: "premium" },
  { provider: "codex-cli", model: "o3", tier: "premium" },
  { provider: "anthropic", model: "claude-sonnet-4-20250514", tier: "premium" },
  { provider: "openai", model: "gpt-4o", tier: "premium" },
  // === budget ===
  { provider: "claude-cli", model: "claude-haiku-4-5-20251001", tier: "budget" },
  { provider: "anthropic", model: "claude-haiku-4-5-20251001", tier: "budget" },
  { provider: "openai", model: "gpt-4o-mini", tier: "budget" },
  // === speed ===
  { provider: "gemini-cli", model: "gemini-2.5-flash", tier: "speed" },
  { provider: "codex-cli", model: "o4-mini", tier: "speed" },
  { provider: "cerebras", model: "llama-4-scout-17b-16e-instruct", tier: "speed" },
  // === free (OpenRouter) ===
  { provider: "openrouter", model: "deepseek/deepseek-r1", tier: "free" },
  { provider: "openrouter", model: "meta-llama/llama-4-maverick", tier: "free" },
  { provider: "openrouter", model: "google/gemini-2.5-flash-preview", tier: "free" },
  { provider: "openrouter", model: "qwen/qwen3-235b-a22b", tier: "free" },
  { provider: "openrouter", model: "microsoft/mai-ds-r1", tier: "free" },
  { provider: "openrouter", model: "nousresearch/deephermes-3-llama-3-8b", tier: "free" },
  // === local (Ollama) ===
  { provider: "ollama", model: "llama3.2:3b", tier: "local" },
  { provider: "ollama", model: "qwen2.5:7b", tier: "local" },
  { provider: "ollama", model: "deepseek-r1:8b", tier: "local" },
  // === codex — TODO: verify exact model IDs against codex CLI ===
  { provider: "codex-cli", model: "gpt-4.1", tier: "premium" },
  { provider: "codex-cli", model: "gpt-4.1-mini", tier: "budget" },
];

export function getModelsByTier(tier: TierName): ModelSpec[] {
  return MODEL_CATALOG.filter((m) => m.tier === tier);
}

export function findModel(provider: ProviderName, model: string): ModelSpec | undefined {
  return MODEL_CATALOG.find((m) => m.provider === provider && m.model === model);
}
