import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CulinaryCard } from "@/components/culinary-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { getPublishedCulinaryItemsForLocale } from "@/data/published-culinary-items";
import { getStoryExperienceContext } from "@/data/published-stories";
import { cookingTimeBands } from "@/lib/cooking-time";
import {
  exploreCulinaryCatalog,
  listCulinaryCountryOptions,
  listCulinaryCuisineOptions,
  listCulinaryRegionOptions,
  listCulinaryTechniqueOptions,
  listCulinaryTypeOptions,
  parseCulinaryCatalogFilters,
  type CulinaryCatalogFilters,
  type CulinaryCatalogOption,
} from "@/lib/culinary-exploration";
import { hasDecisionContext, parseDecisionRouteState, serializeDecisionRouteQuery } from "@/lib/decision-context-navigation";
import { listFlavorPreferenceOptions } from "@/lib/flavor";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import type { SupportedLocale } from "@/types/localization";

type RawSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RecipeCatalogPage({ searchParams, params }: { searchParams: RawSearchParams; params: Promise<{ locale: string }> }) {
  const locale = getLocale((await params).locale);
  const copy = catalogCopy[locale];
  const items = getPublishedCulinaryItemsForLocale(locale);
  const context = getStoryExperienceContext(locale);
  const rawParams = toSearchParams(await searchParams);
  const filters = parseCulinaryCatalogFilters(rawParams, items);
  const decisionState = parseDecisionRouteState(rawParams, decisionContextValueAllowlist);
  const hasCarriedContext = hasDecisionContext(decisionState.context);
  const normalizedQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist, { catalogFilters: filters });
  const itemQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist, { source: "catalog", catalogFilters: filters });
  const decisionOnlyQuery = serializeDecisionRouteQuery(decisionState.context, decisionContextValueAllowlist);
  const origin = filters.countryId ? `country:${filters.countryId}` : filters.regionId ? `region:${filters.regionId}` : undefined;
  const catalog = exploreCulinaryCatalog(items, filters, context, locale);
  const typeOptions = listCulinaryTypeOptions(items, locale);
  const cuisines = listCulinaryCuisineOptions(items, locale);
  const countries = listCulinaryCountryOptions(items, locale);
  const regions = listCulinaryRegionOptions(items, locale);
  const techniques = listCulinaryTechniqueOptions(items, locale);
  const flavorOptions = listFlavorPreferenceOptions(locale).map((item) => ({ ...item, count: 0 }));
  const activeCount = Object.values(filters).filter((value) => value !== undefined && value !== "").length;

  return (
    <main id="main-content">
      <SiteHeader active="recipes" locale={locale} currentPath={`/${locale}/recipes`} query={normalizedQuery.toString()} />
      <header className="hero-surface border-b border-[var(--line)] py-8 sm:py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.46fr)] lg:items-end lg:gap-12">
          <div>
          <p className="editorial-kicker">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-[18ch] text-4xl leading-[1.05] text-stone-950 sm:text-6xl">{copy.heading}</h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-stone-600 lg:pb-1">{copy.intro}</p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8" aria-labelledby="catalog-title">
        {hasCarriedContext ? (
          <div className="mb-8 max-w-3xl border-l-2 border-[var(--tomato)] pl-4 text-sm leading-6 text-stone-700">
            <p className="font-bold text-stone-950">{copy.contextTitle}</p>
            <p className="mt-1">{copy.contextBody}</p>
          </div>
        ) : null}

        <nav aria-label={copy.quickFilters} className="grid gap-4 border-b border-[var(--line)] pb-5 lg:grid-cols-[1.1fr_1.4fr_1fr]">
          <BrowseChoices
            label={copy.type}
            options={typeOptions}
            selected={filters.itemType}
            hrefFor={(id) => catalogHref(filters, { itemType: filters.itemType === id ? undefined : id as CulinaryCatalogFilters["itemType"] }, locale, decisionState.context)}
          />
          <BrowseChoices
            label={copy.flavor}
            options={flavorOptions.slice(0, 6)}
            selected={filters.flavorPreferenceId}
            hrefFor={(id) => catalogHref(filters, { flavorPreferenceId: filters.flavorPreferenceId === id ? undefined : id as CulinaryCatalogFilters["flavorPreferenceId"] }, locale, decisionState.context)}
          />
          <BrowseChoices
            label={copy.story}
            options={[{ id: "available", label: copy.withStory, count: 0 }]}
            selected={filters.story}
            hrefFor={() => catalogHref(filters, { story: filters.story ? undefined : "available" }, locale, decisionState.context)}
          />
        </nav>

        <form action={getLocalizedPath(locale, "/recipes")} className="border-b border-[var(--line)] py-6">
          {[...decisionOnlyQuery].map(([name, value], index) => <input key={`${name}:${value}:${index}`} name={name} type="hidden" value={value} />)}
          {filters.flavorPreferenceId ? <input name="flavor" type="hidden" value={filters.flavorPreferenceId} /> : null}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label>
              <span className="mb-2 block text-sm font-semibold text-stone-700">{copy.searchLabel}</span>
              <input
                className="min-h-12 w-full rounded-[4px] border border-stone-400 bg-[var(--surface-paper)] px-4 text-stone-950 placeholder:text-stone-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tomato)]"
                defaultValue={filters.query}
                name="q"
                placeholder={copy.searchPlaceholder}
                type="search"
              />
            </label>
            <button className="focus-ring mt-auto min-h-12 whitespace-nowrap rounded-[4px] bg-[var(--foreground)] px-6 font-bold text-white transition hover:bg-[var(--tomato)] active:translate-y-px" type="submit">
              {copy.search}
            </button>
            {activeCount ? (
              <Link className="focus-ring mt-auto inline-flex min-h-12 items-center justify-center whitespace-nowrap px-3 text-sm font-bold text-[var(--tomato)] hover:underline" href={getLocalizedPath(locale, "/recipes", decisionOnlyQuery)}>
                {copy.clear}
              </Link>
            ) : null}
          </div>

          <details className="mt-3" open={activeCount > Number(Boolean(filters.query))}>
            <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-900">
              <span>{copy.moreFilters}</span>
              <span className="text-sm text-[var(--tomato)]">{activeCount ? copy.refine : copy.expand}</span>
            </summary>
            <div className="grid gap-4 pb-2 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <FilterSelect label={copy.type} name="type" value={filters.itemType} options={typeOptions} allLabel={copy.all} />
              <FilterSelect label={copy.cuisine} name="cuisine" value={filters.cuisineId} options={cuisines} allLabel={copy.all} />
              <FilterSelect label={copy.origin} name="origin" value={origin} options={[...countries.map((item) => ({ ...item, id: `country:${item.id}` })), ...regions.map((item) => ({ ...item, id: `region:${item.id}` }))]} allLabel={copy.all} />
              <FilterSelect label={copy.technique} name="technique" value={filters.techniqueId} options={techniques} allLabel={copy.all} />
              <FilterSelect label={copy.pace} name="pace" value={filters.timeBandId} options={cookingTimeBands.map((band) => ({ id: band.id, label: band.label[locale], count: 0 }))} allLabel={copy.all} />
              <FilterSelect label={copy.story} name="story" value={filters.story} options={[{ id: "available", label: copy.withStory, count: 0 }]} allLabel={copy.all} />
            </div>
            <button className="focus-ring mt-4 min-h-11 rounded-[4px] border border-stone-900 px-5 text-sm font-bold text-stone-950 transition hover:bg-stone-950 hover:text-white active:translate-y-px" type="submit">
              {copy.apply}
            </button>
          </details>
        </form>

        <div className="mt-7 max-w-2xl">
          <h2 id="catalog-title" className="text-3xl leading-tight text-stone-950 sm:text-4xl">{activeCount ? copy.selectedTitle : copy.browseTitle}</h2>
          <p className="mt-3 text-sm text-stone-600">{copy.count(catalog.length)}</p>
        </div>

        {catalog.length ? (
          <div className="culinary-index-grid mt-6 grid grid-flow-row-dense gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.map((entry, index) => <CulinaryCard featured={index === 0 || index === 7} key={entry.id} entry={entry} locale={locale} query={itemQuery} />)}
          </div>
        ) : (
          <div className="mt-8 border-t border-dashed border-stone-500 py-14">
            <h2 className="text-2xl text-stone-950">{copy.noResults}</h2>
            <p className="mt-3 text-stone-600">{copy.noResultsBody}</p>
            <Link className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-[4px] bg-stone-950 px-5 font-bold text-white" href={getLocalizedPath(locale, "/recipes", decisionOnlyQuery)}>
              {copy.reset}
            </Link>
          </div>
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}

function FilterSelect({ label, name, value, options, allLabel }: { label: string; name: string; value?: string; options: CulinaryCatalogOption[]; allLabel: string }) {
  return (
    <label className="text-sm">
      <span className="mb-2 block text-stone-700">{label}</span>
      <select className="min-h-11 w-full rounded-[4px] border border-stone-400 bg-[var(--surface-paper)] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tomato)]" defaultValue={value ?? ""} name={name}>
        <option value="">{allLabel}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}{option.count ? ` (${option.count})` : ""}</option>)}
      </select>
    </label>
  );
}

function catalogHref(filters: CulinaryCatalogFilters, changes: Partial<CulinaryCatalogFilters>, locale: SupportedLocale, context: Parameters<typeof serializeDecisionRouteQuery>[0]): string {
  return getLocalizedPath(locale, "/recipes", serializeDecisionRouteQuery(context, decisionContextValueAllowlist, { catalogFilters: { ...filters, ...changes } }));
}

function BrowseChoices({ label, options, selected, hrefFor }: { label: string; options: CulinaryCatalogOption[]; selected?: string; hrefFor: (id: string) => string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-stone-700">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <Link aria-current={selected === option.id ? "page" : undefined} className={`focus-ring inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold transition active:translate-y-px ${selected === option.id ? "border-[var(--foreground)] bg-[var(--foreground)] text-white" : "border-stone-400 text-stone-800 hover:border-[var(--tomato)] hover:text-[var(--tomato)]"}`} href={hrefFor(option.id)} key={option.id}>
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = getLocale((await params).locale);
  return { title: catalogCopy[locale].metadataTitle, description: catalogCopy[locale].metadataDescription, alternates: buildLocaleAlternates(locale, "/recipes") };
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

const catalogCopy = {
  "zh-CN": {
    metadataTitle: "料理库", metadataDescription: "浏览 Cooking Lab 的菜肴、甜品、茶、咖啡和饮品。", eyebrow: "料理库",
    heading: "做法、风味和故事，都从一道料理开始。", intro: "浏览可执行菜谱、冲泡方法与成品饮品，按类型、地方、技法、时间和故事筛选。",
    contextTitle: "你的决定条件会继续保留", contextBody: "目录筛选用于浏览。只有可执行菜谱会进入今晚吃什么的条件判断。", quickFilters: "快速筛选",
    type: "料理类型", flavor: "风味", story: "故事", withStory: "有故事", searchLabel: "搜索料理", searchPlaceholder: "搜索菜名或描述", search: "搜索",
    clear: "清除筛选", moreFilters: "更多筛选", refine: "继续调整", expand: "展开", cuisine: "地区或菜系", origin: "国家或地区", technique: "技法", pace: "时间",
    all: "全部", apply: "应用筛选", selectedTitle: "符合当前筛选的料理", browseTitle: "全部料理", count: (count: number) => `${count} 项公开料理`,
    noResults: "没有找到对应料理", noResultsBody: "减少一个筛选条件，或换一个关键词再试。", reset: "查看全部料理",
  },
  en: {
    metadataTitle: "Culinary library", metadataDescription: "Browse dishes, desserts, tea, coffee, and drinks from Cooking Lab.", eyebrow: "Culinary library",
    heading: "Method, flavor, and story in one place.", intro: "Browse executable recipes, brewing methods, and ready-to-serve drinks by type, place, technique, time, and story.",
    contextTitle: "Your decision conditions stay with you", contextBody: "Catalog filters support browsing. Only executable recipes enter tonight's decision logic.", quickFilters: "Quick filters",
    type: "Culinary type", flavor: "Flavor", story: "Story", withStory: "Story available", searchLabel: "Search the library", searchPlaceholder: "Search by name or description", search: "Search",
    clear: "Clear filters", moreFilters: "More filters", refine: "Refine", expand: "Expand", cuisine: "Place or cuisine", origin: "Country or region", technique: "Technique", pace: "Time",
    all: "All", apply: "Apply filters", selectedTitle: "Items matching these filters", browseTitle: "All culinary items", count: (count: number) => `${count} published items`,
    noResults: "No items match", noResultsBody: "Remove one filter or try a different search term.", reset: "View all items",
  },
} as const;
