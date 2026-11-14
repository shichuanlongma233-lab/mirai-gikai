"use client";

import { ArrowRight, LockOpen } from "lucide-react";
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

interface MakePublicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function MakePublicModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: MakePublicModalProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="py-9">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-accent text-center leading-relaxed">
            {t.publicStatus.makePublicLine1}
            <br />
            {t.publicStatus.makePublicLine2}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <ConsentCheckListItem>{t.publicConsent.body1}</ConsentCheckListItem>
          <OpenDataNoticeItem />
          <ConsentCheckListItem>{t.publicConsent.body2}</ConsentCheckListItem>
          <p className="text-sm text-black">{t.publicConsent.privateNote}</p>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full"
          >
            <LockOpen className="mr-2 size-5" />
            {isSubmitting ? t.common.changing : t.publicStatus.makePublic}
            {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full text-gray-500"
          >
            {t.publicStatus.keepPrivate}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
