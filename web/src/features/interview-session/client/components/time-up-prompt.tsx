"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface TimeUpPromptProps {
  onEndInterview: () => void;
  onContinue: () => void;
  disabled?: boolean;
}

/**
 * 目安時間超過時にユーザーに終了/継続を尋ねるコンポーネント
 */
export function TimeUpPrompt({
  onEndInterview,
  onContinue,
  disabled,
}: TimeUpPromptProps) {
  const { t } = useI18n();
  return (
    <div className="mx-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="mb-3 text-sm font-medium text-gray-700">
        {t.timeUp.message}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onContinue} disabled={disabled}>
          {t.timeUp.continue}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEndInterview}
          disabled={disabled}
        >
          {t.timeUp.end}
        </Button>
      </div>
    </div>
  );
}
