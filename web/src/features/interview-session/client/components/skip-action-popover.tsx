"use client";

import { useState } from "react";
import {
  ChevronRight,
  CircleArrowRight,
  LogOut,
  MessageCircleMore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n/i18n-provider";

const SKIP_ACTIONS = [
  { key: "next", icon: CircleArrowRight },
  { key: "other", icon: MessageCircleMore },
] as const;

const END_ACTION = { key: "end", icon: LogOut } as const;

interface SkipActionPopoverProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SkipActionPopover({
  onSelect,
  disabled = false,
}: SkipActionPopoverProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const handleSelect = (text: string) => {
    setOpen(false);
    onSelect(text);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className="h-auto gap-1 p-0 text-xs font-medium leading-[1.8] text-gray-400 hover:text-gray-600 hover:bg-transparent"
        >
          {t.skip.trigger}
          <ChevronRight className="size-[18px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-auto rounded-2xl border border-gray-200 bg-white px-2 py-4 shadow-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 px-4">
            {SKIP_ACTIONS.map((action) => (
              <Button
                key={action.key}
                variant="ghost"
                onClick={() => handleSelect(t.skip[action.key])}
                className="h-auto justify-start gap-2 p-0 text-xs font-medium leading-[1.8] text-mirai-text hover:bg-transparent hover:opacity-70"
              >
                <action.icon className="size-5 shrink-0" />
                {t.skip[action.key]}
              </Button>
            ))}
          </div>
          <div className="border-t border-gray-200" />
          <div className="px-4">
            <Button
              variant="ghost"
              onClick={() => handleSelect(t.skip[END_ACTION.key])}
              className="h-auto justify-start gap-2 p-0 text-xs font-medium leading-[1.8] text-mirai-text hover:bg-transparent hover:opacity-70"
            >
              <END_ACTION.icon className="size-5 shrink-0" />
              {t.skip[END_ACTION.key]}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
