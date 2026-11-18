import { redirect } from "next/navigation";

/** 法案検索ページは使わないので、トップ（受付中のトピック一覧）へ案内する */
export default function BillsPage() {
  redirect("/");
}
