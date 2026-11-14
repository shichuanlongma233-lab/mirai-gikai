import { formatRoleDescriptionLines } from "../utils/format-utils";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

interface IntervieweeInfoProps {
  roleDescription?: string | null;
  headingLevel?: "h2" | "h3";
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}

export function IntervieweeInfo({
  roleDescription,
  headingLevel = "h2",
  t = getDictionary("ja"),
}: IntervieweeInfoProps) {
  if (!roleDescription) {
    return null;
  }

  const Heading = headingLevel;
  const lines = formatRoleDescriptionLines(roleDescription);

  return (
    <div className="flex flex-col gap-4">
      <Heading className="text-xl font-bold text-gray-800">
        {t.report.interviewee}
      </Heading>
      <div className="bg-white rounded-2xl p-6">
        <div className="text-sm text-gray-800 whitespace-pre-wrap font-medium">
          {lines.map((line, index) => (
            <p key={`${index}-${line.slice(0, 20)}`}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
