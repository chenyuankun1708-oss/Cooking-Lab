import type { Metadata } from "next";
import Link from "next/link";
import { BetaNote } from "@/components/beta-note";
import { RecipeCard } from "@/components/recipe-card";
import { SiteFooter } from "@/components/site-footer";
import { recipes } from "@/data/recipes";
import { recommendationEngine } from "@/lib/recommendation";

export const metadata: Metadata = {
  title: "全部菜谱目录",
};

export default function RecipeCatalogPage() {
  const catalog = recommendationEngine.rank(recipes, {});
  return (
    <main>
      <header className="bg-[#173f35] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="目录导航">
            <Link
              href="/"
              className="rounded text-sm font-semibold text-emerald-100 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              ← 返回料理决策首页
            </Link>
          </nav>
          <p className="mt-10 text-sm font-semibold tracking-[.18em] text-emerald-200">RECIPE CATALOG</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">全部料理实验</h1>
          <p className="mt-4 max-w-2xl leading-7 text-emerald-50/80">
            浏览完整的 30 道结构化菜谱。每道菜都包含清晰步骤、料理原理，以及基于 demo 数据的营养和成本估算。
          </p>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-labelledby="catalog-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700">完整目录</p>
            <h2 id="catalog-title" className="mt-1 text-3xl font-bold">
              {catalog.length} 道菜谱
            </h2>
          </div>
          <p className="text-sm text-stone-500">公开 Beta 当前使用 demo-estimated 数据集</p>
        </div>
        <div className="mt-6">
          <BetaNote title="目录中的估算说明" />
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalog.map((result) => <RecipeCard key={result.recipe.id} result={result} variant="catalog" />)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
