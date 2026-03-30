/**
 * Regression coverage for results pass-rate aggregation.
 */
import { describe, expect, it } from "vitest";
import { calculatePassRate } from "../src/shared/results";
import type { EvaluationRow } from "../src/shared/types";

const rows: EvaluationRow[] = [
  {
    id: "1",
    createdAt: new Date().toISOString(),
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
    attachmentsUsed: false,
  },
  {
    id: "2",
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    submissionId: "sub_3",
    queueId: "queue_1",
    questionTemplateId: "q_1",
    questionText: "Question 1",
    judgeId: "judge_1",
    judgeName: "Judge 1",
    verdict: "inconclusive",
    reasoning: "Timed out.",
    status: "failed",
    errorMessage: "timeout",
    attachmentsUsed: false,
  },
];

describe("calculatePassRate", () => {
  it("uses only completed evaluations in the aggregate", () => {
    expect(calculatePassRate(rows)).toEqual({
      passCount: 1,
      totalCount: 2,
      passRate: 50,
    });
  });
});
