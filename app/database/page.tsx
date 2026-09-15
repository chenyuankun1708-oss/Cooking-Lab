import type { Metadata } from "next";
import { databaseBrowseEntries, databaseBrowseSummary } from "@/data/database-browse-entries";
import { DatabaseBrowser } from "@/components/database-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Recipe Database | Cooking Lab",
  description: "Internal browsing view of the M13 recipe database (500 structured entries).",
  robots: { index: false, follow: false },
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
  const stats = [
    { label: "总条目", value: summary.total },
    { label: "烘焙", value: summary.baking },
    { label: "调酒", value: summary.bartending },
    { label: "甜品", value: summary.dessert },
    { label: "结构问题", value: summary.issues },
    { label: "食材", value: summary.ingredients },
  ];
  const sourceLine = `来源分布：${summary.sources
    .map(({ sourceType, count }) => `${sourceTypeLabels[sourceType] ?? sourceType} ${count}`)
    .join(" · ")}`;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader locale="zh-CN" currentPath="/database" />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">Internal · M13 Recipe Database</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-900">菜谱数据库</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500">
            {summary.total} 条结构化条目 · {summary.ingredients} 种食材 · {summary.conversions} 条单位转换 ·
            覆盖烘焙 / 调酒 / 甜品三大品类。点击任意行查看配料、步骤与营养详情。此视图仅供内部审阅，不进入公开导航与索引。
          </p>
        </header>
        <DatabaseBrowser entries={databaseBrowseEntries} stats={stats} sourceLine={sourceLine} />
      </main>
      <SiteFooter locale="zh-CN" />
    </div>
  );
}
