"use server";

import {
  csvToPillarSetInput,
  type PillarIssue,
  type PillarSet,
  validatePillarSet,
} from "@mirai-gikai/shared/pillars";
import { createAdminClient, type Database } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";

type PillarsColumn =
  Database["public"]["Tables"]["interview_configs"]["Update"]["pillars"];

export type QuestionEngine = "classic" | "memo";

export type PillarCheckResult =
  | { ok: true; set: PillarSet; issues: PillarIssue[] }
  | { ok: false; issues: PillarIssue[] };

export type PillarSource =
  | { kind: "json"; text: string }
  | {
      kind: "csv";
      text: string;
      meta: {
        goal: string;
        audience: string;
        durationMinutes: number;
        avoid: string[];
      };
    };

function toInput(source: PillarSource): PillarCheckResult | { input: unknown } {
  if (source.kind === "json") {
    try {
      return { input: JSON.parse(source.text) };
    } catch (e) {
      return {
        ok: false,
        issues: [
          {
            path: "",
            message: `JSONとして読めません: ${e instanceof Error ? e.message : String(e)}`,
            level: "error",
          },
        ],
      };
    }
  }
  const r = csvToPillarSetInput(source.text, source.meta);
  if (!r.ok) {
    return {
      ok: false,
      issues: [{ path: "", message: r.message, level: "error" }],
    };
  }
  return { input: r.data };
}

/** 取り込む前に確かめる（保存はしない） */
export async function checkPillars(
  source: PillarSource
): Promise<PillarCheckResult> {
  await requireAdmin();
  const r = toInput(source);
  if (!("input" in r)) return r;
  return validatePillarSet(r.input);
}

export type SavePillarsResult =
  | { success: true; version: number; issues: PillarIssue[] }
  | { success: false; error: string; issues?: PillarIssue[] };

/** 柱を確かめてから保存する。保存するたびに版を1つ上げる */
export async function savePillars(
  configId: string,
  source: PillarSource
): Promise<SavePillarsResult> {
  try {
    await requireAdmin();
    const r = toInput(source);
    if (!("input" in r)) {
      return { success: false, error: "取り込めません", issues: r.issues };
    }
    const checked = validatePillarSet(r.input);
    if (!checked.ok) {
      return {
        success: false,
        error: "直すところがあります",
        issues: checked.issues,
      };
    }
    const supabase = createAdminClient();
    const { data: current, error: readError } = await supabase
      .from("interview_configs")
      .select("pillars_version")
      .eq("id", configId)
      .single();
    if (readError) throw new Error(readError.message);
    const version = (current?.pillars_version ?? 0) + 1;
    const { error } = await supabase
      .from("interview_configs")
      .update({
        pillars: checked.set as unknown as PillarsColumn,
        pillars_version: version,
      })
      .eq("id", configId);
    if (error) throw new Error(error.message);
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);
    return { success: true, version, issues: checked.issues };
  } catch (error) {
    console.error("Save pillars error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "柱の保存中にエラーが発生しました"),
    };
  }
}

export type SetEngineResult =
  | { success: true }
  | { success: false; error: string };

/** 質問の進め方（従来 / 回答メモ方式）を切り替える */
export async function setQuestionEngine(
  configId: string,
  engine: QuestionEngine
): Promise<SetEngineResult> {
  try {
    await requireAdmin();
    if (engine !== "classic" && engine !== "memo") {
      return { success: false, error: "不明な進め方です" };
    }
    const supabase = createAdminClient();
    if (engine === "memo") {
      const { data } = await supabase
        .from("interview_configs")
        .select("pillars")
        .eq("id", configId)
        .single();
      if (!data?.pillars || !validatePillarSet(data.pillars).ok) {
        return {
          success: false,
          error: "先に質問の柱を取り込んで保存してください",
        };
      }
    }
    const { error } = await supabase
      .from("interview_configs")
      .update({ question_engine: engine })
      .eq("id", configId);
    if (error) throw new Error(error.message);
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);
    return { success: true };
  } catch (error) {
    console.error("Set question engine error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "切り替えに失敗しました"),
    };
  }
}
