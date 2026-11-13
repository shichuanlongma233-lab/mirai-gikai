import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { handleTopicDraftGeneration } from "@/features/topic-from-document/server/services/handle-topic-draft-generation";

// 資料の読み込みと LLM 生成に時間がかかるため長めにとる
export const maxDuration = 300;

/**
 * 資料（ファイル・貼り付けテキスト）から、トピック記事とインタビュー設定の下書きを生成する。
 * ファイルはサーバーアクションの本文サイズ上限（1MB）を超えうるため Route Handler で受ける。
 */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  return handleTopicDraftGeneration(await req.formData());
}
