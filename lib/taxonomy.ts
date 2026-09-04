import { browseTags, cuisines, dietaryTags, dishTypes, flavorCharacteristics, getTaxonomyLabel, mealOccasions, regions, subCuisines, tasteProfiles, techniques } from "@/data/taxonomy";
import type { Recipe } from "@/types/recipe";
import type { SupportedLocale } from "@/types/taxonomy";
import { localIngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";

const HIGH_PROTEIN_PER_SERVING = 22;
const HIGH_FIBER_PER_SERVING = 8;
const LOW_OIL_PER_SERVING = 1.5;
const QUICK_TOTAL_TIME_MAX_MINUTES = 20;

export function getRecipeCuisineId(recipe: Recipe): string {
  return recipe.taxonomy.cuisine.cuisineId;
}

export function getRecipeCuisineLabel(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string {
  return getTaxonomyLabel("cuisines", recipe.taxonomy.cuisine.cuisineId, locale) ?? recipe.taxonomy.cuisine.cuisineId;
}

export function getRecipeSubCuisineLabel(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string | undefined {
  return getTaxonomyLabel("subCuisines", recipe.taxonomy.cuisine.subCuisineId, locale);
}

export function getRecipePrimaryTechniqueId(recipe: Recipe): string {
  return recipe.taxonomy.techniques[0];
}

export function getRecipeTechniqueLabels(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string[] {
  return recipe.taxonomy.techniques.map((techniqueId) => getTaxonomyLabel("techniques", techniqueId, locale) ?? techniqueId);
}

export function getRecipePrimaryTechniqueLabel(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string {
  return getTaxonomyLabel("techniques", getRecipePrimaryTechniqueId(recipe), locale) ?? getRecipePrimaryTechniqueId(recipe);
}

export function getRecipeDishTypeId(recipe: Recipe): string {
  return recipe.taxonomy.mealType.dishTypeId;
}

export function getRecipeDishTypeLabel(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string {
  return getTaxonomyLabel("dishTypes", recipe.taxonomy.mealType.dishTypeId, locale) ?? recipe.taxonomy.mealType.dishTypeId;
}

export function getRecipeMealOccasionLabels(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string[] {
  return (recipe.taxonomy.mealType.mealOccasionIds ?? [])
    .map((occasionId) => getTaxonomyLabel("mealOccasions", occasionId, locale) ?? occasionId);
}

export function getRecipeLegacyCategoryLabel(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string {
  if (recipe.taxonomy.mealType.mealOccasionIds?.includes("breakfast")) {
    return getTaxonomyLabel("mealOccasions", "breakfast", locale) ?? "breakfast";
  }
  return getRecipeDishTypeLabel(recipe, locale);
}

export function getRecipeOriginLabel(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string | undefined {
  const country = getTaxonomyLabel("countries", recipe.taxonomy.origin?.countryId, locale);
  const region = getTaxonomyLabel("regions", recipe.taxonomy.origin?.regionId, locale);
  return [country, region].filter((value): value is string => Boolean(value)).join(" / ") || undefined;
}

export function getRecipeTagIds(recipe: Recipe): string[] {
  const tags = new Set<string>([
    ...(recipe.taxonomy.dietaryTagIds ?? []),
    ...(recipe.taxonomy.browseTagIds ?? []),
  ]);

  if (recipe.taxonomy.mealType.dishTypeId === "staple") tags.add("staple");
  if (recipe.taxonomy.mealType.mealOccasionIds?.includes("breakfast")) tags.add("breakfast");
  if (recipe.cooking.totalTime <= QUICK_TOTAL_TIME_MAX_MINUTES) tags.add("quick");

  const nutrition = calculateNutrition(recipe.ingredients, localIngredientRepository);
  if (nutrition.complete) {
    const proteinPerServing = nutrition.total.protein / recipe.servings;
    const fiberPerServing = nutrition.total.fiber / recipe.servings;
    if (proteinPerServing >= HIGH_PROTEIN_PER_SERVING) tags.add("high-protein");
    if (fiberPerServing >= HIGH_FIBER_PER_SERVING) tags.add("high-fiber");
  }

  if (recipe.cooking.oil / recipe.servings <= LOW_OIL_PER_SERVING) tags.add("low-oil");
  if (recipe.cooking.addedSugar === 0) tags.add("no-added-sugar");

  return [...tags];
}

export function getRecipeTagLabels(recipe: Recipe, locale: SupportedLocale = "zh-CN"): string[] {
  return getRecipeTagIds(recipe).map((tagId) => {
    if (dietaryTags[tagId]) return dietaryTags[tagId].label[locale];
    if (browseTags[tagId]) return browseTags[tagId].label[locale];
    if (mealOccasions[tagId]) return mealOccasions[tagId].label[locale];
    if (dishTypes[tagId]) return dishTypes[tagId].label[locale];
    return tagId;
  });
}

export function listRecipeCuisineOptions(recipes: readonly Recipe[]) {
  return [...new Set(recipes.map((recipe) => recipe.taxonomy.cuisine.cuisineId))]
    .sort()
    .map((id) => ({ id, label: cuisines[id]?.label["zh-CN"] ?? id }));
}

export function listRecipeTechniqueOptions(recipes: readonly Recipe[]) {
  return [...new Set(recipes.flatMap((recipe) => recipe.taxonomy.techniques))]
    .sort()
    .map((id) => ({ id, label: techniques[id]?.label["zh-CN"] ?? id }));
}

export function getFlavorProfileLabels(recipe: Recipe, locale: SupportedLocale = "zh-CN") {
  return {
    tastes: (recipe.taxonomy.flavorProfile?.tasteIds ?? []).map((id) => tasteProfiles[id]?.label[locale] ?? id),
    characteristics: (recipe.taxonomy.flavorProfile?.characteristicIds ?? []).map((id) => flavorCharacteristics[id]?.label[locale] ?? id),
  };
}

export function getCuisineHierarchyLabels(recipe: Recipe, locale: SupportedLocale = "zh-CN") {
  return {
    cuisine: cuisines[recipe.taxonomy.cuisine.cuisineId]?.label[locale] ?? recipe.taxonomy.cuisine.cuisineId,
    subCuisine: recipe.taxonomy.cuisine.subCuisineId
      ? subCuisines[recipe.taxonomy.cuisine.subCuisineId]?.label[locale] ?? recipe.taxonomy.cuisine.subCuisineId
      : undefined,
    region: recipe.taxonomy.origin?.regionId ? regions[recipe.taxonomy.origin.regionId]?.label[locale] ?? recipe.taxonomy.origin.regionId : undefined,
  };
}
