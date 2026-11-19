import { parseMessageContent } from "./message-utils";

/**
 * すでに聞いた質問IDを収集する
 */
export function collectAskedQuestionIds(
  messages: Array<{ role: string; content: string }>
): Set<string> {
  const askedQuestionIds = new Set<string>();
  for (const m of messages) {
    if (m.role === "assistant") {
      const { questionId } = parseMessageContent(m.content);
      if (questionId) {
        askedQuestionIds.add(questionId);
      }
      // 聞く前に回答者の発言で答えが出た質問も「済み」にして、重ねて聞かない
      for (const id of parseCoveredQuestionIds(m.content)) {
        askedQuestionIds.add(id);
      }
    }
  }
  return askedQuestionIds;
}

function parseCoveredQuestionIds(content: string): string[] {
  try {
    const parsed = JSON.parse(content);
    const ids = parsed?.covered_question_ids;
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string" && id !== "")
      : [];
  } catch {
    return [];
  }
}
