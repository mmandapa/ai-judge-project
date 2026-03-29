import { z } from "zod";

export const verdictSchema = z.enum(["pass", "fail", "inconclusive"]);
export type Verdict = z.infer<typeof verdictSchema>;

export const importedQuestionSchema = z.object({
  rev: z.number(),
  data: z.object({
    id: z.string(),
    questionType: z.string(),
    questionText: z.string(),
  }),
});

export const importedSubmissionSchema = z.object({
  id: z.string(),
  queueId: z.string(),
  labelingTaskId: z.string().nullable().optional().transform((value) => value ?? null),
  createdAt: z.number(),
  questions: z.array(importedQuestionSchema),
  answers: z.record(z.string(), z.unknown()),
});

export const importedSubmissionListSchema = z.array(importedSubmissionSchema);

export type ImportedSubmission = z.infer<typeof importedSubmissionSchema>;
export type ImportedQuestion = z.infer<typeof importedQuestionSchema>;

export type JudgeRecord = {
  id: string;
  name: string;
  rubricPrompt: string;
  provider: string;
  model: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QueueSummary = {
  id: string;
  sourceFileName: string | null;
  submissionCount: number;
  distinctQuestionCount: number;
  assignmentCount: number;
  lastRunAt: string | null;
};

export type QueueQuestionTemplate = {
  questionTemplateId: string;
  questionText: string;
  questionType: string;
};

export type SubmissionSummary = {
  id: string;
  createdAtSource: number;
  labelingTaskId: string | null;
  answers: Array<{
    questionTemplateId: string;
    answer: unknown;
  }>;
};

export type QueueDetail = {
  queue: QueueSummary;
  questions: QueueQuestionTemplate[];
  assignments: Record<string, string[]>;
  submissions: SubmissionSummary[];
};

export type EvaluationRow = {
  id: string;
  createdAt: string;
  submissionId: string;
  queueId: string;
  questionTemplateId: string;
  questionText: string;
  judgeId: string;
  judgeName: string;
  verdict: Verdict;
  reasoning: string;
  status: "completed" | "failed";
  errorMessage: string | null;
};

export type ResultsResponse = {
  rows: EvaluationRow[];
  aggregate: {
    passCount: number;
    totalCount: number;
    passRate: number;
  };
  availableFilters: {
    judges: Array<{ id: string; name: string }>;
    questions: Array<{ id: string; text: string }>;
  };
};

export type DeleteEvaluationsResponse = {
  deletedCount: number;
};

export type EvaluationRunSummary = {
  runId: string;
  status: "completed" | "completed_with_failures" | "failed";
  plannedCount: number;
  completedCount: number;
  failedCount: number;
};

export const evaluationOutputSchema = z.object({
  verdict: verdictSchema,
  reasoning: z.string().min(1).max(500),
});

export type EvaluationOutput = z.infer<typeof evaluationOutputSchema>;
