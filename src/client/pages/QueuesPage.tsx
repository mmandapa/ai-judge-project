import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { QueueSummary } from "../../shared/types";
import { Card } from "../components/Card";
import { api } from "../lib/api";

export function QueuesPage() {
  const navigate = useNavigate();
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadQueues() {
    try {
      setLoading(true);
      setError(null);
      setQueues(await api.listQueues());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load queues");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQueues();
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);
      setError(null);
      const result = await api.importSubmissions(file);
      await loadQueues();
      if (result.queueIds.length > 0) {
        navigate(`/queues/${result.queueIds[0]}`);
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  return (
    <div className="stack">
      <Card
        title="Import submissions"
        actions={
          <label className="button button-primary">
            {importing ? "Importing..." : "Upload JSON"}
            <input type="file" accept="application/json" hidden disabled={importing} onChange={handleFileChange} />
          </label>
        }
      >
        <p className="muted">
          Upload the challenge JSON file to create or update queues and submissions in Supabase.
        </p>
      </Card>

      <Card title="Queues">
        {loading ? <p>Loading queues…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && queues.length === 0 ? <p className="muted">No queues yet. Import a JSON file first.</p> : null}
        {queues.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Queue</th>
                  <th>Submissions</th>
                  <th>Questions</th>
                  <th>Assignments</th>
                  <th>Last Run</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((queue) => (
                  <tr key={queue.id}>
                    <td>
                      <Link to={`/queues/${queue.id}`}>{queue.id}</Link>
                      <div className="table-subtext">{queue.sourceFileName ?? "Imported source"}</div>
                    </td>
                    <td>{queue.submissionCount}</td>
                    <td>{queue.distinctQuestionCount}</td>
                    <td>{queue.assignmentCount}</td>
                    <td>{queue.lastRunAt ? new Date(queue.lastRunAt).toLocaleString() : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
