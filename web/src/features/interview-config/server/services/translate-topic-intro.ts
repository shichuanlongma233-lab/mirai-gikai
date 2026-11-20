import "server-only";

import { createHash } from "node:crypto";
import { generateObject } from "ai";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { AI_MODELS } from "@/lib/ai/models";
import type { Locale } from "@/lib/i18n/locales";

/** 回答者に見せるトピックの紹介（タイトル・要約・本文・テーマ） */
export type TopicIntro = {
  title: string;
  summary: string;
  content: string;
  themes: string[];
};

const LANGUAGE_NAMES: Record<Exclude<Locale, "ja">, string> = {
  en: "English",
  zh: "Simplified Chinese (简体中文)",
  ko: "Korean (한국어)",
};

const translatedIntroSchema = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string().describe("Markdown. Keep headings and lists."),
  themes: z.array(z.string()),
});

async function translate(intro: TopicIntro, locale: Exclude<Locale, "ja">) {
  const { object } = await generateObject({
    // 翻訳は安いモデルで十分（Gemini キーがあれば Gemini に置き換わる）
    model: AI_MODELS.gemini3_flash,
    schema: translatedIntroSchema,
    system: `You are a professional translator localizing an introduction of Japanese culture, products and services for people overseas.
Translate every field from Japanese into natural ${LANGUAGE_NAMES[locale]}.
- Keep the meaning, tone and Markdown structure. Do not add or remove information.
- For Japanese proper nouns or culture-specific words, use the common romanization or translation and add a short explanation in parentheses the first time if needed.
- Return the same number of themes in the same order.`,
    prompt: JSON.stringify(intro),
  });
  return object;
}

/**
 * トピックの紹介を回答者の言語に翻訳する。日本語ならそのまま返す。
 * 内容と言語ごとにキャッシュするので、同じ紹介は1回しか翻訳しない。
 * 翻訳に失敗したら原文（日本語）を返す。
 */
export async function translateTopicIntro(
  intro: TopicIntro,
  locale: Locale
): Promise<{ intro: TopicIntro; translated: boolean }> {
  if (locale === "ja") return { intro, translated: false };

  const hash = createHash("sha256").update(JSON.stringify(intro)).digest("hex");
  try {
    const translated = await unstable_cache(
      () => translate(intro, locale),
      ["topic-intro-translation", locale, hash],
      { revalidate: false }
    )();
    return {
      intro: {
        ...translated,
        // テーマの数がずれたら原文に戻す（順番の対応が崩れるため）
        themes:
          translated.themes.length === intro.themes.length
            ? translated.themes
            : intro.themes,
      },
      translated: true,
    };
  } catch (error) {
    console.error("Topic intro translation failed:", error);
    return { intro, translated: false };
  }
}
