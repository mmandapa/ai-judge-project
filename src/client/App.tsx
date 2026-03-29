import { NavLink, Route, Routes } from "react-router-dom";
import { JudgesPage } from "./pages/JudgesPage";
import { QueueDetailPage } from "./pages/QueueDetailPage";
import { QueuesPage } from "./pages/QueuesPage";
import { ResultsPage } from "./pages/ResultsPage";

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
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<QueuesPage />} />
          <Route path="/queues/:queueId" element={<QueueDetailPage />} />
          <Route path="/judges" element={<JudgesPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </main>
    </div>
  );
}
