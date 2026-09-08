import type { GameIngredientState, GameOperationId, GameTargetDimension } from "./game-recipe";

export const gameSourceFactBundleSchemaVersion = "cooking-lab-game-source-facts-v1" as const;
export const gameNormalizationRegistrySchemaVersion = "cooking-lab-game-normalization-v1" as const;

export interface GameFactLocatorV1 {
  sourceDocumentId: string;
  workFamilyId: string;
  itemUrl: string;
  derivativeSha256: string;
  pageId: string;
  startLine: number;
  endLine: number;
}

export interface RationalQuantityV1 {
  numerator: number;
  denominator: number;
  rawToken: string;
  unitToken: string;
}

export interface GameIngredientSourceFactV1 {
  factId: string;
  locator: GameFactLocatorV1;
  phrase: string;
  stateToken?: string;
  quantity: RationalQuantityV1;
  sourceLineSha256: string;
  factSha256: string;
}

export interface GameMethodSourceFactV1 {
  factId: string;
  locator: GameFactLocatorV1;
  order: number;
  operationToken: string;
  ingredientFactIds: string[];
  durationMinutes?: RationalQuantityV1;
  qualitativeHeatToken?: string;
  equipmentToken?: string;
  sourceLineSha256: string;
  factSha256: string;
}

export interface GameSourceFactBundleV1 {
  schemaVersion: typeof gameSourceFactBundleSchemaVersion;
  bundleId: string;
  bundleVersion: string;
  candidateId: string;
  title: string;
  primarySource: GameFactLocatorV1;
  crossCheckSources: GameFactLocatorV1[];
  ingredientFacts: GameIngredientSourceFactV1[];
  methodFacts: GameMethodSourceFactV1[];
  riskFlags: string[];
  status: "draft" | "normalization-ready";
}

export interface GameNormalizationRegistryV1 {
  schemaVersion: typeof gameNormalizationRegistrySchemaVersion;
  policyVersion: string;
  ingredientAliases: Array<{
    resolutionId: string;
    phrase: string;
    stateToken?: string;
    ingredientId: string;
    ingredientState: GameIngredientState;
  }>;
  operationRules: Array<{
    ruleId: string;
    operationToken: string;
    operationId: GameOperationId;
  }>;
  equipmentRules: Array<{
    ruleId: string;
    equipmentToken: string;
    equipmentId: string;
  }>;
  heatDescriptors: Array<{
    descriptorId: string;
    sourceToken: string;
    kind: "qualitative";
  }>;
  targetStateRules: Array<{
    ruleId: string;
    operationId: GameOperationId;
    dimension: GameTargetDimension;
    minimum?: number;
    maximum?: number;
  }>;
  mutationRules: Array<{
    ruleId: string;
    version: string;
    operationId: GameOperationId;
    mutationType: string;
    direction: "increase" | "decrease" | "unchanged";
    targetDimension: GameTargetDimension;
    provenanceSourceIds: string[];
  }>;
}

export interface GameNormalizationTraceV1 {
  sourceFactBundleId: string;
  sourceFactBundleVersion: string;
  normalizationPolicyVersion: string;
  ingredientResolutionIds: string[];
  operationRuleIds: string[];
  equipmentRuleIds: string[];
  heatDescriptorIds: string[];
  targetStateRuleIds: string[];
  mutationRuleIds: string[];
}
