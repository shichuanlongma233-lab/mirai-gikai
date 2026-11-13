import { z } from "zod";

/**
 * 資料から生成するトピック（議案）とインタビュー設定の下書き。
 *
 * LLM の出力スキーマ兼、画面で編集する下書きの形。
 * 構造化出力は任意項目を扱いにくいため、項目はすべて必須にし、
 * 「無し」は空文字・空配列で表す。文字数の上限は LLM が守りきれず
 * パースに失敗するため、ここでは課さずに normalizeTopicDraft で切り詰める。
 */
export const topicDraftSchema = z.object({
  name: z
    .string()
    .describe("トピック名。資料の主題を一言で表す名前（40文字程度まで）"),
  title: z
    .string()
    .describe(
      "記事タイトル。一般の人が興味を持てる平易な見出し（60文字程度まで）"
    ),
  summary: z
    .string()
    .describe("記事の要約。200〜300文字程度。資料の要点を中立的にまとめる"),
  content: z
    .string()
    .describe(
      "記事本文（Markdown）。見出し（##）と箇条書きを使い、資料の背景・ポイント・論点・影響を受ける人を中立的に解説する。2,000〜5,000文字程度"
    ),
  config_name: z
    .string()
    .describe(
      "インタビュー設定名。例:『〇〇についての意見募集』（30文字程度まで）"
    ),
  themes: z
    .array(z.string())
    .describe("インタビューで深掘りしたいテーマ（論点）を3〜6件"),
  questions: z
    .array(
      z.object({
        question: z.string().describe("回答者に投げかける質問文"),
        follow_up_guide: z
          .string()
          .describe(
            "AIインタビュアー向けの深掘り指針。何を引き出したいか、どこで次の質問に進むか"
          ),
        quick_replies: z
          .array(z.string())
          .describe(
            "選択式で答えやすい質問のクイックリプライ。自由回答の質問は空配列"
          ),
      })
    )
    .describe("インタビュー質問を5〜8問。答えやすい質問から順に並べる"),
});

export type TopicDraft = z.infer<typeof topicDraftSchema>;
export type TopicDraftQuestion = TopicDraft["questions"][number];

/**
 * 下書きを保存するときの入力。画面で編集した下書きを、保存先と同じ基準で検証する。
 */
export const createTopicFromDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "トピック名は必須です")
    .max(200, "トピック名は200文字以内で入力してください"),
  title: z.string().max(200, "タイトルは200文字以内で入力してください"),
  summary: z.string().max(500, "要約は500文字以内で入力してください"),
  content: z.string().max(50_000, "本文は50,000文字以内で入力してください"),
  config_name: z
    .string()
    .trim()
    .min(1, "インタビュー設定名は必須です")
    .max(100, "インタビュー設定名は100文字以内で入力してください"),
  themes: z.array(z.string().trim().min(1)),
  questions: z
    .array(
      z.object({
        question: z
          .string()
          .trim()
          .min(1, "質問文は必須です")
          .max(1000, "質問文は1000文字以内で入力してください"),
        follow_up_guide: z
          .string()
          .max(2000, "フォローアップ指針は2000文字以内で入力してください"),
        quick_replies: z.array(z.string().trim().min(1)),
      })
    )
    .min(1, "質問を1問以上入れてください"),
  knowledge_source: z
    .string()
    .max(40_000, "ナレッジソースは40,000文字以内で入力してください"),
});

export type CreateTopicFromDraftInput = z.input<
  typeof createTopicFromDraftSchema
>;
