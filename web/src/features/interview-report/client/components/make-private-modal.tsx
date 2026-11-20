"use client";

import { ArrowRight, Lock } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface MakePrivateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

function CheckListItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Image
        src="/icons/check-circle.svg"
        alt=""
        width={20}
        height={20}
        className="flex-shrink-0 mt-1"
      />
      <p className="text-sm font-medium leading-relaxed">{children}</p>
    </div>
  );
}

export function MakePrivateModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: MakePrivateModalProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="py-9">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-accent text-center leading-relaxed">
            {t.publicStatus.makePrivateLine1}
            <br />
            {t.publicStatus.makePrivateLine2}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <CheckListItem>{t.publicStatus.makePrivateBody1}</CheckListItem>
          <CheckListItem>{t.publicStatus.makePrivateBody2}</CheckListItem>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            variant="outline"
            className="w-full"
          >
            <Lock className="mr-2 size-5" />
            {isSubmitting ? t.common.changing : t.publicStatus.makePrivate}
            {!isSubmitting && <ArrowRight className="ml-2 size-5" />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full text-gray-500"
          >
            {t.publicStatus.keepPublic}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
