import { pointMemoOf, POINT_STATUS_LABELS_JA, type AnswerMemo } from "./memo";
import { orderedPillars, type PillarSet } from "./schema";

/**
 * 回答メモを、まとめ（レポート）を作るAIに渡す文にする。
 * まとめはこのメモをもとに作り、メモにない答えを足さない。
 */
export function memoToSummaryText(set: PillarSet, memo: AnswerMemo): string {
  const lines: string[] = [];
  for (const pillar of orderedPillars(set)) {
    lines.push(`### ${pillar.name}（${pillar.intent}）`);
    for (const point of pillar.points) {
      const pm = pointMemoOf(memo, point.id);
      const head = `- ${point.name}: ${POINT_STATUS_LABELS_JA[pm.status]}`;
      const detail = [
        pm.value ? `答え「${pm.value}」` : null,
        pm.quote ? `本人の言葉「${pm.quote}」` : null,
        pm.status === "partial" && pm.missing ? `未回答: ${pm.missing}` : null,
      ]
        .filter(Boolean)
        .join(" / ");
      lines.push(detail ? `${head} … ${detail}` : head);
    }
  }
  return lines.join("\n");
}

/** まとめ用システムプロンプトの末尾に足す指示 */
export function buildMemoSummaryInstruction(
  set: PillarSet,
  memo: AnswerMemo
): string {
  return `

## 回答メモ（まとめはこれをもとに作る）
インタビュー中に記録した、聞きたい点ごとの回答状況です。
- まとめ（レポート）の内容は、このメモと会話にある回答者の発言だけから作る。
- 「まだ」「答えたくない」「対象外」の点について、答えたことにしない。
- 推測で答えを足さない。

${memoToSummaryText(set, memo)}`;
}
