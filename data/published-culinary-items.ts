import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { adaptRecipeToCulinaryItem } from "@/lib/culinary-item-adapter";
import {
  assertPublishedCulinaryItemsEligible,
  getPubliclyVisibleCulinaryItems,
} from "@/lib/culinary-library-validation";
import type { CulinaryPublishingContext } from "@/lib/culinary-publishing";
import type { CulinaryItem, CulinaryItemType } from "@/types/culinary";
import { culinaryEvidence } from "./culinary/evidence";
import { culinaryImages } from "./culinary/images";
import { nativeCulinaryItems } from "./culinary/items";
import { culinarySources } from "./culinary/sources";
import { culinaryStories } from "./culinary/stories";
import { ingredients } from "./ingredients";
import { getPublishedRecipes } from "./published-recipes";
import { recipeImages } from "./recipe-images";

const allImages = [...recipeImages, ...culinaryImages];
const candidates: CulinaryItem[] = [
  ...getPublishedRecipes().map(adaptRecipeToCulinaryItem),
  ...nativeCulinaryItems,
];
const publishingContext: CulinaryPublishingContext = {
  ingredients,
  images: allImages,
  localAssetExists: (src) => existsSync(resolve(process.cwd(), "public", src.replace(/^\//, ""))),
  stories: culinaryStories,
  sources: culinarySources,
  evidence: culinaryEvidence,
};

assertPublishedCulinaryItemsEligible(candidates, publishingContext);

const publishedItems = Object.freeze(getPubliclyVisibleCulinaryItems(candidates, publishingContext));
const publishedItemBySlug = new Map(publishedItems.map((item) => [item.slug, item]));

export function getPublishedCulinaryItems(): readonly CulinaryItem[] {
  return publishedItems;
}

export function getPublishedCulinaryItemBySlug(slug: string): CulinaryItem | undefined {
  return publishedItemBySlug.get(slug);
}

export function listPublishedCulinaryItemsByType(itemType: CulinaryItemType): readonly CulinaryItem[] {
  return publishedItems.filter((item) => item.itemType === itemType);
}
