import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeImage } from "@/components/recipe-image";
import { DecisionContextSummary } from "@/components/decision-context-summary";
import { SimilarRecipeCard } from "@/components/similar-recipe-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ingredients } from "@/data/ingredients";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { getPublishedRecipeBySlug, getPublishedRecipes, getPublishedRecipeStaticParams } from "@/data/published-recipes";
import { getLocalizedRecipe, getLocalizedRecipes } from "@/data/localization/public-recipes";
import { recipeImages } from "@/data/recipe-images";
import { getDifficultyLabel } from "@/lib/display-labels";
import { buildRecipeDetailDisplay } from "@/lib/recipe-detail-display";
import { buildRecipeDetail } from "@/lib/recipe-detail";
import { describeFlavorProfile } from "@/lib/flavor";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import {
  buildDecisionReturnHref,
  hasDecisionContext,
  parseDecisionRouteState,
  serializeDecisionRouteQuery,
} from "@/lib/decision-context-navigation";
import { parseRecipeCatalogFilters } from "@/lib/recipe-exploration";
import { getRecipeHeroImage, getRecipeImageFallback } from "@/lib/recipe-images";
import { describeRecipeSimilarity } from "@/lib/recipe-similarity-display";
import { rankSimilarRecipes } from "@/lib/recipe-similarity";
import { SITE_NAME } from "@/lib/site";
import { getLocalizedPath, isSupportedLocale, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";
import { getMessages } from "@/lib/messages";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export const dynamicParams = false;

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) => getPublishedRecipeStaticParams().map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const source = getPublishedRecipeBySlug(slug);
  const recipe = source ? getLocalizedRecipe(source, locale) : undefined;
  if (!recipe) return { title: locale === "zh-CN" ? "菜谱未找到" : "Recipe not found" };
  const path = `/recipes/${recipe.slug}`;
  return {
    title: locale === "zh-CN" ? `${recipe.name} 做法与原理` : `${recipe.name}: method and cooking notes`,
    description: locale === "zh-CN" ? `${recipe.name} 的食材、步骤、做饭时间与每份营养估算，来自 ${SITE_NAME}。` : `Ingredients, method, cooking time, and estimated nutrition for ${recipe.name} from ${SITE_NAME}.`,
    alternates: buildLocaleAlternates(locale, path),
  };
}

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const source = getPublishedRecipeBySlug(slug);
  const recipe = source ? getLocalizedRecipe(source, locale) : undefined;
  if (!recipe) notFound();
  const messages = getMessages(locale);
  const c = recipePageCopy[locale];
  const routeParams = toURLSearchParams(await searchParams);
  const decisionState = parseDecisionRouteState(routeParams, decisionContextValueAllowlist);
  const hasContext = hasDecisionContext(decisionState.context);
  const localizedRecipes = getLocalizedRecipes(getPublishedRecipes(), locale);
  const catalogFilters = decisionState.source === "catalog"
    ? parseRecipeCatalogFilters(routeParams, localizedRecipes)
    : {};
  const routeQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist, {
    source: decisionState.source,
    ...(decisionState.source === "catalog" ? { catalogFilters } : {}),
  });
  const decisionReturnHref = buildDecisionReturnHref(locale, decisionState, decisionContextValueAllowlist, catalogFilters);

  const detail = buildRecipeDetailDisplay(buildRecipeDetail(recipe), locale);
  const image = getRecipeHeroImage(recipe, recipeImages);
  const fallback = getRecipeImageFallback(recipe);
  const calories = detail.nutrition.find((item) => item.label === c.calories)?.value ?? c.incomplete;
  const protein = detail.nutrition.find((item) => item.label === c.protein)?.value ?? c.incomplete;
  const flavor = describeFlavorProfile(recipe.flavor, locale);
  const similarRecipes = rankSimilarRecipes(recipe, localizedRecipes, { ingredients });
  const taxonomyLine = [
    detail.taxonomy.origin,
    detail.taxonomy.subCuisine ?? detail.taxonomy.cuisine,
    detail.taxonomy.dishType,
    detail.taxonomy.techniques.join(locale === "zh-CN" ? "、" : ", "),
  ].filter(Boolean).join(" · ");
  const hasCulture = Boolean(
    detail.culture?.summary ||
    detail.culture?.originNote ||
    detail.culture?.traditionalContext ||
    detail.culture?.modernContext,
  );

  return (
    <main id="main-content">
      <SiteHeader active="recipes" locale={locale} currentPath={`/${locale}/recipes/${recipe.slug}`} query={routeQuery.toString()} />

      <article>
        <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10">
          <nav aria-label={c.breadcrumb} className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <Link className="focus-ring font-semibold text-[#235849] hover:underline" href={getLocalizedPath(locale)}>{messages.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <Link className="focus-ring font-semibold text-[#235849] hover:underline" href={decisionState.source === "catalog" ? decisionReturnHref : getLocalizedPath(locale, "/recipes")}>{messages.nav.recipes}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{recipe.name}</span>
          </nav>
          <div className="mt-6">
            <RecipeImage image={image} fallbackInitial={fallback.initial} fallbackLabel={recipe.name} alt={recipe.name} locale={locale} sourceLabel={messages.common.imageSource} variant="hero" preload />
          </div>
        </div>

        <header className="mx-auto max-w-5xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-10">
          <p className="text-sm font-semibold text-[#a64631]">{taxonomyLine}</p>
          <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">
            {recipe.name}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-stone-600 sm:text-lg">{recipe.description}</p>
          {flavor ? <p className="mt-4 font-semibold text-[#235849]">{flavor}</p> : null}
          <dl className="mt-8 grid grid-cols-2 border-y border-stone-300 text-left sm:grid-cols-4">
            <KeyFact label={c.cookingTime} value={detail.times.humanTotal} />
            <KeyFact label={c.servings} value={`${recipe.servings} ${locale === "zh-CN" ? "人份" : "servings"}`} />
            <KeyFact label={c.caloriesPerServing} value={calories} />
            <KeyFact label={c.proteinPerServing} value={protein} />
          </dl>
          <p className="mt-3 text-xs leading-5 text-stone-500">{c.estimateNote}</p>
          {hasContext ? <DecisionContextSummary context={decisionState.context} locale={locale} /> : null}
          {hasContext ? (
            <Link className="focus-ring mt-5 inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={decisionReturnHref}>
              {decisionState.source === "catalog" ? c.returnToCatalog : c.returnToDecision}
            </Link>
          ) : null}
          <Link
            className="focus-ring mt-7 inline-flex min-h-11 items-center rounded-md bg-[#235849] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#173f35]"
            href={getLocalizedPath(locale, `/pairing/${recipe.slug}`, routeQuery)}
          >
            {c.buildMeal}
          </Link>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
          <div className="grid gap-12 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
            <section aria-labelledby="ingredients-title">
              <p className="text-sm font-semibold text-[#a64631]">{c.prepare}</p>
              <h2 id="ingredients-title" className="mt-2 text-3xl font-bold text-stone-950">{messages.detail.ingredients}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{c.ingredientIntro(recipe.servings)}</p>
              <ul className="mt-6 border-t border-stone-300">
                {detail.ingredients.map((item) => (
                  <li key={item.id} className="border-b border-stone-200 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold text-stone-900">
                        {item.name}
                        {item.optional ? <span className="ml-2 text-xs font-normal text-[#235849]">{messages.common.optional}</span> : null}
                      </span>
                      <span className="shrink-0 text-sm text-stone-700">{item.amount}</span>
                    </div>
                    {item.note ? <p className="mt-2 text-sm leading-6 text-stone-500">{item.note}</p> : null}
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-stone-300 pt-6">
                <h3 className="font-bold text-stone-950">{c.beforeStart}</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <CompactFact label={messages.detail.prep} value={detail.times.prep} />
                  <CompactFact label={messages.detail.cook} value={detail.times.cook} />
                  <CompactFact label={c.difficulty} value={getDifficultyLabel(recipe.cooking.difficulty, locale)} />
                </dl>
                <h3 className="mt-6 font-bold text-stone-950">{messages.detail.tools}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{detail.tools.join(locale === "zh-CN" ? "、" : ", ")}</p>
              </div>
            </section>

            <section aria-labelledby="steps-title">
              <p className="text-sm font-semibold text-[#a64631]">{c.startCooking}</p>
              <h2 id="steps-title" className="mt-2 text-3xl font-bold text-stone-950">{messages.detail.steps}</h2>
              <ol className="mt-6 border-t border-stone-300">
                {detail.steps.map((step) => (
                  <li key={step.order} className="grid gap-4 border-b border-stone-300 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#235849] text-sm font-bold text-white" aria-hidden="true">
                      {step.order}
                    </span>
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                        {step.heat ? <span>{step.heat}</span> : null}
                        {step.duration ? <span>· {step.duration}</span> : null}
                      </div>
                      <p className="mt-2 text-lg font-semibold leading-8 text-stone-950">{step.instruction}</p>
                      <p className="mt-4 border-l-2 border-[#e5bd53] pl-4 leading-7 text-stone-600">{step.why}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <section className="bg-[#173f35] py-12 text-white sm:py-16" aria-labelledby="principles-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-[#f4d98b]">{messages.detail.principles}</p>
            <div className="mt-2 grid gap-7 lg:grid-cols-[0.7fr_1.3fr]">
              <h2 id="principles-title" className="text-3xl font-bold leading-tight sm:text-5xl">{c.principlesTitle}</h2>
              <ul className="border-t border-white/30">
                {recipe.principles.map((principle, index) => (
                  <li key={principle} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-white/30 py-4 leading-7">
                    <span className="font-bold text-[#f4d98b]" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="details-title">
          <p className="text-sm font-semibold text-[#a64631]">{c.reference}</p>
          <h2 id="details-title" className="mt-2 text-3xl font-bold text-stone-950">{c.detailsTitle}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-stone-600">{c.detailsIntro}</p>

          <div className="mt-8 grid border-y border-stone-300 md:grid-cols-3 md:divide-x md:divide-stone-300">
            <SecondarySection title={messages.detail.nutrition}>
              <DefinitionList items={detail.nutrition} />
            </SecondarySection>
            <SecondarySection title={messages.detail.limits}>
              <DefinitionList items={detail.limits.map((item) => ({ label: `${item.label}（${item.scope}）`, value: item.value }))} />
            </SecondarySection>
            <SecondarySection title={messages.detail.cost}>
              <DefinitionList items={[
                { label: locale === "zh-CN" ? "整道" : "Whole recipe", value: detail.cost.whole },
                { label: locale === "zh-CN" ? "每份" : "Per serving", value: detail.cost.perServing },
              ]} />
            </SecondarySection>
          </div>

          {detail.warnings.length ? (
            <section className="mt-8 border-l-4 border-[#e5bd53] bg-[#fff9e8] p-5" aria-labelledby="estimate-warning">
              <h2 id="estimate-warning" className="font-bold text-stone-950">{c.incompleteTitle}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone-700">
                {detail.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </section>
          ) : null}
        </section>

        {hasCulture ? (
          <section className="border-t border-stone-200 bg-white py-14 sm:py-20" aria-labelledby="story-title">
            <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.55fr_1fr]">
              <div>
                <p className="text-sm font-semibold text-[#a64631]">料理语境</p>
                <h2 id="story-title" className="mt-2 text-3xl font-bold text-stone-950">这道菜</h2>
              </div>
              <div className="space-y-4 leading-7 text-stone-700">
                {detail.culture?.summary ? <p>{detail.culture.summary}</p> : null}
                {detail.culture?.originNote ? <p><span className="font-semibold text-stone-950">来源说明：</span>{detail.culture.originNote}</p> : null}
                {detail.culture?.traditionalContext ? <p><span className="font-semibold text-stone-950">传统语境：</span>{detail.culture.traditionalContext}</p> : null}
                {detail.culture?.modernContext ? <p><span className="font-semibold text-stone-950">现代语境：</span>{detail.culture.modernContext}</p> : null}
                {detail.culture?.sources.length ? (
                  <div className="border-t border-stone-200 pt-4 text-sm text-stone-500">
                    <p className="font-semibold text-stone-700">参考来源</p>
                    <ul className="mt-2 space-y-1">
                      {detail.culture.sources.map((source) => (
                        <li key={source.title}>
                          {source.url ? (
                            <a className="focus-ring text-[#235849] hover:underline" href={source.url} rel="noreferrer" target="_blank">
                              {source.title}
                            </a>
                          ) : source.title}
                          {source.publisher ? <span> · {source.publisher}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {similarRecipes.length ? (
          <section className="border-t border-stone-200 bg-[#f2f0e8] py-14 sm:py-20" aria-labelledby="similar-recipes-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">{c.continue}</p>
              <h2 id="similar-recipes-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">
                {similarRecipes.length >= 3 ? c.similarMany : c.similarFew}
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {similarRecipes.map((result) => (
                  <SimilarRecipeCard
                    key={result.recipe.slug}
                    result={result}
                    reason={describeRecipeSimilarity(recipe, result, ingredients, locale)}
                    locale={locale}
                    query={routeQuery}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}

function KeyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-stone-200 px-3 py-4 odd:border-r sm:border-b-0 sm:border-r sm:last:border-r-0 sm:odd:border-r">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-stone-900 sm:text-base">{value}</dd>
    </div>
  );
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function SecondarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-6 md:px-6 md:first:pl-0 md:last:pr-0">
      <h3 className="font-bold text-stone-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DefinitionList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="space-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4">
          <dt className="text-stone-500">{item.label}</dt>
          <dd className="text-right font-semibold text-stone-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}

const recipePageCopy = {
  "zh-CN": {
    breadcrumb: "面包屑导航", calories: "热量", protein: "蛋白质", incomplete: "估算不完整", cookingTime: "做饭时间", servings: "份量",
    caloriesPerServing: "热量 / 份", proteinPerServing: "蛋白质 / 份", estimateNote: "时间、营养和成本为估算值，实际结果会因食材和设备而变化。",
    prepare: "准备", ingredientIntro: (n: number) => `${n} 人份，保留数据中的原始计量单位。`, beforeStart: "开始前", difficulty: "难度", startCooking: "开始做",
    principlesTitle: "把这道菜做好的关键", reference: "作为参考", detailsTitle: "营养、用量与成本", detailsIntro: "营养和成本为估算值，可作为日常比较参考，不构成个体化饮食建议。",
    incompleteTitle: "部分估算不完整", buildMeal: "搭配这一餐", returnToDecision: "回到今晚的决定", returnToCatalog: "回到刚才的料理目录", continue: "继续探索", similarMany: "还想吃点类似的？", similarFew: "还可以试试这些",
  },
  en: {
    breadcrumb: "Breadcrumb", calories: "Calories", protein: "Protein", incomplete: "Estimate incomplete", cookingTime: "Cooking time", servings: "Yield",
    caloriesPerServing: "Calories / serving", proteinPerServing: "Protein / serving", estimateNote: "Time, nutrition, and cost are estimates; actual results vary with ingredients and equipment.",
    prepare: "Prepare", ingredientIntro: (n: number) => `${n} servings in the recipe's declared metric units.`, beforeStart: "Before you start", difficulty: "Difficulty", startCooking: "Cook",
    principlesTitle: "What makes this dish work", reference: "For reference", detailsTitle: "Nutrition, amounts, and cost", detailsIntro: "Nutrition and cost are estimates for everyday comparison, not personalized dietary advice.",
    incompleteTitle: "Some estimates are incomplete", buildMeal: "Build a meal around this", returnToDecision: "Return to tonight's decision", returnToCatalog: "Return to the recipe catalog", continue: "Continue exploring", similarMany: "Craving something similar?", similarFew: "Try these next",
  },
} as const;
