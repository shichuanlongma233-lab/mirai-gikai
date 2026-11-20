import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { routes } from "@/lib/routes";
import { type Dictionary, getDictionary } from "@/lib/i18n/get-dictionary";

interface ReportBreadcrumbProps {
  billId: string;
  reportHref?: string;
  additionalItems?: BreadcrumbItem[];
  /** 表示する言語の文言（省略時は日本語） */
  t?: Dictionary;
}

export function ReportBreadcrumb({
  billId,
  reportHref,
  additionalItems = [],
  t = getDictionary("ja"),
}: ReportBreadcrumbProps) {
  const baseItems: BreadcrumbItem[] = [
    { label: "TOP", href: routes.home() },
    { label: t.report.crumbBill, href: getBillDetailLink(billId) },
    { label: t.report.crumbReports, href: routes.billOpinions(billId) },
    {
      label: t.report.crumbReport,
      href: reportHref,
    },
  ];

  return <Breadcrumb items={[...baseItems, ...additionalItems]} />;
}
