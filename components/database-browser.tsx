"use client";

import { useMemo, useState } from "react";
import type { DatabaseBrowseEntry } from "@/data/database-browse-entries";

interface DatabaseBrowserProps {
  entries: DatabaseBrowseEntry[];
  stats: { label: string; value: number }[];
  sourceLine: string;
}

const categoryLabels: Record<string, string> = {
  baking: "Baking",
  bartending: "Bartending",
  dessert: "Dessert",
};

const itemTypeLabels: Record<string, string> = {
  dish: "Dish",
  dessert: "Dessert",
  tea: "Tea",
  coffee: "Coffee",
  "alcoholic-drink": "Alcoholic",
  "non-alcoholic-drink": "Non-alc",
};

const sourceTypeLabels: Record<string, string> = {
  "web-migrated": "Web 迁移",
  "loc-public-domain": "LOC 公版",
  "web-curated": "Web 改编",
  "ai-assisted": "知识库",
  original: "原创",
};

const roleLabels: Record<string, string> = {
  main: "主料",
  seasoning: "调料",
  garnish: "装饰",
  optional: "可选",
};

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

export function DatabaseBrowser({ entries, stats, sourceLine }: DatabaseBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [source, setSource] = useState("all");
  const [selected, setSelected] = useState<DatabaseBrowseEntry | null>(null);

  const cuisines = useMemo(() => {
    const set = new Set(entries.map((entry) => entry.cuisine).filter(Boolean));
    return ["all", ...[...set].sort()];
  }, [entries]);
  const sources = useMemo(() => {
    const set = new Set(entries.map((entry) => entry.sourceType).filter(Boolean));
    return ["all", ...[...set].sort()];
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category !== "all" && !entry.categories.includes(category)) return false;
      if (cuisine !== "all" && entry.cuisine !== cuisine) return false;
      if (source !== "all" && entry.sourceType !== source) return false;
      if (q) {
        const haystack = `${entry.slug} ${entry.cuisine} ${entry.flavors.join(" ")} ${entry.portionRows.map((p) => p.ingredient).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, query, category, cuisine, source]);

  return (
    <div>
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
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
          placeholder="搜索菜谱 / 食材 / 味道标签…"
          className="w-64 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-stone-300 focus:border-stone-400"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
          <option value="all">全部品类</option>
          <option value="baking">烘焙</option>
          <option value="bartending">调酒</option>
          <option value="dessert">甜品</option>
        </select>
        <select value={cuisine} onChange={(event) => setCuisine(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
          <option value="all">全部菜系</option>
          {cuisines.filter((value) => value !== "all").map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select value={source} onChange={(event) => setSource(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
          <option value="all">全部来源</option>
          {sources.filter((value) => value !== "all").map((value) => (
            <option key={value} value={value}>{sourceTypeLabels[value] ?? value}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-stone-400">
          {filtered.length} / {entries.length} 条
        </span>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-3 text-xs text-stone-400">{sourceLine}</div>
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-medium">菜谱</th>
                <th className="px-3 py-3 font-medium">品类</th>
                <th className="px-3 py-3 font-medium">类型</th>
                <th className="px-3 py-3 font-medium">菜系</th>
                <th className="px-3 py-3 text-right font-medium">份</th>
                <th className="px-3 py-3 text-right font-medium">kcal/份</th>
                <th className="px-3 py-3 text-right font-medium">食材</th>
                <th className="px-3 py-3 text-right font-medium">步骤</th>
                <th className="px-3 py-3 font-medium">来源</th>
                <th className="px-5 py-3 font-medium">味道标签</th>
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
                          {categoryLabels[cat] ?? cat}
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
                  <td className="px-3 py-3 text-xs text-stone-400">{sourceTypeLabels[row.sourceType] ?? row.sourceType}</td>
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
                  <td colSpan={10} className="px-5 py-10 text-center text-sm text-stone-400">
                    没有匹配的条目——试试放宽筛选条件。
                  </td>
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
                      {categoryLabels[cat] ?? cat}
                    </span>
                  ))}
                </div>
                <h2 className="mt-1.5 font-serif text-2xl text-stone-900">{selected.slug}</h2>
                <p className="mt-1 text-xs text-stone-400">
                  {itemTypeLabels[selected.itemType] ?? selected.itemType} · {selected.cuisine || "—"} · {selected.servings} 份 ·{" "}
                  {sourceTypeLabels[selected.sourceType] ?? selected.sourceType}
                  {selected.contexts.length ? ` · ${selected.contexts.join(", ")}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-50"
              >
                关闭
              </button>
            </header>

            <div className="space-y-6 px-6 py-5">
              {selected.flavors.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">味道档案</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.flavors.map((flavor) => (
                      <span key={flavor} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">{flavor}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">配料（{selected.portionRows.length}）</h3>
                <ul className="divide-y divide-stone-100 rounded-lg border border-stone-100">
                  {selected.portionRows.map((portion) => (
                    <li key={portion.ingredient + portion.unit} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                      <span className="font-medium text-stone-700">
                        {portion.ingredient}
                        {portion.optional && <span className="ml-1 text-[10px] text-stone-400">(可选)</span>}
                      </span>
                      <span className="shrink-0 text-xs text-stone-400">
                        {portion.unit} · {portion.grams}g · {roleLabels[portion.role] ?? portion.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">步骤（{selected.stepRows.length}）</h3>
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
                        <p className="mt-0.5 text-xs text-stone-400">
                          {formatDuration(step.durationS)}
                          {step.note && ` · ${step.note}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">营养（每份）</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "热量", value: `${selected.nutrition.calories} kcal` },
                    { label: "蛋白质", value: `${selected.nutrition.protein} g` },
                    { label: "脂肪", value: `${selected.nutrition.fat} g` },
                    { label: "饱和脂肪", value: `${selected.nutrition.saturatedFat} g` },
                    { label: "碳水", value: `${selected.nutrition.carbs} g` },
                    { label: "糖", value: `${selected.nutrition.sugar} g` },
                    { label: "纤维", value: `${selected.nutrition.fiber} g` },
                    { label: "钠", value: `${selected.nutrition.sodium} mg` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-stone-100 px-2.5 py-2 text-center">
                      <p className="text-[10px] text-stone-400">{item.label}</p>
                      <p className="mt-0.5 text-sm font-medium text-stone-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selected.sourceNotes && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">来源与用途限制</h3>
                  <p className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs leading-relaxed text-amber-800">
                    {selected.sourceNotes}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
