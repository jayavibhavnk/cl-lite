import { Config } from "../../types/index.js";

export type LLMProvider = "anthropic" | "openai" | "openai-compatible";

export interface ProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  modelName: string;
  maxTokens: number;
}

export function getProviderConfig(): ProviderConfig {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
  const MODEL_NAME = process.env.MODEL_NAME || "claude-3-haiku-20240307";
  const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || "4096", 10);

  // Determine provider based on API keys and env vars
  if (OPENAI_BASE_URL || OPENAI_API_KEY) {
    return {
      provider: "openai-compatible",
      apiKey: OPENAI_API_KEY,
      baseUrl: OPENAI_BASE_URL || "https://api.openai.com/v1",
      modelName: MODEL_NAME,
      maxTokens: MAX_TOKENS,
    };
  }

  if (OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: OPENAI_API_KEY,
      modelName: MODEL_NAME,
      maxTokens: MAX_TOKENS,
    };
  }

  if (ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      apiKey: ANTHROPIC_API_KEY,
      modelName: MODEL_NAME,
      maxTokens: MAX_TOKENS,
    };
  }

  // Default fallback
  return {
    provider: "anthropic",
    modelName: "claude-3-haiku-20240307",
    maxTokens: MAX_TOKENS,
  };
}
