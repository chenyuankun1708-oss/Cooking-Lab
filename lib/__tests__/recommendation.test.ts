import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import type { Recipe } from "@/types/recipe";
import { discoverRecipes, hasActiveCriteria, resetRecommendationCriteria, RuleRecommendationEngine } from "../recommendation";
import type { IngredientRepository } from "../ingredient-repository";

const discover = (criteria: Parameters<typeof discoverRecipes>[1]) => discoverRecipes(recipes, criteria);

describe("recipe discovery filters", () => {
  it("returns every recipe without criteria", () => {
    expect(discover({})).toHaveLength(recipes.length);
  });

  it("applies max time inclusively", () => {
    expect(discover({ maxTime: 15 }).every(({ recipe }) => recipe.cooking.totalTime <= 15)).toBe(true);
  });

  it("applies per-serving calorie limits", () => {
    const results = discover({ maxCalories: 400 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ metrics }) => metrics.caloriesPerServing <= 400)).toBe(true);
  });

  it("applies per-serving minimum protein", () => {
    const results = discover({ minProtein: 30 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ metrics }) => metrics.proteinPerServing >= 30)).toBe(true);
  });

  it("applies maximum recipe oil", () => {
    expect(discover({ maxOil: 5 }).every(({ recipe }) => recipe.cooking.oil <= 5)).toBe(true);
  });

  it("applies per-serving estimated cost", () => {
    const results = discover({ maxCost: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ metrics }) => metrics.costPerServing <= 10)).toBe(true);
  });

  it("requires the available ingredient set to cover every required ingredient", () => {
    const target = recipes[0];
    const availableIngredients = target.ingredients.filter((item) => !item.optional).map((item) => item.ingredientId);
    expect(discoverRecipes([target], { availableIngredients })).toHaveLength(1);
    expect(discoverRecipes([target], { availableIngredients: availableIngredients.slice(1) })).toHaveLength(0);
  });

  it("requires the available tool set to cover every recipe tool", () => {
    const target = recipes[0];
    expect(discoverRecipes([target], { availableTools: target.tools })).toHaveLength(1);
    expect(discoverRecipes([target], { availableTools: target.tools.slice(1) })).toHaveLength(0);
  });

  it("filters cuisine exactly", () => {
    expect(discover({ cuisine: "中式" }).every(({ recipe }) => recipe.cuisine === "中式")).toBe(true);
  });

  it("requires every selected tag", () => {
    const results = discover({ dietaryTags: ["high-protein", "no-added-sugar"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ recipe }) => recipe.tags.includes("high-protein") && recipe.tags.includes("no-added-sugar"))).toBe(true);
  });

  it("combines multiple hard conditions", () => {
    const results = discover({ maxTime: 30, maxCalories: 600, minProtein: 20, maxOil: 10, maxCost: 20 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ score }) => score === 100)).toBe(true);
  });

  it("returns an empty result for impossible conditions", () => {
    expect(discover({ maxTime: 1, minProtein: 1000 })).toEqual([]);
  });

  it("provides a complete reset state", () => {
    const reset = resetRecommendationCriteria();
    expect(hasActiveCriteria(reset)).toBe(false);
    expect(discover(reset)).toHaveLength(recipes.length);
  });

  it("uses a deterministic score, time, then id ordering", () => {
    const base = recipes[0];
    const later: Recipe = { ...base, id: "z-stable", slug: "z-stable" };
    const earlier: Recipe = { ...base, id: "a-stable", slug: "a-stable" };
    const ids = new RuleRecommendationEngine().rank([later, earlier], {}).map(({ recipe }) => recipe.id);
    expect(ids).toEqual(["a-stable", "z-stable"]);
  });

  it("never treats incomplete nutrition or cost calculations as reliable zero matches", () => {
    const emptyRepository: IngredientRepository = { getById: () => undefined, list: () => [] };
    const engine = new RuleRecommendationEngine(emptyRepository);
    expect(discoverRecipes([recipes[0]], { maxCalories: 1 }, engine)).toEqual([]);
    expect(discoverRecipes([recipes[0]], { maxCost: 1 }, engine)).toEqual([]);
    const evaluation = engine.rank([recipes[0]], { maxCalories: 1 })[0];
    expect(evaluation.metrics.nutritionComplete).toBe(false);
    expect(evaluation.unmatchedConditions).toContain("营养估算不完整");
  });
});
