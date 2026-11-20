import { ChevronRight, LayoutDashboard } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import {
  getAllInterviewConfigs,
  getSessionCountsForConfigs,
} from "@/features/interviews/server/loaders/get-all-interview-configs";
import { routes } from "@/lib/routes";

/**
 * レポート集計：トピック（インタビュー）を選んで、市場調査ダッシュボードを開く入口。
 */
export default async function InsightsIndexPage() {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    redirect(routes.login());
  }

  const configs = await getAllInterviewConfigs();
  const sessionCounts = await getSessionCountsForConfigs(
    configs.map((c) => c.id)
  );
  // 公開中を先に、その中は回答の多い順
  const sorted = [...configs].sort((a, b) => {
    if (a.status !== b.status) return a.status === "public" ? -1 : 1;
    return (sessionCounts?.[b.id] ?? 0) - (sessionCounts?.[a.id] ?? 0);
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">レポート集計</h1>
      <p className="mt-1 mb-8 text-gray-600">
        トピックを選ぶと、反応・購入意向・価格の印象・良い点と不満点・言語ごとの違いをまとめた集計が開きます。
      </p>

      {sorted.length === 0 ? (
        <p className="text-gray-500">インタビューがまだありません。</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((config) => (
            <li key={config.id}>
              <Link
                href={routes.billInsights(config.bill_id, config.id) as Route}
                className="flex h-full items-center gap-4 rounded-lg border bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
              >
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {config.bill.name}
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {config.name}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Badge
                      variant={
                        config.status === "public" ? "default" : "secondary"
                      }
                    >
                      {config.status === "public" ? "公開中" : "非公開"}
                    </Badge>
                    回答 {sessionCounts?.[config.id] ?? 0}件
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
