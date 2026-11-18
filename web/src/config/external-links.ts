/**
 * 外部リンク定数
 */
export const EXTERNAL_LINKS = {
  /** 不具合報告フォーム。未設定なら「問題を報告」ボタンを出さない（元はチームみらいのフォーム） */
  REPORT: process.env.NEXT_PUBLIC_REPORT_FORM_URL ?? "",
  ABOUT_NOTE: "https://note.com/team_mirai_jp/n/nd1656aa5f86d",
  DONATION: "https://team-mir.ai/support/donation",
  TEAM_MIRAI_ABOUT: "https://team-mir.ai/about",
  TERMS: "https://team-mir.ai/terms",
  PRIVACY: "https://team-mir.ai/privacy",
  FAQ: "https://team-mirai.notion.site/FAQ-28cf6f56bae180bd84e7f7ae80f806a1",
  FORK_GUIDELINES_NOTE: "https://note.com/team_mirai_jp/n/nc59ec347e8c7",
  GITHUB_REPO: "https://github.com/team-mirai/mirai-gikai",
} as const;
