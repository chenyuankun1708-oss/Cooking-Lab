import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { culinaryEvidence } from "@/data/culinary/evidence";
import { culinaryImages } from "@/data/culinary/images";
import {
  nativeAlcoholicDrinkItems,
  nativeCoffeeItems,
  nativeNonAlcoholicDrinkItems,
  nativeTeaItems,
} from "@/data/culinary/items-drinks";
import { nativeDessertItems } from "@/data/culinary/items-desserts";
import { nativeDishItems } from "@/data/culinary/items-dishes";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { culinarySources } from "@/data/culinary/sources";
import { culinaryStories } from "@/data/culinary/stories";
import { ingredients } from "@/data/ingredients";
import {
  getPublishedCulinaryItemBySlug,
  getPublishedCulinaryItems,
  listPublishedCulinaryItemsByType,
} from "@/data/published-culinary-items";
import { getPublishedRecipes } from "@/data/published-recipes";
import { recipeImages } from "@/data/recipe-images";
import { recipes } from "@/data/recipes";
import type { CulinaryItem } from "@/types/culinary";
import { adaptRecipeToCulinaryItem } from "../culinary-item-adapter";
import {
  assertPublishedCulinaryItemsEligible,
  getPubliclyVisibleCulinaryItems,
  validateCulinaryLibraryIdentity,
} from "../culinary-library-validation";
import {
  evaluateCulinaryItemPublishingEligibility,
  type CulinaryPublishingContext,
} from "../culinary-publishing";
import { validateCulinaryItem, validateEvidence, validateSource, validateStory } from "../culinary-validation";
import { validateCulinaryImageReferences, validateImageAssets } from "../image-validation";

const publishingContext: CulinaryPublishingContext = {
  ingredients,
  images: [...recipeImages, ...culinaryImages],
  localAssetExists: (src) => existsSync(resolve(process.cwd(), "public", src.replace(/^\//, ""))),
  stories: culinaryStories,
  sources: culinarySources,
  evidence: culinaryEvidence,
};

const proceduralKinds = new Set(["cooking", "baking", "brewing", "extraction", "mixing", "assembly"]);

describe("published culinary library", () => {
  it("adds a balanced native portfolio to the ten adapted published Recipes", () => {
    const published = getPublishedCulinaryItems();

    expect(nativeCulinaryItems).toHaveLength(16);
    expect(published).toHaveLength(26);
    expect(listPublishedCulinaryItemsByType("dish")).toHaveLength(13);
    expect(listPublishedCulinaryItemsByType("dessert")).toHaveLength(3);
    expect(listPublishedCulinaryItemsByType("tea")).toHaveLength(4);
    expect(listPublishedCulinaryItemsByType("coffee")).toHaveLength(2);
    expect(listPublishedCulinaryItemsByType("non-alcoholic-drink")).toHaveLength(2);
    expect(listPublishedCulinaryItemsByType("alcoholic-drink")).toHaveLength(2);
    expect(getPublishedCulinaryItemBySlug("espresso")?.itemType).toBe("coffee");
  });

  it("keeps each native collection in its declared item type", () => {
    expect(nativeDishItems.every((item) => item.itemType === "dish")).toBe(true);
    expect(nativeDessertItems.every((item) => item.itemType === "dessert")).toBe(true);
    expect(nativeTeaItems.every((item) => item.itemType === "tea")).toBe(true);
    expect(nativeCoffeeItems.every((item) => item.itemType === "coffee")).toBe(true);
    expect(nativeNonAlcoholicDrinkItems.every((item) => item.itemType === "non-alcoholic-drink")).toBe(true);
    expect(nativeAlcoholicDrinkItems.every((item) => item.itemType === "alcoholic-drink")).toBe(true);
  });

  it("validates every native item and all type-appropriate preparation models", () => {
    expect(nativeCulinaryItems.flatMap(validateCulinaryItem)).toEqual([]);
    expect(new Set(nativeCulinaryItems.map((item) => item.preparation.kind))).toEqual(new Set([
      "cooking",
      "assembly",
      "baking",
      "brewing",
      "extraction",
      "mixing",
      "serving-guidance",
    ]));

    for (const item of nativeCulinaryItems) {
      if (!proceduralKinds.has(item.preparation.kind)) continue;
      const preparation = item.preparation as Extract<CulinaryItem["preparation"], { steps: unknown }>;
      for (const step of preparation.steps) {
        const copy = step.content.entries.find((entry) => entry.locale === step.content.defaultLocale)?.value;
        expect(copy?.rationale?.trim(), `${item.id} step ${step.order} rationale`).toBeTruthy();
        expect(copy?.stateCue?.trim(), `${item.id} step ${step.order} state cue`).toBeTruthy();
      }
    }
  });

  it("passes type-specific publishing eligibility for every native item", () => {
    const results = nativeCulinaryItems.map((item) => evaluateCulinaryItemPublishingEligibility(item, publishingContext));
    expect(results.filter((result) => !result.eligible)).toEqual([]);
    expect(() => assertPublishedCulinaryItemsEligible(nativeCulinaryItems, publishingContext)).not.toThrow();
  });

  it("keeps Story claims traceable through Evidence to retrievable Sources", () => {
    const evidenceById = new Map(culinaryEvidence.map((record) => [record.id, record]));
    const sourceById = new Map(culinarySources.map((source) => [source.id, source]));

    expect(culinaryStories).toHaveLength(6);
    expect(culinaryStories.flatMap(validateStory)).toEqual([]);
    expect(culinarySources.flatMap(validateSource)).toEqual([]);
    expect(culinaryEvidence.flatMap((record) => validateEvidence(record, new Set(sourceById.keys())))).toEqual([]);

    for (const item of nativeCulinaryItems) {
      for (const storyId of item.storyIds) {
        const story = culinaryStories.find((candidate) => candidate.id === storyId);
        expect(story, `${item.id} Story ${storyId}`).toBeDefined();
        for (const claim of story!.claims) {
          for (const evidenceId of claim.evidenceIds) {
            const evidence = evidenceById.get(evidenceId);
            expect(evidence, `${storyId} Evidence ${evidenceId}`).toBeDefined();
            expect(sourceById.has(evidence!.sourceId), `${evidenceId} Source`).toBe(true);
          }
        }
      }
    }
  });

  it("keeps exact image provenance and local assets for all native items", () => {
    expect(culinaryImages).toHaveLength(16);
    expect(validateImageAssets(culinaryImages)).toEqual([]);
    expect(validateCulinaryImageReferences(nativeCulinaryItems, culinaryImages)).toEqual([]);
    expect(new Set(culinaryImages.map((image) => image.id))).toEqual(new Set(
      nativeCulinaryItems.flatMap((item) => item.images.availability === "available" ? item.images.references.imageIds : []),
    ));
    for (const image of culinaryImages) {
      expect(image.sourceUrl, image.id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(image.author?.trim(), image.id).toBeTruthy();
      expect(image.attribution?.trim(), image.id).toBeTruthy();
      expect(image.licenseUrl, image.id).toMatch(/^https:\/\/creativecommons\.org\//);
      expect(publishingContext.localAssetExists(image.src), image.src).toBe(true);
    }
  });

  it("resolves every native ingredient reference without expanding the Recipe dataset", () => {
    const ingredientIds = new Set(ingredients.map((ingredient) => ingredient.id));
    const recipeIngredientIds = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((input) => input.ingredientId)));
    const nativeIngredientIds = new Set(nativeCulinaryItems.flatMap((item) =>
      proceduralKinds.has(item.preparation.kind)
        ? (item.preparation as Extract<CulinaryItem["preparation"], { inputs: unknown }>).inputs.map((input) => input.ingredientId)
        : [],
    ));

    expect([...nativeIngredientIds].every((id) => ingredientIds.has(id))).toBe(true);
    expect(ingredients.filter((ingredient) => !recipeIngredientIds.has(ingredient.id)).every((ingredient) => nativeIngredientIds.has(ingredient.id))).toBe(true);
    expect(recipes).toHaveLength(100);
    expect(getPublishedRecipes()).toHaveLength(10);
  });

  it("rejects duplicate identities and excludes drafts from the public boundary", () => {
    const duplicate = { ...nativeCulinaryItems[1], id: nativeCulinaryItems[0].id, slug: nativeCulinaryItems[0].slug } as CulinaryItem;
    const candidates = [nativeCulinaryItems[0], duplicate];
    expect(validateCulinaryLibraryIdentity(candidates)).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "id" }),
      expect.objectContaining({ field: "slug" }),
    ]));
    expect(() => assertPublishedCulinaryItemsEligible(candidates, publishingContext)).toThrow(/ID 重复/);
    expect(() => getPubliclyVisibleCulinaryItems(candidates, publishingContext)).toThrow(/ID 重复/);

    const draft = { ...nativeCulinaryItems[0], id: "draft-item", slug: "draft-item", publication: { status: "draft" as const } };
    expect(getPubliclyVisibleCulinaryItems([draft, nativeCulinaryItems[1]], publishingContext)).toEqual([nativeCulinaryItems[1]]);
  });

  it("rejects image ID collisions across Recipe and native registries", () => {
    const context = { ...publishingContext, images: [...publishingContext.images, publishingContext.images[0]] };
    expect(() => assertPublishedCulinaryItemsEligible(nativeCulinaryItems, context)).toThrow(/Image ID 重复/);
  });

  it("enforces dish and dessert nutrition/cost while allowing honest drink applicability", () => {
    for (const item of [...nativeDishItems, ...nativeDessertItems]) {
      expect(item.nutrition.applicability).toBe("applicable");
      expect(item.cost.source).toBe("ingredient-derived");
    }
    expect(nativeTeaItems.some((item) => item.nutrition.applicability === "not-modeled")).toBe(true);
    expect(nativeAlcoholicDrinkItems.every((item) => item.nutrition.applicability === "not-modeled")).toBe(true);
    expect(nativeAlcoholicDrinkItems.every((item) => item.cost.source === "not-modeled")).toBe(true);
  });

  it("provides canonical, reviewed, pairing-ready metadata without display strings as identity", () => {
    for (const item of nativeCulinaryItems) {
      expect(item.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(item.content.entries.find((entry) => entry.locale === item.content.defaultLocale)?.status).toBe("reviewed");
      expect(item.pairing.mealRoleIds.length).toBeGreaterThan(0);
      expect(item.pairing.servingContextIds.length).toBeGreaterThan(0);
      expect(item.pairing.cuisineIds).toContain(item.taxonomy.cuisine?.cuisineId);
      expect(item.pairing.facets.some((facet) => facet.dimension === "weight")).toBe(true);
      expect(item.pairing.facets.some((facet) => facet.dimension === "temperature")).toBe(true);
    }
  });

  it("keeps the Recipe adapter compatible and maps cold dishes to a starter role", () => {
    const adapted = getPublishedRecipes().map(adaptRecipeToCulinaryItem);
    expect(adapted).toHaveLength(10);
    expect(adapted.every((item) => evaluateCulinaryItemPublishingEligibility(item, publishingContext).eligible)).toBe(true);
    const hummus = adaptRecipeToCulinaryItem(recipes.find((recipe) => recipe.slug === "lebanese-hummus-plate")!);
    expect(hummus.pairing.mealRoleIds).toContain("starter");
  });
});
