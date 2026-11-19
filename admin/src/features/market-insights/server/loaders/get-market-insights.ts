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
  extractRespondentInsightsBatch,
  summarizeInsights,
} from "../services/market-insights-ai";

export interface RespondentInsightRow {
  sessionId: string;
  insight: RespondentInsight;
}

export interface RespondentProfileRow {
  country: string | null;
  ageRange: string | null;
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
/** 1回のリクエストでまとめて読み取る人数 */
const BATCH_SIZE = 8;

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

  type Item = (typeof withReport)[number];
  const toSource = ({ session, report }: Item) => ({
    summary: report.summary,
    messages: (bySession.get(session.id) ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });
  const extractOne = async (item: Item) => {
    try {
      const insight = await extractRespondentInsight(
        `${item.report.id}:${item.report.updated_at}`,
        { topicTitle, ...toSource(item) }
      );
      return { sessionId: item.session.id, insight };
    } catch (error) {
      console.error(
        `[MarketInsights] extract failed session=${item.session.id}`,
        error
      );
      return null;
    }
  };

  const batches: Item[][] = [];
  for (let i = 0; i < withReport.length; i += BATCH_SIZE) {
    batches.push(withReport.slice(i, i + BATCH_SIZE));
  }
  const batchResults = await mapWithConcurrency(
    batches,
    CONCURRENCY,
    async (batch) => {
      try {
        const key = batch
          .map((b) => `${b.report.id}:${b.report.updated_at}`)
          .join(",");
        const insights = await extractRespondentInsightsBatch(
          key,
          topicTitle,
          batch.map(toSource)
        );
        return batch.map((b, i) => ({
          sessionId: b.session.id,
          insight: insights[i],
        }));
      } catch (error) {
        // まとめて読めなければ1人ずつ読む
        console.error("[MarketInsights] batch failed, falling back", error);
        return mapWithConcurrency(batch, CONCURRENCY, extractOne);
      }
    }
  );
  const extracted = batchResults.flat();
  const respondents = extracted.filter(
    (r): r is RespondentInsightRow => r !== null
  );
  const insights = respondents.map((r) => r.insight);
  // 回答者が言語選択の直後に答えた国・年代（集計用）
  const profileBySession = new Map(
    withReport.map(({ session }) => [
      session.id,
      {
        country: session.respondent_country ?? null,
        ageRange: session.respondent_age_range ?? null,
      },
    ])
  );
  const profiles = respondents.map(
    (r) =>
      profileBySession.get(r.sessionId) ?? { country: null, ageRange: null }
  );

  let summary: InsightSummary | null = null;
  if (insights.length > 0) {
    try {
      summary = await summarizeInsights(topicTitle, insights);
    } catch (error) {
      console.error("[MarketInsights] summary failed", error);
    }
  }

  return {
    aggregate: aggregateInsights(insights, summary, profiles),
    summary,
    respondents,
    failedCount: withReport.length - respondents.length,
    incompleteCount: sessions.length - withReport.length,
  };
}
