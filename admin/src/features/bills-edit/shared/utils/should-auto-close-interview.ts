import type { BillUpdateInput } from "../types";

/**
 * トピックのステータス変更時に、関連する公開中インタビューを自動クローズすべきかを判定する。
 * 現状はトピック成立 (enacted) 時のみ対象。
 */
export function shouldAutoCloseInterviewOnBillStatus(
  status: BillUpdateInput["status"]
): boolean {
  return status === "enacted";
}
