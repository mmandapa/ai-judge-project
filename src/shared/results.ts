/**
 * Shared results aggregate helpers.
 */
import type { EvaluationRow } from "./types.js";

/**
 * Calculates pass-rate metrics using only completed evaluations.
 */
export function calculatePassRate(rows: EvaluationRow[]) {
  const completedRows = rows.filter((row) => row.status === "completed");
  const passCount = completedRows.filter((row) => row.verdict === "pass").length;
  const totalCount = completedRows.length;

  return {
    passCount,
    totalCount,
    passRate: totalCount === 0 ? 0 : Math.round((passCount / totalCount) * 100),
  };
}
