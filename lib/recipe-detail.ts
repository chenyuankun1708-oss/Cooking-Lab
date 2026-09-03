import { recipes as recipeDataset } from "@/data/recipes";
import type { Recipe } from "@/types/recipe";
import { calculateCost } from "./cost";
import { getHeatLabel, getIngredientFallbackLabel, getToolLabel, getUnitLabel } from "./display-labels";
import { formatCalories, formatCost, formatMacro, formatMass, formatProtein, formatSodium, formatTime } from "./formatters";
import { type IngredientRepository, localIngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";

export interface RecipeDetailViewModel {
  recipe: Recipe;
  ingredients: Array<{ id: string; name: string; amount: string; note?: string; optional: boolean }>;
  tools: string[];
  times: { prep: string; cook: string; total: string };
  nutrition: Array<{ label: string; value: string }>;
  limits: Array<{ label: string; value: string; scope: string }>;
  cost: { whole: string; perServing: string };
  steps: Array<{ order: number; instruction: string; why: string; heat?: string; duration?: string }>;
  warnings: string[];
}

export function getRecipeBySlug(slug: string, recipes: readonly Recipe[] = recipeDataset): Recipe | undefined {
  return recipes.find((recipe) => recipe.slug === slug);
}

export function createRecipeDetailViewModel(
  recipe: Recipe,
  repository: IngredientRepository = localIngredientRepository,
): RecipeDetailViewModel {
  const nutrition = calculateNutrition(recipe.ingredients, repository);
  const cost = calculateCost(recipe.ingredients, repository);
  const perServing = (value: number) => value / recipe.servings;
  const warnings = [
    ...nutrition.warnings.map((warning) => warning.message),
    ...cost.warnings.map((warning) => warning.message),
  ];

  return {
    recipe,
    ingredients: recipe.ingredients.map((item) => ({
      id: item.ingredientId,
      name: repository.getById(item.ingredientId)?.name ?? getIngredientFallbackLabel(item.ingredientId),
      amount: `${item.amount} ${getUnitLabel(item.unit)}`,
      note: item.note,
      optional: Boolean(item.optional),
    })),
    tools: recipe.tools.map(getToolLabel),
    times: {
      prep: formatTime(recipe.cooking.prepTime),
      cook: formatTime(recipe.cooking.cookTime),
      total: formatTime(recipe.cooking.totalTime),
    },
    nutrition: [
      { label: "热量", value: formatCalories(perServing(nutrition.total.calories), nutrition.complete) },
      { label: "蛋白质", value: formatProtein(perServing(nutrition.total.protein), nutrition.complete) },
      { label: "脂肪", value: formatMacro(perServing(nutrition.total.fat), nutrition.complete) },
      { label: "碳水", value: formatMacro(perServing(nutrition.total.carbs), nutrition.complete) },
      { label: "膳食纤维", value: formatMacro(perServing(nutrition.total.fiber), nutrition.complete) },
      { label: "钠", value: formatSodium(perServing(nutrition.total.sodium), nutrition.complete) },
    ],
    limits: [
      { label: "用油", value: formatMass(recipe.cooking.oil), scope: "整道" },
      { label: "盐", value: formatMass(recipe.cooking.salt), scope: "整道" },
      { label: "添加糖", value: formatMass(recipe.cooking.addedSugar), scope: "整道" },
      { label: "钠", value: formatSodium(perServing(nutrition.total.sodium), nutrition.complete), scope: "每份估算" },
    ],
    cost: {
      whole: formatCost(cost.estimated, cost.complete),
      perServing: formatCost(perServing(cost.estimated), cost.complete),
    },
    steps: recipe.steps.map((step) => ({
      order: step.order,
      instruction: step.instruction,
      why: step.why,
      heat: step.heat === "none" ? undefined : getHeatLabel(step.heat),
      duration: step.duration === undefined ? undefined : `约 ${formatTime(step.duration)}`,
    })),
    warnings,
  };
}
