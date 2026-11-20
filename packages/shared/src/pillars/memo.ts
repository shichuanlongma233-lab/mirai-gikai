import { z } from "zod";
import { parseAskIf } from "./validate";
import {
  findPoint,
  normalizeChoice,
  orderedPoints,
  type PillarSet,
  type Point,
} from "./schema";

/**
 * 回答メモ。聞きたい点ごとに「答えた／一部／まだ／答えたくない／対象外」を持つ。
 * インタビューの進め方（次に何を聞くか）は、このメモだけを見てプログラムが決める。
 */

export const pointStatusSchema = z.enum([
  "unasked",
  "answered",
  "partial",
  "declined",
  "not_applicable",
]);
export type PointStatus = z.infer<typeof pointStatusSchema>;

export const POINT_STATUS_LABELS_JA: Record<PointStatus, string> = {
  unasked: "まだ",
  answered: "答えた",
  partial: "一部",
  declined: "答えたくない",
  not_applicable: "対象外",
};

export const depthSchema = z.enum(["shallow", "enough"]);
export type Depth = z.infer<typeof depthSchema>;

export const pointMemoSchema = z.object({
  status: pointStatusSchema.default("unasked"),
  /** まとめた答え（選択型なら元の選択肢ラベル） */
  value: z.string().nullable().default(null),
  /** 回答者の言葉の引用（40字まで） */
  quote: z.string().nullable().default(null),
  /** 一部のとき、足りない部分 */
  missing: z.string().nullable().default(null),
  depth: depthSchema.nullable().default(null),
  /** この点で聞いた回数（最初の質問を含む） */
  asked: z.number().int().default(0),
  /** 深掘り・続きを聞いた回数 */
  followUps: z.number().int().default(0),
  /** 回答者が自分から先に話して埋まったか */
  volunteered: z.boolean().default(false),
});
export type PointMemo = z.infer<typeof pointMemoSchema>;

export const actionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ask"),
    pointId: z.string(),
    /** first=最初の質問 / missing=足りない部分 / reason=理由の深掘り */
    mode: z.enum(["first", "missing", "reason"]),
  }),
  z.object({
    kind: z.literal("summary"),
    reason: z.enum(["user_end", "time", "done"]),
  }),
]);
export type Action = z.infer<typeof actionSchema>;

export const shownChoiceSchema = z.object({
  /** 画面に出した文字（回答者の言語） */
  shown: z.string(),
  /** 元の選択肢ラベル（回答メモの値になる） */
  label: z.string(),
  fills: z.array(z.string()),
});
export type ShownChoice = z.infer<typeof shownChoiceSchema>;

export const answerMemoSchema = z.object({
  version: z.literal(1).default(1),
  /** 柱のどの版で始めたか（途中で柱を直しても、古いメモと混ざらないように） */
  pillarVersion: z.number().int().default(1),
  startedAt: z.string(),
  turns: z.number().int().default(0),
  points: z.record(z.string(), pointMemoSchema).default({}),
  lastAction: actionSchema.nullable().default(null),
  /** 直前に画面に出した選択肢 */
  shownChoices: z.array(shownChoiceSchema).default([]),
  /** これまでに出した質問文（重複チェック用） */
  askedTexts: z.array(z.string()).default([]),
  /** 最終チェックで書き直した回数 */
  rewrites: z.number().int().default(0),
});
export type AnswerMemo = z.infer<typeof answerMemoSchema>;

export function emptyPointMemo(): PointMemo {
  return pointMemoSchema.parse({});
}

export function createMemo(
  set: PillarSet,
  now: Date,
  pillarVersion = 1
): AnswerMemo {
  const points: Record<string, PointMemo> = {};
  for (const { point } of orderedPoints(set)) {
    points[point.id] = emptyPointMemo();
  }
  return answerMemoSchema.parse({
    pillarVersion,
    startedAt: now.toISOString(),
    points,
  });
}

/** DBに保存されたメモを読む。壊れていたり柱の版が違えば null */
export function parseMemo(
  raw: unknown,
  pillarVersion?: number
): AnswerMemo | null {
  const parsed = answerMemoSchema.safeParse(raw);
  if (!parsed.success) return null;
  if (pillarVersion != null && parsed.data.pillarVersion !== pillarVersion) {
    return null;
  }
  return parsed.data;
}

export function pointMemoOf(memo: AnswerMemo, pointId: string): PointMemo {
  return memo.points[pointId] ?? emptyPointMemo();
}

/** 記録係が返す1点ぶんの更新 */
export interface PointUpdate {
  id: string;
  status: "answered" | "partial" | "declined";
  value: string | null;
  quote: string | null;
  missing: string | null;
  depth: Depth | null;
}

const QUOTE_MAX = 40;

/**
 * 記録係の更新をメモに反映する（元のメモは変えない）。
 * - 引用がない「答えた」「一部」は採用しない（思い込みで埋めないため）
 * - すでに「答えた」の点を「一部」に戻さない
 * - 直前に聞いた点以外が埋まったら「自分から話した」として印をつける
 */
export function applyUpdates(
  memo: AnswerMemo,
  updates: PointUpdate[],
  set: PillarSet
): AnswerMemo {
  const next: AnswerMemo = structuredClone(memo);
  const targetId =
    memo.lastAction?.kind === "ask" ? memo.lastAction.pointId : null;
  for (const u of updates) {
    if (!findPoint(set, u.id)) continue;
    const prev = pointMemoOf(next, u.id);
    if (prev.status === "not_applicable") continue;
    const quote = u.quote?.trim() ? u.quote.trim().slice(0, QUOTE_MAX) : null;
    if (u.status !== "declined" && !quote) continue;
    if (prev.status === "answered" && u.status !== "answered") continue;
    next.points[u.id] = {
      ...prev,
      status: u.status,
      value: u.value?.trim() || prev.value,
      quote: quote ?? prev.quote,
      missing: u.status === "partial" ? (u.missing?.trim() ?? null) : null,
      depth: u.depth ?? prev.depth,
      volunteered: prev.volunteered || (u.id !== targetId && prev.asked === 0),
    };
  }
  return next;
}

/**
 * 回答者が選択肢ボタンを押した（または同じ文字を打った）ときは、AIを使わずに埋める。
 * 当てはまらなければ null。
 */
export function matchShownChoice(
  memo: AnswerMemo,
  userText: string
): PointUpdate[] | null {
  const t = normalizeForMatch(userText);
  const hit = memo.shownChoices.find(
    (c) => normalizeForMatch(c.shown) === t || normalizeForMatch(c.label) === t
  );
  if (!hit) return null;
  return hit.fills.map((id) => ({
    id,
    status: "answered" as const,
    value: hit.label,
    quote: hit.shown.slice(0, QUOTE_MAX),
    missing: null,
    depth: null,
  }));
}

function normalizeForMatch(s: string): string {
  return s.normalize("NFKC").trim().toLowerCase().replace(/[。.!！]+$/u, "");
}

/** 点の選択肢を、表示前の形（ラベルと埋まる点）にそろえる */
export function choicesOf(point: Point) {
  return point.choices.map((c) => normalizeChoice(c, point.id));
}

/** askIf の判定。まだ答えがない（判断できない）ときは聞く側に倒す */
export function pillarApplies(
  askIf: string | null | undefined,
  memo: AnswerMemo
): boolean {
  if (!askIf) return true;
  const cond = parseAskIf(askIf);
  if (!cond) return true;
  const pm = memo.points[cond.pointId];
  if (!pm || !pm.value || (pm.status !== "answered" && pm.status !== "partial"))
    return true;
  const v = normalizeForMatch(pm.value);
  const hit = cond.values.some((x) => normalizeForMatch(x) === v);
  return cond.negate ? !hit : hit;
}

/** 条件に合わない柱の点を「対象外」にする（元のメモは変えない） */
export function markNotApplicable(set: PillarSet, memo: AnswerMemo): AnswerMemo {
  const next: AnswerMemo = structuredClone(memo);
  for (const pillar of set.pillars) {
    if (pillarApplies(pillar.askIf, next)) continue;
    for (const point of pillar.points) {
      const pm = pointMemoOf(next, point.id);
      if (pm.status === "unasked") {
        next.points[point.id] = { ...pm, status: "not_applicable" };
      }
    }
  }
  return next;
}

/** 進み具合（対象外は分母から外す） */
export function memoProgress(set: PillarSet, memo: AnswerMemo) {
  let total = 0;
  let answered = 0;
  let partial = 0;
  let declined = 0;
  for (const { point } of orderedPoints(set)) {
    const s = pointMemoOf(memo, point.id).status;
    if (s === "not_applicable") continue;
    total++;
    if (s === "answered") answered++;
    else if (s === "partial") partial++;
    else if (s === "declined") declined++;
  }
  return { total, answered, partial, declined };
}
