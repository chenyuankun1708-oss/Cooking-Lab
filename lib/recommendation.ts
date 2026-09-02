import type { RecommendationCriteria, RecommendationEngine, RecommendationResult } from "@/types/recommendation";
import type { Recipe } from "@/types/recipe";
import { calculateCost } from "./cost";
import { type IngredientRepository, localIngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";

interface Check { active: boolean; matched: boolean; matchedReason: string; unmatchedReason: string }
const hasValue = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value) && value >= 0;

export function hasActiveCriteria(criteria: RecommendationCriteria): boolean {
  return Boolean(criteria.availableIngredients?.length || criteria.availableTools?.length || criteria.cuisine ||
    criteria.dietaryTags?.length || criteria.preferredCookingMethods?.length || hasValue(criteria.maxTime) ||
    hasValue(criteria.maxCalories) || hasValue(criteria.minProtein) || hasValue(criteria.maxOil) ||
    hasValue(criteria.maxSalt) || hasValue(criteria.maxAddedSugar) || hasValue(criteria.maxCost));
}

export function resetRecommendationCriteria(): RecommendationCriteria {
  return { availableIngredients: [], availableTools: [], dietaryTags: [] };
}

export class RuleRecommendationEngine implements RecommendationEngine {
  constructor(private readonly repository: IngredientRepository = localIngredientRepository) {}

  rank(recipes: Recipe[], criteria: RecommendationCriteria): RecommendationResult[] {
    return recipes.map((recipe) => this.score(recipe, criteria)).sort((a, b) =>
      b.score - a.score || a.recipe.cooking.totalTime - b.recipe.cooking.totalTime || a.recipe.id.localeCompare(b.recipe.id));
  }

  private score(recipe: Recipe, criteria: RecommendationCriteria): RecommendationResult {
    const nutrition = calculateNutrition(recipe.ingredients, this.repository);
    const cost = calculateCost(recipe.ingredients, this.repository);
    const caloriesPerServing = nutrition.total.calories / recipe.servings;
    const proteinPerServing = nutrition.total.protein / recipe.servings;
    const costPerServing = cost.estimated / recipe.servings;
    const availableIngredients = new Set(criteria.availableIngredients ?? []);
    const availableTools = new Set(criteria.availableTools ?? []);
    const dietaryTags = new Set(criteria.dietaryTags ?? []);
    const methods = new Set(criteria.preferredCookingMethods ?? []);
    const missingIngredients = recipe.ingredients.filter((item) => !item.optional && !availableIngredients.has(item.ingredientId));
    const missingTools = recipe.tools.filter((tool) => !availableTools.has(tool));
    const checks: Check[] = [
      check(hasValue(criteria.maxTime), recipe.cooking.totalTime <= (criteria.maxTime ?? Infinity), `不超过 ${criteria.maxTime} 分钟`, "超过时间限制"),
      check(hasValue(criteria.maxCalories), nutrition.complete && caloriesPerServing <= (criteria.maxCalories ?? Infinity), `每份约 ${Math.round(caloriesPerServing)} kcal`, nutrition.complete ? "超过热量上限" : "营养估算不完整"),
      check(hasValue(criteria.minProtein), nutrition.complete && proteinPerServing >= (criteria.minProtein ?? 0), `每份蛋白质约 ${proteinPerServing.toFixed(1)} g`, nutrition.complete ? "未达到蛋白质目标" : "营养估算不完整"),
      check(hasValue(criteria.maxOil), recipe.cooking.oil <= (criteria.maxOil ?? Infinity), `用油 ${recipe.cooking.oil} g`, "超过用油限制"),
      check(hasValue(criteria.maxCost), cost.complete && costPerServing <= (criteria.maxCost ?? Infinity), `每份预计 ¥${costPerServing.toFixed(1)}`, cost.complete ? "超过预算" : "成本估算不完整"),
      check(availableIngredients.size > 0, missingIngredients.length === 0, "必需食材齐全", `缺少 ${missingIngredients.length} 种必需食材`),
      check(availableTools.size > 0, missingTools.length === 0, "所需厨具齐全", `缺少 ${missingTools.length} 件厨具`),
      check(Boolean(criteria.cuisine), recipe.cuisine === criteria.cuisine, `符合${criteria.cuisine}菜系`, "菜系不匹配"),
      check(dietaryTags.size > 0, [...dietaryTags].every((tag) => recipe.tags.includes(tag)), "包含全部所选标签", "标签不匹配"),
      check(methods.size > 0, methods.has(recipe.cooking.method), "烹饪技法匹配", "烹饪技法不匹配"),
    ];
    const activeChecks = checks.filter(({ active }) => active);
    const matchedConditions = activeChecks.filter(({ matched }) => matched).map(({ matchedReason }) => matchedReason);
    const unmatchedConditions = activeChecks.filter(({ matched }) => !matched).map(({ unmatchedReason }) => unmatchedReason);
    const score = activeChecks.length ? Math.round(matchedConditions.length / activeChecks.length * 100) : 100;
    return {
      recipe, score, matchedConditions, unmatchedConditions,
      explanation: activeChecks.length ? `${matchedConditions.length}/${activeChecks.length} 项条件匹配。` : "尚未设置条件，展示全部菜谱。",
      metrics: { caloriesPerServing, proteinPerServing, costPerServing, nutritionComplete: nutrition.complete, costComplete: cost.complete },
    };
  }
}

function check(active: boolean, matched: boolean, matchedReason: string, unmatchedReason: string): Check {
  return { active, matched, matchedReason, unmatchedReason };
}

export function discoverRecipes(recipes: Recipe[], criteria: RecommendationCriteria, engine: RecommendationEngine = recommendationEngine): RecommendationResult[] {
  const ranked = engine.rank(recipes, criteria);
  return hasActiveCriteria(criteria) ? ranked.filter(({ score }) => score === 100) : ranked;
}

export const recommendationEngine: RecommendationEngine = new RuleRecommendationEngine();
