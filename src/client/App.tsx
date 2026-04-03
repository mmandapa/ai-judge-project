/**
 * Root application shell and route table.
 */
import { lazy, Suspense } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { InspectModeProvider } from "./inspect/InspectModeProvider";
import { InspectTooltip } from "./inspect/InspectTooltip";
import { useInspectMode } from "./inspect/InspectModeContext";
import { useInspectable } from "./inspect/useInspectable";
import { JudgesPage } from "./pages/JudgesPage";
import { QueueDetailPage } from "./pages/QueueDetailPage";
import { QueuesPage } from "./pages/QueuesPage";
import { ResultsPage } from "./pages/ResultsPage";

const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })),
);

/**
 * Renders the global navigation and page routing for the app.
 */
export function App() {
  return (
    <InspectModeProvider>
      <AppShell />
      <InspectTooltip />
    </InspectModeProvider>
  );
}

function AppShell() {
  const inspectMode = useInspectMode();
  const queuesInspect = useInspectable("nav.queues");
  const judgesInspect = useInspectable("nav.judges");
  const resultsInspect = useInspectable("nav.results");
  const analyticsInspect = useInspectable("nav.analytics");
  const inspectToggleInspect = useInspectable("nav.inspect-toggle");

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Besimple AI Challenge</p>
          <h1>AI Judge</h1>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)} {...queuesInspect}>
            Queues
          </NavLink>
          <NavLink to="/judges" className={({ isActive }) => (isActive ? "active" : undefined)} {...judgesInspect}>
            Judges
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => (isActive ? "active" : undefined)} {...resultsInspect}>
            Results
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : undefined)} {...analyticsInspect}>
            Analytics
          </NavLink>
          <button
            type="button"
            className={`inspect-toggle ${inspectMode.enabled ? "inspect-toggle-active" : ""}`}
            aria-label={inspectMode.enabled ? "Disable source inspect mode" : "Enable source inspect mode"}
            title={inspectMode.enabled ? "Disable source inspect mode" : "Enable source inspect mode"}
            aria-pressed={inspectMode.enabled}
            onClick={() => inspectMode.setEnabled(!inspectMode.enabled)}
            {...inspectToggleInspect}
          >
            <span className="inspect-toggle-track">
              <span className="inspect-toggle-thumb" />
            </span>
          </button>
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<QueuesPage />} />
          <Route path="/queues/:queueId" element={<QueueDetailPage />} />
          <Route path="/judges" element={<JudgesPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<p>Loading analytics…</p>}>
                <AnalyticsPage />
              </Suspense>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
