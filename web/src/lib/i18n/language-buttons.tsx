"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { writeLocaleCookie } from "./i18n-provider";
import { LOCALE_LABELS, LOCALES, type Locale } from "./locales";

/**
 * トップに常に出す言語ボタン（日・英・中・韓）。
 * 初回の全画面の言語選択とは別に、いつでもここで切り替えられる。
 */
export function LanguageButtons({ current }: { current: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Globe className="size-4 text-gray-500" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          disabled={isPending}
          aria-pressed={l === current}
          onClick={() => {
            writeLocaleCookie(l, { chosen: true });
            startTransition(() => router.refresh());
          }}
          className={`rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60 ${
            l === current
              ? "border-primary bg-primary text-white"
              : "border-gray-300 bg-white text-gray-700 hover:border-primary"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
