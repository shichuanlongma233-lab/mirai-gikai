import "server-only";

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import { getRespondentProfile } from "@/lib/i18n/server";
import type { InterviewSession } from "../../shared/types";
import { createInterviewSessionRecord } from "../repositories/interview-session-repository";
import type { LoaderDeps } from "../utils/verify-session-ownership";

/**
 * インタビューセッション作成のコアロジック
 * テストからはDIで認証を差し替え可能
 */
export async function createInterviewSessionCore({
  interviewConfigId,
  deps,
}: {
  interviewConfigId: string;
  deps?: LoaderDeps;
}): Promise<InterviewSession> {
  const getUser = deps?.getUser ?? getChatSupabaseUser;
  const {
    data: { user },
    error: getUserError,
  } = await getUser();

  if (getUserError || !user) {
    throw new Error(
      `Failed to get user: ${getUserError?.message || "User not found"}`
    );
  }

  // 言語選択の直後に答えてもらった国・年代を、回答と一緒に記録する（集計用）
  const profile = await getRespondentProfile().catch(() => null);

  return await createInterviewSessionRecord({
    interviewConfigId,
    userId: user.id,
    respondentCountry: profile?.country ?? null,
    respondentAgeRange: profile?.ageRange ?? null,
  });
}
