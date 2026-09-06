import type { Recipe } from "@/types/recipe";
import { applyM9BatchAOverride, m9BatchAOverrides } from "./m9-recipes-batch-a";
import { applyM9BatchBOverride, m9BatchBOverrides } from "./m9-recipes-batch-b";

export const m9PromotedRecipeSlugs = Object.freeze([
  ...Object.keys(m9BatchAOverrides),
  ...Object.keys(m9BatchBOverrides),
]);

export function applyM9RecipePublicationOverrides(recipes: readonly Recipe[]): Recipe[] {
  const available = new Set(recipes.map((recipe) => recipe.slug));
  const missing = m9PromotedRecipeSlugs.filter((slug) => !available.has(slug));
  if (missing.length) {
    throw new Error(`M9 publication overrides reference unknown recipes: ${missing.join(", ")}`);
  }

  return recipes.map((recipe) => applyM9BatchBOverride(applyM9BatchAOverride(recipe)));
}
