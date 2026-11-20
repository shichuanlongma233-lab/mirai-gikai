import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findInterviewMetricsByBill } from "@/features/interview-reports/server/repositories/interview-report-repository";
import { jsonResult } from "../utils/json-result";

/**
 * トピックごとのAIインタビュー実施状況（実施数・完了数・完了率・総回答時間）を取得する内部向け読み取りツール。
 */
export function registerInterviewMetricsTools(server: McpServer): void {
  server.registerTool(
    "get_interview_metrics_by_bill",
    {
      title: "トピックごとのAIインタビュー実施状況を取得",
      description:
        "トピックごとにAIインタビューの実施数（開始されたセッション総数）・完了数（completed_atが設定されたセッション数）・完了率（完了数/実施数、0〜1）・総回答時間（total_duration_seconds、秒。完了セッションは completed_at−started_at、途中離脱セッションは最終発言までの時間で集計し、発言の無い未完了セッションは集計から除外）・1時間以上を除外した総回答時間（total_duration_seconds_under_1h、秒。上記の所要時間が1時間以上のセッションを除外して合算）を返す。AIインタビュー設定を持つトピックのみが対象で、論理削除済みの設定は除外する。1トピックに複数の設定がある場合は合算する。billId未指定なら全トピックを実施数の多い順で返す。billId指定でそのトピックのみ返す（設定が無いトピックは空配列）。",
      inputSchema: {
        billId: z
          .string()
          .uuid()
          .optional()
          .describe("対象トピックのID（未指定なら全トピック）"),
      },
    },
    async ({ billId }) => {
      const metrics = await findInterviewMetricsByBill(billId);
      return jsonResult(metrics);
    }
  );
}
