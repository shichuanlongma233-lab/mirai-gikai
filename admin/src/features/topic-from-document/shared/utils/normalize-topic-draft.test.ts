import { describe, expect, it } from "vitest";
import { OTHER_FREE_TEXT_OPTION } from "@/features/interview-config/shared/utils/default-questions-template";
import type { TopicDraft } from "../schemas";
import {
  normalizeTopicDraft,
  TOPIC_DRAFT_LIMITS,
} from "./normalize-topic-draft";

const baseDraft: TopicDraft = {
  name: " トピック ",
  title: "タイトル",
  summary: "要約",
  content: "本文",
  config_name: "設定",
  themes: ["論点A", " 論点A ", "", "論点B"],
  questions: [
    {
      question: "関心のあるテーマは？",
      follow_up_guide: "指針",
      quick_replies: ["A", "A", " ", OTHER_FREE_TEXT_OPTION, "B"],
    },
    { question: "理由は？", follow_up_guide: "", quick_replies: [] },
    { question: "  ", follow_up_guide: "", quick_replies: [] },
  ],
};

describe("normalizeTopicDraft", () => {
  it("前後の空白を除き、空や重複のテーマを除く", () => {
    const result = normalizeTopicDraft(baseDraft);
    expect(result.name).toBe("トピック");
    expect(result.themes).toEqual(["論点A", "論点B"]);
  });

  it("選択肢のある質問には「その他（自由記述）」を末尾に1つだけ付ける", () => {
    const result = normalizeTopicDraft(baseDraft);
    expect(result.questions[0].quick_replies).toEqual([
      "A",
      "B",
      OTHER_FREE_TEXT_OPTION,
    ]);
  });

  it("自由回答の質問は選択肢を空のままにし、空の質問は除く", () => {
    const result = normalizeTopicDraft(baseDraft);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[1].quick_replies).toEqual([]);
  });

  it("保存先の文字数上限で切り詰める", () => {
    const result = normalizeTopicDraft({
      ...baseDraft,
      summary: "あ".repeat(TOPIC_DRAFT_LIMITS.summary + 10),
    });
    expect(result.summary).toHaveLength(TOPIC_DRAFT_LIMITS.summary);
  });
});
