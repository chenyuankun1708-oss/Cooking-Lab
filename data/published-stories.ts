import { storyEntityLabels, storyTypeLabels } from "./culinary/story-context";
import { culinaryEvidence } from "./culinary/evidence";
import { culinaryImages } from "./culinary/images";
import { culinarySources } from "./culinary/sources";
import { culinaryStories } from "./culinary/stories";
import { getPublishedCulinaryItems } from "./published-culinary-items";
import { getPublishedRecipes } from "./published-recipes";
import { recipeImages } from "./recipe-images";
import { buildStoryPageModel, buildStoryPreview, type StoryExperienceContext } from "@/lib/story-experience";
import { assertPublishedStoriesEligible, getPubliclyVisibleStories } from "@/lib/story-publishing";
import type { Story } from "@/types/culinary";
import type { SupportedLocale } from "@/types/localization";

const items = getPublishedCulinaryItems();
const publishingContext = { items, evidence: culinaryEvidence, sources: culinarySources };
assertPublishedStoriesEligible(culinaryStories, publishingContext);

const publishedStories = Object.freeze(getPubliclyVisibleStories(culinaryStories, publishingContext));
const storyById = new Map(publishedStories.map((story) => [story.id, story]));
const experienceContext: StoryExperienceContext = {
  items,
  stories: publishedStories,
  evidence: culinaryEvidence,
  sources: culinarySources,
  images: [...recipeImages, ...culinaryImages],
  recipeItemIds: new Set(getPublishedRecipes().map((recipe) => recipe.id)),
  storyTypeLabels,
  relatedEntityLabels: storyEntityLabels,
};

export function getPublishedStories(): readonly Story[] {
  return publishedStories;
}

export function getPublishedStoryById(id: string): Story | undefined {
  return storyById.get(id);
}

export function getPublishedStoryStaticParams(): Array<{ slug: string }> {
  return publishedStories.map((story) => ({ slug: story.id }));
}

export function getPublishedStoryPreviews() {
  return publishedStories.map((story) => buildStoryPreview(story, experienceContext));
}

export function getLocalizedPublishedStoryPreviews(locale: SupportedLocale) {
  const context = { ...experienceContext, locale };
  return publishedStories.map((story) => buildStoryPreview(story, context));
}

export function getPublishedStoryPageModel(id: string, locale: SupportedLocale = "zh-CN") {
  const story = storyById.get(id);
  return story ? buildStoryPageModel(story, { ...experienceContext, locale }) : undefined;
}

export function getStoryExperienceContext(locale: SupportedLocale = "zh-CN"): StoryExperienceContext {
  return { ...experienceContext, locale };
}
