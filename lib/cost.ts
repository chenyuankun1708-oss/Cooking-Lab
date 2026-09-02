import type { RecipeIngredient } from "@/types/recipe";
import type { CalculationWarning } from "./calculation-types";
import type { IngredientRepository } from "./ingredient-repository";
import { toGrams } from "./unit-conversion";
import { isNonNegativeFinite } from "./validation-utils";

export interface CostCalculation {
  estimated: number;
  currency: "CNY";
  warnings: CalculationWarning[];
  complete: boolean;
  basis: "static-reference-price";
}

export function calculateCost(items: RecipeIngredient[], repository: IngredientRepository): CostCalculation {
  let estimated = 0;
  const warnings: CalculationWarning[] = [];

  for (const item of items) {
    const ingredient = repository.getById(item.ingredientId);
    if (!ingredient) {
      warnings.push({ ingredientId: item.ingredientId, code: "MISSING_INGREDIENT", message: "缺少食材价格数据" });
      continue;
    }
    if (!isNonNegativeFinite(ingredient.estimatedPricePer100g)) {
      warnings.push({ ingredientId: item.ingredientId, code: "INVALID_PRICE", message: "食材参考价格必须是非负有限数" });
      continue;
    }
    try {
      const contribution = toGrams(item.amount, item.unit, ingredient) / 100 * ingredient.estimatedPricePer100g;
      if (!Number.isFinite(contribution) || !Number.isFinite(estimated + contribution)) {
        warnings.push({ ingredientId: item.ingredientId, code: "NON_FINITE_RESULT", message: "成本计算结果超出有限数范围" });
        continue;
      }
      estimated += contribution;
    } catch (error) {
      warnings.push({
        ingredientId: item.ingredientId,
        code: "UNIT_CONVERSION",
        message: error instanceof Error ? error.message : "无法换算食材用量",
      });
    }
  }

  return { estimated, currency: "CNY", warnings, complete: warnings.length === 0, basis: "static-reference-price" };
}
