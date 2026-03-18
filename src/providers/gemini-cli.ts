import { resolveExecutable, spawnCli } from "../cli-spawn.js";
import type { LLMProvider, GenerateOptions } from "../types.js";
import type { ZodType } from "zod";

export function createGeminiCliProvider(model: string, timeoutMs = 300_000): LLMProvider {
  const exe = resolveExecutable("gemini");

  return {
    name: "gemini-cli",
    model,
    async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
      const fullPrompt = options?.system ? `${options.system}\n\n${prompt}` : prompt;
      const args = [...exe.args, "--model", model];
      if (fullPrompt.length < 500) {
        args.push(fullPrompt);
        return spawnCli({ command: exe.command, args, stdin: "", timeoutMs });
      }
      return spawnCli({ command: exe.command, args, stdin: fullPrompt, timeoutMs });
    },
    async generateObject<T>(prompt: string, schema: ZodType<T>, options?: GenerateOptions): Promise<T> {
      const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no explanation.`;
      const raw = await this.generateText(jsonPrompt, options);
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return schema.parse(JSON.parse(cleaned));
    },
  };
}
