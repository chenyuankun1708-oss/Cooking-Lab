import { describe, expect, it } from "vitest";
import { ingredients } from "@/data/ingredients";
import { getPublishedRecipes } from "@/data/published-recipes";
import { recipes } from "@/data/recipes";
import type { Recipe } from "@/types/recipe";
import { describeRecipeSimilarity } from "../recipe-similarity-display";
import {
  calculateFlavorSimilarity,
  calculateRecipeSimilarity,
  defaultRecipeSimilarityThreshold,
  rankSimilarRecipes,
  recipeSimilarityWeights,
} from "../recipe-similarity";

const published = getPublishedRecipes();
const bySlug = (slug: string) => published.find((recipe) => recipe.slug === slug)!;
const tomatoEggs = bySlug("tomato-scrambled-eggs");

describe("recipe similarity core", () => {
  it("keeps centralized dimension weights normalized", () => {
    expect(Object.values(recipeSimilarityWeights).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 10);
    expect(recipeSimilarityWeights.flavor).toBeGreaterThan(recipeSimilarityWeights.cuisine);
    expect(recipeSimilarityWeights.ingredient).toBeGreaterThan(recipeSimilarityWeights.dishType);
  });

  it("ranks deterministically without mutating input, includes no target, and deduplicates candidates", () => {
    const before = JSON.stringify(published);
    const first = rankSimilarRecipes(tomatoEggs, [...published, published[1]], { ingredients });
    const second = rankSimilarRecipes(tomatoEggs, [...published, published[1]], { ingredients });

    expect(second).toEqual(first);
    expect(JSON.stringify(published)).toBe(before);
    expect(first.map(({ recipe }) => recipe.slug)).not.toContain(tomatoEggs.slug);
    expect(new Set(first.map(({ recipe }) => recipe.slug)).size).toBe(first.length);
  });

  it("uses slug as an explicit stable tie-break", () => {
    const alpha = cloneRecipe(tomatoEggs, "alpha-copy");
    const zulu = cloneRecipe(tomatoEggs, "zulu-copy");
    const result = rankSimilarRecipes(tomatoEggs, [zulu, alpha], {
      ingredients,
      minimumScore: 0,
      limit: 2,
    });
    expect(result.map(({ recipe }) => recipe.slug)).toEqual(["alpha-copy", "zulu-copy"]);
  });

  it("compares taste intensity and structured Flavor overlap", () => {
    const same = calculateFlavorSimilarity(tomatoEggs.flavor, tomatoEggs.flavor);
    const spicy = calculateFlavorSimilarity(tomatoEggs.flavor, bySlug("thai-basil-chicken").flavor);
    expect(same).toBe(1);
    expect(same).toBeGreaterThan(spicy);
  });

  it("rewards exact main ingredients and small cross-cut families", () => {
    const tomatoPasta = bySlug("italian-tomato-basil-pasta");
    const chickenBreast = recipes.find((recipe) => recipe.slug === "lemon-chicken-breast")!;
    const chickenThigh = bySlug("thai-basil-chicken");

    expect(calculateRecipeSimilarity(tomatoEggs, tomatoPasta, ingredients).breakdown.ingredient).toBeGreaterThan(0);
    expect(calculateRecipeSimilarity(chickenBreast, chickenThigh, ingredients).signals)
      .toEqual(expect.arrayContaining([expect.objectContaining({ kind: "ingredient-family", ids: ["chicken"] })]));
  });

  it("does not treat salt, oil, garlic, or other common aromatics as main-ingredient overlap", () => {
    const chicken = withIngredients(tomatoEggs, "seasoning-chicken", ["chicken-thigh", "garlic", "salt", "cooking-oil"]);
    const beef = withIngredients(bySlug("lebanese-hummus-plate"), "seasoning-beef", ["beef-lean", "garlic", "salt", "cooking-oil"]);
    const result = calculateRecipeSimilarity(chicken, beef, ingredients);

    expect(result.breakdown.ingredient).toBe(0);
    expect(result.score).toBeLessThan(defaultRecipeSimilarityThreshold);
  });

  it("keeps cuisine, technique, and dish type as separate supporting dimensions", () => {
    const same = calculateRecipeSimilarity(tomatoEggs, cloneRecipe(tomatoEggs, "same-shape"), ingredients);
    const different = calculateRecipeSimilarity(
      tomatoEggs,
      {
        ...cloneRecipe(tomatoEggs, "different-shape"),
        taxonomy: {
          ...tomatoEggs.taxonomy,
          origin: { countryId: "japan" },
          cuisine: { cuisineId: "japanese" },
          techniques: ["steam"],
          mealType: { dishTypeId: "soup" },
        },
      },
      ingredients,
    );

    expect(same.breakdown).toMatchObject({ cuisine: 0.8, technique: 1, dishType: 1 });
    expect(different.breakdown).toMatchObject({ cuisine: 0, technique: 0, dishType: 0 });
    expect(same.score).toBeGreaterThan(different.score);
  });

  it("only exposes published candidates when the public source is supplied", () => {
    const results = rankSimilarRecipes(tomatoEggs, published, { ingredients });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ recipe }) => recipe.publication.status === "published")).toBe(true);
    expect(published).toHaveLength(10);
    expect(recipes).toHaveLength(100);
  });
});

describe("current published similarity semantics", () => {
  it("keeps tomato-led recipes near tomato scrambled eggs", () => {
    const slugs = rankSimilarRecipes(tomatoEggs, published, { ingredients }).map(({ recipe }) => recipe.slug);
    expect(slugs).toEqual(expect.arrayContaining(["french-ratatouille", "italian-tomato-basil-pasta"]));
  });

  it("connects tofu and fermented savoriness without grouping every Chinese dish", () => {
    const slugs = rankSimilarRecipes(bySlug("home-mapo-tofu"), published, { ingredients })
      .map(({ recipe }) => recipe.slug);
    expect(slugs).toContain("japanese-miso-tofu-soup");
    expect(slugs).not.toContain("tomato-scrambled-eggs");
  });

  it("connects soup, noodle, fresh-spicy, and cold-dish anchors for meaningful reasons", () => {
    expect(similarSlugs("japanese-miso-tofu-soup")).toContain("vietnamese-beef-noodle-soup-home");
    expect(similarSlugs("thai-basil-chicken")).toContain("korean-bibimbap-home");
    expect(similarSlugs("sichuan-smashed-cucumber")).toContain("lebanese-hummus-plate");
  });

  it("derives natural explanations from signals without exposing system scores", () => {
    const result = rankSimilarRecipes(tomatoEggs, published, { ingredients })[0];
    const explanation = describeRecipeSimilarity(tomatoEggs, result, ingredients);
    expect(explanation).toMatch(/番茄|酸甜|家常/);
    expect(explanation).not.toMatch(/%|相似度|匹配度|score/i);
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

function similarSlugs(slug: string): string[] {
  const target = bySlug(slug);
  return rankSimilarRecipes(target, published, { ingredients }).map(({ recipe }) => recipe.slug);
}

function cloneRecipe(source: Recipe, slug: string): Recipe {
  return { ...source, id: slug, slug, name: slug };
}

function withIngredients(source: Recipe, slug: string, ingredientIds: string[]): Recipe {
  return {
    ...cloneRecipe(source, slug),
    ingredients: ingredientIds.map((ingredientId) => ({ ingredientId, amount: 10, unit: "g" as const })),
  };
}
