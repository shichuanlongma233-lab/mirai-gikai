"use server";

import {
  createBillRecord,
  upsertBillContent,
} from "@/features/bills-edit/server/repositories/bill-edit-repository";
import { deleteBillById } from "@/features/bills/server/repositories/bill-repository";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { createInterviewConfigWithQuestions } from "@/features/interview-config/server/services/create-interview-config-with-questions";
import { prepareQuestionsForInsert } from "@/features/interview-config/shared/utils/prepare-questions-for-insert";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type CreateTopicFromDraftInput,
  createTopicFromDraftSchema,
} from "../../shared/schemas";

export type CreateTopicFromDraftResult =
  | { success: true; data: { billId: string; configId: string } }
  | { success: false; error: string };

/** インタビュー設定の既定の目安時間（分）。新規作成画面と同じ */
const DEFAULT_ESTIMATED_DURATION = 10;

/**
 * 資料から生成した下書きを、議案（非公開の下書き）・記事・インタビュー設定（非公開）として保存する。
 * 途中で失敗したら、作成した議案ごと削除して元に戻す。
 */
export async function createTopicFromDraft(
  input: CreateTopicFromDraftInput
): Promise<CreateTopicFromDraftResult> {
  let billId: string | null = null;
  try {
    await requireAdmin();

    const draft = createTopicFromDraftSchema.parse(input);

    const bill = await createBillRecord({
      name: draft.name,
      status: "preparing",
      originating_house: "HR",
      article_kind: "ai_generated",
      knowledge_source: draft.knowledge_source || null,
      use_knowledge_source_in_chat: draft.knowledge_source.length > 0,
    });
    billId = bill.id;

    await upsertBillContent({
      billId: bill.id,
      difficultyLevel: "normal",
      title: draft.title,
      summary: draft.summary,
      content: draft.content,
    });

    const config = await createInterviewConfigWithQuestions(
      {
        bill_id: bill.id,
        name: draft.config_name,
        status: "closed",
        mode: "loop",
        themes: draft.themes.length > 0 ? draft.themes : null,
        chat_model: null,
        estimated_duration: DEFAULT_ESTIMATED_DURATION,
        prompt_overrides: null,
      },
      (configId) =>
        prepareQuestionsForInsert(
          draft.questions.map((q) => ({
            question: q.question,
            follow_up_guide: q.follow_up_guide || undefined,
            quick_replies:
              q.quick_replies.length > 0 ? q.quick_replies : undefined,
          })),
          configId
        )
    );

    await invalidateWebCache([
      WEB_CACHE_TAGS.BILLS,
      WEB_CACHE_TAGS.INTERVIEW_CONFIGS,
    ]);

    return { success: true, data: { billId: bill.id, configId: config.id } };
  } catch (error) {
    console.error("Create topic from draft error:", error);
    if (billId) {
      await deleteBillById(billId).catch((deleteError) => {
        console.error("Failed to roll back bill:", billId, deleteError);
      });
    }
    return {
      success: false,
      error: getErrorMessage(error, "トピックの作成中にエラーが発生しました"),
    };
  }
}
