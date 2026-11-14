import Image from "next/image";
import { cn } from "@/lib/utils";
import { stanceTextColors } from "../constants";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

interface StanceDisplayProps {
  stance: string;
  size?: "sm" | "md";
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}

export function StanceDisplay({
  stance,
  size = "md",
  t = getDictionary("ja"),
}: StanceDisplayProps) {
  const iconSize = size === "sm" ? 32 : 50;
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex flex-col items-center gap-2.5">
      <Image
        src={`/icons/stance-${stance}.png`}
        alt={t.stances[stance] || stance}
        width={iconSize}
        height={iconSize}
        className="rounded-full"
      />
      <p
        className={cn(
          textSize,
          "font-bold tracking-[0.18px]",
          stanceTextColors[stance]
        )}
      >
        {t.stances[stance] || stance}
      </p>
    </div>
  );
}
