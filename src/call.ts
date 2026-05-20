import type { GenerateOptions, TierName, ProviderName } from "./types.js";
import { selectModel } from "./selector.js";
import { createProvider } from "./factory.js";

export interface CallOptions extends GenerateOptions {
  tier?: TierName;
  provider?: ProviderName;
  model?: string;
}

export async function call(
  prompt: string,
  options: CallOptions = {},
): Promise<string> {
  const { tier, provider, model, ...generateOpts } = options;

  if (provider && model) {
    const p = createProvider({ provider, model });
    return p.generateText(prompt, generateOpts);
  }

  const spec = await selectModel({ tier: tier ?? "budget" });
  const p = createProvider(spec);
  return p.generateText(prompt, generateOpts);
}
