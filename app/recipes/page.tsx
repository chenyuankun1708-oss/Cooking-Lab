import type { Metadata } from "next";
import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { recipes } from "@/data/recipes";
import { cookingTimeBands, type CookingTimeBandId } from "@/lib/cooking-time";
import { listFlavorPreferenceOptions } from "@/lib/flavor";
import { exploreRecipeCatalog, type RecipeCatalogFilters } from "@/lib/recipe-exploration";
import {
  listRecipeCountryOptions,
  listRecipeCuisineOptions,
  listRecipeDishTypeOptions,
  listRecipeRegionOptions,
  listRecipeTechniqueOptions,
} from "@/lib/taxonomy";
import { flavorPreferenceIds, type FlavorPreferenceId } from "@/types/flavor";

export const metadata: Metadata = {
  title: "料理目录",
  description: "按口味、做饭节奏、菜系与技法发现 Cooking Lab 料理。",
};

type RawSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RecipeCatalogPage({ searchParams }: { searchParams: RawSearchParams }) {
  const raw = await searchParams;
  const origin = first(raw.origin);
  const filters: RecipeCatalogFilters = {
    query: first(raw.q),
    cuisineId: first(raw.cuisine),
    techniqueId: first(raw.technique),
    dishTypeId: first(raw.dish),
    maxTime: parseMaxTime(first(raw.time)),
    timeBandId: parseTimeBand(first(raw.pace)),
    flavorPreferenceId: parseFlavorPreference(first(raw.flavor)),
    countryId: origin?.startsWith("country:") ? origin.slice("country:".length) : undefined,
    regionId: origin?.startsWith("region:") ? origin.slice("region:".length) : undefined,
  };
  const catalog = exploreRecipeCatalog(recipes, filters);
  const cuisines = listRecipeCuisineOptions(recipes);
  const countries = listRecipeCountryOptions(recipes);
  const regions = listRecipeRegionOptions(recipes);
  const techniques = listRecipeTechniqueOptions(recipes);
  const dishTypes = listRecipeDishTypeOptions(recipes);
  const flavorOptions = listFlavorPreferenceOptions();
  const activeCount = Object.values(filters).filter((value) => value !== undefined && value !== "").length;

  return (
    <main id="main-content">
      <SiteHeader active="recipes" />
      <header className="border-b border-stone-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#a64631]">料理探索</p>
          <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_24rem] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">
              从一道想吃的菜，走进更大的料理地图
            </h1>
            <p className="leading-7 text-stone-600">
              先从想吃的味道和今天的做饭节奏出发，也可以按菜系、地区与技法慢慢逛。
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-labelledby="catalog-title">
        <div className="grid gap-7 border-b border-stone-300 pb-7 lg:grid-cols-3">
          <BrowseChoices
            label="口味"
            options={flavorOptions}
            selected={filters.flavorPreferenceId}
            hrefFor={(id) => catalogHref(filters, { flavorPreferenceId: filters.flavorPreferenceId === id ? undefined : id as FlavorPreferenceId })}
          />
          <BrowseChoices
            label="做饭节奏"
            options={cookingTimeBands.map((band) => ({ id: band.id, label: band.label["zh-CN"] }))}
            selected={filters.timeBandId}
            hrefFor={(id) => catalogHref(filters, { timeBandId: filters.timeBandId === id ? undefined : id as CookingTimeBandId })}
          />
          <BrowseChoices
            label="菜系"
            options={cuisines.slice(0, 6)}
            selected={filters.cuisineId}
            hrefFor={(id) => catalogHref(filters, { cuisineId: filters.cuisineId === id ? undefined : id })}
          />
        </div>

        <form action="/recipes" className="border-y border-stone-300 py-5">
          {filters.flavorPreferenceId ? <input name="flavor" type="hidden" value={filters.flavorPreferenceId} /> : null}
          {filters.timeBandId ? <input name="pace" type="hidden" value={filters.timeBandId} /> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">搜索料理</span>
              <input
                className="min-h-12 w-full rounded-md border border-stone-300 bg-white px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
                defaultValue={filters.query}
                name="q"
                placeholder="搜索菜名或描述"
                type="search"
              />
            </label>
            <button className="focus-ring min-h-12 rounded-md bg-[#235849] px-6 font-bold text-white hover:bg-[#173f35]" type="submit">
              查找料理
            </button>
            {activeCount ? (
              <Link className="focus-ring inline-flex min-h-12 items-center justify-center px-3 text-sm font-bold text-[#235849] hover:underline" href="/recipes">
                清除筛选
              </Link>
            ) : null}
          </div>

          <details className="mt-3" open={activeCount > Number(Boolean(filters.query))}>
            <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-900">
              <span>地区、类型、技法与精确时间</span>
              <span className="text-sm font-semibold text-[#235849]">{activeCount ? "继续细选" : "展开"}</span>
            </summary>
            <div className="grid gap-4 pb-2 pt-4 sm:grid-cols-2 lg:grid-cols-5">
              <FilterSelect label="菜系" name="cuisine" value={filters.cuisineId} options={cuisines} />
              <FilterSelect
                label="国家 / 地区"
                name="origin"
                value={origin}
                options={[
                  ...countries.map((item) => ({ ...item, id: `country:${item.id}` })),
                  ...regions.map((item) => ({ ...item, id: `region:${item.id}` })),
                ]}
              />
              <FilterSelect label="料理类型" name="dish" value={filters.dishTypeId} options={dishTypes} />
              <FilterSelect label="技法" name="technique" value={filters.techniqueId} options={techniques} />
              <FilterSelect
                label="最长时间"
                name="time"
                value={filters.maxTime?.toString()}
                options={[20, 30, 45, 60].map((value) => ({ id: value.toString(), label: `${value} 分钟`, count: 0 }))}
              />
            </div>
            <button className="focus-ring mt-3 min-h-11 rounded-md border border-[#235849] px-5 text-sm font-bold text-[#235849] hover:bg-[#edf4f0]" type="submit">
              看看这些料理
            </button>
          </details>
        </form>

        <div className="mt-7">
          <p className="text-sm font-semibold text-stone-600">常用技法</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {techniques.slice(0, 10).map((technique) => (
              <Link
                key={technique.id}
                className={`focus-ring inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold ${
                  filters.techniqueId === technique.id
                    ? "border-[#235849] bg-[#235849] text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:border-[#235849]"
                }`}
                href={catalogHref(filters, { techniqueId: filters.techniqueId === technique.id ? undefined : technique.id })}
              >
                {technique.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#a64631]">{activeCount ? "顺着你的选择" : "慢慢逛"}</p>
            <h2 id="catalog-title" className="mt-1 text-3xl font-bold text-stone-950">
              {activeCount ? "这些料理正合适" : "今天从哪道开始？"}
            </h2>
            <p className="mt-2 text-sm text-stone-500">共 {catalog.length} 道可看</p>
          </div>
          <p className="text-sm text-stone-500">营养与成本为估算值</p>
        </div>

        {catalog.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.map((result) => <RecipeCard key={result.recipe.id} result={result} variant="catalog" />)}
          </div>
        ) : (
          <div className="mt-7 border border-dashed border-stone-400 bg-white px-6 py-14 text-center">
            <h2 className="text-2xl font-bold text-stone-950">没有找到符合条件的料理</h2>
            <p className="mt-3 text-stone-600">减少一个筛选条件，或换一个更宽泛的关键词试试。</p>
            <Link className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-md bg-[#235849] px-5 font-bold text-white" href="/recipes">
              换个方向看看
            </Link>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: Array<{ id: string; label: string; count: number }>;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-stone-600">{label}</span>
      <select
        className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
        defaultValue={value ?? ""}
        name={name}
      >
        <option value="">全部</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}{option.count ? ` · ${option.count}` : ""}</option>)}
      </select>
    </label>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseMaxTime(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return [20, 30, 45, 60].includes(parsed) ? parsed : undefined;
}

function parseTimeBand(value: string | undefined): CookingTimeBandId | undefined {
  return cookingTimeBands.some((band) => band.id === value) ? value as CookingTimeBandId : undefined;
}

function parseFlavorPreference(value: string | undefined): FlavorPreferenceId | undefined {
  return flavorPreferenceIds.includes(value as FlavorPreferenceId) ? value as FlavorPreferenceId : undefined;
}

function catalogHref(filters: RecipeCatalogFilters, changes: Partial<RecipeCatalogFilters>): string {
  const next = { ...filters, ...changes };
  const params = new URLSearchParams();
  if (next.query) params.set("q", next.query);
  if (next.cuisineId) params.set("cuisine", next.cuisineId);
  if (next.countryId) params.set("origin", `country:${next.countryId}`);
  if (next.regionId) params.set("origin", `region:${next.regionId}`);
  if (next.techniqueId) params.set("technique", next.techniqueId);
  if (next.dishTypeId) params.set("dish", next.dishTypeId);
  if (next.maxTime !== undefined) params.set("time", next.maxTime.toString());
  if (next.timeBandId) params.set("pace", next.timeBandId);
  if (next.flavorPreferenceId) params.set("flavor", next.flavorPreferenceId);
  return params.size ? `/recipes?${params.toString()}` : "/recipes";
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
