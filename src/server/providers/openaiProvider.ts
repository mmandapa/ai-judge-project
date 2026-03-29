import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { EvaluationOutput, JudgeRecord } from "../../shared/types.js";
import { evaluationOutputSchema } from "../../shared/types.js";
import { getEnv } from "../lib/env.js";

export type EvaluationProviderInput = {
  judge: JudgeRecord;
  questionText: string;
  questionType: string;
  answer: unknown;
  submissionId: string;
  labelingTaskId: string | null;
};

export interface EvaluationProvider {
  evaluate(input: EvaluationProviderInput): Promise<EvaluationOutput & { rawResponse: unknown }>;
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

  async evaluate(input: EvaluationProviderInput): Promise<EvaluationOutput & { rawResponse: unknown }> {
    const response = await this.client.responses.parse({
      model: input.judge.model || this.defaultModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are an AI judge for an annotation platform.",
                "Review the user's answer against the rubric.",
                "Return one verdict: pass, fail, or inconclusive.",
                "Reasoning must be short and concrete.",
                input.judge.rubricPrompt,
              ].join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  submissionId: input.submissionId,
                  labelingTaskId: input.labelingTaskId,
                  questionType: input.questionType,
                  questionText: input.questionText,
                  answer: input.answer,
                },
                null,
                2,
              ),
            },
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
    };
  }
}
