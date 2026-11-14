import { type InterviewReportRole, roleIcons } from "../constants";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

interface RoleDisplayProps {
  role?: string | null;
  roleTitle?: string | null;
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}

export function RoleDisplay({
  role,
  roleTitle,
  t = getDictionary("ja"),
}: RoleDisplayProps) {
  const RoleIcon = role ? roleIcons[role as InterviewReportRole] : undefined;

  return (
    <p className="text-xs text-gray-600 flex items-center gap-1">
      {RoleIcon && <RoleIcon size={16} strokeWidth={1.5} />}
      {[role ? t.roles[role] || role : null, roleTitle]
        .filter(Boolean)
        .join("・")}
    </p>
  );
}
