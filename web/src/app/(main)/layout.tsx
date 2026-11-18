import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { AuthGate } from "@/components/layouts/auth-gate";
import { Footer } from "@/components/layouts/footer/footer";
import { MainLayout } from "@/components/layouts/main-layout";
import { env } from "@/lib/env";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { getRequestLocale } from "@/lib/i18n/server";
import { RubyfulInitializer } from "@/lib/rubyful";

export default async function MainGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // ヘッダー・フッターも最初の描画から回答者の言語で出す（ちらつき防止）
  const locale = await getRequestLocale();
  return (
    <I18nProvider locale={locale}>
      <SpeedInsights />
      <GoogleAnalytics gaId={env.analytics.gaTrackingId ?? ""} />
      <RubyfulInitializer />
      <AuthGate />

      <MainLayout>
        <Header />
        <main className="min-h-dvh md:min-h-[calc(100dvh-96px)] bg-mirai-surface">
          {children}
        </main>
        <Footer />
      </MainLayout>
    </I18nProvider>
  );
}
