/**
 * Regression coverage for prompt-shaping behavior.
 */
import { describe, expect, it } from "vitest";
import { buildPromptPayload } from "../src/shared/prompt";

describe("buildPromptPayload", () => {
  it("omits disabled fields from the user payload", () => {
    const prompt = buildPromptPayload({
      rubricPrompt: "Judge carefully.",
      promptFieldConfig: {
        includeQuestionText: false,
        includeQuestionType: true,
        includeAnswer: false,
        includeSubmissionId: true,
        includeLabelingTaskId: false,
        includeAttachments: false,
      },
      submissionId: "sub_1",
      labelingTaskId: "task_1",
      questionType: "single_choice",
      questionText: "Question text",
      answer: { choice: "yes" },
      attachments: [],
    });

    expect(prompt.user).toContain('"submissionId": "sub_1"');
    expect(prompt.user).toContain('"questionType": "single_choice"');
    expect(prompt.user).not.toContain("Question text");
    expect(prompt.user).not.toContain("task_1");
    expect(prompt.user).not.toContain('"answer"');
    expect(prompt.attachmentsIncluded).toBe(false);
  });
});
