import { describe, expect, it } from "vitest";
import {
  detectDocumentKind,
  joinDocuments,
  normalizeDocumentText,
} from "./document-file";

describe("detectDocumentKind", () => {
  it("PDF を MIME タイプか拡張子で判定する", () => {
    expect(detectDocumentKind("a.pdf", "")).toBe("pdf");
    expect(detectDocumentKind("a", "application/pdf")).toBe("pdf");
  });

  it("テキストと Markdown を判定する", () => {
    expect(detectDocumentKind("a.txt", "text/plain")).toBe("text");
    expect(detectDocumentKind("a.MD", "")).toBe("text");
  });

  it("対応外の形式は null", () => {
    expect(detectDocumentKind("a.docx", "application/msword")).toBeNull();
  });
});

describe("normalizeDocumentText", () => {
  it("改行コードと連続する空行を整える", () => {
    expect(normalizeDocumentText("a  \r\n\r\n\r\n\r\nb").text).toBe("a\n\nb");
  });

  it("最大文字数を超えたら切り詰めて truncated を返す", () => {
    expect(normalizeDocumentText("abcdef", 3)).toEqual({
      text: "abc",
      truncated: true,
    });
    expect(normalizeDocumentText("abc", 3).truncated).toBe(false);
  });
});

describe("joinDocuments", () => {
  it("空の資料を除き、見出し付きでつなぐ", () => {
    expect(
      joinDocuments([
        { title: "x.pdf", text: "本文X" },
        { title: "空", text: "  " },
        { title: "y.txt", text: "本文Y" },
      ])
    ).toBe("# 資料: x.pdf\n\n本文X\n\n---\n\n# 資料: y.txt\n\n本文Y");
  });
});
