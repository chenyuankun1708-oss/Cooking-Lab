import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlanWorkspace } from "@/components/plan-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildPublishedMealPlan, getPublishedMealPlanCatalog } from "@/data/published-meal-plans";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { decodeMealPlanAddPayload, decodeMealPlanSharePayload } from "@/lib/meal-plan-codec";
import { isSupportedLocale, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";
import type { SupportedLocale } from "@/types/localization";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = getLocale((await params).locale);
  return {
    title: locale === "zh-CN" ? "今晚计划" : "Tonight's plan",
    description: locale === "zh-CN" ? "在本地整理购物清单、准备时间线和烹饪步骤。" : "Organize a local shopping list, preparation timeline, and cooking steps.",
    robots: { index: false, follow: false },
    alternates: buildLocaleAlternates(locale, "/plan"),
  };
}

export default async function PlanPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<RouteSearchParams> }) {
  const locale = getLocale((await params).locale);
  const query = toURLSearchParams(await searchParams);
  const hasSharedItems = query.has("items");
  const hasAddedItems = query.has("add");
  const payload = hasSharedItems === hasAddedItems
    ? undefined
    : hasAddedItems ? decodeMealPlanAddPayload(query) : decodeMealPlanSharePayload(query);
  const initialPlan = payload ? buildPublishedMealPlan(payload, locale) : undefined;
  const initialCatalog = getPublishedMealPlanCatalog(locale, initialPlan?.selections.map((selection) => selection.itemId) ?? []);
  const invalidShareLink = (hasSharedItems || hasAddedItems) && !initialPlan;
  return <main id="main-content"><SiteHeader locale={locale} currentPath={`/${locale}/plan`} query={query.toString()} /><PlanWorkspace initialCatalog={initialCatalog} initialMode={hasAddedItems ? "merge" : "replace"} initialPlan={initialPlan} invalidShareLink={invalidShareLink} locale={locale} /><SiteFooter locale={locale} /></main>;
}

function getLocale(value: string): SupportedLocale { if (!isSupportedLocale(value)) notFound(); return value; }
