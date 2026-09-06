import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import { applyM9RecipePublicationOverrides, m9PromotedRecipeSlugs } from "@/data/m9-published-recipes";
import { m9RecipeResearchRegistry } from "@/data/research/m9-recipe-research";
import { m9RecipeResearchRecords, m9RecipeResearchSources } from "@/data/research/m9-recipe-research";
import { getLocalizedRecipe, hasCompleteRecipeTranslation } from "@/data/localization/public-recipes";
import { getPublishedCulinaryItemBySlug } from "@/data/published-culinary-items";
import { getStoryExperienceContext } from "@/data/published-stories";
import { ingredients } from "@/data/ingredients";
import { buildCulinaryDetailModel } from "../culinary-detail";
import { listM9RecipePublicationReadinessIssues } from "../m9-recipe-publishing";

describe("M9 Recipe publication readiness", () => {
  const candidates = applyM9RecipePublicationOverrides(recipes);

  it("promotes exactly 24 reviewed draft recipes", () => {
    expect(m9PromotedRecipeSlugs).toHaveLength(24);
    expect(new Set(m9PromotedRecipeSlugs).size).toBe(24);
    expect(candidates.filter((recipe) => m9PromotedRecipeSlugs.includes(recipe.slug)).every(
      (recipe) => recipe.publication.status === "published" && recipe.steps.length >= 4 && recipe.steps.length <= 6,
    )).toBe(true);
  });

  it("requires closed research, English review, Hero references, and complete preparation", () => {
    expect(listM9RecipePublicationReadinessIssues({
      recipes: candidates,
      slugs: m9PromotedRecipeSlugs,
      researchRegistry: m9RecipeResearchRegistry,
      hasCompleteEnglishTranslation: (recipe) => hasCompleteRecipeTranslation(recipe, "en"),
    })).toEqual([]);
  });

  it("rejects two source IDs from the same publisher as non-independent", () => {
    const sourceRecipe = candidates.find((candidate) => candidate.slug === "japanese-oyakodon")!;
    const duplicatedPublisherRegistry = {
      ...m9RecipeResearchRegistry,
      sources: m9RecipeResearchRegistry.sources.map((source) => source.id === "just-one-cookbook-oyakodon"
        ? { ...source, publisherOrInstitution: "Ministry of Agriculture, Forestry and Fisheries of Japan" }
        : source),
    };
    expect(listM9RecipePublicationReadinessIssues({
      recipes: [sourceRecipe],
      slugs: [sourceRecipe.slug],
      researchRegistry: duplicatedPublisherRegistry,
      hasCompleteEnglishTranslation: (recipe) => hasCompleteRecipeTranslation(recipe, "en"),
    })).toContain("japanese-oyakodon: accepted sources must represent two independent publishers or institutions");
  });

  it("records corrected identities and preparation tools in the public candidates", () => {
    const bySlug = new Map(candidates.map((recipe) => [recipe.slug, recipe]));
    expect(bySlug.get("yunnan-mushroom-chicken-stew")?.name).toBe("菌菇炖鸡");
    expect(bySlug.get("yunnan-mushroom-chicken-stew")?.taxonomy.cuisine.cuisineId).toBe("chinese");
    expect(bySlug.get("chaoshan-fish-congee")?.name).toBe("鱼片粥家庭版");
    expect(bySlug.get("chaoshan-fish-congee")?.taxonomy.cuisine.cuisineId).toBe("chinese");
    expect(bySlug.get("greek-lemon-oregano-chicken")?.name).toBe("希腊风味柠檬牛至鸡");
    expect(bySlug.get("greek-lemon-oregano-chicken")?.tools).toEqual([
      "knife",
      "cutting-board",
      "grill-pan",
      "tongs",
    ]);
  });

  it("exposes localized principles and accepted research sources in the unified detail model", () => {
    const sourceRecipe = candidates.find((candidate) => candidate.slug === "japanese-oyakodon")!;
    const recipe = getLocalizedRecipe(sourceRecipe, "en")!;
    const item = getPublishedCulinaryItemBySlug(recipe.slug)!;
    const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext("en"), "en", {
      recipe,
      researchRecords: m9RecipeResearchRecords,
      researchSources: m9RecipeResearchSources,
    });
    expect(detail.principles).toHaveLength(3);
    expect(detail.sources).toHaveLength(2);
    expect(detail.sources.every((source) => source.href?.startsWith("https://") && source.uses.length > 0)).toBe(true);
    expect(detail.name).toBe("Oyakodon");
    expect(JSON.stringify({
      name: detail.name,
      description: detail.description,
      imageAlt: detail.image?.alt,
      preparation: detail.preparation,
      principles: detail.principles,
    })).not.toMatch(/[\u3400-\u9fff]/u);
  });
});
