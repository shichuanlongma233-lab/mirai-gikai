/**
 * 聞き手の文の最終チェック（プログラムで行う）。
 * 通らなければ1回だけ書き直してもらう。
 */

export const MAX_TEXT_LENGTH = 300;
/** 1回のインタビューで書き直してよい回数 */
export const MAX_REWRITES_PER_INTERVIEW = 3;
/** これ以上似ていたら「前と同じ質問」とみなす */
const DUPLICATE_SIMILARITY = 0.7;

export type CheckProblem =
  | "empty"
  | "too_long"
  | "multiple_questions"
  | "duplicate";

export const CHECK_FIX_HINTS: Record<CheckProblem, string> = {
  empty: "文が空でした。質問を1つ書く。",
  too_long: `長すぎます。${MAX_TEXT_LENGTH}字以内、3文以内にする。`,
  multiple_questions: "質問が2つ以上入っています。質問を1つだけにする。",
  duplicate:
    "前にした質問とほぼ同じです。同じ聞き方をせず、今回の点だけを別の言い方で聞く。",
};

/** 疑問符の数（全角・半角） */
export function countQuestionMarks(text: string): number {
  return (text.match(/[?？]/gu) ?? []).length;
}

function bigrams(text: string): Set<string> {
  const t = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}]+/gu, "");
  const out = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
}

/** 2つの文の似ている度合い（0〜1、文字の2つ組の重なり） */
export function similarity(a: string, b: string): number {
  const x = bigrams(a);
  const y = bigrams(b);
  if (x.size === 0 || y.size === 0) return 0;
  let inter = 0;
  for (const g of x) if (y.has(g)) inter++;
  return inter / (x.size + y.size - inter);
}

/** 文の最後の質問部分（あいさつ・相づちを除いて比べるため） */
export function lastSentence(text: string): string {
  const parts = text
    .trim()
    .split(/(?<=[。.!！?？])\s*/u)
    .filter((p) => p.trim().length > 0);
  return parts[parts.length - 1] ?? text;
}

export function checkWriterText(
  text: string,
  askedTexts: string[]
): CheckProblem | null {
  const t = text.trim();
  if (!t) return "empty";
  if (t.length > MAX_TEXT_LENGTH) return "too_long";
  if (countQuestionMarks(t) > 1) return "multiple_questions";
  const q = lastSentence(t);
  if (askedTexts.some((prev) => similarity(lastSentence(prev), q) >= DUPLICATE_SIMILARITY)) {
    return "duplicate";
  }
  return null;
}
