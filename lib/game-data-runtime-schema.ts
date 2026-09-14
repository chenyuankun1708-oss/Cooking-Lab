import {
  contentArtifactKinds,
  contentDerivations,
  rightsActions,
  type ContentArtifact,
  type RightsAssessment,
} from "@/types/content-rights";
import {
  claimKinds,
  culinaryItemTypes,
  sourceHealthStatuses,
  sourceTypes,
  type Evidence,
  type Source,
} from "@/types/culinary";
import {
  gameManifestSchemaVersion,
  gameOperationCatalogVersion,
  gameOperationIds,
  gameRecipeSchemaVersion,
  gameRightsRegistrySchemaVersion,
  gameSourceQuantityUnits,
  type GameDataManifestV1,
  type GameIngredientCatalogV1,
  type GameNutritionDatasetSubsetV1,
  type GameOperationDefinitionV1,
  type GameRecipeV1,
  type GameRightsRegistryV1,
} from "@/types/game-recipe";
import {
  databaseCategoryTags,
  databaseEligibilityValues,
  databaseImageStatuses,
  databaseSourceTypes,
  portionRoleValues,
  recipeDatabaseExtensionVersion,
} from "@/types/game-recipe-database";
import {
  publishingRiskReasonCodes,
  reviewDimensions,
} from "@/types/publishing-governance";
import {
  researchSourceUses,
  researchSubjectTypes,
  researchTemplateIds,
  sourceRejectionReasons,
  type ResearchRecord,
} from "@/types/research";

type Validator = (value: unknown, path: string) => void;
type Shape = Record<string, Validator>;

export class GameDataSchemaError extends Error {
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "GameDataSchemaError";
  }
}

const stringValue: Validator = (value, path) => {
  if (typeof value !== "string") fail(path, "expected string");
};
const numberValue: Validator = (value, path) => {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "expected finite number");
};
const integerValue: Validator = (value, path) => {
  numberValue(value, path);
  if (!Number.isInteger(value)) fail(path, "expected integer");
};
const booleanValue: Validator = (value, path) => {
  if (typeof value !== "boolean") fail(path, "expected boolean");
};

const artifactPathValue: Validator = (value, path) => {
  if (typeof value !== "string" || value.length === 0) fail(path, "expected non-empty relative artifact path");
  const portablePath = value.replaceAll("\\", "/");
  if (portablePath.startsWith("/") || /^[A-Za-z]:\//.test(portablePath)) {
    fail(path, "artifact path must be relative");
  }
  if (portablePath.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    fail(path, "artifact path must not contain empty, current-directory, or parent-directory segments");
  }
};

function fail(path: string, message: string): never {
  throw new GameDataSchemaError(path, message);
}

function literal(expected: string | number | boolean): Validator {
  return (value, path) => {
    if (value !== expected) fail(path, `expected ${JSON.stringify(expected)}`);
  };
}

function enumValue(values: readonly string[]): Validator {
  const allowed = new Set(values);
  return (value, path) => {
    if (typeof value !== "string" || !allowed.has(value)) {
      fail(path, `expected one of ${values.join(", ")}`);
    }
  };
}

function recordValue(item: Validator): Validator {
  return (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected record");
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      item(entry, `${path}.${key}`);
    }
  };
}

const tasteIntensityValue: Validator = (value, path) => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 4) {
    fail(path, "expected taste intensity 0-4");
  }
};

function arrayOf(item: Validator, minimum = 0): Validator {
  return (value, path) => {
    if (!Array.isArray(value)) fail(path, "expected array");
    if (value.length < minimum) fail(path, `expected at least ${minimum} item(s)`);
    value.forEach((entry, index) => item(entry, `${path}[${index}]`));
  };
}

function exactObject(required: Shape, optional: Shape = {}): Validator {
  const allowed = new Set([...Object.keys(required), ...Object.keys(optional)]);
  return (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected object");
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (!allowed.has(key)) fail(`${path}.${key}`, "unexpected property");
    }
    for (const [key, validator] of Object.entries(required)) {
      if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, "missing required property");
      validator(record[key], `${path}.${key}`);
    }
    for (const [key, validator] of Object.entries(optional)) {
      if (Object.hasOwn(record, key)) validator(record[key], `${path}.${key}`);
    }
  };
}

function discriminatedObject(
  key: string,
  variants: Record<string, Validator>,
): Validator {
  return (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected object");
    const discriminator = (value as Record<string, unknown>)[key];
    if (typeof discriminator !== "string" || !variants[discriminator]) {
      fail(`${path}.${key}`, `expected one of ${Object.keys(variants).join(", ")}`);
    }
    variants[discriminator](value, path);
  };
}

const nutritionSchema = exactObject({
  calories: numberValue,
  protein: numberValue,
  fat: numberValue,
  saturatedFat: numberValue,
  carbs: numberValue,
  sugar: numberValue,
  addedSugar: numberValue,
  fiber: numberValue,
  sodium: numberValue,
});

const actorSchema = exactObject({
  actorType: enumValue(["agent", "human", "domain-expert", "lawyer"]),
  actorId: stringValue,
  runId: stringValue,
  contextId: stringValue,
});

const reviewFindingSchema = exactObject({
  code: stringValue,
  kind: enumValue(["quality", "reviewer-disagreement"]),
  severity: enumValue(["minor", "major"]),
  summary: stringValue,
  disposition: enumValue(["resolved", "unresolved"]),
});

const samplingFindingSchema = exactObject({
  code: stringValue,
  kind: enumValue(["quality", "reviewer-disagreement"]),
  severity: enumValue(["minor", "major"]),
  summary: stringValue,
  disposition: enumValue(["resolved", "unresolved"]),
  equivalenceClassKeys: arrayOf(stringValue, 1),
});

const attestationSchema = exactObject({
  id: stringValue,
  batchId: stringValue,
  dimension: enumValue(reviewDimensions),
  itemIds: arrayOf(stringValue, 1),
  artifactSetVersion: stringValue,
  author: actorSchema,
  reviewer: actorSchema,
  reviewedCommit: stringValue,
  evidenceReference: stringValue,
  rubricVersion: stringValue,
  policyVersion: stringValue,
  reviewedAt: stringValue,
  verdict: enumValue(["pass", "revise", "block"]),
  findings: arrayOf(reviewFindingSchema),
  reviewerModifiedContent: literal(false),
  representations: exactObject({
    humanApproval: booleanValue,
    culinaryFieldTest: booleanValue,
    legalOpinion: booleanValue,
  }),
});

const classificationSchema = exactObject({
  id: stringValue,
  itemId: stringValue,
  artifactSetVersion: stringValue,
  level: enumValue(["low", "medium", "high"]),
  reasonCodes: arrayOf(enumValue(publishingRiskReasonCodes), 1),
  equivalenceClassKeys: arrayOf(stringValue, 1),
  policyVersion: stringValue,
  classifiedAt: stringValue,
});

const samplingClassSchema = exactObject({
  key: stringValue,
  itemIds: arrayOf(stringValue, 1),
  sampledItemIds: arrayOf(stringValue, 1),
});

const samplingSampleSchema = exactObject({
  itemId: stringValue,
  equivalenceClassKeys: arrayOf(stringValue, 1),
  dimensions: arrayOf(enumValue(reviewDimensions.filter((entry) => entry !== "human-approval")), 1),
  verdict: enumValue(["pass", "revise", "block"]),
  findings: arrayOf(samplingFindingSchema),
});

const samplingBatchSchema = exactObject({
  id: stringValue,
  batchId: stringValue,
  sequence: integerValue,
  policyVersion: stringValue,
  itemIds: arrayOf(stringValue, 1),
  artifactSetVersion: stringValue,
  equivalenceClasses: arrayOf(samplingClassSchema, 1),
  author: actorSchema,
  auditor: actorSchema,
  reviewedCommit: stringValue,
  evidenceReference: stringValue,
  rubricVersion: stringValue,
  verdict: enumValue(["pass", "revise", "block"]),
  samples: arrayOf(samplingSampleSchema),
  findings: arrayOf(samplingFindingSchema),
  auditorModifiedContent: literal(false),
  metrics: exactObject({
    escapeCount: integerValue,
    reviewerDisagreementCount: integerValue,
    reworkItemCount: integerValue,
    provenanceLicenseNoveltyCount: integerValue,
    reworkItemIds: arrayOf(stringValue),
    provenanceLicenseNoveltyClassKeys: arrayOf(stringValue),
  }),
  auditedAt: stringValue,
  evidenceDigest: stringValue,
}, {
  previousBatchId: stringValue,
});

const governanceSchema = exactObject({
  policyVersion: stringValue,
  attestations: arrayOf(attestationSchema),
  riskClassifications: arrayOf(classificationSchema),
  samplingBatches: arrayOf(samplingBatchSchema),
});

const contentSubjectSchema = exactObject({
  type: enumValue(["culinary-item", "game-recipe", "story", "image", "ingredient-data", "product-profile"]),
  id: stringValue,
});

const artifactSchema: Validator = exactObject({
  id: stringValue,
  version: stringValue,
  subject: contentSubjectSchema,
  kind: enumValue(contentArtifactKinds),
  derivation: enumValue(contentDerivations),
  sourceIds: arrayOf(stringValue),
  evidenceIds: arrayOf(stringValue),
  rightsAssessmentId: stringValue,
  usageDecisionId: stringValue,
  attributionRequirementIds: arrayOf(stringValue),
});

const rightsPermissionSchema = exactObject({
  status: enumValue(["allowed", "allowed-with-obligations", "review-required", "prohibited"]),
  scope: stringValue,
});

const assessmentBasisSchema = discriminatedObject("kind", {
  "first-party": exactObject({ kind: literal("first-party"), owner: stringValue }),
  "public-domain": exactObject({ kind: literal("public-domain"), basis: stringValue }),
  "open-license": exactObject({ kind: literal("open-license"), licenseId: stringValue, licenseUrl: stringValue }),
  permission: exactObject({ kind: literal("permission"), permissionReferenceId: stringValue }),
  terms: exactObject({ kind: literal("terms"), provider: stringValue, termsUrl: stringValue }, { effectiveDate: stringValue }),
  "reference-only": exactObject({ kind: literal("reference-only"), boundary: stringValue }),
});

const riskReviewSchema = exactObject({
  status: enumValue(["cleared", "not-applicable", "review-required"]),
  notes: stringValue,
});

const assessmentSchema: Validator = exactObject({
  id: stringValue,
  subject: exactObject({
    type: enumValue(["artifact", "source", "dataset", "external-media", "ai-input", "ai-service"]),
    id: stringValue,
  }),
  jurisdictionBaseline: fixedStringTuple(["CN", "US", "EU", "UK"]),
  basis: assessmentBasisSchema,
  authorityVersion: stringValue,
  accessedAt: stringValue,
  applicableTerritories: fixedStringTuple(["CN", "US", "EU", "UK"]),
  permissions: exactObject(Object.fromEntries(rightsActions.map((action) => [action, rightsPermissionSchema]))),
  attributionRequirementIds: arrayOf(stringValue),
  risks: exactObject({
    copyright: riskReviewSchema,
    database: riskReviewSchema,
    contract: riskReviewSchema,
    trademark: riskReviewSchema,
    "publicity-privacy": riskReviewSchema,
  }),
  uncertainty: stringValue,
  assessedAt: stringValue,
  reviewer: stringValue,
}, {
  reviewDueAt: stringValue,
});

const attributionSchema = exactObject({
  id: stringValue,
  artifactId: stringValue,
  disclosureKind: enumValue(["license-required", "provenance-only"]),
  creator: stringValue,
  workTitle: stringValue,
  sourceUrl: stringValue,
  licenseId: stringValue,
  notice: stringValue,
  placement: enumValue(["item", "asset", "global"]),
  shareAlikeRequired: booleanValue,
}, {
  licenseUrl: stringValue,
  modificationNotice: stringValue,
  isolationBoundary: enumValue(["asset-file", "isolated-dataset"]),
});

const decisionSchema = exactObject({
  id: stringValue,
  artifactId: stringValue,
  assessmentIds: arrayOf(stringValue, 1),
  intendedUse: enumValue(["production-commercial-ready", "game-commercial-ready"]),
  decision: enumValue(["allow", "allow-with-obligations", "block"]),
  conditions: arrayOf(stringValue),
  decidedAt: stringValue,
  reviewer: stringValue,
});

const sourceLocatorSchema = discriminatedObject("kind", {
  url: exactObject({ kind: literal("url"), url: stringValue, accessedAt: stringValue }),
  doi: exactObject({ kind: literal("doi"), doi: stringValue }),
  isbn: exactObject({ kind: literal("isbn"), isbn: stringValue }),
  archive: exactObject({ kind: literal("archive"), identifier: stringValue, collection: stringValue, holdingInstitution: stringValue }),
  "physical-citation": exactObject({ kind: literal("physical-citation"), citation: stringValue }, { holdingInstitution: stringValue }),
});

const sourceRightsSchema = discriminatedObject("status", {
  "public-domain": exactObject({ status: literal("public-domain"), basis: stringValue }),
  "open-license": exactObject({
    status: literal("open-license"),
    licenseId: stringValue,
    licenseUrl: stringValue,
    attribution: stringValue,
    adaptationStatus: enumValue(["unmodified", "adapted", "not-reusing"]),
    shareAlikeRequired: booleanValue,
    notes: stringValue,
  }),
  "permission-granted": exactObject({ status: literal("permission-granted"), notes: stringValue }),
  "reference-only": exactObject({ status: literal("reference-only"), notes: stringValue }),
  unknown: exactObject({ status: literal("unknown"), notes: stringValue }),
});

const sourceSchema: Validator = exactObject({
  id: stringValue,
  type: enumValue(sourceTypes),
  title: stringValue,
  publisherOrInstitution: stringValue,
  authorNames: arrayOf(stringValue),
  locators: arrayOf(sourceLocatorSchema, 1),
  rights: sourceRightsSchema,
  health: exactObject({ status: enumValue(sourceHealthStatuses), checkedAt: stringValue }, { notes: stringValue }),
  reliability: enumValue(["primary", "authoritative-secondary", "general-secondary", "contested"]),
  editorialNotes: stringValue,
}, {
  publication: exactObject({}, { dateText: stringValue, edition: stringValue, volume: stringValue, issue: stringValue }),
});

const evidenceSchema: Validator = exactObject({
  id: stringValue,
  sourceId: stringValue,
  relation: enumValue(["supports", "contradicts", "context"]),
  strength: enumValue(["primary", "strong", "limited", "contested"]),
  locators: arrayOf(exactObject({ kind: enumValue(["page", "chapter", "section", "paragraph", "timestamp", "folio", "other"]), value: stringValue })),
  editorialNote: stringValue,
});

const researchDecisionSchema = discriminatedObject("disposition", {
  accepted: exactObject({
    id: stringValue,
    disposition: literal("accepted"),
    sourceId: stringValue,
    uses: arrayOf(enumValue(researchSourceUses), 1),
    rationale: stringValue,
  }),
  rejected: exactObject({
    id: stringValue,
    disposition: literal("rejected"),
    candidateName: stringValue,
    reason: enumValue(sourceRejectionReasons),
    rationale: stringValue,
  }, {
    locator: sourceLocatorSchema,
  }),
});

const researchRecordSchema: Validator = exactObject({
  id: stringValue,
  subject: exactObject({ type: enumValue(researchSubjectTypes), id: stringValue }),
  templateId: enumValue(researchTemplateIds),
  question: stringValue,
  sourceDecisions: arrayOf(researchDecisionSchema),
  claims: arrayOf(exactObject({
    id: stringValue,
    statement: stringValue,
    kind: enumValue(claimKinds),
    disposition: enumValue(["include", "exclude", "defer"]),
    evidenceIds: arrayOf(stringValue),
    rationale: stringValue,
  })),
  unresolvedQuestions: arrayOf(stringValue),
  editorialDecision: stringValue,
  reviewer: stringValue,
  reviewedAt: stringValue,
  status: enumValue(["in-progress", "ready-for-editorial-review", "publication-candidate", "closed"]),
});

const nutritionSourceSchema = discriminatedObject("kind", {
  dataset: exactObject({
    kind: literal("dataset"),
    datasetId: literal("usda-fooddata-central"),
    datasetVersion: stringValue,
    fdcId: stringValue,
    sourceDescription: stringValue,
    accessedAt: stringValue,
  }),
  "migration-estimate": exactObject({
    kind: literal("migration-estimate"),
    provenanceId: stringValue,
    limitations: stringValue,
  }),
});

const ingredientDefinitionSchema = exactObject({
  ingredientId: stringValue,
  defaultState: enumValue(["raw", "dry", "liquid", "cooked", "prepared", "ready-to-serve"]),
  unitWeightsG: exactObject({}, {
    piece: numberValue,
    tbsp: numberValue,
    tsp: numberValue,
    ml: numberValue,
    l: numberValue,
    cup: numberValue,
    pint: numberValue,
    quart: numberValue,
    gallon: numberValue,
  }),
  nutritionPer100g: nutritionSchema,
  nutritionProvenanceId: stringValue,
  nutritionSource: nutritionSourceSchema,
}, {
  sourceIngredientId: stringValue,
  densityGPerMl: numberValue,
  role: enumValue(portionRoleValues),
  simulationProfile: exactObject({
    waterFraction: numberValue,
    fatFraction: numberValue,
    proteinFraction: numberValue,
    sugarFraction: numberValue,
    provenance: literal("requires-cat-kitchen-calibration"),
  }),
});

const operationParametersSchema = exactObject({}, {
  cutSizeMm: numberValue,
  uniformity: numberValue,
  heatLevel: numberValue,
  temperatureC: numberValue,
  strength: numberValue,
  quantityG: numberValue,
  capacityG: numberValue,
});

const targetStateSchema = exactObject({
  dimension: enumValue(["doneness", "wateriness", "browning", "burn", "aroma", "salt", "sweet", "acidity", "umami", "pungency", "bitterness", "structural-integrity"]),
  unit: literal("normalized"),
}, {
  minimum: numberValue,
  maximum: numberValue,
});

const operationNodeSchema = exactObject({
  nodeId: stringValue,
  operationType: enumValue(gameOperationIds),
  dependsOn: arrayOf(stringValue),
  inputPortionIds: arrayOf(stringValue),
  outputStateIds: arrayOf(stringValue),
  activeDurationMs: integerValue,
  waitDurationMs: integerValue,
  parameters: operationParametersSchema,
  targetStates: arrayOf(targetStateSchema),
  criticality: enumValue(["quality", "completion", "safety"]),
}, {
  equipmentId: stringValue,
  sourceStepOrder: integerValue,
  heatControl: discriminatedObject("kind", {
    "exact-temperature": exactObject({ kind: literal("exact-temperature"), temperatureC: numberValue, sourceFactId: stringValue }),
    qualitative: exactObject({ kind: literal("qualitative"), descriptorId: stringValue, sourceFactId: stringValue }),
    "independently-calibrated": exactObject({
      kind: literal("independently-calibrated"),
      parameter: enumValue(["temperatureC", "heatLevel"]),
      value: numberValue,
      sourceFactId: stringValue,
      calibrationEvidenceId: stringValue,
    }),
  }),
});

const nutritionProvenanceSchema = exactObject({
  ingredientId: stringValue,
  nutritionProvenanceId: stringValue,
  provider: stringValue,
  datasetVersion: stringValue,
  upstreamRecordId: stringValue,
  basis: literal("per-100g"),
  ingredientState: enumValue(["raw", "dry", "liquid", "cooked", "prepared", "ready-to-serve"]),
  conversionMethod: stringValue,
  yieldFactor: numberValue,
  retentionFactor: numberValue,
  accessedAt: stringValue,
});

const mutationSchema = exactObject({
  type: enumValue([
    "omit", "reorder", "duplicate", "quantity-too-low", "quantity-too-high", "heat-too-low", "heat-too-high",
    "duration-too-short", "duration-too-long", "cut-size-too-small", "cut-size-too-large", "low-uniformity",
    "season-too-early", "season-too-late", "overcrowding", "wrong-equipment", "missing-state-transition", "allowed-substitution",
  ]),
}, {
  targetNodeId: stringValue,
  destinationBeforeNodeId: stringValue,
  targetPortionId: stringValue,
  scalar: numberValue,
  replacementIngredientId: stringValue,
  replacementEquipmentId: stringValue,
});

const scenarioSchema = exactObject({
  scenarioId: stringValue,
  baselineArtifactVersion: stringValue,
  mutation: mutationSchema,
  expectedDeltas: arrayOf(exactObject({
    dimension: enumValue(["doneness", "wateriness", "browning", "burn", "aroma", "salt", "sweet", "acidity", "umami", "pungency", "bitterness", "structural-integrity"]),
    direction: enumValue(["increase", "decrease", "unchanged"]),
    confidence: enumValue(["modeled", "rule-based"]),
  })),
  expectedFaultCodes: arrayOf(stringValue),
  causeCodes: arrayOf(stringValue),
  recoverability: enumValue(["recoverable", "partially-recoverable", "terminal"]),
  nutritionEffect: enumValue(["unchanged", "recalculate-from-quantities", "requires-retention-model"]),
  applicableEngine: enumValue(["cat-kitchen-goal1-v1", "requires-cat-kitchen-v2", "data-only"]),
});

const gameIngredientPortionSchema = exactObject({
  portionId: stringValue,
  ingredientId: stringValue,
  initialState: enumValue(["raw", "dry", "liquid", "cooked", "prepared", "ready-to-serve"]),
  sourceQuantity: exactObject({
    amount: numberValue,
    unit: enumValue(gameSourceQuantityUnits),
    conversionRecordId: stringValue,
  }),
  massG: numberValue,
  optional: booleanValue,
  phase: stringValue,
  allowedSubstitutionIngredientIds: arrayOf(stringValue),
  nutritionProvenanceId: stringValue,
}, {
  volumeMl: numberValue,
  role: enumValue(portionRoleValues),
});

const flavorProfileSchema = exactObject({
  tastes: recordValue(tasteIntensityValue),
}, {
  aromaIds: arrayOf(stringValue),
  textureIds: arrayOf(stringValue),
  characterIds: arrayOf(stringValue),
});

const recipeDatabaseExtensionSchema = exactObject({
  extensionVersion: literal(recipeDatabaseExtensionVersion),
  sourceType: enumValue(databaseSourceTypes),
  tags: exactObject({
    categoryTags: arrayOf(enumValue(databaseCategoryTags)),
  }, {
    cuisineIds: arrayOf(stringValue),
    techniqueIds: arrayOf(stringValue),
    dietaryTagIds: arrayOf(stringValue),
    mealRoleIds: arrayOf(stringValue),
    servingContextIds: arrayOf(stringValue),
  }),
  images: arrayOf(exactObject({
    status: enumValue(databaseImageStatuses),
  }, {
    imageId: stringValue,
    licenseNote: stringValue,
  })),
}, {
  flavor: flavorProfileSchema,
  sourceNotes: stringValue,
});

const gameRecipeSchema = exactObject({
  schemaVersion: literal(gameRecipeSchemaVersion),
  artifactVersion: stringValue,
  recipeId: stringValue,
  slug: stringValue,
  itemType: enumValue(culinaryItemTypes),
  eligibility: enumValue(databaseEligibilityValues),
  simulationProfile: enumValue(["cat-kitchen-goal1-v1", "requires-cat-kitchen-v2", "data-only"]),
  servings: numberValue,
  yield: exactObject({ amount: numberValue, unit: enumValue(["serving", "piece", "ml", "g"]) }),
  ingredientPortions: arrayOf(gameIngredientPortionSchema),
  operationGraph: exactObject({ nodes: arrayOf(operationNodeSchema) }),
  nutritionProfile: exactObject({
    method: literal("ingredient-sum-v1"),
    servings: numberValue,
    total: nutritionSchema,
    perServing: nutritionSchema,
    provenance: arrayOf(nutritionProvenanceSchema),
    estimated: literal(true),
  }),
  scenarios: arrayOf(scenarioSchema),
  rights: exactObject({
    artifactIds: arrayOf(stringValue),
    usageDecisionIds: arrayOf(stringValue),
    sourceIds: arrayOf(stringValue),
    evidenceIds: arrayOf(stringValue),
    intendedUse: literal("game-commercial-ready"),
  }),
  governance: exactObject({
    riskLevel: enumValue(["low", "medium", "high"]),
    riskClassificationId: stringValue,
    reviewAttestationIds: arrayOf(stringValue),
  }, {
    samplingBatchId: stringValue,
  }),
  authoring: exactObject({
    method: enumValue(["deterministic-migration", "deterministic-source-normalization"]),
    generatorVersion: stringValue,
    containsGeneratedExpression: literal(false),
    unresolvedMappings: arrayOf(stringValue),
  }, {
    normalizationTrace: exactObject({
      sourceFactBundleId: stringValue,
      sourceFactBundleVersion: stringValue,
      sourceRegistryVersion: stringValue,
      sourceCacheVersion: stringValue,
      sourceCompilerVersion: stringValue,
      normalizationPolicyVersion: stringValue,
      ingredientBindings: arrayOf(exactObject({
        ingredientFactId: stringValue,
        portionId: stringValue,
        resolutionId: stringValue,
        conversionRecordId: stringValue,
      })),
      methodBindings: arrayOf(exactObject({
        methodFactId: stringValue,
        nodeId: stringValue,
        operationRuleId: stringValue,
        durationBindings: arrayOf(exactObject({
          target: enumValue(["activeDurationMs", "waitDurationMs"]),
          basis: enumValue(["source-exact", "independently-calibrated"]),
        }, {
          provenanceEvidenceId: stringValue,
        })),
        parameterBindings: arrayOf(exactObject({
          parameter: enumValue(["cutSizeMm", "uniformity", "heatLevel", "temperatureC", "strength", "quantityG", "capacityG"]),
          basis: enumValue(["source-exact", "ingredient-quantity", "independently-calibrated"]),
        }, {
          ingredientPortionIds: arrayOf(stringValue),
          provenanceEvidenceId: stringValue,
        })),
        targetStateRuleIds: arrayOf(stringValue),
      }, {
        equipmentRuleId: stringValue,
        heatDescriptorId: stringValue,
      })),
      scenarioBindings: arrayOf(exactObject({
        scenarioId: stringValue,
        mutationRuleId: stringValue,
        applicabilityFactIds: arrayOf(stringValue),
      })),
    }),
  }),
}, {
  sourceCulinaryItemId: stringValue,
  database: recipeDatabaseExtensionSchema,
});

const godotGameRecipeSchema = exactObject({
  schemaVersion: literal(gameRecipeSchemaVersion),
  artifactVersion: stringValue,
  recipeId: stringValue,
  itemType: enumValue(culinaryItemTypes),
  simulationProfile: enumValue(["cat-kitchen-goal1-v1", "requires-cat-kitchen-v2", "data-only"]),
  servings: numberValue,
  yield: exactObject({ amount: numberValue, unit: enumValue(["serving", "piece", "ml", "g"]) }),
  ingredientPortions: arrayOf(gameIngredientPortionSchema),
  operationGraph: exactObject({ nodes: arrayOf(operationNodeSchema) }),
  nutritionProfile: exactObject({
    method: literal("ingredient-sum-v1"),
    servings: numberValue,
    total: nutritionSchema,
    perServing: nutritionSchema,
    provenance: arrayOf(nutritionProvenanceSchema),
    estimated: literal(true),
  }),
  scenarios: arrayOf(scenarioSchema),
});

export type GodotGameRecipeV1 = Pick<
  GameRecipeV1,
  | "schemaVersion"
  | "artifactVersion"
  | "recipeId"
  | "itemType"
  | "simulationProfile"
  | "servings"
  | "yield"
  | "ingredientPortions"
  | "operationGraph"
  | "nutritionProfile"
  | "scenarios"
>;

const gameRightsRegistrySchema = exactObject({
  schemaVersion: literal(gameRightsRegistrySchemaVersion),
  policyVersion: stringValue,
  artifacts: arrayOf(artifactSchema),
  assessments: arrayOf(assessmentSchema),
  attributions: arrayOf(attributionSchema),
  decisions: arrayOf(decisionSchema),
  sources: arrayOf(sourceSchema),
  evidence: arrayOf(evidenceSchema),
  evidenceOrigins: arrayOf(exactObject({ evidenceId: stringValue, origin: enumValue(["source-record", "ai-output"]) })),
  sourceRoles: arrayOf(exactObject({
    sourceId: stringValue,
    role: enumValue(["recipe-primary", "recipe-cross-check", "nutrition", "safety"]),
  }, {
    recipeId: stringValue,
    workFamilyId: stringValue,
  })),
  researchRecords: arrayOf(researchRecordSchema),
  governance: governanceSchema,
});

const operationDefinitionSchema = exactObject({
  id: enumValue(gameOperationIds),
  family: enumValue(["preparation", "mixing", "waiting", "heating", "separation", "beverage", "finishing"]),
  compatibility: enumValue(["supported-now", "macro-supported", "requires-engine-v2", "presentation-only"]),
  simulationAffecting: booleanValue,
  allowedParameters: arrayOf(enumValue(["cutSizeMm", "uniformity", "heatLevel", "temperatureC", "strength", "quantityG", "capacityG"])),
  requiredParameterGroups: arrayOf(arrayOf(enumValue(["cutSizeMm", "uniformity", "heatLevel", "temperatureC", "strength", "quantityG", "capacityG"]), 1)),
  inputRequirement: enumValue(["none", "one-or-more"]),
  equipmentRequired: booleanValue,
  compatibleEquipmentIds: arrayOf(stringValue),
  durationRequirement: enumValue(["none", "active", "wait", "either"]),
  targetStateRequired: booleanValue,
}, {
  legacyCommand: enumValue(["CUT", "ADD", "SET_HEAT", "WAIT", "STIR", "SEASON", "PLATE"]),
});

const nutritionDatasetSchema = exactObject({
  schemaVersion: literal("cooking-lab-usda-subset-v1"),
  provider: literal("USDA FoodData Central"),
  sourceUrl: stringValue,
  licenseId: literal("CC0-1.0"),
  upstreamArchives: arrayOf(exactObject({
    dataType: enumValue(["Foundation", "SR Legacy"]),
    datasetVersion: stringValue,
    url: stringValue,
    sha256: stringValue,
  })),
  records: arrayOf(exactObject({
    ingredientId: stringValue,
    fdcId: stringValue,
    dataType: enumValue(["Foundation", "SR Legacy"]),
    datasetVersion: stringValue,
    sourceDescription: stringValue,
    accessedAt: stringValue,
    nutritionPer100g: nutritionSchema,
  })),
});

const manifestSchema = exactObject({
  schemaVersion: literal(gameManifestSchemaVersion),
  catalogVersion: stringValue,
  generatorVersion: stringValue,
  minimumAdapterVersion: stringValue,
  recipeCount: integerValue,
  recipes: arrayOf(exactObject({
    recipeId: stringValue,
    path: artifactPathValue,
    sha256: stringValue,
    artifactVersion: stringValue,
    simulationProfile: enumValue(["cat-kitchen-goal1-v1", "requires-cat-kitchen-v2", "data-only"]),
  })),
  rightsSummary: exactObject({
    intendedUse: literal("game-commercial-ready"),
    artifactCount: integerValue,
    decisionCount: integerValue,
    allowCount: integerValue,
    allowWithObligationsCount: integerValue,
    sourceCount: integerValue,
    licenseIds: arrayOf(stringValue),
  }),
  reviewSummary: exactObject({
    riskCounts: exactObject({ low: integerValue, medium: integerValue, high: integerValue }),
    attestationCount: integerValue,
    samplingBatchCount: integerValue,
    reviewedRecipeCount: integerValue,
  }),
  ingredientCatalog: exactObject({ path: artifactPathValue, sha256: stringValue }),
  nutritionDataset: exactObject({
    path: artifactPathValue,
    sha256: stringValue,
    schemaVersion: literal("cooking-lab-usda-subset-v1"),
    provider: literal("USDA FoodData Central"),
    upstreamArchives: arrayOf(exactObject({ datasetVersion: stringValue, sha256: stringValue })),
  }),
  operationCatalog: exactObject({ path: artifactPathValue, sha256: stringValue, version: literal(gameOperationCatalogVersion) }),
  rightsRegistry: exactObject({ path: artifactPathValue, sha256: stringValue, version: literal(gameRightsRegistrySchemaVersion) }),
  attribution: exactObject({ path: artifactPathValue, sha256: stringValue }),
  sqlite: exactObject({ path: artifactPathValue, sha256: stringValue }),
});

export function parseGameRecipe(value: unknown, path = "GameRecipeV1"): GameRecipeV1 {
  gameRecipeSchema(value, path);
  return value as GameRecipeV1;
}

export function parseGodotGameRecipe(value: unknown, path = "GodotGameRecipeV1"): GodotGameRecipeV1 {
  godotGameRecipeSchema(value, path);
  return value as GodotGameRecipeV1;
}

export function parseGameIngredientCatalog(value: unknown, path = "GameIngredientCatalogV1"): GameIngredientCatalogV1 {
  exactObject({
    schemaVersion: literal("cooking-lab-game-ingredients-v1"),
    catalogVersion: stringValue,
    ingredients: arrayOf(ingredientDefinitionSchema),
    conversionRecords: arrayOf(exactObject({
      recordId: stringValue,
      unit: enumValue(gameSourceQuantityUnits),
      gramsPerUnit: numberValue,
      basis: stringValue,
      provenanceId: stringValue,
    }, {
      ingredientId: stringValue,
    })),
  })(value, path);
  return value as GameIngredientCatalogV1;
}

export function parseGameNutritionDataset(value: unknown, path = "GameNutritionDatasetSubsetV1"): GameNutritionDatasetSubsetV1 {
  nutritionDatasetSchema(value, path);
  return value as GameNutritionDatasetSubsetV1;
}

export function parseGameRightsRegistry(value: unknown, path = "GameRightsRegistryV1"): GameRightsRegistryV1 {
  gameRightsRegistrySchema(value, path);
  return value as GameRightsRegistryV1;
}

export function parseGameOperationCatalog(
  value: unknown,
  path = "GameOperationCatalogV1",
): { version: typeof gameOperationCatalogVersion; operations: GameOperationDefinitionV1[] } {
  exactObject({
    version: literal(gameOperationCatalogVersion),
    operations: arrayOf(operationDefinitionSchema),
  })(value, path);
  return value as { version: typeof gameOperationCatalogVersion; operations: GameOperationDefinitionV1[] };
}

export function parseGameDataManifest(value: unknown, path = "GameDataManifestV1"): GameDataManifestV1 {
  manifestSchema(value, path);
  return value as GameDataManifestV1;
}

export function parseGameDataArtifactPath(value: unknown, path = "GameDataArtifactPath"): string {
  artifactPathValue(value, path);
  return value as string;
}

export function parseContentArtifact(value: unknown, path = "ContentArtifact"): ContentArtifact {
  artifactSchema(value, path);
  return value as ContentArtifact;
}

export function parseRightsAssessment(value: unknown, path = "RightsAssessment"): RightsAssessment {
  assessmentSchema(value, path);
  return value as RightsAssessment;
}

export function parseSource(value: unknown, path = "Source"): Source {
  sourceSchema(value, path);
  return value as Source;
}

export function parseEvidence(value: unknown, path = "Evidence"): Evidence {
  evidenceSchema(value, path);
  return value as Evidence;
}

export function parseResearchRecord(value: unknown, path = "ResearchRecord"): ResearchRecord {
  researchRecordSchema(value, path);
  return value as ResearchRecord;
}

function fixedStringTuple(expected: readonly string[]): Validator {
  return (value, path) => {
    if (!Array.isArray(value) || value.length !== expected.length) fail(path, `expected [${expected.join(", ")}]`);
    expected.forEach((entry, index) => {
      if (value[index] !== entry) fail(`${path}[${index}]`, `expected ${entry}`);
    });
  };
}
