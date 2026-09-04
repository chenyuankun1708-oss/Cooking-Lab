import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { homepageFeaturedRecipeSlugs } from "@/data/homepage";
import { ingredients } from "@/data/ingredients";
import {
  getPublishedRecipeBySlug,
  getPublishedRecipes,
  getPublishedRecipesBySlugs,
  getPublishedRecipeStaticParams,
} from "@/data/published-recipes";
import { recipeImages } from "@/data/recipe-images";
import { recipes } from "@/data/recipes";
import type { RecipeImage } from "@/types/image";
import type { Recipe } from "@/types/recipe";
import { exploreRecipeCatalog } from "../recipe-exploration";
import {
  evaluateRecipePublishingEligibility,
  getPubliclyVisibleRecipes,
  isRecipePubliclyVisible,
  type RecipePublishingContext,
} from "../recipe-publishing";
import { discoverRecipes } from "../recommendation";

const source = recipes.find((recipe) => recipe.slug === "tomato-scrambled-eggs")!;
const context: RecipePublishingContext = {
  ingredients,
  images: recipeImages,
  localAssetExists: (src) => existsSync(resolve(process.cwd(), "public", src.replace(/^\//, ""))),
};

describe("recipe publishing contract", () => {
  it("keeps status separate from deterministic eligibility", () => {
    const result = evaluateRecipePublishingEligibility(source, context);
    expect(source.publication.status).toBe("published");
    expect(result).toEqual({ recipeId: source.id, eligible: true, issues: [] });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("rejects a published recipe with no hero or a missing local asset", () => {
    const noHero = { ...source, heroImageId: undefined };
    expect(evaluateRecipePublishingEligibility(noHero, context)).toMatchObject({
      eligible: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "hero-missing" })]),
    });

    const missingAssetContext = { ...context, localAssetExists: () => false };
    expect(evaluateRecipePublishingEligibility(source, missingAssetContext)).toMatchObject({
      eligible: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "hero-asset-missing" })]),
    });
  });

  it("rejects an invalid hero license and incomplete steps", () => {
    const image = recipeImages.find((item) => item.id === source.heroImageId)!;
    const invalidImage = { ...image, license: "unknown" } as RecipeImage;
    const invalidImageContext = { ...context, images: [invalidImage] };
    expect(evaluateRecipePublishingEligibility(source, invalidImageContext)).toMatchObject({
      eligible: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "hero-invalid" })]),
    });

    const incomplete = { ...source, steps: [{ order: 1, instruction: "炒熟", why: "好吃", heat: "high" }] } as Recipe;
    expect(evaluateRecipePublishingEligibility(incomplete, context)).toMatchObject({
      eligible: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "step-incomplete" })]),
    });
  });

  it("does not expose a technically valid draft or reviewed recipe", () => {
    for (const status of ["draft", "reviewed"] as const) {
      const unpublished = { ...source, publication: { status } };
      expect(evaluateRecipePublishingEligibility(unpublished, context).eligible).toBe(true);
      expect(isRecipePubliclyVisible(unpublished, context)).toBe(false);
      expect(getPubliclyVisibleRecipes([unpublished], context)).toEqual([]);
    }
  });

  it("requires provenance for factual cultural claims", () => {
    const unsupported = {
      ...source,
      culture: { traditionalContext: "某地区自古以来都会这样食用。" },
    };
    expect(evaluateRecipePublishingEligibility(unsupported, context)).toMatchObject({
      eligible: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "culture-provenance" })]),
    });

    const incompleteSource = {
      ...source,
      culture: {
        traditionalContext: "有明确来源支持的传统语境。",
        sources: [{ title: "参考资料", url: "http://example.com", publisher: "Example" }],
      },
    };
    expect(evaluateRecipePublishingEligibility(incompleteSource, context)).toMatchObject({
      eligible: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "culture-provenance" })]),
    });
  });
});

describe("canonical public recipe source", () => {
  it("publishes only the ten reviewed recipes while preserving all structured data", () => {
    const published = getPublishedRecipes();
    expect(recipes).toHaveLength(100);
    expect(published).toHaveLength(10);
    expect(published.every((recipe) => recipe.publication.status === "published")).toBe(true);
    expect(published.every((recipe) => evaluateRecipePublishingEligibility(recipe, context).eligible)).toBe(true);
  });

  it("excludes unpublished recipes from recommendation, catalog, detail lookup, and static params", () => {
    const published = getPublishedRecipes();
    const draft = recipes.find((recipe) => recipe.publication.status === "draft")!;
    expect(discoverRecipes(published, {}).map(({ recipe }) => recipe.slug)).not.toContain(draft.slug);
    expect(exploreRecipeCatalog(published, {}).map(({ recipe }) => recipe.slug)).not.toContain(draft.slug);
    expect(getPublishedRecipeBySlug(draft.slug)).toBeUndefined();
    expect(getPublishedRecipeStaticParams()).not.toContainEqual({ slug: draft.slug });
  });

  it("keeps homepage featured references explicitly published", () => {
    const featured = getPublishedRecipesBySlugs(homepageFeaturedRecipeSlugs);
    expect(featured.map((recipe) => recipe.slug)).toEqual(homepageFeaturedRecipeSlugs);
    expect(featured.every((recipe) => recipe.publication.status === "published")).toBe(true);
    expect(() => getPublishedRecipesBySlugs(["not-published"])).toThrow(/must be published/);
  });

  it("routes public application surfaces away from the raw recipe dataset", () => {
    for (const file of ["app/page.tsx", "app/recipes/page.tsx", "app/recipes/[slug]/page.tsx"]) {
      expect(readFileSync(resolve(process.cwd(), file), "utf8"), file).not.toContain("@/data/recipes");
    }
  });
});
