import type { Recipe } from "@/types/recipe";
import type { RecommendationResult } from "@/types/recommendation";
import type { FlavorPreferenceId } from "@/types/flavor";
import type { CookingTimeBandId } from "./cooking-time";
import { getCookingTimeBand } from "./cooking-time";
import { scoreFlavorPreferences } from "./flavor";
import { recommendationEngine } from "./recommendation";

export interface RecipeCatalogFilters {
  query?: string;
  cuisineId?: string;
  countryId?: string;
  regionId?: string;
  techniqueId?: string;
  dishTypeId?: string;
  maxTime?: number;
  timeBandId?: CookingTimeBandId;
  flavorPreferenceId?: FlavorPreferenceId;
}

export function exploreRecipeCatalog(
  recipes: readonly Recipe[],
  filters: RecipeCatalogFilters,
): RecommendationResult[] {
  const query = filters.query?.trim().toLocaleLowerCase("zh-CN");
  return recommendationEngine.rank([...recipes], {}).filter(({ recipe }) => {
    if (query && !`${recipe.name} ${recipe.description}`.toLocaleLowerCase("zh-CN").includes(query)) return false;
    if (filters.cuisineId && recipe.taxonomy.cuisine.cuisineId !== filters.cuisineId) return false;
    if (filters.countryId && recipe.taxonomy.origin?.countryId !== filters.countryId) return false;
    if (filters.regionId && recipe.taxonomy.origin?.regionId !== filters.regionId) return false;
    if (filters.techniqueId && !recipe.taxonomy.techniques.includes(filters.techniqueId)) return false;
    if (filters.dishTypeId && recipe.taxonomy.mealType.dishTypeId !== filters.dishTypeId) return false;
    if (filters.maxTime !== undefined && recipe.cooking.totalTime > filters.maxTime) return false;
    if (filters.timeBandId && getCookingTimeBand(recipe.cooking.totalTime).id !== filters.timeBandId) return false;
    if (filters.flavorPreferenceId && scoreFlavorPreferences(recipe.flavor, [filters.flavorPreferenceId]).score < 0.6) return false;
    return true;
  });
}
