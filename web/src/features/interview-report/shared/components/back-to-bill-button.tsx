import { Undo2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { routes } from "@/lib/routes";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

interface BackToBillButtonProps {
  billId: string;
  /** "opinions" の場合、レポート一覧に戻るボタンを表示 */
  from?: "complete" | "opinions";
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}

export function BackToBillButton({
  billId,
  from,
  t = getDictionary("ja"),
}: BackToBillButtonProps) {
  const href =
    from === "opinions"
      ? routes.billOpinions(billId)
      : getBillDetailLink(billId);
  const label =
    from === "opinions" ? t.report.backToReports : t.report.backToBill;

  return (
    <Link
      href={href as Route}
      className="flex items-center justify-center gap-2.5 px-6 py-3 border border-gray-800 rounded-full bg-white w-full"
    >
      <Undo2 className="w-5 h-5 text-gray-800" />
      <span className="text-base font-bold text-gray-800">{label}</span>
    </Link>
  );
}
