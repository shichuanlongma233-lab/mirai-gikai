import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { setCoveredInContent } from "./detect-covered-questions";

describe("setCoveredInContent", () => {
  it("covered_question_ids を判定済みのIDに置き換える", () => {
    const out = setCoveredInContent(
      '{"text":"x","covered_question_ids":["q9"]}',
      ["q3", "q4"]
    );
    expect(JSON.parse(out).covered_question_ids).toEqual(["q3", "q4"]);
  });
  it("判定済みがなければ自己申告を消す", () => {
    const out = setCoveredInContent(
      '{"text":"x","covered_question_ids":["q9"]}',
      []
    );
    expect(JSON.parse(out).covered_question_ids).toBeNull();
  });
  it("変更不要・JSONでない場合はそのまま", () => {
    expect(setCoveredInContent('{"text":"x"}', [])).toBe('{"text":"x"}');
    expect(setCoveredInContent("plain", ["q1"])).toBe("plain");
  });
});
