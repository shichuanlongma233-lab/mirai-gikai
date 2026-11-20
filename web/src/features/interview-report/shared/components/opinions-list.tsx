import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getInterviewMessageLink } from "@/features/interview-config/shared/utils/interview-links";
import type { ParsedOpinion as Opinion } from "../utils/format-utils";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

export type { Opinion };

interface OpinionsListProps {
  opinions: Opinion[];
  title?: string;
  footer?: ReactNode;
  reportId?: string;
  chatLogFrom?: "complete" | "opinions";
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}

export function OpinionsList({
  opinions,
  title = "💬意見の要約",
  footer,
  reportId,
  chatLogFrom,
  t = getDictionary("ja"),
}: OpinionsListProps) {
  if (opinions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
        {opinions.map((opinion, index) => (
          <div
            key={`opinion-${index}-${opinion.title.slice(0, 20)}`}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col gap-1">
              <div className="inline-flex">
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {t.report.opinionN(index + 1)}
                </span>
              </div>
              <p className="text-base font-bold text-gray-800">
                {opinion.title}
              </p>
            </div>
            <p className="text-sm text-gray-600">{opinion.content}</p>
            {reportId && opinion.source_message_id && (
              <Link
                href={
                  getInterviewMessageLink(
                    reportId,
                    opinion.source_message_id,
                    chatLogFrom
                  ) as Route
                }
                className="text-[15px] leading-6 text-mirai-text-muted underline"
              >
                {t.report.viewOriginal}
              </Link>
            )}
          </div>
        ))}
        {footer}
      </div>
    </div>
  );
}
