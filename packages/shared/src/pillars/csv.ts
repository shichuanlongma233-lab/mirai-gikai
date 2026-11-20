import { normalizeChoice, orderedPillars, type PillarSet } from "./schema";

/**
 * 柱のCSV。1行に聞きたい点1つ。柱の列は同じ柱の行で同じ値を繰り返す。
 * 選択肢は「;」区切り。押されたら埋まる点は「>」の後に「|」区切り
 * （例: 高すぎて買わない>price.feel|purchase.intent）。
 * 調査全体の項目（goal など）はCSVに入れず、取り込み画面で入れる。
 */
export const PILLAR_CSV_COLUMNS = [
  "pillar_id",
  "pillar_name",
  "intent",
  "pillar_order",
  "pillar_required",
  "ask_if",
  "point_id",
  "point_name",
  "question",
  "answered_when",
  "not_answered_examples",
  "answer_type",
  "choices",
  "aggregate",
  "follow_up_max",
  "follow_up_ask",
  "overlaps_with",
  "point_required",
] as const;

type Column = (typeof PILLAR_CSV_COLUMNS)[number];

export interface SurveyMeta {
  goal: string;
  audience: string;
  durationMinutes?: number;
  avoid?: string[];
}

/** RFC 4180 程度のCSVを読む（"..." と "" の中の改行・カンマに対応） */
export function parseCsvRows(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function splitList(s: string, sep: string): string[] {
  return s
    .split(sep)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function parseBool(s: string, fallback: boolean): boolean {
  const t = s.trim().toLowerCase();
  if (!t) return fallback;
  return ["yes", "true", "1", "y", "はい", "必須"].includes(t);
}

function parseIntOr(s: string): number | undefined {
  const n = Number.parseInt(s.trim(), 10);
  return Number.isFinite(n) ? n : undefined;
}

export type CsvParseResult =
  | { ok: true; data: unknown }
  | { ok: false; message: string };

/**
 * CSVを取り込み形式（JSONと同じ形）に組み立てる。
 * 中身のチェックは validatePillarSet で行う。
 */
export function csvToPillarSetInput(
  text: string,
  meta: SurveyMeta
): CsvParseResult {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return { ok: false, message: "見出し行と、1行以上の中身が必要です" };
  }
  const header = rows[0].map((h) => h.trim());
  const missing = ["pillar_id", "point_id", "question"].filter(
    (c) => !header.includes(c)
  );
  if (missing.length > 0) {
    return {
      ok: false,
      message: `必要な列がありません: ${missing.join(", ")}`,
    };
  }
  const col = (r: string[], name: Column) => {
    const i = header.indexOf(name);
    return i >= 0 ? (r[i] ?? "").trim() : "";
  };

  // biome-ignore lint/suspicious/noExplicitAny: 検証前の組み立て途中の形
  const pillars = new Map<string, any>();
  for (const r of rows.slice(1)) {
    const pid = col(r, "pillar_id");
    if (!pillars.has(pid)) {
      pillars.set(pid, {
        id: pid,
        name: col(r, "pillar_name"),
        intent: col(r, "intent"),
        order: parseIntOr(col(r, "pillar_order")),
        required: parseBool(col(r, "pillar_required"), true),
        askIf: col(r, "ask_if") || null,
        points: [],
      });
    }
    const choices = splitList(col(r, "choices"), ";").map((c) => {
      const [label, fills] = c.split(">");
      const fillIds = fills ? splitList(fills, "|") : [];
      return fillIds.length > 0
        ? { label: label.trim(), fills: fillIds }
        : label.trim();
    });
    const followUpMax = parseIntOr(col(r, "follow_up_max"));
    const followUpAsk = col(r, "follow_up_ask");
    pillars.get(pid).points.push({
      id: col(r, "point_id"),
      name: col(r, "point_name") || col(r, "point_id"),
      question: col(r, "question"),
      answeredWhen: col(r, "answered_when"),
      notAnsweredExamples: splitList(col(r, "not_answered_examples"), ";"),
      answerType: col(r, "answer_type") || "free",
      choices,
      aggregate: col(r, "aggregate") || undefined,
      followUp: {
        max: followUpMax ?? 1,
        ...(followUpAsk ? { ask: followUpAsk } : {}),
      },
      overlapsWith: splitList(col(r, "overlaps_with"), ";"),
      required: parseBool(col(r, "point_required"), true),
    });
  }

  return {
    ok: true,
    data: {
      version: 1,
      goal: meta.goal,
      audience: meta.audience,
      durationMinutes: meta.durationMinutes ?? 10,
      avoid: meta.avoid ?? [],
      pillars: [...pillars.values()],
    },
  };
}

function csvCell(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** 柱をCSVに書き出す（取り込みと同じ列） */
export function pillarSetToCsv(set: PillarSet): string {
  const lines = [PILLAR_CSV_COLUMNS.join(",")];
  orderedPillars(set).forEach((pillar, i) => {
    for (const point of pillar.points) {
      const choices = point.choices
        .map((c) => {
          const n = normalizeChoice(c, point.id);
          const isDefault = n.fills.length === 1 && n.fills[0] === point.id;
          return isDefault ? n.label : `${n.label}>${n.fills.join("|")}`;
        })
        .join(";");
      const values: Record<Column, string> = {
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        intent: pillar.intent,
        pillar_order: String(pillar.order ?? i + 1),
        pillar_required: pillar.required ? "yes" : "no",
        ask_if: pillar.askIf ?? "",
        point_id: point.id,
        point_name: point.name,
        question: point.question,
        answered_when: point.answeredWhen,
        not_answered_examples: point.notAnsweredExamples.join(";"),
        answer_type: point.answerType,
        choices,
        aggregate: point.aggregate ?? "",
        follow_up_max: String(point.followUp.max),
        follow_up_ask: point.followUp.ask ?? "",
        overlaps_with: point.overlapsWith.join(";"),
        point_required: point.required ? "yes" : "no",
      };
      lines.push(PILLAR_CSV_COLUMNS.map((c) => csvCell(values[c])).join(","));
    }
  });
  return `${lines.join("\n")}\n`;
}
