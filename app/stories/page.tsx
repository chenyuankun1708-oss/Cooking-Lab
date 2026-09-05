import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { getPublishedStoryPreviews } from "@/data/published-stories";

export const metadata: Metadata = {
  title: "料理背后的故事",
  description: "从一道菜、一碗汤和一杯饮品，走进被记录的地方、人物与制作知识。",
  alternates: { canonical: "/stories" },
};

export default function StoryCatalogPage() {
  const stories = getPublishedStoryPreviews();
  const [featured, ...remaining] = stories;

  return (
    <main id="main-content">
      <SiteHeader active="stories" />
      <header className="border-b border-stone-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#a64631]">料理故事</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-bold leading-tight text-stone-950 sm:text-6xl">
            从一口风味，走进它来自的地方与时间
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
            这里不只讲“谁发明了它”。有些线索来自档案与机构记录，有些则必须把争议和未知保留下来。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="featured-story-title">
        <p id="featured-story-title" className="mb-4 text-sm font-semibold text-[#a64631]">从这篇开始</p>
        {featured ? <StoryCard featured story={featured} /> : null}
      </section>

      {remaining.length ? (
        <section className="border-t border-stone-200 bg-[#f2f0e8] py-14 sm:py-20" aria-labelledby="more-stories-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-[#a64631]">继续阅读</p>
            <h2 id="more-stories-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">顺着食物的线索慢慢走</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {remaining.map((story) => <StoryCard key={story.id} story={story} />)}
            </div>
          </div>
        </section>
      ) : null}
      <SiteFooter />
    </main>
  );
}
