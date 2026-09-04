import type { Metadata } from "next";
import Link from "next/link";
import { BetaNote } from "@/components/beta-note";
import { RecipeCard } from "@/components/recipe-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { recipes } from "@/data/recipes";
import { exploreRecipeCatalog, type RecipeCatalogFilters } from "@/lib/recipe-exploration";
import {
  listRecipeCountryOptions,
  listRecipeCuisineOptions,
  listRecipeDishTypeOptions,
  listRecipeRegionOptions,
  listRecipeTechniqueOptions,
} from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "料理目录",
  description: "按菜系、来源、技法、料理类型与时间浏览 Cooking Lab 的 100 道结构化菜谱。",
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
    countryId: origin?.startsWith("country:") ? origin.slice("country:".length) : undefined,
    regionId: origin?.startsWith("region:") ? origin.slice("region:".length) : undefined,
  };
  const catalog = exploreRecipeCatalog(recipes, filters);
  const cuisines = listRecipeCuisineOptions(recipes);
  const countries = listRecipeCountryOptions(recipes);
  const regions = listRecipeRegionOptions(recipes);
  const techniques = listRecipeTechniqueOptions(recipes);
  const dishTypes = listRecipeDishTypeOptions(recipes);
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
              浏览 100 道结构化菜谱。用菜系、来源、技法和时间缩小范围，营养与成本保持为清楚标注的估算。
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-labelledby="catalog-title">
        <form action="/recipes" className="border-y border-stone-300 py-5">
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
              <span>按菜系、来源、类型和技法浏览</span>
              <span className="text-sm font-semibold text-[#235849]">{activeCount ? `已启用 ${activeCount} 项` : "展开筛选"}</span>
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
              应用浏览条件
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
                {technique.label} · {technique.count}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#a64631]">{activeCount ? "当前探索结果" : "完整目录"}</p>
            <h2 id="catalog-title" className="mt-1 text-3xl font-bold text-stone-950">
              {catalog.length} 道料理
            </h2>
          </div>
          <p className="text-sm text-stone-500">数据为 Public Beta 演示估算</p>
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
              查看全部料理
            </Link>
          </div>
        )}

        <div className="mt-10">
          <BetaNote title="目录中的估算说明" />
        </div>
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
  return params.size ? `/recipes?${params.toString()}` : "/recipes";
}
