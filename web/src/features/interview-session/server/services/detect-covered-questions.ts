import "server-only";

import {
  buildCoveredQuestionsPrompt,
  COVERED_CHECK_MIN_CHARS,
  coveredQuestionsSchema,
  filterCoveredIds,
} from "@mirai-gikai/shared/interview-prompts/covered-questions";
import { generateObject, type LanguageModel } from "ai";

const TIMEOUT_MS = 8000;

/**
 * 長めの回答が来たとき、まだ聞いていない事前定義質問のうち回答者がすでに
 * 答えたものを判定する。失敗やタイムアウトのときは空配列（インタビューは止めない）。
 */
export async function detectCoveredQuestions(params: {
  model: LanguageModel;
  remainingQuestions: Array<{ id: string; question: string }>;
  messages: Array<{ role: string; content: string }>;
  lastUserMessage: string | undefined;
}): Promise<string[]> {
  const { remainingQuestions, lastUserMessage } = params;
  if (
    remainingQuestions.length === 0 ||
    !lastUserMessage ||
    lastUserMessage.trim().length < COVERED_CHECK_MIN_CHARS
  ) {
    return [];
  }
  try {
    const { system, user } = buildCoveredQuestionsPrompt({
      remainingQuestions,
      messages: params.messages,
    });
    const { object } = await generateObject({
      model: params.model,
      schema: coveredQuestionsSchema,
      system,
      messages: [{ role: "user", content: user }],
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return filterCoveredIds(object.covered_question_ids, remainingQuestions);
  } catch (error) {
    console.warn("[detectCoveredQuestions] skipped:", error);
    return [];
  }
}

/** 保存するAIの出力(JSON)に、判定済みの質問IDを足す。JSONでなければそのまま返す */
export function mergeCoveredIntoContent(
  content: string,
  coveredIds: string[]
): string {
  if (coveredIds.length === 0) return content;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null) return content;
    const existing = Array.isArray(parsed.covered_question_ids)
      ? parsed.covered_question_ids
      : [];
    parsed.covered_question_ids = [...new Set([...existing, ...coveredIds])];
    return JSON.stringify(parsed);
  } catch {
    return content;
  }
}
