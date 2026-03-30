/**
 * Interactive analytics dashboard page.
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSearchParams } from "react-router-dom";
import type { AnalyticsResponse } from "../../shared/types";
import { Card } from "../components/Card";
import { MultiSelectChips } from "../components/MultiSelectChips";
import { api } from "../lib/api";

type Preset = "24h" | "7d" | "30d" | "all" | "custom";
type ExpandedChartId = "judge" | "trend" | "verdict" | "question" | null;

const presetOptions: Array<{ id: Preset; label: string }> = [
  { id: "24h", label: "Last 24h" },
  { id: "7d", label: "Last 7d" },
  { id: "30d", label: "Last 30d" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

const verdictColors: Record<string, string> = {
  pass: "#166c4a",
  fail: "#94213a",
  inconclusive: "#7b6220",
  failed: "#536172",
};

/**
 * Parses a comma-separated filter value from the URL query string.
 */
function parseList(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.split(",").filter(Boolean) ?? [];
}

/**
 * Converts an ISO timestamp into the YYYY-MM-DD format expected by date inputs.
 */
function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

/**
 * Resolves the active date preset into concrete start/end timestamps.
 */
function toRange(searchParams: URLSearchParams) {
  const preset = (searchParams.get("preset") as Preset | null) ?? "7d";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (preset === "custom") {
    return {
      preset,
      startDate: startDate ?? "",
      endDate: endDate ?? "",
      startAt: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      endAt: endDate ? `${endDate}T23:59:59.999Z` : undefined,
    };
  }

  if (preset === "all") {
    return { preset, startDate: "", endDate: "", startAt: undefined, endAt: undefined };
  }

  const now = new Date();
  const start = new Date(now);
  if (preset === "24h") {
    start.setHours(start.getHours() - 24);
  } else if (preset === "7d") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }

  return {
    preset,
    startDate: toDateInputValue(start.toISOString()),
    endDate: toDateInputValue(now.toISOString()),
    startAt: start.toISOString(),
    endAt: now.toISOString(),
  };
}

/**
 * Loads analytics data, keeps filters in the URL, and renders the dashboard.
 */
export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<ExpandedChartId>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const filters = useMemo(() => {
    const range = toRange(searchParams);
    return {
      queueId: searchParams.get("queueId") ?? "",
      judgeIds: parseList(searchParams, "judgeIds"),
      questionTemplateIds: parseList(searchParams, "questionTemplateIds"),
      verdicts: parseList(searchParams, "verdicts"),
      preset: range.preset,
      startDate: range.startDate,
      endDate: range.endDate,
      startAt: range.startAt,
      endAt: range.endAt,
    };
  }, [searchParams]);

  /**
   * Writes the next filter state back into the URL so the dashboard remains
   * shareable and refresh-safe.
   */
  function updateSearch(next: Partial<{
    queueId: string;
    judgeIds: string[];
    questionTemplateIds: string[];
    verdicts: string[];
    preset: Preset;
    startDate: string;
    endDate: string;
  }>) {
    const params = new URLSearchParams(searchParams);
    const queueId = next.queueId ?? filters.queueId;
    const judgeIds = next.judgeIds ?? filters.judgeIds;
    const questionTemplateIds = next.questionTemplateIds ?? filters.questionTemplateIds;
    const verdicts = next.verdicts ?? filters.verdicts;
    const preset = next.preset ?? filters.preset;
    const startDate = next.startDate ?? filters.startDate;
    const endDate = next.endDate ?? filters.endDate;

    queueId ? params.set("queueId", queueId) : params.delete("queueId");
    judgeIds.length ? params.set("judgeIds", judgeIds.join(",")) : params.delete("judgeIds");
    questionTemplateIds.length
      ? params.set("questionTemplateIds", questionTemplateIds.join(","))
      : params.delete("questionTemplateIds");
    verdicts.length ? params.set("verdicts", verdicts.join(",")) : params.delete("verdicts");
    params.set("preset", preset);
    if (preset === "custom") {
      startDate ? params.set("startDate", startDate) : params.delete("startDate");
      endDate ? params.set("endDate", endDate) : params.delete("endDate");
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    let cancelled = false;

    async function load(silent = false) {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const next = await api.getAnalytics({
          queueId: filters.queueId || undefined,
          judgeIds: filters.judgeIds,
          questionTemplateIds: filters.questionTemplateIds,
          verdicts: filters.verdicts,
          startAt: filters.startAt,
          endAt: filters.endAt,
        });
        if (!cancelled) {
          setAnalytics(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load(false);

    const intervalId = window.setInterval(() => void load(true), 20000);
    const onFocus = () => void load(true);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [filters.endAt, filters.judgeIds, filters.preset, filters.questionTemplateIds, filters.queueId, filters.startAt, filters.verdicts]);

  useEffect(() => {
    if (!expandedChart) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpandedChart(null);
        return;
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusable = [...modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
          .filter((element) => !element.hasAttribute("disabled"));
        const first = focusable[0];
        const last = focusable.at(-1);

        if (!first || !last) {
          return;
        }

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      lastTriggerRef.current?.focus();
    };
  }, [expandedChart]);

  const available = analytics?.availableFilters;

  const chartMeta: Record<Exclude<ExpandedChartId, null>, { title: string; subtitle: string }> = {
    judge: {
      title: "Pass Rate by Judge",
      subtitle: "Compare judge performance and volume across the current filter set.",
    },
    trend: {
      title: "Evaluations Over Time",
      subtitle: "Track pass rate and completed evaluation volume across the selected time window.",
    },
    verdict: {
      title: "Verdict Mix",
      subtitle: "See how pass, fail, inconclusive, and execution failures are distributed.",
    },
    question: {
      title: "Pass Rate by Question",
      subtitle: "Surface the strongest and weakest question templates by completion outcomes.",
    },
  };

  function openExpanded(chartId: Exclude<ExpandedChartId, null>, event: MouseEvent<HTMLButtonElement>) {
    lastTriggerRef.current = event.currentTarget;
    setExpandedChart(chartId);
  }

  const renderJudgeChart = (expanded = false) =>
    analytics && analytics.charts.passRateByJudge.length > 0 ? (
      <div className={`chart-wrap ${expanded ? "chart-wrap-expanded" : ""}`}>
        <ResponsiveContainer width="100%" height={expanded ? 460 : 320}>
          <BarChart data={analytics.charts.passRateByJudge}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="judgeName" interval={0} angle={expanded ? 0 : -15} textAnchor={expanded ? "middle" : "end"} height={expanded ? 48 : 60} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="passRate"
              name="Pass rate %"
              fill="#166c4a"
              radius={[12, 12, 0, 0]}
              animationDuration={700}
              onClick={(datum) =>
                updateSearch({
                  judgeIds: filters.judgeIds[0] === datum.judgeId && filters.judgeIds.length === 1 ? [] : [datum.judgeId],
                })
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="muted">No judge data for this filter set.</p>
    );

  const renderTrendChart = (expanded = false) =>
    analytics && analytics.charts.evaluationsOverTime.length > 0 ? (
      <div className={`chart-wrap ${expanded ? "chart-wrap-expanded" : ""}`}>
        <ResponsiveContainer width="100%" height={expanded ? 460 : 320}>
          <LineChart data={analytics.charts.evaluationsOverTime}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, 100]} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="passRate" name="Pass rate %" stroke="#166c4a" strokeWidth={3} dot={expanded} animationDuration={700} />
            <Line yAxisId="right" type="monotone" dataKey="completedCount" name="Completed evals" stroke="#18222f" strokeWidth={2} animationDuration={700} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="muted">No time-series data for this filter set.</p>
    );

  const renderVerdictChart = (expanded = false) =>
    analytics && !analytics.charts.verdictDistribution.every((datum) => datum.count === 0) ? (
      <div className={`chart-wrap ${expanded ? "chart-wrap-expanded" : ""}`}>
        <ResponsiveContainer width="100%" height={expanded ? 460 : 320}>
          <PieChart>
            <Pie
              data={analytics.charts.verdictDistribution}
              dataKey="count"
              nameKey="verdict"
              innerRadius={expanded ? 95 : 70}
              outerRadius={expanded ? 145 : 110}
              paddingAngle={4}
              animationDuration={700}
              onClick={(datum) =>
                updateSearch({
                  verdicts: filters.verdicts[0] === datum.verdict && filters.verdicts.length === 1 ? [] : [datum.verdict],
                })
              }
            >
              {analytics.charts.verdictDistribution.map((entry) => (
                <Cell key={entry.verdict} fill={verdictColors[entry.verdict]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="muted">No verdict distribution to show yet.</p>
    );

  const renderQuestionChart = (expanded = false) =>
    analytics && analytics.charts.passRateByQuestion.length > 0 ? (
      <div className={`chart-wrap ${expanded ? "chart-wrap-expanded" : ""}`}>
        <ResponsiveContainer width="100%" height={expanded ? 520 : 360}>
          <BarChart layout="vertical" data={expanded ? analytics.charts.passRateByQuestion : analytics.charts.passRateByQuestion.slice(0, 8)}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="questionText" width={expanded ? 260 : 180} />
            <Tooltip />
            <Bar
              dataKey="passRate"
              name="Pass rate %"
              fill="#40698a"
              radius={[0, 12, 12, 0]}
              animationDuration={700}
              onClick={(datum) =>
                updateSearch({
                  questionTemplateIds:
                    filters.questionTemplateIds[0] === datum.questionTemplateId && filters.questionTemplateIds.length === 1
                      ? []
                      : [datum.questionTemplateId],
                })
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="muted">No question data for this filter set.</p>
    );

  const expandedContent =
    expandedChart === "judge"
      ? renderJudgeChart(true)
      : expandedChart === "trend"
        ? renderTrendChart(true)
        : expandedChart === "verdict"
          ? renderVerdictChart(true)
          : expandedChart === "question"
            ? renderQuestionChart(true)
            : null;

  return (
    <div className="stack analytics-page">
      <Card
        title="Analytics"
        actions={refreshing ? <span className="table-subtext">Updating…</span> : null}
      >
        <div className="analytics-hero">
          <div>
            <p className="analytics-eyebrow">Dashboard</p>
            <p className="table-subtext">
              Analytics shows aggregated patterns and trends. Use Results for row-level inspection and delete actions.
            </p>
          </div>
          <div className="analytics-hero-note">
            <strong>{analytics?.summary.completedCount ?? 0}</strong>
            <span>Completed evals in current view</span>
          </div>
        </div>
      </Card>

      <Card title="Filters">
        <div className="analytics-filter-grid">
          <label className="field">
            <span>Queue</span>
            <select value={filters.queueId} onChange={(event) => updateSearch({ queueId: event.target.value })}>
              <option value="">All queues</option>
              {(available?.queues ?? []).map((queue) => (
                <option key={queue.id} value={queue.id}>
                  {queue.label}
                </option>
              ))}
            </select>
          </label>
          <div className="field analytics-preset-field">
            <span>Time window</span>
            <div className="analytics-preset-row">
              {presetOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`button ${filters.preset === option.id ? "button-primary" : ""}`}
                  onClick={() => updateSearch({ preset: option.id })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {filters.preset === "custom" ? (
            <>
              <label className="field">
                <span>Start date</span>
                <input type="date" value={filters.startDate} onChange={(event) => updateSearch({ preset: "custom", startDate: event.target.value })} />
              </label>
              <label className="field">
                <span>End date</span>
                <input type="date" value={filters.endDate} onChange={(event) => updateSearch({ preset: "custom", endDate: event.target.value })} />
              </label>
            </>
          ) : null}
        </div>
        {available ? (
          <div className="stack">
            <div>
              <p className="filter-label">Judges</p>
              <MultiSelectChips
                options={available.judges.map((judge) => ({ id: judge.id, label: judge.name }))}
                selected={filters.judgeIds}
                onChange={(next) => updateSearch({ judgeIds: next })}
              />
            </div>
            <div>
              <p className="filter-label">Questions</p>
              <MultiSelectChips
                options={available.questions.map((question) => ({ id: question.id, label: question.text }))}
                selected={filters.questionTemplateIds}
                onChange={(next) => updateSearch({ questionTemplateIds: next })}
              />
            </div>
            <div>
              <p className="filter-label">Verdicts</p>
              <MultiSelectChips
                options={["pass", "fail", "inconclusive", "failed"].map((verdict) => ({ id: verdict, label: verdict }))}
                selected={filters.verdicts}
                onChange={(next) => updateSearch({ verdicts: next })}
              />
            </div>
          </div>
        ) : null}
      </Card>

      {loading ? <p>Loading analytics…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {analytics ? (
        <>
          <section className="analytics-section">
            <div className="analytics-section-header">
              <div>
                <h2>Overview</h2>
                <p className="table-subtext">Start with the key numbers and the highest-signal comparisons.</p>
              </div>
            </div>
            <div className="analytics-kpi-grid">
              <KpiCard label="Pass rate" value={`${analytics.summary.passRate}%`} emphasis />
              <KpiCard label="Completed evals" value={String(analytics.summary.completedCount)} />
              <KpiCard label="Failed evals" value={String(analytics.summary.failedCount)} />
              <KpiCard label="Attachments used" value={`${analytics.summary.attachmentsUsedRate}%`} />
              <KpiCard
                label="Latest result"
                value={analytics.summary.lastCreatedAt ? new Date(analytics.summary.lastCreatedAt).toLocaleString() : "None"}
              />
            </div>
            <div className="analytics-grid analytics-grid-hero">
              <AnalyticsChartCard
                title={chartMeta.judge.title}
                subtitle={chartMeta.judge.subtitle}
                onExpand={(event) => openExpanded("judge", event)}
              >
                {renderJudgeChart(false)}
              </AnalyticsChartCard>
              <AnalyticsChartCard
                title={chartMeta.trend.title}
                subtitle={chartMeta.trend.subtitle}
                onExpand={(event) => openExpanded("trend", event)}
              >
                {renderTrendChart(false)}
              </AnalyticsChartCard>
            </div>
          </section>

          <section className="analytics-section">
            <div className="analytics-section-header">
              <div>
                <h2>Breakdowns</h2>
                <p className="table-subtext">Drill into verdict mix and question-level behavior without leaving the dashboard.</p>
              </div>
            </div>
            <div className="analytics-grid">
              <AnalyticsChartCard
                title={chartMeta.verdict.title}
                subtitle={chartMeta.verdict.subtitle}
                onExpand={(event) => openExpanded("verdict", event)}
              >
                {renderVerdictChart(false)}
              </AnalyticsChartCard>
              <AnalyticsChartCard
                title={chartMeta.question.title}
                subtitle={chartMeta.question.subtitle}
                onExpand={(event) => openExpanded("question", event)}
              >
                {renderQuestionChart(false)}
              </AnalyticsChartCard>
            </div>
          </section>
        </>
      ) : null}

      {expandedChart ? (
        <div className="modal-backdrop" onClick={() => setExpandedChart(null)}>
          <div
            ref={modalRef}
            className="modal-shell analytics-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="analytics-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="analytics-modal-title">{chartMeta[expandedChart].title}</h2>
                <p className="table-subtext">{chartMeta[expandedChart].subtitle}</p>
              </div>
              <button ref={closeButtonRef} type="button" className="button" onClick={() => setExpandedChart(null)}>
                Close
              </button>
            </div>
            {expandedContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Small KPI card used in the analytics overview row.
 */
function KpiCard(props: { label: string; value: string; emphasis?: boolean }) {
  return (
    <Card>
      <div className={`kpi-card ${props.emphasis ? "kpi-card-emphasis" : ""}`}>
        <strong>{props.value}</strong>
        <span>{props.label}</span>
      </div>
    </Card>
  );
}

/**
 * Shared chart-card wrapper used by the inline analytics dashboard.
 */
function AnalyticsChartCard(props: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onExpand: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Card
      actions={
        <button type="button" className="button" onClick={props.onExpand}>
          Expand
        </button>
      }
    >
      <div className="analytics-chart-card">
        <div className="analytics-chart-copy">
          <h3>{props.title}</h3>
          <p className="table-subtext">{props.subtitle}</p>
        </div>
        {props.children}
      </div>
    </Card>
  );
}
