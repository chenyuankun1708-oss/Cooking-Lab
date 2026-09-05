import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { getLocalizedPublishedStoryPreviews } from "@/data/published-stories";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { isSupportedLocale } from "@/lib/localization";
import { getMessages } from "@/lib/messages";
import type { SupportedLocale } from "@/types/localization";

export default async function StoryCatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = getLocale((await params).locale);
  const messages = getMessages(locale);
  const copy = storyCatalogCopy[locale];
  const stories = getLocalizedPublishedStoryPreviews(locale);
  const [featured, ...remaining] = stories;

  return (
    <main id="main-content">
      <SiteHeader active="stories" locale={locale} currentPath={`/${locale}/stories`} />
      <header className="border-b border-stone-200 bg-[var(--surface-story)] py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#a64631]">{messages.stories.eyebrow}</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-bold leading-tight text-stone-950 sm:text-5xl">
            {messages.stories.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
            {messages.stories.intro}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12" aria-labelledby="featured-story-title">
        <p id="featured-story-title" className="mb-4 text-sm font-semibold text-[#a64631]">{copy.start}</p>
        {featured ? <StoryCard featured story={featured} locale={locale} /> : null}
      </section>

      {remaining.length ? (
        <section className="border-t border-stone-200 bg-[var(--surface-story)] py-12 sm:py-16" aria-labelledby="more-stories-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-[#a64631]">{copy.continue}</p>
            <h2 id="more-stories-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{copy.moreTitle}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {remaining.map((story) => <StoryCard key={story.id} story={story} locale={locale} />)}
            </div>
          </div>
        </section>
      ) : null}
      <SiteFooter locale={locale} />
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = getLocale((await params).locale);
  const messages = getMessages(locale);
  return {
    title: messages.stories.title,
    description: messages.stories.description,
    alternates: buildLocaleAlternates(locale, "/stories"),
  };
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}

const storyCatalogCopy = {
  "zh-CN": { start: "从这篇开始", continue: "继续阅读", moreTitle: "顺着食物的线索慢慢走" },
  en: { start: "Start here", continue: "Continue reading", moreTitle: "Follow the evidence through food" },
} as const;
