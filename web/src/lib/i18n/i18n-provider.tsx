"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { type Dictionary, getDictionary } from "./get-dictionary";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  resolveLocale,
} from "./locales";

type I18nValue = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18nValue | null>(null);

/** サーバーで決めた言語を、配下のクライアントコンポーネントに渡す */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  // ブラウザの言語設定から決めた言語も Cookie に残し、
  // Provider の外（ヘッダーなど）や API でも同じ言語になるようにする
  useEffect(() => {
    if (!document.cookie.includes(`${LOCALE_COOKIE}=`)) {
      writeLocaleCookie(locale);
    }
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

/** 1年保存 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** 選んだ言語を Cookie に保存する */
export function writeLocaleCookie(locale: Locale) {
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API は Safari の対応が限られるため
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function readCookieLocale(): Locale {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
  return resolveLocale({
    cookieValue: match ? decodeURIComponent(match.split("=")[1]) : null,
  });
}

/**
 * 回答者の言語と文言を返す。
 * I18nProvider の外（ヘッダーなど）では、表示後に Cookie から言語を読む。
 */
export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  const [fallbackLocale, setFallbackLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (!context) {
      setFallbackLocale(readCookieLocale());
    }
  }, [context]);

  if (context) return context;
  return { locale: fallbackLocale, t: getDictionary(fallbackLocale) };
}
