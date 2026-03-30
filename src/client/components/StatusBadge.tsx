/**
 * Displays a verdict as a styled badge in the results table.
 */
import type { Verdict } from "../../shared/types";

/**
 * Maps a verdict string to the matching badge style.
 */
export function StatusBadge(props: { verdict: Verdict | "failed" }) {
  return <span className={`badge badge-${props.verdict}`}>{props.verdict}</span>;
}
