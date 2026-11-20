import type { Locale } from "./locales";

const LANGUAGE_NAMES: Record<Exclude<Locale, "ja">, string> = {
  en: "英語（English）",
  zh: "簡体字中国語（简体中文）",
  ko: "韓国語（한국어）",
};

/**
 * 回答者が日本語以外を選んだときに、インタビュー用システムプロンプトの末尾に足す指示。
 * 日本語なら空文字（既存のプロンプトをそのまま使う）。
 *
 * 質問やクイックリプライは日本語で登録されているため、AI がその場で訳して使う。
 */
export function buildAiLanguageInstruction(locale: Locale): string {
  if (locale === "ja") return "";
  const language = LANGUAGE_NAMES[locale];

  return `

## 重要: 回答者の言語
回答者は${language}を選んでいます。以下を必ず守ってください。
- 回答者に見せる文章（text、quick_replies、topic_title、レポートの各項目）はすべて${language}で書く。日本語で書かない。
- 事前定義の質問文・クイックリプライ・テーマ・法案情報は日本語で登録されているので、意味を変えずに${language}へ自然に訳して使う。
- 法案名や固有名詞は、初出時に${language}の訳に続けて日本語の原文を括弧で添える。
- 回答者が途中で別の言語で書いてきた場合は、その言語に合わせて続ける。`;
}
