import type { EvaluationRunSummary } from "../../shared/types.js";
import type { Database } from "./database.js";
import { createEvaluationProvider } from "../providers/index.js";
import type { EvaluationProvider } from "../providers/types.js";

type RunDependencies = {
  database: Database;
};

export async function runEvaluationsForQueue(
  queueId: string,
  { database }: RunDependencies,
  options?: { questionTemplateIds?: string[] },
): Promise<EvaluationRunSummary> {
  const context = await database.getRunContext(queueId);
  const selectedQuestionIds = new Set(options?.questionTemplateIds?.filter(Boolean) ?? []);

  if (context.assignments.length === 0) {
    throw new Error("No judge assignments are saved for this queue.");
  }

  const workItems = context.submissions.flatMap((submission) =>
    context.assignments
      .filter((assignment) => selectedQuestionIds.size === 0 || selectedQuestionIds.has(assignment.questionTemplateId))
      .filter((assignment) => assignment.questionTemplateId === submission.questionTemplateId)
      .map((assignment) => ({
        ...submission,
        judge: assignment.judge,
        promptFieldConfig: assignment.promptFieldConfig,
      })),
  );

  if (workItems.length === 0) {
    throw new Error(
      selectedQuestionIds.size > 0
        ? "No evaluation work items were generated for the selected questions."
        : "No evaluation work items were generated for this queue.",
    );
  }

  const runId = await database.createRun(queueId, workItems.length);
  const providers = new Map<string, EvaluationProvider>();

  let completedCount = 0;
  let failedCount = 0;
  const concurrency = 4;

  for (let index = 0; index < workItems.length; index += concurrency) {
    const batch = workItems.slice(index, index + concurrency);
    await Promise.all(
      batch.map(async (item) => {
        try {
          const provider = providers.get(item.judge.provider) ?? createEvaluationProvider(item.judge.provider);
          providers.set(item.judge.provider, provider);

          const evaluation = await provider.evaluate({
            judge: item.judge,
            promptFieldConfig: item.promptFieldConfig,
            questionText: item.questionText,
            questionType: item.questionType,
            answer: item.answer,
            submissionId: item.submissionId,
            labelingTaskId: item.labelingTaskId,
            attachments: item.attachments,
          });

          await database.insertEvaluation({
            runId,
            queueId,
            submissionId: item.submissionId,
            questionTemplateId: item.questionTemplateId,
            judgeId: item.judge.id,
            provider: item.judge.provider,
            model: item.judge.model,
            verdict: evaluation.verdict,
            reasoning: evaluation.reasoning,
            rawResponse: evaluation.rawResponse,
            status: "completed",
            errorMessage: null,
            attachmentsUsed: evaluation.attachmentsUsed,
          });
          completedCount += 1;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown evaluation error";
          await database.insertEvaluation({
            runId,
            queueId,
            submissionId: item.submissionId,
            questionTemplateId: item.questionTemplateId,
            judgeId: item.judge.id,
            provider: item.judge.provider,
            model: item.judge.model,
            verdict: "inconclusive",
            reasoning: "Evaluation failed before a verdict was produced.",
            rawResponse: null,
            status: "failed",
            errorMessage,
            attachmentsUsed: false,
          });
          failedCount += 1;
        }
      }),
    );
  }

  const summary: EvaluationRunSummary = {
    runId,
    status: failedCount > 0 ? "completed_with_failures" : "completed",
    plannedCount: workItems.length,
    completedCount,
    failedCount,
  };

  await database.finishRun(runId, {
    status: summary.status,
    plannedCount: summary.plannedCount,
    completedCount: summary.completedCount,
    failedCount: summary.failedCount,
  });

  return summary;
}
