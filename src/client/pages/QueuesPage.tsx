import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseImportedSubmissions } from "../../shared/parser";
import type { BatchImportEntry, ImportTargetMode, ImportedSubmission, QueueSummary } from "../../shared/types";
import { Card } from "../components/Card";
import { api, buildAttachmentId, buildSubmissionOptionLabel, type PendingSubmissionAttachment } from "../lib/api";

type StagedImportEntry = {
  id: string;
  sourceFileName: string;
  targetMode: ImportTargetMode;
  targetQueueId: string;
  detectedQueueIds: string[];
  submissions: ImportedSubmission[];
  attachments: PendingSubmissionAttachment[];
};

function buildEntryId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function QueuesPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [stagedEntries, setStagedEntries] = useState<StagedImportEntry[]>([]);
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

  const canImport = stagedEntries.length > 0 && stagedEntries.every((entry) =>
    entry.targetQueueId.trim().length > 0 && entry.attachments.every((attachment) => attachment.submissionId),
  );

  const batchSummary = useMemo(() => {
    const queueIds = new Set(stagedEntries.map((entry) => entry.targetQueueId).filter(Boolean));
    const newQueueCount = stagedEntries.filter((entry) => entry.targetMode === "new").length;
    const existingQueueCount = stagedEntries.filter((entry) => entry.targetMode === "existing").length;
    const submissionCount = stagedEntries.reduce((count, entry) => count + entry.submissions.length, 0);
    const attachmentCount = stagedEntries.reduce((count, entry) => count + entry.attachments.length, 0);
    return {
      queueCount: queueIds.size,
      newQueueCount,
      existingQueueCount,
      submissionCount,
      attachmentCount,
    };
  }, [stagedEntries]);

  async function handleAddEntry(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const submissions = parseImportedSubmissions(raw);
      const detectedQueueIds = [...new Set(submissions.map((submission) => submission.queueId))];
      const defaultQueueId = detectedQueueIds.length === 1 ? detectedQueueIds[0] ?? "" : "";
      setStagedEntries((current) => [
        ...current,
        {
          id: buildEntryId(file),
          sourceFileName: file.name,
          targetMode: "new",
          targetQueueId: defaultQueueId,
          detectedQueueIds,
          submissions,
          attachments: [],
        },
      ]);
      setImportSummary(null);
      setError(null);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Failed to parse JSON import file");
    }
  }

  function updateEntry(entryId: string, updater: (entry: StagedImportEntry) => StagedImportEntry) {
    setStagedEntries((current) => current.map((entry) => (entry.id === entryId ? updater(entry) : entry)));
  }

  function removeEntry(entryId: string) {
    setStagedEntries((current) => current.filter((entry) => entry.id !== entryId));
  }

  function handleAttachmentSelection(entryId: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    updateEntry(entryId, (entry) => {
      const defaultSubmissionId = entry.submissions.length === 1 ? entry.submissions[0]?.id ?? "" : "";
      return {
        ...entry,
        attachments: [
          ...entry.attachments,
          ...files.map((file, index) => ({
            id: buildAttachmentId(file, entry.attachments.length + index),
            file,
            submissionId: defaultSubmissionId,
          })),
        ],
      };
    });
    setImportSummary(null);
    setError(null);
  }

  async function handleImportBatch() {
    if (!canImport) {
      setError("Choose a target queue for every entry and assign each attachment to a submission before importing.");
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setImportSummary(null);

      const payload: BatchImportEntry[] = stagedEntries.map((entry) => ({
        sourceFileName: entry.sourceFileName,
        targetMode: entry.targetMode,
        targetQueueId: entry.targetQueueId,
        submissions: entry.submissions,
      }));

      const result = await api.importBatch(payload);
      let uploadedCount = 0;
      for (const entry of stagedEntries) {
        const groupedAttachments = new Map<string, File[]>();
        for (const attachment of entry.attachments) {
          groupedAttachments.set(attachment.submissionId, [
            ...(groupedAttachments.get(attachment.submissionId) ?? []),
            attachment.file,
          ]);
        }

        for (const [submissionId, files] of groupedAttachments.entries()) {
          const uploadResult = await api.uploadSubmissionAttachments(submissionId, files);
          uploadedCount += uploadResult.uploadedCount;
        }
      }

      setImportSummary(
        `Imported ${result.entryCount} entr${result.entryCount === 1 ? "y" : "ies"} across ${result.queueIds.length} queue${result.queueIds.length === 1 ? "" : "s"}, ${result.submissionCount} submission${result.submissionCount === 1 ? "" : "s"}${uploadedCount > 0 ? `, and ${uploadedCount} attachment${uploadedCount === 1 ? "" : "s"}` : ""}.`,
      );
      setStagedEntries([]);
      await loadQueues();

      if (result.queueIds.length > 0) {
        const target = result.queueIds[0] ?? "";
        const affectedQueues = result.queueIds.join(",");
        navigate(`/queues/${target}${result.queueIds.length > 1 ? `?affectedQueues=${encodeURIComponent(affectedQueues)}` : ""}`);
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
        title="Stage submission imports"
        actions={
          <div className="actions">
            <button type="button" className="button" disabled={importing} onClick={() => fileInputRef.current?.click()}>
              Add JSON entry
            </button>
            <button className="button button-primary" disabled={importing || !canImport} onClick={() => void handleImportBatch()}>
              {importing ? "Importing..." : stagedEntries.length > 0 ? "Import staged batch" : "Add an entry first"}
            </button>
          </div>
        }
      >
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleAddEntry} />
        <div className="stack">
          <p className="muted">
            Build an import batch by adding one or more JSON entries. For each entry, choose whether it should create a new
            queue or merge into an existing queue, then optionally map screenshots or PDFs before importing everything at once.
          </p>
          <div className="stats">
            <div>
              <strong>{batchSummary.queueCount}</strong>
              <span>Target queues</span>
            </div>
            <div>
              <strong>{batchSummary.submissionCount}</strong>
              <span>Staged submissions</span>
            </div>
            <div>
              <strong>{batchSummary.attachmentCount}</strong>
              <span>Staged attachments</span>
            </div>
            <div>
              <strong>{batchSummary.newQueueCount}</strong>
              <span>New queue entries</span>
            </div>
          </div>
          {stagedEntries.length === 0 ? <p className="muted">No staged entries yet. Add a JSON file to begin.</p> : null}
          {stagedEntries.map((entry, index) => {
            const submissionOptions = entry.submissions.map((submission) => ({
              id: submission.id,
              label: buildSubmissionOptionLabel(submission),
            }));

            return (
              <div key={entry.id} className="staged-entry-card">
                <div className="staged-entry-header">
                  <div>
                    <strong>Entry {index + 1}: {entry.sourceFileName}</strong>
                    <div className="table-subtext">
                      {entry.submissions.length} submission{entry.submissions.length === 1 ? "" : "s"} • Detected queue IDs:{" "}
                      {entry.detectedQueueIds.join(", ") || "none"}
                    </div>
                  </div>
                  <button type="button" className="button" onClick={() => removeEntry(entry.id)}>
                    Remove
                  </button>
                </div>

                <div className="staged-entry-grid">
                  <label className="field">
                    <span>Queue target</span>
                    <select
                      value={entry.targetMode}
                      onChange={(event) =>
                        updateEntry(entry.id, (current) => ({
                          ...current,
                          targetMode: event.target.value as ImportTargetMode,
                          targetQueueId:
                            event.target.value === "existing"
                              ? current.targetQueueId && queues.some((queue) => queue.id === current.targetQueueId)
                                ? current.targetQueueId
                                : queues[0]?.id ?? ""
                              : current.detectedQueueIds.length === 1
                                ? current.detectedQueueIds[0] ?? ""
                                : current.targetQueueId,
                        }))
                      }
                    >
                      <option value="new">Create new queue</option>
                      <option value="existing">Add to existing queue</option>
                    </select>
                  </label>

                  {entry.targetMode === "new" ? (
                    <label className="field">
                      <span>New queue ID</span>
                      <input
                        value={entry.targetQueueId}
                        onChange={(event) =>
                          updateEntry(entry.id, (current) => ({
                            ...current,
                            targetQueueId: event.target.value,
                          }))
                        }
                        placeholder={entry.detectedQueueIds[0] ?? "queue_id"}
                      />
                    </label>
                  ) : (
                    <label className="field">
                      <span>Existing queue</span>
                      <select
                        value={entry.targetQueueId}
                        onChange={(event) =>
                          updateEntry(entry.id, (current) => ({
                            ...current,
                            targetQueueId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choose queue</option>
                        {queues.map((queue) => (
                          <option key={queue.id} value={queue.id}>
                            {queue.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label className="button">
                    {entry.attachments.length > 0
                      ? `${entry.attachments.length} attachment${entry.attachments.length === 1 ? "" : "s"} selected`
                      : "Add attachments"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      hidden
                      disabled={importing}
                      onChange={(event) => handleAttachmentSelection(entry.id, event)}
                    />
                  </label>
                </div>

                <div className="preview-block">
                  <strong>Submission preview</strong>
                  <div className="stack preview-content-list">
                    {submissionOptions.map((submission) => (
                      <div key={submission.id}>{submission.label}</div>
                    ))}
                  </div>
                </div>

                {entry.attachments.length > 0 ? (
                  <div className="stack">
                    <strong>Attachment mapping</strong>
                    {entry.attachments.map((attachment) => (
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
                              updateEntry(entry.id, (current) => ({
                                ...current,
                                attachments: current.attachments.map((currentAttachment) =>
                                  currentAttachment.id === attachment.id
                                    ? { ...currentAttachment, submissionId: event.target.value }
                                    : currentAttachment,
                                ),
                              }))
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
              </div>
            );
          })}
          {importSummary ? <p className="success">{importSummary}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      </Card>

      <Card title="Queues">
        {loading ? <p>Loading queues…</p> : null}
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
