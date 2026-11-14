"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ConsentCheckListItem,
  OpenDataNoticeItem,
} from "./consent-check-list-item";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface InterviewPublicConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (isPublic: boolean) => void;
  isSubmitting: boolean;
}

export function InterviewPublicConsentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: InterviewPublicConsentModalProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="py-9">
        <DialogHeader>
          <p className="text-center text-primary-accent font-bold">
            {t.publicConsent.almostDone}
          </p>
          <DialogTitle className="text-[22px] font-bold text-center">
            {t.publicConsent.heading}
          </DialogTitle>
          <div className="h-[1px] bg-mirai-gradient mt-4" />
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <h3 className="text-lg font-bold text-primary-accent text-center leading-relaxed">
            {t.publicConsent.questionLine1}
            <br />
            {t.publicConsent.questionLine2}
          </h3>

          <div className="space-y-4">
            <ConsentCheckListItem>{t.publicConsent.body1}</ConsentCheckListItem>
            <OpenDataNoticeItem />
            <ConsentCheckListItem>{t.publicConsent.body2}</ConsentCheckListItem>
          </div>

          <p className="text-sm text-black">{t.publicConsent.privateNote}</p>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={() => onSubmit(true)}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t.common.sending : t.publicConsent.submitPublic}
            {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onSubmit(false)}
            disabled={isSubmitting}
            className="w-full text-gray-500"
          >
            {t.publicConsent.submitPrivate}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
