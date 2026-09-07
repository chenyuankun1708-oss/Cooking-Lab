import { describe, expect, it } from "vitest";
import { publishedContentBundleManifest } from "@/data/content-bundle-manifest";
import { publishedLocalContentPackages } from "@/data/content-packages";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { getPublishedCulinaryItems } from "@/data/published-culinary-items";
import { getPublishedRecipes } from "@/data/published-recipes";
import { localContentPackageVersion } from "@/types/content-bundle";

describe("local culinary content packages", () => {
  it("routes every published item through one deterministic package", () => {
    expect(publishedLocalContentPackages).toHaveLength(85);
    expect(new Set(publishedLocalContentPackages.map((contentPackage) => contentPackage.itemId)).size).toBe(85);
    expect(publishedLocalContentPackages.every((contentPackage) => contentPackage.version === localContentPackageVersion)).toBe(true);
    expect(publishedLocalContentPackages.every((contentPackage) => contentPackage.manifestEntry.itemId === contentPackage.itemId)).toBe(true);

    const packageIdentity = publishedLocalContentPackages
      .map(({ itemId, slug }) => `${itemId}:${slug}`)
      .sort();
    const manifestIdentity = publishedContentBundleManifest.entries
      .map(({ itemId, slug }) => `${itemId}:${slug}`)
      .sort();
    const publishedIdentity = getPublishedCulinaryItems()
      .map(({ id, slug }) => `${id}:${slug}`)
      .sort();

    expect(packageIdentity).toEqual(manifestIdentity);
    expect(packageIdentity).toEqual(publishedIdentity);
    const manifestIds = new Set<string>(publishedContentBundleManifest.entries.map((entry) => entry.itemId));
    const legacyPublishedOrder = [
      ...getPublishedRecipes().map((recipe) => recipe.id),
      ...nativeCulinaryItems.map((item) => item.id),
    ].filter((itemId) => manifestIds.has(itemId));
    expect(publishedLocalContentPackages.slice(0, legacyPublishedOrder.length).map((contentPackage) => contentPackage.itemId)).toEqual(legacyPublishedOrder);
  });

  it("keeps legacy migration provenance explicit until standalone package authoring", () => {
    expect(publishedLocalContentPackages.slice(0, 50).every((contentPackage) => (
      contentPackage.sourceKind === "legacy-recipe" || contentPackage.sourceKind === "legacy-native"
    ))).toBe(true);
    expect(publishedLocalContentPackages.slice(50).every((contentPackage) => contentPackage.sourceKind === "standalone")).toBe(true);
  });
});
