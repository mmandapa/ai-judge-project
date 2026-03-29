import type { ReactNode } from "react";

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
