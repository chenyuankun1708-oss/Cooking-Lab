import type { IngredientCategory } from "./ingredient";
import type { FlavorPreferenceId } from "./flavor";
import type { Recipe } from "./recipe";

export interface RecommendationCriteria {
  availableIngredients?: string[];
  availableTools?: string[];
  maxTime?: number;
  maxCalories?: number;
  minProtein?: number;
  maxOil?: number;
  maxSalt?: number;
  maxAddedSugar?: number;
  maxCost?: number;
  preferredCuisine?: string;
  preferredTags?: string[];
  preferredMethods?: string[];
  flavorPreferences?: FlavorPreferenceId[];
}

export type HardConstraintKey =
  | "maxTime" | "maxCalories" | "minProtein" | "maxOil"
  | "maxSalt" | "maxAddedSugar" | "maxCost" | "availableTools";
export type ScoreDimensionKey = "ingredientFit" | "cuisine" | "tags" | "methods" | "flavor";

export interface HardConstraintFailure {
  criterion: HardConstraintKey;
  reason: "limit-exceeded" | "estimate-incomplete" | "missing-tools";
}

export interface ScoreDimension {
  score: number;
  weight: number;
  contribution: number;
}

export interface IngredientMatch {
  availableRequired: number;
  totalRequired: number;
  fit: number;
  weightedAvailable: number;
  weightedTotal: number;
  missingIngredients: Array<{ id: string; category?: IngredientCategory }>;
}

export interface RecipeMetrics {
  caloriesPerServing: number;
  proteinPerServing: number;
  oilPerServing: number;
  saltPerServing: number;
  addedSugarPerServing: number;
  costPerServing: number;
  nutritionComplete: boolean;
  costComplete: boolean;
}

export interface RecommendationResult {
  recipe: Recipe;
  eligible: boolean;
  score: number;
  scoreBreakdown: Partial<Record<ScoreDimensionKey, ScoreDimension>>;
  hardFailures: HardConstraintFailure[];
  ingredientMatch: IngredientMatch;
  missingIngredients: IngredientMatch["missingIngredients"];
  missingTools: Array<{ id: string }>;
  metrics: RecipeMetrics;
}

export interface RecommendationEngine {
  rank(recipes: Recipe[], criteria: RecommendationCriteria): RecommendationResult[];
}
