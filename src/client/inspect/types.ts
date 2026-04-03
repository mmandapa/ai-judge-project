export type InspectReferenceKind = "frontend" | "api" | "route" | "db" | "shared";

export type InspectReference = {
  kind: InspectReferenceKind;
  file: string;
  line: number;
  text: string;
};

export type InspectSchemaOperation = "read" | "write" | "rpc" | "related";

export type InspectSchemaEntry = {
  table: string;
  columns: string[];
  operation?: InspectSchemaOperation;
  note?: string;
};

export type InspectEntry = {
  id: string;
  label: string;
  summary: string;
  references: InspectReference[];
  schema?: InspectSchemaEntry[];
};
