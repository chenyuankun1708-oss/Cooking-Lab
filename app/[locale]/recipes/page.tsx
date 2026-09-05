import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/recipe-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedRecipes } from "@/data/published-recipes";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { getLocalizedRecipes } from "@/data/localization/public-recipes";
import { cookingTimeBands, getCookingTimeBand } from "@/lib/cooking-time";
import { listFlavorPreferenceOptions } from "@/lib/flavor";
import {
  exploreRecipeCatalog,
  parseRecipeCatalogFilters,
  type RecipeCatalogFilters,
} from "@/lib/recipe-exploration";
import { hasDecisionContext, parseDecisionRouteState, serializeDecisionRouteQuery } from "@/lib/decision-context-navigation";
import {
  listRecipeCountryOptions,
  listRecipeCuisineOptions,
  listRecipeDishTypeOptions,
  listRecipeRegionOptions,
  listRecipeTechniqueOptions,
} from "@/lib/taxonomy";
import type { SupportedLocale } from "@/types/localization";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { getMessages } from "@/lib/messages";

type RawSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RecipeCatalogPage({ searchParams, params }: { searchParams: RawSearchParams; params: Promise<{ locale: string }> }) {
  const locale = getLocale((await params).locale);
  const messages = getMessages(locale);
  const recipes = getLocalizedRecipes(getPublishedRecipes(), locale);
  const raw = await searchParams;
  const rawParams = toSearchParams(raw);
  const filters = parseRecipeCatalogFilters(rawParams, recipes);
  const decisionState = parseDecisionRouteState(rawParams, decisionContextValueAllowlist);
  const hasCarriedContext = hasDecisionContext(decisionState.context);
  const normalizedQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist, { catalogFilters: filters });
  const recipeQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist, { source: "catalog", catalogFilters: filters });
  const decisionOnlyQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist);
  const origin = filters.countryId ? `country:${filters.countryId}` : filters.regionId ? `region:${filters.regionId}` : undefined;
  const catalog = exploreRecipeCatalog(recipes, filters);
  const cuisines = listRecipeCuisineOptions(recipes, locale);
  const countries = listRecipeCountryOptions(recipes, locale);
  const regions = listRecipeRegionOptions(recipes, locale);
  const techniques = listRecipeTechniqueOptions(recipes, locale);
  const dishTypes = listRecipeDishTypeOptions(recipes, locale);
  const flavorOptions = listFlavorPreferenceOptions(locale);
  const availableTimeBands = cookingTimeBands.filter((band) =>
    recipes.some((recipe) => getCookingTimeBand(recipe.cooking.totalTime).id === band.id));
  const activeCount = Object.values(filters).filter((value) => value !== undefined && value !== "").length;

  return (
    <main id="main-content">
      <SiteHeader active="recipes" locale={locale} currentPath={`/${locale}/recipes`} query={normalizedQuery.toString()} />
      <header className="border-b border-stone-200 bg-[var(--surface-herb)] py-9 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#a64631]">{messages.catalog.eyebrow}</p>
          <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_24rem] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-stone-950 sm:text-5xl">
              {messages.catalog.heading}
            </h1>
            <p className="leading-7 text-stone-600">
              {messages.catalog.intro}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="catalog-title">
        {hasCarriedContext ? (
          <div className="mb-7 border-l-4 border-[#235849] bg-[var(--surface-herb)] px-5 py-4 text-sm leading-6 text-stone-700">
            <p className="font-bold text-stone-950">
              {locale === "zh-CN" ? "你的决定条件会继续保留" : "Your decision conditions stay with you"}
            </p>
            <p className="mt-1">
              {locale === "zh-CN"
                ? "下面的目录筛选只用于浏览，不表示整库料理已经满足这些条件；进入具体菜谱后会再次显示适用范围。"
                : "The catalog filters below are for browsing only. They do not claim every item satisfies your decision conditions; scope is shown again on each recipe."}
            </p>
          </div>
        ) : null}
        <div className="grid gap-7 border-b border-stone-300 pb-7 lg:grid-cols-3">
          <BrowseChoices
            label={messages.catalog.flavor}
            options={flavorOptions}
            selected={filters.flavorPreferenceId}
            hrefFor={(id) => catalogHref(filters, { flavorPreferenceId: filters.flavorPreferenceId === id ? undefined : id as RecipeCatalogFilters["flavorPreferenceId"] }, locale, decisionState.context)}
          />
          <BrowseChoices
            label={messages.catalog.pace}
            options={availableTimeBands.map((band) => ({ id: band.id, label: band.label[locale] }))}
            selected={filters.timeBandId}
            hrefFor={(id) => catalogHref(filters, { timeBandId: filters.timeBandId === id ? undefined : id as RecipeCatalogFilters["timeBandId"] }, locale, decisionState.context)}
          />
          <BrowseChoices
            label={messages.catalog.cuisine}
            options={cuisines.slice(0, 6)}
            selected={filters.cuisineId}
            hrefFor={(id) => catalogHref(filters, { cuisineId: filters.cuisineId === id ? undefined : id }, locale, decisionState.context)}
          />
        </div>

        <form action={getLocalizedPath(locale, "/recipes")} className="border-y border-stone-300 py-5">
          {[...decisionOnlyQuery].map(([name, value], index) => <input key={`${name}:${value}:${index}`} name={name} type="hidden" value={value} />)}
          {filters.flavorPreferenceId ? <input name="flavor" type="hidden" value={filters.flavorPreferenceId} /> : null}
          {filters.timeBandId ? <input name="pace" type="hidden" value={filters.timeBandId} /> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">{messages.catalog.searchLabel}</span>
              <input
                className="min-h-12 w-full rounded-md border border-stone-300 bg-white px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
                defaultValue={filters.query}
                name="q"
                placeholder={messages.catalog.searchPlaceholder}
                type="search"
              />
            </label>
            <button className="focus-ring min-h-12 rounded-md bg-[#235849] px-6 font-bold text-white hover:bg-[#173f35]" type="submit">
              {messages.catalog.search}
            </button>
            {activeCount ? (
              <Link className="focus-ring inline-flex min-h-12 items-center justify-center px-3 text-sm font-bold text-[#235849] hover:underline" href={getLocalizedPath(locale, "/recipes", decisionOnlyQuery)}>
                {messages.catalog.clear}
              </Link>
            ) : null}
          </div>

          <details className="mt-3" open={activeCount > Number(Boolean(filters.query))}>
            <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-900">
              <span>{messages.catalog.moreFilters}</span>
              <span className="text-sm font-semibold text-[#235849]">{activeCount ? messages.catalog.refine : messages.catalog.expand}</span>
            </summary>
            <div className="grid gap-4 pb-2 pt-4 sm:grid-cols-2 lg:grid-cols-5">
              <FilterSelect label={messages.catalog.cuisine} name="cuisine" value={filters.cuisineId} options={cuisines} allLabel={messages.common.all} />
              <FilterSelect
                label={messages.catalog.origin}
                name="origin"
                value={origin}
                options={[
                  ...countries.map((item) => ({ ...item, id: `country:${item.id}` })),
                  ...regions.map((item) => ({ ...item, id: `region:${item.id}` })),
                ]}
                allLabel={messages.common.all}
              />
              <FilterSelect label={messages.catalog.dishType} name="dish" value={filters.dishTypeId} options={dishTypes} allLabel={messages.common.all} />
              <FilterSelect label={messages.catalog.technique} name="technique" value={filters.techniqueId} options={techniques} allLabel={messages.common.all} />
              <FilterSelect
                label={messages.catalog.maxTime}
                name="time"
                value={filters.maxTime?.toString()}
                options={[20, 30, 45, 60].map((value) => ({ id: value.toString(), label: `${value} ${locale === "zh-CN" ? "分钟" : "min"}`, count: 0 }))}
                allLabel={messages.common.all}
              />
            </div>
            <button className="focus-ring mt-3 min-h-11 rounded-md border border-[#235849] px-5 text-sm font-bold text-[#235849] hover:bg-[#edf4f0]" type="submit">
              {messages.catalog.apply}
            </button>
          </details>
        </form>

        <div className="mt-7">
          <p className="text-sm font-semibold text-stone-600">{messages.catalog.commonTechniques}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {techniques.slice(0, 10).map((technique) => (
              <Link
                key={technique.id}
                className={`focus-ring inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold ${
                  filters.techniqueId === technique.id
                    ? "border-[#235849] bg-[#235849] text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:border-[#235849]"
                }`}
                href={catalogHref(filters, { techniqueId: filters.techniqueId === technique.id ? undefined : technique.id }, locale, decisionState.context)}
              >
                {technique.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#a64631]">{activeCount ? messages.catalog.selected : messages.catalog.browse}</p>
            <h2 id="catalog-title" className="mt-1 text-3xl font-bold text-stone-950">
              {activeCount ? messages.catalog.selectedTitle : messages.catalog.browseTitle}
            </h2>
            <p className="mt-2 text-sm text-stone-500">{messages.catalog.count(catalog.length)}</p>
          </div>
          <p className="text-sm text-stone-500">{messages.common.nutritionDisclaimer}</p>
        </div>

        {catalog.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.map((result) => <RecipeCard key={result.recipe.id} result={result} variant="catalog" locale={locale} query={recipeQuery} />)}
          </div>
        ) : (
          <div className="mt-7 border border-dashed border-stone-400 bg-white px-6 py-14 text-center">
            <h2 className="text-2xl font-bold text-stone-950">{messages.catalog.noResults}</h2>
            <p className="mt-3 text-stone-600">{messages.catalog.noResultsBody}</p>
            <Link className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-md bg-[#235849] px-5 font-bold text-white" href={getLocalizedPath(locale, "/recipes", decisionOnlyQuery)}>
              {messages.catalog.reset}
            </Link>
          </div>
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
  allLabel,
}: {
  label: string;
  name: string;
  value?: string;
  options: Array<{ id: string; label: string; count: number }>;
  allLabel: string;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-stone-600">{label}</span>
      <select
        className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
        defaultValue={value ?? ""}
        name={name}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}{option.count ? ` · ${option.count}` : ""}</option>)}
      </select>
    </label>
  );
}

function catalogHref(
  filters: RecipeCatalogFilters,
  changes: Partial<RecipeCatalogFilters>,
  locale: SupportedLocale,
  context: Parameters<typeof serializeDecisionRouteQuery>[0],
): string {
  const next = { ...filters, ...changes };
  return getLocalizedPath(locale, "/recipes", serializeDecisionRouteQuery(
    context,
    decisionContextValueAllowlist,
    { catalogFilters: next },
  ));
}

function BrowseChoices({
  label,
  options,
  selected,
  hrefFor,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selected?: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-stone-600">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <Link
            aria-current={selected === option.id ? "page" : undefined}
            className={`focus-ring inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold ${
              selected === option.id ? "border-[#235849] bg-[#235849] text-white" : "border-stone-300 bg-white text-stone-700 hover:border-[#235849]"
            }`}
            href={hrefFor(option.id)}
            key={option.id}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = getLocale((await params).locale);
  const messages = getMessages(locale);
  return {
    title: messages.catalog.title,
    description: messages.catalog.description,
    alternates: buildLocaleAlternates(locale, "/recipes"),
  };
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}

function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) params.append(key, entry);
  }
  return params;
}
