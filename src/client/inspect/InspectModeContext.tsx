import { createContext, useContext } from "react";
import type { InspectEntry } from "./types";

export type InspectRect = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};

export type InspectAnchor = {
  id: string;
  entry: InspectEntry;
  rect: InspectRect;
};

export type InspectModeValue = {
  enabled: boolean;
  active: InspectAnchor | null;
  setEnabled: (enabled: boolean) => void;
  showEntry: (id: string, element: HTMLElement) => void;
  showEntryAtPoint: (id: string, point: { clientX: number; clientY: number }) => void;
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
