/**
 * Shared prompt-building utilities used by both preview and execution paths.
 */
import {
  defaultPromptFieldConfig,
  type PromptFieldConfig,
  type PromptPreviewData,
  type SubmissionAttachment,
} from "./types.js";

type PromptInput = {
  rubricPrompt: string;
  promptFieldConfig?: PromptFieldConfig;
  submissionId: string;
  labelingTaskId: string | null;
  questionType: string;
  questionText: string;
  answer: unknown;
  attachments?: SubmissionAttachment[];
};

/**
 * Merges a partial config with the prompt field defaults.
 */
function normalizePromptFieldConfig(config?: PromptFieldConfig): PromptFieldConfig {
  return { ...defaultPromptFieldConfig, ...(config ?? {}) };
}

/**
 * Builds the exact system prompt and user JSON payload sent to the provider.
 */
export function buildPromptPayload(input: PromptInput) {
  const promptFieldConfig = normalizePromptFieldConfig(input.promptFieldConfig);
  const payload: Record<string, unknown> = {};

  if (promptFieldConfig.includeSubmissionId) {
    payload.submissionId = input.submissionId;
  }
  if (promptFieldConfig.includeLabelingTaskId) {
    payload.labelingTaskId = input.labelingTaskId;
  }
  if (promptFieldConfig.includeQuestionType) {
    payload.questionType = input.questionType;
  }
  if (promptFieldConfig.includeQuestionText) {
    payload.questionText = input.questionText;
  }
  if (promptFieldConfig.includeAnswer) {
    payload.answer = input.answer;
  }

  return {
    system: [
      "You are an AI judge for an annotation platform.",
      "Review the user's answer against the rubric.",
      "Return one verdict: pass, fail, or inconclusive.",
      "Reasoning must be short and concrete.",
      input.rubricPrompt,
    ].join("\n"),
    user: JSON.stringify(payload, null, 2),
    promptFieldConfig,
    attachmentsIncluded: promptFieldConfig.includeAttachments && (input.attachments?.length ?? 0) > 0,
  };
}

/**
 * Builds the preview data shown in queue setup.
 */
export function buildPromptPreview(input: PromptInput): PromptPreviewData {
  const prompt = buildPromptPayload(input);
  return {
    system: prompt.system,
    user: prompt.user,
    attachmentsIncluded: prompt.attachmentsIncluded,
  };
}
