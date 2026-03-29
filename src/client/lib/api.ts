import type {
  DeleteEvaluationsResponse,
  EvaluationRunSummary,
  JudgeRecord,
  QueueDetail,
  QueueSummary,
  ResultsResponse,
} from "../../shared/types";

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
    assignments: Array<{ questionTemplateId: string; judgeIds: string[] }>,
  ) =>
    request<void>(`/api/queues/${queueId}/assignments`, {
      method: "PUT",
      body: JSON.stringify({ assignments }),
    }),
  runQueue: (queueId: string) =>
    request<EvaluationRunSummary>(`/api/queues/${queueId}/run`, {
      method: "POST",
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
};
