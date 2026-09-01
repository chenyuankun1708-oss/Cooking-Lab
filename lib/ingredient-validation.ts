import type { Ingredient } from "@/types/ingredient";

const nutritionFields = [
  "calories",
  "protein",
  "fat",
  "saturatedFat",
  "carbs",
  "sugar",
  "addedSugar",
  "fiber",
  "sodium",
] as const;
const ingredientCategories = new Set(["protein", "vegetable", "grain", "dairy", "seasoning", "oil"]);

export interface IngredientValidationIssue {
  ingredientId: string;
  field: string;
  message: string;
}

export function validateIngredients(items: Ingredient[]): IngredientValidationIssue[] {
  const issues: IngredientValidationIssue[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  const searchTerms = new Map<string, string>();

  for (const ingredient of items) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ingredient.id)) {
      issues.push({ ingredientId: ingredient.id, field: "id", message: "ID 必须使用 kebab-case" });
    }
    if (ids.has(ingredient.id)) {
      issues.push({ ingredientId: ingredient.id, field: "id", message: "ID 重复" });
    }
    ids.add(ingredient.id);

    const normalizedName = ingredient.name.trim().toLocaleLowerCase("zh-CN");
    if (!normalizedName) {
      issues.push({ ingredientId: ingredient.id, field: "name", message: "名称不能为空" });
    } else if (names.has(normalizedName)) {
      issues.push({ ingredientId: ingredient.id, field: "name", message: "名称重复" });
    }
    names.add(normalizedName);

    if (!ingredientCategories.has(ingredient.category)) {
      issues.push({ ingredientId: ingredient.id, field: "category", message: "类别不在当前 schema 中" });
    }

    const ownTerms = new Set<string>();
    for (const [field, value] of [["name", ingredient.name], ...ingredient.aliases.map((alias) => ["aliases", alias])] as const) {
      const normalizedTerm = value.trim().toLocaleLowerCase("zh-CN");
      if (!normalizedTerm) {
        issues.push({ ingredientId: ingredient.id, field, message: "名称或别名不能为空" });
        continue;
      }
      if (ownTerms.has(normalizedTerm)) {
        issues.push({ ingredientId: ingredient.id, field, message: "名称与别名或别名之间重复" });
        continue;
      }
      ownTerms.add(normalizedTerm);
      const owner = searchTerms.get(normalizedTerm);
      if (owner && owner !== ingredient.id) {
        issues.push({ ingredientId: ingredient.id, field, message: `名称或别名与 ${owner} 冲突` });
      } else {
        searchTerms.set(normalizedTerm, ingredient.id);
      }
    }

    for (const field of nutritionFields) {
      const value = ingredient.nutritionPer100g[field];
      if (!Number.isFinite(value) || value < 0) {
        issues.push({ ingredientId: ingredient.id, field: `nutritionPer100g.${field}`, message: "营养值必须是非负有限数" });
      }
    }

    if (!Number.isFinite(ingredient.estimatedPricePer100g) || ingredient.estimatedPricePer100g < 0) {
      issues.push({ ingredientId: ingredient.id, field: "estimatedPricePer100g", message: "参考价格必须是非负有限数" });
    }

    if (ingredient.dataQuality !== "demo-estimated") {
      issues.push({ ingredientId: ingredient.id, field: "dataQuality", message: "数据质量必须标记为 demo-estimated" });
    }

    for (const [unit, weight] of Object.entries(ingredient.approximateUnitWeight ?? {})) {
      if (!Number.isFinite(weight) || weight <= 0) {
        issues.push({ ingredientId: ingredient.id, field: `approximateUnitWeight.${unit}`, message: "近似克重必须是正有限数" });
      }
    }

    const defaultUnit = ingredient.defaultUnit;
    if (
      (defaultUnit === "piece" || defaultUnit === "ml" || defaultUnit === "tsp" || defaultUnit === "tbsp") &&
      ingredient.approximateUnitWeight?.[defaultUnit] === undefined
    ) {
      issues.push({ ingredientId: ingredient.id, field: "defaultUnit", message: "非重量默认单位必须提供近似克重" });
    }
  }

  return issues;
}
