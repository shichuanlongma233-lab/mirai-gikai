import { EXTERNAL_LINKS } from "@/config/external-links";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * フォークの必須要件（FORK_GUIDELINES.md）の表示。
 * 免責文言と、このサービス自身のソースコードへのリンク（AGPL-3.0 第13条）。
 */
export function ForkNotice({
  t,
  className,
}: {
  t: Dictionary;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 text-center text-xs text-slate-600 ${className ?? ""}`}
    >
      <p>{t.common.forkDisclaimer}</p>
      <a
        href={EXTERNAL_LINKS.GITHUB_REPO}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-slate-900"
      >
        {t.common.sourceCode}
      </a>
    </div>
  );
}
