"use client";

import { useMemo, useState } from "react";
import type { PublicRecipeEntry } from "@/data/public-recipe-database";
import type { PublicRecipeDatabaseSummary } from "@/data/public-recipe-database";
import type { SupportedLocale } from "@/types/localization";

interface PublicRecipeDatabaseBrowserProps {
  entries: PublicRecipeEntry[];
  summary: PublicRecipeDatabaseSummary;
  locale: SupportedLocale;
}

const zh = {
  stats: { total: "收录条目", baking: "烘焙", bartending: "调酒", dessert: "甜品", ingredients: "食材" },
  search: "搜索菜谱 / 食材 / 味道…",
  allCategories: "全部品类",
  allCuisines: "全部菜系",
  allSources: "全部来源",
  count: (shown: number, total: number) => `${shown} / ${total} 条`,
  col: { recipe: "菜谱", category: "品类", type: "类型", cuisine: "菜系", servings: "份", kcal: "kcal/份", portions: "食材", steps: "步骤", source: "来源", flavors: "味道标签", complexity: "复杂度" },
  empty: "没有匹配的条目——试试放宽筛选条件。",
  close: "关闭",
  detail: { flavors: "味道档案", portions: "配料", steps: "操作步骤", nutrition: "营养（每份）", optional: "可选" },
  nutrition: { calories: "热量", protein: "蛋白质", fat: "脂肪", saturatedFat: "饱和脂肪", carbs: "碳水", sugar: "糖", fiber: "纤维", sodium: "钠" },
  sources: { "web-migrated": "Web 迁移", "loc-public-domain": "LOC 公版", "web-curated": "Web 改编", "ai-assisted": "知识库", original: "原创" } as Record<string, string>,
  category: { baking: "烘焙", bartending: "调酒", dessert: "甜品" } as Record<string, string>,
  role: { main: "主料", seasoning: "调料", garnish: "装饰", optional: "可选" } as Record<string, string>,
};

const en = {
  stats: { total: "Entries", baking: "Baking", bartending: "Bartending", dessert: "Dessert", ingredients: "Ingredients" },
  search: "Search recipes / ingredients / flavors…",
  allCategories: "All categories",
  allCuisines: "All cuisines",
  allSources: "All sources",
  count: (shown: number, total: number) => `${shown} / ${total}`,
  col: { recipe: "Recipe", category: "Category", type: "Type", cuisine: "Cuisine", servings: "Servings", kcal: "kcal/serving", portions: "Ingredients", steps: "Steps", source: "Source", flavors: "Flavors", complexity: "Complexity" },
  empty: "No matching entries — try relaxing the filters.",
  close: "Close",
  detail: { flavors: "Flavor profile", portions: "Ingredients", steps: "Preparation steps", nutrition: "Nutrition (per serving)", optional: "optional" },
  nutrition: { calories: "Calories", protein: "Protein", fat: "Fat", saturatedFat: "Sat. fat", carbs: "Carbs", sugar: "Sugar", fiber: "Fiber", sodium: "Sodium" },
  sources: {} as Record<string, string>,
  category: {} as Record<string, string>,
  role: {} as Record<string, string>,
};

const itemTypeLabels: Record<string, string> = {
  dish: "Dish",
  dessert: "Dessert",
  tea: "Tea",
  coffee: "Coffee",
  "alcoholic-drink": "Alcoholic",
  "non-alcoholic-drink": "Non-alc",
};

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

export function PublicRecipeDatabaseBrowser({ entries, summary, locale }: PublicRecipeDatabaseBrowserProps) {
  const t = locale === "en" ? en : zh;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [selected, setSelected] = useState<PublicRecipeEntry | null>(null);

  const cuisines = useMemo(() => summary.cuisines, [summary.cuisines]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category !== "all" && !entry.categories.includes(category)) return false;
      if (cuisine !== "all" && entry.cuisine !== cuisine) return false;
      if (q) {
        const haystack = `${entry.slug} ${entry.cuisine} ${entry.flavors.join(" ")} ${entry.portionRows.map((p) => p.ingredient).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, query, category, cuisine]);

  return (
    <div>
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: t.stats.total, value: summary.total },
          { label: t.stats.baking, value: summary.baking },
          { label: t.stats.bartending, value: summary.bartending },
          { label: t.stats.dessert, value: summary.dessert },
          { label: t.stats.ingredients, value: summary.ingredients },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xs text-stone-400">{stat.label}</p>
            <p className="mt-1 font-serif text-2xl">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          className="w-64 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-stone-300 focus:border-stone-400"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
          <option value="all">{t.allCategories}</option>
          <option value="baking">{locale === "en" ? "Baking" : "烘焙"}</option>
          <option value="bartending">{locale === "en" ? "Bartending" : "调酒"}</option>
          <option value="dessert">{locale === "en" ? "Dessert" : "甜品"}</option>
        </select>
        <select value={cuisine} onChange={(event) => setCuisine(event.target.value)} className="max-w-44 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
          <option value="all">{t.allCuisines}</option>
          {cuisines.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-stone-400">{t.count(filtered.length, entries.length)}</span>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-medium">{t.col.recipe}</th>
                <th className="px-3 py-3 font-medium">{t.col.category}</th>
                <th className="px-3 py-3 font-medium">{t.col.type}</th>
                <th className="px-3 py-3 font-medium">{t.col.cuisine}</th>
                <th className="px-3 py-3 text-right font-medium">{t.col.servings}</th>
                <th className="px-3 py-3 text-right font-medium">{t.col.kcal}</th>
                <th className="px-3 py-3 text-right font-medium">{t.col.portions}</th>
                <th className="px-3 py-3 text-right font-medium">{t.col.steps}</th>
                <th className="px-5 py-3 font-medium">{t.col.flavors}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.slug}
                  onClick={() => setSelected(row)}
                  className="cursor-pointer border-b border-stone-50 last:border-0 hover:bg-stone-50"
                >
                  <td className="px-5 py-3 font-medium text-stone-800">{row.slug}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {row.categories.map((cat) => (
                        <span key={cat} className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-50">
                          {t.category[cat] ?? cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-stone-500">{itemTypeLabels[row.itemType] ?? row.itemType}</td>
                  <td className="px-3 py-3 text-stone-500">{row.cuisine || "—"}</td>
                  <td className="px-3 py-3 text-right text-stone-500">{row.servings}</td>
                  <td className="px-3 py-3 text-right text-stone-500">{row.kcalPerServing}</td>
                  <td className="px-3 py-3 text-right text-stone-500">{row.portions}</td>
                  <td className="px-3 py-3 text-right text-stone-500">{row.steps}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.flavors.map((flavor) => (
                        <span key={flavor} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">{flavor}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-stone-400">{t.empty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/30 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <aside
            className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 flex items-start justify-between border-b border-stone-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <div className="flex flex-wrap gap-1">
                  {selected.categories.map((cat) => (
                    <span key={cat} className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-50">
                      {t.category[cat] ?? cat}
                    </span>
                  ))}
                </div>
                <h2 className="mt-1.5 font-serif text-2xl text-stone-900">{selected.slug}</h2>
                <p className="mt-1 text-xs text-stone-400">
                  {itemTypeLabels[selected.itemType] ?? selected.itemType} · {selected.cuisine || "—"} · {selected.servings} {locale === "en" ? "servings" : "份"} ·{" "}
                  {selected.contexts.join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-50"
              >
                {t.close}
              </button>
            </header>

            <div className="space-y-6 px-6 py-5">
              {selected.flavors.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">{t.detail.flavors}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.flavors.map((flavor) => (
                      <span key={flavor} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">{flavor}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                  {t.detail.portions}（{selected.portionRows.length}）
                </h3>
                <ul className="divide-y divide-stone-100 rounded-lg border border-stone-100">
                  {selected.portionRows.map((portion) => (
                    <li key={portion.ingredient + portion.unit} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                      <span className="font-medium text-stone-700">
                        {portion.ingredient}
                        {portion.optional && <span className="ml-1 text-[10px] text-stone-400">({t.detail.optional})</span>}
                      </span>
                      <span className="shrink-0 text-xs text-stone-400">
                        {portion.unit} · {portion.grams}g · {t.role[portion.role] ?? portion.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                  {t.detail.steps}（{selected.stepRows.length}）
                </h3>
                <ol className="space-y-2">
                  {selected.stepRows.map((step) => (
                    <li key={step.order} className="flex gap-3 rounded-lg border border-stone-100 px-3 py-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-800 text-[10px] font-medium text-stone-50">
                        {step.order}
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className="font-medium text-stone-700">
                          {step.op}
                          {step.equipment && <span className="ml-2 text-xs font-normal text-stone-400">@ {step.equipment}</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-400">{formatDuration(step.durationS)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">{t.detail.nutrition}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: t.nutrition.calories, value: `${selected.nutrition.calories} kcal` },
                    { label: t.nutrition.protein, value: `${selected.nutrition.protein} g` },
                    { label: t.nutrition.fat, value: `${selected.nutrition.fat} g` },
                    { label: t.nutrition.saturatedFat, value: `${selected.nutrition.saturatedFat} g` },
                    { label: t.nutrition.carbs, value: `${selected.nutrition.carbs} g` },
                    { label: t.nutrition.sugar, value: `${selected.nutrition.sugar} g` },
                    { label: t.nutrition.fiber, value: `${selected.nutrition.fiber} g` },
                    { label: t.nutrition.sodium, value: `${selected.nutrition.sodium} mg` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-stone-100 px-2.5 py-2 text-center">
                      <p className="text-[10px] text-stone-400">{item.label}</p>
                      <p className="mt-0.5 text-sm font-medium text-stone-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
