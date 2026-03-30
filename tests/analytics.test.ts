/**
 * Regression coverage for analytics aggregation.
 */
import { describe, expect, it } from "vitest";
import { buildAnalyticsResponse } from "../src/shared/analytics";
import type { EvaluationRow } from "../src/shared/types";

const rows: EvaluationRow[] = [
  {
    id: "1",
    createdAt: "2026-03-29T10:00:00.000Z",
    submissionId: "sub_1",
    queueId: "queue_1",
    questionTemplateId: "q_1",
    questionText: "Question 1",
    judgeId: "judge_1",
    judgeName: "Judge 1",
    verdict: "pass",
    reasoning: "Looks correct.",
    status: "completed",
    errorMessage: null,
    attachmentsUsed: true,
  },
  {
    id: "2",
    createdAt: "2026-03-29T11:00:00.000Z",
    submissionId: "sub_2",
    queueId: "queue_1",
    questionTemplateId: "q_1",
    questionText: "Question 1",
    judgeId: "judge_1",
    judgeName: "Judge 1",
    verdict: "fail",
    reasoning: "Incorrect.",
    status: "completed",
    errorMessage: null,
    attachmentsUsed: false,
  },
  {
    id: "3",
    createdAt: "2026-03-29T12:00:00.000Z",
    submissionId: "sub_3",
    queueId: "queue_1",
    questionTemplateId: "q_2",
    questionText: "Question 2",
    judgeId: "judge_2",
    judgeName: "Judge 2",
    verdict: "inconclusive",
    reasoning: "Timed out.",
    status: "failed",
    errorMessage: "timeout",
    attachmentsUsed: false,
  },
];

describe("buildAnalyticsResponse", () => {
  it("builds summary and chart aggregates from evaluation rows", () => {
    const analytics = buildAnalyticsResponse({
      rows,
      timeBucket: "hour",
      availableFilters: {
        queues: [{ id: "queue_1", label: "queue_1" }],
        judges: [
          { id: "judge_1", name: "Judge 1" },
          { id: "judge_2", name: "Judge 2" },
        ],
        questions: [
          { id: "q_1", text: "Question 1" },
          { id: "q_2", text: "Question 2" },
        ],
      },
    });

    expect(analytics.summary.passRate).toBe(50);
    expect(analytics.summary.completedCount).toBe(2);
    expect(analytics.summary.failedCount).toBe(1);
    expect(analytics.summary.attachmentsUsedRate).toBe(33);
    expect(analytics.charts.passRateByJudge[0]).toMatchObject({
      judgeId: "judge_1",
      passRate: 50,
      completedCount: 2,
    });
    expect(analytics.charts.verdictDistribution).toEqual([
      { verdict: "pass", count: 1 },
      { verdict: "fail", count: 1 },
      { verdict: "inconclusive", count: 0 },
      { verdict: "failed", count: 1 },
    ]);
    expect(analytics.charts.evaluationsOverTime).toHaveLength(3);
  });
});
