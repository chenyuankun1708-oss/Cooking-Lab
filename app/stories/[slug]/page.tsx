import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CulinarySummaryCard } from "@/components/culinary-summary-card";
import { RecipeImage } from "@/components/recipe-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { getPublishedStoryPageModel, getPublishedStoryStaticParams } from "@/data/published-stories";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedStoryStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = getPublishedStoryPageModel(slug);
  if (!story) return { title: "故事未找到" };
  return {
    title: story.title,
    description: story.dek,
    alternates: { canonical: story.href },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = getPublishedStoryPageModel(slug);
  if (!story) notFound();

  return (
    <main id="main-content">
      <SiteHeader active="stories" />
      <article>
        <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10">
          <nav aria-label="面包屑导航" className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href="/">首页</Link>
            <span aria-hidden="true">/</span>
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href="/stories">故事</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{story.title}</span>
          </nav>
          <div className="mt-6">
            <RecipeImage image={story.image} fallbackInitial={story.fallbackInitial} fallbackLabel={story.relatedItemName} variant="hero" preload />
          </div>
        </div>

        <header className="mx-auto max-w-4xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-[#a64631]">
            <span>{story.typeLabel}</span>
            <span className="text-stone-500">{story.relatedItemName}</span>
            <span className="text-stone-500">{story.readingTimeLabel}</span>
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">{story.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600 sm:text-xl">{story.dek}</p>
          {story.contextChips.length ? (
            <ul aria-label="故事线索" className="mt-6 flex flex-wrap gap-2">
              {story.contextChips.map((chip) => (
                <li className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700" key={`${chip.type}:${chip.label}`}>
                  {chip.label}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div className="mx-auto max-w-3xl px-4 pb-14 sm:px-6 sm:pb-20">
          {story.sections.map((section) => (
            <section className="border-t border-stone-300 py-8 first:border-t-0 first:pt-0 sm:py-10" key={section.heading}>
              <h2 className="text-2xl font-bold leading-tight text-stone-950 sm:text-3xl">{section.heading}</h2>
              <div className="mt-5 space-y-5 text-base leading-8 text-stone-700 sm:text-lg sm:leading-9">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}

          <aside className="border-l-4 border-[#e5bd53] bg-[#fff9e8] px-5 py-5 sm:px-6" aria-labelledby="evidence-context-title">
            <h2 id="evidence-context-title" className="font-bold text-stone-950">怎样理解这段故事</h2>
            <p className="mt-2 leading-7 text-stone-700">{story.evidenceContext}</p>
          </aside>
        </div>

        <section className="border-y border-stone-200 bg-white py-14 sm:py-20" aria-labelledby="story-food-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-[#a64631]">故事里的料理</p>
            <h2 id="story-food-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">回到杯盘之间</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {story.culinaryItems.map((item) => <CulinarySummaryCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>

        {story.relatedItems.length ? (
          <section className="bg-[#f2f0e8] py-14 sm:py-20" aria-labelledby="related-food-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">顺着地方、菜系与做法</p>
              <h2 id="related-food-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">还可以继续看</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {story.relatedItems.map((item) => <CulinarySummaryCard item={item} key={item.id} />)}
              </div>
            </div>
          </section>
        ) : null}

        {story.relatedStories.length ? (
          <section className="border-t border-stone-200 bg-white py-14 sm:py-20" aria-labelledby="related-stories-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">相关阅读</p>
              <h2 id="related-stories-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">同一片地方的另一条线索</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {story.relatedStories.map((candidate) => <StoryCard key={candidate.id} story={candidate} />)}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="story-sources-title">
          <details className="border-y border-stone-300 py-4">
            <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-950">
              <span id="story-sources-title">资料来源</span>
              <span className="text-sm font-semibold text-[#235849]">{story.sources.length} 项</span>
            </summary>
            <ol className="space-y-5 pb-2 pt-5">
              {story.sources.map((source) => (
                <li className="border-l-2 border-stone-300 pl-4" key={`${source.title}:${source.byline}`}>
                  {source.href ? (
                    <a
                      aria-label={`${source.title}（在新窗口打开来源）`}
                      className="focus-ring inline-flex min-h-11 items-center font-bold text-[#235849] hover:underline"
                      href={source.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                  ) : <p className="font-bold text-stone-950">{source.title}</p>}
                  <p className="mt-1 text-sm leading-6 text-stone-600">{source.byline}</p>
                  {source.locatorLabel ? <p className="mt-1 text-sm leading-6 text-stone-500">{source.locatorLabel}</p> : null}
                </li>
              ))}
            </ol>
          </details>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
