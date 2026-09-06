import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NativeCulinaryDetailPage } from "@/components/native-culinary-detail-page";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { ingredients } from "@/data/ingredients";
import { getLocalizedRecipe } from "@/data/localization/public-recipes";
import {
  contentRightsRegistry,
  contentRightsSources,
  getPublishedCulinaryItemForLocaleBySlug,
  getPublishedCulinaryItemsForLocale,
} from "@/data/published-culinary-items";
import { getPublishedRecipeBySlug } from "@/data/published-recipes";
import { getStoryExperienceContext } from "@/data/published-stories";
import {
  m9RecipeResearchRecords,
} from "@/data/research/m9-recipe-research";
import { buildCulinaryDetailModel } from "@/lib/culinary-detail";
import { rankSimilarCulinaryItems } from "@/lib/culinary-similarity";
import { parseCulinaryCatalogFilters } from "@/lib/culinary-exploration";
import {
  buildDecisionReturnHref,
  hasDecisionContext,
  parseDecisionRouteState,
  serializeDecisionRouteQuery,
} from "@/lib/decision-context-navigation";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import {
  isSupportedLocale,
  toURLSearchParams,
  type RouteSearchParams,
} from "@/lib/localization";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export const dynamicParams = false;

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) =>
    getPublishedCulinaryItemsForLocale(locale).map(({ slug }) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const item = getPublishedCulinaryItemForLocaleBySlug(slug, locale);
  if (!item) return { title: locale === "zh-CN" ? "料理未找到" : "Culinary item not found" };
  const sourceRecipe = getPublishedRecipeBySlug(slug);
  const recipe = sourceRecipe ? getLocalizedRecipe(sourceRecipe, locale) : undefined;
  const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext(locale), locale, {
    ...(recipe ? { recipe } : {}),
    rightsRegistry: contentRightsRegistry,
    similarItems: rankSimilarCulinaryItems(item, getPublishedCulinaryItemsForLocale(locale)).map((result) => result.item),
    researchSources: contentRightsSources,
  });
  const path = `/recipes/${item.slug}`;
  return {
    title: locale === "zh-CN"
      ? `${detail.name}：做法、风味与故事`
      : `${detail.name}: method, flavor, and story`,
    description: detail.description,
    alternates: buildLocaleAlternates(locale, path),
  };
}

export default async function CulinaryDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const item = getPublishedCulinaryItemForLocaleBySlug(slug, locale);
  if (!item) notFound();

  const routeParams = toURLSearchParams(await searchParams);
  const decisionState = parseDecisionRouteState(routeParams, decisionContextValueAllowlist);
  const catalogFilters = decisionState.source === "catalog"
    ? parseCulinaryCatalogFilters(routeParams, getPublishedCulinaryItemsForLocale(locale))
    : {};
  const routeQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist, {
    source: decisionState.source,
    ...(decisionState.source === "catalog" ? { catalogFilters } : {}),
  });
  const sourceRecipe = getPublishedRecipeBySlug(slug);
  const recipe = sourceRecipe ? getLocalizedRecipe(sourceRecipe, locale) : undefined;
  if (sourceRecipe && !recipe) notFound();
  const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext(locale), locale, {
    ...(recipe ? { recipe } : {}),
    researchRecords: m9RecipeResearchRecords,
    researchSources: contentRightsSources,
    rightsRegistry: contentRightsRegistry,
    similarItems: rankSimilarCulinaryItems(item, getPublishedCulinaryItemsForLocale(locale)).map((result) => result.item),
  });
  const hasContext = hasDecisionContext(decisionState.context);
  const returnHref = hasContext
    ? buildDecisionReturnHref(locale, decisionState, decisionContextValueAllowlist, catalogFilters)
    : undefined;
  const returnLabel = decisionState.source === "catalog"
    ? (locale === "zh-CN" ? "返回当前料理筛选" : "Return to this culinary filter")
    : (locale === "zh-CN" ? "返回今晚的决定" : "Return to tonight's decision");

  return (
    <NativeCulinaryDetailPage
      anchorIsRecipe={Boolean(recipe)}
      decisionContext={hasContext ? decisionState.context : undefined}
      detail={detail}
      locale={locale}
      query={routeQuery}
      returnHref={returnHref}
      returnLabel={returnHref ? returnLabel : undefined}
    />
  );
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}
