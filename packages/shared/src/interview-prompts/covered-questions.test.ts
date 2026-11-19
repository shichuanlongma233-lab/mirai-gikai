import { describe, expect, it } from "vitest";
import {
  buildCoveredQuestionsPrompt,
  filterCoveredIds,
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
