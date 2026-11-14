"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";
import { extractBillIdFromPath } from "@/lib/page-layout-utils";
import { routes } from "@/lib/routes";
import { useI18n } from "@/lib/i18n/i18n-provider";

export function InterviewHeaderActions() {
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSaveAndExit = () => {
    const isPreview = pathname.startsWith("/preview");
    const billId = extractBillIdFromPath(pathname);
    const previewToken = isPreview
      ? searchParams.get("token") || undefined
      : undefined;

    if (billId) {
      router.push(getInterviewLPLink(billId, previewToken) as Route);
    } else {
      router.push(routes.home());
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSaveAndExit}>
      {t.chat.saveAndPause}
    </Button>
  );
}
