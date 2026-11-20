"use client";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { InterviewSessionStatus } from "../../server/loaders/get-latest-interview-session";
import { useI18n } from "@/lib/i18n/i18n-provider";

const interviewStatusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded px-3 py-1 text-sm font-medium",
  {
    variants: {
      status: {
        active: "bg-mirai-badge-yellow text-black",
        completed: "bg-mirai-gradient text-black",
      },
    },
  }
);

interface InterviewStatusBadgeProps {
  status: InterviewSessionStatus;
  className?: string;
}

export function InterviewStatusBadge({
  status,
  className,
}: InterviewStatusBadgeProps) {
  const { t } = useI18n();
  if (status === "none") {
    return null;
  }

  return (
    <span className={cn(interviewStatusBadgeVariants({ status }), className)}>
      {t.status[status]}
    </span>
  );
}
