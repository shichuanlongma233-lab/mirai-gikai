import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { previewTokenService } from "@/features/bills/server/services/preview-token-service";
import { env } from "@/lib/env";
import { buildPreviewUrl } from "@/lib/utils/build-preview-url";
import { jsonResult } from "../utils/json-result";

export function registerPreviewTools(server: McpServer): void {
  server.registerTool(
    "generate_preview_url",
    {
      title: "トピックのプレビューURLを発行",
      description:
        "指定IDのトピックのプレビューURLを発行する。下書き(draft)や公開前(coming_soon)のトピックを確認するために使用。既存の有効なトークンがあればそれを再利用し、なければ新規発行する（30日有効）。type でトピック詳細ページまたはインタビューページのURLを切り替え可能。",
      inputSchema: {
        billId: z.string().uuid().describe("トピックID"),
        type: z
          .enum(["bill", "interview"])
          .default("bill")
          .describe(
            "プレビュー対象: bill=トピック詳細ページ, interview=インタビューページ"
          ),
      },
    },
    async ({ billId, type }) => {
      const tokenInfo = await previewTokenService.getOrCreateToken(billId);

      const path =
        type === "interview"
          ? `/preview/bills/${billId}/interview`
          : `/preview/bills/${billId}`;

      const url = buildPreviewUrl(env.webUrl, path, tokenInfo.token);

      return jsonResult({
        ok: true,
        url,
        token: tokenInfo.token,
        expiresAt: tokenInfo.expiresAt,
      });
    }
  );
}
