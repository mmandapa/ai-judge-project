/**
 * Regression coverage for queue execution behavior.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runEvaluationsForQueue } from "../src/server/lib/evaluationRunner";

const evaluate = vi.fn();

vi.mock("../src/server/providers/openaiProvider.js", () => ({
  OpenAIEvaluationProvider: class {
    evaluate = evaluate;
  },
}));

describe("runEvaluationsForQueue", () => {
  beforeEach(() => {
    evaluate.mockReset();
    evaluate.mockResolvedValue({
      verdict: "pass",
      reasoning: "ok",
      rawResponse: { ok: true },
      attachmentsUsed: false,
    });
  });

  it("runs only the selected questions for the current run", async () => {
    const insertEvaluation = vi.fn().mockResolvedValue(undefined);
    const finishRun = vi.fn().mockResolvedValue(undefined);
    const database = {
      getRunContext: vi.fn().mockResolvedValue({
        queue: { id: "queue_1" },
        assignments: [
          {
            questionTemplateId: "q_1",
            judge: {
              id: "judge_1",
              name: "Judge 1",
              rubricPrompt: "Judge carefully",
              provider: "openai",
              model: "gpt-4.1-mini",
              active: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            promptFieldConfig: {
              includeQuestionText: true,
              includeQuestionType: true,
              includeAnswer: true,
              includeSubmissionId: true,
              includeLabelingTaskId: true,
              includeAttachments: true,
            },
          },
          {
            questionTemplateId: "q_2",
            judge: {
              id: "judge_1",
              name: "Judge 1",
              rubricPrompt: "Judge carefully",
              provider: "openai",
              model: "gpt-4.1-mini",
              active: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            promptFieldConfig: {
              includeQuestionText: true,
              includeQuestionType: true,
              includeAnswer: true,
              includeSubmissionId: true,
              includeLabelingTaskId: true,
              includeAttachments: true,
            },
          },
        ],
        submissions: [
          {
            submissionId: "sub_1",
            labelingTaskId: "task_1",
            questionTemplateId: "q_1",
            questionText: "Question 1",
            questionType: "single_choice",
            answer: { choice: "yes" },
            attachments: [],
          },
          {
            submissionId: "sub_1",
            labelingTaskId: "task_1",
            questionTemplateId: "q_2",
            questionText: "Question 2",
            questionType: "single_choice",
            answer: { choice: "no" },
            attachments: [],
          },
        ],
      }),
      createRun: vi.fn().mockResolvedValue("run_1"),
      insertEvaluation,
      finishRun,
    };

    const summary = await runEvaluationsForQueue("queue_1", { database: database as never }, { questionTemplateIds: ["q_2"] });

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate.mock.calls[0]?.[0].questionText).toBe("Question 2");
    expect(insertEvaluation).toHaveBeenCalledTimes(1);
    expect(summary.plannedCount).toBe(1);
    expect(summary.completedCount).toBe(1);
  });
});
