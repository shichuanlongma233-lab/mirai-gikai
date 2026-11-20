import "server-only";

import {
  type AnswerMemo,
  buildMemoSummaryInstruction,
  type EngineDeps,
  type EngineResult,
  parseMemo,
  type PillarSet,
  recorderOutputSchema,
  validatePillarSet,
  writerOutputSchema,
} from "@mirai-gikai/shared/pillars";
import { generateText, type LanguageModel, Output } from "ai";
import type { BillWithContent } from "@/features/bills/shared/types";
import { recordChatUsage } from "@/features/chat/server/services/cost-tracker";
import type { InterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import {
  findInterviewSessionAnswerMemo,
  updateInterviewSessionAnswerMemo,
} from "../repositories/interview-session-repository";

/** 回答メモ方式で動かす設定なら、柱と版を返す */
export function getMemoPillars(
  config: InterviewConfig | null
): { set: PillarSet; version: number } | null {
  if (!config || config.question_engine !== "memo" || !config.pillars) {
    return null;
  }
  const r = validatePillarSet(config.pillars);
  if (!r.ok) {
    console.error("Invalid pillars for memo engine:", r.issues);
    return null;
  }
  return { set: r.set, version: config.pillars_version };
}

/** 聞き手に渡す資料の要約（タイトル＋概要） */
export function buildMaterial(bill: BillWithContent | null): string {
  const title = bill?.bill_content?.title || bill?.name || "";
  const summary = bill?.bill_content?.summary || "";
  return [title, summary].filter(Boolean).join("\n").slice(0, 300);
}

/** AIの呼び出し（記録係・聞き手）を作る。使った分は利用記録に残す */
export function createEngineDeps({
  model,
  userId,
  sessionId,
  billId,
}: {
  model: LanguageModel;
  userId: string;
  sessionId: string;
  billId: string;
}): EngineDeps {
  const modelName =
    typeof model === "string" ? model : (model.modelId ?? "unknown");

  const call = async <T>(
    promptName: string,
    schema: Parameters<typeof Output.object>[0]["schema"],
    p: { system: string; prompt: string }
  ): Promise<T> => {
    const occurredAt = new Date().toISOString();
    const result = await generateText({
      model,
      system: p.system,
      prompt: p.prompt,
      output: Output.object({ schema }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: promptName,
        metadata: { sessionId, billId },
      },
    });
    try {
      await recordChatUsage({
        userId,
        sessionId,
        promptName,
        model: modelName,
        usage: result.usage,
        occurredAt,
        metadata: {
          pageType: "interview",
          billId,
          finishReason: result.finishReason ?? null,
          stepCount: 0,
        },
      });
    } catch (e) {
      console.error("Failed to record memo engine usage:", e);
    }
    return result.output as T;
  };

  return {
    record: (p) => call("interview-memo-recorder", recorderOutputSchema, p),
    write: (p) => call("interview-memo-writer", writerOutputSchema, p),
  };
}

export function resolveEngineModel(
  config: InterviewConfig,
  override?: LanguageModel
): LanguageModel {
  return override ?? config.chat_model ?? DEFAULT_INTERVIEW_CHAT_MODEL;
}

/** エンジンの結果を、画面が読むJSON（ストリームと同じ形）にする */
export function engineResultToContent(result: EngineResult): string {
  return JSON.stringify({
    text: result.text,
    quick_replies: result.quickReplies,
    question_id: result.pointId,
    topic_title: result.pillarName,
    next_stage: result.nextStage,
    // 管理画面で「何を聞いたか・なぜか」を見るための記録（回答者には出ない）
    engine: {
      action: result.action,
      utterance: result.utterance,
      updates: result.updates,
    },
  });
}

export async function loadAnswerMemo(
  sessionId: string,
  version: number
): Promise<AnswerMemo | null> {
  const raw = await findInterviewSessionAnswerMemo(sessionId);
  return parseMemo(raw, version);
}

export async function saveAnswerMemo(
  sessionId: string,
  memo: AnswerMemo
): Promise<void> {
  await updateInterviewSessionAnswerMemo(sessionId, memo);
}

/** まとめ用プロンプトに足す回答メモ（メモがなければ空文字） */
export async function buildMemoSummaryAddition(
  config: InterviewConfig | null,
  sessionId: string
): Promise<string> {
  const pillars = getMemoPillars(config);
  if (!pillars) return "";
  try {
    const memo = await loadAnswerMemo(sessionId, pillars.version);
    return memo ? buildMemoSummaryInstruction(pillars.set, memo) : "";
  } catch (e) {
    console.error("Failed to load answer memo for summary:", e);
    return "";
  }
}

/** 文字列をそのまま1回で流すレスポンス（画面はストリームのJSONを読む） */
export function jsonTextResponse(content: string): Response {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
