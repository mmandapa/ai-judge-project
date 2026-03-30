import type {
  AnalyticsJudgeDatum,
  AnalyticsQuestionDatum,
  AnalyticsResponse,
  AnalyticsSummary,
  AnalyticsTimeSeriesDatum,
  AnalyticsVerdictDatum,
  EvaluationRow,
} from "./types.js";

type AnalyticsInput = {
  rows: EvaluationRow[];
  availableFilters: AnalyticsResponse["availableFilters"];
  timeBucket?: "hour" | "day";
};

function completedRows(rows: EvaluationRow[]) {
  return rows.filter((row) => row.status === "completed");
}

function buildSummary(rows: EvaluationRow[]): AnalyticsSummary {
  const completed = completedRows(rows);
  const passCount = completed.filter((row) => row.verdict === "pass").length;
  const inconclusiveCount = completed.filter((row) => row.verdict === "inconclusive").length;
  const failedCount = rows.filter((row) => row.status === "failed").length;
  const attachmentsUsedCount = rows.filter((row) => row.attachmentsUsed).length;
  const completedCount = completed.length;
  const lastCreatedAt = rows.length > 0 ? rows.map((row) => row.createdAt).sort().at(-1) ?? null : null;

  return {
    passRate: completedCount === 0 ? 0 : Math.round((passCount / completedCount) * 100),
    passCount,
    completedCount,
    failedCount,
    inconclusiveCount,
    attachmentsUsedCount,
    attachmentsUsedRate: rows.length === 0 ? 0 : Math.round((attachmentsUsedCount / rows.length) * 100),
    lastCreatedAt,
  };
}

function buildPassRateByJudge(rows: EvaluationRow[]): AnalyticsJudgeDatum[] {
  const grouped = new Map<string, AnalyticsJudgeDatum>();

  for (const row of rows) {
    const current = grouped.get(row.judgeId) ?? {
      judgeId: row.judgeId,
      judgeName: row.judgeName,
      passRate: 0,
      passCount: 0,
      completedCount: 0,
      failedCount: 0,
    };

    if (row.status === "completed") {
      current.completedCount += 1;
      if (row.verdict === "pass") {
        current.passCount += 1;
      }
    } else {
      current.failedCount += 1;
    }

    grouped.set(row.judgeId, current);
  }

  return [...grouped.values()]
    .map((datum) => ({
      ...datum,
      passRate: datum.completedCount === 0 ? 0 : Math.round((datum.passCount / datum.completedCount) * 100),
    }))
    .sort((left, right) => right.passRate - left.passRate || right.completedCount - left.completedCount);
}

function buildPassRateByQuestion(rows: EvaluationRow[]): AnalyticsQuestionDatum[] {
  const grouped = new Map<string, AnalyticsQuestionDatum>();

  for (const row of rows) {
    const current = grouped.get(row.questionTemplateId) ?? {
      questionTemplateId: row.questionTemplateId,
      questionText: row.questionText,
      passRate: 0,
      passCount: 0,
      completedCount: 0,
      failedCount: 0,
    };

    if (row.status === "completed") {
      current.completedCount += 1;
      if (row.verdict === "pass") {
        current.passCount += 1;
      }
    } else {
      current.failedCount += 1;
    }

    grouped.set(row.questionTemplateId, current);
  }

  return [...grouped.values()]
    .map((datum) => ({
      ...datum,
      passRate: datum.completedCount === 0 ? 0 : Math.round((datum.passCount / datum.completedCount) * 100),
    }))
    .sort((left, right) => right.passRate - left.passRate || right.completedCount - left.completedCount);
}

function buildVerdictDistribution(rows: EvaluationRow[]): AnalyticsVerdictDatum[] {
  const counts: Record<AnalyticsVerdictDatum["verdict"], number> = {
    pass: 0,
    fail: 0,
    inconclusive: 0,
    failed: 0,
  };

  for (const row of rows) {
    if (row.status === "failed") {
      counts.failed += 1;
    } else {
      counts[row.verdict] += 1;
    }
  }

  return (Object.entries(counts) as Array<[AnalyticsVerdictDatum["verdict"], number]>).map(([verdict, count]) => ({
    verdict,
    count,
  }));
}

function bucketDate(createdAt: string, timeBucket: "hour" | "day") {
  const date = new Date(createdAt);
  if (timeBucket === "hour") {
    date.setMinutes(0, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
}

function formatBucketLabel(bucket: string, timeBucket: "hour" | "day") {
  const date = new Date(bucket);
  return timeBucket === "hour"
    ? date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function buildEvaluationsOverTime(rows: EvaluationRow[], timeBucket: "hour" | "day"): AnalyticsTimeSeriesDatum[] {
  const grouped = new Map<string, AnalyticsTimeSeriesDatum>();

  for (const row of rows) {
    const bucket = bucketDate(row.createdAt, timeBucket);
    const current = grouped.get(bucket) ?? {
      bucket,
      label: formatBucketLabel(bucket, timeBucket),
      passCount: 0,
      failCount: 0,
      inconclusiveCount: 0,
      failedCount: 0,
      completedCount: 0,
      passRate: 0,
    };

    if (row.status === "failed") {
      current.failedCount += 1;
    } else {
      current.completedCount += 1;
      if (row.verdict === "pass") current.passCount += 1;
      if (row.verdict === "fail") current.failCount += 1;
      if (row.verdict === "inconclusive") current.inconclusiveCount += 1;
    }

    grouped.set(bucket, current);
  }

  return [...grouped.values()]
    .sort((left, right) => left.bucket.localeCompare(right.bucket))
    .map((datum) => ({
      ...datum,
      passRate: datum.completedCount === 0 ? 0 : Math.round((datum.passCount / datum.completedCount) * 100),
    }));
}

export function buildAnalyticsResponse(input: AnalyticsInput): AnalyticsResponse {
  const timeBucket = input.timeBucket ?? "day";
  return {
    summary: buildSummary(input.rows),
    charts: {
      passRateByJudge: buildPassRateByJudge(input.rows),
      passRateByQuestion: buildPassRateByQuestion(input.rows),
      verdictDistribution: buildVerdictDistribution(input.rows),
      evaluationsOverTime: buildEvaluationsOverTime(input.rows, timeBucket),
    },
    availableFilters: input.availableFilters,
    timeBucket,
  };
}
