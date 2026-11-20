import { z } from "zod";

/**
 * 「質問の柱」の取り込み形式（JSON）。
 * 柱 = 調査の意図のまとまり。柱は「聞きたい点」を1〜4個持つ。
 * 回答メモ方式のインタビューは、聞きたい点ごとに「答えた／一部／まだ」を記録して進める。
 */

const idSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_.-]+$/, "英数字と _ . - だけで書いてください");

export const answerTypeSchema = z.enum(["free", "choice", "number", "scale"]);
export type AnswerType = z.infer<typeof answerTypeSchema>;

export const aggregateSchema = z.enum(["ratio", "median", "summary"]);
export type AggregateKind = z.infer<typeof aggregateSchema>;

/** 選択肢。文字列だけなら「押されたらその点が埋まる」 */
export const choiceSchema = z.union([
  z.string().min(1),
  z.object({
    label: z.string().min(1),
    /** 押されたら「答えた」になる点のid（省略時はその点だけ） */
    fills: z.array(idSchema).optional(),
  }),
]);
export type ChoiceInput = z.infer<typeof choiceSchema>;

export const pointSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  /** 質問文の例（日本語でよい。回答者の言語へはAIが訳す） */
  question: z.string().min(1),
  /** 何が言えていれば「答えた」とみなすか */
  answeredWhen: z.string().min(1),
  /** 紛らわしいが「答えた」にならない例 */
  notAnsweredExamples: z.array(z.string()).default([]),
  answerType: answerTypeSchema.default("free"),
  /** number のときの単位（例: USD） */
  unit: z.string().optional(),
  choices: z.array(choiceSchema).default([]),
  aggregate: aggregateSchema.optional(),
  followUp: z
    .object({
      max: z.number().int().min(0).max(3).default(1),
      ask: z.string().optional(),
    })
    .default({ max: 1 }),
  /** 同じ答えが出やすい他の点のid */
  overlapsWith: z.array(idSchema).default([]),
  required: z.boolean().default(true),
});
export type PointInput = z.input<typeof pointSchema>;
export type Point = z.output<typeof pointSchema>;

export const pillarSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  /** この柱の結果で何を判断するか */
  intent: z.string().min(1),
  order: z.number().int().min(1).optional(),
  required: z.boolean().default(true),
  /**
   * この柱を聞く条件。"pointId=値1|値2"（どれかなら聞く）か
   * "pointId!=値1|値2"（どれでもなければ聞く）。値は回答メモの値と比べる。
   */
  askIf: z.string().nullable().optional(),
  points: z.array(pointSchema).min(1).max(4),
});
export type Pillar = z.output<typeof pillarSchema>;

export const pillarSetSchema = z.object({
  version: z.literal(1).default(1),
  goal: z.string().min(1),
  audience: z.string().min(1),
  durationMinutes: z.number().int().min(1).max(60).default(10),
  avoid: z.array(z.string()).default([]),
  pillars: z.array(pillarSchema).min(1).max(5),
});
export type PillarSetInput = z.input<typeof pillarSetSchema>;
export type PillarSet = z.output<typeof pillarSetSchema>;

/** 選択肢をラベルと埋まる点に揃える */
export function normalizeChoice(
  choice: ChoiceInput,
  pointId: string
): { label: string; fills: string[] } {
  if (typeof choice === "string") return { label: choice, fills: [pointId] };
  return {
    label: choice.label,
    fills: choice.fills && choice.fills.length > 0 ? choice.fills : [pointId],
  };
}

/** 柱を順番どおりに並べる（order がなければ書かれた順） */
export function orderedPillars(set: PillarSet): Pillar[] {
  return set.pillars
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (a.p.order ?? a.i + 1) - (b.p.order ?? b.i + 1) || a.i - b.i)
    .map(({ p }) => p);
}

/** 全部の点を、柱の順→点の順で並べる */
export function orderedPoints(
  set: PillarSet
): Array<{ pillar: Pillar; point: Point }> {
  return orderedPillars(set).flatMap((pillar) =>
    pillar.points.map((point) => ({ pillar, point }))
  );
}

export function findPoint(
  set: PillarSet,
  pointId: string
): { pillar: Pillar; point: Point } | null {
  for (const pillar of set.pillars) {
    const point = pillar.points.find((p) => p.id === pointId);
    if (point) return { pillar, point };
  }
  return null;
}

/** 集計の仕方（指定がなければ答えの型から決める） */
export function aggregateOf(point: Point): AggregateKind {
  if (point.aggregate) return point.aggregate;
  if (point.answerType === "number") return "median";
  if (point.answerType === "choice" || point.answerType === "scale") {
    return "ratio";
  }
  return "summary";
}
