import type { Route } from "next";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** 国会会期管理は市場調査では使わないので、トピック一覧へ案内する */
export default function DietSessionsPage() {
  redirect(routes.bills() as Route);
}
