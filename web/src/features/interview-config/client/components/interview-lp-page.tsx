import { ArrowRight, Undo2 } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BillWithContent } from "@/features/bills/shared/types";
import {
  getBillDetailLink,
  getInterviewDisclosureLink,
} from "@/features/interview-config/shared/utils/interview-links";
import { PastReportsSection } from "@/features/interview-report/client/components/past-reports-section";
import type { UserReportsResult } from "@/features/interview-report/server/loaders/get-user-reports-by-interview-config";
import { InterviewStatusBadge } from "@/features/interview-session/client/components/interview-status-badge";
import { NewInterviewButton } from "@/features/interview-session/client/components/new-interview-button";
import type { LatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import type { InterviewConfig } from "../../server/loaders/get-interview-config";
import { InterviewActionButtons } from "./interview-action-buttons";

interface InterviewLPPageProps {
  bill: BillWithContent;
  interviewConfig: InterviewConfig;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
  userReports?: UserReportsResult | null;
  /** 回答者が選んだ言語 */
  locale?: Locale;
}

/** 特徴のアイコン。文言は辞書の lp.features と同じ順に対応する */
const FEATURE_ICONS: { iconSrc: string; iconSize: { w: number; h: number } }[] =
  [
    { iconSrc: "/icons/interview-ear.svg", iconSize: { w: 21, h: 29 } },
    { iconSrc: "/icons/interview-messages.svg", iconSize: { w: 33, h: 26 } },
    { iconSrc: "/icons/interview-landmark.svg", iconSize: { w: 30, h: 29 } },
  ];

function _InterviewLPHeader({ bill }: { bill: BillWithContent }) {
  return (
    <div className="relative w-full h-50 md:h-80">
      {bill.thumbnail_url ? (
        <Image
          src={bill.thumbnail_url}
          alt={bill.bill_content?.title ?? bill.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      ) : (
        <div className="w-full h-full bg-gray-100" />
      )}
    </div>
  );
}

function _InterviewLPHero({
  bill,
  billId,
  sessionInfo,
  previewToken,
  t,
}: {
  bill: BillWithContent;
  billId: string;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
  t: Dictionary;
}) {
  const billLink = getBillDetailLink(billId, previewToken);

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <LanguageSwitcher className="self-end" />
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center justify-center gap-2 px-6 py-1 mb-3 bg-primary rounded-2xl">
          <span className="text-[13px] font-medium text-white leading-tight">
            {t.lp.badge}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-center leading-[1.5]">
          {t.lp.title}
        </h1>
        <Link href={billLink as Route}>
          <div className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white rounded-xl hover:bg-gray-50 transition-opacity cursor-pointer">
            <span className="text-[13px] font-medium text-black leading-[1.87]">
              {bill.bill_content?.title ?? bill.name}
            </span>
          </div>
        </Link>
        {sessionInfo && <InterviewStatusBadge status={sessionInfo.status} />}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[334px] pl-4">
        {FEATURE_ICONS.map((feature, index) => (
          <div key={feature.iconSrc} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-[54px] h-[54px] bg-white rounded-[30px] flex items-center justify-center">
              <Image
                src={feature.iconSrc}
                alt=""
                width={feature.iconSize.w}
                height={feature.iconSize.h}
              />
            </div>
            <span className="text-[15px] font-medium text-black leading-[1.73] whitespace-pre-line">
              {t.lp.features[index]}
            </span>
          </div>
        ))}
      </div>

      {sessionInfo?.status !== "completed" && (
        <div className="w-full max-w-[560px] mt-2 flex flex-col gap-3">
          <InterviewActionButtons
            billId={billId}
            sessionInfo={sessionInfo}
            previewToken={previewToken}
          />
        </div>
      )}
    </div>
  );
}

function _InterviewOverviewSection({
  billId,
  billName,
  previewToken,
  t,
}: {
  billId: string;
  billName: string;
  previewToken?: string;
  t: Dictionary;
}) {
  const billLink = getBillDetailLink(billId, previewToken);

  return (
    <div className="w-full max-w-[560px] mx-auto bg-white rounded-2xl p-6 space-y-4">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        {t.lp.overviewTitle}
      </h2>
      <div className="space-y-4 text-[15px] font-normal text-black leading-[1.87]">
        <p>
          {t.lp.overviewBefore}
          <Link
            href={billLink as Route}
            className="text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {billName}
          </Link>
          {t.lp.overviewAfter}
        </p>
        <p>{t.lp.overviewUsage}</p>
      </div>
      <div>
        <Link href={billLink as Route}>
          <Button
            variant="outline"
            className="w-full border border-black rounded-[100px] h-[48px] px-6 font-bold text-[15px] hover:opacity-90 transition-opacity flex items-center justify-center gap-4"
          >
            <span>{t.lp.billDetailLink}</span>
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function _InterviewDurationSection({
  estimatedDuration,
  t,
}: {
  estimatedDuration: number | null;
  t: Dictionary;
}) {
  const durationText =
    estimatedDuration === null ? null : t.duration.minutes(estimatedDuration);

  if (!durationText) {
    return null;
  }

  return (
    <div className="w-full max-w-[560px] mx-auto bg-white rounded-2xl p-6 space-y-2">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        {t.lp.durationTitle}
      </h2>
      <p className="text-[22px] font-bold text-primary-accent leading-[1.64]">
        {durationText}
      </p>
    </div>
  );
}

function _InterviewThemesSection({
  themes,
  t,
}: {
  themes: string[] | null | undefined;
  t: Dictionary;
}) {
  if (!themes || themes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[560px] mx-auto bg-white rounded-2xl p-6 space-y-4">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        {t.lp.themesTitle}
      </h2>
      <div className="flex flex-col gap-3">
        {themes.map((theme) => (
          <div key={theme} className="flex gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
              <Image
                src="/icons/check-icon.svg"
                alt=""
                width={24}
                height={24}
                className="object-contain mt-2"
              />
            </div>
            <span className="text-[15px] font-normal text-black leading-[1.87]">
              {theme}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function _InterviewNoticeSection({
  t,
  showContentLanguageNote,
}: {
  t: Dictionary;
  showContentLanguageNote: boolean;
}) {
  return (
    <div className="w-full max-w-[560px] mx-auto bg-white rounded-2xl p-6 space-y-4">
      <h2 className="text-[22px] font-bold text-black leading-[1.64]">
        {t.lp.noticeTitle}
      </h2>
      <div className="space-y-3 text-[13px] font-normal text-black leading-[1.69]">
        <p>{t.lp.notice1}</p>
        <p>{t.lp.notice2}</p>
        {showContentLanguageNote && <p>{t.lp.contentLanguageNote}</p>}
      </div>
    </div>
  );
}

function _InterviewDisclosureLink({
  billId,
  previewToken,
  t,
}: {
  billId: string;
  previewToken?: string;
  t: Dictionary;
}) {
  const disclosureLink = getInterviewDisclosureLink(billId, previewToken);

  return (
    <div className="w-full max-w-[560px] mx-auto">
      <Link
        href={disclosureLink as Route}
        className="text-xs text-black leading-[1.83] underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        {t.lp.disclosureLink}
      </Link>
    </div>
  );
}

function _InterviewFooterActions({
  billId,
  sessionInfo,
  previewToken,
  t,
}: {
  billId: string;
  sessionInfo: LatestInterviewSession | null;
  previewToken?: string;
  t: Dictionary;
}) {
  const billLink = getBillDetailLink(billId, previewToken);

  return (
    <div className="flex flex-col w-full max-w-[370px] mx-auto space-y-4">
      <InterviewActionButtons
        billId={billId}
        sessionInfo={sessionInfo}
        previewToken={previewToken}
      />
      <Link href={billLink as Route}>
        <Button variant="outline" className="w-full">
          <Undo2 className="size-5" />
          <span>{t.lp.backToBill}</span>
        </Button>
      </Link>
    </div>
  );
}

export function InterviewLPPage({
  bill,
  interviewConfig,
  sessionInfo,
  previewToken,
  userReports,
  locale = DEFAULT_LOCALE,
}: InterviewLPPageProps) {
  const t = getDictionary(locale);
  return (
    <div className="flex flex-col gap-8 pb-8 bg-mirai-light-gradient">
      <_InterviewLPHeader bill={bill} />
      <div className="flex flex-col items-center gap-8 px-4">
        <_InterviewLPHero
          bill={bill}
          billId={bill.id}
          sessionInfo={sessionInfo}
          previewToken={previewToken}
          t={t}
        />
        {userReports && userReports.reports.length > 0 && (
          <PastReportsSection reports={userReports.reports} />
        )}
        {sessionInfo?.status === "completed" && sessionInfo?.reportId && (
          <div className="w-full max-w-[560px]">
            <NewInterviewButton billId={bill.id} previewToken={previewToken} />
          </div>
        )}
        <_InterviewOverviewSection
          billId={bill.id}
          billName={bill.bill_content?.title ?? bill.name}
          previewToken={previewToken}
          t={t}
        />
        <_InterviewDurationSection
          estimatedDuration={interviewConfig.estimated_duration}
          t={t}
        />
        <_InterviewThemesSection themes={interviewConfig.themes} t={t} />
        <_InterviewNoticeSection
          t={t}
          showContentLanguageNote={locale !== DEFAULT_LOCALE}
        />
        <_InterviewDisclosureLink
          billId={bill.id}
          previewToken={previewToken}
          t={t}
        />
        <_InterviewFooterActions
          billId={bill.id}
          sessionInfo={sessionInfo}
          previewToken={previewToken}
          t={t}
        />
      </div>
    </div>
  );
}
