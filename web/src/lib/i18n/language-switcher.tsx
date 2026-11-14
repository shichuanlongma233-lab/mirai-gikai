"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n, writeLocaleCookie } from "./i18n-provider";
import { isLocale, LOCALE_LABELS, LOCALES } from "./locales";

/** 回答者向け画面の言語切り替え。選んだ言語は Cookie に保存する */
export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className={`inline-flex items-center gap-1.5 text-sm text-gray-700 ${className ?? ""}`}
    >
      <Globe className="size-4" aria-hidden />
      <span className="sr-only">{t.common.languageLabel}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          if (!isLocale(next)) return;
          writeLocaleCookie(next);
          startTransition(() => router.refresh());
        }}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
