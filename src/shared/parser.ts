/**
 * Shared import parsing helpers.
 */
import {
  importedSubmissionListSchema,
  type ImportedSubmission,
} from "./types.js";

/**
 * Parses and validates challenge JSON input into the shared submission shape.
 */
export function parseImportedSubmissions(raw: string): ImportedSubmission[] {
  const parsed = JSON.parse(raw) as unknown;
  return importedSubmissionListSchema.parse(parsed);
}

/**
 * Rewrites imported submissions so they all land in a chosen queue.
 */
export function coerceImportedSubmissionsToQueue(
  submissions: ImportedSubmission[],
  queueId: string,
): ImportedSubmission[] {
  return submissions.map((submission) => ({
    ...submission,
    queueId,
  }));
}

/**
 * Produces a compact string representation of an answer for UI display.
 */
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
