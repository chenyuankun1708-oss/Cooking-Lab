import type {
  GameIngredientState,
  GameOperationId,
  GameOperationParameterKey,
  GameOperationParametersV1,
  GameRecipeMutationV1,
  GameSimulationProfile,
  GameTargetDimension,
} from "./game-recipe";

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
  temperatureC?: number;
  qualitativeHeatToken?: string;
  equipmentToken?: string;
  parameterValues?: Partial<GameOperationParametersV1>;
  sourceLineSha256: string;
  factSha256: string;
}

export interface GameSourceFactBundleV1 {
  schemaVersion: typeof gameSourceFactBundleSchemaVersion;
  bundleId: string;
  bundleVersion: string;
  sourceRegistryVersion: string;
  sourceCacheVersion: string;
  compilerVersion: string;
  candidateId: string;
  title: string;
  primarySource: GameFactLocatorV1;
  crossCheckSources: GameFactLocatorV1[];
  crossCheckAssertions: Array<{
    sourceDocumentId: string;
    pageId: string;
    startLine: number;
    endLine: number;
    matchBasis: "exact-title" | "related-title-and-facts";
    normalizedTitle: string;
    ingredientTerms: string[];
    operationTerms: string[];
    sourceLineSha256s: string[];
    sharedIngredientTerms: string[];
    sharedOperationTerms: string[];
    factSha256: string;
  }>;
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
    provenanceEvidenceIds: string[];
  }>;
  mutationRules: Array<{
    ruleId: string;
    version: string;
    operationId: GameOperationId;
    mutationSelector: GameRecipeMutationV1;
    expectedDeltas: Array<{
      dimension: GameTargetDimension;
      direction: "increase" | "decrease" | "unchanged";
    }>;
    expectedFaultCodes: string[];
    causeCodes: string[];
    recoverability: "recoverable" | "partially-recoverable" | "terminal";
    nutritionEffect: "unchanged" | "recalculate-from-quantities" | "requires-retention-model";
    applicableEngine: GameSimulationProfile;
    provenanceEvidenceIds: string[];
  }>;
}

export interface GameNormalizationTraceV1 {
  sourceFactBundleId: string;
  sourceFactBundleVersion: string;
  sourceRegistryVersion: string;
  sourceCacheVersion: string;
  sourceCompilerVersion: string;
  normalizationPolicyVersion: string;
  ingredientBindings: Array<{
    ingredientFactId: string;
    portionId: string;
    resolutionId: string;
    conversionRecordId: string;
  }>;
  methodBindings: Array<{
    methodFactId: string;
    nodeId: string;
    operationRuleId: string;
    equipmentRuleId?: string;
    heatDescriptorId?: string;
    durationBindings: Array<{
      target: "activeDurationMs" | "waitDurationMs";
      basis: "source-exact" | "independently-calibrated";
      provenanceEvidenceId?: string;
    }>;
    parameterBindings: Array<{
      parameter: GameOperationParameterKey;
      basis: "source-exact" | "ingredient-quantity" | "independently-calibrated";
      ingredientPortionIds?: string[];
      provenanceEvidenceId?: string;
    }>;
    targetStateRuleIds: string[];
  }>;
  scenarioBindings: Array<{
    scenarioId: string;
    mutationRuleId: string;
    applicabilityFactIds: string[];
  }>;
}
