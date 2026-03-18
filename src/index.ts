// src/index.ts
export { createProvider } from "./factory.js";
export { selectModel } from "./selector.js";
export { MODEL_CATALOG, getModelsByTier, findModel } from "./catalog.js";
export { loadConfig } from "./config.js";
export type {
  LLMProvider,
  GenerateOptions,
  ModelSpec,
  ProviderName,
  TierName,
  ProviderConfig,
  LLMCallConfig,
} from "./types.js";
