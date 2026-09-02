import Link from "next/link";
import { notFound } from "next/navigation";
import { recipes } from "@/data/recipes";
import { getDifficultyLabel } from "@/lib/display-labels";
import { createRecipeDetailViewModel, getRecipeBySlug } from "@/lib/recipe-detail";

export function generateStaticParams() {
  return recipes.map(({ slug }) => ({ slug }));
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();
  const detail = createRecipeDetailViewModel(recipe);

  return (
    <main>
      <header className="bg-[#173f35] px-5 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="面包屑导航" className="flex flex-wrap gap-3 text-sm text-emerald-100">
            <Link className="rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="/">料理决策</Link><span aria-hidden="true">/</span>
            <Link className="rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="/recipes">全部菜谱</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{recipe.name}</span>
          </nav>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div><p className="text-sm font-semibold text-emerald-200">{recipe.cuisine} · {recipe.category} · {recipe.cooking.method}</p><h1 className="mt-3 text-4xl font-bold leading-tight sm:text-6xl">{recipe.name}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-emerald-50/80">{recipe.description}</p></div>
            <div aria-hidden="true" className="h-44 rounded-3xl bg-gradient-to-br from-amber-200 via-orange-100 to-emerald-200 shadow-inner" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <section aria-labelledby="ingredients-title"><h2 id="ingredients-title" className="text-3xl font-bold">准备食材</h2><p className="mt-2 text-stone-600">配方为 {recipe.servings} 人份，保留原始计量单位。</p><ul className="mt-5 grid gap-3 sm:grid-cols-2">{detail.ingredients.map((item) => <li key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex items-baseline justify-between gap-3"><span className="font-semibold">{item.name}{item.optional && <span className="ml-2 text-xs font-normal text-emerald-700">可选</span>}</span><span className="shrink-0 text-stone-700">{item.amount}</span></div>{item.note && <p className="mt-2 text-sm leading-6 text-stone-500">备注：{item.note}</p>}</li>)}</ul></section>

          <section className="mt-12" aria-labelledby="steps-title"><p className="text-sm font-semibold text-emerald-700">DO &amp; UNDERSTAND</p><h2 id="steps-title" className="mt-2 text-3xl font-bold">步骤与为什么</h2><ol className="mt-6 space-y-5">{detail.steps.map((step) => <li key={step.order} className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-800 px-3 py-1 text-sm font-bold text-white">步骤 {step.order}</span>{step.heat && <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-900">{step.heat}</span>}{step.duration && <span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">{step.duration}</span>}</div><p className="mt-5 text-lg font-semibold leading-8 text-stone-900">{step.instruction}</p><div className="mt-5 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-4"><h3 className="font-bold text-amber-950">为什么这样做？</h3><p className="mt-2 leading-7 text-amber-950">{step.why}</p></div></li>)}</ol></section>

          <section className="mt-12 rounded-3xl bg-emerald-950 p-6 text-white sm:p-8" aria-labelledby="principles-title"><p className="text-sm font-semibold tracking-[.15em] text-emerald-200">COOKING PRINCIPLES</p><h2 id="principles-title" className="mt-2 text-3xl font-bold">这道菜的关键原理</h2><ul className="mt-6 space-y-3">{recipe.principles.map((principle) => <li key={principle} className="flex gap-3 leading-7"><span aria-hidden="true" className="text-amber-300">◆</span><span>{principle}</span></li>)}</ul></section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start" aria-label="菜谱摘要">
          <InfoPanel title="基础信息"><DefinitionList items={[["份数", `${recipe.servings} 人份`], ["难度", getDifficultyLabel(recipe.cooking.difficulty)], ["技法", recipe.cooking.method], ["菜系", recipe.cuisine], ["类别", recipe.category]]} /></InfoPanel>
          <InfoPanel title="时间"><DefinitionList items={[["准备", detail.times.prep], ["烹饪", detail.times.cook], ["总计", detail.times.total]]} /></InfoPanel>
          <InfoPanel title="每份营养估算"><DefinitionList items={detail.nutrition.map((item) => [item.label, item.value])} /></InfoPanel>
          <InfoPanel title="关注指标"><DefinitionList items={detail.limits.map((item) => [item.label, `${item.value} · ${item.scope}`])} /></InfoPanel>
          <InfoPanel title="预计成本"><DefinitionList items={[["整道", detail.cost.whole], ["每份", detail.cost.perServing]]} /></InfoPanel>
          <InfoPanel title="所需厨具"><ul className="flex flex-wrap gap-2">{detail.tools.map((tool) => <li key={tool} className="rounded-full bg-stone-100 px-3 py-2 text-sm">{tool}</li>)}</ul></InfoPanel>
          {detail.warnings.length > 0 && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-labelledby="estimate-warning"><h2 id="estimate-warning" className="font-bold text-amber-950">部分估算不完整</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">{detail.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>}
        </aside>
      </div>
      <footer className="border-t border-stone-200 px-5 py-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4"><p className="max-w-2xl text-sm leading-6 text-stone-500">营养、价格与时间均为 demo 估算，实际结果受食材品牌、可食部和烹饪损耗影响。</p><Link className="min-h-11 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/recipes">浏览全部菜谱</Link></div></footer>
    </main>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="mb-4 text-lg font-bold">{title}</h2>{children}</section>;
}

function DefinitionList({ items }: { items: string[][] }) {
  return <dl className="space-y-3">{items.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2 last:border-0 last:pb-0"><dt className="text-sm text-stone-500">{label}</dt><dd className="text-right text-sm font-semibold text-stone-800">{value}</dd></div>)}</dl>;
}
