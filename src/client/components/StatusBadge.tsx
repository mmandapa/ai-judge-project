import type { Verdict } from "../../shared/types";

export function StatusBadge(props: { verdict: Verdict | "failed" }) {
  return <span className={`badge badge-${props.verdict}`}>{props.verdict}</span>;
}
