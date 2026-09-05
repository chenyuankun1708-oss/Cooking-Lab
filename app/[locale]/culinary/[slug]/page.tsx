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
import { hasCompleteNativeCulinaryTranslation } from "@/data/localization/public-culinary";
import { buildCulinaryDetailModel } from "@/lib/culinary-detail";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import { getMessages } from "@/lib/messages";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export const dynamicParams = false;

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) => getPublishedNativeCulinaryItemStaticParams().map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const item = getPublishedNativeCulinaryItemBySlug(slug);
  if (!item || !isTranslated(item, locale)) return { title: locale === "zh-CN" ? "料理未找到" : "Culinary item not found" };
  const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext(locale), locale);
  const path = `/culinary/${detail.slug}`;
  return {
    title: detail.name,
    description: detail.description,
    alternates: buildLocaleAlternates(locale, path),
  };
}

export default async function CulinaryItemPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const item = getPublishedNativeCulinaryItemBySlug(slug);
  if (!item || !isTranslated(item, locale)) notFound();
  const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext(locale), locale);
  const messages = getMessages(locale);
  const c = culinaryPageCopy[locale];
  const immersiveIntro = item.itemType === "alcoholic-drink";
  const introSurface = immersiveIntro
    ? "bg-[var(--surface-cocoa)]"
    : item.itemType === "tea" || item.itemType === "coffee"
      ? "bg-[var(--surface-herb)]"
      : "bg-[var(--surface-paper)]";

  return (
    <main id="main-content">
      <SiteHeader active="recipes" locale={locale} currentPath={`/${locale}/culinary/${detail.slug}`} />
      <article>
        <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10">
          <nav aria-label={c.breadcrumb} className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={getLocalizedPath(locale)}>{messages.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <Link className="focus-ring inline-flex min-h-11 items-center font-semibold text-[#235849] hover:underline" href={getLocalizedPath(locale, "/recipes")}>{messages.nav.recipes}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{detail.name}</span>
          </nav>
          <div className="mt-6">
            <RecipeImage image={detail.image} fallbackInitial={detail.fallbackInitial} fallbackLabel={detail.name} alt={detail.name} locale={locale} sourceLabel={messages.common.imageSource} variant="hero" preload />
          </div>
        </div>

        <header className={`${introSurface} mt-6 px-4 py-10 text-center sm:mt-8 sm:px-6 sm:py-14`}>
          <div className="mx-auto max-w-4xl">
            <p className={`text-sm font-semibold ${immersiveIntro ? "text-[#f4d98b]" : "text-[#a64631]"}`}>{[detail.itemTypeLabel, detail.placeLabel].filter(Boolean).join(" · ")}</p>
            <h1 className={`mt-3 text-4xl font-bold leading-tight sm:text-6xl ${immersiveIntro ? "text-white" : "text-stone-950"}`}>{detail.name}</h1>
            <p className={`mx-auto mt-5 max-w-3xl text-base leading-8 sm:text-lg ${immersiveIntro ? "text-white/78" : "text-stone-600"}`}>{detail.description}</p>
            {detail.flavorLabel ? <p className={`mt-4 font-semibold ${immersiveIntro ? "text-[#f4d98b]" : "text-[#235849]"}`}>{detail.flavorLabel}</p> : null}
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="preparation-title">
          <div className="border-t border-stone-300 pt-8">
            <p className="text-sm font-semibold text-[#a64631]">{c.preparation}</p>
            <h2 id="preparation-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{detail.preparation.label}</h2>
          </div>

          {detail.preparation.kind === "procedural" ? (
            <div className="mt-8 grid gap-12 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
              <div>
                <dl className="grid grid-cols-2 border-y border-stone-300 text-sm">
                  <div className="border-r border-stone-300 p-4">
                    <dt className="text-stone-500">{c.totalTime}</dt>
                    <dd className="mt-1 font-bold text-stone-950">{detail.preparation.totalTimeLabel}</dd>
                  </div>
                  <div className="p-4">
                    <dt className="text-stone-500">{c.yield}</dt>
                    <dd className="mt-1 font-bold text-stone-950">{detail.preparation.yieldLabel}</dd>
                  </div>
                </dl>
                <h3 className="mt-8 text-xl font-bold text-stone-950">{messages.detail.ingredients}</h3>
                <ul className="mt-4 border-t border-stone-300">
                  {detail.preparation.inputs.map((input) => (
                    <li className="border-b border-stone-200 py-4" key={input.id}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-semibold text-stone-900">{input.name}{input.optional ? <span className="ml-2 text-xs font-normal text-[#235849]">{messages.common.optional}</span> : null}</span>
                        <span className="shrink-0 text-sm text-stone-700">{input.amount}</span>
                      </div>
                      {input.note ? <p className="mt-2 text-sm leading-6 text-stone-500">{input.note}</p> : null}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-8 text-xl font-bold text-stone-950">{messages.detail.tools}</h3>
                <p className="mt-3 leading-7 text-stone-600">{detail.preparation.tools.join(locale === "zh-CN" ? "、" : ", ")}</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-stone-950">{c.method}</h3>
                <ol className="mt-5 border-t border-stone-300">
                  {detail.preparation.steps.map((step) => (
                    <li className="grid gap-4 border-b border-stone-300 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6" key={step.order}>
                      <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#235849] text-sm font-bold text-white">{step.order}</span>
                      <div>
                        {step.durationLabel ? <p className="text-xs font-semibold text-stone-500">{step.durationLabel}</p> : null}
                        <p className="mt-2 text-lg font-semibold leading-8 text-stone-950">{step.instruction}</p>
                        {step.stateCue ? <p className="mt-3 leading-7 text-[#235849]">{c.cue}: {step.stateCue}</p> : null}
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
                  <div><dt className="text-stone-500">{messages.detail.prep}</dt><dd className="mt-1 font-semibold text-stone-900">{detail.preparation.estimatedTimeLabel}</dd></div>
                  <div><dt className="text-stone-500">{c.serveware}</dt><dd className="mt-1 font-semibold text-stone-900">{detail.preparation.tools.join(locale === "zh-CN" ? "、" : ", ")}</dd></div>
                </dl>
              ) : null}
            </div>
          )}
        </section>

        {detail.stories.length ? (
          <section className="border-t border-stone-200 bg-[var(--surface-story)] py-12 sm:py-16" aria-labelledby="item-stories-title">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className="text-sm font-semibold text-[#a64631]">{c.behind}</p>
              <h2 id="item-stories-title" className="mt-2 text-3xl font-bold text-stone-950 sm:text-4xl">{c.storyTitle}</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {detail.stories.map((story) => <StoryCard key={story.id} story={story} locale={locale} />)}
              </div>
            </div>
          </section>
        ) : null}
      </article>
      <SiteFooter locale={locale} />
    </main>
  );
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}

function isTranslated(item: NonNullable<ReturnType<typeof getPublishedNativeCulinaryItemBySlug>>, locale: SupportedLocale): boolean {
  const preparation = item.preparation;
  const hasSteps = "steps" in preparation;
  return hasCompleteNativeCulinaryTranslation(
    item.id,
    locale,
    hasSteps ? preparation.steps.length : 0,
    !hasSteps,
    "inputs" in preparation ? preparation.inputs.filter((input) => input.note).map((input) => input.ingredientId) : [],
  );
}

const culinaryPageCopy = {
  "zh-CN": { breadcrumb: "面包屑导航", preparation: "准备方式", totalTime: "总时间", yield: "产出", method: "怎样完成", cue: "看到这样", serveware: "用到的杯具", behind: "料理背后", storyTitle: "顺着它的故事继续读" },
  en: { breadcrumb: "Breadcrumb", preparation: "Preparation", totalTime: "Total time", yield: "Yield", method: "How to make it", cue: "Look for", serveware: "Serve with", behind: "Behind the item", storyTitle: "Continue through its story" },
} as const;
