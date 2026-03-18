import type { ModelSpec, TierName, ProviderName } from "./types.js";

export const MODEL_CATALOG: ModelSpec[] = [
  // === premium ===
  { provider: "claude-cli", model: "claude-opus-4-20250514", tier: "premium" },
  { provider: "claude-cli", model: "claude-sonnet-4-20250514", tier: "premium" },
  { provider: "gemini-cli", model: "gemini-2.5-pro", tier: "premium" },
  { provider: "codex-cli", model: "gpt-5.4", tier: "premium" },
  { provider: "anthropic", model: "claude-sonnet-4-20250514", tier: "premium" },
  { provider: "openai", model: "gpt-4o", tier: "premium" },
  // === budget ===
  { provider: "claude-cli", model: "claude-haiku-4-5-20251001", tier: "budget" },
  { provider: "anthropic", model: "claude-haiku-4-5-20251001", tier: "budget" },
  { provider: "openai", model: "gpt-4o-mini", tier: "budget" },
  // === speed (verified 2026-03-18: top 2 are <1.5s for voice/summary tasks) ===
  { provider: "openrouter", model: "liquid/lfm-2.5-1.2b-instruct:free", tier: "speed" },
  { provider: "openrouter", model: "google/gemini-2.5-flash", tier: "speed" },
  { provider: "gemini-cli", model: "gemini-2.5-flash", tier: "speed" },
  { provider: "codex-cli", model: "gpt-5.4-mini", tier: "speed" },
  { provider: "cerebras", model: "llama-4-scout-17b-16e-instruct", tier: "speed" },
  // === free (OpenRouter — verified 2026-03-18) ===
  { provider: "openrouter", model: "google/gemini-2.5-flash", tier: "free" },
  { provider: "openrouter", model: "google/gemini-2.5-flash-lite", tier: "free" },
  { provider: "openrouter", model: "deepseek/deepseek-v3.2-20251201", tier: "free" },
  { provider: "openrouter", model: "openai/gpt-5-mini-2025-08-07", tier: "free" },
  { provider: "openrouter", model: "openai/gpt-5-nano-2025-08-07", tier: "free" },
  { provider: "openrouter", model: "openai/gpt-oss-20b", tier: "free" },
  { provider: "openrouter", model: "stepfun/step-3.5-flash", tier: "free" },
  // === local (Ollama) ===
  { provider: "ollama", model: "llama3.2:3b", tier: "local" },
  { provider: "ollama", model: "qwen2.5:7b", tier: "local" },
  { provider: "ollama", model: "deepseek-r1:8b", tier: "local" },
  // === codex (verified 2026-03-18) ===
  { provider: "codex-cli", model: "gpt-5.3-codex", tier: "premium" },
  { provider: "codex-cli", model: "gpt-5-codex-mini", tier: "budget" },
];

export function getModelsByTier(tier: TierName): ModelSpec[] {
  return MODEL_CATALOG.filter((m) => m.tier === tier);
}

export function findModel(provider: ProviderName, model: string): ModelSpec | undefined {
  return MODEL_CATALOG.find((m) => m.provider === provider && m.model === model);
}
