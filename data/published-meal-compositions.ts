import { ingredients } from "./ingredients";
import { decisionContextValueAllowlist } from "./decision-context";
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
import { toMealCompositionOptions } from "@/lib/decision-context";
import type { IngredientRepository } from "@/lib/ingredient-repository";
import type { DecisionContext } from "@/types/decision-context";
import type { SupportedLocale } from "@/types/localization";
import type { MealConstraintId } from "@/types/pairing";

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

export interface PublishedPairingOptions {
  decisionContext?: DecisionContext;
  relaxedConstraintIds?: readonly MealConstraintId[];
}

export function getPublishedPairingExperience(
  slug: string,
  locale: SupportedLocale,
  { decisionContext = {}, relaxedConstraintIds = [] }: PublishedPairingOptions = {},
) {
  const constrainedOptions = toMealCompositionOptions(decisionContext, decisionContextValueAllowlist);
  const appliedRelaxationIds = relaxedConstraintIds.filter((id) =>
    id === "estimated-elapsed-time"
      ? constrainedOptions.maxTotalTimeMinutes !== undefined
      : Boolean(constrainedOptions.availableToolIds?.length),
  );
  const mealOptions = applyConstraintRelaxations(constrainedOptions, appliedRelaxationIds);
  const defaultComposition = composePublishedMeal(slug, locale, { ...mealOptions, excludeAlcohol: true });
  if (!defaultComposition) return undefined;
  const { result, storyContext, library } = defaultComposition;
  const defaultModel = buildMealCompositionPageModel(result, storyContext, locale);
  const inclusive = composeMealsAround(result.anchor, library, { ingredientRepository }, { ...mealOptions, excludeAlcohol: false, limit: 4 });
  const alcoholicMeal = [inclusive.primary, ...inclusive.alternatives]
    .find((meal) => meal?.items.some(({ item }) => item.itemType === "alcoholic-drink" && item.id !== result.anchor.id));
  const alcoholicAlternative = alcoholicMeal
    ? buildMealCompositionPageModel({ anchor: result.anchor, primary: alcoholicMeal, alternatives: [], relaxationOptions: [] }, storyContext, locale).primary
    : undefined;
  const nonAlcoholicItem = result.primary ? findNonAlcoholicDrinkAlternative(result.primary, library) : undefined;
  return {
    ...defaultModel,
    alcoholicAlternative,
    nonAlcoholicAlternative: nonAlcoholicItem ? buildCulinaryItemSummary(nonAlcoholicItem, storyContext) : undefined,
    anchorIsAlcoholic: result.anchor.itemType === "alcoholic-drink",
    appliedRelaxationIds: [...new Set(appliedRelaxationIds)],
  };
}

function composePublishedMeal(slug: string, locale: SupportedLocale, options: MealCompositionOptions) {
  const anchor = getPublishedCulinaryItemForLocaleBySlug(slug, locale);
  if (!anchor) return undefined;
  const library = getPublishedCulinaryItemsForLocale(locale);
  const result = composeMealsAround(anchor, library, { ingredientRepository }, options);
  return { result, library, storyContext: getStoryExperienceContext(locale) };
}

function applyConstraintRelaxations(
  options: Pick<MealCompositionOptions, "maxTotalTimeMinutes" | "availableToolIds">,
  relaxedConstraintIds: readonly MealConstraintId[],
): Pick<MealCompositionOptions, "maxTotalTimeMinutes" | "availableToolIds"> {
  const relaxed = new Set(relaxedConstraintIds);
  return {
    ...(!relaxed.has("estimated-elapsed-time") && options.maxTotalTimeMinutes !== undefined
      ? { maxTotalTimeMinutes: options.maxTotalTimeMinutes }
      : {}),
    ...(!relaxed.has("available-tools") && options.availableToolIds?.length
      ? { availableToolIds: options.availableToolIds }
      : {}),
  };
}
