"use client";

import {
  AGE_RANGES,
  type AgeRange,
  COUNTRY_CODES,
  type CountryCode,
  countryDisplayName,
  isCountryCode,
  OTHER_COUNTRY,
  PROFILE_COOKIE,
  serializeProfile,
} from "@mirai-gikai/shared/respondent-profile";
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { getDictionary } from "./get-dictionary";
import { LOCALE_HTML_LANG, type Locale } from "./locales";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** 「答えない」を選んだとき */
const PREFER_NOT = "none";

/**
 * 言語を選んだ直後に出す、出身の国・地域と年代の質問。
 * 答えは Cookie に保存し、インタビュー開始時に回答と一緒に記録する（集計用）。
 */
export function ProfileChooser({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).profile;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [country, setCountry] = useState<string>("");
  const [age, setAge] = useState<string>("");

  // 国名は回答者の言語で表示し、その言語の並び順で並べる（「その他」は最後）
  const countryOptions = useMemo(() => {
    const lang = LOCALE_HTML_LANG[locale];
    const collator = new Intl.Collator(lang);
    return COUNTRY_CODES.map((code) => ({
      code,
      name: countryDisplayName(code, lang, t.otherCountry),
    })).sort((a, b) => collator.compare(a.name, b.name));
  }, [locale, t.otherCountry]);

  const canSubmit = country !== "" && age !== "" && !isPending;

  const submit = () => {
    const value = serializeProfile({
      country: isCountryCode(country) ? (country as CountryCode) : null,
      ageRange: age === PREFER_NOT ? null : (age as AgeRange),
    });
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API は Safari の対応が限られるため
    document.cookie = `${PROFILE_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-chooser-title"
      lang={LOCALE_HTML_LANG[locale]}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-white/95 px-4 py-8 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <UserRound className="size-10 text-primary" aria-hidden />
        <div className="flex flex-col items-center gap-2 text-center">
          <h2
            id="profile-chooser-title"
            className="text-xl font-bold text-gray-900"
          >
            {t.title}
          </h2>
          <p className="text-sm text-gray-600">{t.lead}</p>
        </div>

        <label className="flex w-full flex-col gap-2">
          <span className="font-medium text-gray-900">{t.countryLabel}</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              {t.countryPlaceholder}
            </option>
            {countryOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
            <option value={OTHER_COUNTRY}>{t.otherCountry}</option>
            <option value={PREFER_NOT}>{t.preferNot}</option>
          </select>
        </label>

        <fieldset className="flex w-full flex-col gap-2">
          <legend className="mb-2 font-medium text-gray-900">
            {t.ageLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[...AGE_RANGES, PREFER_NOT].map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={age === a}
                onClick={() => setAge(a)}
                className={`rounded-xl border px-3 py-2.5 text-base transition-colors ${
                  age === a
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-900 hover:border-primary"
                }`}
              >
                {a === PREFER_NOT ? t.preferNot : t.ages[a as AgeRange]}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="w-full rounded-xl bg-primary px-4 py-3 text-lg font-bold text-white transition-opacity disabled:opacity-40"
        >
          {t.next}
        </button>
      </div>
    </div>
  );
}
