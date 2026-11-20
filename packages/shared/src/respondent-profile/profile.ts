/**
 * 回答者のプロフィール（出身の国・年代）。市場調査の集計に使う。
 * 言語を選んだ直後に聞き、Cookie に保存してインタビュー開始時にセッションへ記録する。
 * どちらも「答えない」を選べる（その場合は null）。
 */

/** 選択肢に出す国・地域（ISO 3166-1 alpha-2）。表示名は Intl.DisplayNames で各言語に訳す */
export const COUNTRY_CODES = [
  "US",
  "CA",
  "GB",
  "FR",
  "DE",
  "IT",
  "ES",
  "NL",
  "AU",
  "NZ",
  "CN",
  "TW",
  "HK",
  "KR",
  "SG",
  "TH",
  "VN",
  "MY",
  "ID",
  "PH",
  "IN",
  "BR",
  "MX",
  "AE",
  "JP",
] as const;

/** 一覧にない国・地域 */
export const OTHER_COUNTRY = "other";

export type CountryCode = (typeof COUNTRY_CODES)[number] | typeof OTHER_COUNTRY;

export const AGE_RANGES = [
  "under20",
  "20s",
  "30s",
  "40s",
  "50s",
  "60plus",
] as const;

export type AgeRange = (typeof AGE_RANGES)[number];

export const AGE_RANGE_LABELS_JA: Record<AgeRange, string> = {
  under20: "20歳未満",
  "20s": "20代",
  "30s": "30代",
  "40s": "40代",
  "50s": "50代",
  "60plus": "60代以上",
};

export interface RespondentProfile {
  country: CountryCode | null;
  ageRange: AgeRange | null;
}

/** プロフィールを保存する Cookie 名。値があれば「聞き終わった」とみなす */
export const PROFILE_COOKIE = "mirai_profile";

const NONE = "-";

export function isCountryCode(value: unknown): value is CountryCode {
  return (
    value === OTHER_COUNTRY ||
    (typeof value === "string" &&
      (COUNTRY_CODES as readonly string[]).includes(value))
  );
}

export function isAgeRange(value: unknown): value is AgeRange {
  return (
    typeof value === "string" &&
    (AGE_RANGES as readonly string[]).includes(value)
  );
}

export function serializeProfile(profile: RespondentProfile): string {
  return `${profile.country ?? NONE}.${profile.ageRange ?? NONE}`;
}

/** Cookie の値を読む。形がおかしければ null（もう一度聞く） */
export function parseProfile(
  value: string | null | undefined
): RespondentProfile | null {
  if (!value) return null;
  const [country, ageRange, ...rest] = value.split(".");
  if (rest.length > 0 || country === undefined || ageRange === undefined) {
    return null;
  }
  if (country !== NONE && !isCountryCode(country)) return null;
  if (ageRange !== NONE && !isAgeRange(ageRange)) return null;
  return {
    country: country === NONE ? null : country,
    ageRange: ageRange === NONE ? null : ageRange,
  };
}

/** Intl の正式名称が長すぎるもの（例: 「中華人民共和国香港特別行政区」）は短い呼び名にする */
const SHORT_NAMES: Record<string, Record<string, string>> = {
  HK: { ja: "香港", en: "Hong Kong", zh: "香港", ko: "홍콩" },
};

/** 国コードの表示名（例: "US" → 日本語なら「アメリカ合衆国」） */
export function countryDisplayName(
  code: string,
  locale: string,
  otherLabel: string
): string {
  if (code === OTHER_COUNTRY) return otherLabel;
  const short = SHORT_NAMES[code]?.[locale.slice(0, 2)];
  if (short) return short;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
