import { describe, expect, it } from "vitest";
import {
  buildInsightSummaryPrompt,
  buildRespondentInsightPrompt,
} from "./build-insight-prompts";

describe("buildRespondentInsightPrompt", () => {
  it("会話を話者つきで並べる", () => {
    const { user } = buildRespondentInsightPrompt({
      topicTitle: "九谷焼",
      summary: null,
      messages: [
        { role: "assistant", content: "How do you like it?" },
        { role: "user", content: "Beautiful colors!" },
      ],
    });
    expect(user).toContain("トピック: 九谷焼");
    expect(user).toContain("インタビュアー: How do you like it?");
    expect(user).toContain("回答者: Beautiful colors!");
  });
});

describe("buildInsightSummaryPrompt", () => {
  it("回答者に番号を振る", () => {
    const { user } = buildInsightSummaryPrompt("九谷焼", [
      {
        language: "en",
        overall: "positive",
        purchaseIntent: "yes",
        giftIntent: "unknown",
        priceImpression: "fair",
        priceComment: "",
        positives: ["色が美しい"],
        negatives: [],
        quoteOriginal: "",
        quoteJa: "",
        oneLine: "気に入った",
      },
    ]);
    expect(user).toContain("#1 言語=en");
    expect(user).toContain("良い点: 色が美しい");
  });
});
