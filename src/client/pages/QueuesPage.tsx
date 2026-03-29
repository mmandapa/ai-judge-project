import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseImportedSubmissions } from "../../shared/parser";
import type { ImportedSubmission, QueueSummary } from "../../shared/types";
import { Card } from "../components/Card";
import { api, buildAttachmentId, buildSubmissionOptionLabel, type PendingSubmissionAttachment } from "../lib/api";

export function QueuesPage() {
  const navigate = useNavigate();
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [parsedSubmissions, setParsedSubmissions] = useState<ImportedSubmission[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingSubmissionAttachment[]>([]);
  const [importSummary, setImportSummary] = useState<string | null>(null);

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

  const submissionOptions = useMemo(
    () =>
      parsedSubmissions.map((submission) => ({
        id: submission.id,
        label: buildSubmissionOptionLabel(submission),
      })),
    [parsedSubmissions],
  );

  const canImport = jsonFile !== null && pendingAttachments.every((attachment) => attachment.submissionId);

  async function handleJsonFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const submissions = parseImportedSubmissions(raw);
      setJsonFile(file);
      setParsedSubmissions(submissions);
      setPendingAttachments([]);
      setImportSummary(null);
      setError(null);
    } catch (parseError) {
      setJsonFile(null);
      setParsedSubmissions([]);
      setPendingAttachments([]);
      setError(parseError instanceof Error ? parseError.message : "Failed to parse JSON import file");
    }
  }

  function handleAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const defaultSubmissionId = parsedSubmissions.length === 1 ? parsedSubmissions[0]?.id ?? "" : "";
    setPendingAttachments((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: buildAttachmentId(file, current.length + index),
        file,
        submissionId: defaultSubmissionId,
      })),
    ]);
    setImportSummary(null);
    setError(null);
  }

  async function handleImport() {
    if (!jsonFile) {
      setError("Choose a JSON file before importing.");
      return;
    }
    if (!canImport) {
      setError("Assign each attachment to a submission before importing.");
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setImportSummary(null);

      const result = await api.importSubmissions(jsonFile);
      const groupedAttachments = new Map<string, File[]>();
      for (const attachment of pendingAttachments) {
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

      setImportSummary(
        `Imported ${result.submissionCount} submission${result.submissionCount === 1 ? "" : "s"}${uploadedCount > 0 ? ` and uploaded ${uploadedCount} attachment${uploadedCount === 1 ? "" : "s"}` : ""}.`,
      );
      await loadQueues();
      if (result.queueIds.length > 0) {
        navigate(`/queues/${result.queueIds[0]}`);
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="stack">
      <Card
        title="Import submissions"
        actions={
          <button className="button button-primary" disabled={importing || !canImport} onClick={() => void handleImport()}>
            {importing ? "Importing..." : jsonFile ? "Import JSON + attachments" : "Choose JSON first"}
          </button>
        }
      >
        <div className="stack">
          <p className="muted">
            Upload the challenge JSON file first. You can optionally add screenshots or PDFs in the same workflow and map
            each file to the submission it should travel with during evaluation. After import, you will land in queue setup
            to assign judges, choose prompt fields, and run the queue.
          </p>
          <div className="actions">
            <label className="button">
              {jsonFile ? `JSON selected: ${jsonFile.name}` : "Choose JSON"}
              <input type="file" accept="application/json" hidden disabled={importing} onChange={handleJsonFileChange} />
            </label>
            <label className="button">
              {pendingAttachments.length > 0 ? `${pendingAttachments.length} attachment${pendingAttachments.length === 1 ? "" : "s"} selected` : "Add attachments"}
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                hidden
                disabled={importing || parsedSubmissions.length === 0}
                onChange={handleAttachmentSelection}
              />
            </label>
          </div>
          {parsedSubmissions.length > 0 ? (
            <div className="preview-block">
              <strong>Imported submissions</strong>
              <div className="stack preview-content-list">
                {submissionOptions.map((submission) => (
                  <div key={submission.id}>{submission.label}</div>
                ))}
              </div>
            </div>
          ) : null}
          {pendingAttachments.length > 0 ? (
            <div className="stack">
              <strong>Attachment mapping</strong>
              <p className="table-subtext">
                Each file must be assigned to the submission it belongs to. Those attachments will be uploaded immediately
                after the JSON import succeeds.
              </p>
              {pendingAttachments.map((attachment) => (
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
                        setPendingAttachments((current) =>
                          current.map((entry) =>
                            entry.id === attachment.id ? { ...entry, submissionId: event.target.value } : entry,
                          ),
                        )
                      }
                    >
                      <option value="">Choose submission</option>
                      {submissionOptions.map((submission) => (
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
          {importSummary ? <p className="success">{importSummary}</p> : null}
        </div>
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
