import {
  memoProgress,
  orderedPillars,
  parseMemo,
  POINT_STATUS_LABELS_JA,
  type PointStatus,
  validatePillarSet,
} from "@mirai-gikai/shared/pillars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_CLASS: Record<PointStatus, string> = {
  answered: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  unasked: "bg-gray-100 text-gray-600",
  declined: "bg-red-100 text-red-700",
  not_applicable: "bg-gray-50 text-gray-400",
};

/**
 * 回答メモ方式のセッションで、聞きたい点ごとの回答状況を表で見せる。
 * 回答メモや柱がなければ何も出さない。
 */
export function AnswerMemoCard({
  pillars,
  answerMemo,
}: {
  pillars: unknown;
  answerMemo: unknown;
}) {
  if (!pillars || !answerMemo) return null;
  const checked = validatePillarSet(pillars);
  const memo = parseMemo(answerMemo);
  if (!checked.ok || !memo) return null;
  const set = checked.set;
  const progress = memoProgress(set, memo);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>回答メモ</CardTitle>
        <p className="text-sm text-gray-600">
          聞きたい点 {progress.total}個のうち、答えた {progress.answered}・一部{" "}
          {progress.partial}・答えたくない {progress.declined}（往復{" "}
          {memo.turns}
          回、書き直し {memo.rewrites}回）
          {memo.pillarVersion > 0 && ` ／ 柱 第${memo.pillarVersion}版`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedPillars(set).map((pillar) => (
          <div key={pillar.id}>
            <div className="mb-1 text-sm font-semibold">{pillar.name}</div>
            <table className="w-full text-xs">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="w-1/5 py-1 pr-2">聞きたい点</th>
                  <th className="w-20 py-1 pr-2">状態</th>
                  <th className="py-1 pr-2">答え</th>
                  <th className="py-1">本人の言葉</th>
                </tr>
              </thead>
              <tbody>
                {pillar.points.map((point) => {
                  const pm = memo.points[point.id];
                  const status: PointStatus = pm?.status ?? "unasked";
                  return (
                    <tr key={point.id} className="border-t align-top">
                      <td className="py-1 pr-2">{point.name}</td>
                      <td className="py-1 pr-2">
                        <span
                          className={`rounded px-1.5 py-0.5 ${STATUS_CLASS[status]}`}
                        >
                          {POINT_STATUS_LABELS_JA[status]}
                        </span>
                        {pm?.volunteered && (
                          <div className="mt-1 text-gray-500">
                            自分から話した
                          </div>
                        )}
                      </td>
                      <td className="py-1 pr-2">
                        {pm?.value ?? ""}
                        {status === "partial" && pm?.missing && (
                          <div className="text-amber-700">
                            足りない: {pm.missing}
                          </div>
                        )}
                      </td>
                      <td className="py-1 text-gray-700">
                        {pm?.quote ? `「${pm.quote}」` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
