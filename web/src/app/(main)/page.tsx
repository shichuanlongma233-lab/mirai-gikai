import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { getInterviewOpenBills } from "@/features/bills/server/loaders/get-interview-open-bills";
import type { BillWithContent } from "@/features/bills/shared/types";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";
import { translateTopicIntro } from "@/features/interview-config/server/services/translate-topic-intro";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { getRequestLocale } from "@/lib/i18n/server";

/**
 * トップページ。回答を受け付けているトピックを並べ、インタビューへ案内する。
 * （元の議会向けトップ＝会期・法案検索・チームみらい紹介は使わない）
 */
export default async function Home() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);
  const bills = await getInterviewOpenBills();
  const topics = await Promise.all(
    bills.map((bill) => toTopicCard(bill, locale))
  );

  return (
    <Container>
      <div className="pt-24 pb-10 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t.home.title}
        </h1>
        <p className="mt-3 text-gray-600 leading-relaxed">{t.home.lead}</p>

        {topics.length === 0 ? (
          <p className="mt-10 text-gray-500">{t.home.empty}</p>
        ) : (
          <ul className="mt-8 grid gap-4">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={getInterviewLPLink(topic.id) as Route}
                  className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow"
                >
                  <h2 className="text-lg font-bold text-gray-900">
                    {topic.title}
                  </h2>
                  {topic.summary && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {topic.summary}
                    </p>
                  )}
                  <span className="mt-4 inline-block text-sm font-bold text-primary">
                    {t.home.start} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

async function toTopicCard(bill: BillWithContent, locale: Locale) {
  const title = bill.bill_content?.title || bill.name;
  const summary = bill.bill_content?.summary || "";
  const { intro } = await translateTopicIntro(
    { title, summary, content: "", themes: [] },
    locale
  );
  return { id: bill.id, title: intro.title, summary: intro.summary };
}
