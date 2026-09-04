import { recipes as recipeDataset } from "@/data/recipes";
import type { Recipe, RecipeIngredient } from "@/types/recipe";
import { calculateCost } from "./cost";
import { type IngredientRepository, localIngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";

export interface RecipeDetailModel {
  recipe: Recipe;
  ingredients: Array<{
    id: string;
    name?: string;
    amount: number;
    unit: RecipeIngredient["unit"];
    note?: string;
    optional: boolean;
  }>;
  times: { prepMinutes: number; cookMinutes: number; totalMinutes: number };
  nutritionPerServing: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sodium: number;
    complete: boolean;
  };
  limits: {
    oilGramsWhole: number;
    saltGramsWhole: number;
    addedSugarGramsWhole: number;
    sodiumMgPerServing: number;
    sodiumComplete: boolean;
  };
  cost: { wholeEstimated: number; perServingEstimated: number; complete: boolean };
  warnings: string[];
}

export function getRecipeBySlug(slug: string, recipes: readonly Recipe[] = recipeDataset): Recipe | undefined {
  return recipes.find((recipe) => recipe.slug === slug);
}

export function buildRecipeDetail(
  recipe: Recipe,
  repository: IngredientRepository = localIngredientRepository,
): RecipeDetailModel {
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
      name: repository.getById(item.ingredientId)?.name,
      amount: item.amount,
      unit: item.unit,
      note: item.note,
      optional: Boolean(item.optional),
    })),
    times: {
      prepMinutes: recipe.cooking.prepTime,
      cookMinutes: recipe.cooking.cookTime,
      totalMinutes: recipe.cooking.totalTime,
    },
    nutritionPerServing: {
      calories: perServing(nutrition.total.calories),
      protein: perServing(nutrition.total.protein),
      fat: perServing(nutrition.total.fat),
      carbs: perServing(nutrition.total.carbs),
      fiber: perServing(nutrition.total.fiber),
      sodium: perServing(nutrition.total.sodium),
      complete: nutrition.complete,
    },
    limits: {
      oilGramsWhole: recipe.cooking.oil,
      saltGramsWhole: recipe.cooking.salt,
      addedSugarGramsWhole: recipe.cooking.addedSugar,
      sodiumMgPerServing: perServing(nutrition.total.sodium),
      sodiumComplete: nutrition.complete,
    },
    cost: {
      wholeEstimated: cost.estimated,
      perServingEstimated: perServing(cost.estimated),
      complete: cost.complete,
    },
    warnings,
  };
}
