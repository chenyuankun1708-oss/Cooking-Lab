import type { Ingredient } from "@/types/ingredient";
import type { Recipe } from "@/types/recipe";
import { validateIngredients } from "./ingredient-validation";
import { validateRecipes } from "./recipe-validation";

export interface DatasetValidationIssue {
  scope: "ingredient" | "recipe";
  itemId: string;
  field: string;
  message: string;
}

export function validateDataset(ingredients: Ingredient[], recipes: Recipe[]): DatasetValidationIssue[] {
  return [
    ...validateIngredients(ingredients).map((issue) => ({
      scope: "ingredient" as const,
      itemId: issue.ingredientId,
      field: issue.field,
      message: issue.message,
    })),
    ...validateRecipes(recipes, ingredients).map((issue) => ({
      scope: "recipe" as const,
      itemId: issue.recipeId,
      field: issue.field,
      message: issue.message,
    })),
  ];
}
