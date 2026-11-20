import type { Route } from "next";
import { redirect } from "next/navigation";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";

interface BillDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * トピック詳細（元の法案詳細ページ）は審議状況など議会向けの表示が多いため使わず、
 * インタビューの紹介ページへ案内する。
 */
export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params;
  redirect(getInterviewLPLink(id) as Route);
}
