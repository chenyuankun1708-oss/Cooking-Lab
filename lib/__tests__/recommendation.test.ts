import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import type { Recipe } from "@/types/recipe";
import type { RecommendationCriteria } from "@/types/recommendation";
import type { IngredientRepository } from "../ingredient-repository";
import { getRecipeCuisineId, getRecipePrimaryTechniqueId, getRecipeTagIds } from "../taxonomy";
import {
  discoverRecipes,
  hasActiveCriteria,
  INGREDIENT_CATEGORY_WEIGHTS,
  RECOMMENDATION_WEIGHTS,
  resetRecommendationCriteria,
  RuleRecommendationEngine,
} from "../recommendation";
import { buildRecommendationExplanation } from "../recommendation-display";

const engine = new RuleRecommendationEngine();
const target = recipes[0];
const evaluate = (criteria: Parameters<typeof engine.rank>[1], recipe = target) => engine.rank([recipe], criteria)[0];
const requiredIds = (recipe = target) => recipe.ingredients.filter(({ optional }) => !optional).map(({ ingredientId }) => ingredientId);
const targetCuisineId = getRecipeCuisineId(target);
const targetTagIds = getRecipeTagIds(target);
const targetTechniqueId = getRecipePrimaryTechniqueId(target);

describe("hard constraints", () => {
  it("keeps every recipe eligible and neutral without criteria", () => {
    const results = engine.rank(recipes, {});
    expect(results).toHaveLength(100);
    expect(results.every(({ eligible, score }) => eligible && score === 100)).toBe(true);
  });

  it.each([
    ["maxTime", { maxTime: target.cooking.totalTime - 1 }],
    ["maxCalories", { maxCalories: 0 }],
    ["minProtein", { minProtein: 10_000 }],
    ["maxOil", { maxOil: Math.max(0, target.cooking.oil / target.servings - 0.1) }],
    ["maxSalt", { maxSalt: Math.max(0, target.cooking.salt / target.servings - 0.1) }],
    ["maxCost", { maxCost: 0 }],
  ] as const)("excludes a recipe that fails %s", (criterion, criteria) => {
    const result = evaluate(criteria);
    expect(result.eligible).toBe(false);
    expect(result.hardFailures).toContainEqual(expect.objectContaining({ criterion }));
    expect(discoverRecipes([target], criteria)).toEqual([]);
  });

  it("supports an inclusive per-serving added-sugar limit", () => {
    expect(evaluate({ maxAddedSugar: 0 })).toMatchObject({ eligible: true, metrics: { addedSugarPerServing: 0 } });
    const sweet: Recipe = { ...target, cooking: { ...target.cooking, addedSugar: 4 } };
    expect(evaluate({ maxAddedSugar: 1 }, sweet).hardFailures).toContainEqual(expect.objectContaining({ criterion: "maxAddedSugar" }));
  });

  it("treats oil, salt, sugar, calories, protein and cost limits as per-serving values", () => {
    const result = evaluate({ maxOil: target.cooking.oil / target.servings, maxSalt: target.cooking.salt / target.servings });
    expect(result.eligible).toBe(true);
    expect(result.metrics.oilPerServing).toBe(target.cooking.oil / target.servings);
    expect(result.metrics.saltPerServing).toBe(target.cooking.salt / target.servings);
  });

  it("makes missing tools a structured hard feasibility failure", () => {
    const availableTools = target.tools.slice(1);
    const result = evaluate({ availableTools });
    expect(result.eligible).toBe(false);
    expect(result.missingTools).toContainEqual(expect.objectContaining({ id: target.tools[0] }));
    expect(result.hardFailures).toContainEqual({ criterion: "availableTools", reason: "missing-tools" });
    expect(buildRecommendationExplanation(result, "zh-CN")).toMatch(/暂时不合适/);
    expect(buildRecommendationExplanation(result, "en")).toMatch(/missing tools/);
  });

  it("never lets a perfect soft score override a hard failure", () => {
    const result = evaluate({ maxTime: 1, availableIngredients: requiredIds(), preferredCuisine: targetCuisineId, preferredTags: targetTagIds });
    expect(result.score).toBe(100);
    expect(result.eligible).toBe(false);
    expect(discoverRecipes([target], { maxTime: 1, availableIngredients: requiredIds(), preferredCuisine: targetCuisineId })).toEqual([]);
  });

  it("returns no results for conflicting strict constraints", () => {
    expect(discoverRecipes(recipes, { maxTime: 1, maxCalories: 10, minProtein: 100, maxCost: 1 })).toEqual([]);
  });

  it.each([30, 45, 60])("keeps every result within the declared %i minute contract", (maxTime) => {
    const results = discoverRecipes(recipes, { maxTime });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ recipe }) => recipe.cooking.totalTime <= maxTime)).toBe(true);
    expect(results.every(({ recipe }) => recipe.ingredients.every(({ ingredientId }) =>
      ingredientId !== "dry-chickpea" && ingredientId !== "dry-black-bean"))).toBe(true);
  });
});

describe("ingredient fit", () => {
  it("distinguishes one missing ingredient from several", () => {
    const oneMissing = evaluate({ availableIngredients: requiredIds().slice(0, -1) });
    const severalMissing = evaluate({ availableIngredients: requiredIds().slice(0, 1) });
    expect(oneMissing.missingIngredients).toHaveLength(1);
    expect(severalMissing.missingIngredients.length).toBeGreaterThan(1);
    expect(oneMissing.ingredientMatch.fit).toBeGreaterThan(severalMissing.ingredientMatch.fit);
    expect(buildRecommendationExplanation(oneMissing, "zh-CN")).toContain("只缺");
    expect(buildRecommendationExplanation(severalMissing, "zh-CN")).toContain("还缺");
  });

  it("does not penalize missing optional ingredients", () => {
    const optionalRecipe: Recipe = {
      ...target,
      ingredients: target.ingredients.map((item, index) => index === target.ingredients.length - 1 ? { ...item, optional: true } : item),
    };
    const available = optionalRecipe.ingredients.filter(({ optional }) => !optional).map(({ ingredientId }) => ingredientId);
    const result = evaluate({ availableIngredients: available }, optionalRecipe);
    expect(result.ingredientMatch.fit).toBe(1);
    expect(result.missingIngredients).toEqual([]);
  });

  it("weights a core ingredient more than seasoning or oil", () => {
    expect(INGREDIENT_CATEGORY_WEIGHTS.protein).toBeGreaterThan(INGREDIENT_CATEGORY_WEIGHTS.seasoning);
    const coreOnly = evaluate({ availableIngredients: ["egg"] });
    const seasoningOnly = evaluate({ availableIngredients: ["salt"] });
    expect(coreOnly.ingredientMatch.fit).toBeGreaterThan(seasoningOnly.ingredientMatch.fit);
  });

  it("ranks higher ingredient fit first", () => {
    const ids = requiredIds();
    const highFitRecipe: Recipe = { ...target, id: "high-fit", slug: "high-fit" };
    const lowFitRecipe: Recipe = { ...target, id: "low-fit", slug: "low-fit", ingredients: [...target.ingredients, { ingredientId: "broccoli", amount: 100, unit: "g", optional: false }] };
    const results = engine.rank([lowFitRecipe, highFitRecipe], { availableIngredients: ids });
    expect(results[0].recipe.id).toBe("high-fit");
  });
});

describe("soft preferences and score", () => {
  it("scores cuisine as a soft preference without excluding", () => {
    const matched = evaluate({ preferredCuisine: targetCuisineId });
    const unmatched = evaluate({ preferredCuisine: "不存在的菜系" });
    expect(matched.score).toBe(100);
    expect(unmatched).toMatchObject({ eligible: true, score: 0 });
    expect(unmatched.scoreBreakdown.cuisine?.score).toBe(0);
  });

  it("supports partial tag matches", () => {
    const result = evaluate({ preferredTags: [targetTagIds[0], "missing-tag"] });
    expect(result.scoreBreakdown.tags?.score).toBe(0.5);
    expect(result.score).toBe(50);
    expect(buildRecommendationExplanation(result, "zh-CN")).toContain("饮食方向合拍");
  });

  it("scores method preferences", () => {
    expect(evaluate({ preferredMethods: [targetTechniqueId] }).scoreBreakdown.methods?.score).toBe(1);
    expect(evaluate({ preferredMethods: ["不存在"] }).scoreBreakdown.methods?.score).toBe(0);
  });

  it("uses structured Flavor Profiles as a soft, deterministic preference", () => {
    const spicy = recipes.find((recipe) => recipe.slug === "thai-basil-chicken")!;
    const gentle = recipes.find((recipe) => recipe.slug === "steamed-egg")!;
    const ranked = engine.rank([gentle, spicy], { flavorPreferences: ["fresh-spicy"] });
    expect(ranked[0].recipe.slug).toBe(spicy.slug);
    expect(ranked[0].scoreBreakdown.flavor!.score).toBeGreaterThan(ranked[1].scoreBreakdown.flavor!.score);
    expect(ranked.every((result) => result.eligible)).toBe(true);
    expect(buildRecommendationExplanation(ranked[0], "zh-CN")).toMatch(/辣味|椒香|鲜味/);
  });

  it("does not mutate recipes or flavor preferences while scoring", () => {
    const input = recipes.slice(0, 8);
    const criteria = { flavorPreferences: ["tangy-refreshing", "roasted"] as const };
    const before = JSON.stringify(input);
    const first = engine.rank(input, { flavorPreferences: [...criteria.flavorPreferences] });
    const second = engine.rank(input, { flavorPreferences: [...criteria.flavorPreferences] });
    expect(JSON.stringify(input)).toBe(before);
    expect(first).toEqual(second);
  });

  it("normalizes multiple active soft dimensions by centralized weights", () => {
    const result = evaluate({ availableIngredients: requiredIds(), preferredCuisine: "不存在", preferredTags: [targetTagIds[0]], preferredMethods: [targetTechniqueId] });
    const expected = Math.round((RECOMMENDATION_WEIGHTS.ingredientFit + RECOMMENDATION_WEIGHTS.tags + RECOMMENDATION_WEIGHTS.methods) /
      (RECOMMENDATION_WEIGHTS.ingredientFit + RECOMMENDATION_WEIGHTS.cuisine + RECOMMENDATION_WEIGHTS.tags + RECOMMENDATION_WEIGHTS.methods) * 100);
    expect(result.score).toBe(expected);
    expect(Object.keys(result.scoreBreakdown).sort()).toEqual(["cuisine", "ingredientFit", "methods", "tags"]);
  });

  it("keeps explanation consistent with structured breakdown and missing ingredients", () => {
    const result = evaluate({ availableIngredients: requiredIds().slice(0, -1), preferredCuisine: targetCuisineId });
    const zh = buildRecommendationExplanation(result, "zh-CN");
    const en = buildRecommendationExplanation(result, "en");
    expect(zh).toContain(`${result.ingredientMatch.availableRequired}/${result.ingredientMatch.totalRequired}`);
    expect(zh).toContain("盐");
    expect(zh).toContain("中式");
    expect(en).toContain("salt");
    expect(en).toContain("Chinese");
  });

  it("does not claim that no preference was set when an active preference misses", () => {
    const result = evaluate({ preferredCuisine: "不存在的菜系" });
    expect(buildRecommendationExplanation(result, "zh-CN")).toBe("基本条件合适，不过没有完全碰上当前口味和偏好。");
  });

  it("uses different missing-ingredient wording for one vs many missing ingredients", () => {
    const oneMissing = evaluate({ availableIngredients: requiredIds().slice(0, -1) });
    const severalMissing = evaluate({ availableIngredients: requiredIds().slice(0, 1) });
    expect(buildRecommendationExplanation(oneMissing, "zh-CN")).toContain("只缺");
    expect(buildRecommendationExplanation(severalMissing, "zh-CN")).toContain("还缺");
  });
});

describe("safety, reset, and determinism", () => {
  const emptyRepository: IngredientRepository = { getById: () => undefined, list: () => [] };
  const incompleteEngine = new RuleRecommendationEngine(emptyRepository);

  it("excludes incomplete nutrition only when a related hard constraint is active", () => {
    const result = incompleteEngine.rank([target], { maxCalories: 600 })[0];
    expect(result.eligible).toBe(false);
    expect(result.hardFailures[0]).toMatchObject({ criterion: "maxCalories" });
    expect(result.hardFailures[0].reason).toBe("estimate-incomplete");
  });

  it("excludes incomplete cost when budget is active", () => {
    const result = incompleteEngine.rank([target], { maxCost: 20 })[0];
    expect(result.eligible).toBe(false);
    expect(result.hardFailures[0]).toMatchObject({ criterion: "maxCost" });
  });

  it("provides a complete inactive reset state", () => {
    const reset = resetRecommendationCriteria();
    expect(hasActiveCriteria(reset)).toBe(false);
    expect(discoverRecipes(recipes, reset)).toHaveLength(100);
  });

  it("handles an empty recipe collection", () => {
    expect(discoverRecipes([], {})).toEqual([]);
  });

  it("produces deterministic scores", () => {
    const criteria: RecommendationCriteria = { availableIngredients: ["egg", "tomato"], preferredCuisine: "chinese", preferredTags: ["quick"], flavorPreferences: ["tangy-refreshing"] };
    expect(evaluate(criteria).score).toBe(evaluate(criteria).score);
    expect(evaluate(criteria).scoreBreakdown).toEqual(evaluate(criteria).scoreBreakdown);
  });

  it("uses score, ingredient fit, time, then id for deterministic ordering", () => {
    const later: Recipe = { ...target, id: "z-stable", slug: "z-stable" };
    const earlier: Recipe = { ...target, id: "a-stable", slug: "a-stable" };
    expect(engine.rank([later, earlier], {}).map(({ recipe }) => recipe.id)).toEqual(["a-stable", "z-stable"]);
  });

  it("evaluates all 100 recipes without non-finite scores or breakdown values", () => {
    const results = engine.rank(recipes, {
      availableIngredients: ["egg", "rice", "salt"],
      preferredCuisine: "chinese",
      preferredTags: ["quick"],
      preferredMethods: ["stir-fry", "steam"],
      flavorPreferences: ["fresh-spicy", "warming"],
    });
    expect(results).toHaveLength(100);
    expect(results.every((result) => Number.isFinite(result.score) && Number.isFinite(result.ingredientMatch.fit) &&
      Object.values(result.scoreBreakdown).every((item) => Number.isFinite(item.score) && Number.isFinite(item.contribution)))).toBe(true);
  });
});
