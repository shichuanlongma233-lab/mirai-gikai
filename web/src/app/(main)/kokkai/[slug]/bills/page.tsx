import { redirect } from "next/navigation";

/** 国会会期ごとの一覧は使わないので、トップへ案内する */
export default function KokkaiBillsPage() {
  redirect("/");
}
