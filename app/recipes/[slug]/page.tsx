import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BetaNote } from "@/components/beta-note";
import { RecipeImage } from "@/components/recipe-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { recipeImages } from "@/data/recipe-images";
import { recipes } from "@/data/recipes";
import { getDifficultyLabel } from "@/lib/display-labels";
import { buildRecipeDetailDisplay } from "@/lib/recipe-detail-display";
import { buildRecipeDetail, getRecipeBySlug } from "@/lib/recipe-detail";
import { getRecipeHeroImage, getRecipeImageFallback } from "@/lib/recipe-images";
import { SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return recipes.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return { title: "菜谱未找到" };
  return {
    title: `${recipe.name} 做法与原理`,
    description: `${recipe.name} 的步骤、料理原理、时间、成本与每份营养估算，来自 ${SITE_NAME} Public Beta。`,
  };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  const detail = buildRecipeDetailDisplay(buildRecipeDetail(recipe));
  const image = getRecipeHeroImage(recipe, recipeImages);
  const fallback = getRecipeImageFallback(recipe);
  const calories = detail.nutrition.find((item) => item.label === "热量")?.value ?? "估算不完整";
  const protein = detail.nutrition.find((item) => item.label === "蛋白质")?.value ?? "估算不完整";
  const taxonomyLine = [
    detail.taxonomy.origin,
    detail.taxonomy.subCuisine ?? detail.taxonomy.cuisine,
    detail.taxonomy.dishType,
    detail.taxonomy.techniques.join("、"),
  ].filter(Boolean).join(" · ");
  const hasCulture = Boolean(
    detail.culture?.summary ||
    detail.culture?.originNote ||
    detail.culture?.traditionalContext ||
    detail.culture?.modernContext,
  );

  return (
    <main id="main-content">
      <SiteHeader active="recipes" />

      <article>
        <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10">
          <nav aria-label="面包屑导航" className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <Link className="focus-ring font-semibold text-[#235849] hover:underline" href="/">首页</Link>
            <span aria-hidden="true">/</span>
            <Link className="focus-ring font-semibold text-[#235849] hover:underline" href="/recipes">料理</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{recipe.name}</span>
          </nav>
          <div className="mt-6">
            <RecipeImage image={image} fallbackInitial={fallback.initial} fallbackLabel={fallback.label} variant="hero" preload />
          </div>
        </div>

        <header className="mx-auto max-w-5xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-10">
          <p className="text-sm font-semibold text-[#a64631]">{taxonomyLine}</p>
          <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">
            {recipe.name}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-stone-600 sm:text-lg">{recipe.description}</p>
          <dl className="mt-8 grid grid-cols-2 border-y border-stone-300 text-left sm:grid-cols-4">
            <KeyFact label="总时间" value={detail.times.total} />
            <KeyFact label="份量" value={`${recipe.servings} 人份`} />
            <KeyFact label="热量 / 份" value={calories} />
            <KeyFact label="蛋白质 / 份" value={protein} />
          </dl>
          <p className="mt-3 text-xs leading-5 text-stone-500">营养、时间与价格均为演示估算，实际结果会因食材和设备而变化。</p>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
          <div className="grid gap-12 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
            <section aria-labelledby="ingredients-title">
              <p className="text-sm font-semibold text-[#a64631]">准备</p>
              <h2 id="ingredients-title" className="mt-2 text-3xl font-bold text-stone-950">食材</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{recipe.servings} 人份，保留数据中的原始计量单位。</p>
              <ul className="mt-6 border-t border-stone-300">
                {detail.ingredients.map((item) => (
                  <li key={item.id} className="border-b border-stone-200 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold text-stone-900">
                        {item.name}
                        {item.optional ? <span className="ml-2 text-xs font-normal text-[#235849]">可选</span> : null}
                      </span>
                      <span className="shrink-0 text-sm text-stone-700">{item.amount}</span>
                    </div>
                    {item.note ? <p className="mt-2 text-sm leading-6 text-stone-500">{item.note}</p> : null}
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-stone-300 pt-6">
                <h3 className="font-bold text-stone-950">开始前</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <CompactFact label="准备" value={detail.times.prep} />
                  <CompactFact label="烹饪" value={detail.times.cook} />
                  <CompactFact label="难度" value={getDifficultyLabel(recipe.cooking.difficulty)} />
                </dl>
                <h3 className="mt-6 font-bold text-stone-950">厨具</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{detail.tools.join("、")}</p>
              </div>
            </section>

            <section aria-labelledby="steps-title">
              <p className="text-sm font-semibold text-[#a64631]">做与理解</p>
              <h2 id="steps-title" className="mt-2 text-3xl font-bold text-stone-950">步骤与为什么</h2>
              <ol className="mt-6 border-t border-stone-300">
                {detail.steps.map((step) => (
                  <li key={step.order} className="grid gap-4 border-b border-stone-300 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#235849] text-sm font-bold text-white" aria-hidden="true">
                      {step.order}
                    </span>
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                        {step.heat ? <span>{step.heat}</span> : null}
                        {step.duration ? <span>· {step.duration}</span> : null}
                      </div>
                      <p className="mt-2 text-lg font-semibold leading-8 text-stone-950">{step.instruction}</p>
                      <div className="mt-4 border-l-2 border-[#e5bd53] bg-[#fff9e8] px-4 py-3">
                        <h3 className="text-sm font-bold text-stone-900">为什么这样做？</h3>
                        <p className="mt-1 leading-7 text-stone-700">{step.why}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <section className="bg-[#173f35] py-12 text-white sm:py-16" aria-labelledby="principles-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-[#f4d98b]">关键原理</p>
            <div className="mt-2 grid gap-7 lg:grid-cols-[0.7fr_1.3fr]">
              <h2 id="principles-title" className="text-3xl font-bold leading-tight sm:text-5xl">把这道菜做好的关键</h2>
              <ul className="border-t border-white/30">
                {recipe.principles.map((principle, index) => (
                  <li key={principle} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-white/30 py-4 leading-7">
                    <span className="font-bold text-[#f4d98b]" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="details-title">
          <p className="text-sm font-semibold text-[#a64631]">作为参考</p>
          <h2 id="details-title" className="mt-2 text-3xl font-bold text-stone-950">营养、用量与成本</h2>
          <p className="mt-3 max-w-2xl leading-7 text-stone-600">这些数字用于比较和决策，不构成医学或个体化饮食建议。</p>

          <div className="mt-8 grid border-y border-stone-300 md:grid-cols-3 md:divide-x md:divide-stone-300">
            <SecondarySection title="每份营养估算">
              <DefinitionList items={detail.nutrition} />
            </SecondarySection>
            <SecondarySection title="关注用量">
              <DefinitionList items={detail.limits.map((item) => ({ label: `${item.label}（${item.scope}）`, value: item.value }))} />
            </SecondarySection>
            <SecondarySection title="预计成本">
              <DefinitionList items={[
                { label: "整道", value: detail.cost.whole },
                { label: "每份", value: detail.cost.perServing },
              ]} />
            </SecondarySection>
          </div>

          {detail.warnings.length ? (
            <section className="mt-8 border-l-4 border-[#e5bd53] bg-[#fff9e8] p-5" aria-labelledby="estimate-warning">
              <h2 id="estimate-warning" className="font-bold text-stone-950">部分估算不完整</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone-700">
                {detail.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </section>
          ) : null}
        </section>

        {hasCulture ? (
          <section className="border-t border-stone-200 bg-white py-14 sm:py-20" aria-labelledby="story-title">
            <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.55fr_1fr]">
              <div>
                <p className="text-sm font-semibold text-[#a64631]">料理语境</p>
                <h2 id="story-title" className="mt-2 text-3xl font-bold text-stone-950">这道菜</h2>
              </div>
              <div className="space-y-4 leading-7 text-stone-700">
                {detail.culture?.summary ? <p>{detail.culture.summary}</p> : null}
                {detail.culture?.originNote ? <p><span className="font-semibold text-stone-950">来源说明：</span>{detail.culture.originNote}</p> : null}
                {detail.culture?.traditionalContext ? <p><span className="font-semibold text-stone-950">传统语境：</span>{detail.culture.traditionalContext}</p> : null}
                {detail.culture?.modernContext ? <p><span className="font-semibold text-stone-950">现代语境：</span>{detail.culture.modernContext}</p> : null}
                {detail.culture?.sources.length ? (
                  <div className="border-t border-stone-200 pt-4 text-sm text-stone-500">
                    <p className="font-semibold text-stone-700">参考来源</p>
                    <ul className="mt-2 space-y-1">
                      {detail.culture.sources.map((source) => (
                        <li key={source.title}>
                          {source.url ? (
                            <a className="focus-ring text-[#235849] hover:underline" href={source.url} rel="noreferrer" target="_blank">
                              {source.title}
                            </a>
                          ) : source.title}
                          {source.publisher ? <span> · {source.publisher}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <BetaNote title="这份菜谱的估算说明" />
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}

function KeyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-stone-200 px-3 py-4 odd:border-r sm:border-b-0 sm:border-r sm:last:border-r-0 sm:odd:border-r">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-stone-900 sm:text-base">{value}</dd>
    </div>
  );
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function SecondarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-6 md:px-6 md:first:pl-0 md:last:pr-0">
      <h3 className="font-bold text-stone-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DefinitionList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="space-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4">
          <dt className="text-stone-500">{item.label}</dt>
          <dd className="text-right font-semibold text-stone-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
