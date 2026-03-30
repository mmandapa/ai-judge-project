import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { buildPromptPayload } from "../../shared/prompt.js";
import type { EvaluationOutput, JudgeRecord, PromptFieldConfig, SubmissionAttachment } from "../../shared/types.js";
import { evaluationOutputSchema } from "../../shared/types.js";
import { resolveAttachmentContentParts } from "../lib/attachments.js";
import { getEnv } from "../lib/env.js";
import { getSupabaseClient } from "../lib/supabase.js";

export type EvaluationProviderInput = {
  judge: JudgeRecord;
  promptFieldConfig: PromptFieldConfig;
  questionText: string;
  questionType: string;
  answer: unknown;
  submissionId: string;
  labelingTaskId: string | null;
  attachments: SubmissionAttachment[];
};

export interface EvaluationProvider {
  evaluate(input: EvaluationProviderInput): Promise<EvaluationOutput & { rawResponse: unknown; attachmentsUsed: boolean }>;
}

export class OpenAIEvaluationProvider implements EvaluationProvider {
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor() {
    const env = getEnv();
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
    });
    this.defaultModel = env.OPENAI_MODEL;
  }

  async evaluate(input: EvaluationProviderInput): Promise<EvaluationOutput & { rawResponse: unknown; attachmentsUsed: boolean }> {
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
