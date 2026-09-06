import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedStoryById, getStoryExperienceContext } from "@/data/published-stories";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";
import { getPrimaryCulinaryItemForStory } from "@/lib/story-experience";

export default async function LegacyStoryDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const story = getPublishedStoryById((await params).slug);
  if (!story) notFound();
  const item = getPrimaryCulinaryItemForStory(story, getStoryExperienceContext("zh-CN").items);
  if (!item) notFound();
  const query = toURLSearchParams(await searchParams);
  permanentRedirect(`${getLocalizedPath("zh-CN", `/recipes/${item.slug}`, query)}#story-${story.id}`);
}
