import "server-only";

import type { TopicDraft } from "../../shared/schemas";
import {
  joinDocuments,
  MAX_KNOWLEDGE_SOURCE_LENGTH,
  normalizeDocumentText,
} from "../../shared/utils/document-file";
import {
  DocumentReadError,
  extractDocumentText,
} from "./extract-document-text";
import { generateTopicDraft } from "./generate-topic-draft";

export type TopicDraftGenerationResponse =
  | {
      success: true;
      draft: TopicDraft;
      /** 議案のナレッジソースに入れる資料本文（上限で切り詰め済み） */
      knowledgeSource: string;
      /** 資料が長く、一部を切り捨てて生成したか */
      truncated: boolean;
    }
  | { success: false; error: string };

function json(body: TopicDraftGenerationResponse, status = 200) {
  return Response.json(body, { status });
}

/**
 * フォームの値（files / text / instructions）から資料本文を組み立て、下書きを生成する。
 */
export async function handleTopicDraftGeneration(
  formData: FormData
): Promise<Response> {
  const files = formData
    .getAll("files")
    .filter((v): v is File => v instanceof File && v.size > 0);
  const pastedText = String(formData.get("text") ?? "");
  const instructions = String(formData.get("instructions") ?? "");

  let documents: Array<{ title: string; text: string }>;
  try {
    documents = await Promise.all(
      files.map(async (file) => ({
        title: file.name,
        text: await extractDocumentText(file),
      }))
    );
  } catch (error) {
    if (error instanceof DocumentReadError) {
      return json({ success: false, error: error.message }, 400);
    }
    console.error("Document read error:", error);
    return json(
      { success: false, error: "資料の読み込み中にエラーが発生しました。" },
      500
    );
  }

  if (pastedText.trim()) {
    documents.push({ title: "貼り付けたテキスト", text: pastedText });
  }

  const { text: documentText, truncated } = normalizeDocumentText(
    joinDocuments(documents)
  );
  if (!documentText) {
    return json(
      {
        success: false,
        error: "資料ファイルを選ぶか、テキストを貼り付けてください。",
      },
      400
    );
  }

  try {
    const draft = await generateTopicDraft({ documentText, instructions });
    return json({
      success: true,
      draft,
      knowledgeSource: normalizeDocumentText(
        documentText,
        MAX_KNOWLEDGE_SOURCE_LENGTH
      ).text,
      truncated,
    });
  } catch (error) {
    console.error("Topic draft generation error:", error);
    return json(
      {
        success: false,
        error: "AIによる生成に失敗しました。時間をおいて再度お試しください。",
      },
      500
    );
  }
}
