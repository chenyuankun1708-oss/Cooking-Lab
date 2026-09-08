import { gameMutationTypes, gameOperationIds, gameSimulationProfiles } from "@/types/game-recipe";
import {
  gameNormalizationRegistrySchemaVersion,
  gameSourceFactBundleSchemaVersion,
  type GameNormalizationRegistryV1,
  type GameSourceFactBundleV1,
} from "@/types/game-source-facts";

type Validator = (value: unknown, path: string) => void;
type Shape = Record<string, Validator>;

export class GameSourceFactSchemaError extends Error {
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "GameSourceFactSchemaError";
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

const locatorSchema = exactObject({
  sourceDocumentId: stringValue,
  workFamilyId: stringValue,
  itemUrl: stringValue,
  derivativeSha256: stringValue,
  pageId: stringValue,
  startLine: integerValue,
  endLine: integerValue,
});

const rationalSchema = exactObject({
  numerator: integerValue,
  denominator: integerValue,
  rawToken: stringValue,
  unitToken: stringValue,
});

const ingredientFactSchema = exactObject({
  factId: stringValue,
  locator: locatorSchema,
  phrase: stringValue,
  quantity: rationalSchema,
  sourceLineSha256: stringValue,
  factSha256: stringValue,
}, {
  stateToken: stringValue,
});

const methodFactSchema = exactObject({
  factId: stringValue,
  locator: locatorSchema,
  order: integerValue,
  operationToken: stringValue,
  ingredientFactIds: arrayOf(stringValue),
  sourceLineSha256: stringValue,
  factSha256: stringValue,
}, {
  durationMinutes: rationalSchema,
  temperatureC: numberValue,
  qualitativeHeatToken: stringValue,
  equipmentToken: stringValue,
  parameterValues: exactObject({}, {
    cutSizeMm: numberValue,
    uniformity: numberValue,
    heatLevel: numberValue,
    temperatureC: numberValue,
    strength: numberValue,
    quantityG: numberValue,
    capacityG: numberValue,
  }),
});

const targetDimensions = [
  "doneness", "wateriness", "browning", "burn", "aroma", "salt", "sweet", "acidity", "umami",
  "pungency", "bitterness", "structural-integrity",
] as const;

export function parseGameSourceFactBundle(value: unknown, path = "GameSourceFactBundleV1"): GameSourceFactBundleV1 {
  exactObject({
    schemaVersion: literal(gameSourceFactBundleSchemaVersion),
    bundleId: stringValue,
    bundleVersion: stringValue,
    sourceRegistryVersion: stringValue,
    sourceCacheVersion: stringValue,
    compilerVersion: stringValue,
    candidateId: stringValue,
    title: stringValue,
    primarySource: locatorSchema,
    crossCheckSources: arrayOf(locatorSchema),
    crossCheckAssertions: arrayOf(exactObject({
      sourceDocumentId: stringValue,
      pageId: stringValue,
      startLine: integerValue,
      endLine: integerValue,
      matchBasis: enumValue(["exact-title", "related-title-and-facts"]),
      normalizedTitle: stringValue,
      ingredientTerms: arrayOf(stringValue),
      operationTerms: arrayOf(stringValue),
      sourceLineSha256s: arrayOf(stringValue),
      sharedIngredientTerms: arrayOf(stringValue),
      sharedOperationTerms: arrayOf(stringValue),
      factSha256: stringValue,
    })),
    ingredientFacts: arrayOf(ingredientFactSchema),
    methodFacts: arrayOf(methodFactSchema),
    riskFlags: arrayOf(stringValue),
    status: enumValue(["draft", "normalization-ready"]),
  })(value, path);
  return value as GameSourceFactBundleV1;
}

export function parseGameNormalizationRegistry(value: unknown, path = "GameNormalizationRegistryV1"): GameNormalizationRegistryV1 {
  exactObject({
    schemaVersion: literal(gameNormalizationRegistrySchemaVersion),
    policyVersion: stringValue,
    ingredientAliases: arrayOf(exactObject({
      resolutionId: stringValue,
      phrase: stringValue,
      ingredientId: stringValue,
      ingredientState: enumValue(["raw", "dry", "liquid", "cooked", "prepared", "ready-to-serve"]),
    }, {
      stateToken: stringValue,
    })),
    operationRules: arrayOf(exactObject({
      ruleId: stringValue,
      operationToken: stringValue,
      operationId: enumValue(gameOperationIds),
    })),
    equipmentRules: arrayOf(exactObject({
      ruleId: stringValue,
      equipmentToken: stringValue,
      equipmentId: stringValue,
    })),
    heatDescriptors: arrayOf(exactObject({
      descriptorId: stringValue,
      sourceToken: stringValue,
      kind: literal("qualitative"),
    })),
    targetStateRules: arrayOf(exactObject({
      ruleId: stringValue,
      operationId: enumValue(gameOperationIds),
      dimension: enumValue(targetDimensions),
      provenanceEvidenceIds: arrayOf(stringValue),
    }, {
      minimum: numberValue,
      maximum: numberValue,
    })),
    mutationRules: arrayOf(exactObject({
      ruleId: stringValue,
      version: stringValue,
      operationId: enumValue(gameOperationIds),
      mutationSelector: exactObject({
        type: enumValue(gameMutationTypes),
      }, {
        targetNodeId: stringValue,
        destinationBeforeNodeId: stringValue,
        targetPortionId: stringValue,
        scalar: numberValue,
        replacementIngredientId: stringValue,
        replacementEquipmentId: stringValue,
      }),
      expectedDeltas: arrayOf(exactObject({
        dimension: enumValue(targetDimensions),
        direction: enumValue(["increase", "decrease", "unchanged"]),
      })),
      expectedFaultCodes: arrayOf(stringValue),
      causeCodes: arrayOf(stringValue),
      recoverability: enumValue(["recoverable", "partially-recoverable", "terminal"]),
      nutritionEffect: enumValue(["unchanged", "recalculate-from-quantities", "requires-retention-model"]),
      applicableEngine: enumValue(gameSimulationProfiles),
      provenanceEvidenceIds: arrayOf(stringValue),
    })),
  })(value, path);
  return value as GameNormalizationRegistryV1;
}

function exactObject(required: Shape, optional: Shape = {}): Validator {
  const allowed = new Set([...Object.keys(required), ...Object.keys(optional)]);
  return (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected object");
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) if (!allowed.has(key)) fail(`${path}.${key}`, "unexpected property");
    for (const [key, validator] of Object.entries(required)) {
      if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, "missing required property");
      validator(record[key], `${path}.${key}`);
    }
    for (const [key, validator] of Object.entries(optional)) if (Object.hasOwn(record, key)) validator(record[key], `${path}.${key}`);
  };
}

function arrayOf(item: Validator): Validator {
  return (value, path) => {
    if (!Array.isArray(value)) fail(path, "expected array");
    value.forEach((entry, index) => item(entry, `${path}[${index}]`));
  };
}

function literal(expected: string): Validator {
  return (value, path) => {
    if (value !== expected) fail(path, `expected ${JSON.stringify(expected)}`);
  };
}

function enumValue(values: readonly string[]): Validator {
  const allowed = new Set(values);
  return (value, path) => {
    if (typeof value !== "string" || !allowed.has(value)) fail(path, `expected one of ${values.join(", ")}`);
  };
}

function fail(path: string, message: string): never {
  throw new GameSourceFactSchemaError(path, message);
}
