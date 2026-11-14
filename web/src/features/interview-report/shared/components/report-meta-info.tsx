import type { Route } from "next";
import Link from "next/link";
import { getInterviewChatLogLink } from "@/features/interview-config/shared/utils/interview-links";
import { ReactionButtonsInline } from "@/features/report-reaction/client/components/reaction-buttons-inline";
import type { ReportReactionData } from "@/features/report-reaction/shared/types";
import { formatDateTime } from "../utils/report-utils";
import { RoleDisplay } from "./role-display";
import { StanceDisplay } from "./stance-display";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

interface ReportMetaInfoProps {
  reportId: string;
  stance?: string | null;
  role?: string | null;
  roleTitle?: string | null;
  sessionStartedAt: string | null;
  characterCount: number;
  reactionData?: ReportReactionData;
  /** 遷移元のコンテキスト */
  from?: "complete" | "opinions";
  /** trueの場合、会話ログへのリンクにしない */
  disableLink?: boolean;
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}

export function ReportMetaInfo({
  reportId,
  stance,
  role,
  roleTitle,
  sessionStartedAt,
  characterCount,
  reactionData,
  from,
  disableLink,
  t = getDictionary("ja"),
}: ReportMetaInfoProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-3">
        {/* スタンス */}
        {stance && <StanceDisplay stance={stance} t={t} />}
        {/* 役割 */}
        {(role || roleTitle) && (
          <RoleDisplay role={role} roleTitle={roleTitle} t={t} />
        )}
      </div>

      {/* 日時・時間・文字数 */}
      <div className="text-black text-center">
        <p className="text-base font-medium mb-2">
          {formatDateTime(sessionStartedAt)}
        </p>
        {disableLink ? (
          <p className="text-xs font-normal">
            {t.report.volumeShort}
            <span className="ml-2">
              {t.report.charactersShort(characterCount)}
            </span>
          </p>
        ) : (
          <Link
            href={getInterviewChatLogLink(reportId, from) as Route}
            className="text-xs font-normal"
          >
            {t.report.volumeShort}
            <span className="underline ml-2">
              {t.report.charactersShort(characterCount)}
            </span>
          </Link>
        )}
      </div>

      {/* 参考になるボタン */}
      {reactionData && (
        <ReactionButtonsInline reportId={reportId} initialData={reactionData} />
      )}
    </div>
  );
}
