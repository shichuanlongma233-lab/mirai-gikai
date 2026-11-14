import Image from "next/image";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

export function ReportProblemButton({
  t = getDictionary("ja"),
}: {
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}) {
  return (
    <a
      href={EXTERNAL_LINKS.REPORT}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 py-2 text-base font-bold"
    >
      <Image
        src="/icons/report-error.svg"
        alt={t.report.reportProblemAlt}
        width={20}
        height={20}
        className="shrink-0"
      />
      {t.report.reportProblem}
    </a>
  );
}
