import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CulinarySummaryCard } from "@/components/culinary-summary-card";
import { RecipeImage } from "@/components/recipe-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { getPublishedStoryPageModel, getPublishedStoryStaticParams } from "@/data/published-stories";
import { hasCompleteStoryTranslation } from "@/data/localization/public-stories";
import { getPublishedStoryById } from "@/data/published-stories";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import { getMessages } from "@/lib/messages";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export const dynamicParams = false;

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) => getPublishedStoryStaticParams().map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const story = getPublishedStoryPageModel(slug, locale);
  if (!story) return { title: locale === "zh-CN" ? "故事未找到" : "Story not found" };
  const path = `/stories/${slug}`;
  return {
    title: story.title,
    description: story.dek,
    alternates: buildLocaleAlternates(locale, path),
  };
}

export default async function StoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const source = getPublishedStoryById(slug);
  if (!source || !hasCompleteStoryTranslation(source.id, locale, source.claims.map((claim) => claim.id))) notFound();
  const story = getPublishedStoryPageModel(slug, locale);
  if (!story) notFound();
  const messages = getMessages(locale);
  const copy = storyPageCopy[locale];

  return (
    <main id="main-content">
      <SiteHeader active="stories" locale={locale} currentPath={`/${locale}/stories/${slug}`} />
      <article className="bg-[var(--surface-paper)]">
        <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10">
          <nav aria-label={copy.breadcrumb} className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={getLocalizedPath(locale)}>{messages.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={getLocalizedPath(locale, "/stories")}>{messages.nav.stories}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{story.title}</span>
          </nav>
          <div className="mt-6">
            <RecipeImage image={story.image} fallbackInitial={story.fallbackInitial} fallbackLabel={story.relatedItemName} alt={story.relatedItemName} locale={locale} sourceLabel={messages.common.imageSource} variant="hero" preload />
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
            <ul aria-label={copy.contextLabels} className="mt-6 flex flex-wrap gap-2">
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

          <aside className="border-l-4 border-[#d39a2f] bg-[var(--surface-story)] px-5 py-5 sm:px-6" aria-labelledby="evidence-context-title">
            <h2 id="evidence-context-title" className="font-bold text-stone-950">{messages.stories.context}</h2>
            <p className="mt-2 leading-7 text-stone-700">{story.evidenceContext}</p>
          </aside>
        </div>

        <section className="border-y border-stone-200 bg-[var(--surface-canvas)] py-12 sm:py-16" aria-labelledby="story-food-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-[#a64631]">{messages.stories.relatedFood}</p>
            <h2 id="story-food-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{copy.backToTable}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {story.culinaryItems.map((item) => <CulinarySummaryCard item={item} key={item.id} locale={locale} />)}
            </div>
          </div>
        </section>

        {story.relatedItems.length ? (
          <section className="bg-[var(--surface-story)] py-12 sm:py-16" aria-labelledby="related-food-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">{copy.relatedFoodEyebrow}</p>
              <h2 id="related-food-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{copy.relatedFoodTitle}</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {story.relatedItems.map((item) => <CulinarySummaryCard item={item} key={item.id} locale={locale} />)}
              </div>
            </div>
          </section>
        ) : null}

        {story.relatedStories.length ? (
          <section className="border-t border-stone-200 bg-[var(--surface-paper)] py-12 sm:py-16" aria-labelledby="related-stories-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">{messages.stories.related}</p>
              <h2 id="related-stories-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{copy.relatedStoriesTitle}</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {story.relatedStories.map((candidate) => <StoryCard key={candidate.id} story={candidate} locale={locale} />)}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="story-sources-title">
          <details className="border-y border-stone-300 py-4">
            <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-950">
              <span id="story-sources-title">{messages.stories.sources}</span>
              <span className="text-sm font-semibold text-[#235849]">{copy.sourceCount(story.sources.length)}</span>
            </summary>
            <ol className="space-y-5 pb-2 pt-5">
              {story.sources.map((source) => (
                <li className="border-l-2 border-stone-300 pl-4" key={`${source.title}:${source.byline}`}>
                  {source.href ? (
                    <a
                      aria-label={copy.openSource(source.title)}
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
      <SiteFooter locale={locale} />
    </main>
  );
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}

const storyPageCopy = {
  "zh-CN": { breadcrumb: "面包屑导航", contextLabels: "故事线索", backToTable: "回到杯盘之间", relatedFoodEyebrow: "顺着地方、菜系与做法", relatedFoodTitle: "还可以继续看", relatedStoriesTitle: "同一片地方的另一条线索", sourceCount: (n: number) => `${n} 项`, openSource: (title: string) => `${title}（在新窗口打开来源）` },
  en: { breadcrumb: "Breadcrumb", contextLabels: "Story context", backToTable: "Back to the table", relatedFoodEyebrow: "Through place, cuisine, and technique", relatedFoodTitle: "Explore another item", relatedStoriesTitle: "Another thread through related food", sourceCount: (n: number) => `${n} sources`, openSource: (title: string) => `${title} (opens source in a new window)` },
} as const;
