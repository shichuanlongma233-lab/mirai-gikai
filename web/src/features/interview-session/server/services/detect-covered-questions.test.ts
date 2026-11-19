import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mergeCoveredIntoContent } from "./detect-covered-questions";

describe("mergeCoveredIntoContent", () => {
  it("JSONに判定済みIDを重複なく足す", () => {
    const out = mergeCoveredIntoContent(
      JSON.stringify({ text: "x", covered_question_ids: ["q1"] }),
      ["q1", "q2"]
    );
    expect(JSON.parse(out).covered_question_ids).toEqual(["q1", "q2"]);
  });

  it("IDがなければ、またはJSONでなければそのまま", () => {
    expect(mergeCoveredIntoContent('{"text":"x"}', [])).toBe('{"text":"x"}');
    expect(mergeCoveredIntoContent("plain", ["q1"])).toBe("plain");
  });
});
