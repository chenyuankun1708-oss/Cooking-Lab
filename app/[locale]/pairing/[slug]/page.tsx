import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionContextSummary } from "@/components/decision-context-summary";
import { MealCompositionAlternative, MealCompositionView } from "@/components/meal-composition";
import { RecipeImage } from "@/components/recipe-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { getPublishedRecipes } from "@/data/published-recipes";
import { getLocalizedRecipes } from "@/data/localization/public-recipes";
import { getPublishedCulinaryItemsForLocale } from "@/data/published-culinary-items";
import { getPublishedPairingExperience } from "@/data/published-meal-compositions";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import {
  appendMealConstraintRelaxations,
  parseMealConstraintRelaxations,
} from "@/lib/meal-constraint-navigation";
import {
  appendQueryToHref,
  buildDecisionReturnHref,
  parseDecisionRouteState,
  serializeDecisionRouteQuery,
} from "@/lib/decision-context-navigation";
import { parseRecipeCatalogFilters } from "@/lib/recipe-exploration";
import { getLocalizedPath, isSupportedLocale, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";
import { getMessages } from "@/lib/messages";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export const dynamicParams = false;

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) =>
    getPublishedCulinaryItemsForLocale(locale).map(({ slug }) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const experience = getPublishedPairingExperience(slug, locale);
  if (!experience) return { title: locale === "zh-CN" ? "搭配未找到" : "Pairing not found" };
  const c = pairingPageCopy[locale];
  const path = `/pairing/${slug}`;
  return {
    title: c.metadataTitle(experience.anchor.name),
    description: c.metadataDescription(experience.anchor.name),
    alternates: buildLocaleAlternates(locale, path),
  };
}

export default async function PairingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const messages = getMessages(locale);
  const c = pairingPageCopy[locale];
  const routeParams = toURLSearchParams(await searchParams);
  const decisionState = parseDecisionRouteState(routeParams, decisionContextValueAllowlist);
  const relaxedConstraintIds = parseMealConstraintRelaxations(routeParams);
  const experience = getPublishedPairingExperience(slug, locale, {
    decisionContext: decisionState.context,
    relaxedConstraintIds,
  });
  if (!experience) notFound();
  const catalogFilters = decisionState.source === "catalog"
    ? parseRecipeCatalogFilters(routeParams, getLocalizedRecipes(getPublishedRecipes(), locale))
    : {};
  const routeQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist, {
    source: decisionState.source,
    ...(decisionState.source === "catalog" ? { catalogFilters } : {}),
  });
  const decisionReturnHref = buildDecisionReturnHref(locale, decisionState, decisionContextValueAllowlist, catalogFilters);
  const anchorHref = appendQueryToHref(experience.anchor.href, routeQuery);
  const pairingRouteQuery = appendMealConstraintRelaxations(routeQuery, experience.appliedRelaxationIds);
  const hasContext = Object.keys(decisionState.context).length > 0;

  return (
    <main id="main-content">
      <SiteHeader active="recipes" locale={locale} currentPath={`/${locale}/pairing/${slug}`} query={pairingRouteQuery.toString()} />
      <article>
        <header className="bg-[var(--surface-paper)] px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
            <div className="order-2 lg:order-1">
              <nav aria-label={c.breadcrumb} className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={decisionState.source === "catalog" ? decisionReturnHref : getLocalizedPath(locale, "/recipes")}>{messages.nav.recipes}</Link>
                <span aria-hidden="true">/</span>
                <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={anchorHref}>{experience.anchor.name}</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{c.breadcrumbCurrent}</span>
              </nav>
              <p className="mt-6 text-sm font-semibold text-[#a64631]">{c.eyebrow}</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">{c.title(experience.anchor.name)}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">{c.intro}</p>
              {hasContext ? (
                <DecisionContextSummary
                  context={decisionState.context}
                  locale={locale}
                  surface="pairing"
                  anchorIsRecipe={experience.anchor.href.includes("/recipes/")}
                />
              ) : null}
              {experience.appliedRelaxationIds.length ? (
                <div className="mt-6 border-l-2 border-[#a64631] pl-4 text-sm leading-6 text-stone-700">
                  <p className="font-bold text-stone-950">{c.relaxedTitle}</p>
                  <p>{c.relaxedNote(experience.appliedRelaxationIds.map((id) => c.constraintLabels[id]).join(locale === "zh-CN" ? "、" : ", "))}</p>
                </div>
              ) : null}
            </div>
            <div className="order-1 overflow-hidden rounded-lg lg:order-2">
              <RecipeImage
                image={experience.anchor.image}
                fallbackInitial={experience.anchor.fallbackInitial}
                fallbackLabel={experience.anchor.name}
                alt={experience.anchor.name}
                locale={locale}
                sourceLabel={messages.common.imageSource}
                variant="hero"
                preload
              />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="recommended-meal-title">
          <p className="text-sm font-semibold text-[#a64631]">{c.recommendation}</p>
          <h2 id="recommended-meal-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{c.recommendedTitle}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-stone-600">{c.recommendedIntro}</p>
          <div className="mt-8">
            {experience.primary ? (
              <MealCompositionView meal={experience.primary} locale={locale} query={routeQuery} />
            ) : (
              <div className="border-y border-stone-300 py-8">
                <p className="max-w-3xl text-lg leading-8 text-stone-700">{c.noResult}</p>
                {experience.emptyReason?.details.length ? (
                  <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-6 text-stone-600">
                    {experience.emptyReason.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                ) : null}
                {experience.relaxationOptions.length ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {experience.relaxationOptions.map((option) => (
                      <Link
                        className="focus-ring inline-flex min-h-11 items-center rounded-md border border-[#235849] px-4 py-2 text-sm font-semibold text-[#235849] hover:bg-[#e5efe8]"
                        href={getLocalizedPath(locale, `/pairing/${slug}`, appendMealConstraintRelaxations(routeQuery, [...experience.appliedRelaxationIds, option.constraintId]))}
                        key={option.constraintId}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {experience.alternatives.length ? (
          <section className="border-t border-stone-200 bg-[#f2f0e8] py-12 sm:py-16" aria-labelledby="alternative-meals-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">{c.alternatives}</p>
              <h2 id="alternative-meals-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{c.alternativeTitle}</h2>
              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {experience.alternatives.map((meal) => (
                  <MealCompositionAlternative key={`${meal.templateId}:${meal.items.map(({ id }) => id).join(":")}`} meal={meal} locale={locale} query={routeQuery} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {experience.alcoholicAlternative ? (
          <section className="border-t border-stone-200 bg-[var(--surface-cocoa)] py-12 text-white sm:py-16" aria-labelledby="alcoholic-alternative-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#f4d98b]">{c.optional}</p>
              <h2 id="alcoholic-alternative-title" className="mt-2 text-3xl font-bold sm:text-4xl">{c.alcoholicTitle}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-white/78">{c.alcoholicNote}</p>
              <div className="mt-8 max-w-2xl text-stone-950">
                <MealCompositionAlternative meal={experience.alcoholicAlternative} locale={locale} query={routeQuery} />
              </div>
            </div>
          </section>
        ) : null}

        {experience.anchorIsAlcoholic && experience.nonAlcoholicAlternative ? (
          <section className="border-t border-stone-200 bg-[var(--surface-herb)] py-12 sm:py-16" aria-labelledby="non-alcoholic-alternative-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">{c.alternativeDrink}</p>
              <h2 id="non-alcoholic-alternative-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{c.nonAlcoholicTitle}</h2>
              <Link className="focus-ring mt-6 inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={appendQueryToHref(experience.nonAlcoholicAlternative.href, routeQuery)}>
                {experience.nonAlcoholicAlternative.name}
              </Link>
              <p className="mt-2 max-w-2xl leading-7 text-stone-600">{experience.nonAlcoholicAlternative.description}</p>
            </div>
          </section>
        ) : null}
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}

const pairingPageCopy = {
  "zh-CN": {
    breadcrumb: "面包屑导航",
    breadcrumbCurrent: "配餐",
    eyebrow: "围绕已选料理",
    title: (name: string) => `围绕${name}搭一餐`,
    intro: "以你已经选定的料理为中心，让不同餐桌角色、风味与准备节奏自然地组成一餐。",
    recommendation: "首选组合",
    recommendedTitle: "这一餐可以这样安排",
    recommendedIntro: "风味既有连接，也留出清爽或口感上的对比，同时照顾一顿饭真实的准备节奏。",
    noResult: "当前内容库还没有在这些条件下可靠成立的搭配。我们宁可暂时留空，也不拿违规或低相关项目补齐餐桌。",
    relaxedTitle: "已按你的选择放宽条件",
    relaxedNote: (labels: string) => `这次配餐不再执行：${labels}。原条件仍保留在 URL 中，只有这次配餐被显式放宽。`,
    constraintLabels: { "estimated-elapsed-time": "整餐预计时间", "available-tools": "整餐可用工具" },
    alternatives: "其他可行组合",
    alternativeTitle: "换一种搭法",
    optional: "可选酒精饮品组合",
    alcoholicTitle: "另一种餐桌选择",
    alcoholicNote: "这是中性的料理搭配选项。完整一餐不依赖酒精，也不包含健康、饮用量或购买建议。",
    alternativeDrink: "无酒精替代",
    nonAlcoholicTitle: "也可以换成这杯饮品",
    metadataTitle: (name: string) => `围绕${name}搭一餐`,
    metadataDescription: (name: string) => `以${name}为固定起点，查看 Cooking Lab 的餐食搭配与准备负担。`,
  },
  en: {
    breadcrumb: "Breadcrumb",
    breadcrumbCurrent: "Pairing",
    eyebrow: "Around your chosen item",
    title: (name: string) => `Build a meal around ${name}`,
    intro: "Keep the item you chose at the center, then let distinct table roles, flavors, and preparation rhythms come together as a meal.",
    recommendation: "Recommended composition",
    recommendedTitle: "One way to bring the meal together",
    recommendedIntro: "Flavor connections meet fresh or textural contrast, while the preparation rhythm stays grounded in a real kitchen.",
    noResult: "The current library has no pairing that reliably fits these conditions. We would rather leave the table incomplete than fill it with a weak or non-compliant match.",
    relaxedTitle: "Conditions relaxed by your choice",
    relaxedNote: (labels: string) => `This pairing no longer enforces: ${labels}. The original context stays in the URL; only this pairing was explicitly relaxed.`,
    constraintLabels: { "estimated-elapsed-time": "estimated meal time", "available-tools": "available meal tools" },
    alternatives: "Other viable compositions",
    alternativeTitle: "Another way to arrange the meal",
    optional: "Optional alcoholic composition",
    alcoholicTitle: "A different table option",
    alcoholicNote: "This is a neutral culinary pairing. A complete meal does not require alcohol, and this includes no health, quantity, or purchasing advice.",
    alternativeDrink: "Non-alcoholic alternative",
    nonAlcoholicTitle: "This drink can take its place",
    metadataTitle: (name: string) => `Build a meal around ${name}`,
    metadataDescription: (name: string) => `Start with ${name}, then explore a Cooking Lab meal composition and its preparation burden.`,
  },
} as const;
