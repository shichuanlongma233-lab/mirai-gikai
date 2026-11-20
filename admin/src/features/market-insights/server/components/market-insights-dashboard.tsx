import "server-only";

import type { Route } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type Breakdown,
  LANGUAGE_LABELS,
  percent,
  type Theme,
} from "../../shared/utils/aggregate-insights";
import { routes } from "@/lib/routes";
import type { MarketInsights } from "../loaders/get-market-insights";

type Segment = { label: string; count: number; className: string };

/** 横一本の積み上げバーと凡例。unknown は分母から外して「不明 n人」と添える */
function SegmentBar({
  segments,
  unknown = 0,
}: {
  segments: Segment[];
  unknown?: number;
}) {
  const known = segments.reduce((s, x) => s + x.count, 0);
  if (known === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        まだ話題に出ていません{unknown > 0 ? `（不明 ${unknown}人）` : ""}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.label}
              className={s.className}
              style={{ width: `${(s.count / known) * 100}%` }}
              title={`${s.label} ${s.count}人`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block size-2.5 rounded-full ${s.className}`}
            />
            {s.label}
            <span className="font-semibold">{percent(s.count, known)}%</span>
            <span className="text-muted-foreground">({s.count}人)</span>
          </span>
        ))}
        {unknown > 0 && (
          <span className="text-muted-foreground">話題に出ず {unknown}人</span>
        )}
      </div>
    </div>
  );
}

const GOOD = "bg-emerald-500";
const MID = "bg-amber-400";
const BAD = "bg-rose-500";
const GRAY = "bg-gray-400";

function overallSegments(b: Breakdown): Segment[] {
  return [
    { label: "好意的", count: b.overall.positive, className: GOOD },
    { label: "中立", count: b.overall.neutral, className: GRAY },
    { label: "否定的", count: b.overall.negative, className: BAD },
  ];
}

function intentSegments(
  c: Breakdown["purchaseIntent"],
  yes: string
): Segment[] {
  return [
    { label: yes, count: c.yes, className: GOOD },
    { label: "迷っている", count: c.maybe, className: MID },
    { label: "いいえ", count: c.no, className: BAD },
  ];
}

function priceSegments(c: Breakdown["priceImpression"]): Segment[] {
  return [
    { label: "安い", count: c.cheap, className: "bg-sky-500" },
    { label: "妥当", count: c.fair, className: GOOD },
    { label: "高い", count: c.expensive, className: BAD },
  ];
}

function ThemeList({
  themes,
  total,
  barClass,
}: {
  themes: Theme[];
  total: number;
  barClass: string;
}) {
  if (themes.length === 0) {
    return <p className="text-sm text-muted-foreground">まだありません</p>;
  }
  const max = Math.max(...themes.map((t) => t.count));
  return (
    <ol className="space-y-2.5">
      {themes.map((t, i) => (
        <li key={t.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>
              <span className="mr-2 text-muted-foreground">{i + 1}.</span>
              {t.label}
            </span>
            <span className="shrink-0 font-semibold">
              {t.count}人
              <span className="ml-1 font-normal text-muted-foreground">
                ({percent(t.count, total)}%)
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className={`h-1.5 rounded-full ${barClass}`}
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="py-4">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function knownPct(yes: number, c: Record<string, number>): string {
  const known = Object.entries(c)
    .filter(([k]) => k !== "unknown")
    .reduce((s, [, v]) => s + v, 0);
  return known === 0 ? "—" : `${percent(yes, known)}%`;
}

export function MarketInsightsDashboard({
  data,
  billId,
  configId,
}: {
  data: MarketInsights;
  billId: string;
  configId: string;
}) {
  const { aggregate: a, summary, respondents } = data;
  const b = a.breakdown;

  if (a.total === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          まだ完了した回答がありません。回答が集まるとここに集計が出ます。
          {data.failedCount > 0 &&
            `（${data.failedCount}人分はAIの読み取りに失敗しました。少し時間をおいて開き直してください）`}
        </CardContent>
      </Card>
    );
  }

  const highlights = (summary?.highlightRespondents ?? [])
    .map((n) => respondents[n - 1])
    .filter((r) => r?.insight.quoteOriginal);

  return (
    <div className="space-y-6">
      {data.failedCount > 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {data.failedCount}
          人分はAIの読み取りに失敗したため、集計に入っていません（無料枠の上限の可能性があります）。少し時間をおいて開き直すと入ります。
        </p>
      )}

      {/* 1. 主要な数字 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi
          label="完了した回答"
          value={`${a.total}人`}
          sub={
            data.incompleteCount > 0
              ? `途中のもの ${data.incompleteCount}件`
              : undefined
          }
        />
        <Kpi
          label="好意的"
          value={`${percent(b.overall.positive, a.total)}%`}
          sub={`${b.overall.positive}人`}
        />
        <Kpi
          label="買いたい"
          value={knownPct(b.purchaseIntent.yes, b.purchaseIntent)}
          sub="話題に出た人のうち"
        />
        <Kpi
          label="ギフトにしたい"
          value={knownPct(b.giftIntent.yes, b.giftIntent)}
          sub="話題に出た人のうち"
        />
      </div>

      {/* 2. AIのまとめ */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>まとめ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed">{summary.summary}</p>
            {summary.nextActions.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-semibold">次の一手</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {summary.nextActions.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. 反応・購入意向・ギフト・価格 */}
      <Card>
        <CardHeader>
          <CardTitle>反応と購入意向</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">全体の反応</p>
            <SegmentBar segments={overallSegments(b)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">自分用に買いたいか</p>
            <SegmentBar
              segments={intentSegments(b.purchaseIntent, "買いたい")}
              unknown={b.purchaseIntent.unknown}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">ギフト・お土産にしたいか</p>
            <SegmentBar
              segments={intentSegments(b.giftIntent, "したい")}
              unknown={b.giftIntent.unknown}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">価格の印象</p>
            <SegmentBar
              segments={priceSegments(b.priceImpression)}
              unknown={b.priceImpression.unknown}
            />
            {a.priceComments.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {a.priceComments.slice(0, 6).map((c) => (
                  <li key={c}>・{c}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. 良い点・不満点 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>よく出た良い点</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeList
              themes={a.positiveThemes}
              total={a.total}
              barClass={GOOD}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>よく出た不満・懸念</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeList
              themes={a.negativeThemes}
              total={a.total}
              barClass={BAD}
            />
          </CardContent>
        </Card>
      </div>

      {/* 5. 言語・国・年代ごとの違い */}
      <GroupTable
        title="言語ごとの違い"
        keyLabel="言語"
        rows={a.byLanguage.map((row) => ({
          key: row.language,
          label: LANGUAGE_LABELS[row.language],
          count: row.count,
          breakdown: row.breakdown,
        }))}
      />
      <GroupTable
        title="国・地域ごとの違い"
        keyLabel="出身の国・地域"
        rows={a.byCountry}
        emptyNote="国・地域を聞く前に回答した人は「答えていない」に入ります。"
      />
      <GroupTable
        title="年代ごとの違い"
        keyLabel="年代"
        rows={a.byAge}
        emptyNote="年代を聞く前に回答した人は「答えていない」に入ります。"
      />

      {/* 6. 印象的な回答 */}
      {highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>印象的な回答</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {highlights.map((r) => (
              <figure
                key={r.sessionId}
                className="rounded-lg border-l-4 border-primary/60 bg-muted/40 px-4 py-3"
              >
                <blockquote className="space-y-1">
                  <p className="font-medium">「{r.insight.quoteJa}」</p>
                  {r.insight.language !== "ja" &&
                    r.insight.quoteOriginal !== r.insight.quoteJa && (
                      <p className="text-sm text-muted-foreground">
                        原文: {r.insight.quoteOriginal}
                      </p>
                    )}
                </blockquote>
                <figcaption className="mt-1 text-xs text-muted-foreground">
                  {LANGUAGE_LABELS[r.insight.language]}で回答・
                  {r.insight.oneLine}
                </figcaption>
              </figure>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 7. 回答者ごとの一言 */}
      <Card>
        <CardHeader>
          <CardTitle>回答者ごとの一言</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {respondents.map((r, i) => (
              <li key={r.sessionId} className="flex gap-3 py-2">
                <span className="w-8 shrink-0 text-muted-foreground">
                  #{i + 1}
                </span>
                <span className="w-14 shrink-0 text-muted-foreground">
                  {LANGUAGE_LABELS[r.insight.language]}
                </span>
                <Link
                  href={
                    routes.billReportDetail(
                      billId,
                      configId,
                      r.sessionId
                    ) as Route
                  }
                  className="hover:underline"
                >
                  {r.insight.oneLine}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/** 言語・国・年代などのグループごとに、反応・購入意向・価格の違いを並べる表 */
function GroupTable({
  title,
  keyLabel,
  rows,
  emptyNote,
}: {
  title: string;
  keyLabel: string;
  rows: Array<{
    key: string;
    label: string;
    count: number;
    breakdown: Breakdown;
  }>;
  emptyNote?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">{keyLabel}</th>
                <th className="py-2 pr-4 font-medium">人数</th>
                <th className="py-2 pr-4 font-medium">好意的</th>
                <th className="py-2 pr-4 font-medium">否定的</th>
                <th className="py-2 pr-4 font-medium">買いたい</th>
                <th className="py-2 pr-4 font-medium">ギフトにしたい</th>
                <th className="py-2 font-medium">価格が高い</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{row.label}</td>
                  <td className="py-2 pr-4">{row.count}人</td>
                  <td className="py-2 pr-4">
                    {percent(row.breakdown.overall.positive, row.count)}%
                  </td>
                  <td className="py-2 pr-4">
                    {percent(row.breakdown.overall.negative, row.count)}%
                  </td>
                  <td className="py-2 pr-4">
                    {knownPct(
                      row.breakdown.purchaseIntent.yes,
                      row.breakdown.purchaseIntent
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {knownPct(
                      row.breakdown.giftIntent.yes,
                      row.breakdown.giftIntent
                    )}
                  </td>
                  <td className="py-2">
                    {knownPct(
                      row.breakdown.priceImpression.expensive,
                      row.breakdown.priceImpression
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          購入・ギフト・価格は、その話題が出た人のうちの割合です。
          {emptyNote ? ` ${emptyNote}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
