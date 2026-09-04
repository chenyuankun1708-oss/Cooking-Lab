import type { Ingredient } from "@/types/ingredient";
import type { RecipeImage } from "@/types/image";
import type { Recipe } from "@/types/recipe";
import { validateImageAssets, validateRecipeImageReferences } from "./image-validation";
import { validateIngredients } from "./ingredient-validation";
import { validateRecipes } from "./recipe-validation";

export interface DatasetValidationIssue {
  scope: "ingredient" | "recipe" | "image";
  itemId: string;
  field: string;
  message: string;
}

export function validateDataset(ingredients: Ingredient[], recipes: Recipe[], images: readonly RecipeImage[] = []): DatasetValidationIssue[] {
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
    ...validateImageAssets(images).map((issue) => ({
      scope: "image" as const,
      itemId: issue.imageId,
      field: issue.field,
      message: issue.message,
    })),
    ...validateRecipeImageReferences(recipes, images).map((issue) => ({
      scope: "recipe" as const,
      itemId: issue.recipeId,
      field: issue.field,
      message: issue.message,
    })),
  ];
}
