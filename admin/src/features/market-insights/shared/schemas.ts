import { z } from "zod";

/** 回答者1人分の読み取り結果（AIが会話から抽出する） */
export const respondentInsightSchema = z.object({
  language: z
    .enum(["ja", "en", "zh", "ko", "other"])
    .describe("回答者が会話で使った言語"),
  overall: z
    .enum(["positive", "neutral", "negative"])
    .describe("トピック（商品・文化）への全体の反応"),
  purchaseIntent: z
    .enum(["yes", "maybe", "no", "unknown"])
    .describe("自分用に買いたいか。会話で触れていなければ unknown"),
  giftIntent: z
    .enum(["yes", "maybe", "no", "unknown"])
    .describe("ギフトやお土産にしたいか。触れていなければ unknown"),
  priceImpression: z
    .enum(["cheap", "fair", "expensive", "unknown"])
    .describe("価格の印象。触れていなければ unknown"),
  priceComment: z
    .string()
    .describe("価格について具体的に言ったこと（日本語で短く）。なければ空文字"),
  positives: z
    .array(z.string())
    .max(5)
    .describe("良いと言った点。日本語の短い名詞句（例: 色合いが美しい）"),
  negatives: z
    .array(z.string())
    .max(5)
    .describe("不満・懸念・改善してほしい点。日本語の短い名詞句"),
  quoteOriginal: z
    .string()
    .describe(
      "いちばん印象的な回答者の発言を原文のまま（1〜2文）。なければ空文字"
    ),
  quoteJa: z
    .string()
    .describe("quoteOriginal の日本語訳（原文が日本語なら同じ文）"),
  oneLine: z.string().describe("この回答者の反応を日本語1文で"),
});

export type RespondentInsight = z.infer<typeof respondentInsightSchema>;

/** 全体のまとめ（回答者ごとの読み取りから、AIが論点をまとめる） */
export const insightSummarySchema = z.object({
  positiveThemes: z
    .array(
      z.object({
        label: z.string().describe("良い点のテーマ（日本語の短い句）"),
        respondents: z
          .array(z.number().int())
          .describe("このテーマを挙げた回答者の番号"),
      })
    )
    .max(8),
  negativeThemes: z
    .array(
      z.object({
        label: z.string().describe("不満・懸念のテーマ（日本語の短い句）"),
        respondents: z.array(z.number().int()),
      })
    )
    .max(8),
  highlightRespondents: z
    .array(z.number().int())
    .max(5)
    .describe("引用として見せたい回答者の番号（印象的で多様なもの）"),
  summary: z.string().describe("全体の反応のまとめ（日本語、3〜5文）"),
  nextActions: z
    .array(z.string())
    .max(5)
    .describe("海外展開に向けて次にやるとよいこと（日本語、具体的に）"),
});

export type InsightSummary = z.infer<typeof insightSummarySchema>;
