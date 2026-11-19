import { z } from "zod";

/**
 * 「まだ聞いていない事前定義質問のうち、回答者の発言ですでに答えが出たもの」を
 * 判定するための小さなAI呼び出し用のプロンプトとスキーマ。
 *
 * インタビュアー本体のAIに任せるだけだと、軽いモデルでは見落として同じことを
 * 聞き直すことがあるため、長めの回答が来たときに別途チェックする。
 */
export const coveredQuestionsSchema = z.object({
  covered_question_ids: z
    .array(z.string())
    .describe("回答者の発言で、すでに実質的に答えが出ている質問のID"),
});

export type CoveredQuestionsResult = z.infer<typeof coveredQuestionsSchema>;

/** この文字数以上の回答が来たときだけチェックする（短い回答では他の質問に触れにくい） */
export const COVERED_CHECK_MIN_CHARS = 40;

const MAX_TURNS = 12;
const MAX_CHARS_PER_MESSAGE = 800;

export function buildCoveredQuestionsPrompt(params: {
  remainingQuestions: Array<{ id: string; question: string }>;
  messages: Array<{ role: string; content: string }>;
}): { system: string; user: string } {
  const transcript = params.messages
    .slice(-MAX_TURNS)
    .map(
      (m) =>
        `${m.role === "user" ? "回答者" : "インタビュアー"}: ${m.content.slice(0, MAX_CHARS_PER_MESSAGE)}`
    )
    .join("\n");
  const list = params.remainingQuestions
    .map((q) => `- [ID: ${q.id}] ${q.question}`)
    .join("\n");
  return {
    system: [
      "あなたはインタビューの進行補助です。",
      "まだ聞いていない質問のリストと会話を読み、回答者がすでに自分から答えている質問を選びます。",
      "回答者が質問の中心になる点（例: 価格の質問なら価格の感じ方、購入意向の質問なら買いたいかどうか）について、はっきり意見を述べている場合だけ選んでください。",
      "例: 「絶対手に入れたい」「自分用にも買いたい」「プレゼントに買いたい」と言っていれば、購入意向の質問は答え済みです。「ちょっと高い」「手頃」と言っていれば、価格の感じ方の質問は答え済みです。",
      "少し触れただけ、関連する話題が出ただけの場合は選ばないでください（例: 「九谷五彩っていうんでしたっけ」だけでは、前から知っていたかは答えていません）。",
      "質問に複数の点や具体的な条件（例: 「英語の説明書や桐箱があれば買いたいか」）が含まれる場合は、その全部に答えているときだけ選んでください。「買いたい」と言っただけでは、条件についての質問は答え済みではありません。",
      "迷う場合は選ばないでください（聞き漏らすより、軽く確かめる方がよいため）。",
      "該当がなければ空の配列を返してください。",
    ].join("\n"),
    user: `まだ聞いていない質問:\n${list}\n\n会話:\n${transcript}`,
  };
}

/** AIが返したIDのうち、実在する「まだ聞いていない質問」だけを残す */
export function filterCoveredIds(
  ids: string[],
  remainingQuestions: Array<{ id: string }>
): string[] {
  const valid = new Set(remainingQuestions.map((q) => q.id));
  return [...new Set(ids.filter((id) => valid.has(id)))];
}
