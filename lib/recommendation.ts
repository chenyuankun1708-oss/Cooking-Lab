import type { IngredientCategory } from "@/types/ingredient";
import type {
  HardConstraintFailure,
  HardConstraintKey,
  IngredientMatch,
  RecommendationCriteria,
  RecommendationEngine,
  RecommendationResult,
  ScoreDimension,
  ScoreDimensionKey,
} from "@/types/recommendation";
import type { Recipe } from "@/types/recipe";
import { calculateCost } from "./cost";
import { type IngredientRepository, localIngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";
import { getRecipeCuisineId, getRecipeCuisineLabel, getRecipePrimaryTechniqueLabel, getRecipeTagIds } from "./taxonomy";
import { getToolLabel } from "./tool-labels";

/** Relative influence of each active soft preference. Scores are normalized over active dimensions. */
export const RECOMMENDATION_WEIGHTS: Readonly<Record<ScoreDimensionKey, number>> = Object.freeze({
  ingredientFit: 0.5,
  cuisine: 0.2,
  tags: 0.2,
  methods: 0.1,
});

/** Pantry staples should not outweigh a missing core protein, vegetable, or grain. */
export const INGREDIENT_CATEGORY_WEIGHTS: Readonly<Record<IngredientCategory, number>> = Object.freeze({
  protein: 1,
  vegetable: 1,
  grain: 1,
  dairy: 1,
  seasoning: 0.25,
  oil: 0.25,
});

const hasValue = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

export function hasActiveCriteria(criteria: RecommendationCriteria): boolean {
  return Boolean(
    criteria.availableIngredients?.length || criteria.availableTools?.length || criteria.preferredCuisine ||
    criteria.preferredTags?.length || criteria.preferredMethods?.length || hasValue(criteria.maxTime) ||
    hasValue(criteria.maxCalories) || hasValue(criteria.minProtein) || hasValue(criteria.maxOil) ||
    hasValue(criteria.maxSalt) || hasValue(criteria.maxAddedSugar) || hasValue(criteria.maxCost),
  );
}

export function resetRecommendationCriteria(): RecommendationCriteria {
  return { availableIngredients: [], availableTools: [], preferredTags: [], preferredMethods: [] };
}

export class RuleRecommendationEngine implements RecommendationEngine {
  constructor(private readonly repository: IngredientRepository = localIngredientRepository) {}

  rank(recipes: Recipe[], criteria: RecommendationCriteria): RecommendationResult[] {
    return recipes.map((recipe) => this.evaluate(recipe, criteria)).sort((a, b) =>
      Number(b.eligible) - Number(a.eligible) || b.score - a.score ||
      b.ingredientMatch.fit - a.ingredientMatch.fit ||
      a.recipe.cooking.totalTime - b.recipe.cooking.totalTime || a.recipe.id.localeCompare(b.recipe.id));
  }

  private evaluate(recipe: Recipe, criteria: RecommendationCriteria): RecommendationResult {
    const nutrition = calculateNutrition(recipe.ingredients, this.repository);
    const cost = calculateCost(recipe.ingredients, this.repository);
    const metrics = {
      caloriesPerServing: nutrition.total.calories / recipe.servings,
      proteinPerServing: nutrition.total.protein / recipe.servings,
      oilPerServing: recipe.cooking.oil / recipe.servings,
      saltPerServing: recipe.cooking.salt / recipe.servings,
      addedSugarPerServing: recipe.cooking.addedSugar / recipe.servings,
      costPerServing: cost.estimated / recipe.servings,
      nutritionComplete: nutrition.complete,
      costComplete: cost.complete,
    };
    const ingredientMatch = this.evaluateIngredients(recipe, criteria.availableIngredients);
    const availableTools = new Set(criteria.availableTools ?? []);
    const missingTools = availableTools.size
      ? recipe.tools.filter((tool) => !availableTools.has(tool)).map((id) => ({ id, name: getToolLabel(id) }))
      : [];
    const hardFailures: HardConstraintFailure[] = [];
    const matchedConditions: string[] = [];

    hardCheck(hardFailures, matchedConditions, "maxTime", hasValue(criteria.maxTime),
      recipe.cooking.totalTime <= (criteria.maxTime ?? Infinity), `不超过 ${criteria.maxTime} 分钟`, "超过时间限制");
    hardCheck(hardFailures, matchedConditions, "maxCalories", hasValue(criteria.maxCalories),
      nutrition.complete && metrics.caloriesPerServing <= (criteria.maxCalories ?? Infinity),
      `每份不超过 ${criteria.maxCalories} kcal`, nutrition.complete ? "超过每份热量上限" : "营养估算不完整，无法验证热量限制");
    hardCheck(hardFailures, matchedConditions, "minProtein", hasValue(criteria.minProtein),
      nutrition.complete && metrics.proteinPerServing >= (criteria.minProtein ?? 0),
      `每份蛋白质达到 ${criteria.minProtein} g`, nutrition.complete ? "未达到每份蛋白质目标" : "营养估算不完整，无法验证蛋白质目标");
    hardCheck(hardFailures, matchedConditions, "maxOil", hasValue(criteria.maxOil),
      metrics.oilPerServing <= (criteria.maxOil ?? Infinity), `每份用油不超过 ${criteria.maxOil} g`, "超过每份用油限制");
    hardCheck(hardFailures, matchedConditions, "maxSalt", hasValue(criteria.maxSalt),
      metrics.saltPerServing <= (criteria.maxSalt ?? Infinity), `每份盐不超过 ${criteria.maxSalt} g`, "超过每份盐限制");
    hardCheck(hardFailures, matchedConditions, "maxAddedSugar", hasValue(criteria.maxAddedSugar),
      metrics.addedSugarPerServing <= (criteria.maxAddedSugar ?? Infinity), `每份添加糖不超过 ${criteria.maxAddedSugar} g`, "超过每份添加糖限制");
    hardCheck(hardFailures, matchedConditions, "maxCost", hasValue(criteria.maxCost),
      cost.complete && metrics.costPerServing <= (criteria.maxCost ?? Infinity),
      `每份预计成本不超过 ¥${criteria.maxCost}`, cost.complete ? "超过每份预算" : "成本估算不完整，无法验证预算");
    hardCheck(hardFailures, matchedConditions, "availableTools", availableTools.size > 0,
      missingTools.length === 0, "所需厨具齐全", `缺少厨具：${missingTools.map(({ name }) => name).join("、")}`);

    const scoreBreakdown = this.buildScoreBreakdown(recipe, criteria, ingredientMatch);
    const score = calculateScore(scoreBreakdown);
    const unmatchedConditions = buildSoftConditionMessages(scoreBreakdown);
    matchedConditions.push(...buildMatchedSoftMessages(scoreBreakdown));
    const eligible = hardFailures.length === 0;

    return {
      recipe,
      eligible,
      score,
      scoreBreakdown,
      matchedConditions,
      unmatchedConditions,
      hardFailures,
      ingredientMatch,
      missingIngredients: ingredientMatch.missingIngredients,
      missingTools,
      explanation: buildRecommendationExplanation({ recipe, eligible, hardFailures, ingredientMatch, scoreBreakdown }),
      metrics,
    };
  }

  private evaluateIngredients(recipe: Recipe, availableIngredientIds: string[] | undefined): IngredientMatch {
    const available = new Set(availableIngredientIds ?? []);
    const required = recipe.ingredients.filter((item) => !item.optional);
    let weightedAvailable = 0;
    let weightedTotal = 0;
    let availableRequired = 0;
    const missingIngredients: IngredientMatch["missingIngredients"] = [];
    for (const item of required) {
      const ingredient = this.repository.getById(item.ingredientId);
      const weight = ingredient ? INGREDIENT_CATEGORY_WEIGHTS[ingredient.category] : 1;
      weightedTotal += weight;
      if (available.has(item.ingredientId)) {
        availableRequired += 1;
        weightedAvailable += weight;
      } else {
        missingIngredients.push({ id: item.ingredientId, name: ingredient?.name ?? item.ingredientId, category: ingredient?.category });
      }
    }
    return {
      availableRequired,
      totalRequired: required.length,
      fit: weightedTotal ? weightedAvailable / weightedTotal : 1,
      weightedAvailable,
      weightedTotal,
      missingIngredients,
    };
  }

  private buildScoreBreakdown(recipe: Recipe, criteria: RecommendationCriteria, ingredientMatch: IngredientMatch) {
    const breakdown: Partial<Record<ScoreDimensionKey, ScoreDimension>> = {};
    if (criteria.availableIngredients?.length) {
      breakdown.ingredientFit = dimension(ingredientMatch.fit, "ingredientFit",
        `已有 ${ingredientMatch.availableRequired}/${ingredientMatch.totalRequired} 种必需食材`);
    }
    if (criteria.preferredCuisine) {
      const cuisineId = getRecipeCuisineId(recipe);
      breakdown.cuisine = dimension(cuisineId === criteria.preferredCuisine ? 1 : 0, "cuisine",
        cuisineId === criteria.preferredCuisine
          ? `符合${getRecipeCuisineLabel(recipe)}偏好`
          : `菜系为${getRecipeCuisineLabel(recipe)}`);
    }
    if (criteria.preferredTags?.length) {
      const recipeTags = getRecipeTagIds(recipe);
      const matches = criteria.preferredTags.filter((tag) => recipeTags.includes(tag)).length;
      breakdown.tags = dimension(matches / criteria.preferredTags.length, "tags",
        `匹配 ${matches}/${criteria.preferredTags.length} 个标签偏好`);
    }
    if (criteria.preferredMethods?.length) {
      const matches = recipe.taxonomy.techniques.some((techniqueId) => criteria.preferredMethods?.includes(techniqueId));
      breakdown.methods = dimension(matches ? 1 : 0, "methods",
        matches ? `符合${getRecipePrimaryTechniqueLabel(recipe)}偏好` : `技法为${getRecipePrimaryTechniqueLabel(recipe)}`);
    }
    return breakdown;
  }
}

function hardCheck(failures: HardConstraintFailure[], matched: string[], criterion: HardConstraintKey,
  active: boolean, passes: boolean, success: string, failure: string) {
  if (!active) return;
  if (passes) matched.push(success);
  else failures.push({ criterion, message: failure });
}

function dimension(score: number, key: ScoreDimensionKey, explanation: string): ScoreDimension {
  const weight = RECOMMENDATION_WEIGHTS[key];
  return { score, weight, contribution: score * weight, explanation };
}

function calculateScore(breakdown: Partial<Record<ScoreDimensionKey, ScoreDimension>>): number {
  const dimensions = Object.values(breakdown);
  if (!dimensions.length) return 100;
  const weight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const contribution = dimensions.reduce((sum, item) => sum + item.contribution, 0);
  return Math.round(contribution / weight * 100);
}

function buildMatchedSoftMessages(breakdown: Partial<Record<ScoreDimensionKey, ScoreDimension>>): string[] {
  return Object.values(breakdown).filter(({ score }) => score === 1).map(({ explanation }) => explanation);
}

function buildSoftConditionMessages(breakdown: Partial<Record<ScoreDimensionKey, ScoreDimension>>): string[] {
  return Object.values(breakdown).filter(({ score }) => score < 1).map(({ explanation }) => explanation);
}

export function buildRecommendationExplanation(input: Pick<RecommendationResult,
  "recipe" | "eligible" | "hardFailures" | "ingredientMatch" | "scoreBreakdown">): string {
  if (!input.eligible) return `当前无法直接推荐：${input.hardFailures.map(({ message }) => message).join("；")}。`;
  const parts: string[] = [];
  if (input.scoreBreakdown.ingredientFit) {
    const missingNames = input.ingredientMatch.missingIngredients.map(({ name }) => name).join("、");
    const missingPhrase = input.ingredientMatch.missingIngredients.length <= 1
      ? `只缺${missingNames}`
      : `还缺${missingNames}`;
    parts.push(input.ingredientMatch.fit === 1
      ? "必需食材已齐全"
      : `已有 ${input.ingredientMatch.availableRequired}/${input.ingredientMatch.totalRequired} 种必需食材，${missingPhrase}`);
  }
  const preferenceMatches = Object.entries(input.scoreBreakdown)
    .filter(([key, value]) => key !== "ingredientFit" && value && value.score > 0)
    .map(([, value]) => value!.explanation);
  if (preferenceMatches.length) parts.push(preferenceMatches.join("，"));
  return parts.length ? `${parts.join("；")}，因此优先推荐。` : "满足全部硬性条件，当前未设置其他偏好。";
}

export function discoverRecipes(recipes: Recipe[], criteria: RecommendationCriteria,
  engine: RecommendationEngine = recommendationEngine): RecommendationResult[] {
  return engine.rank(recipes, criteria).filter(({ eligible }) => eligible);
}

export function buildRelaxationSuggestions(criteria: RecommendationCriteria): string[] {
  const suggestions: string[] = [];
  if (hasValue(criteria.maxTime)) suggestions.push("放宽最长时间");
  if (hasValue(criteria.maxCalories) || hasValue(criteria.minProtein)) suggestions.push("调整每份营养目标");
  if (hasValue(criteria.maxOil) || hasValue(criteria.maxSalt) || hasValue(criteria.maxAddedSugar)) suggestions.push("放宽每份油盐糖限制");
  if (hasValue(criteria.maxCost)) suggestions.push("提高每份预算");
  if (criteria.availableTools?.length) suggestions.push("补充可用厨具");
  return suggestions.length ? suggestions : ["减少偏好条件"];
}

export const recommendationEngine: RecommendationEngine = new RuleRecommendationEngine();
