import type { EvaluationOutput, JudgeRecord, PromptFieldConfig, SubmissionAttachment } from "../../shared/types.js";

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

export type EvaluationProviderResult = EvaluationOutput & {
  rawResponse: unknown;
  attachmentsUsed: boolean;
};

/**
 * Contract shared by all evaluation providers.
 */
export interface EvaluationProvider {
  evaluate(input: EvaluationProviderInput): Promise<EvaluationProviderResult>;
}
