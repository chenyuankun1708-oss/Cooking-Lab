import { createContentVersion } from "./content-version";
import { rightsActions } from "@/types/content-rights";
import type { ContentArtifact, RightsAssessment } from "@/types/content-rights";
import type { Source } from "@/types/culinary";
import type {
  GameIngredientCatalogV1,
  GameNutritionDatasetSubsetV1,
  GameOperationDefinitionV1,
  GameRecipeV1,
  GameRightsRegistryV1,
} from "@/types/game-recipe";
import type { Nutrition } from "@/types/nutrition";
import type {
  PublishingRiskClassification,
  PublishingRiskLevel,
  PublishingRiskReasonCode,
  ReviewAttestation,
  ReviewDimension,
  SamplingQaBatch,
} from "@/types/publishing-governance";
import type { GameNormalizationRegistryV1, GameSourceFactBundleV1 } from "@/types/game-source-facts";
import { evaluateGameSourceFactBundle } from "./game-source-fact-validation";
import { createSamplingBatchEvidenceDigest } from "./publishing-governance";
import { validateResearchRegistry } from "./research-validation";

export const gameRecipeIssueCodes = [
  "duplicate-id",
  "invalid-schema",
  "invalid-number",
  "missing-reference",
  "invalid-graph",
  "invalid-operation",
  "invalid-nutrition",
  "invalid-rights",
  "invalid-governance",
  "invalid-scenario",
  "stale-artifact-version",
] as const;

export type GameRecipeIssueCode = (typeof gameRecipeIssueCodes)[number];

export interface GameRecipeIssue {
  code: GameRecipeIssueCode;
  recipeId: string;
  field: string;
  message: string;
}

export interface GameRecipeValidationContext {
  operations: readonly GameOperationDefinitionV1[];
  ingredients: GameIngredientCatalogV1;
  nutritionDataset?: GameNutritionDatasetSubsetV1;
  rightsRegistry?: GameRightsRegistryV1;
  normalizationRegistry?: GameNormalizationRegistryV1;
  sourceFactBundles?: readonly GameSourceFactBundleV1[];
  now: string;
}

export interface GameRecipeAuditResult {
  ready: boolean;
  recipeCount: number;
  exportableCount: number;
  issues: GameRecipeIssue[];
}

type ArtifactPayload = Omit<GameRecipeV1, "artifactVersion" | "eligibility" | "governance">;

const requiredArtifactKinds = ["identity", "preparation", "nutrition", "simulation"] as const;
const requiredReviewDimensions = ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"] as const;
const riskRank: Record<PublishingRiskLevel, number> = { low: 0, medium: 1, high: 2 };
const highRiskReasons = new Set<PublishingRiskReasonCode>([
  "official-authorization-or-brand-relationship",
  "health-or-medical-claim",
  "food-safety-critical-process",
  "unresolved-material-factual-conflict",
  "complex-trademark-publicity-or-privacy",
  "unresolved-reviewer-disagreement",
  "professional-legal-checkpoint",
]);
const mediumRiskReasons = new Set<PublishingRiskReasonCode>([
  "single-source-deep-adaptation",
  "resolved-source-conflict",
  "restaurant-reconstruction",
  "product-profile",
  "ai-generated-image",
  "weak-image-fidelity",
  "culinary-authenticity-judgment",
]);
const nutritionKeys: readonly (keyof Nutrition)[] = [
  "calories", "protein", "fat", "saturatedFat", "carbs", "sugar", "addedSugar", "fiber", "sodium",
];

export function gameRecipeArtifactPayload(recipe: GameRecipeV1): ArtifactPayload {
  const payload = { ...recipe } as Partial<GameRecipeV1>;
  delete payload.artifactVersion;
  delete payload.eligibility;
  delete payload.governance;
  return {
    ...payload as ArtifactPayload,
    scenarios: (payload.scenarios ?? []).map((scenario) => ({ ...scenario, baselineArtifactVersion: "" })),
  } satisfies ArtifactPayload;
}

export function createGameRecipeArtifactVersion(recipe: GameRecipeV1): string {
  return createContentVersion(gameRecipeArtifactPayload(recipe));
}

export function createGameArtifactSetVersion(
  recipes: readonly GameRecipeV1[],
  registry: GameRightsRegistryV1,
  support?: Pick<GameRecipeValidationContext, "operations" | "ingredients" | "nutritionDataset" | "normalizationRegistry" | "sourceFactBundles">,
): string {
  const recipeIds = new Set(recipes.map((recipe) => recipe.recipeId));
  const artifacts = registry.artifacts
    .filter((artifact) => artifact.subject.type === "game-recipe" && recipeIds.has(artifact.subject.id))
    .sort(byId);
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
  const decisions = registry.decisions.filter((decision) => artifactIds.has(decision.artifactId)).sort(byId);
  const assessmentIds = new Set([
    ...artifacts.map((artifact) => artifact.rightsAssessmentId),
    ...decisions.flatMap((decision) => decision.assessmentIds),
  ]);
  const assessments = registry.assessments.filter((assessment) => assessmentIds.has(assessment.id)).sort(byId);
  const sourceIds = new Set([
    ...artifacts.flatMap((artifact) => artifact.sourceIds),
    ...recipes.flatMap((recipe) => recipe.rights.sourceIds),
  ]);
  const evidenceIds = new Set([
    ...artifacts.flatMap((artifact) => artifact.evidenceIds),
    ...recipes.flatMap((recipe) => recipe.rights.evidenceIds),
  ]);
  const ingredientIds = new Set(recipes.flatMap((recipe) => recipe.ingredientPortions.map((portion) => portion.ingredientId)));
  const conversionRecordIds = new Set(recipes.flatMap((recipe) => recipe.ingredientPortions.map((portion) => portion.sourceQuantity.conversionRecordId)));
  const upstreamRecordIds = new Set(recipes.flatMap((recipe) => recipe.nutritionProfile.provenance.map((entry) => entry.upstreamRecordId)));
  return createContentVersion({
    policyVersion: registry.policyVersion,
    governancePolicyVersion: registry.governance.policyVersion,
    recipes: [...recipes]
      .map((recipe) => ({ recipeId: recipe.recipeId, artifactVersion: recipe.artifactVersion }))
      .sort((left, right) => left.recipeId.localeCompare(right.recipeId)),
    artifacts,
    decisions,
    assessments,
    attributions: registry.attributions.filter((entry) => artifactIds.has(entry.artifactId)).sort(byId),
    sources: registry.sources.filter((source) => sourceIds.has(source.id)).sort(byId),
    sourceRoles: registry.sourceRoles
      .filter((entry) => sourceIds.has(entry.sourceId) && (!entry.recipeId || recipeIds.has(entry.recipeId)))
      .sort((left, right) => left.sourceId.localeCompare(right.sourceId) || left.role.localeCompare(right.role)),
    evidence: registry.evidence.filter((evidence) => evidenceIds.has(evidence.id)).sort(byId),
    evidenceOrigins: registry.evidenceOrigins.filter((entry) => evidenceIds.has(entry.evidenceId)).sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
    researchRecords: registry.researchRecords
      .filter((record) => record.subject.type === "game-recipe" && recipeIds.has(record.subject.id))
      .sort(byId),
    supportingVersions: support ? {
      operations: [...support.operations].sort(byId),
      ingredientCatalogVersion: support.ingredients.catalogVersion,
      ingredients: support.ingredients.ingredients.filter((ingredient) => ingredientIds.has(ingredient.ingredientId)).sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
      conversionRecords: support.ingredients.conversionRecords
        .filter((record) => conversionRecordIds.has(record.recordId))
        .sort((left, right) => left.recordId.localeCompare(right.recordId)),
      nutritionDataset: support.nutritionDataset ? {
        ...support.nutritionDataset,
        records: support.nutritionDataset.records
          .filter((record) => upstreamRecordIds.has(record.fdcId))
          .sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
      } : null,
      ...(recipes.some((recipe) => recipe.authoring.method === "deterministic-source-normalization") ? {
        normalizationRegistry: support.normalizationRegistry ?? null,
        sourceFactBundles: [...(support.sourceFactBundles ?? [])]
          .filter((bundle) => recipes.some((recipe) => recipe.authoring.normalizationTrace?.sourceFactBundleId === bundle.bundleId))
          .sort((left, right) => left.bundleId.localeCompare(right.bundleId)),
      } : {}),
    } : {
      operationTypes: [...new Set(recipes.flatMap((recipe) => recipe.operationGraph.nodes.map((node) => node.operationType)))].sort(),
      nutritionDatasetVersions: [...new Set(recipes.flatMap((recipe) => recipe.nutritionProfile.provenance.map((entry) => `${entry.provider}:${entry.datasetVersion}`)))].sort(),
    },
  });
}

export function evaluateGameRecipeCorpus(
  recipes: readonly GameRecipeV1[],
  context: GameRecipeValidationContext,
): GameRecipeAuditResult {
  const issues: GameRecipeIssue[] = [];
  const report = (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => {
    issues.push({ code, recipeId, field, message });
  };
  validateCatalogs(context, report);
  const operationById = new Map(context.operations.map((operation) => [operation.id, operation]));
  const ingredientById = new Map(context.ingredients.ingredients.map((ingredient) => [ingredient.ingredientId, ingredient]));
  const conversionById = new Map(context.ingredients.conversionRecords.map((record) => [record.recordId, record]));
  const recipeIds = new Set<string>();
  const slugs = new Set<string>();
  for (const recipe of recipes) {
    if (recipeIds.has(recipe.recipeId)) report("duplicate-id", recipe.recipeId, "recipeId", "Recipe ID must be unique");
    if (slugs.has(recipe.slug)) report("duplicate-id", recipe.recipeId, "slug", "Recipe slug must be unique");
    recipeIds.add(recipe.recipeId);
    slugs.add(recipe.slug);
    evaluateRecipe(recipe, recipes, operationById, ingredientById, conversionById, context, report);
  }
  return {
    ready: issues.length === 0 && recipes.length > 0 && recipes.every((recipe) => recipe.eligibility === "exportable"),
    recipeCount: recipes.length,
    exportableCount: recipes.filter((recipe) => recipe.eligibility === "exportable").length,
    issues: issues.sort((left, right) => `${left.recipeId}:${left.code}:${left.field}`.localeCompare(`${right.recipeId}:${right.code}:${right.field}`)),
  };
}

export function assertGameRecipeCorpusReady(
  recipes: readonly GameRecipeV1[],
  context: GameRecipeValidationContext,
): void {
  const result = evaluateGameRecipeCorpus(recipes, context);
  if (result.ready) return;
  const issueText = result.issues.map((issue) => `${issue.code}:${issue.recipeId}:${issue.field}`).join("; ");
  const draftText = result.exportableCount === result.recipeCount ? "" : `; drafts:${result.recipeCount - result.exportableCount}`;
  throw new Error(`Game data gate blocked export: ${issueText}${draftText}`);
}

function validateCatalogs(
  context: GameRecipeValidationContext,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  if (context.ingredients.schemaVersion !== "cooking-lab-game-ingredients-v1") {
    report("invalid-schema", "ingredient-catalog", "schemaVersion", "Unsupported ingredient catalog schema");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(context.now)) {
    report("invalid-schema", "game-data", "now", "Validation date must be ISO yyyy-mm-dd");
  }
  reportDuplicates(context.operations, (entry) => entry.id, "operation-catalog", "operations", report);
  reportDuplicates(context.ingredients.ingredients, (entry) => entry.ingredientId, "ingredient-catalog", "ingredients", report);
  reportDuplicates(context.ingredients.conversionRecords, (entry) => entry.recordId, "ingredient-catalog", "conversionRecords", report);
  if (context.nutritionDataset) validateNutritionDataset(context.nutritionDataset, context.ingredients, report);
  for (const operation of context.operations) {
    if (operation.equipmentRequired && !operation.compatibleEquipmentIds.length) {
      report("invalid-operation", "operation-catalog", `operations.${operation.id}.compatibleEquipmentIds`, "Equipment-required operations need at least one compatible equipment ID");
    }
    for (const group of operation.requiredParameterGroups) {
      if (!group.length || group.some((key) => !operation.allowedParameters.includes(key))) {
        report("invalid-operation", "operation-catalog", `operations.${operation.id}.requiredParameterGroups`, "Required parameter groups must be non-empty subsets of allowed parameters");
      }
    }
  }
  if (context.rightsRegistry) validateRegistryIdUniqueness(context.rightsRegistry, report);
  for (const ingredient of context.ingredients.ingredients) {
    if (ingredient.nutritionSource.kind === "dataset") {
      if (ingredient.nutritionSource.datasetId !== "usda-fooddata-central" || !/^\d+$/.test(ingredient.nutritionSource.fdcId)) {
        report("invalid-nutrition", ingredient.ingredientId, "nutritionSource", "Dataset nutrition must identify a numeric USDA FoodData Central record");
      }
      if (!ingredient.nutritionSource.datasetVersion.trim() || !isIsoDate(ingredient.nutritionSource.accessedAt)) {
        report("invalid-nutrition", ingredient.ingredientId, "nutritionSource", "Dataset nutrition requires a version and access date");
      }
    } else if (!ingredient.nutritionSource.provenanceId.trim() || !ingredient.nutritionSource.limitations.trim()) {
      report("invalid-nutrition", ingredient.ingredientId, "nutritionSource", "Migration estimates require explicit provenance and limitations");
    }
    if (!ingredient.nutritionProvenanceId.trim()) {
      report("invalid-nutrition", ingredient.ingredientId, "nutritionProvenanceId", "Ingredient nutrition provenance is required");
    }
    for (const key of nutritionKeys) {
      if (!isNonNegative(ingredient.nutritionPer100g[key])) {
        report("invalid-nutrition", ingredient.ingredientId, `nutritionPer100g.${key}`, "Nutrition values must be non-negative finite numbers");
      }
    }
  }
  const ingredientById = new Map(context.ingredients.ingredients.map((ingredient) => [ingredient.ingredientId, ingredient]));
  const conversionKeys = new Set<string>();
  for (const record of context.ingredients.conversionRecords) {
    if (!record.recordId.trim() || !isPositive(record.gramsPerUnit) || !record.basis.trim() || !record.provenanceId.trim()) {
      report("invalid-number", "ingredient-catalog", `conversionRecords.${record.recordId}`, "Unit conversion records require an ID, positive factor, basis and provenance");
      continue;
    }
    if (!record.ingredientId) {
      const expected = record.unit === "g" ? ["si:g:v1", 1] as const : record.unit === "kg" ? ["si:kg:v1", 1_000] as const : undefined;
      if (!expected || record.recordId !== expected[0] || record.gramsPerUnit !== expected[1]) {
        report("invalid-schema", "ingredient-catalog", `conversionRecords.${record.recordId}`, "Only the exact versioned SI gram and kilogram records may be global");
      }
      continue;
    }
    const ingredient = ingredientById.get(record.ingredientId);
    const expectedWeight = record.unit === "ml"
      ? ingredient?.densityGPerMl ?? ingredient?.unitWeightsG.ml
      : record.unit === "g" || record.unit === "kg"
        ? undefined
        : ingredient?.unitWeightsG[record.unit];
    const key = `${record.ingredientId}:${record.unit}`;
    if (conversionKeys.has(key)) report("duplicate-id", "ingredient-catalog", `conversionRecords.${record.recordId}`, "An ingredient may declare only one conversion per unit");
    conversionKeys.add(key);
    if (!ingredient || expectedWeight === undefined || Math.abs(expectedWeight - record.gramsPerUnit) > 0.000001) {
      report("invalid-number", "ingredient-catalog", `conversionRecords.${record.recordId}`, "Ingredient conversion must exactly match its versioned ingredient weight or density");
    }
  }
}

function validateRegistryIdUniqueness(
  registry: GameRightsRegistryV1,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const collections: Array<[string, readonly { id: string }[]]> = [
    ["artifacts", registry.artifacts],
    ["assessments", registry.assessments],
    ["attributions", registry.attributions],
    ["decisions", registry.decisions],
    ["sources", registry.sources],
    ["evidence", registry.evidence],
    ["researchRecords", registry.researchRecords],
    ["attestations", registry.governance.attestations],
    ["riskClassifications", registry.governance.riskClassifications],
    ["samplingBatches", registry.governance.samplingBatches],
  ];
  const ownerById = new Map<string, string>();
  for (const [collection, entries] of collections) {
    for (const entry of entries) {
      const prior = ownerById.get(entry.id);
      if (prior) {
        report("duplicate-id", "rights-registry", collection, `Registry ID ${entry.id} is already used by ${prior}`);
      } else {
        ownerById.set(entry.id, collection);
      }
    }
  }
  const evidenceOriginIds = new Set<string>();
  for (const entry of registry.evidenceOrigins) {
    if (evidenceOriginIds.has(entry.evidenceId)) {
      report("duplicate-id", "rights-registry", "evidenceOrigins", `Duplicate evidence origin for ${entry.evidenceId}`);
    }
    evidenceOriginIds.add(entry.evidenceId);
  }
  reportDuplicates(registry.sourceRoles, (entry) => `${entry.recipeId ?? "global"}:${entry.sourceId}:${entry.role}`, "rights-registry", "sourceRoles", report);
  const sourceIds = new Set(registry.sources.map((source) => source.id));
  for (const entry of registry.sourceRoles) {
    if (!sourceIds.has(entry.sourceId)) report("missing-reference", "rights-registry", "sourceRoles.sourceId", `Missing source ${entry.sourceId}`);
    const recipeRole = entry.role === "recipe-primary" || entry.role === "recipe-cross-check";
    if (recipeRole !== Boolean(entry.workFamilyId?.trim()) || recipeRole !== Boolean(entry.recipeId?.trim())) {
      report("invalid-rights", "rights-registry", "sourceRoles", "Recipe source roles require recipeId and workFamilyId; non-recipe roles must omit both");
    }
  }
}

function evaluateRecipe(
  recipe: GameRecipeV1,
  allRecipes: readonly GameRecipeV1[],
  operationById: ReadonlyMap<string, GameOperationDefinitionV1>,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
  conversionById: ReadonlyMap<string, GameIngredientCatalogV1["conversionRecords"][number]>,
  context: GameRecipeValidationContext,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  if (recipe.schemaVersion !== "cooking-lab-game-recipe-v1") {
    report("invalid-schema", recipe.recipeId, "schemaVersion", "Unsupported GameRecipe schema version");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(recipe.recipeId) || recipe.recipeId !== recipe.slug) {
    report("invalid-schema", recipe.recipeId, "recipeId", "Recipe ID and slug must be the same stable kebab-case identifier");
  }
  if (!isPositive(recipe.servings) || !isPositive(recipe.yield.amount)) {
    report("invalid-number", recipe.recipeId, "yield", "Servings and yield must be positive finite values");
  }
  if (recipe.authoring.containsGeneratedExpression !== false) {
    report("invalid-rights", recipe.recipeId, "authoring.containsGeneratedExpression", "Deterministic game data cannot contain generated expression");
  }
  validateNormalizationTrace(recipe, context, report);
  if (new Set(recipe.authoring.unresolvedMappings).size !== recipe.authoring.unresolvedMappings.length) {
    report("invalid-schema", recipe.recipeId, "authoring.unresolvedMappings", "Unresolved mapping codes must be unique");
  }
  if (recipe.eligibility === "exportable" && recipe.authoring.unresolvedMappings.length) {
    report("invalid-graph", recipe.recipeId, "authoring.unresolvedMappings", "Exportable recipes cannot contain unresolved source mappings");
  }
  if (createGameRecipeArtifactVersion(recipe) !== recipe.artifactVersion) {
    report("stale-artifact-version", recipe.recipeId, "artifactVersion", "Artifact version does not match the canonical recipe payload");
  }

  const portionIds = new Set<string>();
  for (const portion of recipe.ingredientPortions) {
    if (portionIds.has(portion.portionId)) report("duplicate-id", recipe.recipeId, `ingredientPortions.${portion.portionId}`, "Portion IDs must be unique");
    portionIds.add(portion.portionId);
    if (!portion.ingredientId.trim() || !isPositive(portion.massG) || (portion.volumeMl !== undefined && !isPositive(portion.volumeMl))) {
      report("invalid-number", recipe.recipeId, `ingredientPortions.${portion.portionId}`, "Ingredient portions require IDs and positive canonical quantities");
    }
    const ingredient = ingredientById.get(portion.ingredientId);
    if (!ingredient) {
      report("missing-reference", recipe.recipeId, `ingredientPortions.${portion.portionId}.ingredientId`, `Missing ingredient ${portion.ingredientId}`);
    } else if (portion.nutritionProvenanceId !== ingredient.nutritionProvenanceId) {
      report("invalid-nutrition", recipe.recipeId, `ingredientPortions.${portion.portionId}.nutritionProvenanceId`, "Portion provenance must match the ingredient catalog");
    }
    if (!isPositive(portion.sourceQuantity.amount) || !portion.sourceQuantity.conversionRecordId.trim()) {
      report("invalid-number", recipe.recipeId, `ingredientPortions.${portion.portionId}.sourceQuantity`, "Source quantity requires a positive amount and explicit conversion record");
    }
    const conversion = conversionById.get(portion.sourceQuantity.conversionRecordId);
    const conversionBlocker = `portion:${portion.portionId}:conversion`;
    if (!conversion && (recipe.eligibility === "exportable" || !recipe.authoring.unresolvedMappings.includes(conversionBlocker))) {
      report("missing-reference", recipe.recipeId, `ingredientPortions.${portion.portionId}.sourceQuantity.conversionRecordId`, "Source quantity must reference a versioned conversion record");
    }
    reportDuplicateStrings(portion.allowedSubstitutionIngredientIds, recipe.recipeId, `ingredientPortions.${portion.portionId}.allowedSubstitutionIngredientIds`, report);
    for (const replacementId of portion.allowedSubstitutionIngredientIds) {
      if (replacementId === portion.ingredientId || !ingredientById.has(replacementId)) {
        report("missing-reference", recipe.recipeId, `ingredientPortions.${portion.portionId}.allowedSubstitutionIngredientIds`, "Allowed substitutions must identify a different catalog ingredient");
      }
    }
    if (recipe.eligibility === "exportable" && ingredient) {
      const expectedMass = sourceQuantityMassG(portion.sourceQuantity, portion.ingredientId, conversion);
      if (expectedMass === null || Math.abs(expectedMass - portion.massG) > 0.011) {
        report("invalid-number", recipe.recipeId, `ingredientPortions.${portion.portionId}.sourceQuantity`, "Canonical mass must match the recorded unit conversion");
      }
      if (portion.volumeMl !== undefined && (ingredient.densityGPerMl === undefined || Math.abs(portion.volumeMl * ingredient.densityGPerMl - portion.massG) > 0.011)) {
        report("invalid-number", recipe.recipeId, `ingredientPortions.${portion.portionId}.volumeMl`, "Exported volume requires catalog density and must reproduce canonical mass");
      }
    }
  }
  if (!portionIds.size) report("missing-reference", recipe.recipeId, "ingredientPortions", "Every game recipe requires at least one quantified ingredient portion");

  const nodeById = new Map<string, GameRecipeV1["operationGraph"]["nodes"][number]>();
  const outputStateIds = new Set<string>();
  for (const node of recipe.operationGraph.nodes) {
    if (nodeById.has(node.nodeId)) report("duplicate-id", recipe.recipeId, `operationGraph.${node.nodeId}`, "Operation node IDs must be unique");
    nodeById.set(node.nodeId, node);
    const definition = operationById.get(node.operationType);
    if (!definition) {
      report("invalid-operation", recipe.recipeId, `operationGraph.${node.nodeId}.operationType`, "Operation is missing from the versioned catalog");
      continue;
    }
    if (!Number.isInteger(node.activeDurationMs) || node.activeDurationMs < 0 || !Number.isInteger(node.waitDurationMs) || node.waitDurationMs < 0) {
      report("invalid-number", recipe.recipeId, `operationGraph.${node.nodeId}.duration`, "Operation durations must be non-negative integer milliseconds");
    }
    reportDuplicateStrings(node.dependsOn, recipe.recipeId, `operationGraph.${node.nodeId}.dependsOn`, report);
    reportDuplicateStrings(node.inputPortionIds, recipe.recipeId, `operationGraph.${node.nodeId}.inputPortionIds`, report);
    reportDuplicateStrings(node.outputStateIds, recipe.recipeId, `operationGraph.${node.nodeId}.outputStateIds`, report);
    if (!node.outputStateIds.length || node.outputStateIds.some((stateId) => !stateId.trim())) {
      report("invalid-graph", recipe.recipeId, `operationGraph.${node.nodeId}.outputStateIds`, "Every operation must declare at least one non-empty output state ID");
    }
    for (const stateId of node.outputStateIds) {
      if (outputStateIds.has(stateId)) report("duplicate-id", recipe.recipeId, `operationGraph.${node.nodeId}.outputStateIds`, `Output state ${stateId} must be unique across the operation graph`);
      outputStateIds.add(stateId);
    }
    for (const portionId of node.inputPortionIds) {
      if (!portionIds.has(portionId)) report("missing-reference", recipe.recipeId, `operationGraph.${node.nodeId}.inputPortionIds`, `Missing portion ${portionId}`);
    }
    for (const key of Object.keys(node.parameters)) {
      if (!definition.allowedParameters.includes(key as never)) {
        report("invalid-operation", recipe.recipeId, `operationGraph.${node.nodeId}.parameters.${key}`, "Parameter is not permitted for this operation");
      }
      const value = node.parameters[key as keyof typeof node.parameters];
      if (value !== undefined && !Number.isFinite(value)) report("invalid-number", recipe.recipeId, `operationGraph.${node.nodeId}.parameters.${key}`, "Operation parameters must be finite");
    }
    validateParameterRanges(recipe.recipeId, node.nodeId, node.parameters, report);
    validateOperationContract(recipe, node, definition, report);
    validateTargetStates(recipe, node, report);
  }
  if (!nodeById.size) report("invalid-graph", recipe.recipeId, "operationGraph.nodes", "Every game recipe requires at least one operation node");
  for (const node of nodeById.values()) {
    for (const dependencyId of node.dependsOn) {
      if (!nodeById.has(dependencyId)) report("missing-reference", recipe.recipeId, `operationGraph.${node.nodeId}.dependsOn`, `Missing dependency ${dependencyId}`);
      if (dependencyId === node.nodeId) report("invalid-graph", recipe.recipeId, `operationGraph.${node.nodeId}.dependsOn`, "Operation cannot depend on itself");
    }
  }
  if (hasCycle(nodeById)) report("invalid-graph", recipe.recipeId, "operationGraph", "Operation graph must be acyclic");
  const referencedPortions = new Set(recipe.operationGraph.nodes.flatMap((node) => node.inputPortionIds));
  for (const portionId of portionIds) {
    if (!referencedPortions.has(portionId)) {
      const pendingCode = `portion:${portionId}:source-step`;
      if (recipe.eligibility === "exportable" || !recipe.authoring.unresolvedMappings.includes(pendingCode)) {
        report("missing-reference", recipe.recipeId, `ingredientPortions.${portionId}`, "Every ingredient portion must enter at least one operation or carry an explicit draft mapping blocker");
      }
    }
  }
  validateSimulationProfile(recipe, operationById, report);
  validateNutrition(recipe, ingredientById, context.nutritionDataset, report);
  validateScenarios(recipe, nodeById, portionIds, ingredientById, operationById, report);
  validateDeclaredRightsReferences(recipe, context, report);
  if (recipe.eligibility === "exportable") validateRightsAndGovernance(recipe, allRecipes, context, report);
}

function validateNormalizationTrace(
  recipe: GameRecipeV1,
  context: GameRecipeValidationContext,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
): void {
  const trace = recipe.authoring.normalizationTrace;
  if (recipe.authoring.method === "deterministic-migration") {
    if (trace) report("invalid-schema", recipe.recipeId, "authoring.normalizationTrace", "Migrated Web drafts must not claim source normalization trace");
    return;
  }
  if (!trace) {
    if (recipe.eligibility === "exportable") {
      report("missing-reference", recipe.recipeId, "authoring.normalizationTrace", "Exportable source-normalized recipes require a complete normalization trace");
    }
    return;
  }
  const registry = context.normalizationRegistry;
  const bundle = context.sourceFactBundles?.find((entry) => entry.bundleId === trace.sourceFactBundleId);
  if (!registry) {
    report("missing-reference", recipe.recipeId, "authoring.normalizationTrace.normalizationPolicyVersion", "Normalization registry is missing from validation context");
    return;
  }
  if (!bundle) {
    report("missing-reference", recipe.recipeId, "authoring.normalizationTrace.sourceFactBundleId", `Missing source fact bundle ${trace.sourceFactBundleId}`);
    return;
  }
  if (trace.sourceFactBundleVersion !== bundle.bundleVersion) {
    report("stale-artifact-version", recipe.recipeId, "authoring.normalizationTrace.sourceFactBundleVersion", "Source fact bundle version is stale");
  }
  if (trace.normalizationPolicyVersion !== registry.policyVersion) {
    report("stale-artifact-version", recipe.recipeId, "authoring.normalizationTrace.normalizationPolicyVersion", "Normalization policy version is stale");
  }
  for (const issue of evaluateGameSourceFactBundle(bundle, registry)) {
    report("invalid-schema", recipe.recipeId, `sourceFactBundle.${issue.field}`, `${issue.code}: ${issue.message}`);
  }
  if (bundle.status !== "normalization-ready") {
    report("invalid-schema", recipe.recipeId, "authoring.normalizationTrace.sourceFactBundleId", "Source-normalized recipes require a normalization-ready fact bundle");
  }
  const checks: Array<[keyof typeof trace, readonly string[], Set<string>]> = [
    ["ingredientResolutionIds", trace.ingredientResolutionIds, new Set(registry.ingredientAliases.map((entry) => entry.resolutionId))],
    ["operationRuleIds", trace.operationRuleIds, new Set(registry.operationRules.map((entry) => entry.ruleId))],
    ["equipmentRuleIds", trace.equipmentRuleIds, new Set(registry.equipmentRules.map((entry) => entry.ruleId))],
    ["heatDescriptorIds", trace.heatDescriptorIds, new Set(registry.heatDescriptors.map((entry) => entry.descriptorId))],
    ["targetStateRuleIds", trace.targetStateRuleIds, new Set(registry.targetStateRules.map((entry) => entry.ruleId))],
    ["mutationRuleIds", trace.mutationRuleIds, new Set(registry.mutationRules.map((entry) => entry.ruleId))],
  ];
  for (const [field, ids, knownIds] of checks) {
    if (new Set(ids).size !== ids.length) report("duplicate-id", recipe.recipeId, `authoring.normalizationTrace.${field}`, "Normalization trace IDs must be unique");
    for (const id of ids) if (!knownIds.has(id)) report("missing-reference", recipe.recipeId, `authoring.normalizationTrace.${field}`, `Unknown normalization rule ${id}`);
  }
  if (!trace.ingredientResolutionIds.length || !trace.operationRuleIds.length || !trace.targetStateRuleIds.length || !trace.mutationRuleIds.length) {
    report("missing-reference", recipe.recipeId, "authoring.normalizationTrace", "Normalization trace must cover ingredients, operations, target states and mutations");
  }
}

function validateOperationContract(
  recipe: GameRecipeV1,
  node: GameRecipeV1["operationGraph"]["nodes"][number],
  definition: GameOperationDefinitionV1,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const check = (suffix: string, valid: boolean, message: string) => {
    if (valid) return;
    const blocker = `operation:${node.nodeId}:${suffix}`;
    if (recipe.eligibility === "draft" && recipe.authoring.unresolvedMappings.includes(blocker)) return;
    report("invalid-operation", recipe.recipeId, `operationGraph.${node.nodeId}.${suffix}`, message);
  };
  check("inputs", definition.inputRequirement === "none" || node.inputPortionIds.length > 0, "Operation requires at least one explicit ingredient input");
  check(
    "equipment",
    !definition.equipmentRequired || Boolean(node.equipmentId && definition.compatibleEquipmentIds.includes(node.equipmentId)),
    "Operation requires equipment declared compatible by the versioned operation catalog",
  );
  check(
    "parameters",
    definition.requiredParameterGroups.every((group) => group.some((key) => node.parameters[key] !== undefined)),
    "Operation is missing a required parameter group",
  );
  const durationValid = definition.durationRequirement === "none"
    || (definition.durationRequirement === "active" && node.activeDurationMs > 0)
    || (definition.durationRequirement === "wait" && node.waitDurationMs > 0)
    || (definition.durationRequirement === "either" && node.activeDurationMs + node.waitDurationMs > 0);
  check("duration", durationValid, `Operation requires ${definition.durationRequirement} duration`);
  check("targets", !definition.targetStateRequired || node.targetStates.length > 0, "Operation requires at least one bounded target state");
}

function validateTargetStates(
  recipe: GameRecipeV1,
  node: GameRecipeV1["operationGraph"]["nodes"][number],
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const dimensions = new Set<string>();
  const allowedDimensions = allowedTargetDimensions(node.operationType);
  for (const target of node.targetStates) {
    const field = `operationGraph.${node.nodeId}.targetStates.${target.dimension}`;
    if (dimensions.has(target.dimension)) report("duplicate-id", recipe.recipeId, field, "Target state dimensions must be unique per operation");
    dimensions.add(target.dimension);
    if (!allowedDimensions.has(target.dimension)) {
      report("invalid-operation", recipe.recipeId, field, `Target dimension ${target.dimension} is not meaningful for ${node.operationType}`);
    }
    if (target.minimum === undefined && target.maximum === undefined) {
      report("invalid-operation", recipe.recipeId, field, "Target state requires a minimum or maximum bound");
      continue;
    }
    if (target.minimum !== undefined && (!Number.isFinite(target.minimum) || target.minimum < 0 || target.minimum > 1)) {
      report("invalid-number", recipe.recipeId, `${field}.minimum`, "Normalized target minimum must be within [0, 1]");
    }
    if (target.maximum !== undefined && (!Number.isFinite(target.maximum) || target.maximum < 0 || target.maximum > 1)) {
      report("invalid-number", recipe.recipeId, `${field}.maximum`, "Normalized target maximum must be within [0, 1]");
    }
    if (target.minimum !== undefined && target.maximum !== undefined && target.minimum > target.maximum) {
      report("invalid-number", recipe.recipeId, field, "Target state minimum cannot exceed maximum");
    }
  }
}

function validateDeclaredRightsReferences(
  recipe: GameRecipeV1,
  context: GameRecipeValidationContext,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const declaredIds = [
    ...recipe.rights.artifactIds,
    ...recipe.rights.usageDecisionIds,
    ...recipe.rights.sourceIds,
    ...recipe.rights.evidenceIds,
    ...recipe.governance.reviewAttestationIds,
    ...(recipe.governance.riskClassificationId ? [recipe.governance.riskClassificationId] : []),
    ...(recipe.governance.samplingBatchId ? [recipe.governance.samplingBatchId] : []),
  ];
  if (!declaredIds.length) return;
  const registry = context.rightsRegistry;
  if (!registry) {
    report("missing-reference", recipe.recipeId, "rights", "Declared rights or governance references require the isolated game registry");
    return;
  }
  const checks: Array<[readonly string[], ReadonlySet<string>, string]> = [
    [recipe.rights.artifactIds, new Set(registry.artifacts.map((entry) => entry.id)), "rights.artifactIds"],
    [recipe.rights.usageDecisionIds, new Set(registry.decisions.map((entry) => entry.id)), "rights.usageDecisionIds"],
    [recipe.rights.sourceIds, new Set(registry.sources.map((entry) => entry.id)), "rights.sourceIds"],
    [recipe.rights.evidenceIds, new Set(registry.evidence.map((entry) => entry.id)), "rights.evidenceIds"],
    [recipe.governance.reviewAttestationIds, new Set(registry.governance.attestations.map((entry) => entry.id)), "governance.reviewAttestationIds"],
  ];
  if (recipe.governance.riskClassificationId) {
    checks.push([[recipe.governance.riskClassificationId], new Set(registry.governance.riskClassifications.map((entry) => entry.id)), "governance.riskClassificationId"]);
  }
  if (recipe.governance.samplingBatchId) {
    checks.push([[recipe.governance.samplingBatchId], new Set(registry.governance.samplingBatches.map((entry) => entry.id)), "governance.samplingBatchId"]);
  }
  for (const [ids, available, field] of checks) {
    for (const id of ids) {
      if (!available.has(id)) report("missing-reference", recipe.recipeId, field, `Declared reference ${id} does not resolve`);
    }
  }
}

function validateSimulationProfile(
  recipe: GameRecipeV1,
  operationById: ReadonlyMap<string, GameOperationDefinitionV1>,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const compatibilities = recipe.operationGraph.nodes.map((node) => operationById.get(node.operationType)?.compatibility);
  const requiresV2 = compatibilities.includes("requires-engine-v2");
  const onlyPresentation = compatibilities.every((compatibility) => compatibility === "presentation-only");
  if (recipe.simulationProfile === "cat-kitchen-goal1-v1" && requiresV2) {
    report("invalid-operation", recipe.recipeId, "simulationProfile", "A goal1 profile cannot silently contain engine-v2 operations");
  }
  if (recipe.simulationProfile === "data-only" && !onlyPresentation) {
    report("invalid-operation", recipe.recipeId, "simulationProfile", "Data-only is reserved for presentation-only recipes");
  }
  if (recipe.simulationProfile === "requires-cat-kitchen-v2" && !requiresV2) {
    report("invalid-operation", recipe.recipeId, "simulationProfile", "Engine-v2 profile requires at least one engine-v2 operation");
  }
}

function validateNutrition(
  recipe: GameRecipeV1,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
  nutritionDataset: GameNutritionDatasetSubsetV1 | undefined,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  if (recipe.eligibility === "exportable" && !nutritionDataset) {
    report("invalid-nutrition", recipe.recipeId, "nutritionDataset", "Exportable recipes require the versioned USDA subset used by the ingredient catalog");
  }
  const uniqueIngredientIds = [...new Set(recipe.ingredientPortions.map((portion) => portion.ingredientId))];
  if (recipe.nutritionProfile.servings !== recipe.servings || recipe.nutritionProfile.provenance.length !== uniqueIngredientIds.length) {
    report("invalid-nutrition", recipe.recipeId, "nutritionProfile", "Nutrition servings and per-ingredient provenance must match the recipe");
  }
  const provenanceByIngredient = new Map(recipe.nutritionProfile.provenance.map((entry) => [entry.ingredientId, entry]));
  if (provenanceByIngredient.size !== recipe.nutritionProfile.provenance.length) {
    report("invalid-nutrition", recipe.recipeId, "nutritionProfile.provenance", "Nutrition provenance requires exactly one unique record per ingredient");
  }
  let expectedTotal = zeroNutrition();
  for (const portion of recipe.ingredientPortions) {
    const ingredient = ingredientById.get(portion.ingredientId);
    if (ingredient) expectedTotal = addNutrition(expectedTotal, scaleNutrition(ingredient.nutritionPer100g, portion.massG / 100));
  }
  for (const ingredientId of uniqueIngredientIds) {
    const provenance = provenanceByIngredient.get(ingredientId);
    const ingredient = ingredientById.get(ingredientId);
    if (!provenance || !ingredient) continue;
    if (
      provenance.nutritionProvenanceId !== ingredient.nutritionProvenanceId
    ) {
      report("invalid-nutrition", recipe.recipeId, `nutritionProfile.provenance.${ingredientId}`, "Recipe nutrition provenance must match the ingredient catalog");
    }
    if (recipe.eligibility === "exportable" && (
      ingredient.nutritionSource.kind !== "dataset"
      || provenance.provider !== "USDA FoodData Central"
      || provenance.datasetVersion !== ingredient.nutritionSource.datasetVersion
      || provenance.upstreamRecordId !== ingredient.nutritionSource.fdcId
      || provenance.accessedAt !== ingredient.nutritionSource.accessedAt
      || provenance.ingredientState !== ingredient.defaultState
      || recipe.ingredientPortions.some((portion) => portion.ingredientId === ingredientId && portion.initialState !== provenance.ingredientState)
      || provenance.conversionMethod !== "massG / 100 × versioned USDA per-100g record; ingredient-sum-v1; rounded to 6 decimals"
      || provenance.yieldFactor !== 1
      || provenance.retentionFactor !== 1
    )) {
      report("invalid-nutrition", recipe.recipeId, `nutritionProfile.provenance.${ingredientId}`, "Exportable ingredient-sum-v1 recipes require an exact USDA record/state/date conversion and neutral yield/retention factors");
    }
    if (!isPositive(provenance.yieldFactor) || !isPositive(provenance.retentionFactor) || !isIsoDate(provenance.accessedAt)) {
      report("invalid-nutrition", recipe.recipeId, `nutritionProfile.provenance.${ingredientId}.factors`, "Nutrition provenance requires positive factors and an access date");
    }
  }
  for (const [group, nutrition] of [["total", recipe.nutritionProfile.total], ["perServing", recipe.nutritionProfile.perServing]] as const) {
    for (const key of nutritionKeys) {
      if (!isNonNegative(nutrition[key])) report("invalid-nutrition", recipe.recipeId, `nutritionProfile.${group}.${key}`, "Nutrition values must be non-negative finite numbers");
    }
  }
  if (!nutritionEqual(recipe.nutritionProfile.total, expectedTotal, 0.011)) {
    report("invalid-nutrition", recipe.recipeId, "nutritionProfile.total", "Total nutrition must equal the ingredient catalog calculation");
  }
  if (!nutritionEqual(recipe.nutritionProfile.perServing, scaleNutrition(recipe.nutritionProfile.total, 1 / recipe.servings), 0.011)) {
    report("invalid-nutrition", recipe.recipeId, "nutritionProfile.perServing", "Per-serving nutrition must equal total divided by servings");
  }
}

function validateNutritionDataset(
  dataset: GameNutritionDatasetSubsetV1,
  ingredients: GameIngredientCatalogV1,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  if (
    dataset.schemaVersion !== "cooking-lab-usda-subset-v1"
    || dataset.provider !== "USDA FoodData Central"
    || dataset.licenseId !== "CC0-1.0"
    || !/^https:\/\/fdc\.nal\.usda\.gov\//.test(dataset.sourceUrl)
  ) {
    report("invalid-nutrition", "nutrition-dataset", "identity", "USDA subset identity, source and CC0 declaration must match the approved provider");
  }
  const archiveKeys = new Set<string>();
  for (const archive of dataset.upstreamArchives) {
    const key = `${archive.dataType}:${archive.datasetVersion}`;
    if (
      archiveKeys.has(key)
      || !/^https:\/\/fdc\.nal\.usda\.gov\//.test(archive.url)
      || !/^[0-9a-f]{64}$/i.test(archive.sha256)
      || !archive.datasetVersion.trim()
    ) {
      report("invalid-nutrition", "nutrition-dataset", "upstreamArchives", "Each USDA release requires a unique official URL, version and SHA-256 archive identity");
    }
    archiveKeys.add(key);
  }
  if (!dataset.upstreamArchives.length) {
    report("invalid-nutrition", "nutrition-dataset", "upstreamArchives", "USDA subset requires hashed upstream archive provenance");
  }
  reportDuplicates(dataset.records, (entry) => entry.ingredientId, "nutrition-dataset", "records.ingredientId", report);
  reportDuplicates(dataset.records, (entry) => entry.fdcId, "nutrition-dataset", "records.fdcId", report);
  const recordsByIngredient = new Map(dataset.records.map((entry) => [entry.ingredientId, entry]));
  const datasetIngredients = ingredients.ingredients.filter((ingredient) => ingredient.nutritionSource.kind === "dataset");
  for (const ingredient of datasetIngredients) {
    const record = recordsByIngredient.get(ingredient.ingredientId);
    if (!record || ingredient.nutritionSource.kind !== "dataset") {
      report("invalid-nutrition", ingredient.ingredientId, "nutritionDataset", "Dataset-backed ingredient is missing from the committed USDA subset");
      continue;
    }
    if (
      record.fdcId !== ingredient.nutritionSource.fdcId
      || record.datasetVersion !== ingredient.nutritionSource.datasetVersion
      || record.sourceDescription !== ingredient.nutritionSource.sourceDescription
      || record.accessedAt !== ingredient.nutritionSource.accessedAt
      || !nutritionEqual(record.nutritionPer100g, ingredient.nutritionPer100g, 0)
    ) {
      report("invalid-nutrition", ingredient.ingredientId, "nutritionDataset", "Ingredient catalog must exactly match its committed USDA subset record");
    }
  }
  const datasetIngredientIds = new Set(datasetIngredients.map((ingredient) => ingredient.ingredientId));
  for (const record of dataset.records) {
    if (!archiveKeys.has(`${record.dataType}:${record.datasetVersion}`)) {
      report("invalid-nutrition", record.ingredientId, "nutritionDataset.datasetVersion", "USDA subset record must resolve to a hashed upstream archive release");
    }
    if (!datasetIngredientIds.has(record.ingredientId)) {
      report("invalid-nutrition", record.ingredientId, "nutritionDataset", "Committed USDA subset record has no matching dataset-backed ingredient");
    }
    if (!/^\d+$/.test(record.fdcId) || !record.datasetVersion.trim() || !record.sourceDescription.trim() || !isIsoDate(record.accessedAt)) {
      report("invalid-nutrition", record.ingredientId, "nutritionDataset", "USDA subset records require fdcId, dataset version, description and access date");
    }
    for (const key of nutritionKeys) {
      if (!isNonNegative(record.nutritionPer100g[key])) {
        report("invalid-nutrition", record.ingredientId, `nutritionDataset.nutritionPer100g.${key}`, "USDA subset nutrition values must be non-negative finite numbers");
      }
    }
  }
}

function validateRightsAndGovernance(
  recipe: GameRecipeV1,
  allRecipes: readonly GameRecipeV1[],
  context: GameRecipeValidationContext,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const registry = context.rightsRegistry;
  if (!registry) {
    report("invalid-rights", recipe.recipeId, "rightsRegistry", "Exportable recipes require the isolated game rights registry");
    return;
  }
  if (registry.schemaVersion !== "cooking-lab-game-rights-v1") {
    report("invalid-schema", recipe.recipeId, "rightsRegistry.schemaVersion", "Unsupported game rights registry schema");
  }
  const artifacts = recipe.rights.artifactIds
    .map((id) => registry.artifacts.find((artifact) => artifact.id === id))
    .filter((artifact): artifact is ContentArtifact => Boolean(artifact));
  if (new Set(recipe.rights.artifactIds).size !== 4 || artifacts.length !== 4) {
    report("invalid-rights", recipe.recipeId, "rights.artifactIds", "Exactly four existing rights artifacts are required");
  }
  const kinds = artifacts.map((artifact) => artifact.kind).sort();
  if (kinds.join(",") !== [...requiredArtifactKinds].sort().join(",")) {
    report("invalid-rights", recipe.recipeId, "rights.artifactIds", "Rights artifacts must be exactly identity, preparation, nutrition and simulation");
  }
  const sourceById = new Map(registry.sources.map((source) => [source.id, source]));
  const recipeSourceRolesById = new Map(registry.sourceRoles
    .filter((entry) => entry.recipeId === recipe.recipeId)
    .map((entry) => [entry.sourceId, entry]));
  const evidenceById = new Map(registry.evidence.map((evidence) => [evidence.id, evidence]));
  const evidenceOriginById = new Map(registry.evidenceOrigins.map((entry) => [entry.evidenceId, entry.origin]));
  const assessmentById = new Map(registry.assessments.map((assessment) => [assessment.id, assessment]));
  const attributionById = new Map(registry.attributions.map((entry) => [entry.id, entry]));
  const decisions = recipe.rights.usageDecisionIds
    .map((id) => registry.decisions.find((decision) => decision.id === id))
    .filter((decision): decision is GameRightsRegistryV1["decisions"][number] => Boolean(decision));
  if (new Set(recipe.rights.usageDecisionIds).size !== 4 || decisions.length !== 4) {
    report("invalid-rights", recipe.recipeId, "rights.usageDecisionIds", "Exactly four existing usage decisions are required");
  }
  if (recipe.rights.intendedUse !== "game-commercial-ready") {
    report("invalid-rights", recipe.recipeId, "rights.intendedUse", "Game recipes require the game-commercial-ready intended use");
  }
  for (const artifact of artifacts) {
    if (artifact.subject.type !== "game-recipe" || artifact.subject.id !== recipe.recipeId || artifact.version !== recipe.artifactVersion) {
      report("invalid-rights", recipe.recipeId, `artifact.${artifact.id}`, "Game artifact subject and version must match the recipe fingerprint");
    }
    if (artifact.derivation === "generated") {
      report("invalid-rights", recipe.recipeId, `artifact.${artifact.id}.derivation`, "Generated expression is not permitted in the deterministic game corpus");
    }
    const decision = registry.decisions.find((entry) => entry.id === artifact.usageDecisionId);
    if (!decision || !recipe.rights.usageDecisionIds.includes(artifact.usageDecisionId)) {
      report("missing-reference", recipe.recipeId, `artifact.${artifact.id}.usageDecisionId`, "Artifact decision must be included by the recipe");
      continue;
    }
    const artifactAssessment = assessmentById.get(artifact.rightsAssessmentId);
    if (!artifactAssessment || artifactAssessment.subject.type !== "artifact" || artifactAssessment.subject.id !== artifact.id) {
      report("invalid-rights", recipe.recipeId, `artifact.${artifact.id}.rightsAssessmentId`, "Artifact rightsAssessmentId must resolve to an assessment of that exact artifact");
    }
    if (decision.artifactId !== artifact.id || decision.intendedUse !== "game-commercial-ready" || !["allow", "allow-with-obligations"].includes(decision.decision)) {
      report("invalid-rights", recipe.recipeId, `decision.${decision.id}`, "UsageDecision must allow the exact game artifact for commercial use");
    }
    if (!decision.reviewer.trim() || !isIsoDate(decision.decidedAt)) {
      report("invalid-rights", recipe.recipeId, `decision.${decision.id}.review`, "UsageDecision requires an identified reviewer and valid decision date");
    }
    if (!decision.assessmentIds.includes(artifact.rightsAssessmentId)) {
      report("missing-reference", recipe.recipeId, `decision.${decision.id}.assessmentIds`, "UsageDecision must include the artifact assessment");
    }
    for (const sourceId of artifact.sourceIds) {
      if (!recipe.rights.sourceIds.includes(sourceId)) {
        report("missing-reference", recipe.recipeId, `artifact.${artifact.id}.sourceIds`, "Artifact sources must be included to the recipe rights summary");
      }
      const sourceAssessment = registry.assessments.find((assessment) => assessment.subject.type === "source" && assessment.subject.id === sourceId);
      if (!sourceAssessment || !decision.assessmentIds.includes(sourceAssessment.id)) {
        report("missing-reference", recipe.recipeId, `decision.${decision.id}.assessmentIds`, `Missing assessment bound to source ${sourceId}`);
      }
    }
    for (const evidenceId of artifact.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!recipe.rights.evidenceIds.includes(evidenceId) || !evidence || !artifact.sourceIds.includes(evidence.sourceId) || evidenceOriginById.get(evidenceId) !== "source-record") {
        report("invalid-rights", recipe.recipeId, `artifact.${artifact.id}.evidenceIds`, "Artifact Evidence must be declared by the recipe, resolve to an artifact source and originate from a source record");
      }
    }
    for (const assessmentId of decision.assessmentIds) {
      const assessment = assessmentById.get(assessmentId);
      if (!assessment) {
        report("missing-reference", recipe.recipeId, `decision.${decision.id}.assessmentIds`, `Missing assessment ${assessmentId}`);
      } else {
        validateAssessment(recipe.recipeId, artifact, assessment, context.now, report);
        for (const attributionId of assessment.attributionRequirementIds) {
          const attribution = attributionById.get(attributionId);
          if (!attribution || attribution.artifactId !== artifact.id || !artifact.attributionRequirementIds.includes(attributionId)) {
            report("invalid-rights", recipe.recipeId, `assessment.${assessment.id}.attributionRequirementIds`, "Every assessment obligation must resolve on the reviewed artifact");
          }
        }
      }
    }
    const hasObligations = decision.assessmentIds.some((assessmentId) => {
      const assessment = assessmentById.get(assessmentId);
      return assessment && rightsActions.some((action) => assessment.permissions[action].status === "allowed-with-obligations");
    });
    if (hasObligations && (decision.decision !== "allow-with-obligations" || !decision.conditions.length)) {
      report("invalid-rights", recipe.recipeId, `decision.${decision.id}.conditions`, "Allowed-with-obligations assessments require an explicit decision and conditions");
    }
    for (const attributionId of artifact.attributionRequirementIds) {
      const attribution = attributionById.get(attributionId);
      if (!attribution || attribution.artifactId !== artifact.id || !attribution.notice.trim()) {
        report("invalid-rights", recipe.recipeId, `artifact.${artifact.id}.attributionRequirementIds`, "Attribution must exist and identify the artifact");
      } else if (attribution.shareAlikeRequired) {
        report("invalid-rights", recipe.recipeId, `attribution.${attribution.id}`, "ShareAlike material is excluded from the core game corpus");
      }
    }
    for (const sourceId of artifact.sourceIds) {
      const source = sourceById.get(sourceId);
      if (source?.rights.status === "open-license" && /^(?:CC-BY-(?:3\.0|4\.0)|OGL-3\.0)$/.test(source.rights.licenseId)) {
        const openRights = source.rights;
        const sourceLicenseId = openRights.licenseId;
        const satisfiesAttribution = artifact.attributionRequirementIds.some((attributionId) => {
          const attribution = attributionById.get(attributionId);
          return attribution?.artifactId === artifact.id
            && attribution.licenseId === sourceLicenseId
            && attribution.licenseUrl === openRights.licenseUrl
            && attribution.creator.trim().length > 0
            && attribution.workTitle.trim().length > 0
            && attribution.sourceUrl.trim().length > 0
            && attribution.notice.trim().length > 0
            && (openRights.adaptationStatus !== "adapted" || Boolean(attribution.modificationNotice?.trim()));
        });
        if (!satisfiesAttribution) {
          report("invalid-rights", recipe.recipeId, `artifact.${artifact.id}.attributionRequirementIds`, `Attributed open-license source ${sourceId} requires complete artifact attribution`);
        }
      }
    }
  }
  if (new Set(recipe.rights.sourceIds).size < 2) {
    report("invalid-rights", recipe.recipeId, "rights.sourceIds", "Exportable recipes require at least two independent sources");
  }
  const institutions = new Set<string>();
  for (const sourceId of recipe.rights.sourceIds) {
    const source = sourceById.get(sourceId);
    if (!source) {
      report("missing-reference", recipe.recipeId, "rights.sourceIds", `Missing source ${sourceId}`);
      continue;
    }
    institutions.add(source.publisherOrInstitution.trim().toLowerCase());
    if (source.health.status !== "active" || source.rights.status === "unknown") {
      report("invalid-rights", recipe.recipeId, `source.${sourceId}`, "Unknown or changed source rights block export");
    }
    if (source.rights.status === "open-license" && /(?:^|[- ])(?:nc|nd)(?:$|[- ])/i.test(source.rights.licenseId)) {
      report("invalid-rights", recipe.recipeId, `source.${sourceId}.rights`, "NC and ND licenses block commercial game export");
    }
    if (source.rights.status === "open-license") {
      const allowedLicenses = new Set(["CC0-1.0", "CC-BY-3.0", "CC-BY-4.0", "OGL-3.0"]);
      if (!allowedLicenses.has(source.rights.licenseId)) {
        report("invalid-rights", recipe.recipeId, `source.${sourceId}.rights.licenseId`, "Open-license sources must use a policy-approved commercial license");
      }
      if (source.rights.shareAlikeRequired) {
        report("invalid-rights", recipe.recipeId, `source.${sourceId}.rights.shareAlikeRequired`, "ShareAlike sources are excluded from the core game corpus");
      }
    }
    const sourceAssessment = registry.assessments.find((assessment) => assessment.subject.type === "source" && assessment.subject.id === sourceId);
    if (sourceAssessment && !assessmentMatchesSourceRights(sourceAssessment, source)) {
      report("invalid-rights", recipe.recipeId, `source.${sourceId}.rightsAssessment`, "Source rights and its assessment basis must identify the same rights route and authority");
    }
  }
  void institutions;
  for (const evidenceId of recipe.rights.evidenceIds) {
    const evidence = evidenceById.get(evidenceId);
    if (!evidence || !recipe.rights.sourceIds.includes(evidence.sourceId)) {
      report("missing-reference", recipe.recipeId, "rights.evidenceIds", `Evidence ${evidenceId} must resolve to an included source`);
    }
    if (evidenceOriginById.get(evidenceId) !== "source-record") {
      report("invalid-rights", recipe.recipeId, `evidence.${evidenceId}`, "AI output or unknown-origin material cannot be Evidence");
    }
  }
  if (!recipe.rights.evidenceIds.length) report("invalid-rights", recipe.recipeId, "rights.evidenceIds", "Exportable recipes require structured Evidence");
  const researchRecord = registry.researchRecords.find((record) => record.subject.type === "game-recipe" && record.subject.id === recipe.recipeId);
  if (!researchRecord || researchRecord.status !== "closed" || researchRecord.unresolvedQuestions.length) {
    report("invalid-rights", recipe.recipeId, "researchRecord", "A closed game-specific ResearchRecord with no unresolved questions is required");
  } else {
    const researchIssues = validateResearchRegistry({
      sources: registry.sources,
      evidence: registry.evidence,
      records: [researchRecord],
    });
    for (const issue of researchIssues) {
      report("invalid-rights", recipe.recipeId, `researchRecord.${issue.field}`, issue.message);
    }
    const acceptedSourceIds = new Set(researchRecord.sourceDecisions.flatMap((decision) => decision.disposition === "accepted" ? [decision.sourceId] : []));
    if (recipe.rights.sourceIds.some((sourceId) => !acceptedSourceIds.has(sourceId))) {
      report("invalid-rights", recipe.recipeId, "researchRecord.sourceDecisions", "Every recipe source must be accepted by the game-specific ResearchRecord");
    }
    const includedClaimEvidenceIds = new Set(researchRecord.claims
      .filter((claim) => claim.disposition === "include")
      .flatMap((claim) => claim.evidenceIds));
    const acceptedUsesBySource = new Map(researchRecord.sourceDecisions.flatMap((decision) =>
      decision.disposition === "accepted" ? [[decision.sourceId, new Set(decision.uses)] as const] : []));
    const materialSourceIds = new Set<string>();
    const materialRoles = new Set<string>();
    const materialWorkFamilies = new Set<string>();
    const preparationArtifact = artifacts.find((artifact) => artifact.kind === "preparation");
    for (const evidenceId of preparationArtifact?.evidenceIds ?? []) {
      const evidence = evidenceById.get(evidenceId);
      const sourceRole = evidence ? recipeSourceRolesById.get(evidence.sourceId) : undefined;
      if (!evidence || evidence.relation !== "supports" || !includedClaimEvidenceIds.has(evidenceId) || !acceptedUsesBySource.get(evidence.sourceId)?.has("preparation") || !sourceRole || !["recipe-primary", "recipe-cross-check"].includes(sourceRole.role)) continue;
      materialSourceIds.add(evidence.sourceId);
      materialRoles.add(sourceRole.role);
      if (sourceRole.workFamilyId) materialWorkFamilies.add(sourceRole.workFamilyId);
    }
    if (materialSourceIds.size < 2 || materialWorkFamilies.size < 2 || !materialRoles.has("recipe-primary") || !materialRoles.has("recipe-cross-check")) {
      report("invalid-rights", recipe.recipeId, "rights.materialSourceCoverage", "Preparation requires included claim-level Evidence from distinct primary and cross-check recipe work families; identity-only, nutrition and safety sources do not count");
    }
    for (const artifact of artifacts) {
      if (!["identity", "preparation", "nutrition", "simulation"].includes(artifact.kind)) continue;
      const requiredUse = artifact.kind as "identity" | "preparation" | "nutrition" | "simulation";
      const covered = artifact.evidenceIds.some((evidenceId) => {
        const evidence = evidenceById.get(evidenceId);
        return Boolean(
          evidence
          && includedClaimEvidenceIds.has(evidenceId)
          && acceptedUsesBySource.get(evidence.sourceId)?.has(requiredUse),
        );
      });
      if (!covered) {
        report("invalid-rights", recipe.recipeId, `artifact.${artifact.id}.evidenceIds`, `The ${requiredUse} artifact requires included claim-level Evidence from a source accepted for ${requiredUse}`);
      }
    }
  }
  validateGovernance(recipe, allRecipes, context, registry, report);
}

function validateAssessment(
  recipeId: string,
  artifact: ContentArtifact,
  assessment: RightsAssessment,
  now: string,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const exactArtifactAssessment = assessment.id === artifact.rightsAssessmentId
    && assessment.subject.type === "artifact"
    && assessment.subject.id === artifact.id;
  const exactSourceAssessment = assessment.subject.type === "source"
    && artifact.sourceIds.includes(assessment.subject.id);
  if (!exactArtifactAssessment && !exactSourceAssessment) {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.subject`, "Assessment must identify the exact artifact or one of its exact sources");
  }
  if (assessment.jurisdictionBaseline.join(",") !== "CN,US,EU,UK" || assessment.applicableTerritories.join(",") !== "CN,US,EU,UK") {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.jurisdictionBaseline`, "Game rights require the CN/US/EU/UK baseline");
  }
  if (!assessment.authorityVersion.trim() || !isIsoDate(assessment.accessedAt) || !assessment.reviewer.trim()) {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.provenance`, "Assessment requires authority version, access date and identified reviewer");
  }
  if (!isCompleteAssessmentBasis(assessment.basis)) {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.basis`, "Assessment basis is incomplete or does not use an HTTPS authority URL");
  }
  if (!isIsoDate(assessment.assessedAt) || !assessment.reviewDueAt || !isIsoDate(assessment.reviewDueAt) || assessment.reviewDueAt < now) {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.review`, "Assessment must be current and have an unexpired review date");
  }
  if (assessment.uncertainty.trim()) report("invalid-rights", recipeId, `assessment.${assessment.id}.uncertainty`, "Unresolved rights uncertainty blocks export");
  for (const action of rightsActions) {
    if (!assessment.permissions[action].scope.trim()) {
      report("invalid-rights", recipeId, `assessment.${assessment.id}.permissions.${action}.scope`, "Each permission requires a non-empty scope");
    }
    if (!["allowed", "allowed-with-obligations"].includes(assessment.permissions[action].status)) {
      report("invalid-rights", recipeId, `assessment.${assessment.id}.permissions.${action}`, "All four game-use permissions must be allowed");
    }
  }
  for (const [risk, review] of Object.entries(assessment.risks)) {
    if (review.status === "review-required") report("invalid-rights", recipeId, `assessment.${assessment.id}.risks.${risk}`, "Unresolved rights risk blocks export");
  }
  if (assessment.basis.kind === "reference-only" && ["adaptation", "licensed-copy"].includes(artifact.derivation)) {
    report("invalid-rights", recipeId, `artifact.${artifact.id}.derivation`, "Reference-only sources cannot authorize copied or adapted expression");
  }
}

function validateGovernance(
  recipe: GameRecipeV1,
  allRecipes: readonly GameRecipeV1[],
  context: GameRecipeValidationContext,
  registry: GameRightsRegistryV1,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const classification = registry.governance.riskClassifications.find((entry) => entry.id === recipe.governance.riskClassificationId);
  if (!classification || classification.itemId !== recipe.recipeId || classification.level !== recipe.governance.riskLevel) {
    report("invalid-governance", recipe.recipeId, "governance.riskClassificationId", "Game risk classification must resolve to this recipe");
    return;
  }
  const currentVersion = createGameArtifactSetVersion([recipe], registry, context);
  if (
    classification.policyVersion !== registry.policyVersion
    || registry.governance.policyVersion !== registry.policyVersion
    || classification.artifactSetVersion !== currentVersion
    || !isIsoDate(classification.classifiedAt)
  ) {
    report("invalid-governance", recipe.recipeId, "governance.riskClassificationId", "Risk classification is stale for the current recipe and provenance fingerprint");
  }
  validateRiskClassification(recipe, classification, registry, report);
  if (classification.level === "high") {
    report("invalid-governance", recipe.recipeId, "governance.riskLevel", "HIGH risk content is excluded from automated game export");
  }
  const attestations = recipe.governance.reviewAttestationIds
    .map((id) => registry.governance.attestations.find((entry) => entry.id === id))
    .filter((entry): entry is ReviewAttestation => Boolean(entry));
  if (attestations.length !== recipe.governance.reviewAttestationIds.length || !attestations.length) {
    report("invalid-governance", recipe.recipeId, "governance.reviewAttestationIds", "All review attestation IDs must resolve");
  }
  const contextsByDimension = new Map<ReviewDimension, Set<string>>();
  for (const attestation of attestations) {
    const reviewedRecipes = allRecipes.filter((candidate) => attestation.itemIds.includes(candidate.recipeId));
    const expectedArtifactSetVersion = createGameArtifactSetVersion(reviewedRecipes, registry, context);
    if (
      !attestation.itemIds.includes(recipe.recipeId)
      || attestation.artifactSetVersion !== expectedArtifactSetVersion
      || attestation.verdict !== "pass"
      || attestation.policyVersion !== registry.policyVersion
      || !attestation.id.trim()
      || !attestation.batchId.trim()
      || !isGitCommit(attestation.reviewedCommit)
      || !attestation.evidenceReference.trim()
      || !attestation.rubricVersion.trim()
      || !isIsoDate(attestation.reviewedAt)
      || !completeActor(attestation.author)
      || !completeActor(attestation.reviewer)
    ) {
      report("invalid-governance", recipe.recipeId, `attestation.${attestation.id}`, "Attestation must PASS the current recipe artifact set");
    }
    if (!isIndependentAttestation(attestation)) {
      report("invalid-governance", recipe.recipeId, `attestation.${attestation.id}.independence`, "Author and reviewer must use distinct contexts; reviewer may not modify content or misrepresent review type");
    }
    if (attestation.findings.some((finding) => finding.disposition === "unresolved")) {
      report("invalid-governance", recipe.recipeId, `attestation.${attestation.id}.findings`, "A PASS attestation cannot contain unresolved findings");
    }
    const contexts = contextsByDimension.get(attestation.dimension) ?? new Set<string>();
    contexts.add(attestation.reviewer.contextId);
    contextsByDimension.set(attestation.dimension, contexts);
  }
  for (const dimension of requiredReviewDimensions) {
    if (!contextsByDimension.get(dimension)?.size) report("invalid-governance", recipe.recipeId, "governance.reviewAttestationIds", `Missing ${dimension} review`);
  }
  if (classification.level === "low") {
    const allContexts = new Set(attestations.map((attestation) => attestation.reviewer.contextId));
    const oneContextCoversAll = [...allContexts].some((contextId) => requiredReviewDimensions.every((dimension) => contextsByDimension.get(dimension)?.has(contextId)));
    if (!oneContextCoversAll) {
      report("invalid-governance", recipe.recipeId, "governance.reviewAttestationIds", "LOW risk content requires one independent reviewer context to PASS every applicable dimension");
    }
  }
  if (classification.level === "medium") {
    const rightsContexts = intersectSets(contextsByDimension.get("rights-license"), contextsByDimension.get("provenance"));
    const contentContexts = requiredReviewDimensions
      .filter((dimension) => !["rights-license", "provenance"].includes(dimension))
      .map((dimension) => contextsByDimension.get(dimension) ?? new Set<string>())
      .reduce(intersectSets);
    const separated = [...rightsContexts].some((rightsContext) => [...contentContexts].some((contentContext) => contentContext !== rightsContext));
    if (!separated) {
      report("invalid-governance", recipe.recipeId, "governance.reviewAttestationIds", "MEDIUM risk rights/provenance and culinary/editorial/visual reviews require separate contexts");
    }
  }
  const sampling = registry.governance.samplingBatches.find((entry) => entry.id === recipe.governance.samplingBatchId);
  if (!sampling || !sampling.itemIds.includes(recipe.recipeId)) {
    report("invalid-governance", recipe.recipeId, "governance.samplingBatchId", "A passing independent sampling QA batch covering the recipe is required");
  } else {
    validateSamplingBatch(sampling, allRecipes, registry, context, attestations, report);
  }
  validateSamplingHistory(recipe, allRecipes, registry, context, report);
}

export function deriveMinimumGamePublishingRisk(
  recipe: GameRecipeV1,
  registry: GameRightsRegistryV1,
): { level: PublishingRiskLevel; reasonCodes: PublishingRiskReasonCode[] } {
  const artifacts = registry.artifacts.filter((artifact) => recipe.rights.artifactIds.includes(artifact.id));
  const assessments = registry.assessments.filter((assessment) => artifacts.some((artifact) =>
    artifact.rightsAssessmentId === assessment.id
    || registry.decisions.find((decision) => decision.id === artifact.usageDecisionId)?.assessmentIds.includes(assessment.id)));
  const unresolvedDisagreement = registry.governance.attestations.some((attestation) =>
    attestation.itemIds.includes(recipe.recipeId)
    && attestation.findings.some((finding) => finding.kind === "reviewer-disagreement" && finding.disposition === "unresolved"));
  const safetyCritical = recipe.itemType === "alcoholic-drink"
    || recipe.operationGraph.nodes.some((node) => node.criticality === "safety" || node.operationType === "ferment");
  const unresolvedRights = assessments.some((assessment) =>
    assessment.uncertainty.trim()
    || Object.values(assessment.permissions).some((permission) => ["prohibited", "review-required"].includes(permission.status))
    || Object.values(assessment.risks).some((risk) => risk.status === "review-required"));
  const permissionGranted = registry.sources.some((source) => recipe.rights.sourceIds.includes(source.id) && source.rights.status === "permission-granted");
  if (unresolvedRights || unresolvedDisagreement || safetyCritical || permissionGranted) {
    return {
      level: "high",
      reasonCodes: [...new Set([
        ...(safetyCritical ? ["food-safety-critical-process" as const] : []),
        ...(unresolvedDisagreement ? ["unresolved-reviewer-disagreement" as const] : []),
        ...(unresolvedRights ? ["professional-legal-checkpoint" as const] : []),
        ...(permissionGranted ? ["professional-legal-checkpoint" as const] : []),
      ])],
    };
  }
  const expressiveAdaptation = artifacts.some((artifact) => ["adaptation", "licensed-copy"].includes(artifact.derivation));
  if (expressiveAdaptation) {
    return { level: "medium", reasonCodes: ["single-source-deep-adaptation"] };
  }
  return {
    level: "low",
    reasonCodes: ["clear-first-party-or-reference-only-rights", "approved-nutrition-or-cost-method"],
  };
}

export function deriveGameEquivalenceClassKeys(
  recipe: GameRecipeV1,
  registry: GameRightsRegistryV1,
): string[] {
  const sources = registry.sources.filter((source) => recipe.rights.sourceIds.includes(source.id));
  const domains = sources.flatMap((source) => source.locators.flatMap((locator) => {
    if (locator.kind !== "url") return [];
    try {
      return [new URL(locator.url).hostname.toLowerCase()];
    } catch {
      return ["invalid-url"];
    }
  }));
  const nutritionVersions = recipe.nutritionProfile.provenance.map((entry) => `${entry.provider}:${entry.datasetVersion}`);
  const operationTypes = recipe.operationGraph.nodes.map((node) => node.operationType);
  const mutationTypes = recipe.scenarios.map((scenario) => scenario.mutation.type);
  const ingredientStates = recipe.ingredientPortions.map((portion) => portion.initialState);
  const ingredientIds = new Set(recipe.ingredientPortions.map((portion) => portion.ingredientId));
  const acidAndDairy = [...ingredientIds].some((id) => /lemon|orange|pineapple|strawberry|raspberry/.test(id))
    && [...ingredientIds].some((id) => /milk|yogurt/.test(id));
  const highWaterFruit = [...ingredientIds].some((id) => /watermelon|strawberry|orange/.test(id));
  const trace = recipe.authoring.normalizationTrace;
  return [...new Set([
    `content-type:${recipe.itemType}`,
    `authoring:${recipe.authoring.method}:${recipe.authoring.generatorVersion}`,
    `ingredient-state-set:${[...new Set(ingredientStates)].sort().join("+")}`,
    `acid-dairy:${acidAndDairy ? "present" : "absent"}`,
    `high-water-fruit:${highWaterFruit ? "present" : "absent"}`,
    "image:not-applicable",
    "translation:not-applicable",
    ...nutritionVersions.map((version) => `nutrition:${version}`),
    ...operationTypes.map((operation) => `operation:${operation}`),
    ...mutationTypes.map((mutation) => `mutation:${mutation}`),
    ...(trace ? [
      `normalization-policy:${trace.normalizationPolicyVersion}`,
      ...trace.ingredientResolutionIds.map((id) => `ingredient-resolution:${id}`),
      ...trace.operationRuleIds.map((id) => `operation-rule:${id}`),
      ...trace.equipmentRuleIds.map((id) => `equipment-rule:${id}`),
      ...trace.heatDescriptorIds.map((id) => `heat-descriptor:${id}`),
      ...trace.targetStateRuleIds.map((id) => `target-state-rule:${id}`),
      ...trace.mutationRuleIds.map((id) => `mutation-rule:${id}`),
    ] : ["normalization-trace:not-applicable"]),
    ...sources.map((source) => `source-institution:${source.publisherOrInstitution.trim().toLowerCase()}`),
    ...sources.map((source) => `source-rights:${source.rights.status}:${"licenseId" in source.rights ? source.rights.licenseId : "reference-only"}`),
    ...domains.map((domain) => `source-domain:${domain}`),
  ])].sort();
}

function validateRiskClassification(
  recipe: GameRecipeV1,
  classification: PublishingRiskClassification,
  registry: GameRightsRegistryV1,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const minimum = deriveMinimumGamePublishingRisk(recipe, registry);
  if (riskRank[classification.level] < riskRank[minimum.level]) {
    report("invalid-governance", recipe.recipeId, "governance.riskLevel", `Declared ${classification.level} risk is below deterministic minimum ${minimum.level}`);
  }
  for (const reason of minimum.reasonCodes) {
    if (!classification.reasonCodes.includes(reason)) {
      report("invalid-governance", recipe.recipeId, "governance.riskClassificationId", `Risk classification is missing required reason ${reason}`);
    }
  }
  const reasonMinimum = classification.reasonCodes.some((reason) => highRiskReasons.has(reason))
    ? "high"
    : classification.reasonCodes.some((reason) => mediumRiskReasons.has(reason)) ? "medium" : "low";
  if (riskRank[classification.level] < riskRank[reasonMinimum]) {
    report("invalid-governance", recipe.recipeId, "governance.riskLevel", `Declared risk is below the ${reasonMinimum} level required by its own reasons`);
  }
  const expectedKeys = deriveGameEquivalenceClassKeys(recipe, registry);
  if (
    !classification.equivalenceClassKeys.length
    || [...classification.equivalenceClassKeys].sort().join("\0") !== expectedKeys.join("\0")
  ) {
    report("invalid-governance", recipe.recipeId, "governance.riskClassificationId", "Risk equivalence classes do not match current source, license, operation, nutrition and authoring paths");
  }
}

function validateSamplingBatch(
  batch: SamplingQaBatch,
  allRecipes: readonly GameRecipeV1[],
  registry: GameRightsRegistryV1,
  context: GameRecipeValidationContext,
  recipeAttestations: readonly ReviewAttestation[],
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const batchRecipes = allRecipes.filter((recipe) => batch.itemIds.includes(recipe.recipeId));
  const currentVersion = createGameArtifactSetVersion(batchRecipes, registry, context);
  const complete = batch.id.trim()
    && batch.batchId.trim()
    && batch.policyVersion === registry.policyVersion
    && isGitCommit(batch.reviewedCommit)
    && batch.evidenceReference.trim()
    && batch.rubricVersion.trim()
    && isIsoDate(batch.auditedAt)
    && completeActor(batch.author)
    && completeActor(batch.auditor)
    && batch.artifactSetVersion === currentVersion
    && batch.evidenceDigest === createSamplingBatchEvidenceDigest(batch);
  if (!complete || batchRecipes.length !== new Set(batch.itemIds).size || batchRecipes.some((recipe) => recipe.eligibility !== "exportable")) {
    report("invalid-governance", batch.id, "sampling", "Sampling QA identity, policy, commit, evidence digest, population and artifact fingerprint must be current");
  }
  const primaryReviewers = registry.governance.attestations.filter((attestation) =>
    attestation.itemIds.some((itemId) => batch.itemIds.includes(itemId)));
  if (
    !isIndependentActors(batch.author, batch.auditor)
    || batch.auditorModifiedContent
    || primaryReviewers.some((attestation) => !isIndependentActors(attestation.reviewer, batch.auditor))
    || recipeAttestations.some((attestation) => !isIndependentActors(attestation.reviewer, batch.auditor))
  ) {
    report("invalid-governance", batch.id, "sampling.independence", "Sampling auditor must be independent from the author and every primary reviewer context");
  }
  if (batch.verdict !== "pass" || [...batch.findings, ...batch.samples.flatMap((sample) => sample.findings)].some((finding) => finding.disposition === "unresolved")) {
    report("invalid-governance", batch.id, "sampling.findings", "Sampling QA must PASS without unresolved findings");
  }
  const sampledIds = new Set(batch.equivalenceClasses.flatMap((entry) => entry.sampledItemIds));
  const sampleById = new Map(batch.samples.map((sample) => [sample.itemId, sample]));
  if (
    sampleById.size !== batch.samples.length
    || sampledIds.size !== sampleById.size
    || [...sampledIds].some((itemId) => !sampleById.has(itemId))
  ) {
    report("invalid-governance", batch.id, "sampling.samples", "Sampling records must exactly match real sampled representatives");
  }
  const classifications = registry.governance.riskClassifications.filter((classification) => batch.itemIds.includes(classification.itemId));
  const seenKeys = new Set<string>();
  for (const equivalence of batch.equivalenceClasses) {
    const expectedMembers = classifications.filter((classification) => classification.equivalenceClassKeys.includes(equivalence.key)).map((classification) => classification.itemId).sort();
    const actualMembers = [...new Set(equivalence.itemIds)].sort();
    if (
      seenKeys.has(equivalence.key)
      || !equivalence.key.trim()
      || expectedMembers.join("\0") !== actualMembers.join("\0")
      || equivalence.sampledItemIds.some((itemId) => !actualMembers.includes(itemId))
    ) {
      report("invalid-governance", batch.id, "sampling.equivalenceClasses", `Sampling class ${equivalence.key || "unknown"} has invalid membership or representatives`);
    }
    seenKeys.add(equivalence.key);
  }
  const expectedKeys = new Set(classifications.flatMap((classification) => classification.equivalenceClassKeys));
  if ([...expectedKeys].some((key) => !seenKeys.has(key))) {
    report("invalid-governance", batch.id, "sampling.equivalenceClasses", "Sampling QA omits a current risk-equivalence class");
  }
  for (const sample of batch.samples) {
    const dimensions = new Set(sample.dimensions);
    if (
      !batch.itemIds.includes(sample.itemId)
      || sample.verdict !== "pass"
      || requiredReviewDimensions.some((dimension) => !dimensions.has(dimension))
      || dimensions.size !== requiredReviewDimensions.length
      || sample.equivalenceClassKeys.some((key) => !seenKeys.has(key))
      || sample.equivalenceClassKeys.some((key) => !batch.equivalenceClasses.some((entry) => entry.key === key && entry.sampledItemIds.includes(sample.itemId)))
    ) {
      report("invalid-governance", `${batch.id}:${sample.itemId}`, "sampling.samples", "Each sampled item requires a passing all-dimension record for current classes");
    }
  }
  const allFindings = [...batch.findings, ...batch.samples.flatMap((sample) => sample.findings)];
  const reworkItemIds = [...new Set(batch.samples.filter((sample) => sample.findings.some((finding) => finding.disposition === "resolved")).map((sample) => sample.itemId))].sort();
  const metricNumbers = [batch.metrics.escapeCount, batch.metrics.reviewerDisagreementCount, batch.metrics.reworkItemCount, batch.metrics.provenanceLicenseNoveltyCount];
  if (
    metricNumbers.some((value) => !Number.isInteger(value) || value < 0)
    || batch.metrics.escapeCount !== allFindings.filter((finding) => finding.severity === "major").length
    || batch.metrics.reviewerDisagreementCount !== allFindings.filter((finding) => finding.kind === "reviewer-disagreement").length
    || batch.metrics.reworkItemCount !== reworkItemIds.length
    || [...batch.metrics.reworkItemIds].sort().join("\0") !== reworkItemIds.join("\0")
    || batch.metrics.provenanceLicenseNoveltyCount !== new Set(batch.metrics.provenanceLicenseNoveltyClassKeys).size
  ) {
    report("invalid-governance", batch.id, "sampling.metrics", "Sampling metrics must be non-negative and exactly match durable findings and rework records");
  }
}

function validateSamplingHistory(
  recipe: GameRecipeV1,
  allRecipes: readonly GameRecipeV1[],
  registry: GameRightsRegistryV1,
  context: GameRecipeValidationContext,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const ordered = [...registry.governance.samplingBatches].sort((left, right) => left.sequence - right.sequence);
  const relevantKeys = new Set(registry.governance.riskClassifications.find((entry) => entry.itemId === recipe.recipeId)?.equivalenceClassKeys ?? []);
  const states = new Map<string, { frozen: boolean; cleanFullReviews: number }>();
  const observedNoveltyKeys = new Set<string>();
  const noveltyPrefixes = ["source-domain:", "source-institution:", "source-rights:", "nutrition:", "authoring:"];
  const auditorRuns = new Set<string>();
  const auditorContexts = new Set<string>();
  const evidenceReferences = new Set<string>();
  ordered.forEach((batch, index) => {
    if (batch.sequence !== index + 1 || (index === 0 ? batch.previousBatchId !== undefined : batch.previousBatchId !== ordered[index - 1].id)) {
      report("invalid-governance", recipe.recipeId, "sampling.history", "Sampling batches require a contiguous sequence and previous-batch chain");
    }
    if (auditorRuns.has(batch.auditor.runId) || auditorContexts.has(batch.auditor.contextId) || evidenceReferences.has(batch.evidenceReference)) {
      report("invalid-governance", recipe.recipeId, "sampling.history", "Each sampling batch requires a distinct auditor run, context and durable evidence reference");
    }
    auditorRuns.add(batch.auditor.runId);
    auditorContexts.add(batch.auditor.contextId);
    evidenceReferences.add(batch.evidenceReference);
    const expectedNoveltyKeys = [...new Set(batch.equivalenceClasses.map((entry) => entry.key))]
      .filter((key) => noveltyPrefixes.some((prefix) => key.startsWith(prefix)) && !observedNoveltyKeys.has(key))
      .sort();
    if ([...batch.metrics.provenanceLicenseNoveltyClassKeys].sort().join("\0") !== expectedNoveltyKeys.join("\0")) {
      report("invalid-governance", recipe.recipeId, "sampling.history", "Provenance/license novelty metrics must identify newly observed source, license, nutrition and authoring classes");
    }
    batch.equivalenceClasses.forEach((entry) => observedNoveltyKeys.add(entry.key));
    const allFindings = [...batch.findings, ...batch.samples.flatMap((sample) => sample.findings)];
    const majorKeys = new Set(allFindings.filter((finding) => finding.severity === "major").flatMap((finding) => finding.equivalenceClassKeys));
    for (const [key, state] of states) {
      if (!state.frozen || majorKeys.has(key)) continue;
      const population = registry.governance.riskClassifications
        .filter((classification) => classification.equivalenceClassKeys.includes(key))
        .map((classification) => classification.itemId)
        .filter((itemId) => allRecipes.some((candidate) => candidate.recipeId === itemId && candidate.eligibility === "exportable"))
        .sort();
      const equivalence = batch.equivalenceClasses.find((entry) => entry.key === key);
      const validationIssues: GameRecipeIssue[] = [];
      validateSamplingBatch(batch, allRecipes, registry, context, [], (code, recipeId, field, message) => {
        validationIssues.push({ code, recipeId, field, message });
      });
      const cleanCurrentBatch = validationIssues.length === 0
        && !allFindings.some((finding) => finding.severity === "major" || finding.disposition === "unresolved");
      const fullReview = Boolean(cleanCurrentBatch
        && equivalence
        && [...equivalence.itemIds].sort().join("\0") === population.join("\0")
        && [...equivalence.sampledItemIds].sort().join("\0") === population.join("\0")
        && population.every((itemId) => batch.samples.some((sample) => sample.itemId === itemId && sample.verdict === "pass" && sample.equivalenceClassKeys.includes(key))));
      state.cleanFullReviews = fullReview ? state.cleanFullReviews + 1 : 0;
      if (state.cleanFullReviews >= 2) state.frozen = false;
    }
    for (const key of majorKeys) states.set(key, { frozen: true, cleanFullReviews: 0 });
  });
  for (const [key, state] of states) {
    if (state.frozen && relevantKeys.has(key)) {
      report("invalid-governance", recipe.recipeId, "sampling.history", `Risk class ${key} remains frozen until two consecutive clean 100% re-review batches`);
    }
  }
}

function isIndependentAttestation(attestation: ReviewAttestation): boolean {
  return isIndependentActors(attestation.author, attestation.reviewer)
    && !attestation.reviewerModifiedContent
    && (attestation.reviewer.actorType !== "agent" || !Object.values(attestation.representations).some(Boolean))
    && (!attestation.representations.humanApproval || attestation.reviewer.actorType !== "agent")
    && (!attestation.representations.culinaryFieldTest || ["human", "domain-expert"].includes(attestation.reviewer.actorType))
    && (!attestation.representations.legalOpinion || attestation.reviewer.actorType === "lawyer");
}

function isIndependentActors(
  author: ReviewAttestation["author"],
  reviewer: ReviewAttestation["reviewer"],
): boolean {
  return author.actorId !== reviewer.actorId
    && author.runId !== reviewer.runId
    && author.contextId !== reviewer.contextId;
}

function completeActor(actor: ReviewAttestation["author"]): boolean {
  return Boolean(actor.actorId.trim() && actor.runId.trim() && actor.contextId.trim());
}

function isGitCommit(value: string): boolean {
  return /^[0-9a-f]{40}$/i.test(value);
}

function intersectSets(left = new Set<string>(), right = new Set<string>()): Set<string> {
  return new Set([...left].filter((entry) => right.has(entry)));
}

function validateScenarios(
  recipe: GameRecipeV1,
  nodeById: ReadonlyMap<string, GameRecipeV1["operationGraph"]["nodes"][number]>,
  portionIds: ReadonlySet<string>,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
  operationById: ReadonlyMap<string, GameOperationDefinitionV1>,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const scenarioIds = new Set<string>();
  const coveredCriticalNodes = new Set<string>();
  const knownEquipmentIds = new Set([...operationById.values()].flatMap((operation) => operation.compatibleEquipmentIds));
  for (const scenario of recipe.scenarios) {
    if (scenarioIds.has(scenario.scenarioId)) report("duplicate-id", recipe.recipeId, `scenarios.${scenario.scenarioId}`, "Scenario IDs must be unique");
    scenarioIds.add(scenario.scenarioId);
    if (scenario.baselineArtifactVersion !== recipe.artifactVersion) report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.baselineArtifactVersion`, "Scenario must target the current recipe artifact version");
    if (scenario.applicableEngine !== recipe.simulationProfile) report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.applicableEngine`, "Scenario engine must match its baseline recipe profile");
    reportDuplicateStrings(scenario.expectedFaultCodes, recipe.recipeId, `scenarios.${scenario.scenarioId}.expectedFaultCodes`, report);
    reportDuplicateStrings(scenario.causeCodes, recipe.recipeId, `scenarios.${scenario.scenarioId}.causeCodes`, report);
    reportDuplicateStrings(scenario.expectedDeltas.map((delta) => delta.dimension), recipe.recipeId, `scenarios.${scenario.scenarioId}.expectedDeltas`, report);
    if (!scenario.causeCodes.length || scenario.causeCodes.some((code) => !code.trim())) {
      report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.causeCodes`, "Every scenario requires at least one non-empty causal event code");
    }
    if (scenario.expectedFaultCodes.some((code) => !code.trim())) {
      report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.expectedFaultCodes`, "Expected fault codes must be non-empty");
    }
    if (scenario.mutation.targetNodeId) {
      if (!nodeById.has(scenario.mutation.targetNodeId)) report("missing-reference", recipe.recipeId, `scenarios.${scenario.scenarioId}.targetNodeId`, "Mutation target node is missing");
      if (nodeTargetMutationTypes.has(scenario.mutation.type)) coveredCriticalNodes.add(scenario.mutation.targetNodeId);
    }
    if (scenario.mutation.targetPortionId && !portionIds.has(scenario.mutation.targetPortionId)) {
      report("missing-reference", recipe.recipeId, `scenarios.${scenario.scenarioId}.targetPortionId`, "Mutation target portion is missing");
    }
    if (scenario.mutation.type === "reorder") {
      const targetNodeId = scenario.mutation.targetNodeId;
      const destinationNodeId = scenario.mutation.destinationBeforeNodeId;
      if (!targetNodeId || !nodeById.has(targetNodeId)) {
        report("missing-reference", recipe.recipeId, `scenarios.${scenario.scenarioId}.targetNodeId`, "Reorder requires an existing target operation");
      }
      if (!destinationNodeId || !nodeById.has(destinationNodeId) || destinationNodeId === targetNodeId) {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.destinationBeforeNodeId`, "Reorder requires a distinct existing destination operation");
      }
    }
    if (scenario.mutation.type === "wrong-equipment") {
      const targetNode = scenario.mutation.targetNodeId ? nodeById.get(scenario.mutation.targetNodeId) : undefined;
      const replacementEquipmentId = scenario.mutation.replacementEquipmentId;
      if (!targetNode) {
        report("missing-reference", recipe.recipeId, `scenarios.${scenario.scenarioId}.targetNodeId`, "Wrong-equipment requires an existing target operation");
      }
      if (!replacementEquipmentId?.trim() || replacementEquipmentId === targetNode?.equipmentId) {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.replacementEquipmentId`, "Wrong-equipment requires a non-empty replacement different from the baseline equipment");
      }
      if (replacementEquipmentId && !knownEquipmentIds.has(replacementEquipmentId)) {
        report("missing-reference", recipe.recipeId, `scenarios.${scenario.scenarioId}.replacementEquipmentId`, "Wrong-equipment replacement must identify equipment from the versioned operation catalog");
      }
      const definition = targetNode ? operationById.get(targetNode.operationType) : undefined;
      if (replacementEquipmentId && definition?.compatibleEquipmentIds.includes(replacementEquipmentId)) {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.replacementEquipmentId`, "Wrong-equipment replacement must be incompatible with the target operation");
      }
    }
    if (scenario.mutation.type === "allowed-substitution") {
      const targetPortion = recipe.ingredientPortions.find((portion) => portion.portionId === scenario.mutation.targetPortionId);
      const replacementIngredientId = scenario.mutation.replacementIngredientId;
      if (!scenario.mutation.targetPortionId) {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.targetPortionId`, "Allowed substitution requires a target portion");
      }
      if (!replacementIngredientId || !ingredientById.has(replacementIngredientId)) {
        report("missing-reference", recipe.recipeId, `scenarios.${scenario.scenarioId}.replacementIngredientId`, "Allowed substitution requires a replacement from the ingredient catalog");
      } else if (targetPortion?.ingredientId === replacementIngredientId) {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.replacementIngredientId`, "Allowed substitution must change the ingredient");
      } else if (targetPortion && replacementIngredientId && !targetPortion.allowedSubstitutionIngredientIds.includes(replacementIngredientId)) {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.replacementIngredientId`, "Allowed substitution must be declared on the target portion");
      }
      if (scenario.nutritionEffect !== "recalculate-from-quantities") {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.nutritionEffect`, "Allowed substitution must recalculate nutrition from ingredient quantities");
      }
    }
    if (!scenario.expectedDeltas.length && !scenario.expectedFaultCodes.length) {
      report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}`, "Scenario requires a directional delta or expected fault");
    }
    if (scenario.mutation.type !== "allowed-substitution" && !scenario.expectedFaultCodes.length && scenario.expectedDeltas.every((delta) => delta.direction === "unchanged")) {
      report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}`, "A fault mutation requires an expected fault or at least one directional change");
    }
    if (["reorder", "duplicate"].includes(scenario.mutation.type) && scenario.nutritionEffect !== "unchanged") {
      report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.nutritionEffect`, "Order-only mutations cannot change nutrition");
    }
    validateMutationContract(recipe, scenario, nodeById, portionIds, report);
  }
  for (const node of nodeById.values()) {
    if (node.criticality !== "completion" && !coveredCriticalNodes.has(node.nodeId)) {
      report("invalid-scenario", recipe.recipeId, `operationGraph.${node.nodeId}`, "Every quality or safety critical node requires mutation coverage");
    }
  }
}

const nodeTargetMutationTypes = new Set<GameRecipeV1["scenarios"][number]["mutation"]["type"]>([
  "omit", "reorder", "duplicate", "heat-too-low", "heat-too-high", "duration-too-short", "duration-too-long",
  "cut-size-too-small", "cut-size-too-large", "low-uniformity", "season-too-early", "season-too-late",
  "overcrowding", "wrong-equipment", "missing-state-transition",
]);

const mutationAllowedFields: Record<GameRecipeV1["scenarios"][number]["mutation"]["type"], ReadonlySet<keyof GameRecipeV1["scenarios"][number]["mutation"]>> = {
  omit: new Set(["targetNodeId"]),
  reorder: new Set(["targetNodeId", "destinationBeforeNodeId"]),
  duplicate: new Set(["targetNodeId"]),
  "quantity-too-low": new Set(["targetPortionId", "scalar"]),
  "quantity-too-high": new Set(["targetPortionId", "scalar"]),
  "heat-too-low": new Set(["targetNodeId", "scalar"]),
  "heat-too-high": new Set(["targetNodeId", "scalar"]),
  "duration-too-short": new Set(["targetNodeId", "scalar"]),
  "duration-too-long": new Set(["targetNodeId", "scalar"]),
  "cut-size-too-small": new Set(["targetNodeId", "scalar"]),
  "cut-size-too-large": new Set(["targetNodeId", "scalar"]),
  "low-uniformity": new Set(["targetNodeId", "scalar"]),
  "season-too-early": new Set(["targetNodeId"]),
  "season-too-late": new Set(["targetNodeId"]),
  overcrowding: new Set(["targetNodeId", "scalar"]),
  "wrong-equipment": new Set(["targetNodeId", "replacementEquipmentId"]),
  "missing-state-transition": new Set(["targetNodeId"]),
  "allowed-substitution": new Set(["targetPortionId", "replacementIngredientId"]),
};

function validateMutationContract(
  recipe: GameRecipeV1,
  scenario: GameRecipeV1["scenarios"][number],
  nodeById: ReadonlyMap<string, GameRecipeV1["operationGraph"]["nodes"][number]>,
  portionIds: ReadonlySet<string>,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const { mutation } = scenario;
  const field = `scenarios.${scenario.scenarioId}`;
  const nodeTypes = nodeTargetMutationTypes;
  const quantityTypes = new Set(["quantity-too-low", "quantity-too-high"]);
  const targetNode = mutation.targetNodeId ? nodeById.get(mutation.targetNodeId) : undefined;
  const allowedFields = mutationAllowedFields[mutation.type];
  for (const fieldName of ["targetNodeId", "destinationBeforeNodeId", "targetPortionId", "scalar", "replacementIngredientId", "replacementEquipmentId"] as const) {
    if (mutation[fieldName] !== undefined && !allowedFields.has(fieldName)) {
      report("invalid-scenario", recipe.recipeId, `${field}.${fieldName}`, `${mutation.type} does not permit ${fieldName}`);
    }
  }
  if (nodeTypes.has(mutation.type) && !targetNode) {
    report("missing-reference", recipe.recipeId, `${field}.targetNodeId`, `${mutation.type} requires an existing target operation`);
  }
  if (quantityTypes.has(mutation.type) && (!mutation.targetPortionId || !portionIds.has(mutation.targetPortionId))) {
    report("missing-reference", recipe.recipeId, `${field}.targetPortionId`, `${mutation.type} requires an existing ingredient portion`);
  }
  const lowerScalarTypes = new Set(["quantity-too-low", "heat-too-low", "duration-too-short", "cut-size-too-small", "low-uniformity"]);
  const upperScalarTypes = new Set(["quantity-too-high", "heat-too-high", "duration-too-long", "cut-size-too-large", "overcrowding"]);
  if (lowerScalarTypes.has(mutation.type) && !(typeof mutation.scalar === "number" && mutation.scalar >= 0 && mutation.scalar < 1)) {
    report("invalid-scenario", recipe.recipeId, `${field}.scalar`, `${mutation.type} requires a scalar within [0, 1)`);
  }
  if (upperScalarTypes.has(mutation.type) && !(typeof mutation.scalar === "number" && mutation.scalar > 1)) {
    report("invalid-scenario", recipe.recipeId, `${field}.scalar`, `${mutation.type} requires a scalar greater than 1`);
  }
  if (["heat-too-low", "heat-too-high"].includes(mutation.type) && targetNode && targetNode.parameters.heatLevel === undefined && targetNode.parameters.temperatureC === undefined) {
    report("invalid-scenario", recipe.recipeId, `${field}.targetNodeId`, "Heat mutation requires a heat- or temperature-controlled operation");
  }
  if (["duration-too-short", "duration-too-long"].includes(mutation.type) && targetNode && targetNode.activeDurationMs + targetNode.waitDurationMs <= 0) {
    report("invalid-scenario", recipe.recipeId, `${field}.targetNodeId`, "Duration mutation requires a positive baseline duration");
  }
  if (["cut-size-too-small", "cut-size-too-large"].includes(mutation.type) && targetNode?.parameters.cutSizeMm === undefined) {
    report("invalid-scenario", recipe.recipeId, `${field}.targetNodeId`, "Cut-size mutation requires a cutSizeMm baseline");
  }
  if (mutation.type === "low-uniformity" && targetNode?.parameters.uniformity === undefined) {
    report("invalid-scenario", recipe.recipeId, `${field}.targetNodeId`, "Uniformity mutation requires a uniformity baseline");
  }
  if (["season-too-early", "season-too-late"].includes(mutation.type) && targetNode?.operationType !== "season") {
    report("invalid-scenario", recipe.recipeId, `${field}.targetNodeId`, "Season-timing mutation must target a season operation");
  }
  if (mutation.type === "overcrowding" && targetNode?.parameters.capacityG === undefined) {
    report("invalid-scenario", recipe.recipeId, `${field}.targetNodeId`, "Overcrowding requires a capacityG baseline");
  }
  if (mutation.type === "missing-state-transition" && targetNode && !targetNode.outputStateIds.length) {
    report("invalid-scenario", recipe.recipeId, `${field}.targetNodeId`, "Missing-state mutation requires a baseline output state transition");
  }
  if (quantityTypes.has(mutation.type) && scenario.nutritionEffect !== "recalculate-from-quantities") {
    report("invalid-scenario", recipe.recipeId, `${field}.nutritionEffect`, "Quantity mutations must recalculate nutrition from quantities");
  }
  if (![...quantityTypes, "allowed-substitution"].includes(mutation.type) && !["heat-too-low", "heat-too-high"].includes(mutation.type) && scenario.nutritionEffect !== "unchanged") {
    report("invalid-scenario", recipe.recipeId, `${field}.nutritionEffect`, "Non-quantity mutations cannot change nutrition without an explicit retention model");
  }
  if (["heat-too-low", "heat-too-high"].includes(mutation.type) && !["unchanged", "requires-retention-model"].includes(scenario.nutritionEffect)) {
    report("invalid-scenario", recipe.recipeId, `${field}.nutritionEffect`, "Heat mutations may only remain unchanged or require a retention model");
  }
}

function validateParameterRanges(
  recipeId: string,
  nodeId: string,
  parameters: GameRecipeV1["operationGraph"]["nodes"][number]["parameters"],
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  if (parameters.heatLevel !== undefined && (parameters.heatLevel < 0 || parameters.heatLevel > 1)) report("invalid-number", recipeId, `operationGraph.${nodeId}.parameters.heatLevel`, "Heat level must be within [0, 1]");
  if (parameters.uniformity !== undefined && (parameters.uniformity < 0 || parameters.uniformity > 1)) report("invalid-number", recipeId, `operationGraph.${nodeId}.parameters.uniformity`, "Uniformity must be within [0, 1]");
  if (parameters.strength !== undefined && (parameters.strength < 0 || parameters.strength > 1)) report("invalid-number", recipeId, `operationGraph.${nodeId}.parameters.strength`, "Strength must be within [0, 1]");
  if (parameters.cutSizeMm !== undefined && (parameters.cutSizeMm < 1 || parameters.cutSizeMm > 100)) report("invalid-number", recipeId, `operationGraph.${nodeId}.parameters.cutSizeMm`, "Cut size must be within [1, 100] mm");
  if (parameters.quantityG !== undefined && !isPositive(parameters.quantityG)) report("invalid-number", recipeId, `operationGraph.${nodeId}.parameters.quantityG`, "Quantity must be positive");
  if (parameters.capacityG !== undefined && !isPositive(parameters.capacityG)) report("invalid-number", recipeId, `operationGraph.${nodeId}.parameters.capacityG`, "Capacity must be positive");
  if (parameters.temperatureC !== undefined && (parameters.temperatureC < -273.15 || parameters.temperatureC > 500)) report("invalid-number", recipeId, `operationGraph.${nodeId}.parameters.temperatureC`, "Temperature must be physically valid and within the supported culinary range");
}

function isCompleteAssessmentBasis(basis: RightsAssessment["basis"]): boolean {
  switch (basis.kind) {
    case "first-party": return basis.owner.trim().length > 0;
    case "public-domain": return basis.basis.trim().length > 0;
    case "open-license": return basis.licenseId.trim().length > 0 && isHttpsUrl(basis.licenseUrl);
    case "permission": return basis.permissionReferenceId.trim().length > 0;
    case "terms": return basis.provider.trim().length > 0 && isHttpsUrl(basis.termsUrl) && (basis.effectiveDate === undefined || isIsoDate(basis.effectiveDate));
    case "reference-only": return basis.boundary.trim().length > 0;
  }
}

function assessmentMatchesSourceRights(assessment: RightsAssessment, source: Source): boolean {
  switch (source.rights.status) {
    case "public-domain":
      return assessment.basis.kind === "public-domain" && assessment.basis.basis === source.rights.basis;
    case "open-license":
      return assessment.basis.kind === "open-license"
        && assessment.basis.licenseId === source.rights.licenseId
        && assessment.basis.licenseUrl === source.rights.licenseUrl;
    case "permission-granted":
      return assessment.basis.kind === "permission";
    case "reference-only":
      return assessment.basis.kind === "reference-only";
    case "unknown":
      return false;
  }
}

function sourceQuantityMassG(
  quantity: GameRecipeV1["ingredientPortions"][number]["sourceQuantity"],
  ingredientId: string,
  record: GameIngredientCatalogV1["conversionRecords"][number] | undefined,
): number | null {
  if (!record || record.unit !== quantity.unit || (record.ingredientId && record.ingredientId !== ingredientId)) return null;
  return quantity.amount * record.gramsPerUnit;
}

function allowedTargetDimensions(operationType: GameRecipeV1["operationGraph"]["nodes"][number]["operationType"]): ReadonlySet<string> {
  if (["wash", "peel", "slice", "dice", "mince", "crush", "grind", "mix", "whisk", "knead", "fold", "shape", "stir", "toss"].includes(operationType)) return new Set(["structural-integrity"]);
  if (["marinate", "rest", "proof", "ferment"].includes(operationType)) return new Set(["aroma", "salt", "sweet", "acidity", "umami", "pungency", "structural-integrity"]);
  if (["set-heat", "boil", "simmer", "steam", "pan-fry", "deep-fry", "bake", "roast", "grill"].includes(operationType)) return new Set(["doneness", "wateriness", "browning", "burn", "aroma", "structural-integrity"]);
  if (["drain", "rinse", "strain", "blend"].includes(operationType)) return new Set(["wateriness", "structural-integrity"]);
  if (["brew", "extract", "chill", "freeze"].includes(operationType)) return new Set(["wateriness", "aroma", "bitterness", "structural-integrity"]);
  if (operationType === "season") return new Set(["salt", "sweet", "acidity", "umami", "pungency", "bitterness", "aroma"]);
  return new Set();
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function reportDuplicateStrings(
  values: readonly string[],
  recipeId: string,
  field: string,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) report("duplicate-id", recipeId, field, `Duplicate reference ${value}`);
    seen.add(value);
  }
}

function hasCycle(nodes: ReadonlyMap<string, GameRecipeV1["operationGraph"]["nodes"][number]>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    for (const dependencyId of nodes.get(nodeId)?.dependsOn ?? []) {
      if (nodes.has(dependencyId) && visit(dependencyId)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  return [...nodes.keys()].some(visit);
}

function reportDuplicates<T>(
  entries: readonly T[],
  getId: (entry: T) => string,
  subjectId: string,
  field: string,
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const ids = new Set<string>();
  for (const entry of entries) {
    const id = getId(entry);
    if (ids.has(id)) report("duplicate-id", subjectId, field, `Duplicate ID ${id}`);
    ids.add(id);
  }
}

function zeroNutrition(): Nutrition {
  return { calories: 0, protein: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0, sodium: 0 };
}

function addNutrition(left: Nutrition, right: Nutrition): Nutrition {
  return Object.fromEntries(nutritionKeys.map((key) => [key, left[key] + right[key]])) as unknown as Nutrition;
}

function scaleNutrition(value: Nutrition, scalar: number): Nutrition {
  return Object.fromEntries(nutritionKeys.map((key) => [key, round(value[key] * scalar)])) as unknown as Nutrition;
}

function nutritionEqual(left: Nutrition, right: Nutrition, epsilon: number): boolean {
  return nutritionKeys.every((key) => Math.abs(left[key] - right[key]) <= epsilon);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}
