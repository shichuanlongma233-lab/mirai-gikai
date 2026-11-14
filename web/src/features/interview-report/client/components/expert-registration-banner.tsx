"use client";

import { MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-provider";

interface ExpertRegistrationBannerProps {
  onRegisterClick: () => void;
}

export function ExpertRegistrationBanner({
  onRegisterClick,
}: ExpertRegistrationBannerProps) {
  const { t } = useI18n();
  return (
    <div className="bg-mirai-light-gradient rounded-2xl border border-primary p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <span className="inline-flex items-center justify-center rounded-2xl bg-primary text-white px-4 py-2 text-sm font-medium w-fit">
          {t.expert.heading}
        </span>
        <div className="flex flex-col gap-2.5">
          <h3 className="text-lg font-bold text-gray-800">{t.expert.title}</h3>
          <p className="text-[15px] text-gray-800">{t.expert.body}</p>
        </div>
      </div>
      <Button variant="outline" onClick={onRegisterClick} className="w-full">
        <MessageSquareMore className="size-6" />
        {t.expert.register}
      </Button>
    </div>
  );
}
