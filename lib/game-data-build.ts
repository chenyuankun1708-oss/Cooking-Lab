import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Source } from "@/types/culinary";
import type {
  GameDataManifestV1,
  GameIngredientCatalogV1,
  GameNutritionDatasetSubsetV1,
  GameOperationDefinitionV1,
  GameRecipeV1,
  GameRightsRegistryV1,
} from "@/types/game-recipe";
import { isGameExportEligibility } from "@/types/game-recipe-database";
import type { GameNormalizationRegistryV1, GameSourceFactBundleV1 } from "@/types/game-source-facts";
import type { LocSourceRegistryV1 } from "@/types/loc-recipe-source";
import { parseLocSourceCacheManifest, type LocSourceCacheManifestV1 } from "./loc-source-cache";
import { compileCatKitchenGoal1Recipe } from "./cat-kitchen-goal1-compiler";
import {
  parseGameDataManifest,
  parseGameDataArtifactPath,
  parseGameIngredientCatalog,
  parseGameNutritionDataset,
  parseGameOperationCatalog,
  parseGameRecipe,
  parseGameRightsRegistry,
  parseGodotGameRecipe,
  type GodotGameRecipeV1,
} from "./game-data-runtime-schema";
import { assertGameRecipeCorpusReady, evaluateGameRecipeCorpus } from "./game-recipe-validation";
import { stableJson } from "./stable-json";
import { parseGameNormalizationRegistry, parseGameSourceFactBundle } from "./game-source-fact-runtime-schema";
import { parseLocSourceRegistry } from "./loc-recipe-ingestion";

export interface GameDataBuildInput {
  recipes: readonly GameRecipeV1[];
  ingredients: GameIngredientCatalogV1;
  nutritionDataset: GameNutritionDatasetSubsetV1;
  operations: readonly GameOperationDefinitionV1[];
  rightsRegistry: GameRightsRegistryV1;
  normalizationRegistry?: GameNormalizationRegistryV1;
  sourceFactBundles?: readonly GameSourceFactBundleV1[];
  locSourceRegistry?: LocSourceRegistryV1;
  locSourceCacheManifest?: LocSourceCacheManifestV1;
  now: string;
}

export interface GameDataBuildResult {
  manifest: GameDataManifestV1;
  outputDirectory: string;
  sqlitePath: string;
  auditReportPath: string;
}

export function buildGameData(
  input: GameDataBuildInput,
  outputDirectory = resolve(process.cwd(), ".local/game-data"),
): GameDataBuildResult {
  const targetDirectory = assertSafeGameDataOutputDirectory(outputDirectory);
  assertRuntimeBuildInput(input);
  const canonicalAudit = evaluateGameRecipeCorpus(input.recipes, {
    operations: input.operations,
    ingredients: input.ingredients,
    nutritionDataset: input.nutritionDataset,
    rightsRegistry: input.rightsRegistry,
    normalizationRegistry: input.normalizationRegistry,
    sourceFactBundles: input.sourceFactBundles,
    locSourceRegistry: input.locSourceRegistry,
    locSourceCacheManifest: input.locSourceCacheManifest,
    now: input.now,
  });
  if (canonicalAudit.issues.length) {
    throw new Error(`Game canonical data is invalid: ${canonicalAudit.issues.map((issue) => `${issue.code}:${issue.recipeId}:${issue.field}`).join("; ")}`);
  }
  const exportable = input.recipes
    .filter((recipe) => isGameExportEligibility(recipe.eligibility))
    .sort((left, right) => left.recipeId.localeCompare(right.recipeId));
  if (exportable.length === 0) {
    throw new Error("Game data gate blocked export: no exportable recipes");
  }
  assertGameRecipeCorpusReady(exportable, {
    operations: input.operations,
    ingredients: input.ingredients,
    nutritionDataset: input.nutritionDataset,
    rightsRegistry: input.rightsRegistry,
    normalizationRegistry: input.normalizationRegistry,
    sourceFactBundles: input.sourceFactBundles,
    locSourceRegistry: input.locSourceRegistry,
    locSourceCacheManifest: input.locSourceCacheManifest,
    now: input.now,
  });
  for (const recipe of exportable) {
    if (recipe.simulationProfile === "cat-kitchen-goal1-v1") {
      compileCatKitchenGoal1Recipe(recipe, input.ingredients, input.operations);
    }
  }

  const usedIngredientIds = new Set(exportable.flatMap((recipe) => recipe.ingredientPortions.map((portion) => portion.ingredientId)));
  const usedConversionRecordIds = new Set(exportable.flatMap((recipe) => recipe.ingredientPortions.map((portion) => portion.sourceQuantity.conversionRecordId)));
  const exportIngredients: GameIngredientCatalogV1 = {
    ...input.ingredients,
    ingredients: input.ingredients.ingredients
      .filter((ingredient) => usedIngredientIds.has(ingredient.ingredientId))
      .sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
    conversionRecords: input.ingredients.conversionRecords
      .filter((record) => usedConversionRecordIds.has(record.recordId))
      .sort((left, right) => left.recordId.localeCompare(right.recordId)),
  };
  const exportNutritionDataset = createExportNutritionDataset(input.nutritionDataset, usedIngredientIds);
  const usedArtifactIds = new Set(exportable.flatMap((recipe) => recipe.rights.artifactIds));
  const usedSourceIds = new Set(exportable.flatMap((recipe) => recipe.rights.sourceIds));
  const attribution = {
    schemaVersion: "cooking-lab-game-attribution-v1",
    generatedAt: input.now,
    sources: input.rightsRegistry.sources.filter((source) => usedSourceIds.has(source.id)).sort(byId).map(sourceAttribution),
    requirements: input.rightsRegistry.attributions.filter((entry) => usedArtifactIds.has(entry.artifactId)).sort(byId),
  };
  const rightsExport = createRightsExport(input.rightsRegistry, exportable, usedArtifactIds, usedSourceIds);
  mkdirSync(dirname(targetDirectory), { recursive: true });
  const stagingDirectory = mkdtempSync(resolve(dirname(targetDirectory), `.${basename(targetDirectory)}.staging-`));
  try {
    const recipeDirectory = resolve(stagingDirectory, "godot/recipes");
    mkdirSync(recipeDirectory, { recursive: true });
    const recipeEntries: GameDataManifestV1["recipes"] = [];
    for (const recipe of exportable) {
      const relativePath = `godot/recipes/${recipe.recipeId}.json`;
      const content = stableJson(toGodotRecipe(recipe));
      writeFileSync(resolve(stagingDirectory, relativePath), content);
      recipeEntries.push({
        recipeId: recipe.recipeId,
        path: relativePath,
        sha256: sha256(content),
        artifactVersion: recipe.artifactVersion,
        simulationProfile: recipe.simulationProfile,
      });
    }
    const ingredientPath = "godot/ingredients.json";
    const nutritionPath = "nutrition-dataset.json";
    const operationPath = "godot/operations.json";
    const attributionPath = "attribution.json";
    const rightsPath = "rights-registry.json";
    const sqlitePath = "game-data.sqlite";
    const ingredientContent = stableJson(exportIngredients);
    const nutritionContent = stableJson(exportNutritionDataset);
    const operationContent = stableJson({
      version: "cooking-lab-game-operations-v1",
      operations: input.operations,
    });
    const attributionContent = stableJson(attribution);
    const rightsContent = stableJson(rightsExport);
    writeArtifact(stagingDirectory, ingredientPath, ingredientContent);
    writeArtifact(stagingDirectory, nutritionPath, nutritionContent);
    writeArtifact(stagingDirectory, operationPath, operationContent);
    writeArtifact(stagingDirectory, attributionPath, attributionContent);
    writeArtifact(stagingDirectory, rightsPath, rightsContent);
    writeSqlite(resolve(stagingDirectory, sqlitePath), exportable, exportIngredients, input.rightsRegistry);

    const supportingHashes = {
      ingredientCatalog: sha256(ingredientContent),
      nutritionDataset: sha256(nutritionContent),
      operationCatalog: sha256(operationContent),
      rightsRegistry: sha256(rightsContent),
      attribution: sha256(attributionContent),
      sqlite: sha256(readFileSync(resolve(stagingDirectory, sqlitePath))),
    };
    const manifest: GameDataManifestV1 = {
      schemaVersion: "cooking-lab-game-manifest-v1",
      catalogVersion: createGameDataCatalogVersion(recipeEntries, supportingHashes),
      generatorVersion: "cooking-lab-game-data-build-v1",
      minimumAdapterVersion: "cat-kitchen-game-data-adapter-v1",
      recipeCount: exportable.length,
      recipes: recipeEntries,
      rightsSummary: createRightsSummary(input.rightsRegistry, exportable),
      reviewSummary: createReviewSummary(input.rightsRegistry, exportable),
      ingredientCatalog: { path: ingredientPath, sha256: supportingHashes.ingredientCatalog },
      nutritionDataset: {
        path: nutritionPath,
        sha256: supportingHashes.nutritionDataset,
        schemaVersion: exportNutritionDataset.schemaVersion,
        provider: exportNutritionDataset.provider,
        upstreamArchives: exportNutritionDataset.upstreamArchives.map(({ datasetVersion, sha256: archiveHash }) => ({ datasetVersion, sha256: archiveHash })),
      },
      operationCatalog: {
        path: operationPath,
        sha256: supportingHashes.operationCatalog,
        version: "cooking-lab-game-operations-v1",
      },
      rightsRegistry: {
        path: rightsPath,
        sha256: supportingHashes.rightsRegistry,
        version: "cooking-lab-game-rights-v1",
      },
      attribution: { path: attributionPath, sha256: supportingHashes.attribution },
      sqlite: { path: sqlitePath, sha256: supportingHashes.sqlite },
    };
    writeFileSync(resolve(stagingDirectory, "manifest.json"), stableJson(manifest));

    writeFileSync(resolve(stagingDirectory, "audit.md"), createGameDataAuditReport(input, exportable));
    verifyExportParity(stagingDirectory, manifest, exportable);
    replaceDirectory(stagingDirectory, targetDirectory);
    return {
      manifest,
      outputDirectory: targetDirectory,
      sqlitePath: resolve(targetDirectory, "game-data.sqlite"),
      auditReportPath: resolve(targetDirectory, "audit.md"),
    };
  } catch (error) {
    rmSync(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
}

function createRightsSummary(
  registry: GameRightsRegistryV1,
  recipes: readonly GameRecipeV1[],
): GameDataManifestV1["rightsSummary"] {
  const artifactIds = new Set(recipes.flatMap((recipe) => recipe.rights.artifactIds));
  const decisionIds = new Set(recipes.flatMap((recipe) => recipe.rights.usageDecisionIds));
  const sourceIds = new Set(recipes.flatMap((recipe) => recipe.rights.sourceIds));
  const decisions = registry.decisions.filter((decision) => decisionIds.has(decision.id));
  const licenseIds = registry.sources
    .filter((source) => sourceIds.has(source.id) && source.rights.status === "open-license")
    .map((source) => source.rights.status === "open-license" ? source.rights.licenseId : "")
    .filter(Boolean);
  return {
    intendedUse: "game-commercial-ready",
    artifactCount: artifactIds.size,
    decisionCount: decisions.length,
    allowCount: decisions.filter((decision) => decision.decision === "allow").length,
    allowWithObligationsCount: decisions.filter((decision) => decision.decision === "allow-with-obligations").length,
    sourceCount: sourceIds.size,
    licenseIds: [...new Set(licenseIds)].sort(),
  };
}

function createReviewSummary(
  registry: GameRightsRegistryV1,
  recipes: readonly GameRecipeV1[],
): GameDataManifestV1["reviewSummary"] {
  const recipeIds = new Set(recipes.map((recipe) => recipe.recipeId));
  const attestationIds = new Set(recipes.flatMap((recipe) => recipe.governance.reviewAttestationIds));
  const samplingIds = new Set(recipes.flatMap((recipe) => recipe.governance.samplingBatchId ? [recipe.governance.samplingBatchId] : []));
  const riskCounts = { low: 0, medium: 0, high: 0 };
  for (const recipe of recipes) riskCounts[recipe.governance.riskLevel] += 1;
  return {
    riskCounts,
    attestationCount: registry.governance.attestations.filter((entry) => attestationIds.has(entry.id)).length,
    samplingBatchCount: registry.governance.samplingBatches.filter((entry) => samplingIds.has(entry.id)).length,
    reviewedRecipeCount: registry.governance.riskClassifications.filter((entry) => recipeIds.has(entry.itemId)).length,
  };
}

export function createGameDataCatalogVersion(
  recipes: readonly GameDataManifestV1["recipes"][number][],
  supportingHashes: {
    ingredientCatalog: string;
    nutritionDataset: string;
    operationCatalog: string;
    rightsRegistry: string;
    attribution: string;
    sqlite: string;
  },
): string {
  const payload = stableJson({
    schemaVersion: "cooking-lab-game-manifest-v1",
    generatorVersion: "cooking-lab-game-data-build-v1",
    minimumAdapterVersion: "cat-kitchen-game-data-adapter-v1",
    recipes: [...recipes].sort((left, right) => left.recipeId.localeCompare(right.recipeId)),
    supportingHashes,
  });
  return `clgcv1-${sha256(payload).slice(0, 24)}`;
}

export function createGameDataAuditReport(input: GameDataBuildInput, exportable: readonly GameRecipeV1[]): string {
  const profiles = new Map<string, number>();
  for (const recipe of exportable) profiles.set(recipe.simulationProfile, (profiles.get(recipe.simulationProfile) ?? 0) + 1);
  return [
    "# Game data audit",
    "",
    "Status: PASS",
    `Canonical recipes: ${input.recipes.length}`,
    `Exportable recipes: ${exportable.length}`,
    `Draft recipes excluded: ${input.recipes.length - exportable.length}`,
    `Ingredient records exported: ${new Set(exportable.flatMap((recipe) => recipe.ingredientPortions.map((portion) => portion.ingredientId))).size}`,
    `Rights policy: ${input.rightsRegistry.policyVersion}`,
    `Validation date: ${input.now}`,
    "",
    "Simulation profiles:",
    ...[...profiles.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([profile, count]) => `- ${profile}: ${count}`),
    "",
  ].join("\n");
}

function toGodotRecipe(recipe: GameRecipeV1): GodotGameRecipeV1 {
  return {
    schemaVersion: recipe.schemaVersion,
    artifactVersion: recipe.artifactVersion,
    recipeId: recipe.recipeId,
    itemType: recipe.itemType,
    simulationProfile: recipe.simulationProfile,
    servings: recipe.servings,
    yield: recipe.yield,
    ingredientPortions: recipe.ingredientPortions,
    operationGraph: recipe.operationGraph,
    nutritionProfile: recipe.nutritionProfile,
    scenarios: recipe.scenarios,
  };
}

function writeSqlite(
  path: string,
  recipes: readonly GameRecipeV1[],
  ingredients: GameIngredientCatalogV1,
  rightsRegistry: GameRightsRegistryV1,
) {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  rmSync(temporaryPath, { force: true });
  const database = new DatabaseSync(temporaryPath);
  database.exec(`
    PRAGMA journal_mode = DELETE;
    PRAGMA synchronous = FULL;
    PRAGMA user_version = 1;
    CREATE TABLE recipes (recipe_id TEXT PRIMARY KEY, artifact_version TEXT NOT NULL, item_type TEXT NOT NULL, simulation_profile TEXT NOT NULL, servings REAL NOT NULL, yield_amount REAL NOT NULL, yield_unit TEXT NOT NULL, recipe_json TEXT NOT NULL);
    CREATE TABLE ingredients (ingredient_id TEXT PRIMARY KEY, default_state TEXT NOT NULL, nutrition_provenance_id TEXT NOT NULL, nutrition_json TEXT NOT NULL, source_json TEXT NOT NULL, definition_json TEXT NOT NULL);
    CREATE TABLE unit_conversions (record_id TEXT PRIMARY KEY, ingredient_id TEXT, unit TEXT NOT NULL, grams_per_unit REAL NOT NULL, basis TEXT NOT NULL, provenance_id TEXT NOT NULL);
    CREATE TABLE recipe_ingredients (recipe_id TEXT NOT NULL, portion_id TEXT NOT NULL, ingredient_id TEXT NOT NULL, initial_state TEXT NOT NULL, source_amount REAL NOT NULL, source_unit TEXT NOT NULL, conversion_record_id TEXT NOT NULL, mass_g REAL NOT NULL, volume_ml REAL, optional INTEGER NOT NULL, phase TEXT NOT NULL, nutrition_provenance_id TEXT NOT NULL, PRIMARY KEY (recipe_id, portion_id));
    CREATE TABLE ingredient_substitutions (recipe_id TEXT NOT NULL, portion_id TEXT NOT NULL, replacement_ingredient_id TEXT NOT NULL, PRIMARY KEY (recipe_id, portion_id, replacement_ingredient_id));
    CREATE TABLE operations (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, operation_type TEXT NOT NULL, equipment_id TEXT, active_duration_ms INTEGER NOT NULL, wait_duration_ms INTEGER NOT NULL, parameters_json TEXT NOT NULL, criticality TEXT NOT NULL, source_step_order INTEGER, PRIMARY KEY (recipe_id, node_id));
    CREATE TABLE operation_dependencies (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, depends_on_node_id TEXT NOT NULL, PRIMARY KEY (recipe_id, node_id, depends_on_node_id));
    CREATE TABLE operation_inputs (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, portion_id TEXT NOT NULL, PRIMARY KEY (recipe_id, node_id, portion_id));
    CREATE TABLE operation_outputs (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, state_id TEXT NOT NULL, PRIMARY KEY (recipe_id, node_id, state_id));
    CREATE TABLE target_states (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, dimension TEXT NOT NULL, minimum REAL, maximum REAL, unit TEXT NOT NULL, PRIMARY KEY (recipe_id, node_id, dimension));
    CREATE TABLE nutrition (recipe_id TEXT NOT NULL, scope TEXT NOT NULL, calories REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, saturated_fat REAL NOT NULL, carbs REAL NOT NULL, sugar REAL NOT NULL, added_sugar REAL NOT NULL, fiber REAL NOT NULL, sodium REAL NOT NULL, provenance_json TEXT NOT NULL, PRIMARY KEY (recipe_id, scope));
    CREATE TABLE sources (source_id TEXT PRIMARY KEY, title TEXT NOT NULL, institution TEXT NOT NULL, rights_status TEXT NOT NULL, source_json TEXT NOT NULL);
    CREATE TABLE rights_decisions (decision_id TEXT PRIMARY KEY, artifact_id TEXT NOT NULL, intended_use TEXT NOT NULL, decision TEXT NOT NULL, decision_json TEXT NOT NULL);
    CREATE TABLE scenarios (recipe_id TEXT NOT NULL, scenario_id TEXT NOT NULL, mutation_type TEXT NOT NULL, recoverability TEXT NOT NULL, nutrition_effect TEXT NOT NULL, scenario_json TEXT NOT NULL, PRIMARY KEY (recipe_id, scenario_id));
    CREATE TABLE mutations (recipe_id TEXT NOT NULL, scenario_id TEXT NOT NULL, mutation_type TEXT NOT NULL, target_node_id TEXT, destination_before_node_id TEXT, target_portion_id TEXT, scalar REAL, replacement_ingredient_id TEXT, replacement_equipment_id TEXT, PRIMARY KEY (recipe_id, scenario_id));
  `);
  database.exec("BEGIN IMMEDIATE");
  try {
    const insertRecipe = database.prepare("INSERT INTO recipes VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const insertIngredient = database.prepare("INSERT INTO ingredients VALUES (?, ?, ?, ?, ?, ?)");
    const insertConversion = database.prepare("INSERT INTO unit_conversions VALUES (?, ?, ?, ?, ?, ?)");
    const insertPortion = database.prepare("INSERT INTO recipe_ingredients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const insertSubstitution = database.prepare("INSERT INTO ingredient_substitutions VALUES (?, ?, ?)");
    const insertOperation = database.prepare("INSERT INTO operations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const insertDependency = database.prepare("INSERT INTO operation_dependencies VALUES (?, ?, ?)");
    const insertOperationInput = database.prepare("INSERT INTO operation_inputs VALUES (?, ?, ?)");
    const insertOperationOutput = database.prepare("INSERT INTO operation_outputs VALUES (?, ?, ?)");
    const insertTarget = database.prepare("INSERT INTO target_states VALUES (?, ?, ?, ?, ?, ?)");
    const insertNutrition = database.prepare("INSERT INTO nutrition VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const insertSource = database.prepare("INSERT INTO sources VALUES (?, ?, ?, ?, ?)");
    const insertDecision = database.prepare("INSERT INTO rights_decisions VALUES (?, ?, ?, ?, ?)");
    const insertScenario = database.prepare("INSERT INTO scenarios VALUES (?, ?, ?, ?, ?, ?)");
    const insertMutation = database.prepare("INSERT INTO mutations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

    for (const ingredient of ingredients.ingredients) {
      insertIngredient.run(
        ingredient.ingredientId,
        ingredient.defaultState,
        ingredient.nutritionProvenanceId,
        compactJson(ingredient.nutritionPer100g),
        compactJson(ingredient.nutritionSource),
        compactJson(ingredient),
      );
    }
    for (const record of ingredients.conversionRecords) {
      insertConversion.run(record.recordId, record.ingredientId ?? null, record.unit, record.gramsPerUnit, record.basis, record.provenanceId);
    }
    const sourceIds = new Set(recipes.flatMap((recipe) => recipe.rights.sourceIds));
    for (const source of rightsRegistry.sources.filter((entry) => sourceIds.has(entry.id)).sort(byId)) {
      insertSource.run(source.id, source.title, source.publisherOrInstitution, source.rights.status, compactJson(source));
    }
    const decisionIds = new Set(recipes.flatMap((recipe) => recipe.rights.usageDecisionIds));
    for (const decision of rightsRegistry.decisions.filter((entry) => decisionIds.has(entry.id)).sort(byId)) {
      insertDecision.run(decision.id, decision.artifactId, decision.intendedUse, decision.decision, compactJson(decision));
    }
    for (const recipe of recipes) {
      insertRecipe.run(
        recipe.recipeId,
        recipe.artifactVersion,
        recipe.itemType,
        recipe.simulationProfile,
        recipe.servings,
        recipe.yield.amount,
        recipe.yield.unit,
        compactJson(toGodotRecipe(recipe)),
      );
      for (const portion of recipe.ingredientPortions) {
        insertPortion.run(
          recipe.recipeId,
          portion.portionId,
          portion.ingredientId,
          portion.initialState,
          portion.sourceQuantity.amount,
          portion.sourceQuantity.unit,
          portion.sourceQuantity.conversionRecordId,
          portion.massG,
          portion.volumeMl ?? null,
          portion.optional ? 1 : 0,
          portion.phase,
          portion.nutritionProvenanceId,
        );
        for (const replacementId of portion.allowedSubstitutionIngredientIds) {
          insertSubstitution.run(recipe.recipeId, portion.portionId, replacementId);
        }
      }
      for (const node of recipe.operationGraph.nodes) {
        insertOperation.run(
          recipe.recipeId,
          node.nodeId,
          node.operationType,
          node.equipmentId ?? null,
          node.activeDurationMs,
          node.waitDurationMs,
          compactJson(node.parameters),
          node.criticality,
          node.sourceStepOrder ?? null,
        );
        for (const dependency of [...node.dependsOn].sort()) insertDependency.run(recipe.recipeId, node.nodeId, dependency);
        for (const portionId of [...node.inputPortionIds].sort()) insertOperationInput.run(recipe.recipeId, node.nodeId, portionId);
        for (const stateId of [...node.outputStateIds].sort()) insertOperationOutput.run(recipe.recipeId, node.nodeId, stateId);
        for (const target of [...node.targetStates].sort((left, right) => left.dimension.localeCompare(right.dimension))) {
          insertTarget.run(recipe.recipeId, node.nodeId, target.dimension, target.minimum ?? null, target.maximum ?? null, target.unit);
        }
      }
      for (const [scope, nutrition] of [["total", recipe.nutritionProfile.total], ["per-serving", recipe.nutritionProfile.perServing]] as const) {
        insertNutrition.run(
          recipe.recipeId, scope, nutrition.calories, nutrition.protein, nutrition.fat, nutrition.saturatedFat,
          nutrition.carbs, nutrition.sugar, nutrition.addedSugar, nutrition.fiber, nutrition.sodium,
          compactJson(recipe.nutritionProfile.provenance),
        );
      }
      for (const scenario of recipe.scenarios) {
        insertScenario.run(recipe.recipeId, scenario.scenarioId, scenario.mutation.type, scenario.recoverability, scenario.nutritionEffect, compactJson(scenario));
        insertMutation.run(
          recipe.recipeId, scenario.scenarioId, scenario.mutation.type, scenario.mutation.targetNodeId ?? null,
          scenario.mutation.destinationBeforeNodeId ?? null, scenario.mutation.targetPortionId ?? null,
          scenario.mutation.scalar ?? null, scenario.mutation.replacementIngredientId ?? null,
          scenario.mutation.replacementEquipmentId ?? null,
        );
      }
    }
    database.exec("COMMIT");
    database.exec("VACUUM");
  } catch (error) {
    database.exec("ROLLBACK");
    database.close();
    throw error;
  }
  database.close();
  rmSync(path, { force: true });
  renameSync(temporaryPath, path);
}

function createExportNutritionDataset(
  dataset: GameNutritionDatasetSubsetV1,
  usedIngredientIds: ReadonlySet<string>,
): GameNutritionDatasetSubsetV1 {
  const records = dataset.records
    .filter((record) => usedIngredientIds.has(record.ingredientId))
    .sort((left, right) => left.ingredientId.localeCompare(right.ingredientId));
  const datasetVersions = new Set(records.map((record) => record.datasetVersion));
  return {
    ...dataset,
    upstreamArchives: dataset.upstreamArchives
      .filter((archive) => datasetVersions.has(archive.datasetVersion))
      .sort((left, right) => left.datasetVersion.localeCompare(right.datasetVersion)),
    records,
  };
}

function createRightsExport(
  registry: GameRightsRegistryV1,
  recipes: readonly GameRecipeV1[],
  usedArtifactIds: ReadonlySet<string>,
  usedSourceIds: ReadonlySet<string>,
): GameRightsRegistryV1 {
  const recipeIds = new Set(recipes.map((recipe) => recipe.recipeId));
  const usedEvidenceIds = new Set([
    ...recipes.flatMap((recipe) => recipe.rights.evidenceIds),
    ...registry.artifacts
      .filter((artifact) => usedArtifactIds.has(artifact.id))
      .flatMap((artifact) => artifact.evidenceIds),
  ]);
  const attestationIds = new Set(recipes.flatMap((recipe) => recipe.governance.reviewAttestationIds));
  const classificationIds = new Set(recipes.map((recipe) => recipe.governance.riskClassificationId));
  const samplingBatchIds = new Set(recipes.flatMap((recipe) => recipe.governance.samplingBatchId ? [recipe.governance.samplingBatchId] : []));
  return {
    schemaVersion: registry.schemaVersion,
    policyVersion: registry.policyVersion,
    artifacts: registry.artifacts.filter((entry) => usedArtifactIds.has(entry.id)).sort(byId),
    assessments: registry.assessments.filter((entry) => usedAssessmentIds(registry, usedArtifactIds).has(entry.id)).sort(byId),
    attributions: registry.attributions.filter((entry) => usedArtifactIds.has(entry.artifactId)).sort(byId),
    decisions: registry.decisions.filter((entry) => usedArtifactIds.has(entry.artifactId)).sort(byId),
    sources: registry.sources.filter((entry) => usedSourceIds.has(entry.id)).sort(byId),
    evidence: registry.evidence.filter((entry) => usedEvidenceIds.has(entry.id)).sort(byId),
    evidenceOrigins: registry.evidenceOrigins
      .filter((entry) => usedEvidenceIds.has(entry.evidenceId))
      .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
    sourceRoles: registry.sourceRoles
      .filter((entry) => usedSourceIds.has(entry.sourceId) && (!entry.recipeId || recipeIds.has(entry.recipeId)))
      .sort((left, right) => left.sourceId.localeCompare(right.sourceId) || left.role.localeCompare(right.role)),
    researchRecords: registry.researchRecords
      .filter((entry) => entry.subject.type === "game-recipe" && recipeIds.has(entry.subject.id))
      .sort(byId),
    governance: {
      policyVersion: registry.governance.policyVersion,
      attestations: registry.governance.attestations.filter((entry) => attestationIds.has(entry.id)).sort(byId),
      riskClassifications: registry.governance.riskClassifications.filter((entry) => classificationIds.has(entry.id)).sort(byId),
      samplingBatches: registry.governance.samplingBatches.filter((entry) => samplingBatchIds.has(entry.id)).sort(byId),
    },
  };
}

function assertRuntimeBuildInput(input: GameDataBuildInput) {
  input.recipes.forEach((recipe, index) => parseGameRecipe(recipe, `build.recipes[${index}]`));
  parseGameIngredientCatalog(input.ingredients, "build.ingredients");
  parseGameNutritionDataset(input.nutritionDataset, "build.nutritionDataset");
  parseGameOperationCatalog({ version: "cooking-lab-game-operations-v1", operations: input.operations }, "build.operations");
  parseGameRightsRegistry(input.rightsRegistry, "build.rightsRegistry");
  if (input.normalizationRegistry) parseGameNormalizationRegistry(input.normalizationRegistry, "build.normalizationRegistry");
  input.sourceFactBundles?.forEach((bundle, index) => parseGameSourceFactBundle(bundle, `build.sourceFactBundles[${index}]`));
  if (input.locSourceRegistry) parseLocSourceRegistry(input.locSourceRegistry);
  if (input.locSourceCacheManifest) parseLocSourceCacheManifest(input.locSourceCacheManifest);
}

function verifyExportParity(
  root: string,
  expectedManifest: GameDataManifestV1,
  recipes: readonly GameRecipeV1[],
) {
  const manifestContent = readFileSync(resolve(root, "manifest.json"), "utf8");
  const manifest = parseGameDataManifest(JSON.parse(manifestContent) as unknown, "manifest.json");
  if (stableJson(manifest) !== stableJson(expectedManifest)) throw new Error("Generated manifest does not match the in-memory manifest");
  const supporting = [manifest.ingredientCatalog, manifest.nutritionDataset, manifest.operationCatalog, manifest.rightsRegistry, manifest.attribution];
  for (const artifact of supporting) {
    const content = readFileSync(resolveManifestArtifact(root, artifact.path), "utf8");
    if (sha256(content) !== artifact.sha256) throw new Error(`Generated artifact hash mismatch: ${artifact.path}`);
  }
  const parsedIngredients = parseGameIngredientCatalog(JSON.parse(readFileSync(resolveManifestArtifact(root, manifest.ingredientCatalog.path), "utf8")) as unknown, manifest.ingredientCatalog.path);
  parseGameNutritionDataset(JSON.parse(readFileSync(resolveManifestArtifact(root, manifest.nutritionDataset.path), "utf8")) as unknown, manifest.nutritionDataset.path);
  parseGameOperationCatalog(JSON.parse(readFileSync(resolveManifestArtifact(root, manifest.operationCatalog.path), "utf8")) as unknown, manifest.operationCatalog.path);
  const parsedRights = parseGameRightsRegistry(JSON.parse(readFileSync(resolveManifestArtifact(root, manifest.rightsRegistry.path), "utf8")) as unknown, manifest.rightsRegistry.path);
  const databasePath = resolveManifestArtifact(root, manifest.sqlite.path);
  if (sha256(readFileSync(databasePath)) !== manifest.sqlite.sha256) throw new Error(`Generated artifact hash mismatch: ${manifest.sqlite.path}`);

  const parsedRecipes: GodotGameRecipeV1[] = [];
  const recipeById = new Map(recipes.map((recipe) => [recipe.recipeId, recipe]));
  for (const entry of manifest.recipes) {
    const content = readFileSync(resolveManifestArtifact(root, entry.path), "utf8");
    if (sha256(content) !== entry.sha256) throw new Error(`Generated recipe hash mismatch: ${entry.recipeId}`);
    const parsed = parseGodotGameRecipe(JSON.parse(content) as unknown, entry.path);
    const expected = recipeById.get(entry.recipeId);
    if (!expected || stableJson(parsed) !== stableJson(toGodotRecipe(expected))) {
      throw new Error(`Godot recipe does not match canonical recipe: ${entry.recipeId}`);
    }
    parsedRecipes.push(parsed);
  }

  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    assertSqliteRows(database, "recipes", "SELECT recipe_id, artifact_version, item_type, simulation_profile, servings, yield_amount, yield_unit, recipe_json FROM recipes ORDER BY recipe_id", parsedRecipes.map((recipe) => ({
      recipe_id: recipe.recipeId,
      artifact_version: recipe.artifactVersion,
      item_type: recipe.itemType,
      simulation_profile: recipe.simulationProfile,
      servings: recipe.servings,
      yield_amount: recipe.yield.amount,
      yield_unit: recipe.yield.unit,
      recipe_json: compactJson(recipe),
    })));
    assertSqliteRows(database, "ingredients", "SELECT ingredient_id, default_state, nutrition_provenance_id, nutrition_json, source_json, definition_json FROM ingredients ORDER BY ingredient_id", parsedIngredients.ingredients.map((ingredient) => ({
      ingredient_id: ingredient.ingredientId,
      default_state: ingredient.defaultState,
      nutrition_provenance_id: ingredient.nutritionProvenanceId,
      nutrition_json: compactJson(ingredient.nutritionPer100g),
      source_json: compactJson(ingredient.nutritionSource),
      definition_json: compactJson(ingredient),
    })));
    assertSqliteRows(database, "unit_conversions", "SELECT record_id, ingredient_id, unit, grams_per_unit, basis, provenance_id FROM unit_conversions ORDER BY record_id", parsedIngredients.conversionRecords.map((record) => ({
      record_id: record.recordId,
      ingredient_id: record.ingredientId ?? null,
      unit: record.unit,
      grams_per_unit: record.gramsPerUnit,
      basis: record.basis,
      provenance_id: record.provenanceId,
    })));
    assertSqliteRows(database, "recipe_ingredients", "SELECT recipe_id, portion_id, ingredient_id, initial_state, source_amount, source_unit, conversion_record_id, mass_g, volume_ml, optional, phase, nutrition_provenance_id FROM recipe_ingredients ORDER BY recipe_id, portion_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.ingredientPortions.map((portion) => ({
      recipe_id: recipe.recipeId,
      portion_id: portion.portionId,
      ingredient_id: portion.ingredientId,
      initial_state: portion.initialState,
      source_amount: portion.sourceQuantity.amount,
      source_unit: portion.sourceQuantity.unit,
      conversion_record_id: portion.sourceQuantity.conversionRecordId,
      mass_g: portion.massG,
      volume_ml: portion.volumeMl ?? null,
      optional: portion.optional ? 1 : 0,
      phase: portion.phase,
      nutrition_provenance_id: portion.nutritionProvenanceId,
    }))), (row) => `${row.recipe_id}\0${row.portion_id}`));
    assertSqliteRows(database, "ingredient_substitutions", "SELECT recipe_id, portion_id, replacement_ingredient_id FROM ingredient_substitutions ORDER BY recipe_id, portion_id, replacement_ingredient_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.ingredientPortions.flatMap((portion) => portion.allowedSubstitutionIngredientIds.map((replacementId) => ({
      recipe_id: recipe.recipeId,
      portion_id: portion.portionId,
      replacement_ingredient_id: replacementId,
    })))), rowKey));
    assertSqliteRows(database, "operations", "SELECT recipe_id, node_id, operation_type, equipment_id, active_duration_ms, wait_duration_ms, parameters_json, criticality, source_step_order FROM operations ORDER BY recipe_id, node_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.operationGraph.nodes.map((node) => ({
      recipe_id: recipe.recipeId,
      node_id: node.nodeId,
      operation_type: node.operationType,
      equipment_id: node.equipmentId ?? null,
      active_duration_ms: node.activeDurationMs,
      wait_duration_ms: node.waitDurationMs,
      parameters_json: compactJson(node.parameters),
      criticality: node.criticality,
      source_step_order: node.sourceStepOrder ?? null,
    }))), (row) => `${row.recipe_id}\0${row.node_id}`));
    assertSqliteRows(database, "operation_dependencies", "SELECT recipe_id, node_id, depends_on_node_id FROM operation_dependencies ORDER BY recipe_id, node_id, depends_on_node_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.operationGraph.nodes.flatMap((node) => node.dependsOn.map((dependency) => ({ recipe_id: recipe.recipeId, node_id: node.nodeId, depends_on_node_id: dependency })))), rowKey));
    assertSqliteRows(database, "operation_inputs", "SELECT recipe_id, node_id, portion_id FROM operation_inputs ORDER BY recipe_id, node_id, portion_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.operationGraph.nodes.flatMap((node) => node.inputPortionIds.map((portionId) => ({ recipe_id: recipe.recipeId, node_id: node.nodeId, portion_id: portionId })))), rowKey));
    assertSqliteRows(database, "operation_outputs", "SELECT recipe_id, node_id, state_id FROM operation_outputs ORDER BY recipe_id, node_id, state_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.operationGraph.nodes.flatMap((node) => node.outputStateIds.map((stateId) => ({ recipe_id: recipe.recipeId, node_id: node.nodeId, state_id: stateId })))), rowKey));
    assertSqliteRows(database, "target_states", "SELECT recipe_id, node_id, dimension, minimum, maximum, unit FROM target_states ORDER BY recipe_id, node_id, dimension", sortedRows(parsedRecipes.flatMap((recipe) => recipe.operationGraph.nodes.flatMap((node) => node.targetStates.map((target) => ({
      recipe_id: recipe.recipeId,
      node_id: node.nodeId,
      dimension: target.dimension,
      minimum: target.minimum ?? null,
      maximum: target.maximum ?? null,
      unit: target.unit,
    })))), rowKey));
    assertSqliteRows(database, "nutrition", "SELECT recipe_id, scope, calories, protein, fat, saturated_fat, carbs, sugar, added_sugar, fiber, sodium, provenance_json FROM nutrition ORDER BY recipe_id, scope", sortedRows(parsedRecipes.flatMap((recipe) => ([
      { recipe_id: recipe.recipeId, scope: "total", nutrition: recipe.nutritionProfile.total },
      { recipe_id: recipe.recipeId, scope: "per-serving", nutrition: recipe.nutritionProfile.perServing },
    ] as const).map(({ scope, nutrition }) => ({
      recipe_id: recipe.recipeId,
      scope,
      calories: nutrition.calories,
      protein: nutrition.protein,
      fat: nutrition.fat,
      saturated_fat: nutrition.saturatedFat,
      carbs: nutrition.carbs,
      sugar: nutrition.sugar,
      added_sugar: nutrition.addedSugar,
      fiber: nutrition.fiber,
      sodium: nutrition.sodium,
      provenance_json: compactJson(recipe.nutritionProfile.provenance),
    }))), rowKey));
    assertSqliteRows(database, "sources", "SELECT source_id, title, institution, rights_status, source_json FROM sources ORDER BY source_id", parsedRights.sources.map((source) => ({
      source_id: source.id,
      title: source.title,
      institution: source.publisherOrInstitution,
      rights_status: source.rights.status,
      source_json: compactJson(source),
    })));
    assertSqliteRows(database, "rights_decisions", "SELECT decision_id, artifact_id, intended_use, decision, decision_json FROM rights_decisions ORDER BY decision_id", parsedRights.decisions.map((decision) => ({
      decision_id: decision.id,
      artifact_id: decision.artifactId,
      intended_use: decision.intendedUse,
      decision: decision.decision,
      decision_json: compactJson(decision),
    })));
    assertSqliteRows(database, "scenarios", "SELECT recipe_id, scenario_id, mutation_type, recoverability, nutrition_effect, scenario_json FROM scenarios ORDER BY recipe_id, scenario_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.scenarios.map((scenario) => ({
      recipe_id: recipe.recipeId,
      scenario_id: scenario.scenarioId,
      mutation_type: scenario.mutation.type,
      recoverability: scenario.recoverability,
      nutrition_effect: scenario.nutritionEffect,
      scenario_json: compactJson(scenario),
    }))), rowKey));
    assertSqliteRows(database, "mutations", "SELECT recipe_id, scenario_id, mutation_type, target_node_id, destination_before_node_id, target_portion_id, scalar, replacement_ingredient_id, replacement_equipment_id FROM mutations ORDER BY recipe_id, scenario_id", sortedRows(parsedRecipes.flatMap((recipe) => recipe.scenarios.map((scenario) => ({
      recipe_id: recipe.recipeId,
      scenario_id: scenario.scenarioId,
      mutation_type: scenario.mutation.type,
      target_node_id: scenario.mutation.targetNodeId ?? null,
      destination_before_node_id: scenario.mutation.destinationBeforeNodeId ?? null,
      target_portion_id: scenario.mutation.targetPortionId ?? null,
      scalar: scenario.mutation.scalar ?? null,
      replacement_ingredient_id: scenario.mutation.replacementIngredientId ?? null,
      replacement_equipment_id: scenario.mutation.replacementEquipmentId ?? null,
    }))), rowKey));
  } finally {
    database.close();
  }
}

function assertSqliteRows(database: DatabaseSync, table: string, query: string, expected: readonly Record<string, unknown>[]) {
  const actual = database.prepare(query).all() as Record<string, unknown>[];
  if (stableJson(actual) !== stableJson(expected)) throw new Error(`SQLite ${table} rows do not match canonical export`);
}

function sortedRows<T>(rows: readonly T[], key: (row: T) => string): T[] {
  return [...rows].sort((left, right) => key(left).localeCompare(key(right)));
}

function rowKey(row: Record<string, unknown>): string {
  return Object.values(row).join("\0");
}

function resolveManifestArtifact(root: string, artifactPath: string): string {
  parseGameDataArtifactPath(artifactPath, "manifest artifact path");
  const resolvedPath = resolve(root, artifactPath);
  if (!isDescendant(root, resolvedPath)) throw new Error(`Manifest artifact path escapes export root: ${artifactPath}`);
  return resolvedPath;
}

function replaceDirectory(stagingDirectory: string, targetDirectory: string) {
  const backupDirectory = resolve(dirname(targetDirectory), `.${basename(targetDirectory)}.backup`);
  if (existsSync(backupDirectory)) {
    if (existsSync(targetDirectory)) rmSync(backupDirectory, { recursive: true, force: true });
    else renameSync(backupDirectory, targetDirectory);
  }
  if (existsSync(targetDirectory)) renameSync(targetDirectory, backupDirectory);
  try {
    renameSync(stagingDirectory, targetDirectory);
    rmSync(backupDirectory, { recursive: true, force: true });
  } catch (error) {
    if (existsSync(backupDirectory) && !existsSync(targetDirectory)) renameSync(backupDirectory, targetDirectory);
    throw error;
  }
}

function sourceAttribution(source: Source) {
  return {
    id: source.id,
    title: source.title,
    institution: source.publisherOrInstitution,
    authors: source.authorNames,
    locators: source.locators,
    rights: source.rights,
  };
}

function writeArtifact(root: string, relativePath: string, content: string) {
  const path = resolve(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function usedAssessmentIds(registry: GameRightsRegistryV1, artifactIds: ReadonlySet<string>): Set<string> {
  const decisions = registry.decisions.filter((entry) => artifactIds.has(entry.artifactId));
  const artifacts = registry.artifacts.filter((entry) => artifactIds.has(entry.id));
  return new Set([
    ...artifacts.map((artifact) => artifact.rightsAssessmentId),
    ...decisions.flatMap((decision) => decision.assessmentIds),
  ]);
}

export function assertSafeGameDataOutputDirectory(outputDirectory: string): string {
  const target = resolve(outputDirectory);
  const projectGeneratedRoot = resolve(process.cwd(), ".local");
  const temporaryRoot = realpathSync(tmpdir());
  const temporaryContainer = dirname(target);
  const withinProjectGeneratedRoot = isDescendant(projectGeneratedRoot, target);
  const withinDedicatedTemporaryContainer = isDescendant(temporaryRoot, temporaryContainer)
    && basename(temporaryContainer).startsWith("cooking-lab-game-")
    && isDescendant(temporaryContainer, target);
  const forbidden = new Set([
    resolve("/"),
    resolve(process.cwd()),
    resolve(homedir()),
    projectGeneratedRoot,
    temporaryRoot,
    temporaryContainer,
  ]);
  if (forbidden.has(target) || (!withinProjectGeneratedRoot && !withinDedicatedTemporaryContainer)) {
    throw new Error(`Refusing unsafe game-data output directory: ${target}`);
  }
  assertNoSymlinkComponents(target);
  return target;
}

function assertNoSymlinkComponents(target: string) {
  let current = target;
  while (true) {
    try {
      if (lstatSync(current).isSymbolicLink()) {
        throw new Error(`Refusing symlinked game-data output path: ${current}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function isDescendant(root: string, target: string): boolean {
  const path = relative(root, target);
  return path.length > 0 && path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function compactJson(value: unknown): string {
  return stableJson(value).trimEnd();
}

function sha256(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}
