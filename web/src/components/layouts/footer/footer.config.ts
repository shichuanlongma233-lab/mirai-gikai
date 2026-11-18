import { EXTERNAL_LINKS } from "@/config/external-links";
import { routes } from "@/lib/routes";

export type FooterLabelKey = "top" | "terms" | "privacy" | "developers";

export type FooterLink = {
  key: FooterLabelKey;
  label: string;
  href: string;
  external?: boolean;
};

export type FooterPolicyLink = {
  key: FooterLabelKey;
  label: string;
  href: string;
  external?: boolean;
};

export const primaryLinks: FooterLink[] = [
  {
    key: "top",
    label: "TOP",
    href: routes.home(),
  },
];

export const policyLinks: FooterPolicyLink[] = [
  {
    key: "terms",
    label: "利用規約",
    href: routes.terms(),
  },
  {
    key: "privacy",
    label: "プライバシーポリシー",
    href: routes.privacy(),
  },
  {
    key: "developers",
    label: "開発者向け",
    href: routes.developers(),
  },
];
