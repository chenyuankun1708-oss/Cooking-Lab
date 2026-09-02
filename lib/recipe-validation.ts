import type { Ingredient, Unit } from "@/types/ingredient";
import type { Recipe } from "@/types/recipe";
import { toGrams } from "./unit-conversion";
import { isNonNegativeFinite, isPositiveFinite, isSlug } from "./validation-utils";

export interface RecipeValidationIssue {
  recipeId: string;
  field: string;
  message: string;
}

const units = new Set<Unit>(["g", "kg", "ml", "piece", "tbsp", "tsp"]);
const methods = new Set(["煎", "炒", "蒸", "煮", "炖", "焖", "烤", "汤", "凉拌", "电饭锅"]);
const cuisines = new Set(["中式", "西式", "融合"]);
const categories = new Set(["主菜", "主食", "汤", "凉菜", "早餐", "配菜"]);
const difficulties = new Set(["easy", "medium", "hard"]);
const heatLevels = new Set(["none", "low", "medium", "high"]);

export function validateRecipes(recipes: Recipe[], ingredients: Ingredient[]): RecipeValidationIssue[] {
  const issues: RecipeValidationIssue[] = [];
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const ids = new Set<string>();
  const slugs = new Set<string>();

  const report = (recipeId: string, field: string, message: string) => {
    issues.push({ recipeId, field, message });
  };

  for (const recipe of recipes) {
    const recipeId = recipe.id || recipe.slug || "<unknown>";
    if (!isSlug(recipe.id)) report(recipeId, "id", "Recipe ID 必须使用 kebab-case");
    if (ids.has(recipe.id)) report(recipeId, "id", "Recipe ID 重复");
    ids.add(recipe.id);
    if (!isSlug(recipe.slug)) report(recipeId, "slug", "Slug 必须使用 kebab-case");
    if (slugs.has(recipe.slug)) report(recipeId, "slug", "Slug 重复");
    slugs.add(recipe.slug);
    if (recipe.id !== recipe.slug) report(recipeId, "id", "当前静态数据要求 ID 与 slug 一致");

    if (!recipe.name.trim()) report(recipeId, "name", "名称不能为空");
    if (!recipe.description.trim()) report(recipeId, "description", "描述不能为空");
    if (!cuisines.has(recipe.cuisine)) report(recipeId, "cuisine", "菜系不在当前约定集合中");
    if (!categories.has(recipe.category)) report(recipeId, "category", "类别不在当前约定集合中");
    if (!methods.has(recipe.cooking.method)) report(recipeId, "cooking.method", "技法不在当前约定集合中");
    if (!difficulties.has(recipe.cooking.difficulty)) report(recipeId, "cooking.difficulty", "难度不在当前 schema 中");
    if (!isPositiveFinite(recipe.servings)) report(recipeId, "servings", "份数必须是正有限数");
    if (recipe.dataQuality !== "demo-estimated") report(recipeId, "dataQuality", "数据质量必须标记为 demo-estimated");

    if (recipe.ingredients.length === 0) report(recipeId, "ingredients", "食材列表不能为空");
    const recipeIngredientIds = new Set<string>();
    for (const [index, item] of recipe.ingredients.entries()) {
      const field = `ingredients.${index}`;
      const ingredient = ingredientById.get(item.ingredientId);
      if (recipeIngredientIds.has(item.ingredientId)) report(recipeId, `${field}.ingredientId`, "同一道菜不能重复列出同一食材");
      recipeIngredientIds.add(item.ingredientId);
      if (!ingredient) report(recipeId, `${field}.ingredientId`, `不存在的食材 ID: ${item.ingredientId}`);
      if (!isPositiveFinite(item.amount)) report(recipeId, `${field}.amount`, "食材用量必须是正有限数");
      if (!units.has(item.unit)) report(recipeId, `${field}.unit`, "单位不在当前 schema 中");
      if (typeof item.optional !== "boolean") report(recipeId, `${field}.optional`, "optional 必须明确为布尔值");
      if (item.note !== undefined && !item.note.trim()) report(recipeId, `${field}.note`, "note 不能是空字符串");
      if (ingredient && units.has(item.unit) && isPositiveFinite(item.amount)) {
        try {
          toGrams(item.amount, item.unit, ingredient);
        } catch {
          report(recipeId, `${field}.unit`, `${item.ingredientId} 无法完成 ${item.unit} 到克的换算`);
        }
      }
    }

    const { prepTime, cookTime, totalTime, oil, salt, addedSugar } = recipe.cooking;
    for (const [field, value] of Object.entries({ prepTime, cookTime, totalTime, oil, salt, addedSugar })) {
      if (!isNonNegativeFinite(value)) report(recipeId, `cooking.${field}`, "烹饪数值必须是非负有限数");
    }
    if (totalTime !== prepTime + cookTime) report(recipeId, "cooking.totalTime", "总时间必须等于准备时间与烹饪时间之和");

    const gramsFor = (ingredientId: string) => recipe.ingredients
      .filter((item) => item.ingredientId === ingredientId)
      .reduce((total, item) => {
        const ingredient = ingredientById.get(item.ingredientId);
        if (!ingredient) return total;
        try { return total + toGrams(item.amount, item.unit, ingredient); } catch { return total; }
      }, 0);
    if (Math.abs(oil - gramsFor("cooking-oil")) > 0.01) report(recipeId, "cooking.oil", "用油字段与食材明细不一致");
    if (Math.abs(salt - gramsFor("salt")) > 0.01) report(recipeId, "cooking.salt", "盐字段与食材明细不一致");
    if (addedSugar !== 0) report(recipeId, "cooking.addedSugar", "当前数据未定义添加糖食材，addedSugar 必须为 0");

    if (recipe.cost.currency !== "CNY" || !recipe.cost.basis.trim()) report(recipeId, "cost", "成本元数据不完整");
    if (recipe.cost.estimated !== undefined && !isNonNegativeFinite(recipe.cost.estimated)) report(recipeId, "cost.estimated", "成本估算必须是非负有限数");
    if (recipe.tools.length === 0 || recipe.tools.some((tool) => !isSlug(tool))) report(recipeId, "tools", "工具必须是非空 kebab-case 列表");
    if (new Set(recipe.tools).size !== recipe.tools.length) report(recipeId, "tools", "工具列表不能重复");
    if (recipe.tags.length === 0 || recipe.tags.some((tag) => !isSlug(tag))) report(recipeId, "tags", "标签必须是非空 kebab-case 列表");
    if (new Set(recipe.tags).size !== recipe.tags.length) report(recipeId, "tags", "标签列表不能重复");

    if (recipe.steps.length === 0) report(recipeId, "steps", "步骤不能为空");
    const expectedOrders = recipe.steps.map((_, index) => index + 1);
    if (recipe.steps.some((step, index) => step.order !== expectedOrders[index])) report(recipeId, "steps.order", "步骤序号必须从 1 连续递增");
    for (const [index, step] of recipe.steps.entries()) {
      if (!step.instruction.trim()) report(recipeId, `steps.${index}.instruction`, "步骤说明不能为空");
      if (!step.why.trim()) report(recipeId, `steps.${index}.why`, "步骤原理不能为空");
      if (step.heat !== undefined && !heatLevels.has(step.heat)) report(recipeId, `steps.${index}.heat`, "火力不在当前 schema 中");
      if (step.duration !== undefined && !isNonNegativeFinite(step.duration)) report(recipeId, `steps.${index}.duration`, "步骤时间必须是非负有限数");
    }
    if (recipe.principles.length === 0 || recipe.principles.some((principle) => !principle.trim())) report(recipeId, "principles", "烹饪原理不能为空");
  }

  return issues;
}
