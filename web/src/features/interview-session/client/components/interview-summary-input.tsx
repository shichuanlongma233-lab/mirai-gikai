"use client";

import { useState } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { InterviewPublicConsentModal } from "@/features/interview-report/client/components/interview-public-consent-modal";
import { useEndInterview } from "../hooks/use-end-interview";
import { useInterviewCompletion } from "../hooks/use-interview-completion";
import { InterviewChatInput } from "./interview-chat-input";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface InterviewSummaryInputProps {
  sessionId: string;
  billId: string;
  hasReport: boolean;
  previewToken?: string;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  /** レポート未生成時の「インタビューを続ける」で呼ぶ再開処理 */
  onResume?: () => void;
  isLoading: boolean;
  error: Error | null | undefined;
}

export function InterviewSummaryInput({
  sessionId,
  billId,
  hasReport,
  previewToken,
  input,
  onInputChange,
  onSubmit,
  onResume,
  isLoading,
  error,
}: InterviewSummaryInputProps) {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isCompleting, completeError, handleSubmit } = useInterviewCompletion({
    sessionId,
  });
  const { endInterview, isEnding } = useEndInterview(
    sessionId,
    billId,
    previewToken
  );

  return (
    <>
      {!isLoading && (
        <div className="mb-3 flex flex-col gap-2">
          {hasReport ? (
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={isCompleting}
            >
              {isCompleting ? t.common.sending : t.summary.submit}
            </Button>
          ) : (
            <>
              <p className="text-sm font-medium leading-[1.8] text-mirai-text mb-2">
                {t.summary.tooShort}
              </p>
              <Button onClick={() => onResume?.()}>{t.summary.continue}</Button>
              <Button
                variant="outline"
                onClick={endInterview}
                disabled={isEnding}
              >
                {isEnding ? t.summary.ending : t.summary.end}
              </Button>
            </>
          )}
          {completeError && (
            <p className="text-sm text-red-500">{completeError}</p>
          )}
        </div>
      )}
      {hasReport && (
        <InterviewChatInput
          input={input}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          placeholder={t.summary.placeholder}
          isResponding={isLoading}
          error={error}
        />
      )}
      <InterviewPublicConsentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isSubmitting={isCompleting}
      />
    </>
  );
}
