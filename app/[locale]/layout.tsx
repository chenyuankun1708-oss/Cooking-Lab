import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { isSupportedLocale } from "@/lib/localization";
import { getMessages } from "@/lib/messages";
import { SITE_DESCRIPTIONS, SITE_NAME, SITE_URL } from "@/lib/site";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<unknown> }) {
  const raw = await params;
  const value = typeof raw === "object" && raw && "locale" in raw ? String(raw.locale) : "";
  if (!isSupportedLocale(value)) notFound();
  const locale: SupportedLocale = value;
  const messages = getMessages(locale);
  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main-content">{messages.skip}</a>
        {children}
      </body>
    </html>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: locale === "zh-CN" ? `${SITE_NAME} · 料理决策与烹饪学习实验室` : `${SITE_NAME} · Recipes, technique, and culinary stories`,
      template: `%s · ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTIONS[locale],
    alternates: buildLocaleAlternates(locale, "/"),
  };
}
