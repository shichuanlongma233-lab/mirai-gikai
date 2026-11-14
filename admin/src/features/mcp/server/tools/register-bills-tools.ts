import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  findBillsWithDietSessions,
  updateBillPublishStatus,
} from "@/features/bills/server/repositories/bill-repository";
import {
  createBillRecord,
  createBillsTags,
  deleteBillsTags,
  findBillById,
  findBillBySlug,
  findBillContentsByBillId,
  findBillsTagsByBillId,
  upsertBillContent,
} from "@/features/bills-edit/server/repositories/bill-edit-repository";
import { updateBillWithSideEffects } from "@/features/bills-edit/server/services/update-bill-with-side-effects";
import {
  billCreateSchema,
  billUpdateSchema,
} from "@/features/bills-edit/shared/types";
import { billContentsUpdateSchema } from "@/features/bills-edit/shared/types/bill-contents";
import { calculateSetDiff } from "@/lib/utils/calculate-set-diff";
import { invalidateBillsCache } from "../utils/invalidate-bills-cache";
import { jsonResult } from "../utils/json-result";

export function registerBillsTools(server: McpServer): void {
  server.registerTool(
    "list_bills",
    {
      title: "トピック一覧を取得",
      description:
        "mirai議会adminに登録されているトピックを返す。各トピックにdiet_session名も含む。publish_status / status でフィルタ可能。",
      inputSchema: {
        publish_status: z
          .enum(["draft", "published", "coming_soon"])
          .optional()
          .describe("公開ステータスでフィルタ"),
        status: billUpdateSchema.shape.status
          .optional()
          .describe("審議ステータスでフィルタ"),
      },
    },
    async ({ publish_status, status }) => {
      const bills = await findBillsWithDietSessions();
      const filtered = bills.filter((bill) => {
        if (publish_status && bill.publish_status !== publish_status)
          return false;
        if (status && bill.status !== status) return false;
        return true;
      });
      return jsonResult(filtered);
    }
  );

  server.registerTool(
    "get_bill",
    {
      title: "トピック詳細を取得",
      description:
        "指定IDのトピック本体、bill_contents（ふつう/難しい）、紐づくtag_idを返す。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      const [bill, contents, tagIds] = await Promise.all([
        findBillById(billId),
        findBillContentsByBillId(billId),
        findBillsTagsByBillId(billId),
      ]);
      return jsonResult({ bill, contents, tagIds });
    }
  );

  server.registerTool(
    "get_bill_by_slug",
    {
      title: "slugでトピックを検索",
      description:
        "指定slugのトピック本体、bill_contents（ふつう/難しい）、紐づくtag_idを返す。slugが一致するトピックがない場合はエラーになる。",
      inputSchema: {
        slug: z.string().max(200).describe("トピックのslug"),
      },
    },
    async ({ slug }) => {
      const bill = await findBillBySlug(slug);
      const [contents, tagIds] = await Promise.all([
        findBillContentsByBillId(bill.id),
        findBillsTagsByBillId(bill.id),
      ]);
      return jsonResult({ bill, contents, tagIds });
    }
  );

  server.registerTool(
    "create_bill",
    {
      title: "トピックを作成",
      description:
        "billsテーブルに新しいトピックを作成する。コンテンツやタグは別ツール（update_bill_contents / update_bill_tags）で後から設定する。",
      inputSchema: billCreateSchema.shape,
    },
    async (input) => {
      const inserted = await createBillRecord({
        ...input,
        submitted_date: input.submitted_date
          ? `${input.submitted_date}T00:00:00+09:00`
          : null,
      });
      await invalidateBillsCache();
      return jsonResult({ ok: true, bill: inserted });
    }
  );

  server.registerTool(
    "update_bill",
    {
      title: "トピックを更新",
      description:
        "指定IDのトピックのメタ情報（name, status, originating_house 等）を部分更新する。指定したフィールドのみが更新され、省略したフィールドは変更されない。",
      inputSchema: {
        billId: z.string().uuid(),
        ...billUpdateSchema.partial().shape,
      },
    },
    async ({ billId, ...rest }) => {
      await updateBillWithSideEffects(billId, rest);
      return jsonResult({ ok: true });
    }
  );

  server.registerTool(
    "update_bill_publish_status",
    {
      title: "トピックの公開ステータスを変更",
      description:
        "トピックの publish_status を draft / published / coming_soon に変更する。",
      inputSchema: {
        billId: z.string().uuid(),
        publishStatus: z.enum(["draft", "published", "coming_soon"]),
      },
    },
    async ({ billId, publishStatus }) => {
      await updateBillPublishStatus(billId, publishStatus);
      await invalidateBillsCache();
      return jsonResult({ ok: true });
    }
  );

  server.registerTool(
    "update_bill_contents",
    {
      title: "トピックのコンテンツを更新",
      description:
        "トピックのコンテンツ（title/summary/content）を difficulty=normal / hard ごとにupsertする。空文字のみの難易度はスキップ。",
      inputSchema: {
        billId: z.string().uuid(),
        ...billContentsUpdateSchema.shape,
      },
    },
    async ({ billId, normal, hard }) => {
      const byDifficulty = { normal, hard } as const;
      await Promise.all(
        (["normal", "hard"] as const).map(async (difficulty) => {
          const data = byDifficulty[difficulty];
          if (!data.title && !data.summary && !data.content) return;
          await upsertBillContent({
            billId,
            difficultyLevel: difficulty,
            title: data.title,
            summary: data.summary,
            content: data.content,
          });
        })
      );
      await invalidateBillsCache();
      return jsonResult({ ok: true });
    }
  );

  server.registerTool(
    "update_bill_tags",
    {
      title: "トピックのタグを更新",
      description:
        "トピックに紐づくタグIDの集合を指定の集合に差し替える（差分のみinsert/delete）。",
      inputSchema: {
        billId: z.string().uuid(),
        tagIds: z.array(z.string().uuid()),
      },
    },
    async ({ billId, tagIds }) => {
      const existingTagIds = await findBillsTagsByBillId(billId);
      const { toAdd, toDelete } = calculateSetDiff(existingTagIds, tagIds);
      if (toDelete.length > 0) {
        await deleteBillsTags(billId, toDelete);
      }
      if (toAdd.length > 0) {
        await createBillsTags(billId, toAdd);
      }
      await invalidateBillsCache();
      return jsonResult({ ok: true, added: toAdd, removed: toDelete });
    }
  );
}
