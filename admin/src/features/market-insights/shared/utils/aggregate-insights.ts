import type { InsightSummary, RespondentInsight } from "../schemas";

export type LanguageKey = RespondentInsight["language"];

export const LANGUAGE_LABELS: Record<LanguageKey, string> = {
  ja: "日本語",
  en: "英語",
  zh: "中国語",
  ko: "韓国語",
  other: "その他",
};

export type CountMap<K extends string> = Record<K, number>;

export interface Breakdown {
  overall: CountMap<RespondentInsight["overall"]>;
  purchaseIntent: CountMap<RespondentInsight["purchaseIntent"]>;
  giftIntent: CountMap<RespondentInsight["giftIntent"]>;
  priceImpression: CountMap<RespondentInsight["priceImpression"]>;
}

export interface LanguageRow {
  language: LanguageKey;
  count: number;
  breakdown: Breakdown;
}

export interface Theme {
  label: string;
  count: number;
}

export interface MarketInsightsAggregate {
  total: number;
  breakdown: Breakdown;
  byLanguage: LanguageRow[];
  positiveThemes: Theme[];
  negativeThemes: Theme[];
  priceComments: string[];
}

function emptyBreakdown(): Breakdown {
  return {
    overall: { positive: 0, neutral: 0, negative: 0 },
    purchaseIntent: { yes: 0, maybe: 0, no: 0, unknown: 0 },
    giftIntent: { yes: 0, maybe: 0, no: 0, unknown: 0 },
    priceImpression: { cheap: 0, fair: 0, expensive: 0, unknown: 0 },
  };
}

function addTo(b: Breakdown, r: RespondentInsight) {
  b.overall[r.overall] += 1;
  b.purchaseIntent[r.purchaseIntent] += 1;
  b.giftIntent[r.giftIntent] += 1;
  b.priceImpression[r.priceImpression] += 1;
}

/**
 * テーマの人数は、AIが返した回答者番号を重複なく数える（AIに数を言わせない）。
 * 範囲外の番号は捨てる。人数の多い順。
 */
export function countThemes(
  themes: InsightSummary["positiveThemes"],
  total: number
): Theme[] {
  return themes
    .map((t) => ({
      label: t.label,
      count: new Set(
        t.respondents.filter((i) => Number.isInteger(i) && i >= 1 && i <= total)
      ).size,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function aggregateInsights(
  insights: RespondentInsight[],
  summary: InsightSummary | null
): MarketInsightsAggregate {
  const breakdown = emptyBreakdown();
  const langMap = new Map<LanguageKey, LanguageRow>();
  for (const r of insights) {
    addTo(breakdown, r);
    let row = langMap.get(r.language);
    if (!row) {
      row = { language: r.language, count: 0, breakdown: emptyBreakdown() };
      langMap.set(r.language, row);
    }
    row.count += 1;
    addTo(row.breakdown, r);
  }
  return {
    total: insights.length,
    breakdown,
    byLanguage: [...langMap.values()].sort((a, b) => b.count - a.count),
    positiveThemes: summary
      ? countThemes(summary.positiveThemes, insights.length)
      : [],
    negativeThemes: summary
      ? countThemes(summary.negativeThemes, insights.length)
      : [],
    priceComments: insights
      .map((r) => r.priceComment.trim())
      .filter((c) => c.length > 0),
  };
}

/** 割合（%）。分母0なら0 */
export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
