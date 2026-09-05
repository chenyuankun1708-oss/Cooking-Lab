import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeHero } from "@/components/home-hero";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeDiscovery } from "@/components/recipe-discovery";
import { SiteFooter } from "@/components/site-footer";
import { StoryCard } from "@/components/story-card";
import { homepageStoryIds } from "@/data/culinary/story-context";
import { homeHeroEditorialItems, homepageFeaturedRecipeSlugs } from "@/data/homepage";
import { ingredients } from "@/data/ingredients";
import { getPublishedRecipes, getPublishedRecipesBySlugs } from "@/data/published-recipes";
import { getLocalizedPublishedStoryPreviews } from "@/data/published-stories";
import { getLocalizedRecipes } from "@/data/localization/public-recipes";
import { recipeImages } from "@/data/recipe-images";
import { buildHomeHeroItems } from "@/lib/homepage-hero";
import { recommendationEngine } from "@/lib/recommendation";
import { listRecipeCuisineOptions, listRecipeTechniqueOptions } from "@/lib/taxonomy";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import { buildLocaleAlternates } from "@/lib/locale-metadata";
import { getMessages } from "@/lib/messages";
import { SITE_DESCRIPTIONS } from "@/lib/site";
import type { SupportedLocale } from "@/types/localization";

const featuredCuisineIds = ["chinese", "japanese", "korean", "thai", "vietnamese", "italian", "french", "fusion"] as const;
const featuredTechniqueIds = ["pan-fry", "stir-fry", "steam", "stew", "roast", "blanch", "boil", "cold-mix"] as const;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = getLocale((await params).locale);
  const messages = getMessages(locale);
  const publishedRecipes = getLocalizedRecipes(getPublishedRecipes(), locale);
  const heroItems = buildHomeHeroItems(homeHeroEditorialItems, publishedRecipes, recipeImages, locale);
  const featuredResults = getLocalizedRecipes(getPublishedRecipesBySlugs(homepageFeaturedRecipeSlugs), locale)
    .map((recipe) => recommendationEngine.rank([recipe], {})[0]);
  const allCuisineOptions = listRecipeCuisineOptions(publishedRecipes, locale);
  const allTechniqueOptions = listRecipeTechniqueOptions(publishedRecipes, locale);
  const cuisineOptions = featuredCuisineIds.flatMap((id) => allCuisineOptions.find((option) => option.id === id) ?? []);
  const techniqueOptions = featuredTechniqueIds.flatMap((id) => allTechniqueOptions.find((option) => option.id === id) ?? []);
  const storyPreviews = getLocalizedPublishedStoryPreviews(locale);
  const featuredStories = homepageStoryIds.flatMap((id) => storyPreviews.find((story) => story.id === id) ?? []);

  return (
    <main id="main-content">
      <HomeHero items={heroItems} locale={locale} />

      <section className="bg-[var(--surface-paper)] py-12 sm:py-16" aria-labelledby="tonight-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#a64631]">{messages.home.inspirationEyebrow}</p>
              <h2 id="tonight-title" className="mt-2 text-3xl font-bold leading-tight text-stone-950 sm:text-5xl">
                {messages.home.inspirationTitle}
              </h2>
              <p className="mt-4 leading-7 text-stone-600">
                {messages.home.inspirationBody}
              </p>
            </div>
            <Link className="focus-ring min-h-11 py-3 text-sm font-bold text-[#235849] hover:underline" href={getLocalizedPath(locale, "/recipes")}>
              {messages.home.inspirationCta}
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredResults.map((result) => <RecipeCard key={result.recipe.id} result={result} variant="catalog" locale={locale} />)}
          </div>
        </div>
      </section>

      <RecipeDiscovery recipes={publishedRecipes} ingredients={ingredients} locale={locale} />

      <section className="border-y border-stone-200 bg-[var(--surface-herb)] py-12 sm:py-16" aria-labelledby="world-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-[#a64631]">{messages.home.worldEyebrow}</p>
              <h2 id="world-title" className="mt-2 text-3xl font-bold leading-tight text-stone-950 sm:text-5xl">
                {messages.home.worldTitle}
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-stone-600">
                {messages.home.worldBody}
              </p>
            </div>
            <ul className="grid border-t border-stone-300 sm:grid-cols-2">
              {cuisineOptions.map((cuisine) => (
                <li key={cuisine.id} className="border-b border-stone-300 sm:odd:pr-5 sm:even:pl-5">
                  <Link
                    className="focus-ring flex min-h-20 items-center justify-between gap-4 py-4 text-lg font-bold text-stone-900 hover:text-[#a64631]"
                    href={getLocalizedPath(locale, "/recipes", `cuisine=${cuisine.id}`)}
                  >
                    <span>{cuisine.label}</span>
                    <span className="text-sm font-medium text-stone-500">{messages.home.explore}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-story)] py-12 sm:py-16" aria-labelledby="home-stories-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#a64631]">{messages.home.storiesEyebrow}</p>
              <h2 id="home-stories-title" className="mt-2 text-3xl font-bold leading-tight text-stone-950 sm:text-5xl">
                {messages.home.storiesTitle}
              </h2>
              <p className="mt-4 leading-7 text-stone-600">
                {messages.home.storiesBody}
              </p>
            </div>
            <Link className="focus-ring min-h-11 py-3 text-sm font-bold text-[#235849] hover:underline" href={getLocalizedPath(locale, "/stories")}>
              {messages.home.storiesCta}
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredStories.map((story) => <StoryCard key={story.id} story={story} locale={locale} />)}
          </div>
        </div>
      </section>

      <section id="techniques" className="border-y border-stone-200 bg-[#173f35] py-12 text-white sm:py-16" aria-labelledby="technique-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#f4d98b]">{messages.home.techniqueEyebrow}</p>
          <div className="mt-2 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 id="technique-title" className="text-3xl font-bold leading-tight sm:text-5xl">
                {messages.home.techniqueTitle}
              </h2>
            </div>
            <p className="max-w-2xl leading-7 text-white/76">
              {messages.home.techniqueBody}
            </p>
          </div>
          <div className="mt-9 grid grid-cols-2 border-l border-t border-white/25 sm:grid-cols-4">
            {techniqueOptions.map((technique) => (
              <Link
                key={technique.id}
                className="focus-ring min-h-24 border-b border-r border-white/25 p-4 hover:bg-white/10 sm:p-5"
                href={getLocalizedPath(locale, "/recipes", `technique=${technique.id}`)}
              >
                <span className="block text-xl font-bold">{technique.label}</span>
                <span className="mt-2 block text-sm text-white/65">{messages.home.techniqueCta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = getLocale((await params).locale);
  return {
    title: getMessages(locale).home.title,
    description: SITE_DESCRIPTIONS[locale],
    alternates: buildLocaleAlternates(locale, "/"),
  };
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}
