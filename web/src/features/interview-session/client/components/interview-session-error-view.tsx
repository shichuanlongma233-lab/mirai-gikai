"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface InterviewSessionErrorViewProps {
  billId: string;
  previewToken?: string;
  message?: string;
}

/**
 * インタビューセッションの初期化に失敗した際の表示
 */
export function InterviewSessionErrorView({
  billId,
  previewToken,
  message,
}: InterviewSessionErrorViewProps) {
  const { t } = useI18n();
  const lpLink = getInterviewLPLink(billId, previewToken);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">
            {t.sessionError.title}
          </h2>
          <p className="text-gray-600 text-center max-w-sm">
            {message ?? t.sessionError.message}
          </p>
        </div>
      </div>

      <Link href={lpLink as Route}>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-black rounded-[100px] font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.sessionError.back}
        </Button>
      </Link>
    </div>
  );
}
