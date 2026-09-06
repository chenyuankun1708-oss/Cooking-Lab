import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedStoryById, getPublishedStoryStaticParams, getStoryExperienceContext } from "@/data/published-stories";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import { getPrimaryCulinaryItemForStory } from "@/lib/story-experience";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export const dynamicParams = false;

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) => getPublishedStoryStaticParams().map(({ slug }) => ({ locale, slug })));
}

export default async function LegacyLocalizedStoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  const story = getPublishedStoryById(slug);
  if (!story) notFound();
  const item = getPrimaryCulinaryItemForStory(story, getStoryExperienceContext(locale).items);
  if (!item) notFound();
  permanentRedirect(`${getLocalizedPath(locale, `/recipes/${item.slug}`)}#story-${story.id}`);
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}
