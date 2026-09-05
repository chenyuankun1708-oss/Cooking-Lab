import { getIngredientLabel } from "@/data/localization/ingredients";
import type { DecisionContext } from "@/types/decision-context";
import { decisionContextFieldDefinitions } from "@/types/decision-context";
import type { SupportedLocale } from "@/types/localization";
import { getCuisineLabel, getTagLabel, getTechniqueLabel, getToolLabel } from "./display-labels";
import { getFlavorPreferenceLabel } from "./flavor";

export interface DecisionContextDisplayEntry {
  field: keyof DecisionContext;
  scope: "meal" | "recipe" | "carried";
  scopeLabel: string;
  text: string;
}

export function describeDecisionContext(
  context: DecisionContext,
  locale: SupportedLocale,
  options: { surface?: "recipe" | "pairing"; anchorIsRecipe?: boolean } = {},
): DecisionContextDisplayEntry[] {
  const entries: DecisionContextDisplayEntry[] = [];
  const add = (field: keyof DecisionContext, text: string) => {
    const scope = displayScope(field);
    const scopeLabel = scope === "recipe" && options.surface === "pairing"
      ? options.anchorIsRecipe
        ? pairingRecipeScopeLabels[locale].anchorRecipe
        : pairingRecipeScopeLabels[locale].notApplied
      : scopeLabels[locale][scope];
    entries.push({ field, scope, scopeLabel, text });
  };
  const join = (values: readonly string[]) => values.join(locale === "zh-CN" ? "、" : ", ");

  if (context.maxTime !== undefined) add("maxTime", locale === "zh-CN"
    ? `整餐展示的预计用时不超过 ${context.maxTime} 分钟`
    : `Displayed estimated meal time up to ${context.maxTime} min`);
  if (context.availableTools?.length) add("availableTools", locale === "zh-CN"
    ? `整餐只使用：${join(context.availableTools.map((id) => getToolLabel(id, locale)))}`
    : `Whole meal uses only: ${join(context.availableTools.map((id) => getToolLabel(id, locale)))}`);

  if (context.maxCalories !== undefined) add("maxCalories", `≤ ${context.maxCalories} kcal ${locale === "zh-CN" ? "每份" : "per serving"}`);
  if (context.minProtein !== undefined) add("minProtein", `≥ ${context.minProtein} g ${locale === "zh-CN" ? "蛋白质/份" : "protein/serving"}`);
  if (context.maxOil !== undefined) add("maxOil", `≤ ${context.maxOil} g ${locale === "zh-CN" ? "油/份" : "oil/serving"}`);
  if (context.maxSalt !== undefined) add("maxSalt", `≤ ${context.maxSalt} g ${locale === "zh-CN" ? "盐/份" : "salt/serving"}`);
  if (context.maxAddedSugar !== undefined) add("maxAddedSugar", `≤ ${context.maxAddedSugar} g ${locale === "zh-CN" ? "添加糖/份" : "added sugar/serving"}`);
  if (context.maxCost !== undefined) add("maxCost", `≤ ¥${context.maxCost} ${locale === "zh-CN" ? "每份" : "per serving"}`);

  if (context.availableIngredients?.length) add("availableIngredients", locale === "zh-CN"
    ? `手边食材：${join(context.availableIngredients.map((id) => getIngredientLabel(id, id, locale)))}`
    : `Ingredients on hand: ${join(context.availableIngredients.map((id) => getIngredientLabel(id, id, locale)))}`);
  if (context.preferredCuisine) add("preferredCuisine", locale === "zh-CN"
    ? `偏好菜系：${getCuisineLabel(context.preferredCuisine, locale)}`
    : `Preferred cuisine: ${getCuisineLabel(context.preferredCuisine, locale)}`);
  if (context.preferredTags?.length) add("preferredTags", locale === "zh-CN"
    ? `偏好：${join(context.preferredTags.map((id) => getTagLabel(id, locale)))}`
    : `Preferences: ${join(context.preferredTags.map((id) => getTagLabel(id, locale)))}`);
  if (context.preferredMethods?.length) add("preferredMethods", locale === "zh-CN"
    ? `偏好技法：${join(context.preferredMethods.map((id) => getTechniqueLabel(id, locale)))}`
    : `Preferred techniques: ${join(context.preferredMethods.map((id) => getTechniqueLabel(id, locale)))}`);
  if (context.flavorPreferences?.length) add("flavorPreferences", locale === "zh-CN"
    ? `想吃：${join(context.flavorPreferences.map((id) => getFlavorPreferenceLabel(id, locale)))}`
    : `Craving: ${join(context.flavorPreferences.map((id) => getFlavorPreferenceLabel(id, locale)))}`);
  return entries;
}

function displayScope(field: keyof DecisionContext): DecisionContextDisplayEntry["scope"] {
  const scope = decisionContextFieldDefinitions[field].scope;
  if (scope === "estimated-meal-hard" || scope === "meal-hard") return "meal";
  if (scope === "recipe-only-hard") return "recipe";
  return "carried";
}

const scopeLabels = {
  "zh-CN": { meal: "整餐约束", recipe: "仅当前菜谱", carried: "带入后续选择" },
  en: { meal: "Whole-meal constraint", recipe: "Current recipe only", carried: "Carried preference" },
} as const;

const pairingRecipeScopeLabels = {
  "zh-CN": { anchorRecipe: "仅起点菜谱", notApplied: "本次整餐不执行" },
  en: { anchorRecipe: "Anchor recipe only", notApplied: "Not applied to this meal" },
} as const;
