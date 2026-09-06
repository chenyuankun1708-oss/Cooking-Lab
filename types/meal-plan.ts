import type { Unit } from "./ingredient";

export const mealPlanSchemaVersion = 1 as const;
export const mealPlanMaxItems = 8;

export type MealPlanTaskKind = "active" | "wait" | "prepare-ahead" | "serve";

export interface MealPlanSelection {
  itemId: string;
  servings: number;
}

export interface MealPlanShoppingLine {
  id: string;
  kind: "ingredient" | "finished-item";
  ingredientId?: string;
  itemId?: string;
  amount: number;
  unit: Unit | "item";
  optional: boolean;
  sourceItemIds: string[];
}

export interface MealPlanTask {
  id: string;
  itemId: string;
  stepOrder?: number;
  kind: MealPlanTaskKind;
  durationMinutes: number;
  startOffsetMinutes: number;
  dependencyIds: string[];
  resourceIds: string[];
}

export interface MealPlanV1 {
  schemaVersion: typeof mealPlanSchemaVersion;
  id: string;
  selections: MealPlanSelection[];
  shopping: MealPlanShoppingLine[];
  timeline: MealPlanTask[];
  totalMinutes: number;
}

export interface MealPlanLocalStateV1 {
  schemaVersion: typeof mealPlanSchemaVersion;
  plan: MealPlanV1;
  checkedShoppingLineIds: string[];
  completedTaskIds: string[];
  activeTimer?: { taskId: string; startedAt: string };
  updatedAt: string;
}

export interface MealPlanSharePayloadV1 {
  version: typeof mealPlanSchemaVersion;
  items: Array<{ slug: string; servings: number }>;
  template?: string;
}
