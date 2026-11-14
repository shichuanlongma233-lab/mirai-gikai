import "server-only";

import { generateObject } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import { type TopicDraft, topicDraftSchema } from "../../shared/schemas";
import { normalizeTopicDraft } from "../../shared/utils/normalize-topic-draft";
import { buildTopicDraftPrompt } from "../utils/build-topic-draft-prompt";

const DRAFT_GENERATION_TIMEOUT_MS = 240_000;

/**
 * 資料本文からトピック記事とインタビュー設定の下書きを生成する。
 */
export async function generateTopicDraft(params: {
  documentText: string;
  instructions?: string;
}): Promise<TopicDraft> {
  const { system, user } = buildTopicDraftPrompt(params);

  const { object } = await generateObject({
    model: AI_MODELS.gpt5_2,
    schema: topicDraftSchema,
    system,
    messages: [{ role: "user", content: user }],
    // サーバーの実行上限（300秒）より前に打ち切り、原因をログに残せるようにする
    abortSignal: AbortSignal.timeout(DRAFT_GENERATION_TIMEOUT_MS),
    maxRetries: 1,
  });

  return normalizeTopicDraft(object);
}
