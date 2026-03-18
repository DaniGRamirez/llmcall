import { resolveExecutable, spawnCli } from "../cli-spawn.js";
import type { LLMProvider, GenerateOptions } from "../types.js";
import type { ZodType } from "zod";

export function createClaudeCliProvider(model: string, timeoutMs = 300_000): LLMProvider {
  const exe = resolveExecutable("claude");

  return {
    name: "claude-cli",
    model,
    async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
      const args = [...exe.args, "-p", "-", "--output-format", "text"];
      if (model) args.push("--model", model);
      if (options?.system) args.push("--system-prompt", options.system);
      return spawnCli({ command: exe.command, args, stdin: prompt, timeoutMs });
    },
    async generateObject<T>(prompt: string, schema: ZodType<T>, options?: GenerateOptions): Promise<T> {
      const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON matching this structure: ${JSON.stringify(schema.description || "object")}. No markdown, no explanation.`;
      const raw = await this.generateText(jsonPrompt, options);
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return schema.parse(JSON.parse(cleaned));
    },
  };
}
