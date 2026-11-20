import { ArrowLeft, List } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { MarketInsightsDashboard } from "@/features/market-insights/server/components/market-insights-dashboard";
import { getMarketInsights } from "@/features/market-insights/server/loaders/get-market-insights";
import { routes } from "@/lib/routes";

// 初回は回答者ごとにAIで読み取るため時間がかかる（2回目からは使い回す）
export const maxDuration = 300;

interface InsightsPageProps {
  params: Promise<{ id: string; configId: string }>;
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const { id, configId } = await params;
  const bill = await getBillById(id);
  if (!bill) {
    notFound();
  }
  const topicTitle = bill.name;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.insights() as Route}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          レポート集計に戻る
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            市場調査ダッシュボード
          </h1>
          <p className="mt-1 text-gray-600">トピック「{bill.name}」</p>
        </div>
        <Button asChild variant="outline">
          <Link href={routes.billReports(id, configId) as Route}>
            <List className="h-4 w-4" />
            回答者ごとのレポート
          </Link>
        </Button>
      </div>

      <Suspense fallback={<InsightsLoading />}>
        <InsightsContent
          billId={id}
          configId={configId}
          topicTitle={topicTitle}
        />
      </Suspense>
    </div>
  );
}

async function InsightsContent({
  billId,
  configId,
  topicTitle,
}: {
  billId: string;
  configId: string;
  topicTitle: string;
}) {
  const data = await getMarketInsights(configId, topicTitle);
  return (
    <MarketInsightsDashboard data={data} billId={billId} configId={configId} />
  );
}

function InsightsLoading() {
  return (
    <div className="rounded-lg border bg-white px-6 py-12 text-center text-gray-600">
      <p className="font-medium">AIが回答を読み取って集計しています…</p>
      <p className="mt-1 text-sm text-gray-500">
        初回は回答の数に応じて数十秒〜数分かかります。2回目からはすぐに開きます。
      </p>
    </div>
  );
}
