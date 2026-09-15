import type { Metadata } from "next";
import { databaseBrowseEntries, databaseBrowseSummary, type DatabaseBrowseEntry } from "@/data/database-browse-entries";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Recipe Database | Cooking Lab",
  description: "Internal browsing view of the M13 recipe database (500 structured entries).",
  robots: { index: false, follow: false },
};

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

export default function DatabaseBrowserPage() {
  const summary = databaseBrowseSummary;
  const rows: DatabaseBrowseEntry[] = databaseBrowseEntries;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader locale="zh-CN" currentPath="/database" />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">Internal · M13 Recipe Database</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-900">菜谱数据库</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500">
            {summary.total} 条结构化条目 · {summary.ingredients} 种食材 · {summary.conversions} 条单位转换 ·
            覆盖烘焙 / 调酒 / 甜品三大品类。此视图仅供内部审阅，不进入公开导航与索引。
          </p>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "总条目", value: summary.total },
            { label: "烘焙", value: summary.baking },
            { label: "调酒", value: summary.bartending },
            { label: "甜品", value: summary.dessert },
            { label: "结构问题", value: summary.issues },
            { label: "食材", value: summary.ingredients },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs text-stone-400">{stat.label}</p>
              <p className="mt-1 font-serif text-2xl">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-3 text-xs text-stone-400">
            来源分布：{summary.sources.map(({ sourceType, count }) => `${sourceTypeLabels[sourceType] ?? sourceType} ${count}`).join(" · ")}
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-medium">菜谱</th>
                <th className="px-3 py-3 font-medium">品类</th>
                <th className="px-3 py-3 font-medium">类型</th>
                <th className="px-3 py-3 font-medium">菜系</th>
                <th className="px-3 py-3 font-medium">场景</th>
                <th className="px-3 py-3 text-right font-medium">份</th>
                <th className="px-3 py-3 text-right font-medium">kcal/份</th>
                <th className="px-3 py-3 text-right font-medium">食材</th>
                <th className="px-3 py-3 text-right font-medium">步骤</th>
                <th className="px-3 py-3 font-medium">来源</th>
                <th className="px-5 py-3 font-medium">味道标签</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50">
                  <td className="px-5 py-3 font-medium text-stone-800">{row.slug}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {row.categories.map((category) => (
                        <span key={category} className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-50">
                          {categoryLabels[category] ?? category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-stone-500">{itemTypeLabels[row.itemType] ?? row.itemType}</td>
                  <td className="px-3 py-3 text-stone-500">{row.cuisine || "—"}</td>
                  <td className="px-3 py-3 text-xs text-stone-400">{row.contexts.length ? row.contexts.join(", ") : "—"}</td>
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
            </tbody>
          </table>
        </section>
      </main>
      <SiteFooter locale="zh-CN" />
    </div>
  );
}
