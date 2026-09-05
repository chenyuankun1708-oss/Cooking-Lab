import type { CulinaryItem, MealRoleId } from "./culinary";
import type { Nutrition } from "./nutrition";

export const mealTemplateIds = [
  "main-drink",
  "starter-main-drink",
  "main-drink-dessert",
  "drink-dessert",
] as const;
export type MealTemplateId = (typeof mealTemplateIds)[number];
export type MealSlotId = "starter" | "main" | "drink" | "dessert";

export type FlavorComplementId =
  | "acid-richness"
  | "cooling-spicy"
  | "sweet-bitter"
  | "fresh-umami";

export type PairingReason =
  | { kind: "flavor-complement"; complementId: FlavorComplementId }
  | { kind: "flavor-continuity"; dimension: "taste" | "aroma"; ids: string[] }
  | { kind: "weight-balance"; values: string[] }
  | { kind: "texture-contrast"; ids: string[] }
  | { kind: "temperature-relationship"; values: string[] }
  | { kind: "cuisine-coherence"; ids: string[] }
  | { kind: "serving-context"; ids: string[] }
  | { kind: "meal-role-fit"; roles: [MealRoleId, MealRoleId] };

export type PairingCaution =
  | { kind: "shared-richness" }
  | { kind: "repeated-texture"; ids: string[] }
  | { kind: "serving-context-mismatch" }
  | { kind: "limited-flavor-connection" }
  | { kind: "alcoholic-option" };

export interface PairingScoreBreakdown {
  roleCompatibility: number;
  flavorComplement: number;
  flavorContinuity: number;
  weightBalance: number;
  textureContrast: number;
  temperatureRelationship: number;
  cuisineCoherence: number;
  servingContext: number;
}

export interface PairingScoreResult {
  anchor: CulinaryItem;
  candidate: CulinaryItem;
  score: number;
  eligible: boolean;
  roles?: [MealRoleId, MealRoleId];
  breakdown: PairingScoreBreakdown;
  reasons: PairingReason[];
  cautions: PairingCaution[];
}

export interface MealCompositionItem {
  item: CulinaryItem;
  slotId: MealSlotId;
  roleId: MealRoleId;
}

export type EstimateCoverage = "complete" | "partial" | "unavailable";

export interface MealNutritionEstimate {
  coverage: EstimateCoverage;
  includedItemCount: number;
  totalItemCount: number;
  notApplicableItemCount: number;
  value?: Nutrition;
}

export interface MealCostEstimate {
  coverage: EstimateCoverage;
  includedItemCount: number;
  totalItemCount: number;
  currency: "CNY";
  value?: number;
}

export interface MealPreparationBurden {
  level: "simple" | "moderate" | "involved";
  activeMinutes: number;
  estimatedElapsedMinutes: number;
  sequentialElapsedMinutes: number;
  parallelizableMinutes: number;
  proceduralItemCount: number;
  servingOnlyItemCount: number;
  overlappingToolIds: string[];
}

export const mealConstraintIds = ["estimated-elapsed-time", "available-tools"] as const;
export type MealConstraintId = (typeof mealConstraintIds)[number];

export type MealConstraintOutcome =
  | {
      constraintId: "estimated-elapsed-time";
      status: "satisfied" | "exceeded";
      limitMinutes: number;
      estimatedElapsedMinutes: number;
    }
  | {
      constraintId: "available-tools";
      status: "satisfied" | "exceeded";
      availableToolIds: string[];
      requiredToolIds: string[];
      missingToolIds: string[];
    };

export type MealCompositionEmptyReason =
  | { kind: "quality-threshold" }
  | { kind: "constraints-exceeded"; outcomes: MealConstraintOutcome[] };

export interface MealScoreBreakdown {
  pairCompatibility: number;
  roleCompleteness: number;
  flavorBalance: number;
  textureVariety: number;
  weightProgression: number;
  preparationPracticality: number;
  repetitionPenalty: number;
}

export interface MealComposition {
  templateId: MealTemplateId | "partial-pair";
  completeness: "complete" | "partial";
  anchorId: string;
  items: MealCompositionItem[];
  missingSlotIds: MealSlotId[];
  score: number;
  breakdown: MealScoreBreakdown;
  pairings: PairingScoreResult[];
  reasons: PairingReason[];
  cautions: PairingCaution[];
  preparation: MealPreparationBurden;
  constraintOutcomes: MealConstraintOutcome[];
  nutrition: MealNutritionEstimate;
  cost: MealCostEstimate;
}

export interface MealCompositionResult {
  anchor: CulinaryItem;
  primary?: MealComposition;
  alternatives: MealComposition[];
  emptyReason?: MealCompositionEmptyReason;
  relaxationOptions: MealConstraintId[];
}
