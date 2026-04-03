import { useMemo } from "react";
import { useInspectMode } from "./InspectModeContext";

const KIND_LABELS = {
  frontend: "Frontend",
  api: "API",
  route: "Route",
  db: "DB",
  shared: "Shared",
} as const;

const SCHEMA_LABELS = {
  read: "Read",
  write: "Write",
  rpc: "RPC",
  related: "Related",
} as const;

function buildEditorHref(file: string, line: number) {
  return `cursor://file${file}:${line}:1`;
}

export function InspectTooltip() {
  const inspectMode = useInspectMode();
  const active = inspectMode.active;

  const position = useMemo(() => {
    if (!active) {
      return null;
    }

    const top = Math.min(active.rect.bottom + 12, window.innerHeight - 24);
    const left = Math.min(active.rect.left, window.innerWidth - 420);
    return {
      top,
      left: Math.max(left, 16),
    };
  }, [active]);

  if (!inspectMode.enabled || !active || !position) {
    return null;
  }

  return (
    <aside
      className="inspect-tooltip"
      role="dialog"
      aria-label={`${active.entry.label} source references`}
      style={position}
      onMouseEnter={() => inspectMode.keepVisible()}
      onMouseLeave={() => inspectMode.clearEntry(active.id)}
    >
      <div className="inspect-tooltip-header">
        <strong>{active.entry.label}</strong>
        <span className="inspect-tooltip-summary">{active.entry.summary}</span>
      </div>
      <div className="inspect-tooltip-list">
        {active.entry.references.map((reference) => (
          <a
            key={`${reference.kind}-${reference.file}-${reference.line}`}
            className="inspect-reference"
            href={buildEditorHref(reference.file, reference.line)}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="inspect-reference-kind">{KIND_LABELS[reference.kind]}</span>
            <span className="inspect-reference-text">{reference.text}</span>
            <span className="inspect-reference-path">
              {reference.file}:{reference.line}
            </span>
          </a>
        ))}
      </div>
      {active.entry.schema?.length ? (
        <div className="inspect-schema">
          <strong className="inspect-section-title">Schema</strong>
          <div className="inspect-schema-list">
            {active.entry.schema.map((schemaEntry) => (
              <div key={`${schemaEntry.table}-${schemaEntry.operation ?? "default"}`} className="inspect-schema-row">
                <div className="inspect-schema-header">
                  <span className="inspect-schema-table">{schemaEntry.table}</span>
                  {schemaEntry.operation ? (
                    <span className="inspect-schema-operation">{SCHEMA_LABELS[schemaEntry.operation]}</span>
                  ) : null}
                </div>
                <div className="inspect-schema-columns">{schemaEntry.columns.join(", ")}</div>
                {schemaEntry.note ? <div className="inspect-schema-note">{schemaEntry.note}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
