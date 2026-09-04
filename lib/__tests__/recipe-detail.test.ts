import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import { calculateCost } from "../cost";
import { getHeatLabel, getToolLabel, getUnitLabel } from "../display-labels";
import { formatCalories, formatCost, formatMacro, formatMass, formatSodium } from "../formatters";
import type { IngredientRepository } from "../ingredient-repository";
import { localIngredientRepository } from "../ingredient-repository";
import { calculateNutrition } from "../nutrition";
import { buildRecipeDetailDisplay } from "../recipe-detail-display";
import { buildRecipeDetail, getRecipeBySlug } from "../recipe-detail";

const createRecipeDetailViewModel = (recipe: (typeof recipes)[number], repository = localIngredientRepository) =>
  buildRecipeDetailDisplay(buildRecipeDetail(recipe, repository));

describe("recipe catalog and detail presentation", () => {
  it("has 100 unique recipe slugs that all resolve", () => {
    const slugs = recipes.map((recipe) => recipe.slug);
    expect(slugs).toHaveLength(100);
    expect(new Set(slugs)).toHaveLength(100);
    expect(slugs.every((slug) => getRecipeBySlug(slug)?.slug === slug)).toBe(true);
  });

  it("returns undefined for an invalid slug", () => {
    expect(getRecipeBySlug("not-a-real-recipe")).toBeUndefined();
  });

  it("resolves ingredient ids to human-readable names and original units", () => {
    const detail = createRecipeDetailViewModel(recipes[0]);
    expect(detail.ingredients[0]).toMatchObject({ name: "鸡蛋", amount: "3 个" });
    expect(detail.ingredients.every((ingredient) => ingredient.name !== ingredient.id)).toBe(true);
  });

  it("keeps the application model numeric and leaves display formatting to the web adapter", () => {
    const model = buildRecipeDetail(recipes[0]);
    expect(model.times).toEqual({
      prepMinutes: recipes[0].cooking.prepTime,
      cookMinutes: recipes[0].cooking.cookTime,
      totalMinutes: recipes[0].cooking.totalTime,
    });
    expect(model.ingredients[0]).toMatchObject({ amount: 3, unit: "piece" });
    expect(model.cost.wholeEstimated).toEqual(expect.any(Number));
    expect(JSON.stringify(model)).not.toContain("分钟");
    expect(JSON.stringify(model)).not.toContain("预计 ¥");
  });

  it("formats nutrition on a per-serving basis", () => {
    const recipe = recipes[0];
    const calculation = calculateNutrition(recipe.ingredients, localIngredientRepository);
    const detail = createRecipeDetailViewModel(recipe);
    expect(detail.nutrition.find(({ label }) => label === "热量")?.value)
      .toBe(formatCalories(calculation.total.calories / recipe.servings));
    expect(detail.nutrition.find(({ label }) => label === "蛋白质")?.value)
      .toBe(formatMacro(calculation.total.protein / recipe.servings));
  });

  it("formats whole-recipe and per-serving estimated costs", () => {
    const recipe = recipes[0];
    const calculation = calculateCost(recipe.ingredients, localIngredientRepository);
    const detail = createRecipeDetailViewModel(recipe);
    expect(detail.cost.whole).toBe(formatCost(calculation.estimated));
    expect(detail.cost.perServing).toBe(formatCost(calculation.estimated / recipe.servings));
  });

  it("does not disguise incomplete nutrition or cost as zero", () => {
    const emptyRepository: IngredientRepository = { getById: () => undefined, list: () => [] };
    const detail = createRecipeDetailViewModel(recipes[0], emptyRepository);
    expect(detail.nutrition.every(({ value }) => value === "估算不完整")).toBe(true);
    expect(detail.cost).toEqual({ whole: "估算不完整", perServing: "估算不完整" });
    expect(detail.warnings.length).toBeGreaterThan(0);
  });

  it("maps heat and tool machine values consistently", () => {
    const uniqueTools = new Set(recipes.flatMap((recipe) => recipe.tools));
    expect(getHeatLabel("low")).toBe("小火");
    expect(getHeatLabel("medium")).toBe("中火");
    expect(getHeatLabel("high")).toBe("大火");
    expect(getHeatLabel("none")).toBeUndefined();
    expect(getToolLabel("frying-pan")).toBe("平底锅");
    expect([...uniqueTools].every((tool) => !getToolLabel(tool).includes("-"))).toBe(true);
    expect(getToolLabel("future-tool")).toBe("future tool");
    expect(getUnitLabel("future-unit")).toBe("future unit");
  });

  it("formats numeric boundaries without emitting NaN or Infinity", () => {
    expect(formatCalories(Number.NaN)).toBe("估算不完整");
    expect(formatCost(Number.POSITIVE_INFINITY)).toBe("估算不完整");
    expect(formatMacro(-1)).toBe("估算不完整");
    expect(formatSodium(12.6)).toBe("约 13 mg");
    expect(formatMass(1.25)).toBe("1.3 克");
  });

  it("creates a complete view model for every recipe", () => {
    const details = recipes.map((recipe) => createRecipeDetailViewModel(recipe));
    expect(details).toHaveLength(100);
    expect(details.every((detail) =>
      detail.ingredients.length > 0 && detail.tools.length > 0 && detail.steps.length > 0 && detail.warnings.length === 0,
    )).toBe(true);
  });
});
