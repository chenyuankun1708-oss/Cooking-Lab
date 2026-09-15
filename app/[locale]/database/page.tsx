import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PublicRecipeDatabaseBrowser } from "@/components/public-recipe-database-browser";
import { publicRecipeDatabaseSummary, publicRecipeEntries } from "@/data/public-recipe-database";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

interface DatabasePageProps {
  params: Promise<{ locale: string }>;
}

const copy = {
  "zh-CN": {
    eyebrow: "Recipe Database",
    title: "菜谱数据库",
    intro: (total: number, databaseTotal: number, ingredients: number) =>
      `按制作复杂度精选的 ${total} 道结构化菜谱（全库共 ${databaseTotal} 道，收录 ${ingredients} 种食材）。每道菜包含配料配比、操作步骤与营养数据，点击任意行查看详情。`,
  },
  en: {
    eyebrow: "Recipe Database",
    title: "Recipe Database",
    intro: (total: number, databaseTotal: number, ingredients: number) =>
      `${total} structured recipes curated by preparation complexity (from a ${databaseTotal}-recipe library with ${ingredients} ingredients). Every entry ships ingredient portions, step chains and nutrition — click any row for details.`,
  },
} as const;

export async function generateMetadata({ params }: DatabasePageProps): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = supportedLocales.includes(raw as SupportedLocale) ? (raw as SupportedLocale) : "zh-CN";
  const t = copy[locale];
  return {
    title: `${t.title} | Cooking Lab`,
    description: t.intro(300, 500, 341),
  };
}

export default async function PublicDatabasePage({ params }: DatabasePageProps) {
  const { locale: raw } = await params;
  if (!supportedLocales.includes(raw as SupportedLocale)) notFound();
  const locale = raw as SupportedLocale;
  const t = copy[locale];
  const summary = publicRecipeDatabaseSummary;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader locale={locale} currentPath={`/${locale}/database`} />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">{t.eyebrow}</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-900">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500">{t.intro(summary.total, summary.databaseTotal, summary.ingredients)}</p>
        </header>
        <PublicRecipeDatabaseBrowser entries={publicRecipeEntries} summary={summary} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
