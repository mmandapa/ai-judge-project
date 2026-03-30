/**
 * Shared card container used to keep page sections visually consistent.
 */
import type { ReactNode } from "react";

/**
 * Wraps content in the app's standard card treatment with an optional header.
 */
export function Card(props: { title?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      {(props.title || props.actions) && (
        <div className="card-header">
          {props.title ? <h2>{props.title}</h2> : <span />}
          {props.actions}
        </div>
      )}
      {props.children}
    </section>
  );
}
