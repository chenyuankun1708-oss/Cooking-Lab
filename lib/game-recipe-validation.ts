import { createContentVersion } from "./content-version";
import { rightsActions } from "@/types/content-rights";
import type { ContentArtifact, RightsAssessment } from "@/types/content-rights";
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
  support?: Pick<GameRecipeValidationContext, "operations" | "ingredients" | "nutritionDataset">,
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
    evidence: registry.evidence.filter((evidence) => evidenceIds.has(evidence.id)).sort(byId),
    evidenceOrigins: registry.evidenceOrigins.filter((entry) => evidenceIds.has(entry.evidenceId)).sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
    researchRecords: registry.researchRecords
      .filter((record) => record.subject.type === "game-recipe" && recipeIds.has(record.subject.id))
      .sort(byId),
    supportingVersions: support ? {
      operations: [...support.operations].sort(byId),
      ingredientCatalogVersion: support.ingredients.catalogVersion,
      ingredients: support.ingredients.ingredients.filter((ingredient) => ingredientIds.has(ingredient.ingredientId)).sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
      nutritionDataset: support.nutritionDataset ? {
        ...support.nutritionDataset,
        records: support.nutritionDataset.records
          .filter((record) => upstreamRecordIds.has(record.fdcId))
          .sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
      } : null,
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
  const recipeIds = new Set<string>();
  const slugs = new Set<string>();
  for (const recipe of recipes) {
    if (recipeIds.has(recipe.recipeId)) report("duplicate-id", recipe.recipeId, "recipeId", "Recipe ID must be unique");
    if (slugs.has(recipe.slug)) report("duplicate-id", recipe.recipeId, "slug", "Recipe slug must be unique");
    recipeIds.add(recipe.recipeId);
    slugs.add(recipe.slug);
    evaluateRecipe(recipe, recipes, operationById, ingredientById, context, report);
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
  if (context.nutritionDataset) validateNutritionDataset(context.nutritionDataset, context.ingredients, report);
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
}

function evaluateRecipe(
  recipe: GameRecipeV1,
  allRecipes: readonly GameRecipeV1[],
  operationById: ReadonlyMap<string, GameOperationDefinitionV1>,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
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
  }
  if (!portionIds.size) report("missing-reference", recipe.recipeId, "ingredientPortions", "Every game recipe requires at least one quantified ingredient portion");

  const nodeById = new Map<string, GameRecipeV1["operationGraph"]["nodes"][number]>();
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
    if (!referencedPortions.has(portionId)) report("missing-reference", recipe.recipeId, `ingredientPortions.${portionId}`, "Every ingredient portion must enter at least one operation");
  }
  validateSimulationProfile(recipe, operationById, report);
  validateNutrition(recipe, ingredientById, context.nutritionDataset, report);
  validateScenarios(recipe, nodeById, portionIds, ingredientById, report);
  if (recipe.eligibility === "exportable") validateRightsAndGovernance(recipe, allRecipes, context, report);
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
    )) {
      report("invalid-nutrition", recipe.recipeId, `nutritionProfile.provenance.${ingredientId}`, "Exportable recipes require versioned USDA FoodData Central provenance");
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
    if (decision.artifactId !== artifact.id || decision.intendedUse !== "game-commercial-ready" || !["allow", "allow-with-obligations"].includes(decision.decision)) {
      report("invalid-rights", recipe.recipeId, `decision.${decision.id}`, "UsageDecision must allow the exact game artifact for commercial use");
    }
    if (!decision.assessmentIds.includes(artifact.rightsAssessmentId)) {
      report("missing-reference", recipe.recipeId, `decision.${decision.id}.assessmentIds`, "UsageDecision must include the artifact assessment");
    }
    for (const sourceId of artifact.sourceIds) {
      if (!recipe.rights.sourceIds.includes(sourceId)) {
        report("missing-reference", recipe.recipeId, `artifact.${artifact.id}.sourceIds`, "Artifact sources must be included to the recipe rights summary");
      }
      const sourceAssessmentId = `game-rights-source-${sourceId}`;
      if (!decision.assessmentIds.includes(sourceAssessmentId)) {
        report("missing-reference", recipe.recipeId, `decision.${decision.id}.assessmentIds`, `Missing source assessment ${sourceAssessmentId}`);
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
  }
  if (institutions.size < 2) report("invalid-rights", recipe.recipeId, "rights.sourceIds", "Sources must come from at least two independent institutions");
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
    for (const artifact of artifacts) {
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
  if (assessment.subject.type === "artifact" && assessment.subject.id !== artifact.id) {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.subject`, "Artifact assessment must identify the reviewed artifact");
  }
  if (assessment.jurisdictionBaseline.join(",") !== "CN,US,EU,UK" || assessment.applicableTerritories.join(",") !== "CN,US,EU,UK") {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.jurisdictionBaseline`, "Game rights require the CN/US/EU/UK baseline");
  }
  if (!isIsoDate(assessment.assessedAt) || !assessment.reviewDueAt || !isIsoDate(assessment.reviewDueAt) || assessment.reviewDueAt < now) {
    report("invalid-rights", recipeId, `assessment.${assessment.id}.review`, "Assessment must be current and have an unexpired review date");
  }
  if (assessment.uncertainty.trim()) report("invalid-rights", recipeId, `assessment.${assessment.id}.uncertainty`, "Unresolved rights uncertainty blocks export");
  for (const action of rightsActions) {
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
  if (unresolvedRights || unresolvedDisagreement || safetyCritical) {
    return {
      level: "high",
      reasonCodes: [
        ...(safetyCritical ? ["food-safety-critical-process" as const] : []),
        ...(unresolvedDisagreement ? ["unresolved-reviewer-disagreement" as const] : []),
        ...(unresolvedRights ? ["professional-legal-checkpoint" as const] : []),
      ],
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
  const operationSignature = recipe.operationGraph.nodes.map((node) => node.operationType).join(">");
  const mutationTypes = recipe.scenarios.map((scenario) => scenario.mutation.type);
  const ingredientStates = recipe.ingredientPortions.map((portion) => portion.initialState);
  const ingredientIds = new Set(recipe.ingredientPortions.map((portion) => portion.ingredientId));
  const acidAndDairy = [...ingredientIds].some((id) => /lemon|orange|pineapple|strawberry|raspberry/.test(id))
    && [...ingredientIds].some((id) => /milk|yogurt/.test(id));
  const highWaterFruit = [...ingredientIds].some((id) => /watermelon|strawberry|orange/.test(id));
  const family = recipe.recipeId.startsWith("game-bowl-") ? "grain-bowl"
    : recipe.recipeId.startsWith("game-dessert-") ? "dessert"
      : recipe.recipeId.startsWith("game-tea-") ? "tea"
        : recipe.recipeId.startsWith("game-coffee-") ? "coffee"
          : recipe.recipeId.startsWith("game-drink-") ? "fruit-drink"
            : "migrated-web-item";
  return [...new Set([
    `content-type:${recipe.itemType}`,
    `formula:${family}`,
    `formula-variant:${deriveFormulaVariant(recipe)}`,
    `authoring:${recipe.authoring.method}:${recipe.authoring.generatorVersion}`,
    `operation-signature:${operationSignature}`,
    `ingredient-state-set:${[...new Set(ingredientStates)].sort().join("+")}`,
    `acid-dairy:${acidAndDairy ? "present" : "absent"}`,
    `high-water-fruit:${highWaterFruit ? "present" : "absent"}`,
    "image:not-applicable",
    "translation:not-applicable",
    ...nutritionVersions.map((version) => `nutrition:${version}`),
    ...operationTypes.map((operation) => `operation:${operation}`),
    ...mutationTypes.map((mutation) => `mutation:${mutation}`),
    ...sources.map((source) => `source-institution:${source.publisherOrInstitution.trim().toLowerCase()}`),
    ...sources.map((source) => `source-rights:${source.rights.status}:${"licenseId" in source.rights ? source.rights.licenseId : "reference-only"}`),
    ...domains.map((domain) => `source-domain:${domain}`),
  ])].sort();
}

function deriveFormulaVariant(recipe: GameRecipeV1): string {
  if (recipe.recipeId.startsWith("game-dessert-")) {
    return ["almond-oat-bake", "walnut-oat-bake", "almond-yogurt-cup", "walnut-yogurt-cup", "almond-coconut-pudding", "walnut-coconut-pudding", "almond-fruit-crumble", "walnut-fruit-crumble", "honey-cinnamon-bake", "vanilla-yogurt-chill"]
      .find((variant) => recipe.recipeId.endsWith(`-${variant}`)) ?? "dessert-other";
  }
  if (recipe.recipeId.startsWith("game-tea-") || recipe.recipeId.startsWith("game-coffee-")) {
    return recipe.recipeId.endsWith("-hot") ? "hot" : recipe.recipeId.endsWith("-cold") ? "cold" : recipe.recipeId.endsWith("-milk") ? "milk" : "beverage-other";
  }
  if (recipe.recipeId.startsWith("game-drink-")) return recipe.recipeId.endsWith("-blended") ? "blended" : "infused";
  if (recipe.recipeId.startsWith("game-bowl-")) {
    const base = ["brown-rice", "white-rice", "pasta-dry", "rice-noodle-dry"].find((candidate) => recipe.recipeId.startsWith(`game-bowl-${candidate}-`));
    return base ?? "grain-bowl-other";
  }
  return "migrated-web-item";
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
      const cleanCurrentBatch = batch.policyVersion === registry.policyVersion
        && batch.artifactSetVersion === createGameArtifactSetVersion(allRecipes.filter((candidate) => batch.itemIds.includes(candidate.recipeId)), registry, context)
        && batch.evidenceDigest === createSamplingBatchEvidenceDigest(batch)
        && isIndependentActors(batch.author, batch.auditor)
        && !batch.auditorModifiedContent
        && batch.verdict === "pass"
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
  report: (code: GameRecipeIssueCode, recipeId: string, field: string, message: string) => void,
) {
  const scenarioIds = new Set<string>();
  const coveredCriticalNodes = new Set<string>();
  for (const scenario of recipe.scenarios) {
    if (scenarioIds.has(scenario.scenarioId)) report("duplicate-id", recipe.recipeId, `scenarios.${scenario.scenarioId}`, "Scenario IDs must be unique");
    scenarioIds.add(scenario.scenarioId);
    if (scenario.baselineArtifactVersion !== recipe.artifactVersion) report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.baselineArtifactVersion`, "Scenario must target the current recipe artifact version");
    if (scenario.mutation.targetNodeId) {
      if (!nodeById.has(scenario.mutation.targetNodeId)) report("missing-reference", recipe.recipeId, `scenarios.${scenario.scenarioId}.targetNodeId`, "Mutation target node is missing");
      coveredCriticalNodes.add(scenario.mutation.targetNodeId);
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
      }
      if (scenario.nutritionEffect !== "recalculate-from-quantities") {
        report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.nutritionEffect`, "Allowed substitution must recalculate nutrition from ingredient quantities");
      }
    }
    if (!scenario.expectedDeltas.length && !scenario.expectedFaultCodes.length) {
      report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}`, "Scenario requires a directional delta or expected fault");
    }
    if (["reorder", "duplicate"].includes(scenario.mutation.type) && scenario.nutritionEffect !== "unchanged") {
      report("invalid-scenario", recipe.recipeId, `scenarios.${scenario.scenarioId}.nutritionEffect`, "Order-only mutations cannot change nutrition");
    }
  }
  for (const node of nodeById.values()) {
    if (node.criticality !== "completion" && !coveredCriticalNodes.has(node.nodeId)) {
      report("invalid-scenario", recipe.recipeId, `operationGraph.${node.nodeId}`, "Every quality or safety critical node requires mutation coverage");
    }
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
