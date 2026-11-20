import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../repositories/interview-session-repository", () => ({
  findInterviewSessionAnswerMemo: vi.fn(),
  updateInterviewSessionAnswerMemo: vi.fn(),
}));
vi.mock("@/features/chat/server/services/cost-tracker", () => ({
  recordChatUsage: vi.fn(),
}));

import type { InterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import {
  buildMaterial,
  engineResultToContent,
  getMemoPillars,
} from "./memo-engine";

const PILLARS = {
  goal: "g",
  audience: "a",
  pillars: [
    {
      id: "p",
      name: "柱",
      intent: "意図",
      points: [
        { id: "p.1", name: "点", question: "質問？", answeredWhen: "条件" },
      ],
    },
  ],
};

function config(overrides: Partial<InterviewConfig>): InterviewConfig {
  return {
    question_engine: "memo",
    pillars: PILLARS,
    pillars_version: 3,
    ...overrides,
  } as InterviewConfig;
}

describe("getMemoPillars", () => {
  it("回答メモ方式で柱が正しければ柱と版を返す", () => {
    const r = getMemoPillars(config({}));
    expect(r?.version).toBe(3);
    expect(r?.set.pillars[0].points[0].id).toBe("p.1");
  });
  it("従来方式・柱なし・壊れた柱なら null（従来の進め方で動く）", () => {
    expect(getMemoPillars(config({ question_engine: "classic" }))).toBeNull();
    expect(getMemoPillars(config({ pillars: null }))).toBeNull();
    expect(getMemoPillars(config({ pillars: { goal: "x" } }))).toBeNull();
    expect(getMemoPillars(null)).toBeNull();
  });
});

describe("engineResultToContent", () => {
  it("画面が読む形（question_id=点 / topic_title=柱）で出す", () => {
    const json = JSON.parse(
      engineResultToContent({
        text: "質問？",
        quickReplies: ["A"],
        action: { kind: "ask", pointId: "p.1", mode: "first" },
        // biome-ignore lint/suspicious/noExplicitAny: 出力に入らない
        memo: {} as any,
        nextStage: "chat",
        pointId: "p.1",
        pillarName: "柱",
        utterance: null,
        updates: [],
      })
    );
    expect(json).toMatchObject({
      text: "質問？",
      quick_replies: ["A"],
      question_id: "p.1",
      topic_title: "柱",
      next_stage: "chat",
    });
    expect(json.memo).toBeUndefined();
  });
});

describe("buildMaterial", () => {
  it("タイトルと概要を300字までにまとめる", () => {
    const m = buildMaterial({
      name: "n",
      bill_content: { title: "九谷焼", summary: "あ".repeat(400) },
      // biome-ignore lint/suspicious/noExplicitAny: 必要な項目だけ
    } as any);
    expect(m.startsWith("九谷焼\n")).toBe(true);
    expect(m.length).toBe(300);
  });
});
