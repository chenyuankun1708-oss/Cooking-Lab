import {
  culinaryKnowledgeManifestSchemaId,
  culinaryKnowledgeSnapshotSchemaId,
  culinaryKnowledgeSourceSchemaId,
  type CulinaryKnowledgeManifestV1,
  type CulinaryKnowledgeSnapshotV1,
  type CulinaryKnowledgeSourceV1,
} from "@/types/culinary-knowledge";

export class CulinaryKnowledgeSchemaError extends Error {
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "CulinaryKnowledgeSchemaError";
  }
}

type Validator = (value: unknown, path: string) => void;
type Shape = Record<string, Validator>;

const sha256Pattern = /^[a-f0-9]{64}$/;
const gitShaPattern = /^[a-f0-9]{40}$/;
const idPattern = /^[a-z0-9][a-z0-9_.-]*$/;
const transformationOperationIds = new Set<string>(["add", "season", "slice", "stir"]);

const stringValue: Validator = (value, path) => {
  if (typeof value !== "string") fail(path, "expected string");
};
const nonEmptyStringValue: Validator = (value, path) => {
  stringValue(value, path);
  if ((value as string).length === 0) fail(path, "expected non-empty string");
};
const idValue: Validator = (value, path) => {
  nonEmptyStringValue(value, path);
  if (!idPattern.test(value as string)) fail(path, "expected stable lowercase id");
};
const sha256Value: Validator = (value, path) => {
  stringValue(value, path);
  if (!sha256Pattern.test(value as string)) fail(path, "expected lowercase SHA-256");
  if (/^1{64}$|^2{64}$/.test(value as string)) fail(path, "placeholder SHA-256 is not allowed");
};
const gitShaValue: Validator = (value, path) => {
  stringValue(value, path);
  if (!gitShaPattern.test(value as string)) fail(path, "expected lowercase 40-character Git SHA");
};
const finiteNumberValue: Validator = (value, path) => {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "expected finite number");
  if (Number(value.toFixed(6)) !== value) fail(path, "expected no more than six decimal places");
};
const nonNegativeNumberValue: Validator = (value, path) => {
  finiteNumberValue(value, path);
  if ((value as number) < 0) fail(path, "expected non-negative number");
};
const normalizedNumberValue: Validator = (value, path) => {
  finiteNumberValue(value, path);
  if ((value as number) < 0 || (value as number) > 1) fail(path, "expected number in range 0..1");
};
const integerValue: Validator = (value, path) => {
  finiteNumberValue(value, path);
  if (!Number.isInteger(value)) fail(path, "expected integer");
};
const nonNegativeIntegerValue: Validator = (value, path) => {
  integerValue(value, path);
  if ((value as number) < 0) fail(path, "expected non-negative integer");
};

function fail(path: string, message: string): never {
  throw new CulinaryKnowledgeSchemaError(path, message);
}
function literal(expected: string | number | boolean): Validator {
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
function sortedIds(item: Validator): Validator {
  return (value, path) => {
    arrayOf(item)(value, path);
    const entries = value as string[];
    for (let index = 1; index < entries.length; index += 1) {
      if (entries[index - 1] >= entries[index]) fail(`${path}[${index}]`, "expected sorted unique ids");
    }
  };
}

const artifactPathValue: Validator = (value, path) => {
  if (typeof value !== "string" || value.length === 0) fail(path, "expected non-empty relative artifact path");
  const portablePath = value.replaceAll("\\", "/");
  if (portablePath.startsWith("/") || /^[A-Za-z]:\//.test(portablePath)) fail(path, "artifact path must be relative");
  if (portablePath.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    fail(path, "artifact path must not contain empty, current-directory, or parent-directory segments");
  }
};

export function parseGameArtifactPath(value: unknown, path = "artifactPath"): string {
  artifactPathValue(value, path);
  return value as string;
}

const requiredSourceFileRoles = [
  "ingredient-catalog",
  "operation-catalog",
  "nutrition-dataset",
  "rights-registry",
  "cat-kitchen-goal16-fixture",
] as const;
const sourceFileSchema = exactObject({
  path: artifactPathValue,
  sha256: sha256Value,
  role: enumValue(requiredSourceFileRoles),
});
const provenanceSchema = exactObject({
  kind: enumValue(["cooking-lab-factual-source", "cat-kitchen-calibration", "cultural-cooccurrence"]),
  sourceRevision: gitShaValue,
  sourceFiles: sortedIds(artifactPathValue),
  notes: nonEmptyStringValue,
});
const governanceSchema = exactObject({
  recordStatus: literal("reviewed"),
  reviewStatus: literal("reviewed"),
  rightsStatus: literal("approved"),
  compatibilityStatus: literal("compatible"),
  reviewer: literal("cooking-lab-goal17-culinary-knowledge-review"),
  rightsReviewer: literal("cooking-lab-goal17-rights-review"),
  provenance: provenanceSchema,
});
const ingredientStateSchema = exactObject({ id: idValue, description: nonEmptyStringValue, governance: governanceSchema });
const nutritionSchema = exactObject({ carbohydrateG: nonNegativeNumberValue, energyKcal: nonNegativeNumberValue, fatG: nonNegativeNumberValue, fiberG: nonNegativeNumberValue, proteinG: nonNegativeNumberValue });
const retentionSchema = exactObject({ carbohydrate: normalizedNumberValue, energy: normalizedNumberValue, fat: normalizedNumberValue, fiber: normalizedNumberValue, protein: normalizedNumberValue });
const physicalSchema = exactObject({
  aromaPotential: normalizedNumberValue,
  baseAcidity: normalizedNumberValue,
  baseBitterness: normalizedNumberValue,
  basePungency: normalizedNumberValue,
  baseSweetness: normalizedNumberValue,
  baseUmami: normalizedNumberValue,
  browningPotential: normalizedNumberValue,
  evaporationRate: normalizedNumberValue,
  fatFraction: normalizedNumberValue,
  proteinFraction: normalizedNumberValue,
  sugarFraction: normalizedNumberValue,
  thermalResponse: nonNegativeNumberValue,
  waterFraction: normalizedNumberValue,
});
const ingredientSchema = exactObject({
  id: idValue,
  role: enumValue(["aromatic", "fat", "fruit", "liquid", "produce", "protein", "seasoning", "starch"]),
  colorId: idValue,
  ingredientStateIds: sortedIds(idValue),
  platingComponentId: idValue,
  nutritionPer100g: nutritionSchema,
  retention: retentionSchema,
  physicalModel: physicalSchema,
  governance: governanceSchema,
});
const seasoningSchema = exactObject({
  id: idValue,
  acidityPerG: nonNegativeNumberValue,
  aromaPerG: nonNegativeNumberValue,
  bitternessPerG: nonNegativeNumberValue,
  heatSensitivity: normalizedNumberValue,
  pungencyPerG: nonNegativeNumberValue,
  saltinessPerG: nonNegativeNumberValue,
  sweetnessPerG: nonNegativeNumberValue,
  umamiPerG: nonNegativeNumberValue,
  governance: governanceSchema,
});
const transformationSchema = exactObject({ id: idValue, inputStateIds: sortedIds(idValue), operationId: idValue, outputStateIds: sortedIds(idValue), engineCapabilityIds: sortedIds(idValue), governance: governanceSchema });
const flavorSchema = exactObject({ id: idValue, ingredientIds: sortedIds(idValue), polarity: enumValue(["association", "complement", "clash"]), semanticCategory: enumValue(["physical", "cultural-cooccurrence"]), strength: normalizedNumberValue, evidenceCode: nonEmptyStringValue, governance: governanceSchema });
const tasteSchema = exactObject({ acidity: normalizedNumberValue, pungency: normalizedNumberValue, sweetness: normalizedNumberValue, umami: normalizedNumberValue });
const archetypeSchema = exactObject({
  id: idValue,
  archetype: idValue,
  cuisineId: idValue,
  ingredientIds: sortedIds(idValue),
  sequence: arrayOf(idValue, 1),
  platingComponentIds: sortedIds(idValue),
  engineCapabilityIds: sortedIds(idValue),
  commentaryEvidenceIds: sortedIds(idValue),
  taste: tasteSchema,
  aroma: normalizedNumberValue,
  texture: normalizedNumberValue,
  governance: governanceSchema,
});
const cuisineSchema = exactObject({ id: idValue, label: nonEmptyStringValue, governance: governanceSchema });
const platingSchema = exactObject({ id: idValue, shape: idValue, scale: normalizedNumberValue, governance: governanceSchema });
const engineSupports = [
  "commentary_v1",
  "dish_profile_v1",
  "physical_truth_wrap",
  "plating_plan_v1",
  "wok",
] as const;
const engineSchema = exactObject({ id: idValue, supports: sortedIds(enumValue(engineSupports)), governance: governanceSchema });
const commentarySchema = exactObject({ id: idValue, channel: enumValue(["commentary", "cat_reaction"]), localizationKey: nonEmptyStringValue, localization: exactObject({ en: nonEmptyStringValue, zhCN: nonEmptyStringValue }), governance: governanceSchema });

const sourceFields: Shape = {
  schemaVersion: literal(1),
  sourceKind: literal("goal17-calibration"),
  snapshotId: idValue,
  sourceRevision: gitShaValue,
  sourceAuditSha: gitShaValue,
  physicalContentVersion: idValue,
  owner: literal("Cooking Lab"),
  recordStatus: literal("reviewed"),
  reviewStatus: literal("reviewed"),
  rightsStatus: literal("approved"),
  compatibilityStatus: literal("compatible"),
  sourceFiles: arrayOf(sourceFileSchema, 1),
  ingredientStates: arrayOf(ingredientStateSchema, 1),
  ingredientKnowledge: arrayOf(ingredientSchema, 1),
  seasonings: arrayOf(seasoningSchema),
  transformationRules: arrayOf(transformationSchema, 1),
  flavorRelations: arrayOf(flavorSchema),
  dishArchetypes: arrayOf(archetypeSchema, 1),
  cuisines: arrayOf(cuisineSchema, 1),
  platingComponents: arrayOf(platingSchema, 1),
  engineCapabilities: arrayOf(engineSchema, 1),
  commentaryEvidence: arrayOf(commentarySchema, 1),
};
const sourceSchema = exactObject({ schemaId: literal(culinaryKnowledgeSourceSchemaId), ...sourceFields });
const snapshotSchema = exactObject({ schemaId: literal(culinaryKnowledgeSnapshotSchemaId), ...sourceFields, compiledSnapshotId: idValue, sourceSha256: sha256Value });
const manifestSchema = exactObject({
  schemaId: literal(culinaryKnowledgeManifestSchemaId),
  schemaVersion: literal(1),
  snapshotId: idValue,
  sourcePath: artifactPathValue,
  sourceSha256: sha256Value,
  compiledSnapshotPath: artifactPathValue,
  compiledSnapshotSha256: sha256Value,
  sourceRevision: gitShaValue,
  sourceFiles: arrayOf(sourceFileSchema, 1),
  counts: exactObject({
    ingredientStates: nonNegativeIntegerValue,
    ingredientKnowledge: nonNegativeIntegerValue,
    seasonings: nonNegativeIntegerValue,
    transformationRules: nonNegativeIntegerValue,
    flavorRelations: nonNegativeIntegerValue,
    dishArchetypes: nonNegativeIntegerValue,
    cuisines: nonNegativeIntegerValue,
    platingComponents: nonNegativeIntegerValue,
    engineCapabilities: nonNegativeIntegerValue,
    commentaryEvidence: nonNegativeIntegerValue,
  }),
});

export function parseCulinaryKnowledgeSource(value: unknown, path = "CulinaryKnowledgeSourceV1"): CulinaryKnowledgeSourceV1 {
  sourceSchema(value, path);
  const source = value as CulinaryKnowledgeSourceV1;
  validateSemanticReferences(source, path);
  return source;
}

export function parseCulinaryKnowledgeSnapshot(value: unknown, path = "CulinaryKnowledgeSnapshotV1"): CulinaryKnowledgeSnapshotV1 {
  snapshotSchema(value, path);
  const source = value as CulinaryKnowledgeSnapshotV1;
  validateSemanticReferences(source, path);
  return source;
}

export function parseCulinaryKnowledgeManifest(value: unknown, path = "CulinaryKnowledgeManifestV1"): CulinaryKnowledgeManifestV1 {
  manifestSchema(value, path);
  const manifest = value as CulinaryKnowledgeManifestV1;
  validateSourceFiles(manifest.sourceFiles, `${path}.sourceFiles`);
  return manifest;
}

function validateSourceFiles(
  sourceFiles: CulinaryKnowledgeSourceV1["sourceFiles"],
  path: string,
): void {
  validateSorted(sourceFiles, path, (entry) => entry.path);
  const roles = sourceFiles.map((entry) => entry.role);
  const actualRoles = new Set(roles);
  if (
    roles.length !== requiredSourceFileRoles.length
    || actualRoles.size !== requiredSourceFileRoles.length
    || requiredSourceFileRoles.some((role) => !actualRoles.has(role))
  ) {
    fail(path, `expected exactly one of each required role: ${requiredSourceFileRoles.join(", ")}`);
  }
}

function validateSemanticReferences(
  source: Omit<CulinaryKnowledgeSourceV1, "schemaId">,
  path: string,
): void {
  validateSourceFiles(source.sourceFiles, `${path}.sourceFiles`);
  validateSorted(source.ingredientStates, `${path}.ingredientStates`, (entry) => entry.id);
  validateSorted(source.ingredientKnowledge, `${path}.ingredientKnowledge`, (entry) => entry.id);
  validateSorted(source.seasonings, `${path}.seasonings`, (entry) => entry.id);
  validateSorted(source.transformationRules, `${path}.transformationRules`, (entry) => entry.id);
  validateSorted(source.flavorRelations, `${path}.flavorRelations`, (entry) => entry.id);
  validateSorted(source.dishArchetypes, `${path}.dishArchetypes`, (entry) => entry.id);
  validateSorted(source.cuisines, `${path}.cuisines`, (entry) => entry.id);
  validateSorted(source.platingComponents, `${path}.platingComponents`, (entry) => entry.id);
  validateSorted(source.engineCapabilities, `${path}.engineCapabilities`, (entry) => entry.id);
  validateSorted(source.commentaryEvidence, `${path}.commentaryEvidence`, (entry) => entry.id);

  const sourcePaths = new Set(source.sourceFiles.map((entry) => entry.path));
  const stateIds = new Set(source.ingredientStates.map((entry) => entry.id));
  const ingredientIds = new Set(source.ingredientKnowledge.map((entry) => entry.id));
  const seasoningIds = new Set(source.seasonings.map((entry) => entry.id));
  const edibleIds = new Set([...ingredientIds, ...seasoningIds]);
  const platingIds = new Set(source.platingComponents.map((entry) => entry.id));
  const engineIds = new Set(source.engineCapabilities.map((entry) => entry.id));
  const evidenceIds = new Set(source.commentaryEvidence.map((entry) => entry.id));
  const cuisineIds = new Set(source.cuisines.map((entry) => entry.id));

  for (const governed of governedRecords(source)) {
    for (const sourceFile of governed.governance.provenance.sourceFiles) {
      if (!sourcePaths.has(sourceFile)) fail(`${path}.${governed.collection}.${governed.id}.governance.provenance.sourceFiles`, `unknown source file ${sourceFile}`);
    }
  }
  for (const ingredient of source.ingredientKnowledge) {
    requireKnown(ingredient.ingredientStateIds, stateIds, `${path}.ingredientKnowledge.${ingredient.id}.ingredientStateIds`);
    if (!platingIds.has(ingredient.platingComponentId)) fail(`${path}.ingredientKnowledge.${ingredient.id}.platingComponentId`, "unknown plating component");
  }
  for (const rule of source.transformationRules) {
    requireKnown(rule.inputStateIds, stateIds, `${path}.transformationRules.${rule.id}.inputStateIds`);
    requireKnown(rule.outputStateIds, stateIds, `${path}.transformationRules.${rule.id}.outputStateIds`);
    requireKnown(rule.engineCapabilityIds, engineIds, `${path}.transformationRules.${rule.id}.engineCapabilityIds`);
    if (!transformationOperationIds.has(rule.operationId)) {
      fail(`${path}.transformationRules.${rule.id}.operationId`, "unsupported Wok V1 operation id");
    }
  }
  for (const relation of source.flavorRelations) {
    if (relation.ingredientIds.length !== 2) {
      fail(`${path}.flavorRelations.${relation.id}.ingredientIds`, "expected exactly two distinct ingredients");
    }
    requireKnown(relation.ingredientIds, edibleIds, `${path}.flavorRelations.${relation.id}.ingredientIds`);
    if (relation.semanticCategory === "cultural-cooccurrence" && relation.governance.provenance.kind !== "cultural-cooccurrence") {
      fail(`${path}.flavorRelations.${relation.id}.governance.provenance.kind`, "cultural co-occurrence must use cultural-cooccurrence provenance");
    }
    if (relation.semanticCategory === "physical" && relation.governance.provenance.kind === "cultural-cooccurrence") {
      fail(`${path}.flavorRelations.${relation.id}.semanticCategory`, "cultural co-occurrence cannot be promoted to physical");
    }
    if (relation.semanticCategory === "cultural-cooccurrence" && relation.polarity !== "association") {
      fail(`${path}.flavorRelations.${relation.id}.polarity`, "cultural co-occurrence cannot claim physical complement or clash");
    }
    if (relation.semanticCategory === "physical" && relation.polarity === "association") {
      fail(`${path}.flavorRelations.${relation.id}.polarity`, "physical relation cannot use association polarity");
    }
  }
  for (const archetype of source.dishArchetypes) {
    requireKnown(archetype.ingredientIds, edibleIds, `${path}.dishArchetypes.${archetype.id}.ingredientIds`);
    requireKnown(archetype.sequence, edibleIds, `${path}.dishArchetypes.${archetype.id}.sequence`);
    requireKnown(archetype.platingComponentIds, platingIds, `${path}.dishArchetypes.${archetype.id}.platingComponentIds`);
    requireKnown(archetype.engineCapabilityIds, engineIds, `${path}.dishArchetypes.${archetype.id}.engineCapabilityIds`);
    requireKnown(archetype.commentaryEvidenceIds, evidenceIds, `${path}.dishArchetypes.${archetype.id}.commentaryEvidenceIds`);
    if (!cuisineIds.has(archetype.cuisineId)) fail(`${path}.dishArchetypes.${archetype.id}.cuisineId`, "unknown cuisine id");
  }
}

function validateSorted<T>(records: readonly T[], path: string, id: (entry: T) => string): void {
  for (let index = 1; index < records.length; index += 1) {
    if (id(records[index - 1]) >= id(records[index])) fail(`${path}[${index}]`, "expected sorted unique records");
  }
}
function requireKnown(ids: readonly string[], known: ReadonlySet<string>, path: string): void {
  for (const id of ids) {
    if (!known.has(id)) fail(path, `unknown id ${id}`);
  }
}
function governedRecords(source: Omit<CulinaryKnowledgeSourceV1, "schemaId">) {
  return [
    ...source.ingredientStates.map((entry) => ({ collection: "ingredientStates", id: entry.id, governance: entry.governance })),
    ...source.ingredientKnowledge.map((entry) => ({ collection: "ingredientKnowledge", id: entry.id, governance: entry.governance })),
    ...source.seasonings.map((entry) => ({ collection: "seasonings", id: entry.id, governance: entry.governance })),
    ...source.transformationRules.map((entry) => ({ collection: "transformationRules", id: entry.id, governance: entry.governance })),
    ...source.flavorRelations.map((entry) => ({ collection: "flavorRelations", id: entry.id, governance: entry.governance })),
    ...source.dishArchetypes.map((entry) => ({ collection: "dishArchetypes", id: entry.id, governance: entry.governance })),
    ...source.cuisines.map((entry) => ({ collection: "cuisines", id: entry.id, governance: entry.governance })),
    ...source.platingComponents.map((entry) => ({ collection: "platingComponents", id: entry.id, governance: entry.governance })),
    ...source.engineCapabilities.map((entry) => ({ collection: "engineCapabilities", id: entry.id, governance: entry.governance })),
    ...source.commentaryEvidence.map((entry) => ({ collection: "commentaryEvidence", id: entry.id, governance: entry.governance })),
  ];
}
