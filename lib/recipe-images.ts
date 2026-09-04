import type { RecipeImage } from "@/types/image";
import type { Recipe } from "@/types/recipe";

export interface RecipeImageFallback {
  initial: string;
  label: string;
}

export function getRecipeHeroImage(recipe: Recipe, images: readonly RecipeImage[]): RecipeImage | undefined {
  if (!recipe.heroImageId) return undefined;
  const image = images.find((item) => item.id === recipe.heroImageId);
  return image?.role === "hero" ? image : undefined;
}

export function getRecipeImageFallback(recipe: Recipe): RecipeImageFallback {
  const label = recipe.name.trim();
  return {
    initial: [...label][0] ?? "食",
    label: label || "Cooking Lab",
  };
}
