import "server-only";

import { extractText, getDocumentProxy } from "unpdf";
import {
  type DocumentKind,
  detectDocumentKind,
  MAX_DOCUMENT_FILE_SIZE,
} from "../../shared/utils/document-file";

export class DocumentReadError extends Error {}

/**
 * アップロードされた資料ファイルから本文テキストを取り出す。
 * PDF はテキストレイヤーを読む（スキャン画像だけの PDF は読めない）。
 */
export async function extractDocumentText(file: File): Promise<string> {
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    throw new DocumentReadError(`「${file.name}」は大きすぎます（10MBまで）。`);
  }

  const kind: DocumentKind | null = detectDocumentKind(file.name, file.type);
  if (!kind) {
    throw new DocumentReadError(
      `「${file.name}」は読み込めない形式です。PDF・テキスト・Markdown を選んでください。`
    );
  }

  if (kind === "text") {
    return await file.text();
  }

  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: true });
  if (!text.trim()) {
    throw new DocumentReadError(
      `「${file.name}」から文字を読み取れませんでした。画像だけの PDF の場合は、文字をテキストで貼り付けてください。`
    );
  }
  return text;
}
