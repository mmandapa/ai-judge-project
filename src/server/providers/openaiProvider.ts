/**
 * OpenAI-backed provider implementation.
 */
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { buildPromptPayload } from "../../shared/prompt.js";
import { evaluationOutputSchema } from "../../shared/types.js";
import { resolveAttachmentContentParts } from "../lib/attachments.js";
import { getEnv } from "../lib/env.js";
import { getSupabaseClient } from "../lib/supabase.js";
import type { EvaluationProvider, EvaluationProviderInput, EvaluationProviderResult } from "./types.js";

/**
 * Calls the OpenAI Responses API and parses the structured verdict payload.
 */
export class OpenAIEvaluationProvider implements EvaluationProvider {
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  /**
   * Creates an OpenAI client from the validated server environment.
   */
  constructor() {
    const env = getEnv();
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required to run judges with the OpenAI provider.");
    }
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
    });
    this.defaultModel = env.OPENAI_MODEL;
  }

  /**
   * Builds the prompt payload, resolves attachments, and returns the parsed
   * provider output plus raw response metadata.
   */
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
      ? await resolveAttachmentContentParts(getSupabaseClient(), input.attachments)
      : [];

    const response = await this.client.responses.parse({
      model: input.judge.model || this.defaultModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: prompt.system,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt.user,
            },
            ...attachmentParts,
          ],
        },
      ],
      text: {
        format: zodTextFormat(evaluationOutputSchema, "evaluation"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no parsed evaluation output.");
    }

    return {
      ...response.output_parsed,
      rawResponse: response,
      attachmentsUsed: attachmentParts.length > 0,
    };
  }
}
