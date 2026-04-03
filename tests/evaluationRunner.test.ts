/**
 * Regression coverage for queue execution provider routing behavior.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runEvaluationsForQueue } from "../src/server/lib/evaluationRunner";
import { GEMINI_DEFAULT_MODEL } from "../src/shared/types";

const { openAIEvaluate, geminiEvaluate, createEvaluationProvider } = vi.hoisted(() => {
  const openAIEvaluate = vi.fn();
  const geminiEvaluate = vi.fn();
  const createEvaluationProvider = vi.fn((provider: "openai" | "gemini") => {
    if (provider === "openai") {
      return { evaluate: openAIEvaluate };
    }

    return { evaluate: geminiEvaluate };
  });

  return { openAIEvaluate, geminiEvaluate, createEvaluationProvider };
});

vi.mock("../src/server/providers/index.js", () => ({
  createEvaluationProvider,
}));

describe("runEvaluationsForQueue", () => {
  beforeEach(() => {
    openAIEvaluate.mockReset();
    geminiEvaluate.mockReset();
    createEvaluationProvider.mockClear();

    openAIEvaluate.mockResolvedValue({
      verdict: "pass",
      reasoning: "ok",
      rawResponse: { ok: true },
      attachmentsUsed: false,
    });
    geminiEvaluate.mockResolvedValue({
      verdict: "fail",
      reasoning: "not ok",
      rawResponse: { ok: true },
      attachmentsUsed: true,
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

    expect(openAIEvaluate).toHaveBeenCalledTimes(1);
    expect(openAIEvaluate.mock.calls[0]?.[0].questionText).toBe("Question 2");
    expect(insertEvaluation).toHaveBeenCalledTimes(1);
    expect(summary.plannedCount).toBe(1);
    expect(summary.completedCount).toBe(1);
  });

  it("routes mixed-provider work items to the matching provider", async () => {
    const insertEvaluation = vi.fn().mockResolvedValue(undefined);
    const finishRun = vi.fn().mockResolvedValue(undefined);
    const database = {
      getRunContext: vi.fn().mockResolvedValue({
        queue: { id: "queue_1" },
        assignments: [
          {
            questionTemplateId: "q_1",
            judge: {
              id: "judge_openai",
              name: "OpenAI Judge",
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
              id: "judge_gemini",
              name: "Gemini Judge",
              rubricPrompt: "Judge carefully",
              provider: "gemini",
              model: GEMINI_DEFAULT_MODEL,
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

    await runEvaluationsForQueue("queue_1", { database: database as never });

    expect(createEvaluationProvider).toHaveBeenCalledTimes(2);
    expect(createEvaluationProvider).toHaveBeenNthCalledWith(1, "openai");
    expect(createEvaluationProvider).toHaveBeenNthCalledWith(2, "gemini");
    expect(openAIEvaluate).toHaveBeenCalledTimes(1);
    expect(geminiEvaluate).toHaveBeenCalledTimes(1);
    expect(insertEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gemini",
        model: GEMINI_DEFAULT_MODEL,
        attachmentsUsed: true,
      }),
    );
  });
});
