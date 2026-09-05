import { getIngredientLabel } from "@/data/localization/ingredients";
import type { SupportedLocale } from "@/types/localization";
import type { RecommendationCriteria, RecommendationResult, ScoreDimensionKey } from "@/types/recommendation";
import { describeFlavorProfile } from "./flavor";
import { getRecipeCuisineLabel, getRecipePrimaryTechniqueLabel } from "./taxonomy";
import { getToolLabel } from "./tool-labels";
import { localIngredientRepository } from "./ingredient-repository";

export function buildRecommendationExplanation(result: RecommendationResult, locale: SupportedLocale): string {
  if (!result.eligible) {
    const failures = result.hardFailures.map((failure) => describeHardFailure(failure.criterion, failure.reason, result, locale));
    return locale === "zh-CN" ? `这道菜暂时不合适：${failures.join("；")}。` : `This recipe does not fit yet: ${failures.join("; ")}.`;
  }

  const parts: string[] = [];
  if (result.scoreBreakdown.ingredientFit) {
    const missing = result.ingredientMatch.missingIngredients.map(({ id }) => getIngredientLabel(id, localIngredientRepository.getById(id)?.name, locale));
    if (result.ingredientMatch.fit === 1) {
      parts.push(locale === "zh-CN" ? "必需食材已齐全" : "all required ingredients are on hand");
    } else {
      const names = missing.join(locale === "zh-CN" ? "、" : ", ");
      parts.push(locale === "zh-CN"
        ? `已有 ${result.ingredientMatch.availableRequired}/${result.ingredientMatch.totalRequired} 种必需食材，${missing.length <= 1 ? "只缺" : "还缺"}${names}`
        : `${result.ingredientMatch.availableRequired}/${result.ingredientMatch.totalRequired} required ingredients are on hand; missing ${names}`);
    }
  }
  for (const key of ["cuisine", "tags", "methods", "flavor"] as const) {
    const dimension = result.scoreBreakdown[key];
    if (dimension && dimension.score > 0) parts.push(describeDimension(key, result, locale));
  }
  if (parts.length) return locale === "zh-CN" ? `${parts.join("；")}，因此优先推荐。` : `${parts.join("; ")}, so it ranks highly.`;
  return Object.keys(result.scoreBreakdown).length
    ? locale === "zh-CN" ? "基本条件合适，不过没有完全碰上当前口味和偏好。" : "The basics fit, though it does not fully match the selected preferences."
    : locale === "zh-CN" ? "适合先放进今晚的灵感清单。" : "A good starting point for tonight's shortlist.";
}

function describeDimension(key: Exclude<ScoreDimensionKey, "ingredientFit">, result: RecommendationResult, locale: SupportedLocale): string {
  if (key === "cuisine") return locale === "zh-CN" ? `正是你选的${getRecipeCuisineLabel(result.recipe, locale)}风味` : `matches the selected ${getRecipeCuisineLabel(result.recipe, locale)} cuisine`;
  if (key === "methods") return locale === "zh-CN" ? `用了你偏好的${getRecipePrimaryTechniqueLabel(result.recipe, locale)}做法` : `uses the preferred ${getRecipePrimaryTechniqueLabel(result.recipe, locale).toLowerCase()} technique`;
  if (key === "flavor") {
    const flavor = describeFlavorProfile(result.recipe.flavor, locale, 3);
    return locale === "zh-CN" ? `味道偏${flavor.replaceAll(" · ", "、")}` : `leans toward ${flavor.replaceAll(" · ", ", ").toLowerCase()}`;
  }
  const matched = Math.max(1, Math.round((result.scoreBreakdown.tags?.score ?? 0)));
  return locale === "zh-CN" ? `有 ${matched} 个饮食方向合拍` : `${matched} dietary preference matches`;
}

function describeHardFailure(criterion: RecommendationResult["hardFailures"][number]["criterion"], reason: RecommendationResult["hardFailures"][number]["reason"], result: RecommendationResult, locale: SupportedLocale): string {
  if (reason === "estimate-incomplete") return locale === "zh-CN" ? "估算不完整，无法验证限制" : "the estimate is incomplete, so the limit cannot be verified";
  if (reason === "missing-tools") {
    const names = result.missingTools.map(({ id }) => getToolLabel(id, locale)).join(locale === "zh-CN" ? "、" : ", ");
    return locale === "zh-CN" ? `缺少厨具：${names}` : `missing tools: ${names}`;
  }
  const labels: Record<typeof criterion, Record<SupportedLocale, string>> = {
    maxTime: { "zh-CN": "超过时间限制", en: "over the time limit" },
    maxCalories: { "zh-CN": "超过每份热量上限", en: "over the calorie limit per serving" },
    minProtein: { "zh-CN": "未达到每份蛋白质目标", en: "below the protein target per serving" },
    maxOil: { "zh-CN": "超过每份用油限制", en: "over the oil limit per serving" },
    maxSalt: { "zh-CN": "超过每份盐限制", en: "over the salt limit per serving" },
    maxAddedSugar: { "zh-CN": "超过每份添加糖限制", en: "over the added-sugar limit per serving" },
    maxCost: { "zh-CN": "超过每份预算", en: "over the budget per serving" },
    availableTools: { "zh-CN": "缺少厨具", en: "missing tools" },
  };
  return labels[criterion][locale];
}

export function buildRelaxationSuggestions(criteria: RecommendationCriteria, locale: SupportedLocale): string[] {
  const suggestions: string[] = [];
  if (criteria.maxTime !== undefined) suggestions.push(locale === "zh-CN" ? "放宽最长时间" : "Allow more time");
  if (criteria.maxCalories !== undefined || criteria.minProtein !== undefined) suggestions.push(locale === "zh-CN" ? "调整每份营养目标" : "Adjust nutrition targets");
  if (criteria.maxOil !== undefined || criteria.maxSalt !== undefined || criteria.maxAddedSugar !== undefined) suggestions.push(locale === "zh-CN" ? "放宽每份油盐糖限制" : "Relax oil, salt, or sugar limits");
  if (criteria.maxCost !== undefined) suggestions.push(locale === "zh-CN" ? "提高每份预算" : "Raise the budget per serving");
  if (criteria.availableTools?.length) suggestions.push(locale === "zh-CN" ? "补充可用厨具" : "Add available tools");
  return suggestions.length ? suggestions : [locale === "zh-CN" ? "减少偏好条件" : "Remove one preference"];
}
