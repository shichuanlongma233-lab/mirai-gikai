"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";
import { RubyToggle } from "@/lib/rubyful";

export function HamburgerMenu() {
  const { locale, t } = useI18n();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label={t.common.openMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50" align="end">
        <div className="flex flex-col gap-3">
          <LanguageSwitcher />
          {/* ふりがなは日本語表示のときだけ意味があるので、それ以外では出さない */}
          {locale === "ja" && <RubyToggle />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
