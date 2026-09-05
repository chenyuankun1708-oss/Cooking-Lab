import { getHeatLabel, getIngredientFallbackLabel, getToolLabel, getUnitLabel } from "./display-labels";
import { formatCalories, formatCost, formatMacro, formatMass, formatProtein, formatSodium, formatTime } from "./formatters";
import { formatHumanCookingTime } from "./cooking-time";
import { getFlavorProfileLabels } from "./flavor";
import type { RecipeDetailModel } from "./recipe-detail";
import {
  getRecipeCuisineLabel,
  getRecipeDishTypeLabel,
  getRecipeMealOccasionLabels,
  getRecipeOriginLabel,
  getRecipeSubCuisineLabel,
  getRecipeTechniqueLabels,
} from "./taxonomy";
import { getIngredientLabel } from "@/data/localization/ingredients";
import type { SupportedLocale } from "@/types/localization";

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
      tastes: Array<{ id: string; label: string; intensity: number }>;
      aromas: string[];
      textures: string[];
      characters: string[];
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
  times: { prep: string; cook: string; total: string; humanTotal: string };
  nutrition: Array<{ label: string; value: string }>;
  limits: Array<{ label: string; value: string; scope: string }>;
  cost: { whole: string; perServing: string };
  steps: Array<{ order: number; instruction: string; why: string; heat?: string; duration?: string }>;
  warnings: string[];
}

export function buildRecipeDetailDisplay(detail: RecipeDetailModel, locale: SupportedLocale = "zh-CN"): RecipeDetailViewModel {
  const { recipe } = detail;

  return {
    recipe,
    taxonomy: {
      origin: getRecipeOriginLabel(recipe, locale),
      cuisine: getRecipeCuisineLabel(recipe, locale),
      subCuisine: getRecipeSubCuisineLabel(recipe, locale),
      dishType: getRecipeDishTypeLabel(recipe, locale),
      mealOccasions: getRecipeMealOccasionLabels(recipe, locale),
      techniques: getRecipeTechniqueLabels(recipe, locale),
      flavor: getFlavorProfileLabels(recipe.flavor, locale),
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
      name: getIngredientLabel(item.id, item.name, locale) ?? getIngredientFallbackLabel(item.id, locale),
      amount: `${item.amount} ${getUnitLabel(item.unit, locale)}`,
      note: item.note,
      optional: item.optional,
    })),
    tools: recipe.tools.map((tool) => getToolLabel(tool, locale)),
    times: {
      prep: formatTime(detail.times.prepMinutes, locale),
      cook: formatTime(detail.times.cookMinutes, locale),
      total: formatTime(detail.times.totalMinutes, locale),
      humanTotal: formatHumanCookingTime(detail.times.totalMinutes, locale),
    },
    nutrition: [
      { label: locale === "zh-CN" ? "热量" : "Calories", value: formatCalories(detail.nutritionPerServing.calories, detail.nutritionPerServing.complete, locale) },
      { label: locale === "zh-CN" ? "蛋白质" : "Protein", value: formatProtein(detail.nutritionPerServing.protein, detail.nutritionPerServing.complete, locale) },
      { label: locale === "zh-CN" ? "脂肪" : "Fat", value: formatMacro(detail.nutritionPerServing.fat, detail.nutritionPerServing.complete, locale) },
      { label: locale === "zh-CN" ? "碳水" : "Carbohydrate", value: formatMacro(detail.nutritionPerServing.carbs, detail.nutritionPerServing.complete, locale) },
      { label: locale === "zh-CN" ? "膳食纤维" : "Fiber", value: formatMacro(detail.nutritionPerServing.fiber, detail.nutritionPerServing.complete, locale) },
      { label: locale === "zh-CN" ? "钠" : "Sodium", value: formatSodium(detail.nutritionPerServing.sodium, detail.nutritionPerServing.complete, locale) },
    ],
    limits: [
      { label: locale === "zh-CN" ? "用油" : "Oil", value: formatMass(detail.limits.oilGramsWhole, locale), scope: locale === "zh-CN" ? "整道" : "whole recipe" },
      { label: locale === "zh-CN" ? "盐" : "Salt", value: formatMass(detail.limits.saltGramsWhole, locale), scope: locale === "zh-CN" ? "整道" : "whole recipe" },
      { label: locale === "zh-CN" ? "添加糖" : "Added sugar", value: formatMass(detail.limits.addedSugarGramsWhole, locale), scope: locale === "zh-CN" ? "整道" : "whole recipe" },
      { label: locale === "zh-CN" ? "钠" : "Sodium", value: formatSodium(detail.limits.sodiumMgPerServing, detail.limits.sodiumComplete, locale), scope: locale === "zh-CN" ? "每份估算" : "per serving" },
    ],
    cost: {
      whole: formatCost(detail.cost.wholeEstimated, detail.cost.complete, locale),
      perServing: formatCost(detail.cost.perServingEstimated, detail.cost.complete, locale),
    },
    steps: recipe.steps.map((step) => ({
      order: step.order,
      instruction: step.instruction,
      why: step.why,
      heat: getHeatLabel(step.heat, locale),
      duration: step.duration === undefined ? undefined : `${locale === "zh-CN" ? "约 " : "about "}${formatTime(step.duration, locale)}`,
    })),
    warnings: [...detail.warnings],
  };
}
