import { getIngredientLabel } from "./localization/ingredients";
import { getLocalizedCulinaryCopy } from "./localization/public-culinary";
import { getLocalizedRecipe } from "./localization/public-recipes";
import { ingredients } from "./ingredients";
import { mealPlanStepMetadata } from "./meal-plan-metadata";
import {
  getPublishedCulinaryItemForLocaleBySlug,
  getPublishedCulinaryItemsForLocale,
} from "./published-culinary-items";
import { getPublishedRecipeBySlug } from "./published-recipes";
import { buildMealPlan, type MealPlanBuildItem, type MealPlanStepMetadataRegistry } from "@/lib/meal-plan";
import { resolveTranslation } from "@/lib/localization";
import { getToolLabel } from "@/lib/tool-labels";
import type { SupportedLocale } from "@/types/localization";
import type { MealPlanSharePayloadV1, MealPlanV1 } from "@/types/meal-plan";

export interface MealPlanCatalog {
  buildItems: MealPlanBuildItem[];
  itemLabels: Record<string, { name: string; slug: string; defaultServings: number }>;
  ingredientLabels: Record<string, string>;
  taskLabels: Record<string, { instruction: string; stateCue?: string }>;
  toolLabels: Record<string, string>;
  stepMetadata: MealPlanStepMetadataRegistry;
}

export function getPublishedMealPlanCatalog(
  locale: SupportedLocale,
  itemIds?: readonly string[],
): MealPlanCatalog {
  const selectedIds = itemIds ? new Set(itemIds) : undefined;
  const items = getPublishedCulinaryItemsForLocale(locale)
    .filter((item) => !selectedIds || selectedIds.has(item.id));
  const buildItems: MealPlanBuildItem[] = [];
  const itemLabels: MealPlanCatalog["itemLabels"] = {};
  const ingredientLabels: Record<string, string> = {};
  const taskLabels: MealPlanCatalog["taskLabels"] = {};
  const toolLabels: Record<string, string> = {};
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const item of items) {
    buildItems.push({ id: item.id, slug: item.slug, preparation: item.preparation });
    const sourceRecipe = getPublishedRecipeBySlug(item.slug);
    const recipe = sourceRecipe ? getLocalizedRecipe(sourceRecipe, locale) : undefined;
    const nativeCopy = getLocalizedCulinaryCopy(item.id, locale);
    const fallbackCopy = resolveTranslation(item.content, locale).value;
    const name = recipe?.name ?? nativeCopy?.name ?? fallbackCopy.name;
    const defaultServings = "yield" in item.preparation && item.preparation.yield.unit === "serving"
      ? item.preparation.yield.amount
      : 1;
    itemLabels[item.id] = { name, slug: item.slug, defaultServings };

    if ("inputs" in item.preparation) {
      for (const input of item.preparation.inputs) {
        const ingredient = ingredientById.get(input.ingredientId);
        ingredientLabels[input.ingredientId] = getIngredientLabel(input.ingredientId, ingredient?.name, locale);
      }
      const localizedSteps: Array<{ instruction: string; stateCue?: string }> = recipe?.steps.map((step) => ({ instruction: step.instruction }))
        ?? nativeCopy?.steps
        ?? item.preparation.steps.map((step) => resolveTranslation(step.content, locale).value);
      item.preparation.steps.forEach((step, index) => {
        const copy = localizedSteps[index] ?? resolveTranslation(step.content, locale).value;
        taskLabels[`${item.id}:step:${step.order}`] = {
          instruction: copy.instruction,
          ...(copy.stateCue ? { stateCue: copy.stateCue } : {}),
        };
      });
      for (const toolId of item.preparation.toolIds) toolLabels[toolId] = getToolLabel(toolId, locale);
    } else {
      taskLabels[`${item.id}:serve`] = {
        instruction: locale === "zh-CN" ? `准备并上桌：${name}` : `Prepare and serve: ${name}`,
      };
      if ("toolIds" in item.preparation) {
        for (const toolId of item.preparation.toolIds) toolLabels[toolId] = getToolLabel(toolId, locale);
      }
    }
  }
  const stepMetadata = Object.fromEntries(items.flatMap((item) => {
    const metadata = mealPlanStepMetadata[item.id as keyof typeof mealPlanStepMetadata];
    return metadata ? [[item.id, metadata] as const] : [];
  }));
  return { buildItems, itemLabels, ingredientLabels, taskLabels, toolLabels, stepMetadata };
}

export function buildPublishedMealPlan(
  payload: MealPlanSharePayloadV1,
  locale: SupportedLocale,
): MealPlanV1 | undefined {
  const selections = payload.items.map(({ slug, servings }) => {
    const item = getPublishedCulinaryItemForLocaleBySlug(slug, locale);
    return item ? { itemId: item.id, servings } : undefined;
  });
  if (selections.some((selection) => !selection)) return undefined;
  return buildMealPlan(getPublishedCulinaryItemsForLocale(locale), selections as Array<{ itemId: string; servings: number }>, { stepMetadata: mealPlanStepMetadata });
}
