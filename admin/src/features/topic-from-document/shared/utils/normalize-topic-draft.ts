import { OTHER_FREE_TEXT_OPTION } from "@/features/interview-config/shared/utils/default-questions-template";
import type { TopicDraft } from "../schemas";

/** 保存先（bills / bill_contents / interview_*）の文字数上限 */
export const TOPIC_DRAFT_LIMITS = {
  name: 200,
  title: 200,
  summary: 500,
  content: 50_000,
  configName: 100,
  question: 1000,
  followUpGuide: 2000,
} as const;

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function cleanList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

/**
 * LLM が生成した下書きを保存できる形に整える。
 * 文字数を上限に切り詰め、空の質問・重複した選択肢を除き、
 * 選択肢のある質問には「その他（自由記述）」を末尾に付ける。
 */
export function normalizeTopicDraft(draft: TopicDraft): TopicDraft {
  return {
    name: clip(draft.name, TOPIC_DRAFT_LIMITS.name),
    title: clip(draft.title, TOPIC_DRAFT_LIMITS.title),
    summary: clip(draft.summary, TOPIC_DRAFT_LIMITS.summary),
    content: clip(draft.content, TOPIC_DRAFT_LIMITS.content),
    config_name: clip(draft.config_name, TOPIC_DRAFT_LIMITS.configName),
    themes: cleanList(draft.themes),
    questions: draft.questions
      .map((q) => {
        const choices = cleanList(q.quick_replies).filter(
          (r) => r !== OTHER_FREE_TEXT_OPTION
        );
        return {
          question: clip(q.question, TOPIC_DRAFT_LIMITS.question),
          follow_up_guide: clip(
            q.follow_up_guide,
            TOPIC_DRAFT_LIMITS.followUpGuide
          ),
          quick_replies:
            choices.length > 0 ? [...choices, OTHER_FREE_TEXT_OPTION] : [],
        };
      })
      .filter((q) => q.question.length > 0),
  };
}
