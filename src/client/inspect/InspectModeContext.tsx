import { createContext, useContext } from "react";
import type { InspectEntry } from "./types";

export type InspectAnchor = {
  id: string;
  entry: InspectEntry;
  rect: DOMRect;
};

export type InspectModeValue = {
  enabled: boolean;
  active: InspectAnchor | null;
  setEnabled: (enabled: boolean) => void;
  showEntry: (id: string, element: HTMLElement) => void;
  clearEntry: (id: string) => void;
  keepVisible: () => void;
};

export const InspectModeContext = createContext<InspectModeValue | null>(null);

export function useInspectMode() {
  const value = useContext(InspectModeContext);
  if (!value) {
    throw new Error("Inspect mode is not available outside InspectModeContext.");
  }

  return value;
}
