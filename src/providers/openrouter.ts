import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import type { LLMProvider, GenerateOptions } from "../types.js";
import type { ZodType } from "zod";

export function createOpenRouterProvider(model: string, apiKeyEnv?: string): LLMProvider {
  const apiKey = process.env[apiKeyEnv || "OPENROUTER_API_KEY"];
  const client = createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });

  return {
    name: "openrouter",
    model,
    async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
      const { text } = await generateText({
        model: client(model),
        prompt,
        system: options?.system,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });
      return text;
    },
    async generateObject<T>(prompt: string, schema: ZodType<T>, options?: GenerateOptions): Promise<T> {
      const { object } = await generateObject({
        model: client(model),
        prompt,
        schema,
        system: options?.system,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });
      return object;
    },
  };
}
