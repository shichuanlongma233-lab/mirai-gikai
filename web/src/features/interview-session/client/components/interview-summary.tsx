"use client";

import { useMemo } from "react";
import type { InterviewReportViewData } from "@/features/interview-session/shared/schemas";
import { useI18n } from "@/lib/i18n/i18n-provider";

type Props = {
  report: InterviewReportViewData;
};

export function InterviewSummary({ report }: Props) {
  const { t } = useI18n();
  const opinions = useMemo(() => {
    if (!report.opinions || !Array.isArray(report.opinions)) return [];
    return report.opinions as Array<{ title: string; content: string }>;
  }, [report.opinions]);

  return (
    <div className="rounded-[16px] bg-mirai-light-gradient p-4 shadow-sm">
      <div className="mt-2 space-y-4 text-sm">
        {report.summary && (
          <div className="font-bold space-y-1">
            <p className="text-primary-accent">{t.summary.opinionSummary}</p>
            <p className="whitespace-pre-wrap">{report.summary}</p>
          </div>
        )}
        {report.stance && (
          <div className="font-bold space-y-1">
            <p className="text-primary-accent">{t.summary.stance}</p>
            <p>{t.stances[report.stance] || report.stance}</p>
          </div>
        )}
        {(report.role || report.role_description || report.role_title) && (
          <div className="space-y-4 font-bold">
            {(report.role || report.role_title) && (
              <div className="space-y-1">
                <p className="text-primary-accent">{t.summary.role}</p>
                <p>
                  {[
                    report.role ? t.roles[report.role] || report.role : null,
                    report.role_title,
                  ]
                    .filter(Boolean)
                    .join("・")}
                </p>
              </div>
            )}
            {report.role_description && (
              <div className="whitespace-pre-wrap space-y-1">
                <p className="text-primary-accent">{t.summary.roleDetail}</p>
                <p>{report.role_description}</p>
              </div>
            )}
          </div>
        )}
        {opinions.length > 0 && (
          <div className="space-y-1">
            <p className="font-bold text-primary-accent">
              {t.summary.mainOpinions}
            </p>
            <ul className="space-y-4">
              {opinions.map((op, index) => (
                <li
                  key={`${op.title}-${op.content}`}
                  className="whitespace-pre-wrap"
                >
                  <p className="font-bold mb-1">
                    {index + 1}. {op.title}
                  </p>
                  <p>{op.content}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
