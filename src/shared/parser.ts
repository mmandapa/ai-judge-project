import {
  importedSubmissionListSchema,
  type ImportedSubmission,
} from "./types.js";

export function parseImportedSubmissions(raw: string): ImportedSubmission[] {
  const parsed = JSON.parse(raw) as unknown;
  return importedSubmissionListSchema.parse(parsed);
}

export function coerceImportedSubmissionsToQueue(
  submissions: ImportedSubmission[],
  queueId: string,
): ImportedSubmission[] {
  return submissions.map((submission) => ({
    ...submission,
    queueId,
  }));
}

export function buildAnswerPreview(answer: unknown): string {
  if (typeof answer === "string") {
    return answer;
  }

  try {
    return JSON.stringify(answer);
  } catch {
    return String(answer);
  }
}
