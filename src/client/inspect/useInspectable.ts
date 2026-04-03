import { useMemo, type FocusEvent, type MouseEvent } from "react";
import { useInspectMode } from "./InspectModeContext";

export function useInspectable(id: string | null | undefined) {
  const inspectMode = useInspectMode();

  return useMemo(() => {
    if (!id) {
      return {};
    }

    return {
      "data-inspect-id": id,
      onMouseEnter: (event: MouseEvent<HTMLElement>) => {
        inspectMode.showEntry(id, event.currentTarget);
      },
      onFocus: (event: FocusEvent<HTMLElement>) => {
        inspectMode.showEntry(id, event.currentTarget);
      },
      onMouseLeave: () => {
        inspectMode.clearEntry(id);
      },
      onBlur: () => {
        inspectMode.clearEntry(id);
      },
    };
  }, [id, inspectMode]);
}
