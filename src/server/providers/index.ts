import type { ModelProvider } from "../../shared/types.js";
import { GeminiEvaluationProvider } from "./geminiProvider.js";
import { OpenAIEvaluationProvider } from "./openaiProvider.js";
import type { EvaluationProvider } from "./types.js";

/**
 * Creates a provider instance for the requested model backend.
 */
export function createEvaluationProvider(provider: ModelProvider): EvaluationProvider {
  switch (provider) {
    case "openai":
      return new OpenAIEvaluationProvider();
    case "gemini":
      return new GeminiEvaluationProvider();
  }
}
