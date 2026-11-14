import "server-only";

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, type Locale, resolveLocale } from "./locales";

/** リクエストの Cookie / Accept-Language から回答者の言語を決める */
export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    cookieValue: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
  });
}
