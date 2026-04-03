/**
 * Gemini-backed provider implementation.
 */
import { GoogleGenAI } from "@google/genai";
import { buildPromptPayload } from "../../shared/prompt.js";
import { GEMINI_DEFAULT_MODEL, evaluationOutputSchema } from "../../shared/types.js";
import { resolveAttachmentInlineData } from "../lib/attachments.js";
import { getEnv } from "../lib/env.js";
import { getSupabaseClient } from "../lib/supabase.js";
import type { EvaluationProvider, EvaluationProviderInput, EvaluationProviderResult } from "./types.js";

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

/**
 * Calls Gemini generateContent and parses the structured verdict payload.
 */
export class GeminiEvaluationProvider implements EvaluationProvider {
  private readonly client: GoogleGenAI;
  private readonly defaultModel: string;

  constructor() {
    const env = getEnv();
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required to run judges with the Gemini provider.");
    }

    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.defaultModel = env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  }

  async evaluate(input: EvaluationProviderInput): Promise<EvaluationProviderResult> {
    const prompt = buildPromptPayload({
      rubricPrompt: input.judge.rubricPrompt,
      promptFieldConfig: input.promptFieldConfig,
      submissionId: input.submissionId,
      labelingTaskId: input.labelingTaskId,
      questionType: input.questionType,
      questionText: input.questionText,
      answer: input.answer,
      attachments: input.attachments,
    });
    const attachmentParts = prompt.promptFieldConfig.includeAttachments
      ? await resolveAttachmentInlineData(getSupabaseClient(), input.attachments)
      : [];

    const response = await this.client.models.generateContent({
      model: input.judge.model || this.defaultModel,
      config: {
        responseMimeType: "application/json",
        systemInstruction: [
          prompt.system,
          "Return exactly one JSON object with keys 'verdict' and 'reasoning'.",
        ].join("\n"),
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt.user,
            },
            ...attachmentParts.map((part) => ({
              inlineData: {
                mimeType: part.mimeType,
                data: part.data,
              },
            })),
          ],
        },
      ],
    });

    const parsed = evaluationOutputSchema.parse(JSON.parse(stripJsonFences(response.text ?? "")));

    return {
      ...parsed,
      rawResponse: response,
      attachmentsUsed: attachmentParts.length > 0,
    };
  }
}
