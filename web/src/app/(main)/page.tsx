import { Clock } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import {
  getInterviewOpenBills,
  type InterviewOpenBill,
} from "@/features/bills/server/loaders/get-interview-open-bills";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";
import { translateTopicIntro } from "@/features/interview-config/server/services/translate-topic-intro";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LanguageButtons } from "@/lib/i18n/language-buttons";
import { LanguageChooser } from "@/lib/i18n/language-chooser";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { ProfileChooser } from "@/lib/i18n/profile-chooser";
import {
  getRequestLocale,
  getRespondentProfile,
  hasChosenLocale,
} from "@/lib/i18n/server";

/**
 * トップページ。回答を受け付けているトピック（公開中のインタビュー）を一覧にし、
 * 選ぶとそのインタビューの紹介ページへ進む。
 * 初めて開いた人には、先に言語を選んでもらう。
 */
export default async function Home() {
  const [locale, chosen, profile] = await Promise.all([
    getRequestLocale(),
    hasChosenLocale(),
    getRespondentProfile(),
  ]);
  const t = getDictionary(locale);
  const bills = await getInterviewOpenBills();
  // 言語を選ぶ前は翻訳しない（選んだ後に、その言語で出し直す）
  const topics = await Promise.all(
    bills.map((bill) => toTopicCard(bill, chosen ? locale : DEFAULT_LOCALE))
  );

  return (
    <>
      {!chosen && <LanguageChooser suggested={locale} />}
      {chosen && !profile && <ProfileChooser locale={locale} />}
      <Container>
        <div className="pt-24 pb-10 md:py-16 text-center">
          <div className="mb-6">
            <LanguageButtons current={locale} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t.home.title}
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">{t.home.lead}</p>

          {topics.length === 0 ? (
            <p className="mt-10 text-gray-500">{t.home.empty}</p>
          ) : (
            <>
              <h2 className="mt-10 text-sm font-bold text-gray-500">
                {t.home.listTitle(topics.length)}
              </h2>
              <ul className="mt-3 grid gap-4 text-left md:grid-cols-2">
                {topics.map((topic) => (
                  <li key={topic.id}>
                    <Link
                      href={getInterviewLPLink(topic.id) as Route}
                      className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-primary hover:shadow"
                    >
                      {topic.thumbnailUrl && (
                        <div className="relative aspect-[16/9] w-full bg-gray-100">
                          <Image
                            src={topic.thumbnailUrl}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="text-lg font-bold text-gray-900">
                          {topic.title}
                        </h3>
                        {topic.summary && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                            {topic.summary}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          {topic.estimatedDuration !== null ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="size-3.5" aria-hidden />
                              {t.duration.minutes(topic.estimatedDuration)}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="text-sm font-bold text-primary">
                            {t.home.start} →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Container>
    </>
  );
}

async function toTopicCard(bill: InterviewOpenBill, locale: Locale) {
  const title = bill.bill_content?.title || bill.name;
  const summary = bill.bill_content?.summary || "";
  const { intro } = await translateTopicIntro(
    { title, summary, content: "", themes: [] },
    locale
  );
  return {
    id: bill.id,
    title: intro.title,
    summary: intro.summary,
    thumbnailUrl: bill.thumbnail_url,
    estimatedDuration: bill.estimatedDuration,
  };
}
