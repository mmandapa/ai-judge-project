/**
 * Row-level results page used to inspect and delete evaluation records.
 */
import { useEffect, useState } from "react";
import type { EvaluationRow, ResultsResponse } from "../../shared/types";
import { Card } from "../components/Card";
import { MultiSelectChips } from "../components/MultiSelectChips";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";

/**
 * Loads evaluation rows plus filter metadata and renders the row-level results
 * experience.
 */
export function ResultsPage() {
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [judgeIds, setJudgeIds] = useState<string[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [verdicts, setVerdicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches results using the current or provided filter state.
   */
  async function loadResults(next?: {
    judgeIds?: string[];
    questionIds?: string[];
    verdicts?: string[];
  }) {
    try {
      setLoading(true);
      setError(null);
      setResults(
        await api.getResults({
          judgeIds: next?.judgeIds ?? judgeIds,
          questionTemplateIds: next?.questionIds ?? questionIds,
          verdicts: next?.verdicts ?? verdicts,
        }),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResults();
  }, []);

  /**
   * Applies the next filter selection and reloads the result set.
   */
  async function updateFilters(next: {
    judgeIds?: string[];
    questionIds?: string[];
    verdicts?: string[];
  }) {
    const nextJudgeIds = next.judgeIds ?? judgeIds;
    const nextQuestionIds = next.questionIds ?? questionIds;
    const nextVerdicts = next.verdicts ?? verdicts;
    setJudgeIds(nextJudgeIds);
    setQuestionIds(nextQuestionIds);
    setVerdicts(nextVerdicts);
    await loadResults({
      judgeIds: nextJudgeIds,
      questionIds: nextQuestionIds,
      verdicts: nextVerdicts,
    });
  }

  /**
   * Deletes one evaluation row after confirmation.
   */
  async function handleDeleteRow(row: EvaluationRow) {
    const confirmed = window.confirm(
      `Delete the evaluation for submission ${row.submissionId} by ${row.judgeName}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(row.id);
      setError(null);
      await api.deleteEvaluation(row.id);
      await loadResults();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete evaluation");
    } finally {
      setDeletingId(null);
    }
  }

  /**
   * Deletes all currently visible evaluation rows.
   */
  async function handleClearVisible() {
    const visibleCount = results?.rows.length ?? 0;
    if (visibleCount === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete all ${visibleCount} currently visible evaluation row${visibleCount === 1 ? "" : "s"}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearingAll(true);
      setError(null);
      await api.deleteVisibleEvaluations({
        judgeIds,
        questionTemplateIds: questionIds,
        verdicts,
      });
      await loadResults();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to clear evaluations");
    } finally {
      setClearingAll(false);
    }
  }

  return (
    <div className="stack">
      <Card title="Evaluation results">
        {results ? (
          <div className="stats">
            <div>
              <strong>{results.aggregate.passRate}%</strong>
              <span>Pass rate</span>
            </div>
            <div>
              <strong>{results.aggregate.passCount}</strong>
              <span>Passes</span>
            </div>
            <div>
              <strong>{results.aggregate.totalCount}</strong>
              <span>Completed evals</span>
            </div>
          </div>
        ) : null}
      </Card>

      <Card title="Filters">
        {results ? (
          <div className="stack">
            <div>
              <p className="filter-label">Judges</p>
              <MultiSelectChips
                options={results.availableFilters.judges.map((judge) => ({ id: judge.id, label: judge.name }))}
                selected={judgeIds}
                onChange={(next) => void updateFilters({ judgeIds: next })}
              />
            </div>
            <div>
              <p className="filter-label">Questions</p>
              <MultiSelectChips
                options={results.availableFilters.questions.map((question) => ({ id: question.id, label: question.text }))}
                selected={questionIds}
                onChange={(next) => void updateFilters({ questionIds: next })}
              />
            </div>
            <div>
              <p className="filter-label">Verdicts</p>
              <MultiSelectChips
                options={["pass", "fail", "inconclusive"].map((verdict) => ({ id: verdict, label: verdict }))}
                selected={verdicts}
                onChange={(next) => void updateFilters({ verdicts: next })}
              />
            </div>
          </div>
        ) : null}
      </Card>

      <Card
        title="Evaluations"
        actions={
          <button
            className="button"
            onClick={() => void handleClearVisible()}
            disabled={clearingAll || loading || !results || results.rows.length === 0}
          >
            {clearingAll ? "Deleting..." : "Clear visible"}
          </button>
        }
      >
        {loading ? <p>Loading results…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {results && results.rows.length === 0 ? <p className="muted">No evaluations yet.</p> : null}
        {results && results.rows.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Submission</th>
                  <th>Question</th>
                  <th>Judge</th>
                  <th>Verdict</th>
                  <th>Reasoning</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row) => (
                  <ResultRow
                    key={row.id}
                    row={row}
                    deleting={deletingId === row.id}
                    onDelete={() => void handleDeleteRow(row)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

/**
 * Renders a single evaluation row inside the results table.
 */
function ResultRow(props: { row: EvaluationRow; deleting: boolean; onDelete: () => void }) {
  const verdict = props.row.status === "failed" ? "failed" : props.row.verdict;

  return (
    <tr>
      <td>{props.row.submissionId}</td>
      <td>{props.row.questionText}</td>
      <td>{props.row.judgeName}</td>
      <td>
        <StatusBadge verdict={verdict} />
      </td>
      <td>{props.row.errorMessage ?? props.row.reasoning}</td>
      <td>{new Date(props.row.createdAt).toLocaleString()}</td>
      <td>
        <button className="button button-danger" onClick={props.onDelete} disabled={props.deleting}>
          {props.deleting ? "Deleting..." : "Delete"}
        </button>
      </td>
    </tr>
  );
}
