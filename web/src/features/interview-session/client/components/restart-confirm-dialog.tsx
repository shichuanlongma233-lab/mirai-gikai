"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface RestartConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function RestartConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: RestartConfirmDialogProps) {
  const { t } = useI18n();
  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="px-8 py-12">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary text-center">
            {t.restart.title}
          </DialogTitle>
          <div className="h-[1px] bg-mirai-gradient mt-6" />
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-6">
          <p className="text-sm font-bold text-gray-800 leading-[22px] text-center">
            {t.restart.body}
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <Button onClick={onConfirm} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t.common.processing}
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 size-4" />
                {t.restart.confirm}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="w-full"
          >
            {t.common.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
