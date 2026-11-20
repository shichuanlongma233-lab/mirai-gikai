import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { getRequestLocale } from "@/lib/i18n/server";

/**
 * 回答者向け画面（AIインタビュー）は、回答者が選んだ言語で表示する。
 */
export default async function InterviewLocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getRequestLocale();
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
