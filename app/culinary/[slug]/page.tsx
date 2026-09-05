import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeImage } from "@/components/recipe-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import {
  getPublishedNativeCulinaryItemBySlug,
  getPublishedNativeCulinaryItemStaticParams,
} from "@/data/published-culinary-items";
import { getStoryExperienceContext } from "@/data/published-stories";
import { ingredients } from "@/data/ingredients";
import { buildCulinaryDetailModel } from "@/lib/culinary-detail";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedNativeCulinaryItemStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getPublishedNativeCulinaryItemBySlug(slug);
  if (!item) return { title: "料理未找到" };
  const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext());
  return {
    title: detail.name,
    description: detail.description,
    alternates: { canonical: `/culinary/${detail.slug}` },
  };
}

export default async function CulinaryItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getPublishedNativeCulinaryItemBySlug(slug);
  if (!item) notFound();
  const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext());

  return (
    <main id="main-content">
      <SiteHeader active="recipes" />
      <article>
        <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10">
          <nav aria-label="面包屑导航" className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href="/">首页</Link>
            <span aria-hidden="true">/</span>
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href="/recipes">料理</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{detail.name}</span>
          </nav>
          <div className="mt-6">
            <RecipeImage image={detail.image} fallbackInitial={detail.fallbackInitial} fallbackLabel={detail.name} variant="hero" preload />
          </div>
        </div>

        <header className="mx-auto max-w-4xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-10">
          <p className="text-sm font-semibold text-[#a64631]">{[detail.itemTypeLabel, detail.placeLabel].filter(Boolean).join(" · ")}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">{detail.name}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-stone-600 sm:text-lg">{detail.description}</p>
          {detail.flavorLabel ? <p className="mt-4 font-semibold text-[#235849]">{detail.flavorLabel}</p> : null}
        </header>

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20" aria-labelledby="preparation-title">
          <div className="border-t border-stone-300 pt-8">
            <p className="text-sm font-semibold text-[#a64631]">准备方式</p>
            <h2 id="preparation-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{detail.preparation.label}</h2>
          </div>

          {detail.preparation.kind === "procedural" ? (
            <div className="mt-8 grid gap-12 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
              <div>
                <dl className="grid grid-cols-2 border-y border-stone-300 text-sm">
                  <div className="border-r border-stone-300 p-4">
                    <dt className="text-stone-500">总时间</dt>
                    <dd className="mt-1 font-bold text-stone-950">{detail.preparation.totalTimeLabel}</dd>
                  </div>
                  <div className="p-4">
                    <dt className="text-stone-500">产出</dt>
                    <dd className="mt-1 font-bold text-stone-950">{detail.preparation.yieldLabel}</dd>
                  </div>
                </dl>
                <h3 className="mt-8 text-xl font-bold text-stone-950">食材</h3>
                <ul className="mt-4 border-t border-stone-300">
                  {detail.preparation.inputs.map((input) => (
                    <li className="border-b border-stone-200 py-4" key={input.id}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-semibold text-stone-900">{input.name}{input.optional ? <span className="ml-2 text-xs font-normal text-[#235849]">可选</span> : null}</span>
                        <span className="shrink-0 text-sm text-stone-700">{input.amount}</span>
                      </div>
                      {input.note ? <p className="mt-2 text-sm leading-6 text-stone-500">{input.note}</p> : null}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-8 text-xl font-bold text-stone-950">用到的工具</h3>
                <p className="mt-3 leading-7 text-stone-600">{detail.preparation.tools.join("、")}</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-stone-950">怎样完成</h3>
                <ol className="mt-5 border-t border-stone-300">
                  {detail.preparation.steps.map((step) => (
                    <li className="grid gap-4 border-b border-stone-300 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6" key={step.order}>
                      <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#235849] text-sm font-bold text-white">{step.order}</span>
                      <div>
                        {step.durationLabel ? <p className="text-xs font-semibold text-stone-500">{step.durationLabel}</p> : null}
                        <p className="mt-2 text-lg font-semibold leading-8 text-stone-950">{step.instruction}</p>
                        {step.stateCue ? <p className="mt-3 leading-7 text-[#235849]">看到这样：{step.stateCue}</p> : null}
                        {step.rationale ? <p className="mt-3 border-l-2 border-[#e5bd53] pl-4 leading-7 text-stone-600">{step.rationale}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="mt-8 max-w-3xl border-y border-stone-300 py-7">
              <p className="text-lg leading-8 text-stone-700">{detail.preparation.guidance}</p>
              {detail.preparation.kind === "guidance" ? (
                <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  <div><dt className="text-stone-500">准备时间</dt><dd className="mt-1 font-semibold text-stone-900">{detail.preparation.estimatedTimeLabel}</dd></div>
                  <div><dt className="text-stone-500">用到的杯具</dt><dd className="mt-1 font-semibold text-stone-900">{detail.preparation.tools.join("、")}</dd></div>
                </dl>
              ) : null}
            </div>
          )}
        </section>

        {detail.stories.length ? (
          <section className="border-t border-stone-200 bg-[#f2f0e8] py-14 sm:py-20" aria-labelledby="item-stories-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">料理背后</p>
              <h2 id="item-stories-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">顺着它的故事继续读</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {detail.stories.map((story) => <StoryCard key={story.id} story={story} />)}
              </div>
            </div>
          </section>
        ) : null}
      </article>
      <SiteFooter />
    </main>
  );
}
