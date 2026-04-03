export type InspectReferenceKind = "frontend" | "api" | "route" | "db" | "shared";

export type InspectReference = {
  kind: InspectReferenceKind;
  file: string;
  line: number;
  text: string;
};

export type InspectEntry = {
  id: string;
  label: string;
  summary: string;
  references: InspectReference[];
};
