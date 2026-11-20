"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { writeLocaleCookie } from "./i18n-provider";
import { LOCALE_LABELS, LOCALES, type Locale } from "./locales";

/** どの言語の人にも読めるよう、見出しは全言語で並べる */
const HEADINGS: Record<Locale, string> = {
  ja: "言語を選んでください",
  en: "Choose your language",
  zh: "请选择语言",
  ko: "언어를 선택하세요",
};

/**
 * 回答者が最初に開いたときに出す、全画面の言語選択。
 * 選ぶと Cookie に保存し、以降は出さない（右上のメニューで後から変更できる）。
 */
export function LanguageChooser({ suggested }: { suggested: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Locale | null>(null);

  const choose = (locale: Locale) => {
    setSelected(locale);
    writeLocaleCookie(locale, { chosen: true });
    startTransition(() => router.refresh());
  };

  // ブラウザの言語設定に合う言語を先頭に出す
  const ordered = [suggested, ...LOCALES.filter((l) => l !== suggested)];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-chooser-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Globe className="size-10 text-primary" aria-hidden />
        <div
          id="language-chooser-title"
          className="flex flex-col items-center gap-1 text-center"
        >
          {ordered.map((l) => (
            <p
              key={l}
              lang={l}
              className={
                l === suggested
                  ? "text-xl font-bold text-gray-900"
                  : "text-sm text-gray-500"
              }
            >
              {HEADINGS[l]}
            </p>
          ))}
        </div>
        <div className="flex w-full flex-col gap-3">
          {ordered.map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              disabled={isPending}
              onClick={() => choose(l)}
              className={`w-full rounded-xl border px-4 py-3 text-lg font-medium transition-colors disabled:opacity-60 ${
                selected === l
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-900 hover:border-primary"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
