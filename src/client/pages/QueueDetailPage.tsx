import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import type { ImportedSubmission, JudgeRecord, PromptFieldConfig, QueueDetail, QuestionJudgeAssignment } from "../../shared/types";
import { buildAnswerPreview, coerceImportedSubmissionsToQueue, parseImportedSubmissions } from "../../shared/parser";
import { defaultPromptFieldConfig } from "../../shared/types";
import { Card } from "../components/Card";
import { MultiSelectChips } from "../components/MultiSelectChips";
import { api, buildAttachmentId, buildSubmissionOptionLabel, type PendingSubmissionAttachment } from "../lib/api";

const promptFieldLabels: Array<{ key: keyof PromptFieldConfig; label: string; description: string }> = [
  { key: "includeQuestionText", label: "Question text", description: "Send the exact question wording." },
  { key: "includeQuestionType", label: "Question type", description: "Send the question type label." },
  { key: "includeAnswer", label: "Answer", description: "Send the submitted answer payload." },
  { key: "includeSubmissionId", label: "Submission ID", description: "Send the submission identifier." },
  { key: "includeLabelingTaskId", label: "Task ID", description: "Send the upstream task ID when present." },
  { key: "includeAttachments", label: "Attachments", description: "Forward screenshots and PDFs when available." },
];

export function QueueDetailPage() {
  const { queueId = "" } = useParams();
  const [detail, setDetail] = useState<QueueDetail | null>(null);
  const [judges, setJudges] = useState<JudgeRecord[]>([]);
  const [draftAssignments, setDraftAssignments] = useState<Record<string, QuestionJudgeAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [running, setRunning] = useState(false);
  const [uploadingSubmissionId, setUploadingSubmissionId] = useState<string | null>(null);
  const [attachmentMessages, setAttachmentMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [appendJsonFile, setAppendJsonFile] = useState<File | null>(null);
  const [appendParsedSubmissions, setAppendParsedSubmissions] = useState<ImportedSubmission[]>([]);
  const [appendPendingAttachments, setAppendPendingAttachments] = useState<PendingSubmissionAttachment[]>([]);
  const [appending, setAppending] = useState(false);
  const [appendSummary, setAppendSummary] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);
      const [queueDetail, judgeList] = await Promise.all([api.getQueue(queueId), api.listJudges()]);
      setDetail(queueDetail);
      setJudges(judgeList);
      setDraftAssignments(queueDetail.assignments);
      setSelectedQuestionIds(queueDetail.questions.map((question) => question.questionTemplateId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [queueId]);

  const activeJudgeOptions = useMemo(
    () => judges.filter((judge) => judge.active).map((judge) => ({ id: judge.id, label: judge.name })),
    [judges],
  );

  const judgesById = useMemo(() => new Map(judges.map((judge) => [judge.id, judge])), [judges]);

  const appendSubmissionOptions = useMemo(
    () =>
      appendParsedSubmissions.map((submission) => ({
        id: submission.id,
        label: buildSubmissionOptionLabel(submission),
      })),
    [appendParsedSubmissions],
  );

  const canAppend = appendJsonFile !== null && appendPendingAttachments.every((attachment) => attachment.submissionId);

  const totalAssignedJudges = useMemo(
    () => Object.values(draftAssignments).reduce((count, assignments) => count + assignments.length, 0),
    [draftAssignments],
  );

  const sampleSubmissionByQuestion = useMemo(() => {
    const map = new Map<string, QueueDetail["submissions"][number]>();
    for (const submission of detail?.submissions ?? []) {
      for (const answer of submission.answers) {
        if (!map.has(answer.questionTemplateId)) {
          map.set(answer.questionTemplateId, submission);
        }
      }
    }
    return map;
  }, [detail?.submissions]);

  async function saveAssignments() {
    if (!detail) {
      return;
    }

    await api.replaceAssignments(
      queueId,
      detail.questions.map((question) => ({
        questionTemplateId: question.questionTemplateId,
        assignments: draftAssignments[question.questionTemplateId] ?? [],
      })),
    );
  }

  async function handleSaveAssignments() {
    try {
      setSavingAssignments(true);
      setError(null);
      await saveAssignments();
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save queue setup");
    } finally {
      setSavingAssignments(false);
    }
  }

  async function handleRun() {
    if (!detail) {
      return;
    }

    if (selectedQuestionIds.length === 0) {
      setError("Select at least one question to run.");
      return;
    }

    if (totalAssignedJudges === 0) {
      setError("Assign at least one judge before running evaluations.");
      return;
    }

    try {
      setRunning(true);
      setError(null);
      await saveAssignments();
      const result = await api.runQueue(queueId, selectedQuestionIds);
      setRunSummary(
        `Run finished: ${result.completedCount} completed, ${result.failedCount} failed out of ${result.plannedCount} planned.`,
      );
      await loadPage();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run judges");
    } finally {
      setRunning(false);
    }
  }

  async function handleAppendJsonChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = parseImportedSubmissions(raw);
      const normalized = coerceImportedSubmissionsToQueue(parsed, queueId);
      setAppendJsonFile(file);
      setAppendParsedSubmissions(normalized);
      setAppendPendingAttachments([]);
      setAppendSummary(null);
      setError(null);
    } catch (parseError) {
      setAppendJsonFile(null);
      setAppendParsedSubmissions([]);
      setAppendPendingAttachments([]);
      setError(parseError instanceof Error ? parseError.message : "Failed to parse queue JSON file");
    }
  }

  function handleAppendAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const defaultSubmissionId = appendParsedSubmissions.length === 1 ? appendParsedSubmissions[0]?.id ?? "" : "";
    setAppendPendingAttachments((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: buildAttachmentId(file, current.length + index),
        file,
        submissionId: defaultSubmissionId,
      })),
    ]);
    setAppendSummary(null);
    setError(null);
  }

  async function handleAppendSubmissions() {
    if (!appendJsonFile) {
      setError("Choose a JSON file before appending submissions.");
      return;
    }
    if (!canAppend) {
      setError("Assign each new attachment to a submission before appending.");
      return;
    }

    try {
      setAppending(true);
      setError(null);
      setAppendSummary(null);
      const result = await api.appendSubmissionsToQueue(queueId, appendJsonFile);
      const groupedAttachments = new Map<string, File[]>();
      for (const attachment of appendPendingAttachments) {
        groupedAttachments.set(attachment.submissionId, [
          ...(groupedAttachments.get(attachment.submissionId) ?? []),
          attachment.file,
        ]);
      }

      let uploadedCount = 0;
      for (const [submissionId, files] of groupedAttachments.entries()) {
        const uploadResult = await api.uploadSubmissionAttachments(submissionId, files);
        uploadedCount += uploadResult.uploadedCount;
      }

      setAppendSummary(
        `Added ${result.submissionCount} submission${result.submissionCount === 1 ? "" : "s"} to ${queueId}${uploadedCount > 0 ? ` and uploaded ${uploadedCount} attachment${uploadedCount === 1 ? "" : "s"}` : ""}.`,
      );
      setAppendJsonFile(null);
      setAppendParsedSubmissions([]);
      setAppendPendingAttachments([]);
      await loadPage();
    } catch (appendError) {
      setError(appendError instanceof Error ? appendError.message : "Failed to append submissions");
    } finally {
      setAppending(false);
    }
  }

  function setSelectedJudges(questionTemplateId: string, judgeIds: string[]) {
    const existingByJudgeId = new Map((draftAssignments[questionTemplateId] ?? []).map((assignment) => [assignment.judgeId, assignment]));
    setDraftAssignments((current) => ({
      ...current,
      [questionTemplateId]: judgeIds.map((judgeId) => existingByJudgeId.get(judgeId) ?? {
        judgeId,
        promptFieldConfig: { ...defaultPromptFieldConfig },
      }),
    }));
  }

  function updatePromptField(questionTemplateId: string, judgeId: string, key: keyof PromptFieldConfig, value: boolean) {
    setDraftAssignments((current) => ({
      ...current,
      [questionTemplateId]: (current[questionTemplateId] ?? []).map((assignment) =>
        assignment.judgeId === judgeId
          ? {
              ...assignment,
              promptFieldConfig: {
                ...assignment.promptFieldConfig,
                [key]: value,
              },
            }
          : assignment,
      ),
    }));
  }

  async function handleAttachmentChange(submissionId: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    try {
      setUploadingSubmissionId(submissionId);
      setError(null);
      setAttachmentMessages((current) => ({ ...current, [submissionId]: "" }));
      const result = await api.uploadSubmissionAttachments(submissionId, files);
      setAttachmentMessages((current) => ({
        ...current,
        [submissionId]: `Uploaded ${result.uploadedCount} file${result.uploadedCount === 1 ? "" : "s"}.`,
      }));
      await loadPage();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload attachments");
    } finally {
      setUploadingSubmissionId(null);
    }
  }

  if (loading) {
    return <p>Loading queue setup…</p>;
  }

  if (!detail) {
    return <p className="error">Queue not found.</p>;
  }

  return (
    <div className="stack">
      <Card
        title={`Queue setup: ${detail.queue.id}`}
        actions={
          <div className="actions">
            <button className="button" onClick={handleSaveAssignments} disabled={savingAssignments}>
              {savingAssignments ? "Saving..." : "Save setup"}
            </button>
            <button className="button button-primary" onClick={handleRun} disabled={running}>
              {running ? "Running..." : "Run queue"}
            </button>
          </div>
        }
      >
        <div className="stats">
          <div>
            <strong>{detail.queue.submissionCount}</strong>
            <span>Submissions</span>
          </div>
          <div>
            <strong>{detail.queue.distinctQuestionCount}</strong>
            <span>Questions</span>
          </div>
          <div>
            <strong>{totalAssignedJudges}</strong>
            <span>Judge assignments</span>
          </div>
        </div>
        <p className="table-subtext">
          Finish setup here: verify submissions, assign one or more judges to each question, choose what context each
          judge sees, then run the queue.
        </p>
        <div className="actions">
          <Link className="button" to={`/judges?returnTo=${encodeURIComponent(`/queues/${detail.queue.id}`)}`}>
            Create or edit judges
          </Link>
          <Link to="/results">View results</Link>
        </div>
        {runSummary ? <p className="success">{runSummary}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </Card>

      <Card
        title="1. Add submissions"
        actions={
          <button className="button button-primary" onClick={() => void handleAppendSubmissions()} disabled={appending || !canAppend}>
            {appending ? "Adding..." : appendJsonFile ? "Add to this queue" : "Choose JSON first"}
          </button>
        }
      >
        <div className="stack">
          <p className="table-subtext">
            Upload another JSON file to append more submissions into this queue. If the file contains a different queue ID,
            it will be added to <strong>{queueId}</strong> here.
          </p>
          <div className="actions">
            <label className="button">
              {appendJsonFile ? `JSON selected: ${appendJsonFile.name}` : "Choose JSON"}
              <input type="file" accept="application/json" hidden disabled={appending} onChange={handleAppendJsonChange} />
            </label>
            <label className="button">
              {appendPendingAttachments.length > 0
                ? `${appendPendingAttachments.length} attachment${appendPendingAttachments.length === 1 ? "" : "s"} selected`
                : "Add attachments"}
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                hidden
                disabled={appending || appendParsedSubmissions.length === 0}
                onChange={handleAppendAttachmentSelection}
              />
            </label>
          </div>
          {appendParsedSubmissions.length > 0 ? (
            <div className="preview-block">
              <strong>Submissions to append</strong>
              <div className="stack preview-content-list">
                {appendSubmissionOptions.map((submission) => (
                  <div key={submission.id}>{submission.label}</div>
                ))}
              </div>
            </div>
          ) : null}
          {appendPendingAttachments.length > 0 ? (
            <div className="stack">
              <strong>Attachment mapping</strong>
              {appendPendingAttachments.map((attachment) => (
                <div key={attachment.id} className="attachment-mapping-row">
                  <div>
                    <strong>{attachment.file.name}</strong>
                    <div className="table-subtext">{Math.round(attachment.file.size / 1024)} KB</div>
                  </div>
                  <label className="field">
                    <span>Attach to submission</span>
                    <select
                      value={attachment.submissionId}
                      onChange={(event) =>
                        setAppendPendingAttachments((current) =>
                          current.map((entry) =>
                            entry.id === attachment.id ? { ...entry, submissionId: event.target.value } : entry,
                          ),
                        )
                      }
                    >
                      <option value="">Choose submission</option>
                      {appendSubmissionOptions.map((submission) => (
                        <option key={submission.id} value={submission.id}>
                          {submission.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          ) : null}
          {appendSummary ? <p className="success">{appendSummary}</p> : null}
        </div>
      </Card>

      <Card title="2. Assign judges and choose prompt fields">
        <div className="stack">
          {detail.questions.map((question) => {
            const selectedAssignments = draftAssignments[question.questionTemplateId] ?? [];
            const selectedJudgeIds = selectedAssignments.map((assignment) => assignment.judgeId);
            const sampleSubmission = sampleSubmissionByQuestion.get(question.questionTemplateId);

            return (
              <div className="question-setup-card" key={question.questionTemplateId}>
                <div className="assignment-row">
                  <div>
                    <strong>{question.questionText}</strong>
                    <div className="table-subtext">
                      {question.questionTemplateId} • {question.questionType}
                    </div>
                  </div>
                  <div className="stack">
                    <MultiSelectChips
                      options={activeJudgeOptions}
                      selected={selectedJudgeIds}
                      onChange={(next) => setSelectedJudges(question.questionTemplateId, next)}
                    />
                    <div className="table-subtext">
                      Select one or more judges. Prompt fields below are saved per judge assignment for this question.
                    </div>
                  </div>
                </div>

                {selectedAssignments.length === 0 ? (
                  <p className="muted">No judges selected for this question yet.</p>
                ) : (
                  <div className="stack">
                    {selectedAssignments.map((assignment) => {
                      const judge = judgesById.get(assignment.judgeId);
                      const preview = api.buildPromptPreview({
                        rubricPrompt: judge?.rubricPrompt ?? "",
                        promptFieldConfig: assignment.promptFieldConfig,
                        submissionId: sampleSubmission?.id,
                        labelingTaskId: sampleSubmission?.labelingTaskId,
                        questionType: question.questionType,
                        questionText: question.questionText,
                        answer: sampleSubmission?.answers.find((answer) => answer.questionTemplateId === question.questionTemplateId)?.answer,
                        attachments: sampleSubmission?.attachments ?? [],
                      });

                      return (
                        <div className="assignment-config-card" key={assignment.judgeId}>
                          <div className="assignment-config-header">
                            <div>
                              <strong>{judge?.name ?? assignment.judgeId}</strong>
                              <div className="table-subtext">
                                {judge ? `${judge.provider} / ${judge.model}` : "Judge unavailable"}
                              </div>
                            </div>
                            <span className="pill">Assignment-specific prompt</span>
                          </div>
                          <div className="assignment-config-grid">
                            <div className="stack">
                              {promptFieldLabels.map((field) => (
                                <label key={field.key} className="toggle-row">
                                  <div>
                                    <strong>{field.label}</strong>
                                    <div className="table-subtext">{field.description}</div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={assignment.promptFieldConfig[field.key]}
                                    onChange={(event) =>
                                      updatePromptField(
                                        question.questionTemplateId,
                                        assignment.judgeId,
                                        field.key,
                                        event.target.checked,
                                      )
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                            <div className="stack">
                              <div className="preview-block">
                                <strong>Prompt preview</strong>
                                <pre>{preview.user}</pre>
                              </div>
                              <div className="preview-block">
                                <strong>System instructions</strong>
                                <pre>{preview.system}</pre>
                              </div>
                              <p className="table-subtext">
                                Sample source:{" "}
                                {sampleSubmission
                                  ? `${sampleSubmission.id}${sampleSubmission.labelingTaskId ? ` • Task ${sampleSubmission.labelingTaskId}` : ""}`
                                  : "Preview uses default sample values."}
                              </p>
                              <p className="table-subtext">
                                Attachments:{" "}
                                {preview.attachmentsIncluded
                                  ? "This judge will receive attachments when this submission has them."
                                  : "Attachments are omitted for this assignment."}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="3. Choose questions to run"
        actions={
          <button
            type="button"
            className="button"
            onClick={() => setSelectedQuestionIds(detail.questions.map((question) => question.questionTemplateId))}
          >
            Select all
          </button>
        }
      >
        <div className="stack">
          <p className="table-subtext">
            These checkboxes only affect the next run. Your saved judge assignments and prompt-field setup stay intact.
          </p>
          {detail.questions.map((question) => (
            <label key={question.questionTemplateId} className="run-question-row">
              <div>
                <strong>{question.questionText}</strong>
                <div className="table-subtext">
                  {question.questionTemplateId} • {question.questionType}
                </div>
              </div>
              <input
                type="checkbox"
                checked={selectedQuestionIds.includes(question.questionTemplateId)}
                onChange={(event) =>
                  setSelectedQuestionIds((current) =>
                    event.target.checked
                      ? [...current, question.questionTemplateId]
                      : current.filter((id) => id !== question.questionTemplateId),
                  )
                }
              />
            </label>
          ))}
        </div>
      </Card>

      <Card title="4. Submission preview">
        <p className="table-subtext">
          Each row below is a submission in queue <strong>{detail.queue.id}</strong>. Upload screenshots or PDFs on the
          matching row if a judge should receive extra visual context.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Submission metadata</th>
                <th>Created</th>
                <th>Attachments</th>
                <th>Answers</th>
              </tr>
            </thead>
            <tbody>
              {detail.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <strong>Submission {submission.id}</strong>
                    <div className="table-subtext">Queue: {detail.queue.id}</div>
                    <div className="table-subtext">
                      Task ID: {submission.labelingTaskId ?? "No upstream task ID"}
                    </div>
                  </td>
                  <td>{new Date(submission.createdAtSource).toLocaleString()}</td>
                  <td>
                    <div className="stack">
                      <label className="button">
                        {uploadingSubmissionId === submission.id ? "Uploading..." : "Upload files"}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          hidden
                          disabled={uploadingSubmissionId !== null}
                          onChange={(event) => void handleAttachmentChange(submission.id, event)}
                        />
                      </label>
                      {submission.attachments.length === 0 ? <span className="table-subtext">No attachments</span> : null}
                      {submission.attachments.map((attachment) => (
                        <div key={attachment.id}>
                          <strong>{attachment.fileName}</strong>
                          <div className="table-subtext">{attachment.mimeType}</div>
                        </div>
                      ))}
                      {attachmentMessages[submission.id] ? <span className="success">{attachmentMessages[submission.id]}</span> : null}
                    </div>
                  </td>
                  <td>
                    <div className="answer-list">
                      {submission.answers.map((answer) => (
                        <div key={answer.questionTemplateId}>
                          <strong>{answer.questionTemplateId}</strong>: {buildAnswerPreview(answer.answer)}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
