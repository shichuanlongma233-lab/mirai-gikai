import "server-only";

import { createHash } from "node:crypto";
import { generateObject } from "ai";
import { unstable_cache } from "next/cache";
import { DEFAULT_MODERATION_MODEL } from "@/lib/ai/models";
import {
  type InsightSummary,
  insightSummarySchema,
  type RespondentInsight,
  respondentInsightSchema,
} from "../../shared/schemas";
import { z } from "zod";
import {
  buildBatchRespondentInsightPrompt,
  buildInsightSummaryPrompt,
  buildRespondentInsightPrompt,
  type RespondentSource,
} from "../../shared/utils/build-insight-prompts";

const CACHE_SECONDS = 60 * 60 * 24 * 30;

/**
 * 回答者1人分を読み取る。レポートIDと更新日時が同じなら結果を使い回す
 * （無料枠のリクエスト数を節約するため）。
 */
export function extractRespondentInsight(
  cacheKey: string,
  source: RespondentSource
): Promise<RespondentInsight> {
  return unstable_cache(
    async () => {
      const { system, user } = buildRespondentInsightPrompt(source);
      const { object } = await generateObject({
        model: DEFAULT_MODERATION_MODEL,
        schema: respondentInsightSchema,
        system,
        messages: [{ role: "user", content: user }],
        maxRetries: 2,
      });
      return object;
    },
    ["market-insight-respondent-v1", cacheKey],
    { revalidate: CACHE_SECONDS }
  )();
}

/**
 * 複数の回答者を1回のリクエストでまとめて読み取る。cacheKey が同じなら使い回す。
 * 返ってきた件数が合わなければ失敗扱い（呼び出し側で1人ずつに切り替える）。
 */
export function extractRespondentInsightsBatch(
  cacheKey: string,
  topicTitle: string,
  sources: Array<Omit<RespondentSource, "topicTitle">>
): Promise<RespondentInsight[]> {
  return unstable_cache(
    async () => {
      const { system, user } = buildBatchRespondentInsightPrompt(
        topicTitle,
        sources
      );
      const { object } = await generateObject({
        model: DEFAULT_MODERATION_MODEL,
        schema: z.object({ respondents: z.array(respondentInsightSchema) }),
        system,
        messages: [{ role: "user", content: user }],
        maxRetries: 2,
      });
      if (object.respondents.length !== sources.length) {
        throw new Error(
          `batch size mismatch: expected ${sources.length}, got ${object.respondents.length}`
        );
      }
      return object.respondents;
    },
    ["market-insight-batch-v1", cacheKey],
    { revalidate: CACHE_SECONDS }
  )();
}

/** 全員分の読み取りから、テーマ・まとめ・次の一手を作る。入力が同じなら使い回す */
export function summarizeInsights(
  topicTitle: string,
  insights: RespondentInsight[]
): Promise<InsightSummary> {
  const hash = createHash("sha256")
    .update(JSON.stringify([topicTitle, insights]))
    .digest("hex")
    .slice(0, 32);
  return unstable_cache(
    async () => {
      const { system, user } = buildInsightSummaryPrompt(topicTitle, insights);
      const { object } = await generateObject({
        model: DEFAULT_MODERATION_MODEL,
        schema: insightSummarySchema,
        system,
        messages: [{ role: "user", content: user }],
        maxRetries: 2,
      });
      return object;
    },
    ["market-insight-summary-v1", hash],
    { revalidate: CACHE_SECONDS }
  )();
}
