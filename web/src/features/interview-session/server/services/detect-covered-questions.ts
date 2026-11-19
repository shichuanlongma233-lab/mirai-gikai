import "server-only";

import {
  buildCoveredQuestionsPrompt,
  COVERED_CHECK_MIN_CHARS,
  coveredQuestionsSchema,
  pickCoveredIds,
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
    return pickCoveredIds(object, remainingQuestions);
  } catch (error) {
    console.warn("[detectCoveredQuestions] skipped:", error);
    return [];
  }
}

/**
 * 保存するAIの出力(JSON)の covered_question_ids を、別判定で確かめた質問IDに置き換える。
 * インタビュアー本体の自己申告は、条件つきの質問まで済みにしてしまうことがあるため使わない。
 * JSONでなければそのまま返す。
 */
export function setCoveredInContent(
  content: string,
  coveredIds: string[]
): string {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null) return content;
    if (coveredIds.length === 0 && !("covered_question_ids" in parsed)) {
      return content;
    }
    parsed.covered_question_ids = coveredIds.length > 0 ? coveredIds : null;
    return JSON.stringify(parsed);
  } catch {
    return content;
  }
}
