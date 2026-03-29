import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnalyticsResponse,
  DeleteEvaluationsResponse,
  EvaluationRow,
  EvaluationRunSummary,
  ImportedSubmission,
  JudgeRecord,
  PromptFieldConfig,
  QuestionJudgeAssignment,
  QueueDetail,
  QueueSummary,
  ResultsResponse,
  SubmissionAttachment,
} from "../../shared/types.js";
import { buildAnalyticsResponse } from "../../shared/analytics.js";
import { defaultPromptFieldConfig as defaultJudgePromptFieldConfig } from "../../shared/types.js";
import { calculatePassRate } from "../../shared/results.js";

type QueueRow = {
  id: string;
  source_file_name: string | null;
  created_at: string;
};

type JudgeRow = {
  id: string;
  name: string;
  rubric_prompt: string;
  provider: string;
  model: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type JudgeAssignmentRow = {
  question_template_id: string;
  judge_id: string;
  prompt_field_config: PromptFieldConfig | null;
};

type SubmissionAttachmentRow = {
  id: string;
  submission_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number | null;
  created_at: string;
};

type SubmissionAttachmentInput = {
  submissionId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
};

function mapJudge(row: JudgeRow): JudgeRecord {
  return {
    id: row.id,
    name: row.name,
    rubricPrompt: row.rubric_prompt,
    provider: row.provider,
    model: row.model,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAttachment(row: SubmissionAttachmentRow): SubmissionAttachment {
  return {
    id: row.id,
    submissionId: row.submission_id,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  };
}

function must<T>(value: T | null, message: string): T {
  if (value === null) {
    throw new Error(message);
  }

  return value;
}

type EvaluationFilters = {
  judgeIds?: string[];
  questionTemplateIds?: string[];
  verdicts?: string[];
  queueId?: string;
  startAt?: string;
  endAt?: string;
};

export class Database {
  constructor(private readonly supabase: SupabaseClient) {}

  async importSubmissions(
    submissions: ImportedSubmission[],
    sourceFileName: string,
    queueOverride?: string,
  ): Promise<{ queueIds: string[]; submissionCount: number }> {
    const normalizedSubmissions = queueOverride
      ? submissions.map((submission) => ({
          ...submission,
          queueId: queueOverride,
        }))
      : submissions;
    const queueIds = [...new Set(normalizedSubmissions.map((submission) => submission.queueId))];

    for (const queueId of queueIds) {
      const { error } = await this.supabase.from("queues").upsert(
        {
          id: queueId,
          source_file_name: sourceFileName,
        },
        { onConflict: "id" },
      );

      if (error) {
        throw error;
      }
    }

    for (const submission of normalizedSubmissions) {
      const { error: submissionError } = await this.supabase.from("submissions").upsert(
        {
          id: submission.id,
          queue_id: submission.queueId,
          labeling_task_id: submission.labelingTaskId,
          created_at_source: submission.createdAt,
        },
        { onConflict: "id" },
      );

      if (submissionError) {
        throw submissionError;
      }

      const { error: deleteQuestionsError } = await this.supabase
        .from("submission_questions")
        .delete()
        .eq("submission_id", submission.id);

      if (deleteQuestionsError) {
        throw deleteQuestionsError;
      }

      const { error: deleteAnswersError } = await this.supabase
        .from("submission_answers")
        .delete()
        .eq("submission_id", submission.id);

      if (deleteAnswersError) {
        throw deleteAnswersError;
      }

      const questionRows = submission.questions.map((question) => ({
        submission_id: submission.id,
        question_template_id: question.data.id,
        rev: question.rev,
        question_type: question.data.questionType,
        question_text: question.data.questionText,
        original_payload: question,
      }));

      if (questionRows.length > 0) {
        const { error } = await this.supabase.from("submission_questions").insert(questionRows);
        if (error) {
          throw error;
        }
      }

      const answerRows = Object.entries(submission.answers).map(([questionTemplateId, answer]) => ({
        submission_id: submission.id,
        question_template_id: questionTemplateId,
        answer_payload: answer,
      }));

      if (answerRows.length > 0) {
        const { error } = await this.supabase.from("submission_answers").insert(answerRows);
        if (error) {
          throw error;
        }
      }
    }

    return { queueIds, submissionCount: normalizedSubmissions.length };
  }

  async listQueues(): Promise<QueueSummary[]> {
    const { data, error } = await this.supabase.rpc("list_queue_summaries");
    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      sourceFileName: (row.source_file_name as string | null) ?? null,
      submissionCount: Number(row.submission_count ?? 0),
      distinctQuestionCount: Number(row.distinct_question_count ?? 0),
      assignmentCount: Number(row.assignment_count ?? 0),
      lastRunAt: (row.last_run_at as string | null) ?? null,
    }));
  }

  async getQueueDetail(queueId: string): Promise<QueueDetail> {
    const [queueResult, questionResult, assignmentResult, submissionResult, answerResult, attachmentResult] =
      await Promise.all([
        this.supabase.from("queues").select("*").eq("id", queueId).single<QueueRow>(),
        this.supabase
          .from("submission_questions")
          .select("question_template_id, question_text, question_type, submissions!inner(queue_id)")
          .eq("submissions.queue_id", queueId),
        this.supabase
          .from("judge_assignments")
          .select("question_template_id, judge_id, prompt_field_config")
          .eq("queue_id", queueId),
        this.supabase
          .from("submissions")
          .select("id, created_at_source, labeling_task_id, has_attachments")
          .eq("queue_id", queueId)
          .order("created_at_source", { ascending: false }),
        this.supabase
          .from("submission_answers")
          .select("submission_id, question_template_id, answer_payload, submissions!inner(queue_id)")
          .eq("submissions.queue_id", queueId),
        this.supabase
          .from("submission_attachments")
          .select("id, submission_id, file_name, storage_path, mime_type, file_size, created_at, submissions!inner(queue_id)")
          .eq("submissions.queue_id", queueId),
      ]);

    if (queueResult.error) {
      throw queueResult.error;
    }
    if (questionResult.error) {
      throw questionResult.error;
    }
    if (assignmentResult.error) {
      throw assignmentResult.error;
    }
    if (submissionResult.error) {
      throw submissionResult.error;
    }
    if (answerResult.error) {
      throw answerResult.error;
    }
    if (attachmentResult.error) {
      throw attachmentResult.error;
    }

    const queue = must(
      (await this.listQueues()).find((summary) => summary.id === queueId) ?? null,
      `Queue ${queueId} not found`,
    );

    const questionMap = new Map<string, { questionText: string; questionType: string }>();
    for (const row of questionResult.data ?? []) {
      const questionTemplateId = String(row.question_template_id);
      if (!questionMap.has(questionTemplateId)) {
        questionMap.set(questionTemplateId, {
          questionText: String(row.question_text),
          questionType: String(row.question_type),
        });
      }
    }

    const assignments: Record<string, QuestionJudgeAssignment[]> = {};
    for (const row of (assignmentResult.data ?? []) as JudgeAssignmentRow[]) {
      const questionTemplateId = String(row.question_template_id);
      assignments[questionTemplateId] ??= [];
      assignments[questionTemplateId].push({
        judgeId: String(row.judge_id),
        promptFieldConfig: { ...defaultJudgePromptFieldConfig, ...(row.prompt_field_config ?? {}) },
      });
    }

    const answersBySubmission = new Map<string, Array<{ questionTemplateId: string; answer: unknown }>>();
    for (const row of answerResult.data ?? []) {
      const submissionId = String(row.submission_id);
      answersBySubmission.set(submissionId, [
        ...(answersBySubmission.get(submissionId) ?? []),
        {
          questionTemplateId: String(row.question_template_id),
          answer: row.answer_payload,
        },
      ]);
    }

    const attachmentsBySubmission = new Map<string, SubmissionAttachment[]>();
    for (const row of attachmentResult.data ?? []) {
      const submissionId = String(row.submission_id);
      attachmentsBySubmission.set(submissionId, [
        ...(attachmentsBySubmission.get(submissionId) ?? []),
        mapAttachment(row as SubmissionAttachmentRow),
      ]);
    }

    return {
      queue,
      questions: [...questionMap.entries()].map(([questionTemplateId, value]) => ({
        questionTemplateId,
        questionText: value.questionText,
        questionType: value.questionType,
      })),
      assignments,
      submissions: (submissionResult.data ?? []).map((submission) => ({
        id: String(submission.id),
        createdAtSource: Number(submission.created_at_source),
        labelingTaskId: (submission.labeling_task_id as string | null) ?? null,
        hasAttachments: Boolean(submission.has_attachments),
        attachments: attachmentsBySubmission.get(String(submission.id)) ?? [],
        answers: answersBySubmission.get(String(submission.id)) ?? [],
      })),
    };
  }

  async submissionExists(submissionId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("submissions").select("id").eq("id", submissionId).maybeSingle<{ id: string }>();
    if (error) {
      throw error;
    }

    return data !== null;
  }

  async addSubmissionAttachments(attachments: SubmissionAttachmentInput[]): Promise<{ uploadedCount: number }> {
    if (attachments.length === 0) {
      return { uploadedCount: 0 };
    }

    const rows = attachments.map((attachment) => ({
      submission_id: attachment.submissionId,
      file_name: attachment.fileName,
      storage_path: attachment.storagePath,
      mime_type: attachment.mimeType,
      file_size: attachment.fileSize,
    }));

    const { error: insertError } = await this.supabase.from("submission_attachments").insert(rows);
    if (insertError) {
      throw insertError;
    }

    const submissionIds = [...new Set(attachments.map((attachment) => attachment.submissionId))];
    const { error: updateError } = await this.supabase
      .from("submissions")
      .update({ has_attachments: true })
      .in("id", submissionIds);
    if (updateError) {
      throw updateError;
    }

    return { uploadedCount: attachments.length };
  }

  async listJudges(): Promise<JudgeRecord[]> {
    const { data, error } = await this.supabase.from("judges").select("*").order("updated_at", { ascending: false });
    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapJudge(row as JudgeRow));
  }

  async createJudge(input: {
    name: string;
    rubricPrompt: string;
    provider: string;
    model: string;
    active: boolean;
  }): Promise<JudgeRecord> {
    const { data, error } = await this.supabase
      .from("judges")
      .insert({
        name: input.name,
        rubric_prompt: input.rubricPrompt,
        provider: input.provider,
        model: input.model,
        active: input.active,
      })
      .select("*")
      .single<JudgeRow>();

    if (error) {
      throw error;
    }

    return mapJudge(data);
  }

  async updateJudge(
    judgeId: string,
    input: Partial<{
      name: string;
      rubricPrompt: string;
      provider: string;
      model: string;
      active: boolean;
    }>,
  ): Promise<JudgeRecord> {
    const updatePayload: Record<string, unknown> = {};

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.rubricPrompt !== undefined) updatePayload.rubric_prompt = input.rubricPrompt;
    if (input.provider !== undefined) updatePayload.provider = input.provider;
    if (input.model !== undefined) updatePayload.model = input.model;
    if (input.active !== undefined) updatePayload.active = input.active;

    const { data, error } = await this.supabase
      .from("judges")
      .update(updatePayload)
      .eq("id", judgeId)
      .select("*")
      .single<JudgeRow>();

    if (error) {
      throw error;
    }

    return mapJudge(data);
  }

  async replaceAssignments(
    queueId: string,
    assignments: Array<{ questionTemplateId: string; assignments: QuestionJudgeAssignment[] }>,
  ): Promise<void> {
    const { error: deleteError } = await this.supabase.from("judge_assignments").delete().eq("queue_id", queueId);
    if (deleteError) {
      throw deleteError;
    }

    const rows = assignments.flatMap((assignment) =>
      assignment.assignments.map((judgeAssignment) => ({
        queue_id: queueId,
        question_template_id: assignment.questionTemplateId,
        judge_id: judgeAssignment.judgeId,
        prompt_field_config: judgeAssignment.promptFieldConfig,
      })),
    );

    if (rows.length === 0) {
      return;
    }

    const { error: insertError } = await this.supabase.from("judge_assignments").insert(rows);
    if (insertError) {
      throw insertError;
    }
  }

  async createRun(queueId: string, plannedCount: number): Promise<string> {
    const { data, error } = await this.supabase
      .from("evaluation_runs")
      .insert({
        queue_id: queueId,
        status: "running",
        planned_count: plannedCount,
        completed_count: 0,
        failed_count: 0,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw error;
    }

    return data.id;
  }

  async finishRun(runId: string, summary: Omit<EvaluationRunSummary, "runId">): Promise<void> {
    const { error } = await this.supabase
      .from("evaluation_runs")
      .update({
        status: summary.status,
        completed_count: summary.completedCount,
        failed_count: summary.failedCount,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    if (error) {
      throw error;
    }
  }

  async getRunContext(queueId: string): Promise<{
    queue: QueueRow;
    assignments: Array<{
      questionTemplateId: string;
      judge: JudgeRecord;
      promptFieldConfig: PromptFieldConfig;
    }>;
    submissions: Array<{
      submissionId: string;
      labelingTaskId: string | null;
      questionTemplateId: string;
      questionText: string;
      questionType: string;
      answer: unknown;
      attachments: SubmissionAttachment[];
    }>;
  }> {
    const [queueResult, assignmentResult, judgesResult, questionsResult, answersResult, submissionsResult, attachmentResult] =
      await Promise.all([
        this.supabase.from("queues").select("*").eq("id", queueId).single<QueueRow>(),
        this.supabase
          .from("judge_assignments")
          .select("question_template_id, judge_id, prompt_field_config")
          .eq("queue_id", queueId),
        this.supabase.from("judges").select("*").eq("active", true),
        this.supabase
          .from("submission_questions")
          .select("submission_id, question_template_id, question_text, question_type, submissions!inner(queue_id)")
          .eq("submissions.queue_id", queueId),
        this.supabase
          .from("submission_answers")
          .select("submission_id, question_template_id, answer_payload, submissions!inner(queue_id)")
          .eq("submissions.queue_id", queueId),
        this.supabase.from("submissions").select("id, labeling_task_id").eq("queue_id", queueId),
        this.supabase
          .from("submission_attachments")
          .select("id, submission_id, file_name, storage_path, mime_type, file_size, created_at, submissions!inner(queue_id)")
          .eq("submissions.queue_id", queueId),
      ]);

    if (queueResult.error) throw queueResult.error;
    if (assignmentResult.error) throw assignmentResult.error;
    if (judgesResult.error) throw judgesResult.error;
    if (questionsResult.error) throw questionsResult.error;
    if (answersResult.error) throw answersResult.error;
    if (submissionsResult.error) throw submissionsResult.error;
    if (attachmentResult.error) throw attachmentResult.error;

    const judgesById = new Map((judgesResult.data ?? []).map((row) => [String(row.id), mapJudge(row as JudgeRow)]));
    const assignments = ((assignmentResult.data ?? []) as JudgeAssignmentRow[])
      .map((row) => ({
        questionTemplateId: String(row.question_template_id),
        judge: judgesById.get(String(row.judge_id)),
        promptFieldConfig: { ...defaultJudgePromptFieldConfig, ...(row.prompt_field_config ?? {}) },
      }))
      .filter(
        (row): row is { questionTemplateId: string; judge: JudgeRecord; promptFieldConfig: PromptFieldConfig } =>
          row.judge !== undefined,
      );

    const questionMap = new Map<string, { questionText: string; questionType: string }>();
    for (const row of questionsResult.data ?? []) {
      questionMap.set(`${row.submission_id}:${row.question_template_id}`, {
        questionText: String(row.question_text),
        questionType: String(row.question_type),
      });
    }

    const labelingTaskMap = new Map(
      (submissionsResult.data ?? []).map((row) => [String(row.id), (row.labeling_task_id as string | null) ?? null]),
    );
    const attachmentsBySubmission = new Map<string, SubmissionAttachment[]>();
    for (const row of attachmentResult.data ?? []) {
      const submissionId = String(row.submission_id);
      attachmentsBySubmission.set(submissionId, [
        ...(attachmentsBySubmission.get(submissionId) ?? []),
        mapAttachment(row as SubmissionAttachmentRow),
      ]);
    }

    const workItems = (answersResult.data ?? []).map((row) => {
      const key = `${row.submission_id}:${row.question_template_id}`;
      const question = must(questionMap.get(key) ?? null, `Missing question payload for ${key}`);
      return {
        submissionId: String(row.submission_id),
        labelingTaskId: labelingTaskMap.get(String(row.submission_id)) ?? null,
        questionTemplateId: String(row.question_template_id),
        questionText: question.questionText,
        questionType: question.questionType,
        answer: row.answer_payload,
        attachments: attachmentsBySubmission.get(String(row.submission_id)) ?? [],
      };
    });

    return {
      queue: queueResult.data,
      assignments,
      submissions: workItems,
    };
  }

  async insertEvaluation(input: {
    runId: string;
    queueId: string;
    submissionId: string;
    questionTemplateId: string;
    judgeId: string;
    provider: string;
    model: string;
    verdict: "pass" | "fail" | "inconclusive";
    reasoning: string;
    rawResponse: unknown;
    status: "completed" | "failed";
    errorMessage: string | null;
    attachmentsUsed: boolean;
  }): Promise<void> {
    const { error } = await this.supabase.from("evaluations").insert({
      run_id: input.runId,
      queue_id: input.queueId,
      submission_id: input.submissionId,
      question_template_id: input.questionTemplateId,
      judge_id: input.judgeId,
      provider: input.provider,
      model: input.model,
      verdict: input.verdict,
      reasoning: input.reasoning,
      raw_response: input.rawResponse,
      status: input.status,
      error_message: input.errorMessage,
      attachments_used: input.attachmentsUsed,
    });

    if (error) {
      throw error;
    }
  }

  async getResults(filters: {
    judgeIds?: string[];
    questionTemplateIds?: string[];
    verdicts?: string[];
    queueId?: string;
  }): Promise<ResultsResponse> {
    const { rows, availableFilters } = await this.getEvaluationDataset(filters);

    return {
      rows,
      aggregate: calculatePassRate(rows),
      availableFilters: {
        judges: availableFilters.judges,
        questions: availableFilters.questions,
      },
    };
  }

  async getAnalytics(filters: EvaluationFilters): Promise<AnalyticsResponse> {
    const timeBucket = this.chooseTimeBucket(filters.startAt, filters.endAt);
    const { rows, availableFilters } = await this.getEvaluationDataset(filters);

    return buildAnalyticsResponse({
      rows,
      availableFilters,
      timeBucket,
    });
  }

  async deleteEvaluationById(evaluationId: string): Promise<DeleteEvaluationsResponse> {
    const { data, error } = await this.supabase.from("evaluations").delete().eq("id", evaluationId).select("id");
    if (error) {
      throw error;
    }

    return {
      deletedCount: data?.length ?? 0,
    };
  }

  async deleteEvaluations(filters: {
    judgeIds?: string[];
    questionTemplateIds?: string[];
    verdicts?: string[];
    queueId?: string;
  }): Promise<DeleteEvaluationsResponse> {
    let query = this.supabase.from("evaluations").delete();

    if (filters.queueId) {
      query = query.eq("queue_id", filters.queueId);
    }
    if (filters.judgeIds && filters.judgeIds.length > 0) {
      query = query.in("judge_id", filters.judgeIds);
    }
    if (filters.questionTemplateIds && filters.questionTemplateIds.length > 0) {
      query = query.in("question_template_id", filters.questionTemplateIds);
    }
    if (filters.verdicts && filters.verdicts.length > 0) {
      query = query.in("verdict", filters.verdicts);
    }

    const { data, error } = await query.select("id");
    if (error) {
      throw error;
    }

    return {
      deletedCount: data?.length ?? 0,
    };
  }

  private chooseTimeBucket(startAt?: string, endAt?: string): "hour" | "day" {
    if (!startAt || !endAt) {
      return "day";
    }

    const durationMs = new Date(endAt).getTime() - new Date(startAt).getTime();
    return durationMs <= 1000 * 60 * 60 * 48 ? "hour" : "day";
  }

  private async getEvaluationDataset(filters: EvaluationFilters): Promise<{
    rows: EvaluationRow[];
    availableFilters: AnalyticsResponse["availableFilters"];
  }> {
    let query = this.supabase
      .from("evaluations")
      .select(
        "id, created_at, submission_id, queue_id, question_template_id, judge_id, verdict, reasoning, status, error_message, attachments_used, judges(name)",
      )
      .order("created_at", { ascending: false });

    if (filters.queueId) {
      query = query.eq("queue_id", filters.queueId);
    }
    if (filters.judgeIds && filters.judgeIds.length > 0) {
      query = query.in("judge_id", filters.judgeIds);
    }
    if (filters.questionTemplateIds && filters.questionTemplateIds.length > 0) {
      query = query.in("question_template_id", filters.questionTemplateIds);
    }
    if (filters.verdicts && filters.verdicts.length > 0) {
      query = query.in("verdict", filters.verdicts);
    }
    if (filters.startAt) {
      query = query.gte("created_at", filters.startAt);
    }
    if (filters.endAt) {
      query = query.lte("created_at", filters.endAt);
    }

    const [resultRows, judgeRows, questionRows, queueRows] = await Promise.all([
      query,
      this.supabase.from("judges").select("id, name").order("name"),
      this.supabase.from("submission_questions").select("question_template_id, question_text"),
      this.supabase.from("queues").select("id").order("id"),
    ]);

    if (resultRows.error) throw resultRows.error;
    if (judgeRows.error) throw judgeRows.error;
    if (questionRows.error) throw questionRows.error;
    if (queueRows.error) throw queueRows.error;

    const questionTextMap = new Map<string, string>();
    for (const row of questionRows.data ?? []) {
      const key = String(row.question_template_id);
      if (!questionTextMap.has(key)) {
        questionTextMap.set(key, String(row.question_text));
      }
    }

    const rows: EvaluationRow[] = (resultRows.data ?? []).map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at),
      submissionId: String(row.submission_id),
      queueId: String(row.queue_id),
      questionTemplateId: String(row.question_template_id),
      questionText: questionTextMap.get(String(row.question_template_id)) ?? String(row.question_template_id),
      judgeId: String(row.judge_id),
      judgeName: String((row.judges as { name?: string } | null)?.name ?? "Unknown Judge"),
      verdict: row.verdict as "pass" | "fail" | "inconclusive",
      reasoning: String(row.reasoning ?? ""),
      status: row.status as "completed" | "failed",
      errorMessage: (row.error_message as string | null) ?? null,
      attachmentsUsed: Boolean(row.attachments_used),
    }));

    return {
      rows,
      availableFilters: {
        queues: (queueRows.data ?? []).map((row) => ({
          id: String(row.id),
          label: String(row.id),
        })),
        judges: (judgeRows.data ?? []).map((row) => ({
          id: String(row.id),
          name: String(row.name),
        })),
        questions: [...questionTextMap.entries()]
          .map(([id, text]) => ({ id, text }))
          .sort((left, right) => left.text.localeCompare(right.text)),
      },
    };
  }
}
