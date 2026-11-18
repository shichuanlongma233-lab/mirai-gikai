import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { InterviewLPPage } from "@/features/interview-config/client/components/interview-lp-page";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { translateTopicIntro } from "@/features/interview-config/server/services/translate-topic-intro";
import { getUserReportsByInterviewConfig } from "@/features/interview-report/server/loaders/get-user-reports-by-interview-config";
import { getLatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import { env } from "@/lib/env";
import { LanguageChooser } from "@/lib/i18n/language-chooser";
import { getRequestLocale, hasChosenLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

interface InterviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: InterviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  // タブ名も回答者の言語にする（本文と同じ入力なので翻訳はキャッシュを共有する）
  const [locale, chosen, interviewConfig] = await Promise.all([
    getRequestLocale(),
    hasChosenLocale(),
    getInterviewConfig(id),
  ]);
  let billName = bill.bill_content?.title ?? bill.name;
  if (chosen && interviewConfig) {
    const { intro } = await translateTopicIntro(
      {
        title: billName,
        summary: bill.bill_content?.summary ?? "",
        content: bill.bill_content?.content ?? "",
        themes: interviewConfig.themes ?? [],
      },
      locale
    );
    billName = intro.title;
  }
  const label = getDictionary(locale).common.aiInterview;
  const description = `${label} - ${billName}`;
  const defaultOgpUrl = new URL("/ogp.jpg", env.webUrl).toString();
  const shareImageUrl =
    bill.share_thumbnail_url || bill.thumbnail_url || defaultOgpUrl;

  return {
    title: description,
    description: description,
    alternates: {
      canonical: `/bills/${bill.id}/interview`,
    },
    openGraph: {
      title: description,
      description: description,
      type: "website",
      images: [
        {
          url: shareImageUrl,
          alt: `${billName} のAIインタビューページ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: description,
      description: description,
      images: [shareImageUrl],
    },
  };
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { id } = await params;
  const [bill, interviewConfig] = await Promise.all([
    getBillById(id),
    getInterviewConfig(id),
  ]);

  if (!bill) {
    notFound();
  }

  if (!interviewConfig) {
    notFound();
  }

  // 最新のセッション情報とユーザーの過去レポートを取得
  const [latestSession, userReports] = await Promise.all([
    getLatestInterviewSession(interviewConfig.id),
    getUserReportsByInterviewConfig(interviewConfig.id),
  ]);

  const [locale, chosen] = await Promise.all([
    getRequestLocale(),
    hasChosenLocale(),
  ]);

  // 最初に開いたときは言語選択だけを出す（選ぶ前に翻訳しない）
  if (!chosen) {
    return (
      <>
        <LanguageChooser suggested={locale} />
        <InterviewLPPage
          locale={locale}
          bill={bill}
          interviewConfig={interviewConfig}
          sessionInfo={latestSession}
          userReports={userReports}
        />
      </>
    );
  }

  const { intro } = await translateTopicIntro(
    {
      title: bill.bill_content?.title ?? bill.name,
      summary: bill.bill_content?.summary ?? "",
      content: bill.bill_content?.content ?? "",
      themes: interviewConfig.themes ?? [],
    },
    locale
  );

  return (
    <InterviewLPPage
      locale={locale}
      intro={intro}
      bill={bill}
      interviewConfig={interviewConfig}
      sessionInfo={latestSession}
      userReports={userReports}
    />
  );
}
