/**
 * Root application shell and route table.
 */
import { lazy, Suspense } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
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
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Besimple AI Challenge</p>
          <h1>AI Judge</h1>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            Queues
          </NavLink>
          <NavLink to="/judges" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Judges
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Results
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Analytics
          </NavLink>
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
