import { type PillarSet, pillarSetSchema } from "./schema";

export interface PillarIssue {
  /** 例: pillars[1].points[0].choices */
  path: string;
  message: string;
  /** error: 取り込めない / warning: 取り込めるが直した方がよい */
  level: "error" | "warning";
}

export type ValidateResult =
  | { ok: true; set: PillarSet; issues: PillarIssue[] }
  | { ok: false; issues: PillarIssue[] };

/** 必須の点1つにかかる時間の目安（分） */
const MINUTES_PER_REQUIRED_POINT = 1.2;

function pathOf(path: PropertyKey[]): string {
  return path
    .map((p, i) =>
      typeof p === "number" ? `[${p}]` : `${i === 0 ? "" : "."}${String(p)}`
    )
    .join("");
}

/**
 * 柱の取り込みデータを確かめる。
 * 形・必須項目（zod）に加えて、
 * id の重複、選択型なのに選択肢がない、必須が多すぎて時間に収まらない、
 * 存在しない id を指す overlapsWith / fills / askIf を見つける。
 */
export function validatePillarSet(input: unknown): ValidateResult {
  const parsed = pillarSetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        path: pathOf(i.path),
        message: i.message,
        level: "error" as const,
      })),
    };
  }
  const set = parsed.data;
  const issues: PillarIssue[] = [];

  const pillarIds = new Set<string>();
  const pointIds = new Set<string>();
  set.pillars.forEach((pillar, pi) => {
    if (pillarIds.has(pillar.id)) {
      issues.push({
        path: `pillars[${pi}].id`,
        message: `柱のid「${pillar.id}」が重複しています`,
        level: "error",
      });
    }
    pillarIds.add(pillar.id);
    pillar.points.forEach((point, qi) => {
      if (pointIds.has(point.id)) {
        issues.push({
          path: `pillars[${pi}].points[${qi}].id`,
          message: `聞きたい点のid「${point.id}」が重複しています`,
          level: "error",
        });
      }
      pointIds.add(point.id);
    });
  });

  set.pillars.forEach((pillar, pi) => {
    pillar.points.forEach((point, qi) => {
      const base = `pillars[${pi}].points[${qi}]`;
      if (
        (point.answerType === "choice" || point.answerType === "scale") &&
        point.choices.length === 0
      ) {
        issues.push({
          path: `${base}.choices`,
          message: `「${point.name}」は選択・5段階なのに選択肢がありません`,
          level: "error",
        });
      }
      for (const id of point.overlapsWith) {
        if (!pointIds.has(id)) {
          issues.push({
            path: `${base}.overlapsWith`,
            message: `重なりやすい点「${id}」が見つかりません`,
            level: "error",
          });
        }
      }
      point.choices.forEach((c, ci) => {
        if (typeof c === "string" || !c.fills) return;
        for (const id of c.fills) {
          if (!pointIds.has(id)) {
            issues.push({
              path: `${base}.choices[${ci}].fills`,
              message: `選択肢「${c.label}」が埋める点「${id}」が見つかりません`,
              level: "error",
            });
          }
        }
      });
      if (/[?？].*[?？]/.test(point.question)) {
        issues.push({
          path: `${base}.question`,
          message: `「${point.name}」の質問文に質問が2つ入っていそうです`,
          level: "warning",
        });
      }
    });
    if (pillar.askIf) {
      const cond = parseAskIf(pillar.askIf);
      if (!cond) {
        issues.push({
          path: `pillars[${pi}].askIf`,
          message: `聞く条件「${pillar.askIf}」の書き方が読めません（例: purchase.intent!=買わない）`,
          level: "error",
        });
      } else if (!pointIds.has(cond.pointId)) {
        issues.push({
          path: `pillars[${pi}].askIf`,
          message: `聞く条件の点「${cond.pointId}」が見つかりません`,
          level: "error",
        });
      }
    }
  });

  const requiredPoints = set.pillars
    .filter((p) => p.required)
    .flatMap((p) => p.points.filter((q) => q.required)).length;
  if (requiredPoints * MINUTES_PER_REQUIRED_POINT > set.durationMinutes) {
    issues.push({
      path: "durationMinutes",
      message: `必須の点が${requiredPoints}個あり、${set.durationMinutes}分に収まらないかもしれません（目安: ${Math.floor(set.durationMinutes / MINUTES_PER_REQUIRED_POINT)}個まで。時間が足りなくなると深掘りと任意の点を省きます）`,
      level: "warning",
    });
  }

  const hasError = issues.some((i) => i.level === "error");
  return hasError ? { ok: false, issues } : { ok: true, set, issues };
}

export interface AskIfCondition {
  pointId: string;
  negate: boolean;
  values: string[];
}

/** "pointId=a|b" / "pointId!=a|b" を読む */
export function parseAskIf(text: string): AskIfCondition | null {
  const m = text.trim().match(/^([A-Za-z0-9_.-]+)\s*(!=|=)\s*(.+)$/);
  if (!m) return null;
  const values = m[3]
    .split("|")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  if (values.length === 0) return null;
  return { pointId: m[1], negate: m[2] === "!=", values };
}
