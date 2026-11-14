/**
 * 回答者向け画面（AIインタビューまわり）で切り替えられる言語。
 * 管理画面は日本語のみ。
 */
export const LOCALES = ["ja", "en", "zh", "ko"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

/** 選んだ言語を保存する Cookie 名 */
export const LOCALE_COOKIE = "mirai_locale";

/** 言語切り替えメニューに出す名前（各言語の自称） */
export const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  ko: "한국어",
};

/** html の lang 属性などに使う BCP 47 タグ */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  ja: "ja",
  en: "en",
  zh: "zh-Hans",
  ko: "ko",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Accept-Language ヘッダーから、対応している言語のうち最も優先度の高いものを選ぶ。
 * 例: "en-US,en;q=0.9,ja;q=0.8" → "en"
 */
export function matchAcceptLanguage(
  header: string | null | undefined
): Locale | null {
  if (!header) return null;

  const candidates = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        tag: tag.trim().toLowerCase(),
        q: Number.isNaN(q) ? 0 : q,
        index,
      };
    })
    .filter((c) => c.tag && c.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { tag } of candidates) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/**
 * Cookie で明示的に選ばれた言語を優先し、なければブラウザの言語設定、
 * それもなければ日本語にする。
 */
export function resolveLocale(params: {
  cookieValue?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(params.cookieValue)) return params.cookieValue;
  return matchAcceptLanguage(params.acceptLanguage) ?? DEFAULT_LOCALE;
}
