import { getHeatLabel, getIngredientFallbackLabel, getToolLabel, getUnitLabel } from "./display-labels";
import { formatCalories, formatCost, formatMacro, formatMass, formatProtein, formatSodium, formatTime } from "./formatters";
import type { RecipeDetailModel } from "./recipe-detail";
import {
  getFlavorProfileLabels,
  getRecipeCuisineLabel,
  getRecipeDishTypeLabel,
  getRecipeMealOccasionLabels,
  getRecipeOriginLabel,
  getRecipeSubCuisineLabel,
  getRecipeTechniqueLabels,
} from "./taxonomy";

export interface RecipeDetailViewModel {
  recipe: RecipeDetailModel["recipe"];
  taxonomy: {
    origin?: string;
    cuisine: string;
    subCuisine?: string;
    dishType: string;
    mealOccasions: string[];
    techniques: string[];
    flavor: {
      tastes: string[];
      characteristics: string[];
    };
  };
  culture?: {
    summary?: string;
    originNote?: string;
    traditionalContext?: string;
    modernContext?: string;
    sources: Array<{ title: string; url?: string; publisher?: string }>;
  };
  ingredients: Array<{ id: string; name: string; amount: string; note?: string; optional: boolean }>;
  tools: string[];
  times: { prep: string; cook: string; total: string };
  nutrition: Array<{ label: string; value: string }>;
  limits: Array<{ label: string; value: string; scope: string }>;
  cost: { whole: string; perServing: string };
  steps: Array<{ order: number; instruction: string; why: string; heat?: string; duration?: string }>;
  warnings: string[];
}

export function buildRecipeDetailDisplay(detail: RecipeDetailModel): RecipeDetailViewModel {
  const { recipe } = detail;

  return {
    recipe,
    taxonomy: {
      origin: getRecipeOriginLabel(recipe),
      cuisine: getRecipeCuisineLabel(recipe),
      subCuisine: getRecipeSubCuisineLabel(recipe),
      dishType: getRecipeDishTypeLabel(recipe),
      mealOccasions: getRecipeMealOccasionLabels(recipe),
      techniques: getRecipeTechniqueLabels(recipe),
      flavor: getFlavorProfileLabels(recipe),
    },
    culture: recipe.culture
      ? {
          summary: recipe.culture.summary,
          originNote: recipe.culture.originNote,
          traditionalContext: recipe.culture.traditionalContext,
          modernContext: recipe.culture.modernContext,
          sources: (recipe.culture.sources ?? []).map((source) => ({
            title: source.title,
            url: source.url,
            publisher: source.publisher,
          })),
        }
      : undefined,
    ingredients: detail.ingredients.map((item) => ({
      id: item.id,
      name: item.name ?? getIngredientFallbackLabel(item.id),
      amount: `${item.amount} ${getUnitLabel(item.unit)}`,
      note: item.note,
      optional: item.optional,
    })),
    tools: recipe.tools.map(getToolLabel),
    times: {
      prep: formatTime(detail.times.prepMinutes),
      cook: formatTime(detail.times.cookMinutes),
      total: formatTime(detail.times.totalMinutes),
    },
    nutrition: [
      { label: "热量", value: formatCalories(detail.nutritionPerServing.calories, detail.nutritionPerServing.complete) },
      { label: "蛋白质", value: formatProtein(detail.nutritionPerServing.protein, detail.nutritionPerServing.complete) },
      { label: "脂肪", value: formatMacro(detail.nutritionPerServing.fat, detail.nutritionPerServing.complete) },
      { label: "碳水", value: formatMacro(detail.nutritionPerServing.carbs, detail.nutritionPerServing.complete) },
      { label: "膳食纤维", value: formatMacro(detail.nutritionPerServing.fiber, detail.nutritionPerServing.complete) },
      { label: "钠", value: formatSodium(detail.nutritionPerServing.sodium, detail.nutritionPerServing.complete) },
    ],
    limits: [
      { label: "用油", value: formatMass(detail.limits.oilGramsWhole), scope: "整道" },
      { label: "盐", value: formatMass(detail.limits.saltGramsWhole), scope: "整道" },
      { label: "添加糖", value: formatMass(detail.limits.addedSugarGramsWhole), scope: "整道" },
      { label: "钠", value: formatSodium(detail.limits.sodiumMgPerServing, detail.limits.sodiumComplete), scope: "每份估算" },
    ],
    cost: {
      whole: formatCost(detail.cost.wholeEstimated, detail.cost.complete),
      perServing: formatCost(detail.cost.perServingEstimated, detail.cost.complete),
    },
    steps: recipe.steps.map((step) => ({
      order: step.order,
      instruction: step.instruction,
      why: step.why,
      heat: getHeatLabel(step.heat),
      duration: step.duration === undefined ? undefined : `约 ${formatTime(step.duration)}`,
    })),
    warnings: [...detail.warnings],
  };
}
