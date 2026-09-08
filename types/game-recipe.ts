import type { CulinaryItemType } from "./culinary";
import type { Evidence, Source } from "./culinary";
import type {
  AttributionRequirement,
  ContentArtifact,
  RightsAssessment,
  UsageDecision,
} from "./content-rights";
import type { Nutrition } from "./nutrition";
import type {
  PublishingGovernanceRegistry,
  PublishingRiskLevel,
} from "./publishing-governance";
import type { ResearchRecord } from "./research";
import type { GameNormalizationTraceV1 } from "./game-source-facts";

export const gameRecipeSchemaVersion = "cooking-lab-game-recipe-v1" as const;
export const gameManifestSchemaVersion = "cooking-lab-game-manifest-v1" as const;
export const gameOperationCatalogVersion = "cooking-lab-game-operations-v1" as const;
export const gameRightsRegistrySchemaVersion = "cooking-lab-game-rights-v1" as const;

export const gameSimulationProfiles = ["cat-kitchen-goal1-v1", "requires-cat-kitchen-v2", "data-only"] as const;
export type GameSimulationProfile = (typeof gameSimulationProfiles)[number];
export type GameOperationCompatibility = "supported-now" | "macro-supported" | "requires-engine-v2" | "presentation-only";
export type GameRecipeEligibility = "draft" | "exportable";
export type GameIngredientState = "raw" | "dry" | "liquid" | "cooked" | "prepared" | "ready-to-serve";
export const gameSourceQuantityUnits = [
  "g", "kg", "ml", "l", "piece", "tbsp", "tsp", "cup", "lb", "oz", "pint", "quart", "gallon",
] as const;
export type GameSourceQuantityUnit = (typeof gameSourceQuantityUnits)[number];

export const gameOperationIds = [
  "wash", "peel", "slice", "dice", "mince", "crush", "grind",
  "add", "mix", "whisk", "knead", "fold", "shape",
  "marinate", "rest", "proof", "ferment",
  "set-heat", "boil", "simmer", "steam", "pan-fry", "deep-fry", "bake", "roast", "grill",
  "stir", "toss", "season", "drain", "rinse", "strain", "blend",
  "brew", "extract", "chill", "freeze", "assemble", "garnish", "serve",
] as const;
export type GameOperationId = (typeof gameOperationIds)[number];

export interface GameOperationDefinitionV1 {
  id: GameOperationId;
  family: "preparation" | "mixing" | "waiting" | "heating" | "separation" | "beverage" | "finishing";
  compatibility: GameOperationCompatibility;
  simulationAffecting: boolean;
  allowedParameters: readonly GameOperationParameterKey[];
  requiredParameterGroups: readonly (readonly GameOperationParameterKey[])[];
  inputRequirement: "none" | "one-or-more";
  equipmentRequired: boolean;
  compatibleEquipmentIds: readonly string[];
  durationRequirement: "none" | "active" | "wait" | "either";
  targetStateRequired: boolean;
  legacyCommand?: "CUT" | "ADD" | "SET_HEAT" | "WAIT" | "STIR" | "SEASON" | "PLATE";
}

export type GameOperationParameterKey =
  | "cutSizeMm"
  | "uniformity"
  | "heatLevel"
  | "temperatureC"
  | "strength"
  | "quantityG"
  | "capacityG";

export interface GameOperationParametersV1 {
  cutSizeMm?: number;
  uniformity?: number;
  heatLevel?: number;
  temperatureC?: number;
  strength?: number;
  quantityG?: number;
  capacityG?: number;
}

export type GameHeatControlV1 =
  | { kind: "exact-temperature"; temperatureC: number; sourceFactId: string }
  | { kind: "qualitative"; descriptorId: string; sourceFactId: string }
  | { kind: "independently-calibrated"; parameter: "temperatureC" | "heatLevel"; value: number; sourceFactId: string; calibrationEvidenceId: string };

export interface GameIngredientPortionV1 {
  portionId: string;
  ingredientId: string;
  initialState: GameIngredientState;
  sourceQuantity: {
    amount: number;
    unit: GameSourceQuantityUnit;
    conversionRecordId: string;
  };
  massG: number;
  volumeMl?: number;
  optional: boolean;
  phase: string;
  allowedSubstitutionIngredientIds: string[];
  nutritionProvenanceId: string;
}

export type GameTargetDimension =
  | "doneness"
  | "wateriness"
  | "browning"
  | "burn"
  | "aroma"
  | "salt"
  | "sweet"
  | "acidity"
  | "umami"
  | "pungency"
  | "bitterness"
  | "structural-integrity";

export interface GameTargetStateV1 {
  dimension: GameTargetDimension;
  minimum?: number;
  maximum?: number;
  unit: "normalized";
}

export interface GameOperationNodeV1 {
  nodeId: string;
  operationType: GameOperationId;
  dependsOn: string[];
  inputPortionIds: string[];
  outputStateIds: string[];
  equipmentId?: string;
  activeDurationMs: number;
  waitDurationMs: number;
  parameters: GameOperationParametersV1;
  heatControl?: GameHeatControlV1;
  targetStates: GameTargetStateV1[];
  criticality: "quality" | "completion" | "safety";
  sourceStepOrder?: number;
}

export const gameMutationTypes = [
  "omit", "reorder", "duplicate", "quantity-too-low", "quantity-too-high", "heat-too-low", "heat-too-high",
  "duration-too-short", "duration-too-long", "cut-size-too-small", "cut-size-too-large", "low-uniformity",
  "season-too-early", "season-too-late", "overcrowding", "wrong-equipment", "missing-state-transition",
  "allowed-substitution",
] as const;
export type GameMutationType = (typeof gameMutationTypes)[number];

export interface GameRecipeMutationV1 {
  type: GameMutationType;
  targetNodeId?: string;
  destinationBeforeNodeId?: string;
  targetPortionId?: string;
  scalar?: number;
  replacementIngredientId?: string;
  replacementEquipmentId?: string;
}

export interface GameSensoryDeltaV1 {
  dimension: GameTargetDimension;
  direction: "increase" | "decrease" | "unchanged";
  confidence: "modeled" | "rule-based";
}

export interface GameRecipeScenarioV1 {
  scenarioId: string;
  baselineArtifactVersion: string;
  mutation: GameRecipeMutationV1;
  expectedDeltas: GameSensoryDeltaV1[];
  expectedFaultCodes: string[];
  causeCodes: string[];
  recoverability: "recoverable" | "partially-recoverable" | "terminal";
  nutritionEffect: "unchanged" | "recalculate-from-quantities" | "requires-retention-model";
  applicableEngine: GameSimulationProfile;
}

export interface GameNutritionProvenanceV1 {
  ingredientId: string;
  nutritionProvenanceId: string;
  provider: string;
  datasetVersion: string;
  upstreamRecordId: string;
  basis: "per-100g";
  ingredientState: GameIngredientState;
  conversionMethod: string;
  yieldFactor: number;
  retentionFactor: number;
  accessedAt: string;
}

export interface GameNutritionProfileV1 {
  method: "ingredient-sum-v1";
  servings: number;
  total: Nutrition;
  perServing: Nutrition;
  provenance: GameNutritionProvenanceV1[];
  estimated: true;
}

export interface GameIngredientDefinitionV1 {
  ingredientId: string;
  sourceIngredientId?: string;
  defaultState: GameIngredientState;
  densityGPerMl?: number;
  unitWeightsG: Partial<Record<Exclude<GameSourceQuantityUnit, "g" | "kg" | "lb" | "oz">, number>>;
  nutritionPer100g: Nutrition;
  nutritionProvenanceId: string;
  nutritionSource:
    | {
        kind: "dataset";
        datasetId: "usda-fooddata-central";
        datasetVersion: string;
        fdcId: string;
        sourceDescription: string;
        accessedAt: string;
      }
    | {
        kind: "migration-estimate";
        provenanceId: string;
        limitations: string;
      };
  simulationProfile?: {
    waterFraction: number;
    fatFraction: number;
    proteinFraction: number;
    sugarFraction: number;
    provenance: "requires-cat-kitchen-calibration";
  };
}

export interface GameUnitConversionRecordV1 {
  recordId: string;
  unit: GameSourceQuantityUnit;
  gramsPerUnit: number;
  ingredientId?: string;
  basis: string;
  provenanceId: string;
}

export interface GameIngredientCatalogV1 {
  schemaVersion: "cooking-lab-game-ingredients-v1";
  catalogVersion: string;
  ingredients: GameIngredientDefinitionV1[];
  conversionRecords: GameUnitConversionRecordV1[];
}

export interface GameNutritionDatasetRecordV1 {
  ingredientId: string;
  fdcId: string;
  dataType: "Foundation" | "SR Legacy";
  datasetVersion: string;
  sourceDescription: string;
  accessedAt: string;
  nutritionPer100g: Nutrition;
}

export interface GameNutritionDatasetSubsetV1 {
  schemaVersion: "cooking-lab-usda-subset-v1";
  provider: "USDA FoodData Central";
  sourceUrl: string;
  licenseId: "CC0-1.0";
  upstreamArchives: Array<{
    dataType: "Foundation" | "SR Legacy";
    datasetVersion: string;
    url: string;
    sha256: string;
  }>;
  records: GameNutritionDatasetRecordV1[];
}

export interface GameRecipeRightsV1 {
  artifactIds: string[];
  usageDecisionIds: string[];
  sourceIds: string[];
  evidenceIds: string[];
  intendedUse: "game-commercial-ready";
}

export interface GameRecipeGovernanceV1 {
  riskLevel: PublishingRiskLevel;
  riskClassificationId: string;
  reviewAttestationIds: string[];
  samplingBatchId?: string;
}

export interface GameRecipeV1 {
  schemaVersion: typeof gameRecipeSchemaVersion;
  artifactVersion: string;
  recipeId: string;
  slug: string;
  sourceCulinaryItemId?: string;
  itemType: CulinaryItemType;
  eligibility: GameRecipeEligibility;
  simulationProfile: GameSimulationProfile;
  servings: number;
  yield: { amount: number; unit: "serving" | "piece" | "ml" | "g" };
  ingredientPortions: GameIngredientPortionV1[];
  operationGraph: { nodes: GameOperationNodeV1[] };
  nutritionProfile: GameNutritionProfileV1;
  scenarios: GameRecipeScenarioV1[];
  rights: GameRecipeRightsV1;
  governance: GameRecipeGovernanceV1;
  authoring: {
    method: "deterministic-migration" | "deterministic-source-normalization";
    generatorVersion: string;
    containsGeneratedExpression: false;
    unresolvedMappings: string[];
    normalizationTrace?: GameNormalizationTraceV1;
  };
}

export interface GameRightsRegistryV1 {
  schemaVersion: typeof gameRightsRegistrySchemaVersion;
  policyVersion: string;
  artifacts: ContentArtifact[];
  assessments: RightsAssessment[];
  attributions: AttributionRequirement[];
  decisions: UsageDecision[];
  sources: Source[];
  evidence: Evidence[];
  evidenceOrigins: Array<{
    evidenceId: string;
    origin: "source-record" | "ai-output";
  }>;
  sourceRoles: Array<{
    sourceId: string;
    role: "recipe-primary" | "recipe-cross-check" | "nutrition" | "safety";
    recipeId?: string;
    workFamilyId?: string;
  }>;
  researchRecords: ResearchRecord[];
  governance: PublishingGovernanceRegistry;
}

export interface GameManifestRecipeEntryV1 {
  recipeId: string;
  path: string;
  sha256: string;
  artifactVersion: string;
  simulationProfile: GameSimulationProfile;
}

export interface GameDataManifestV1 {
  schemaVersion: typeof gameManifestSchemaVersion;
  catalogVersion: string;
  generatorVersion: string;
  minimumAdapterVersion: string;
  recipeCount: number;
  recipes: GameManifestRecipeEntryV1[];
  rightsSummary: {
    intendedUse: "game-commercial-ready";
    artifactCount: number;
    decisionCount: number;
    allowCount: number;
    allowWithObligationsCount: number;
    sourceCount: number;
    licenseIds: string[];
  };
  reviewSummary: {
    riskCounts: Record<PublishingRiskLevel, number>;
    attestationCount: number;
    samplingBatchCount: number;
    reviewedRecipeCount: number;
  };
  ingredientCatalog: { path: string; sha256: string };
  nutritionDataset: {
    path: string;
    sha256: string;
    schemaVersion: GameNutritionDatasetSubsetV1["schemaVersion"];
    provider: GameNutritionDatasetSubsetV1["provider"];
    upstreamArchives: Array<Pick<GameNutritionDatasetSubsetV1["upstreamArchives"][number], "datasetVersion" | "sha256">>;
  };
  operationCatalog: { path: string; sha256: string; version: typeof gameOperationCatalogVersion };
  rightsRegistry: { path: string; sha256: string; version: typeof gameRightsRegistrySchemaVersion };
  attribution: { path: string; sha256: string };
  sqlite: { path: string; sha256: string };
}
