import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { JudgeRecord, QueueDetail } from "../../shared/types";
import { buildAnswerPreview } from "../../shared/parser";
import { Card } from "../components/Card";
import { MultiSelectChips } from "../components/MultiSelectChips";
import { api } from "../lib/api";

export function QueueDetailPage() {
  const { queueId = "" } = useParams();
  const [detail, setDetail] = useState<QueueDetail | null>(null);
  const [judges, setJudges] = useState<JudgeRecord[]>([]);
  const [draftAssignments, setDraftAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);
      const [queueDetail, judgeList] = await Promise.all([api.getQueue(queueId), api.listJudges()]);
      setDetail(queueDetail);
      setJudges(judgeList);
      setDraftAssignments(queueDetail.assignments);
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

  const totalAssignedJudges = useMemo(
    () => Object.values(draftAssignments).reduce((count, judgeIds) => count + judgeIds.length, 0),
    [draftAssignments],
  );

  async function handleSaveAssignments() {
    if (!detail) {
      return;
    }

    try {
      setSavingAssignments(true);
      setError(null);
      await api.replaceAssignments(
        queueId,
        detail.questions.map((question) => ({
          questionTemplateId: question.questionTemplateId,
          judgeIds: draftAssignments[question.questionTemplateId] ?? [],
        })),
      );
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save assignments");
    } finally {
      setSavingAssignments(false);
    }
  }

  async function persistAssignments() {
    if (!detail) {
      return;
    }

    await api.replaceAssignments(
      queueId,
      detail.questions.map((question) => ({
        questionTemplateId: question.questionTemplateId,
        judgeIds: draftAssignments[question.questionTemplateId] ?? [],
      })),
    );
  }

  async function handleRun() {
    if (!detail) {
      return;
    }

    if (totalAssignedJudges === 0) {
      setError("Assign at least one judge before running evaluations.");
      return;
    }

    try {
      setRunning(true);
      setError(null);
      await persistAssignments();
      const result = await api.runQueue(queueId);
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

  if (loading) {
    return <p>Loading queue…</p>;
  }

  if (!detail) {
    return <p className="error">Queue not found.</p>;
  }

  return (
    <div className="stack">
      <Card
        title={`Queue ${detail.queue.id}`}
        actions={
          <div className="actions">
            <button className="button" onClick={handleSaveAssignments} disabled={savingAssignments}>
              {savingAssignments ? "Saving..." : "Save assignments"}
            </button>
            <button className="button button-primary" onClick={handleRun} disabled={running}>
              {running ? "Running..." : "Run AI Judges"}
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
            <span>Assigned judges</span>
          </div>
        </div>
        {runSummary ? <p className="success">{runSummary}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </Card>

      <Card title="Question assignments">
        <div className="stack">
          {detail.questions.map((question) => (
            <div className="assignment-row" key={question.questionTemplateId}>
              <div>
                <strong>{question.questionText}</strong>
                <div className="table-subtext">
                  {question.questionTemplateId} • {question.questionType}
                </div>
              </div>
              <MultiSelectChips
                options={activeJudgeOptions}
                selected={draftAssignments[question.questionTemplateId] ?? []}
                onChange={(next) =>
                  setDraftAssignments({
                    ...draftAssignments,
                    [question.questionTemplateId]: next,
                  })
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Submission preview" actions={<Link to="/results">View results</Link>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Submission</th>
                <th>Created</th>
                <th>Answers</th>
              </tr>
            </thead>
            <tbody>
              {detail.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <strong>{submission.id}</strong>
                    <div className="table-subtext">{submission.labelingTaskId ?? "No labeling task"}</div>
                  </td>
                  <td>{new Date(submission.createdAtSource).toLocaleString()}</td>
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
