import { browseTags, cuisines, dietaryTags, dishTypes, getTaxonomyLabel, mealOccasions, techniques } from "@/data/taxonomy";
import type { SupportedLocale } from "@/types/localization";
export { getToolLabel, toolLabels } from "./tool-labels";

export const tagLabels: Record<string, Record<SupportedLocale, string>> = {
  "high-fiber": { "zh-CN": "高纤维", en: "High fiber" },
  "high-protein": { "zh-CN": "高蛋白", en: "High protein" },
  "low-oil": { "zh-CN": "低用油", en: "Low oil" },
  "no-added-sugar": { "zh-CN": "无添加糖", en: "No added sugar" },
  breakfast: { "zh-CN": "早餐", en: "Breakfast" },
  "one-pot": { "zh-CN": "一锅完成", en: "One pot" },
  quick: { "zh-CN": "快手", en: "Quick" },
  staple: { "zh-CN": "主食友好", en: "Staple" },
  vegan: { "zh-CN": "纯素", en: "Vegan" },
  "vegetable-rich": { "zh-CN": "蔬菜丰富", en: "Vegetable rich" },
  vegetarian: { "zh-CN": "蛋奶素", en: "Vegetarian" },
};

export const heatLabels: Record<string, Record<SupportedLocale, string>> = {
  low: { "zh-CN": "小火", en: "Low heat" },
  medium: { "zh-CN": "中火", en: "Medium heat" },
  high: { "zh-CN": "大火", en: "High heat" },
};

export const difficultyLabels: Record<string, Record<SupportedLocale, string>> = {
  easy: { "zh-CN": "简单", en: "Easy" },
  medium: { "zh-CN": "中等", en: "Moderate" },
  hard: { "zh-CN": "较难", en: "Advanced" },
};

export const unitLabels: Record<string, Record<SupportedLocale, string>> = {
  g: { "zh-CN": "克", en: "g" },
  kg: { "zh-CN": "千克", en: "kg" },
  ml: { "zh-CN": "毫升", en: "ml" },
  piece: { "zh-CN": "个", en: "pc" },
  tsp: { "zh-CN": "茶匙", en: "tsp" },
  tbsp: { "zh-CN": "汤匙", en: "tbsp" },
};

const fallbackLabel = (value: string) => value.replace(/[-_]+/g, " ").trim();

export const getTagLabel = (tag: string, locale: SupportedLocale = "zh-CN") => tagLabels[tag]?.[locale] ?? fallbackLabel(tag);
export const getHeatLabel = (heat: string | undefined, locale: SupportedLocale = "zh-CN") =>
  heat && heat !== "none" ? heatLabels[heat]?.[locale] ?? fallbackLabel(heat) : undefined;
export const getUnitLabel = (unit: string, locale: SupportedLocale = "zh-CN") => unitLabels[unit]?.[locale] ?? fallbackLabel(unit);
export const getDifficultyLabel = (difficulty: string, locale: SupportedLocale = "zh-CN") => difficultyLabels[difficulty]?.[locale] ?? fallbackLabel(difficulty);
export const getIngredientFallbackLabel = (ingredientId: string, locale: SupportedLocale = "zh-CN") =>
  locale === "zh-CN" ? `未知食材（${ingredientId}）` : fallbackLabel(ingredientId);
export const getCuisineLabel = (cuisineId: string, locale: SupportedLocale = "zh-CN") =>
  cuisines[cuisineId]?.label[locale] ?? getTaxonomyLabel("cuisines", cuisineId, locale) ?? fallbackLabel(cuisineId);
export const getTechniqueLabel = (techniqueId: string, locale: SupportedLocale = "zh-CN") =>
  techniques[techniqueId]?.label[locale] ?? getTaxonomyLabel("techniques", techniqueId, locale) ?? fallbackLabel(techniqueId);
export const getDishTypeLabel = (dishTypeId: string, locale: SupportedLocale = "zh-CN") =>
  dishTypes[dishTypeId]?.label[locale] ?? getTaxonomyLabel("dishTypes", dishTypeId, locale) ?? fallbackLabel(dishTypeId);
export const getMealOccasionLabel = (occasionId: string, locale: SupportedLocale = "zh-CN") =>
  mealOccasions[occasionId]?.label[locale] ?? getTaxonomyLabel("mealOccasions", occasionId, locale) ?? fallbackLabel(occasionId);
export const getDietaryTagLabel = (tagId: string, locale: SupportedLocale = "zh-CN") =>
  dietaryTags[tagId]?.label[locale] ?? getTagLabel(tagId, locale);
export const getBrowseTagLabel = (tagId: string, locale: SupportedLocale = "zh-CN") =>
  browseTags[tagId]?.label[locale] ?? getTagLabel(tagId, locale);
