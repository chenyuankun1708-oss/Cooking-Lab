import { existsSync } from "node:fs";
import { resolve } from "node:path";
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
import { hasCompleteNativeCulinaryTranslation, hasCompleteStandaloneCulinaryTranslation } from "./localization/public-culinary";
import { hasCompleteRecipeTranslation } from "./localization/public-recipes";
import { hasReviewedEnglishIngredientLabel } from "./localization/ingredients";
import type { SupportedLocale } from "@/types/localization";
import { createContentRightsRegistry, m10AuditedCulinaryItemIds } from "./content-rights";
import { assertContentRightsReady, createContentRightsAuditReport, evaluateContentRightsRegistry, getContentRightsEvaluationDate } from "@/lib/content-rights";
import { m9RecipeResearchRecords, m9RecipeResearchSources } from "./research/m9-recipe-research";
import { assertContentBundleManifestReady } from "@/lib/content-bundle";
import { publishedContentBundleManifest } from "./content-bundle-manifest";
import { publishedLocalContentPackages } from "./content-packages";
import { createPublishingGovernanceRegistry } from "./publishing-governance";
import {
  assertPublishingGovernanceReady,
  createPublishingGovernanceReport,
  evaluatePublishingGovernance,
} from "@/lib/publishing-governance";
import { createImageAssetVersions } from "@/lib/image-asset-version";
import { createPublishingLocalizationVersions } from "./publishing-localization-versions";
import {
  m11BatchAEvidence,
  m11BatchAImages,
  m11BatchAProductProfiles,
  m11BatchAResearchRecords,
  m11BatchARestaurantIdentities,
  m11BatchASources,
} from "./m11/batch-a";
import { m11BatchAPublishedStories } from "./m11/batch-a-publication";
import { m11BatchAEnglishIngredientLabels } from "./m11/batch-a-ingredient-labels";
import { m11BatchAItemIds, m11RestaurantReconstructionItemIds } from "./m11/portfolio";

export { publishedContentBundleManifest } from "./content-bundle-manifest";

export const contentImages = Object.freeze([...recipeImages, ...culinaryImages, ...m11BatchAImages]);
export const contentStories = Object.freeze([...culinaryStories, ...m11BatchAPublishedStories]);
export const contentEvidence = Object.freeze([...culinaryEvidence, ...m11BatchAEvidence]);
export const contentResearchRecords = Object.freeze([...m9RecipeResearchRecords, ...m11BatchAResearchRecords]);
const allImages = contentImages;
export const contentImageAssetVersions = Object.freeze(createImageAssetVersions(allImages));
export const contentLocalizationVersions = Object.freeze(createPublishingLocalizationVersions(
  publishedLocalContentPackages,
  ingredients,
  contentStories,
  m11BatchAEnglishIngredientLabels,
));
const candidates: CulinaryItem[] = publishedLocalContentPackages.map((contentPackage) => contentPackage.item);
const contentPackageByItemId = new Map(publishedLocalContentPackages.map((contentPackage) => [contentPackage.itemId, contentPackage]));
const publishingContext: CulinaryPublishingContext = {
  ingredients,
  images: allImages,
  localAssetExists: (src) => existsSync(resolve(process.cwd(), "public", src.replace(/^\//, ""))),
  stories: contentStories,
  sources: [...culinarySources, ...m11BatchASources],
  evidence: contentEvidence,
};

assertPublishedCulinaryItemsEligible(candidates, publishingContext);

const allSources = [...culinarySources, ...m9RecipeResearchSources, ...m11BatchASources];
const allEvidence = [...contentEvidence];
export const contentRightsSources = Object.freeze(allSources);
export const contentRightsRegistry = createContentRightsRegistry({
  items: candidates,
  auditedItemIds: [...m10AuditedCulinaryItemIds, ...m11BatchAItemIds],
  images: allImages,
  ingredients,
  stories: contentStories,
  evidence: allEvidence,
  sources: allSources,
  researchRecords: contentResearchRecords,
  restaurantRequirements: m11RestaurantReconstructionItemIds.map((culinaryItemId) => ({
    culinaryItemId,
    kind: "cooking-lab-reconstruction" as const,
  })),
  restaurants: m11BatchARestaurantIdentities,
  productProfiles: m11BatchAProductProfiles,
});
const contentRightsContext = {
  items: candidates,
  images: allImages,
  ingredients,
  stories: contentStories,
  evidence: allEvidence,
  sources: allSources,
  researchRecords: contentResearchRecords,
  now: getContentRightsEvaluationDate(),
} as const;
assertContentRightsReady(contentRightsRegistry, contentRightsContext);
export const contentRightsAuditReport = createContentRightsAuditReport(
  evaluateContentRightsRegistry(contentRightsRegistry, contentRightsContext),
);
export const publishingGovernanceRegistry = createPublishingGovernanceRegistry({
  items: candidates,
  rightsRegistry: contentRightsRegistry,
  images: allImages,
  sources: allSources,
  evidence: allEvidence,
  stories: contentStories,
  researchRecords: contentResearchRecords,
  ingredients,
  contentPackages: publishedLocalContentPackages,
  localizationVersions: contentLocalizationVersions,
  imageAssetVersions: contentImageAssetVersions,
});
const publishingGovernanceContext = {
  items: candidates,
  rightsRegistry: contentRightsRegistry,
  images: allImages,
  sources: allSources,
  evidence: allEvidence,
  stories: contentStories,
  researchRecords: contentResearchRecords,
  ingredients,
  contentPaths: publishedLocalContentPackages.map((contentPackage) => ({
    itemId: contentPackage.itemId,
    kind: contentPackage.sourceKind === "legacy-recipe"
      ? "adapted-recipe" as const
      : contentPackage.sourceKind === "legacy-native"
        ? "native-culinary" as const
        : "standalone-package" as const,
  })),
  localizationVersions: contentLocalizationVersions,
  imageAssetVersions: contentImageAssetVersions,
} as const;
assertPublishingGovernanceReady(publishingGovernanceRegistry, publishingGovernanceContext);
export const publishingGovernanceAuditReport = createPublishingGovernanceReport(
  evaluatePublishingGovernance(publishingGovernanceRegistry, publishingGovernanceContext),
);

const publishedRecipeById = new Map(getPublishedRecipes().map((recipe) => [recipe.id, recipe]));
const publishedItems = Object.freeze(getPubliclyVisibleCulinaryItems(candidates, publishingContext));
assertContentBundleManifestReady(
  publishedContentBundleManifest,
  publishedItems,
  contentRightsRegistry,
  isPublishedCulinaryItemLocaleComplete,
);
const publishedItemBySlug = new Map(publishedItems.map((item) => [item.slug, item]));
const nativeItemIds = new Set(nativeCulinaryItems.map((item) => item.id));
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
  if (contentPackageByItemId.get(item.id)?.sourceKind === "standalone") {
    const ingredientLabelsReady = locale !== "en" || !("inputs" in item.preparation)
      || item.preparation.inputs.every((input) => hasReviewedEnglishIngredientLabel(
        input.ingredientId,
        m11BatchAEnglishIngredientLabels,
      ));
    return ingredientLabelsReady && hasCompleteStandaloneCulinaryTranslation(item, locale, contentStories);
  }
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
