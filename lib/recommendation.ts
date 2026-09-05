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
import { scoreFlavorPreferences } from "./flavor";
import { getRecipeCuisineId, getRecipeTagIds } from "./taxonomy";

/** Relative influence of each active soft preference. Scores are normalized over active dimensions. */
export const RECOMMENDATION_WEIGHTS: Readonly<Record<ScoreDimensionKey, number>> = Object.freeze({
  ingredientFit: 0.5,
  cuisine: 0.2,
  tags: 0.15,
  methods: 0.1,
  flavor: 0.2,
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
    criteria.preferredTags?.length || criteria.preferredMethods?.length || criteria.flavorPreferences?.length || hasValue(criteria.maxTime) ||
    hasValue(criteria.maxCalories) || hasValue(criteria.minProtein) || hasValue(criteria.maxOil) ||
    hasValue(criteria.maxSalt) || hasValue(criteria.maxAddedSugar) || hasValue(criteria.maxCost),
  );
}

export function resetRecommendationCriteria(): RecommendationCriteria {
  return { availableIngredients: [], availableTools: [], preferredTags: [], preferredMethods: [], flavorPreferences: [] };
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
      ? recipe.tools.filter((tool) => !availableTools.has(tool)).map((id) => ({ id }))
      : [];
    const hardFailures: HardConstraintFailure[] = [];

    hardCheck(hardFailures, "maxTime", hasValue(criteria.maxTime),
      recipe.cooking.totalTime <= (criteria.maxTime ?? Infinity), "limit-exceeded");
    hardCheck(hardFailures, "maxCalories", hasValue(criteria.maxCalories),
      nutrition.complete && metrics.caloriesPerServing <= (criteria.maxCalories ?? Infinity),
      nutrition.complete ? "limit-exceeded" : "estimate-incomplete");
    hardCheck(hardFailures, "minProtein", hasValue(criteria.minProtein),
      nutrition.complete && metrics.proteinPerServing >= (criteria.minProtein ?? 0),
      nutrition.complete ? "limit-exceeded" : "estimate-incomplete");
    hardCheck(hardFailures, "maxOil", hasValue(criteria.maxOil),
      metrics.oilPerServing <= (criteria.maxOil ?? Infinity), "limit-exceeded");
    hardCheck(hardFailures, "maxSalt", hasValue(criteria.maxSalt),
      metrics.saltPerServing <= (criteria.maxSalt ?? Infinity), "limit-exceeded");
    hardCheck(hardFailures, "maxAddedSugar", hasValue(criteria.maxAddedSugar),
      metrics.addedSugarPerServing <= (criteria.maxAddedSugar ?? Infinity), "limit-exceeded");
    hardCheck(hardFailures, "maxCost", hasValue(criteria.maxCost),
      cost.complete && metrics.costPerServing <= (criteria.maxCost ?? Infinity),
      cost.complete ? "limit-exceeded" : "estimate-incomplete");
    hardCheck(hardFailures, "availableTools", availableTools.size > 0,
      missingTools.length === 0, "missing-tools");

    const scoreBreakdown = this.buildScoreBreakdown(recipe, criteria, ingredientMatch);
    const score = calculateScore(scoreBreakdown);
    const eligible = hardFailures.length === 0;

    return {
      recipe,
      eligible,
      score,
      scoreBreakdown,
      hardFailures,
      ingredientMatch,
      missingIngredients: ingredientMatch.missingIngredients,
      missingTools,
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
        missingIngredients.push({ id: item.ingredientId, category: ingredient?.category });
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
      breakdown.ingredientFit = dimension(ingredientMatch.fit, "ingredientFit");
    }
    if (criteria.preferredCuisine) {
      const cuisineId = getRecipeCuisineId(recipe);
      breakdown.cuisine = dimension(cuisineId === criteria.preferredCuisine ? 1 : 0, "cuisine");
    }
    if (criteria.preferredTags?.length) {
      const recipeTags = getRecipeTagIds(recipe);
      const matches = criteria.preferredTags.filter((tag) => recipeTags.includes(tag)).length;
      breakdown.tags = dimension(matches / criteria.preferredTags.length, "tags");
    }
    if (criteria.preferredMethods?.length) {
      const matches = recipe.taxonomy.techniques.some((techniqueId) => criteria.preferredMethods?.includes(techniqueId));
      breakdown.methods = dimension(matches ? 1 : 0, "methods");
    }
    if (criteria.flavorPreferences?.length) {
      const flavor = scoreFlavorPreferences(recipe.flavor, criteria.flavorPreferences);
      breakdown.flavor = dimension(flavor.score, "flavor");
    }
    return breakdown;
  }
}

function hardCheck(failures: HardConstraintFailure[], criterion: HardConstraintKey,
  active: boolean, passes: boolean, failure: HardConstraintFailure["reason"]) {
  if (!active) return;
  if (!passes) failures.push({ criterion, reason: failure });
}

function dimension(score: number, key: ScoreDimensionKey): ScoreDimension {
  const weight = RECOMMENDATION_WEIGHTS[key];
  return { score, weight, contribution: score * weight };
}

function calculateScore(breakdown: Partial<Record<ScoreDimensionKey, ScoreDimension>>): number {
  const dimensions = Object.values(breakdown);
  if (!dimensions.length) return 100;
  const weight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const contribution = dimensions.reduce((sum, item) => sum + item.contribution, 0);
  return Math.round(contribution / weight * 100);
}

export function discoverRecipes(recipes: readonly Recipe[], criteria: RecommendationCriteria,
  engine: RecommendationEngine = recommendationEngine): RecommendationResult[] {
  return engine.rank([...recipes], criteria).filter(({ eligible }) => eligible);
}

export const recommendationEngine: RecommendationEngine = new RuleRecommendationEngine();
