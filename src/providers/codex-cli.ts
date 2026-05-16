import { resolveExecutable, spawnCli } from "../cli-spawn.js";
import type { LLMProvider, GenerateOptions } from "../types.js";
import type { ZodType } from "zod";

// On Windows, codex-cli cleans up child processes on exit via `taskkill`,
// which leaks lines like "CORRECTO: el proceso con PID X ha sido terminado."
// (ES locale) or "SUCCESS: The process with PID X has been terminated." (EN)
// into stdout, polluting the model response. The message often wraps across
// two lines for long PIDs.
function stripTaskkillNoise(output: string): string {
  return output
    .replace(
      /(?:^|\r?\n)(?:CORRECTO|SUCCESS|ÉXITO):[^\r\n]*(?:\r?\n[^\r\n]*?(?:terminado|terminated)\.)?(?=\r?\n|$)/g,
      ""
    )
    .replace(/^\s+/, "");
}

export function createCodexCliProvider(model: string, timeoutMs = 300_000): LLMProvider {
  const exe = resolveExecutable("codex");

  return {
    name: "codex-cli",
    model,
    async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
      const fullPrompt = options?.system ? `${options.system}\n\n${prompt}` : prompt;
      const args = [...exe.args, "exec", "--model", model];
      const raw = await spawnCli({ command: exe.command, args, stdin: fullPrompt, timeoutMs });
      return stripTaskkillNoise(raw);
    },
    async generateObject<T>(prompt: string, schema: ZodType<T>, options?: GenerateOptions): Promise<T> {
      const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no explanation.`;
      const raw = await this.generateText(jsonPrompt, options);
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return schema.parse(JSON.parse(cleaned));
    },
  };
}
