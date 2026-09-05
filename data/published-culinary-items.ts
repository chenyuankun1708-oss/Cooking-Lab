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
import { hasCompleteNativeCulinaryTranslation } from "./localization/public-culinary";
import { hasCompleteRecipeTranslation } from "./localization/public-recipes";
import type { SupportedLocale } from "@/types/localization";

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
const nativeItemIds = new Set(nativeCulinaryItems.map((item) => item.id));
const publishedRecipeById = new Map(getPublishedRecipes().map((recipe) => [recipe.id, recipe]));
const publishedNativeItems = Object.freeze(publishedItems.filter((item) => nativeItemIds.has(item.id)));
const publishedNativeItemBySlug = new Map(publishedNativeItems.map((item) => [item.slug, item]));

export function getPublishedCulinaryItems(): readonly CulinaryItem[] {
  return publishedItems;
}

export function getPublishedCulinaryItemBySlug(slug: string): CulinaryItem | undefined {
  return publishedItemBySlug.get(slug);
}

export function listPublishedCulinaryItemsByType(itemType: CulinaryItemType): readonly CulinaryItem[] {
  return publishedItems.filter((item) => item.itemType === itemType);
}

export function getPublishedNativeCulinaryItems(): readonly CulinaryItem[] {
  return publishedNativeItems;
}

export function getPublishedNativeCulinaryItemBySlug(slug: string): CulinaryItem | undefined {
  return publishedNativeItemBySlug.get(slug);
}

export function getPublishedNativeCulinaryItemStaticParams(): Array<{ slug: string }> {
  return publishedNativeItems.map((item) => ({ slug: item.slug }));
}

export function isPublishedCulinaryItemLocaleComplete(item: CulinaryItem, locale: SupportedLocale): boolean {
  const recipe = publishedRecipeById.get(item.id);
  if (recipe) return hasCompleteRecipeTranslation(recipe, locale);
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

export function getPublishedCulinaryItemsForLocale(locale: SupportedLocale): readonly CulinaryItem[] {
  return publishedItems.filter((item) => isPublishedCulinaryItemLocaleComplete(item, locale));
}

export function getPublishedCulinaryItemForLocaleBySlug(slug: string, locale: SupportedLocale): CulinaryItem | undefined {
  const item = publishedItemBySlug.get(slug);
  return item && isPublishedCulinaryItemLocaleComplete(item, locale) ? item : undefined;
}
