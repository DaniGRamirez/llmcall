import type { LLMProvider, ProviderName } from "./types.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createOpenRouterProvider } from "./providers/openrouter.js";
import { createOllamaProvider } from "./providers/ollama.js";
import { createCerebrasProvider } from "./providers/cerebras.js";
import { createClaudeCliProvider } from "./providers/claude-cli.js";
import { createGeminiCliProvider } from "./providers/gemini-cli.js";
import { createCodexCliProvider } from "./providers/codex-cli.js";

export function createProvider(spec: { provider: ProviderName; model: string }): LLMProvider {
  switch (spec.provider) {
    case "anthropic": return createAnthropicProvider(spec.model);
    case "openai": return createOpenAIProvider(spec.model);
    case "openrouter": return createOpenRouterProvider(spec.model);
    case "ollama": return createOllamaProvider(spec.model);
    case "cerebras": return createCerebrasProvider(spec.model);
    case "claude-cli": return createClaudeCliProvider(spec.model);
    case "gemini-cli": return createGeminiCliProvider(spec.model);
    case "codex-cli": return createCodexCliProvider(spec.model);
    default:
      throw new Error(`Unknown provider: ${(spec as any).provider}`);
  }
}
