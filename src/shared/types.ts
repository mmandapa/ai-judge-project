/**
 * Shared schemas and TypeScript types used across the client, server, and
 * tests.
 */
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

export const importTargetModeSchema = z.enum(["new", "existing"]);
export type ImportTargetMode = z.infer<typeof importTargetModeSchema>;

export type BatchImportEntry = {
  sourceFileName: string;
  targetMode: ImportTargetMode;
  targetQueueId: string;
  submissions: ImportedSubmission[];
};

export type BatchImportResult = {
  queueIds: string[];
  submissionCount: number;
  entryCount: number;
};

export const promptFieldConfigSchema = z.object({
  includeQuestionText: z.boolean(),
  includeQuestionType: z.boolean(),
  includeAnswer: z.boolean(),
  includeSubmissionId: z.boolean(),
  includeLabelingTaskId: z.boolean(),
  includeAttachments: z.boolean(),
});

export type PromptFieldConfig = z.infer<typeof promptFieldConfigSchema>;

export const defaultPromptFieldConfig: PromptFieldConfig = {
  includeQuestionText: true,
  includeQuestionType: true,
  includeAnswer: true,
  includeSubmissionId: true,
  includeLabelingTaskId: true,
  includeAttachments: true,
};

export type SubmissionAttachment = {
  id: string;
  submissionId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number | null;
  createdAt: string;
};

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

export type QuestionJudgeAssignment = {
  judgeId: string;
  promptFieldConfig: PromptFieldConfig;
};

export type PromptPreviewData = {
  system: string;
  user: string;
  attachmentsIncluded: boolean;
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
  hasAttachments: boolean;
  attachments: SubmissionAttachment[];
  answers: Array<{
    questionTemplateId: string;
    answer: unknown;
  }>;
};

export type QueueDetail = {
  queue: QueueSummary;
  questions: QueueQuestionTemplate[];
  assignments: Record<string, QuestionJudgeAssignment[]>;
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
  attachmentsUsed: boolean;
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

export type AnalyticsSummary = {
  passRate: number;
  passCount: number;
  completedCount: number;
  failedCount: number;
  inconclusiveCount: number;
  attachmentsUsedCount: number;
  attachmentsUsedRate: number;
  lastCreatedAt: string | null;
};

export type AnalyticsJudgeDatum = {
  judgeId: string;
  judgeName: string;
  passRate: number;
  passCount: number;
  completedCount: number;
  failedCount: number;
};

export type AnalyticsQuestionDatum = {
  questionTemplateId: string;
  questionText: string;
  passRate: number;
  passCount: number;
  completedCount: number;
  failedCount: number;
};

export type AnalyticsVerdictDatum = {
  verdict: "pass" | "fail" | "inconclusive" | "failed";
  count: number;
};

export type AnalyticsTimeSeriesDatum = {
  bucket: string;
  label: string;
  passCount: number;
  failCount: number;
  inconclusiveCount: number;
  failedCount: number;
  completedCount: number;
  passRate: number;
};

export type AnalyticsResponse = {
  summary: AnalyticsSummary;
  charts: {
    passRateByJudge: AnalyticsJudgeDatum[];
    passRateByQuestion: AnalyticsQuestionDatum[];
    verdictDistribution: AnalyticsVerdictDatum[];
    evaluationsOverTime: AnalyticsTimeSeriesDatum[];
  };
  availableFilters: {
    queues: Array<{ id: string; label: string }>;
    judges: Array<{ id: string; name: string }>;
    questions: Array<{ id: string; text: string }>;
  };
  timeBucket: "hour" | "day";
};

export type DeleteEvaluationsResponse = {
  deletedCount: number;
};

export type DeleteJudgeResponse = {
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
