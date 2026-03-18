import { resolveExecutable, spawnCli } from "../cli-spawn.js";
import type { LLMProvider, GenerateOptions } from "../types.js";
import type { ZodType } from "zod";

export function createCodexCliProvider(model: string, timeoutMs = 300_000): LLMProvider {
  const exe = resolveExecutable("codex");

  return {
    name: "codex-cli",
    model,
    async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
      const fullPrompt = options?.system ? `${options.system}\n\n${prompt}` : prompt;
      const args = [...exe.args, "exec", "--model", model];
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
