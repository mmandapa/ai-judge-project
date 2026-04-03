import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InspectModeContext, type InspectAnchor } from "./InspectModeContext";
import { getInspectEntry } from "./sourceMap";

const STORAGE_KEY = "ai-judge.inspect-mode";
const HIDE_DELAY_MS = 120;
const VIRTUAL_ANCHOR_SIZE = 12;

function toInspectRect(rect: DOMRect | { top: number; left: number; bottom: number; right: number; width: number; height: number }) {
  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  };
}

export function InspectModeProvider(props: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [active, setActive] = useState<InspectAnchor | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setEnabledState(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    if (!enabled) {
      setActive(null);
    }
  }, [enabled]);

  useEffect(() => () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
  }, []);

  function clearHideTimer() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function setEnabled(next: boolean) {
    clearHideTimer();
    setEnabledState(next);
  }

  function showEntry(id: string, element: HTMLElement) {
    if (!enabled) {
      return;
    }

    const entry = getInspectEntry(id);
    if (!entry) {
      return;
    }

    clearHideTimer();
    setActive({
      id,
      entry,
      rect: toInspectRect(element.getBoundingClientRect()),
    });
  }

  function showEntryAtPoint(id: string, point: { clientX: number; clientY: number }) {
    if (!enabled) {
      return;
    }

    const entry = getInspectEntry(id);
    if (!entry) {
      return;
    }

    clearHideTimer();
    setActive({
      id,
      entry,
      rect: {
        top: point.clientY - VIRTUAL_ANCHOR_SIZE / 2,
        left: point.clientX - VIRTUAL_ANCHOR_SIZE / 2,
        bottom: point.clientY + VIRTUAL_ANCHOR_SIZE / 2,
        right: point.clientX + VIRTUAL_ANCHOR_SIZE / 2,
        width: VIRTUAL_ANCHOR_SIZE,
        height: VIRTUAL_ANCHOR_SIZE,
      },
    });
  }

  function clearEntry(id: string) {
    if (!enabled) {
      return;
    }

    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setActive((current) => (current?.id === id ? null : current));
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);
  }

  function keepVisible() {
    clearHideTimer();
  }

  const value = useMemo(
    () => ({
      enabled,
      active,
      setEnabled,
      showEntry,
      showEntryAtPoint,
      clearEntry,
      keepVisible,
    }),
    [active, enabled],
  );

  return <InspectModeContext.Provider value={value}>{props.children}</InspectModeContext.Provider>;
}
