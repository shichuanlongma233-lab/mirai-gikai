import { describe, expect, it } from "vitest";
import {
  buildCoveredQuestionsPrompt,
  filterCoveredIds,
  pickCoveredIds,
  resolveNextStage,
} from "./covered-questions";

describe("buildCoveredQuestionsPrompt", () => {
  it("未質問のリストと会話を含める", () => {
    const { user } = buildCoveredQuestionsPrompt({
      remainingQuestions: [{ id: "q3", question: "価格はどう感じますか" }],
      messages: [
        { role: "assistant", content: "第一印象は？" },
        { role: "user", content: "きれい。3300円は手頃" },
      ],
    });
    expect(user).toContain("[ID: q3] 価格はどう感じますか");
    expect(user).toContain("回答者: きれい。3300円は手頃");
  });
});

describe("filterCoveredIds", () => {
  it("存在しないIDと重複を捨てる", () => {
    expect(
      filterCoveredIds(["q3", "q3", "zz"], [{ id: "q3" }, { id: "q4" }])
    ).toEqual(["q3"]);
  });
});

describe("pickCoveredIds", () => {
  it("答えていない点が残る質問は済みにしない", () => {
    expect(
      pickCoveredIds(
        {
          checks: [
            { id: "q4", answered_parts: ["買いたい"], unanswered_parts: [] },
            {
              id: "q5",
              answered_parts: ["買いたい"],
              unanswered_parts: ["英語の説明書と桐箱があればどうか"],
            },
            { id: "q6", answered_parts: [], unanswered_parts: [] },
          ],
        },
        [{ id: "q4" }, { id: "q5" }, { id: "q6" }]
      )
    ).toEqual(["q4"]);
  });
});

describe("resolveNextStage", () => {
  it("質問で終わる発言で summary に進もうとしたら chat に戻す", () => {
    expect(resolveNextStage("summary", "どんな場面で使いたいですか？", "chat")).toBe("chat");
    expect(resolveNextStage("summary", "Which scene? ", "chat")).toBe("chat");
  });
  it("質問でなければそのまま", () => {
    expect(resolveNextStage("summary", "ここまでの内容をまとめます。", "chat")).toBe("summary");
    expect(resolveNextStage("chat", "いかがですか？", "chat")).toBe("chat");
    expect(resolveNextStage("summary_complete", "いいですか？", "summary")).toBe("summary_complete");
  });
});
