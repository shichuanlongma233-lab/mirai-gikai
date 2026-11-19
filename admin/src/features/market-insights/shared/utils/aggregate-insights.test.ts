import { describe, expect, it } from "vitest";
import type { RespondentInsight } from "../schemas";
import {
  aggregateByProfile,
  aggregateInsights,
  countThemes,
  percent,
} from "./aggregate-insights";

function insight(over: Partial<RespondentInsight> = {}): RespondentInsight {
  return {
    language: "en",
    overall: "positive",
    purchaseIntent: "unknown",
    giftIntent: "unknown",
    priceImpression: "unknown",
    priceComment: "",
    positives: [],
    negatives: [],
    quoteOriginal: "",
    quoteJa: "",
    oneLine: "",
    ...over,
  };
}

describe("countThemes", () => {
  it("回答者番号を重複なく数え、範囲外は捨て、多い順に並べる", () => {
    const themes = countThemes(
      [
        { label: "色", respondents: [1, 1, 2] },
        { label: "重さ", respondents: [1, 2, 3] },
        { label: "幻", respondents: [0, 9] },
      ],
      3
    );
    expect(themes).toEqual([
      { label: "重さ", count: 3 },
      { label: "色", count: 2 },
    ]);
  });
});

describe("aggregateInsights", () => {
  it("全体と言語ごとに数える", () => {
    const a = aggregateInsights(
      [
        insight({
          language: "en",
          purchaseIntent: "yes",
          priceComment: "高め",
        }),
        insight({
          language: "en",
          overall: "negative",
          priceImpression: "expensive",
        }),
        insight({ language: "zh", giftIntent: "maybe" }),
      ],
      null
    );
    expect(a.total).toBe(3);
    expect(a.breakdown.overall).toEqual({
      positive: 2,
      neutral: 0,
      negative: 1,
    });
    expect(a.breakdown.purchaseIntent.yes).toBe(1);
    expect(a.breakdown.purchaseIntent.unknown).toBe(2);
    expect(a.byLanguage.map((r) => [r.language, r.count])).toEqual([
      ["en", 2],
      ["zh", 1],
    ]);
    expect(a.byLanguage[0].breakdown.priceImpression.expensive).toBe(1);
    expect(a.priceComments).toEqual(["高め"]);
    expect(a.positiveThemes).toEqual([]);
  });

  it("回答がなければ0件", () => {
    expect(aggregateInsights([], null).total).toBe(0);
  });
});

describe("percent", () => {
  it("分母0なら0", () => {
    expect(percent(1, 0)).toBe(0);
    expect(percent(1, 3)).toBe(33);
  });
});

describe("aggregateByProfile", () => {
  const base = insight({ purchaseIntent: "yes", priceImpression: "fair" });
  it("国は人数順・年代は若い順、答えていない人は最後", () => {
    const insights = [
      base,
      base,
      { ...base, overall: "negative" as const },
      base,
    ];
    const { byCountry, byAge } = aggregateByProfile(insights, [
      { country: "US", ageRange: "30s" },
      { country: "US", ageRange: "20s" },
      { country: "GB", ageRange: null },
      { country: null, ageRange: "60plus" },
    ]);
    expect(byCountry.map((r) => [r.key, r.count])).toEqual([
      ["US", 2],
      ["GB", 1],
      ["none", 1],
    ]);
    expect(byCountry[0].label).toBe("アメリカ合衆国");
    expect(byCountry[1].breakdown.overall.negative).toBe(1);
    expect(byAge.map((r) => r.label)).toEqual([
      "20代",
      "30代",
      "60代以上",
      "答えていない",
    ]);
  });
  it("プロフィールがなければ全員「答えていない」", () => {
    const a = aggregateInsights([base], null);
    expect(a.byCountry).toEqual([
      expect.objectContaining({ key: "none", count: 1 }),
    ]);
  });
});
