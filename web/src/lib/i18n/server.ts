import "server-only";

import {
  PROFILE_COOKIE,
  parseProfile,
  type RespondentProfile,
} from "@mirai-gikai/shared/respondent-profile";
import { cookies, headers } from "next/headers";
import {
  LOCALE_CHOSEN_COOKIE,
  LOCALE_COOKIE,
  type Locale,
  resolveLocale,
} from "./locales";

/** リクエストの Cookie / Accept-Language から回答者の言語を決める */
export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    cookieValue: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
  });
}

/** 回答者がすでに自分で言語を選んだか（最初の言語選択画面を出すかどうか） */
export async function hasChosenLocale(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(LOCALE_CHOSEN_COOKIE)?.value === "1";
}

/** 回答者がすでに国・年代の質問に答えたか（答えない を選んだ場合も含む） */
export async function getRespondentProfile(): Promise<RespondentProfile | null> {
  const cookieStore = await cookies();
  return parseProfile(cookieStore.get(PROFILE_COOKIE)?.value);
}
