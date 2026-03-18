import type { ZodType } from "zod";

export type ProviderName =
  | "anthropic" | "openai" | "openrouter" | "ollama" | "cerebras"
  | "claude-cli" | "gemini-cli" | "codex-cli";

export type TierName = "premium" | "budget" | "speed" | "free" | "local";

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateObject<T>(prompt: string, schema: ZodType<T>, options?: GenerateOptions): Promise<T>;
}

export interface ModelSpec {
  provider: ProviderName;
  model: string;
  tier: TierName;
}

export interface ProviderConfig {
  provider: ProviderName;
  model: string;
  baseUrl?: string;
  apiKeyEnv?: string;
}

export interface LLMCallConfig {
  default?: { provider: ProviderName; model: string };
  tiers?: Partial<Record<TierName, { provider: ProviderName; model: string }>>;
  timeout?: number;
}
