import type {
  AnalyticsResponse,
  BatchImportEntry,
  BatchImportResult,
  DeleteEvaluationsResponse,
  EvaluationRunSummary,
  ImportedSubmission,
  JudgeRecord,
  PromptFieldConfig,
  PromptPreviewData,
  QuestionJudgeAssignment,
  QueueDetail,
  QueueSummary,
  ResultsResponse,
} from "../../shared/types";
import { buildPromptPreview } from "../../shared/prompt";
import { defaultPromptFieldConfig } from "../../shared/types";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listQueues: () => request<QueueSummary[]>("/api/queues"),
  getQueue: (queueId: string) => request<QueueDetail>(`/api/queues/${queueId}`),
  listJudges: () => request<JudgeRecord[]>("/api/judges"),
  createJudge: (payload: Omit<JudgeRecord, "id" | "createdAt" | "updatedAt">) =>
    request<JudgeRecord>("/api/judges", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateJudge: (
    judgeId: string,
    payload: Partial<Omit<JudgeRecord, "id" | "createdAt" | "updatedAt">>,
  ) =>
    request<JudgeRecord>(`/api/judges/${judgeId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  replaceAssignments: (
    queueId: string,
    assignments: Array<{ questionTemplateId: string; assignments: QuestionJudgeAssignment[] }>,
  ) =>
    request<void>(`/api/queues/${queueId}/assignments`, {
      method: "PUT",
      body: JSON.stringify({ assignments }),
    }),
  runQueue: (queueId: string, questionTemplateIds?: string[]) =>
    request<EvaluationRunSummary>(`/api/queues/${queueId}/run`, {
      method: "POST",
      body: JSON.stringify(questionTemplateIds?.length ? { questionTemplateIds } : {}),
    }),
  getResults: (filters: {
    judgeIds?: string[];
    questionTemplateIds?: string[];
    verdicts?: string[];
    queueId?: string;
  }) => {
    const search = new URLSearchParams();
    if (filters.judgeIds?.length) search.set("judgeIds", filters.judgeIds.join(","));
    if (filters.questionTemplateIds?.length) {
      search.set("questionTemplateIds", filters.questionTemplateIds.join(","));
    }
    if (filters.verdicts?.length) search.set("verdicts", filters.verdicts.join(","));
    if (filters.queueId) search.set("queueId", filters.queueId);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<ResultsResponse>(`/api/results${suffix}`);
  },
  getAnalytics: (filters: {
    queueId?: string;
    judgeIds?: string[];
    questionTemplateIds?: string[];
    verdicts?: string[];
    startAt?: string;
    endAt?: string;
  }) => {
    const search = new URLSearchParams();
    if (filters.queueId) search.set("queueId", filters.queueId);
    if (filters.judgeIds?.length) search.set("judgeIds", filters.judgeIds.join(","));
    if (filters.questionTemplateIds?.length) search.set("questionTemplateIds", filters.questionTemplateIds.join(","));
    if (filters.verdicts?.length) search.set("verdicts", filters.verdicts.join(","));
    if (filters.startAt) search.set("startAt", filters.startAt);
    if (filters.endAt) search.set("endAt", filters.endAt);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<AnalyticsResponse>(`/api/analytics${suffix}`);
  },
  deleteEvaluation: (evaluationId: string) =>
    request<DeleteEvaluationsResponse>(`/api/results/${evaluationId}`, {
      method: "DELETE",
    }),
  deleteVisibleEvaluations: (filters: {
    judgeIds?: string[];
    questionTemplateIds?: string[];
    verdicts?: string[];
    queueId?: string;
  }) => {
    const search = new URLSearchParams();
    if (filters.judgeIds?.length) search.set("judgeIds", filters.judgeIds.join(","));
    if (filters.questionTemplateIds?.length) {
      search.set("questionTemplateIds", filters.questionTemplateIds.join(","));
    }
    if (filters.verdicts?.length) search.set("verdicts", filters.verdicts.join(","));
    if (filters.queueId) search.set("queueId", filters.queueId);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<DeleteEvaluationsResponse>(`/api/results${suffix}`, {
      method: "DELETE",
    });
  },
  importSubmissions: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/import-submissions", {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? `Import failed: ${response.status}`);
    }

    return (await response.json()) as { queueIds: string[]; submissionCount: number };
  },
  importBatch: (entries: BatchImportEntry[]) =>
    request<BatchImportResult>("/api/import-batch", {
      method: "POST",
      body: JSON.stringify({ entries }),
    }),
  appendSubmissionsToQueue: async (queueId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/queues/${queueId}/import-submissions`, {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? `Queue import failed: ${response.status}`);
    }

    return (await response.json()) as { queueIds: string[]; submissionCount: number };
  },
  uploadSubmissionAttachments: async (submissionId: string, attachments: File[]) => {
    const body = new FormData();
    body.append("submissionId", submissionId);
    for (const attachment of attachments) {
      body.append("attachments", attachment);
    }

    const response = await fetch(`/api/submissions/${submissionId}/attachments`, {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? `Attachment upload failed: ${response.status}`);
    }

    return (await response.json()) as { uploadedCount: number };
  },
  buildPromptPreview: (input: {
    rubricPrompt: string;
    promptFieldConfig: PromptFieldConfig;
    submissionId?: string;
    labelingTaskId?: string | null;
    questionType?: string;
    questionText?: string;
    answer?: unknown;
    attachments?: Array<{
      id: string;
      submissionId: string;
      fileName: string;
      storagePath: string;
      mimeType: string;
      fileSize: number | null;
      createdAt: string;
    }>;
  }): PromptPreviewData =>
    buildPromptPreview({
      rubricPrompt: input.rubricPrompt,
      promptFieldConfig: input.promptFieldConfig ?? defaultPromptFieldConfig,
      submissionId: input.submissionId ?? "preview_submission",
      labelingTaskId: input.labelingTaskId ?? "preview_task",
      questionType: input.questionType ?? "single_choice_with_reasoning",
      questionText: input.questionText ?? "Is the sky blue?",
      answer: input.answer ?? {
        choice: "yes",
        reasoning: "Observed on a clear day.",
      },
      attachments: input.attachments ?? [
        {
          id: "preview-attachment",
          submissionId: "preview_submission",
          fileName: "screenshot.png",
          storagePath: "preview/screenshot.png",
          mimeType: "image/png",
          fileSize: 1024,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
};

export type PendingSubmissionAttachment = {
  id: string;
  file: File;
  submissionId: string;
};

export function buildAttachmentId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export function buildSubmissionOptionLabel(submission: ImportedSubmission) {
  return `${submission.id}${submission.labelingTaskId ? ` • Task ${submission.labelingTaskId}` : ""}${submission.queueId ? ` • Queue ${submission.queueId}` : ""}`;
}
