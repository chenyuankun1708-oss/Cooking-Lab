import type { RecommendationCriteria } from "./recommendation";

export type DecisionContext = RecommendationCriteria;

export type DecisionContextScope =
  | "estimated-meal-hard"
  | "meal-hard"
  | "recipe-only-hard"
  | "carry-only";

export type DecisionContextValueKind = "id-list" | "id" | "number";

export interface DecisionContextFieldDefinition {
  queryKey: `dc${string}`;
  scope: DecisionContextScope;
  valueKind: DecisionContextValueKind;
}

type DecisionContextFieldDefinitions = {
  [Key in keyof RecommendationCriteria]-?: DecisionContextFieldDefinition;
};

export const decisionContextFieldDefinitions = Object.freeze({
  availableIngredients: { queryKey: "dcIngredient", scope: "carry-only", valueKind: "id-list" },
  availableTools: { queryKey: "dcTool", scope: "meal-hard", valueKind: "id-list" },
  maxTime: { queryKey: "dcMaxTime", scope: "estimated-meal-hard", valueKind: "number" },
  maxCalories: { queryKey: "dcMaxCalories", scope: "recipe-only-hard", valueKind: "number" },
  minProtein: { queryKey: "dcMinProtein", scope: "recipe-only-hard", valueKind: "number" },
  maxOil: { queryKey: "dcMaxOil", scope: "recipe-only-hard", valueKind: "number" },
  maxSalt: { queryKey: "dcMaxSalt", scope: "recipe-only-hard", valueKind: "number" },
  maxAddedSugar: { queryKey: "dcMaxAddedSugar", scope: "recipe-only-hard", valueKind: "number" },
  maxCost: { queryKey: "dcMaxCost", scope: "recipe-only-hard", valueKind: "number" },
  preferredCuisine: { queryKey: "dcCuisine", scope: "carry-only", valueKind: "id" },
  preferredTags: { queryKey: "dcTag", scope: "carry-only", valueKind: "id-list" },
  preferredMethods: { queryKey: "dcMethod", scope: "carry-only", valueKind: "id-list" },
  flavorPreferences: { queryKey: "dcFlavor", scope: "carry-only", valueKind: "id-list" },
} as const satisfies DecisionContextFieldDefinitions);

export const decisionContextFieldOrder = [
  "availableIngredients",
  "availableTools",
  "maxTime",
  "maxCalories",
  "minProtein",
  "maxOil",
  "maxSalt",
  "maxAddedSugar",
  "maxCost",
  "preferredCuisine",
  "preferredTags",
  "preferredMethods",
  "flavorPreferences",
] as const satisfies readonly (keyof RecommendationCriteria)[];
