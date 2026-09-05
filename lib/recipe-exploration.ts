import type { Recipe } from "@/types/recipe";
import type { RecommendationResult } from "@/types/recommendation";
import { flavorPreferenceIds, type FlavorPreferenceId } from "@/types/flavor";
import type { CookingTimeBandId } from "./cooking-time";
import { cookingTimeBands, getCookingTimeBand } from "./cooking-time";
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

const catalogQueryOrder = ["q", "cuisine", "origin", "technique", "dish", "time", "pace", "flavor"] as const;

export function parseRecipeCatalogFilters(
  params: URLSearchParams,
  recipes: readonly Recipe[],
): RecipeCatalogFilters {
  const cuisines = new Set(recipes.map(({ taxonomy }) => taxonomy.cuisine.cuisineId));
  const countries = new Set(recipes.flatMap(({ taxonomy }) => taxonomy.origin?.countryId ?? []));
  const regions = new Set(recipes.flatMap(({ taxonomy }) => taxonomy.origin?.regionId ?? []));
  const techniques = new Set(recipes.flatMap(({ taxonomy }) => taxonomy.techniques));
  const dishTypes = new Set(recipes.map(({ taxonomy }) => taxonomy.mealType.dishTypeId));
  const query = first(params.getAll("q"))?.trim().slice(0, 120) || undefined;
  const cuisineId = allowedFirst(params.getAll("cuisine"), cuisines);
  const techniqueId = allowedFirst(params.getAll("technique"), techniques);
  const dishTypeId = allowedFirst(params.getAll("dish"), dishTypes);
  const origin = first(params.getAll("origin"));
  const maxTimeValue = Number(first(params.getAll("time")));
  const maxTime = [20, 30, 45, 60].includes(maxTimeValue) ? maxTimeValue : undefined;
  const timeBandValue = first(params.getAll("pace"));
  const timeBandId = cookingTimeBands.some((band) => band.id === timeBandValue)
    ? timeBandValue as CookingTimeBandId
    : undefined;
  const flavorValue = first(params.getAll("flavor"));
  const flavorPreferenceId = flavorPreferenceIds.includes(flavorValue as FlavorPreferenceId)
    ? flavorValue as FlavorPreferenceId
    : undefined;

  return {
    ...(query ? { query } : {}),
    ...(cuisineId ? { cuisineId } : {}),
    ...(origin?.startsWith("country:") && countries.has(origin.slice("country:".length))
      ? { countryId: origin.slice("country:".length) }
      : {}),
    ...(origin?.startsWith("region:") && regions.has(origin.slice("region:".length))
      ? { regionId: origin.slice("region:".length) }
      : {}),
    ...(techniqueId ? { techniqueId } : {}),
    ...(dishTypeId ? { dishTypeId } : {}),
    ...(maxTime !== undefined ? { maxTime } : {}),
    ...(timeBandId ? { timeBandId } : {}),
    ...(flavorPreferenceId ? { flavorPreferenceId } : {}),
  };
}

export function serializeRecipeCatalogFilters(filters: RecipeCatalogFilters): URLSearchParams {
  const values: Record<(typeof catalogQueryOrder)[number], string | undefined> = {
    q: filters.query?.trim().slice(0, 120) || undefined,
    cuisine: filters.cuisineId,
    origin: filters.countryId ? `country:${filters.countryId}` : filters.regionId ? `region:${filters.regionId}` : undefined,
    technique: filters.techniqueId,
    dish: filters.dishTypeId,
    time: filters.maxTime?.toString(),
    pace: filters.timeBandId,
    flavor: filters.flavorPreferenceId,
  };
  const params = new URLSearchParams();
  for (const key of catalogQueryOrder) {
    if (values[key]) params.set(key, values[key]);
  }
  return params;
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

function first(values: readonly string[]): string | undefined {
  return values[0];
}

function allowedFirst(values: readonly string[], allowed: ReadonlySet<string>): string | undefined {
  return values.find((value) => allowed.has(value));
}
