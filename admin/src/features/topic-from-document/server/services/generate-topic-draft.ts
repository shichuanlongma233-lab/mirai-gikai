import "server-only";

import { generateObject } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import { type TopicDraft, topicDraftSchema } from "../../shared/schemas";
import { normalizeTopicDraft } from "../../shared/utils/normalize-topic-draft";
import { buildTopicDraftPrompt } from "../utils/build-topic-draft-prompt";

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
  });

  return normalizeTopicDraft(object);
}
