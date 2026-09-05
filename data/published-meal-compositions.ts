import { ingredients } from "./ingredients";
import {
  getPublishedCulinaryItemForLocaleBySlug,
  getPublishedCulinaryItemsForLocale,
} from "./published-culinary-items";
import { getStoryExperienceContext } from "./published-stories";
import { buildMealCompositionPageModel } from "@/lib/meal-composition-display";
import { buildCulinaryItemSummary } from "@/lib/story-experience";
import {
  composeMealsAround,
  findNonAlcoholicDrinkAlternative,
  type MealCompositionOptions,
} from "@/lib/meal-composition";
import type { IngredientRepository } from "@/lib/ingredient-repository";
import type { SupportedLocale } from "@/types/localization";

const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
const ingredientRepository: IngredientRepository = {
  getById: (id) => ingredientById.get(id),
  list: () => ingredients,
};

export function getPublishedMealComposition(
  slug: string,
  locale: SupportedLocale,
  options: MealCompositionOptions = {},
) {
  const composition = composePublishedMeal(slug, locale, options);
  return composition
    ? buildMealCompositionPageModel(composition.result, composition.storyContext, locale)
    : undefined;
}

export function getPublishedPairingExperience(slug: string, locale: SupportedLocale) {
  const defaultComposition = composePublishedMeal(slug, locale, { excludeAlcohol: true });
  if (!defaultComposition) return undefined;
  const { result, storyContext, library } = defaultComposition;
  const defaultModel = buildMealCompositionPageModel(result, storyContext, locale);
  const inclusive = composeMealsAround(result.anchor, library, { ingredientRepository }, { excludeAlcohol: false, limit: 4 });
  const alcoholicMeal = [inclusive.primary, ...inclusive.alternatives]
    .find((meal) => meal?.items.some(({ item }) => item.itemType === "alcoholic-drink" && item.id !== result.anchor.id));
  const alcoholicAlternative = alcoholicMeal
    ? buildMealCompositionPageModel({ anchor: result.anchor, primary: alcoholicMeal, alternatives: [] }, storyContext, locale).primary
    : undefined;
  const nonAlcoholicItem = result.primary ? findNonAlcoholicDrinkAlternative(result.primary, library) : undefined;
  return {
    ...defaultModel,
    alcoholicAlternative,
    nonAlcoholicAlternative: nonAlcoholicItem ? buildCulinaryItemSummary(nonAlcoholicItem, storyContext) : undefined,
    anchorIsAlcoholic: result.anchor.itemType === "alcoholic-drink",
  };
}

function composePublishedMeal(slug: string, locale: SupportedLocale, options: MealCompositionOptions) {
  const anchor = getPublishedCulinaryItemForLocaleBySlug(slug, locale);
  if (!anchor) return undefined;
  const library = getPublishedCulinaryItemsForLocale(locale);
  const result = composeMealsAround(anchor, library, { ingredientRepository }, options);
  return { result, library, storyContext: getStoryExperienceContext(locale) };
}
