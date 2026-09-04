import type { Ingredient, Unit } from "@/types/ingredient";
import type { Recipe } from "@/types/recipe";
import { browseTags, countries, cuisines, dietaryTags, dishTypes, flavorCharacteristics, mealOccasions, regions, subCuisines, tasteProfiles, techniques } from "@/data/taxonomy";
import { toGrams } from "./unit-conversion";
import { isNonNegativeFinite, isPositiveFinite, isSlug } from "./validation-utils";

export interface RecipeValidationIssue {
  recipeId: string;
  field: string;
  message: string;
}

const units = new Set<Unit>(["g", "kg", "ml", "piece", "tbsp", "tsp"]);
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

    if (!recipe.name.trim()) report(recipeId, "name", "名称不能为空");
    if (!recipe.description.trim()) report(recipeId, "description", "描述不能为空");
    if (!difficulties.has(recipe.cooking.difficulty)) report(recipeId, "cooking.difficulty", "难度不在当前 schema 中");
    if (!isPositiveFinite(recipe.servings)) report(recipeId, "servings", "份数必须是正有限数");
    if (recipe.dataQuality !== "demo-estimated") report(recipeId, "dataQuality", "数据质量必须标记为 demo-estimated");
    validateTaxonomy(recipe, report);

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
    if (recipe.culture) {
      for (const [field, value] of Object.entries(recipe.culture)) {
        if (field === "sources") continue;
        if (value !== undefined && !value.trim()) report(recipeId, `culture.${field}`, "文化元数据不能为空字符串");
      }
      if (recipe.culture.sources) {
        if (recipe.culture.sources.length === 0) {
          report(recipeId, "culture.sources", "文化元数据来源不能为空列表");
        }
        for (const [index, source] of recipe.culture.sources.entries()) {
          const field = `culture.sources.${index}`;
          if (!source.title.trim()) report(recipeId, `${field}.title`, "文化元数据来源标题不能为空");
          if (source.url !== undefined && !source.url.trim()) report(recipeId, `${field}.url`, "文化元数据来源 URL 不能为空字符串");
          if (source.publisher !== undefined && !source.publisher.trim()) report(recipeId, `${field}.publisher`, "文化元数据来源 publisher 不能为空字符串");
          if (source.accessedAt !== undefined && !source.accessedAt.trim()) report(recipeId, `${field}.accessedAt`, "文化元数据来源 accessedAt 不能为空字符串");
        }
      }
    }
  }

  return issues;
}

function validateTaxonomy(recipe: Recipe, report: (recipeId: string, field: string, message: string) => void) {
  const recipeId = recipe.id || recipe.slug || "<unknown>";
  const { taxonomy } = recipe;

  if (!cuisines[taxonomy.cuisine.cuisineId]) report(recipeId, "taxonomy.cuisine.cuisineId", "菜系 ID 不在 taxonomy registry 中");
  if (taxonomy.cuisine.subCuisineId) {
    const subCuisine = subCuisines[taxonomy.cuisine.subCuisineId];
    if (!subCuisine) report(recipeId, "taxonomy.cuisine.subCuisineId", "子菜系 ID 不在 taxonomy registry 中");
    else if (subCuisine.parentId !== taxonomy.cuisine.cuisineId) {
      report(recipeId, "taxonomy.cuisine.subCuisineId", "子菜系与父级菜系不匹配");
    }
  }

  if (!dishTypes[taxonomy.mealType.dishTypeId]) report(recipeId, "taxonomy.mealType.dishTypeId", "料理类型 ID 不在 taxonomy registry 中");
  if (!taxonomy.techniques.length) report(recipeId, "taxonomy.techniques", "至少需要一个 technique");
  if (new Set(taxonomy.techniques).size !== taxonomy.techniques.length) report(recipeId, "taxonomy.techniques", "technique 列表不能重复");
  if (taxonomy.techniques.some((techniqueId) => !techniques[techniqueId])) report(recipeId, "taxonomy.techniques", "存在未注册的 technique ID");

  if (taxonomy.mealType.mealOccasionIds) {
    if (new Set(taxonomy.mealType.mealOccasionIds).size !== taxonomy.mealType.mealOccasionIds.length) {
      report(recipeId, "taxonomy.mealType.mealOccasionIds", "meal occasion 列表不能重复");
    }
    if (taxonomy.mealType.mealOccasionIds.some((occasionId) => !mealOccasions[occasionId])) {
      report(recipeId, "taxonomy.mealType.mealOccasionIds", "存在未注册的 meal occasion ID");
    }
  }

  if (taxonomy.origin) {
    const country = countries[taxonomy.origin.countryId];
    if (!country) report(recipeId, "taxonomy.origin.countryId", "国家 ID 不在 taxonomy registry 中");
    if (taxonomy.origin.regionId) {
      const region = regions[taxonomy.origin.regionId];
      if (!region) report(recipeId, "taxonomy.origin.regionId", "地域 ID 不在 taxonomy registry 中");
      else if (region.parentId !== taxonomy.origin.countryId) {
        report(recipeId, "taxonomy.origin.regionId", "地域与所属国家不匹配");
      }
    }
  }

  validateTaxonomyList(recipeId, "taxonomy.flavorProfile.tasteIds", taxonomy.flavorProfile?.tasteIds, tasteProfiles, report);
  validateTaxonomyList(recipeId, "taxonomy.flavorProfile.characteristicIds", taxonomy.flavorProfile?.characteristicIds, flavorCharacteristics, report);
  validateTaxonomyList(recipeId, "taxonomy.dietaryTagIds", taxonomy.dietaryTagIds, dietaryTags, report);
  validateTaxonomyList(recipeId, "taxonomy.browseTagIds", taxonomy.browseTagIds, browseTags, report);
  if (taxonomy.browseTagIds?.includes("quick")) {
    report(recipeId, "taxonomy.browseTagIds", "quick 必须由 totalTime 派生，不应静态维护");
  }
}

function validateTaxonomyList(
  recipeId: string,
  field: string,
  values: string[] | undefined,
  registry: Record<string, unknown>,
  report: (recipeId: string, field: string, message: string) => void,
) {
  if (!values) return;
  if (new Set(values).size !== values.length) {
    report(recipeId, field, `${field} 不能重复`);
  }
  if (values.some((value) => !registry[value])) {
    report(recipeId, field, `${field} 存在未注册的 ID`);
  }
}
