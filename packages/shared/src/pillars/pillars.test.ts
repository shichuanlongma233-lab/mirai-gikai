import { describe, expect, it } from "vitest";
import { checkWriterText, similarity } from "./check";
import { csvToPillarSetInput, pillarSetToCsv } from "./csv";
import { type EngineDeps, runTurn, startInterview } from "./engine";
import {
  applyUpdates,
  createMemo,
  markNotApplicable,
  matchShownChoice,
  memoProgress,
} from "./memo";
import { planNextAction, recordAction } from "./planner";
import type { RecorderOutput, WriterOutput } from "./prompts";
import { type PillarSet, pillarSetSchema } from "./schema";
import { memoToSummaryText } from "./summary";
import { parseAskIf, validatePillarSet } from "./validate";

const SAMPLE = {
  goal: "九谷焼の豆皿を米国で売る価格と売り方を決める",
  audience: "米国の30〜50代、和食器に関心がある人",
  durationMinutes: 10,
  pillars: [
    {
      id: "first",
      name: "第一印象",
      intent: "見た目で手に取るか",
      points: [
        {
          id: "first.impression",
          name: "第一印象",
          question: "この豆皿を見て、最初にどう感じましたか？",
          answeredWhen: "見た目への感想が1つ以上ある",
          notAnsweredExamples: ["いいね"],
        },
      ],
    },
    {
      id: "purchase",
      name: "購入意向",
      intent: "買うかどうか",
      points: [
        {
          id: "purchase.intent",
          name: "買いたいか",
          question: "この豆皿を買いたいと思いますか？",
          answeredWhen: "買う・迷う・買わないのどれかが分かる",
          answerType: "choice",
          choices: ["買う", "迷う", "買わない"],
          followUp: { max: 1, ask: "そう思った理由" },
        },
      ],
    },
    {
      id: "price",
      name: "価格",
      intent: "価格の受け止め方",
      askIf: "purchase.intent!=買わない",
      points: [
        {
          id: "price.feel",
          name: "価格の感じ方",
          question: "22ドルという価格をどう感じますか？",
          answeredWhen: "安い・妥当・高いのどれかが分かる",
          answerType: "choice",
          choices: [
            "安い",
            "妥当",
            { label: "高すぎて買わない", fills: ["price.feel", "price.max"] },
          ],
        },
        {
          id: "price.max",
          name: "出せる上限",
          question: "いくらまでなら出しますか？",
          answeredWhen: "金額が分かる",
          answerType: "number",
          unit: "USD",
          required: false,
        },
      ],
    },
  ],
};

function sampleSet(): PillarSet {
  return pillarSetSchema.parse(SAMPLE);
}

const T0 = new Date("2026-11-20T00:00:00Z");
const minutesLater = (m: number) => new Date(T0.getTime() + m * 60000);

describe("validatePillarSet", () => {
  it("正しい柱は取り込める", () => {
    const r = validatePillarSet(SAMPLE);
    expect(r.ok).toBe(true);
  });

  it("id の重複・選択肢なし・存在しない参照をエラーにする", () => {
    const bad = structuredClone(SAMPLE) as typeof SAMPLE;
    bad.pillars[1].points[0].choices = [];
    bad.pillars[2].askIf = "nope=x";
    // biome-ignore lint/suspicious/noExplicitAny: テスト用に壊す
    (bad.pillars[0].points[0] as any).overlapsWith = ["ghost"];
    // biome-ignore lint/suspicious/noExplicitAny: テスト用に壊す
    (bad.pillars[2] as any).id = "first";
    const r = validatePillarSet(bad);
    expect(r.ok).toBe(false);
    const messages = r.issues.map((i) => i.message).join("\n");
    expect(messages).toContain("重複");
    expect(messages).toContain("選択肢がありません");
    expect(messages).toContain("ghost");
    expect(messages).toContain("nope");
  });

  it("必須項目がなければエラー", () => {
    const r = validatePillarSet({ goal: "x", audience: "y", pillars: [] });
    expect(r.ok).toBe(false);
  });

  it("時間に収まらないのは警告だけ", () => {
    const many = structuredClone(SAMPLE);
    many.durationMinutes = 2;
    const r = validatePillarSet(many);
    expect(r.ok).toBe(true);
    expect(r.issues.some((i) => i.level === "warning")).toBe(true);
  });

  it("askIf を読む", () => {
    expect(parseAskIf("purchase.intent!=買わない|迷う")).toEqual({
      pointId: "purchase.intent",
      negate: true,
      values: ["買わない", "迷う"],
    });
    expect(parseAskIf("だめ")).toBeNull();
  });
});

describe("CSV", () => {
  it("書き出したCSVを取り込むと同じ柱に戻る", () => {
    const set = sampleSet();
    const csv = pillarSetToCsv(set);
    const back = csvToPillarSetInput(csv, {
      goal: set.goal,
      audience: set.audience,
      durationMinutes: set.durationMinutes,
    });
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    const r = validatePillarSet(back.data);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.set.pillars.map((p) => p.id)).toEqual(["first", "purchase", "price"]);
    const feel = r.set.pillars[2].points[0];
    expect(feel.choices[2]).toEqual({
      label: "高すぎて買わない",
      fills: ["price.feel", "price.max"],
    });
    expect(r.set.pillars[2].askIf).toBe("purchase.intent!=買わない");
    expect(r.set.pillars[2].points[1].required).toBe(false);
  });

  it("引用符の中のカンマと改行を読む", () => {
    const csv =
      'pillar_id,pillar_name,intent,point_id,point_name,question,answered_when\n' +
      'a,柱A,意図,a.1,点,"質問, その1\n続き",条件\n';
    const r = csvToPillarSetInput(csv, { goal: "g", audience: "a" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // biome-ignore lint/suspicious/noExplicitAny: 組み立て途中の形
    expect((r.data as any).pillars[0].points[0].question).toBe(
      "質問, その1\n続き"
    );
  });

  it("必要な列がなければ読めない", () => {
    const r = csvToPillarSetInput("a,b\n1,2\n", { goal: "g", audience: "a" });
    expect(r.ok).toBe(false);
  });
});

describe("回答メモと進行係", () => {
  it("最初は設定順で最初の点を聞く", () => {
    const set = sampleSet();
    const memo = createMemo(set, T0);
    expect(planNextAction({ set, memo, now: T0 })).toEqual({
      kind: "ask",
      pointId: "first.impression",
      mode: "first",
    });
  });

  it("引用のない「答えた」は採用しない", () => {
    const set = sampleSet();
    const memo = createMemo(set, T0);
    const next = applyUpdates(
      memo,
      [
        {
          id: "first.impression",
          status: "answered",
          value: "きれい",
          quote: null,
          missing: null,
          depth: "enough",
        },
      ],
      set
    );
    expect(next.points["first.impression"].status).toBe("unasked");
  });

  it("先に話した点は確かめずに飛ばす", () => {
    const set = sampleSet();
    let memo = recordAction(createMemo(set, T0), {
      kind: "ask",
      pointId: "first.impression",
      mode: "first",
    });
    memo = applyUpdates(
      memo,
      [
        {
          id: "first.impression",
          status: "answered",
          value: "色がきれい",
          quote: "色がとてもきれい",
          missing: null,
          depth: "enough",
        },
        {
          id: "purchase.intent",
          status: "answered",
          value: "買う",
          quote: "ぜひ買いたい",
          missing: null,
          depth: "enough",
        },
      ],
      set
    );
    expect(memo.points["purchase.intent"].volunteered).toBe(true);
    expect(planNextAction({ set, memo, now: minutesLater(1) })).toEqual({
      kind: "ask",
      pointId: "price.feel",
      mode: "first",
    });
  });

  it("一部だけの答えは、足りない部分を先に聞く（上限まで）", () => {
    const set = sampleSet();
    let memo = recordAction(createMemo(set, T0), {
      kind: "ask",
      pointId: "first.impression",
      mode: "first",
    });
    memo = applyUpdates(
      memo,
      [
        {
          id: "first.impression",
          status: "partial",
          value: null,
          quote: "うーん",
          missing: "見た目の感想",
          depth: null,
        },
      ],
      set
    );
    const a = planNextAction({ set, memo, now: minutesLater(1) });
    expect(a).toEqual({ kind: "ask", pointId: "first.impression", mode: "missing" });
    memo = recordAction(memo, a);
    // 深掘りの上限(1)に達したら次へ
    expect(planNextAction({ set, memo, now: minutesLater(2) })).toMatchObject({
      pointId: "purchase.intent",
      mode: "first",
    });
  });

  it("浅い答えには理由を1回だけ聞く", () => {
    const set = sampleSet();
    let memo = recordAction(createMemo(set, T0), {
      kind: "ask",
      pointId: "purchase.intent",
      mode: "first",
    });
    memo = applyUpdates(
      memo,
      [
        {
          id: "purchase.intent",
          status: "answered",
          value: "迷う",
          quote: "迷う",
          missing: null,
          depth: "shallow",
        },
      ],
      set
    );
    const a = planNextAction({ set, memo, now: minutesLater(1) });
    expect(a).toEqual({ kind: "ask", pointId: "purchase.intent", mode: "reason" });
    memo = recordAction(memo, a);
    expect(planNextAction({ set, memo, now: minutesLater(2) }).kind).toBe("ask");
    expect(planNextAction({ set, memo, now: minutesLater(2) })).not.toMatchObject({
      pointId: "purchase.intent",
    });
  });

  it("「買わない」なら価格の柱は対象外になり、分母から外れる", () => {
    const set = sampleSet();
    let memo = createMemo(set, T0);
    memo = applyUpdates(
      memo,
      [
        {
          id: "first.impression",
          status: "answered",
          value: "x",
          quote: "x",
          missing: null,
          depth: "enough",
        },
        {
          id: "purchase.intent",
          status: "answered",
          value: "買わない",
          quote: "買わない",
          missing: null,
          depth: "enough",
        },
      ],
      set
    );
    memo = markNotApplicable(set, memo);
    expect(memo.points["price.feel"].status).toBe("not_applicable");
    expect(memoProgress(set, memo)).toMatchObject({ total: 2, answered: 2 });
    expect(planNextAction({ set, memo, now: minutesLater(1) })).toEqual({
      kind: "summary",
      reason: "done",
    });
  });

  it("時間切れ・終わりたいときはまとめ", () => {
    const set = sampleSet();
    const memo = createMemo(set, T0);
    expect(planNextAction({ set, memo, now: minutesLater(14) })).toEqual({
      kind: "summary",
      reason: "time",
    });
    expect(
      planNextAction({ set, memo, now: T0, userWantsToEnd: true })
    ).toEqual({ kind: "summary", reason: "user_end" });
  });

  it("残り時間が少ないと任意の点を省く", () => {
    const set = sampleSet();
    let memo = createMemo(set, T0);
    for (const id of ["first.impression", "purchase.intent", "price.feel"]) {
      memo = applyUpdates(
        memo,
        [{ id, status: "answered", value: "妥当", quote: "q", missing: null, depth: "enough" }],
        set
      );
    }
    expect(planNextAction({ set, memo, now: minutesLater(5) })).toMatchObject({
      pointId: "price.max",
    });
    expect(planNextAction({ set, memo, now: minutesLater(9) })).toEqual({
      kind: "summary",
      reason: "done",
    });
  });

  it("選択肢ボタンはAIなしで埋め、fills の点もまとめて埋める", () => {
    const memo = {
      ...createMemo(sampleSet(), T0),
      shownChoices: [
        { shown: "Too expensive", label: "高すぎて買わない", fills: ["price.feel", "price.max"] },
      ],
    };
    const u = matchShownChoice(memo, "too expensive");
    expect(u?.map((x) => x.id)).toEqual(["price.feel", "price.max"]);
    expect(u?.[0].value).toBe("高すぎて買わない");
    expect(matchShownChoice(memo, "maybe")).toBeNull();
  });

  it("まとめ用の文に状態と引用が入る", () => {
    const set = sampleSet();
    const memo = applyUpdates(
      createMemo(set, T0),
      [{ id: "purchase.intent", status: "answered", value: "買う", quote: "買いたい", missing: null, depth: "enough" }],
      set
    );
    const text = memoToSummaryText(set, memo);
    expect(text).toContain("買いたいか: 答えた");
    expect(text).toContain("本人の言葉「買いたい」");
    expect(text).toContain("第一印象: まだ");
  });
});

describe("最終チェック", () => {
  it("質問が2つ・長すぎ・前と同じを見つける", () => {
    expect(checkWriterText("どう思いますか？いくらですか？", [])).toBe(
      "multiple_questions"
    );
    expect(checkWriterText("あ".repeat(301), [])).toBe("too_long");
    expect(
      checkWriterText("ありがとうございます。この豆皿を買いたいと思いますか？", [
        "この豆皿を買いたいと思いますか？",
      ])
    ).toBe("duplicate");
    expect(checkWriterText("いくらまでなら出しますか？", ["この豆皿を買いたいと思いますか？"])).toBeNull();
  });

  it("似ている度合い", () => {
    expect(similarity("abc", "abc")).toBe(1);
    expect(similarity("abcd", "wxyz")).toBe(0);
  });
});

describe("engine", () => {
  function fakeDeps(
    recorder: (prompt: string) => RecorderOutput,
    writer: (prompt: string) => WriterOutput,
    now = () => T0
  ): EngineDeps & { recordCalls: number; writeCalls: number } {
    const d = {
      recordCalls: 0,
      writeCalls: 0,
      now,
      record: async ({ prompt }: { prompt: string }) => {
        d.recordCalls++;
        return recorder(prompt);
      },
      write: async ({ prompt }: { prompt: string }) => {
        d.writeCalls++;
        return writer(prompt);
      },
    };
    return d;
  }

  const ctx = () => ({ set: sampleSet(), locale: "en" as const, material: "九谷焼の豆皿" });

  it("最初の質問を作り、選択肢は訳を使う", async () => {
    const deps = fakeDeps(
      () => ({ utterance: "answer", updates: [] }),
      () => ({ text: "Hi! What was your first impression?", quick_replies: null })
    );
    const r = await startInterview(ctx(), deps);
    expect(r.pointId).toBe("first.impression");
    expect(r.nextStage).toBe("chat");
    expect(r.memo.points["first.impression"].asked).toBe(1);
    expect(r.memo.askedTexts).toHaveLength(1);
  });

  it("選択肢を押したら記録係を呼ばずに次へ進む", async () => {
    let deps = fakeDeps(
      () => ({ utterance: "answer", updates: [] }),
      () => ({ text: "Would you buy it?", quick_replies: ["Yes", "Maybe", "No"] })
    );
    const memo = recordAction(createMemo(sampleSet(), T0), {
      kind: "ask",
      pointId: "first.impression",
      mode: "first",
    });
    memo.points["first.impression"] = {
      ...memo.points["first.impression"],
      status: "answered",
      quote: "pretty",
      depth: "enough",
    };
    const r1 = await runTurn(ctx(), deps, {
      memo,
      userMessage: "pretty colors because of the gold",
      lastQuestion: "first?",
      recent: [],
    });
    expect(r1.pointId).toBe("purchase.intent");
    expect(r1.quickReplies).toEqual(["Yes", "Maybe", "No"]);

    deps = fakeDeps(
      () => {
        throw new Error("記録係は呼ばれないはず");
      },
      () => ({ text: "How do you feel about $22?", quick_replies: ["Cheap", "Fair", "Too expensive"] })
    );
    const r2 = await runTurn(ctx(), deps, {
      memo: r1.memo,
      userMessage: "No",
      lastQuestion: r1.text,
      recent: [],
    });
    expect(deps.recordCalls).toBe(0);
    expect(r2.memo.points["purchase.intent"].value).toBe("買わない");
    // 買わない → 価格の柱は対象外 → まとめ
    expect(r2.nextStage).toBe("summary");
    expect(r2.text).toContain("Thank you");
    expect(deps.writeCalls).toBe(0);
  });

  it("前と同じ質問なら1回だけ書き直してもらう", async () => {
    let n = 0;
    const deps = fakeDeps(
      () => ({ utterance: "answer", updates: [] }),
      () =>
        n++ === 0
          ? { text: "What was your first impression?", quick_replies: null }
          : { text: "Which part caught your eye first?", quick_replies: null }
    );
    const base = createMemo(sampleSet(), T0);
    const memo = { ...base, askedTexts: ["What was your first impression?"] };
    // 何も答えが出ず、質問だった → 直前の点を聞き直す
    const asked = recordAction(memo, { kind: "ask", pointId: "first.impression", mode: "first" });
    const r = await runTurn(
      ctx(),
      { ...deps, record: async () => ({ utterance: "question", updates: [] }) },
      { memo: asked, userMessage: "What is Kutani?", lastQuestion: "x", recent: [] }
    );
    expect(r.pointId).toBe("first.impression");
    expect(r.text).toBe("Which part caught your eye first?");
    expect(r.memo.rewrites).toBe(1);
  });

  it("終わりたいと言ったらまとめへ", async () => {
    const deps = fakeDeps(
      () => ({ utterance: "end", updates: [] }),
      () => ({ text: "x", quick_replies: null })
    );
    const memo = recordAction(createMemo(sampleSet(), T0), {
      kind: "ask",
      pointId: "first.impression",
      mode: "first",
    });
    const r = await runTurn(
      { ...ctx(), locale: "ja" },
      deps,
      { memo, userMessage: "もう終わりにしたい", lastQuestion: "x", recent: [] }
    );
    expect(r.nextStage).toBe("summary");
    expect(r.action).toEqual({ kind: "summary", reason: "user_end" });
  });
});
