"use client";

import { Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface InterviewTimerProps {
  remainingMinutes: number;
}

/**
 * インタビューの残り目安時間を表示するコンポーネント
 *
 * - 分単位で表示（秒は非表示、急かさない）
 * - 残り5分以下で警告色
 * - 残り0分で超過表示
 */
export function InterviewTimer({ remainingMinutes }: InterviewTimerProps) {
  const { t } = useI18n();
  const isOver = remainingMinutes <= 0;

  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <Clock className="h-3.5 w-3.5" />
      {isOver ? (
        <span>{t.timer.over}</span>
      ) : (
        <span>{t.timer.remaining(remainingMinutes)}</span>
      )}
    </div>
  );
}
