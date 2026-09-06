import { nativeCulinaryItems } from "@/data/culinary/items";
import { publishedContentBundleManifest } from "@/data/content-bundle-manifest";
import { getPublishedRecipes } from "@/data/published-recipes";
import { adaptRecipeToCulinaryItem } from "@/lib/culinary-item-adapter";
import { localContentPackageVersion, type LocalContentPackageV1 } from "@/types/content-bundle";

const legacyRecipes = new Map(
  getPublishedRecipes().map((recipe) => [recipe.id, adaptRecipeToCulinaryItem(recipe)]),
);
const legacyNativeItems = new Map(nativeCulinaryItems.map((item) => [item.id, item]));

export function defineLegacyContentPackage(itemId: string): LocalContentPackageV1 {
  const recipe = legacyRecipes.get(itemId);
  const nativeItem = legacyNativeItems.get(itemId);
  const item = recipe ?? nativeItem;
  const manifestEntry = publishedContentBundleManifest.entries.find((entry) => entry.itemId === itemId);
  if (!item || !manifestEntry || (recipe && nativeItem)) {
    throw new Error(`Legacy content package ${itemId} must resolve to exactly one culinary item.`);
  }
  return Object.freeze({
    version: localContentPackageVersion,
    itemId: item.id,
    slug: item.slug,
    item,
    manifestEntry,
    sourceKind: recipe ? "legacy-recipe" : "legacy-native",
  });
}
