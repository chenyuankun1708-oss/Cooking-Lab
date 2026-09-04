import { browseTags, cuisines, dietaryTags, dishTypes, getTaxonomyLabel, mealOccasions, techniques } from "@/data/taxonomy";
export { getToolLabel, toolLabels } from "./tool-labels";

export const tagLabels: Record<string, string> = {
  "high-fiber": "高纤维",
  "high-protein": "高蛋白",
  "low-oil": "低用油",
  "no-added-sugar": "无添加糖",
  breakfast: "早餐",
  "one-pot": "一锅完成",
  quick: "快手",
  staple: "主食友好",
  vegan: "纯素",
  "vegetable-rich": "蔬菜丰富",
  vegetarian: "蛋奶素",
};

export const heatLabels: Record<string, string> = {
  low: "小火",
  medium: "中火",
  high: "大火",
};

export const difficultyLabels: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "较难",
};

export const unitLabels: Record<string, string> = {
  g: "克",
  kg: "千克",
  ml: "毫升",
  piece: "个",
  tsp: "茶匙",
  tbsp: "汤匙",
};

const fallbackLabel = (value: string) => value.replace(/[-_]+/g, " ").trim();

export const getTagLabel = (tag: string) => tagLabels[tag] ?? fallbackLabel(tag);
export const getHeatLabel = (heat: string | undefined) =>
  heat && heat !== "none" ? heatLabels[heat] ?? fallbackLabel(heat) : undefined;
export const getUnitLabel = (unit: string) => unitLabels[unit] ?? fallbackLabel(unit);
export const getDifficultyLabel = (difficulty: string) => difficultyLabels[difficulty] ?? fallbackLabel(difficulty);
export const getIngredientFallbackLabel = (ingredientId: string) => `未知食材（${ingredientId}）`;
export const getCuisineLabel = (cuisineId: string) =>
  cuisines[cuisineId]?.label["zh-CN"] ?? getTaxonomyLabel("cuisines", cuisineId) ?? fallbackLabel(cuisineId);
export const getTechniqueLabel = (techniqueId: string) =>
  techniques[techniqueId]?.label["zh-CN"] ?? getTaxonomyLabel("techniques", techniqueId) ?? fallbackLabel(techniqueId);
export const getDishTypeLabel = (dishTypeId: string) =>
  dishTypes[dishTypeId]?.label["zh-CN"] ?? getTaxonomyLabel("dishTypes", dishTypeId) ?? fallbackLabel(dishTypeId);
export const getMealOccasionLabel = (occasionId: string) =>
  mealOccasions[occasionId]?.label["zh-CN"] ?? getTaxonomyLabel("mealOccasions", occasionId) ?? fallbackLabel(occasionId);
export const getDietaryTagLabel = (tagId: string) =>
  dietaryTags[tagId]?.label["zh-CN"] ?? getTagLabel(tagId);
export const getBrowseTagLabel = (tagId: string) =>
  browseTags[tagId]?.label["zh-CN"] ?? getTagLabel(tagId);
