import { en } from "./dictionaries/en";
import { type Dictionary, ja } from "./dictionaries/ja";
import { ko } from "./dictionaries/ko";
import { zh } from "./dictionaries/zh";
import type { Locale } from "./locales";

const DICTIONARIES: Record<Locale, Dictionary> = { ja, en, zh, ko };

/** 言語に対応する文言を返す */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
