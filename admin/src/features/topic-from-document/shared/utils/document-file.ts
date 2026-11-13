/**
 * トピック生成に使える資料ファイルの判定と、本文テキストの整形。
 */

/** 読み込める資料の最大サイズ（10MB） */
export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

/** LLM に渡す資料本文の最大文字数。超えた分は切り捨てる */
export const MAX_DOCUMENT_TEXT_LENGTH = 120_000;

/** 議案のナレッジソースとして保存できる最大文字数 */
export const MAX_KNOWLEDGE_SOURCE_LENGTH = 40_000;

export type DocumentKind = "pdf" | "text";

/** react-dropzone の accept 指定 */
export const DOCUMENT_ACCEPT = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/markdown": [".md", ".markdown"],
};

/** ファイル名と MIME タイプから資料の種類を判定する。対応外なら null */
export function detectDocumentKind(
  fileName: string,
  mimeType: string
): DocumentKind | null {
  const lower = fileName.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    mimeType.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".markdown")
  ) {
    return "text";
  }
  return null;
}

/** 抽出したテキストの空白を整え、最大文字数で切り詰める */
export function normalizeDocumentText(
  text: string,
  maxLength: number = MAX_DOCUMENT_TEXT_LENGTH
): { text: string; truncated: boolean } {
  const normalized = text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t　]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.length <= maxLength) {
    return { text: normalized, truncated: false };
  }
  return { text: normalized.slice(0, maxLength), truncated: true };
}

/** 複数の資料を、見出し付きで1つのテキストにまとめる */
export function joinDocuments(
  documents: Array<{ title: string; text: string }>
): string {
  return documents
    .filter((d) => d.text.trim().length > 0)
    .map((d) => `# 資料: ${d.title}\n\n${d.text.trim()}`)
    .join("\n\n---\n\n");
}
