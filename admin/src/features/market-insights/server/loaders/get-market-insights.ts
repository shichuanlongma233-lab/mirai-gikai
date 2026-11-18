import "server-only";

import {
  findAllInterviewMessagesBySessionIds,
  findAllInterviewSessionsWithReportByConfigId,
} from "@/features/interview-reports/server/repositories/interview-report-repository";
import type { InsightSummary, RespondentInsight } from "../../shared/schemas";
import {
  aggregateInsights,
  type MarketInsightsAggregate,
} from "../../shared/utils/aggregate-insights";
import {
  extractRespondentInsight,
  summarizeInsights,
} from "../services/market-insights-ai";

export interface RespondentInsightRow {
  sessionId: string;
  insight: RespondentInsight;
}

export interface MarketInsights {
  aggregate: MarketInsightsAggregate;
  summary: InsightSummary | null;
  respondents: RespondentInsightRow[];
  /** 読み取りに失敗した回答者の数（無料枠の上限など） */
  failedCount: number;
  /** 完了していない（レポートのない）セッションの数 */
  incompleteCount: number;
}

/** 無料枠の毎分上限に当たりにくいよう、同時に投げる数を絞る */
const CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

export async function getMarketInsights(
  configId: string,
  topicTitle: string
): Promise<MarketInsights> {
  const sessions = await findAllInterviewSessionsWithReportByConfigId(configId);
  const withReport = sessions.flatMap((s) => {
    const report = Array.isArray(s.interview_report)
      ? s.interview_report[0]
      : s.interview_report;
    return report ? [{ session: s, report }] : [];
  });
  const messages = await findAllInterviewMessagesBySessionIds(
    withReport.map((r) => r.session.id)
  );
  const bySession = new Map<string, typeof messages>();
  for (const m of messages) {
    const list = bySession.get(m.interview_session_id) ?? [];
    list.push(m);
    bySession.set(m.interview_session_id, list);
  }

  const extracted = await mapWithConcurrency(
    withReport,
    CONCURRENCY,
    async ({ session, report }) => {
      try {
        const insight = await extractRespondentInsight(
          `${report.id}:${report.updated_at}`,
          {
            topicTitle,
            summary: report.summary,
            messages: (bySession.get(session.id) ?? []).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }
        );
        return { sessionId: session.id, insight };
      } catch (error) {
        console.error(
          `[MarketInsights] extract failed session=${session.id}`,
          error
        );
        return null;
      }
    }
  );
  const respondents = extracted.filter(
    (r): r is RespondentInsightRow => r !== null
  );
  const insights = respondents.map((r) => r.insight);

  let summary: InsightSummary | null = null;
  if (insights.length > 0) {
    try {
      summary = await summarizeInsights(topicTitle, insights);
    } catch (error) {
      console.error("[MarketInsights] summary failed", error);
    }
  }

  return {
    aggregate: aggregateInsights(insights, summary),
    summary,
    respondents,
    failedCount: withReport.length - respondents.length,
    incompleteCount: sessions.length - withReport.length,
  };
}
