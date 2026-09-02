import type { RecipeIngredient } from "@/types/recipe";
import { emptyNutrition, type Nutrition } from "@/types/nutrition";
import type { CalculationWarning } from "./calculation-types";
import type { IngredientRepository } from "./ingredient-repository";
import { toGrams } from "./unit-conversion";
import { isNonNegativeFinite } from "./validation-utils";

const nutritionFields = Object.keys(emptyNutrition()) as (keyof Nutrition)[];

export interface NutritionCalculation {
  total: Nutrition;
  warnings: CalculationWarning[];
  complete: boolean;
  estimated: true;
}

export function calculateNutrition(items: RecipeIngredient[], repository: IngredientRepository): NutritionCalculation {
  const total = emptyNutrition();
  const warnings: CalculationWarning[] = [];

  for (const item of items) {
    const ingredient = repository.getById(item.ingredientId);
    if (!ingredient) {
      warnings.push({ ingredientId: item.ingredientId, code: "MISSING_INGREDIENT", message: "未找到食材数据" });
      continue;
    }
    if (nutritionFields.some((field) => !isNonNegativeFinite(ingredient.nutritionPer100g[field]))) {
      warnings.push({ ingredientId: item.ingredientId, code: "INVALID_NUTRITION", message: "食材营养数据包含非法数值" });
      continue;
    }
    try {
      const factor = toGrams(item.amount, item.unit, ingredient) / 100;
      const contributions = nutritionFields.map((field) => ingredient.nutritionPer100g[field] * factor);
      if (contributions.some((value, index) => !Number.isFinite(value) || !Number.isFinite(total[nutritionFields[index]] + value))) {
        warnings.push({ ingredientId: item.ingredientId, code: "NON_FINITE_RESULT", message: "营养计算结果超出有限数范围" });
        continue;
      }
      nutritionFields.forEach((field, index) => { total[field] += contributions[index]; });
    } catch (error) {
      warnings.push({
        ingredientId: item.ingredientId,
        code: "UNIT_CONVERSION",
        message: error instanceof Error ? error.message : "无法换算食材用量",
      });
    }
  }

  return { total, warnings, complete: warnings.length === 0, estimated: true };
}
