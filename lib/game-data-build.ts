import { createHash } from "node:crypto";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Source } from "@/types/culinary";
import type {
  GameDataManifestV1,
  GameIngredientCatalogV1,
  GameOperationDefinitionV1,
  GameRecipeV1,
  GameRightsRegistryV1,
} from "@/types/game-recipe";
import { assertGameRecipeCorpusReady, evaluateGameRecipeCorpus } from "./game-recipe-validation";
import { stableJson } from "./stable-json";

export interface GameDataBuildInput {
  recipes: readonly GameRecipeV1[];
  ingredients: GameIngredientCatalogV1;
  operations: readonly GameOperationDefinitionV1[];
  rightsRegistry: GameRightsRegistryV1;
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
  const canonicalAudit = evaluateGameRecipeCorpus(input.recipes, {
    operations: input.operations,
    ingredients: input.ingredients,
    rightsRegistry: input.rightsRegistry,
    now: input.now,
  });
  if (canonicalAudit.issues.length) {
    throw new Error(`Game canonical data is invalid: ${canonicalAudit.issues.map((issue) => `${issue.code}:${issue.recipeId}:${issue.field}`).join("; ")}`);
  }
  const exportable = input.recipes
    .filter((recipe) => recipe.eligibility === "exportable")
    .sort((left, right) => left.recipeId.localeCompare(right.recipeId));
  assertGameRecipeCorpusReady(exportable, {
    operations: input.operations,
    ingredients: input.ingredients,
    rightsRegistry: input.rightsRegistry,
    now: input.now,
  });

  const usedIngredientIds = new Set(exportable.flatMap((recipe) => recipe.ingredientPortions.map((portion) => portion.ingredientId)));
  const exportIngredients: GameIngredientCatalogV1 = {
    ...input.ingredients,
    ingredients: input.ingredients.ingredients
      .filter((ingredient) => usedIngredientIds.has(ingredient.ingredientId))
      .sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
  };
  const usedArtifactIds = new Set(exportable.flatMap((recipe) => recipe.rights.artifactIds));
  const usedSourceIds = new Set(exportable.flatMap((recipe) => recipe.rights.sourceIds));
  const attribution = {
    schemaVersion: "cooking-lab-game-attribution-v1",
    generatedAt: input.now,
    sources: input.rightsRegistry.sources.filter((source) => usedSourceIds.has(source.id)).sort(byId).map(sourceAttribution),
    requirements: input.rightsRegistry.attributions.filter((entry) => usedArtifactIds.has(entry.artifactId)).sort(byId),
  };
  const rightsExport = {
    schemaVersion: input.rightsRegistry.schemaVersion,
    policyVersion: input.rightsRegistry.policyVersion,
    artifacts: input.rightsRegistry.artifacts.filter((entry) => usedArtifactIds.has(entry.id)).sort(byId),
    decisions: input.rightsRegistry.decisions.filter((entry) => usedArtifactIds.has(entry.artifactId)).sort(byId),
  };

  rmSync(outputDirectory, { recursive: true, force: true });
  const recipeDirectory = resolve(outputDirectory, "godot/recipes");
  mkdirSync(recipeDirectory, { recursive: true });
  const recipeEntries: GameDataManifestV1["recipes"] = [];
  for (const recipe of exportable) {
    const relativePath = `godot/recipes/${recipe.recipeId}.json`;
    const content = stableJson(toGodotRecipe(recipe));
    writeFileSync(resolve(outputDirectory, relativePath), content);
    recipeEntries.push({
      recipeId: recipe.recipeId,
      path: relativePath,
      sha256: sha256(content),
      artifactVersion: recipe.artifactVersion,
      simulationProfile: recipe.simulationProfile,
    });
  }
  const ingredientPath = "godot/ingredients.json";
  const operationPath = "godot/operations.json";
  const attributionPath = "attribution.json";
  const rightsPath = "rights-registry.json";
  const ingredientContent = stableJson(exportIngredients);
  const operationContent = stableJson({
    version: "cooking-lab-game-operations-v1",
    operations: input.operations,
  });
  const attributionContent = stableJson(attribution);
  const rightsContent = stableJson(rightsExport);
  writeArtifact(outputDirectory, ingredientPath, ingredientContent);
  writeArtifact(outputDirectory, operationPath, operationContent);
  writeArtifact(outputDirectory, attributionPath, attributionContent);
  writeArtifact(outputDirectory, rightsPath, rightsContent);

  const manifest: GameDataManifestV1 = {
    schemaVersion: "cooking-lab-game-manifest-v1",
    catalogVersion: exportIngredients.catalogVersion,
    generatorVersion: "cooking-lab-game-data-build-v1",
    minimumAdapterVersion: "cat-kitchen-game-data-adapter-v1",
    recipeCount: exportable.length,
    recipes: recipeEntries,
    ingredientCatalog: { path: ingredientPath, sha256: sha256(ingredientContent) },
    operationCatalog: {
      path: operationPath,
      sha256: sha256(operationContent),
      version: "cooking-lab-game-operations-v1",
    },
    rightsRegistry: {
      path: rightsPath,
      sha256: sha256(rightsContent),
      version: "cooking-lab-game-rights-v1",
    },
    attribution: { path: attributionPath, sha256: sha256(attributionContent) },
  };
  writeFileSync(resolve(outputDirectory, "manifest.json"), stableJson(manifest));

  const sqlitePath = resolve(outputDirectory, "game-data.sqlite");
  writeSqlite(sqlitePath, exportable, exportIngredients, input.rightsRegistry);
  const auditReportPath = resolve(outputDirectory, "audit.md");
  writeFileSync(auditReportPath, createGameDataAuditReport(input, exportable));
  return { manifest, outputDirectory, sqlitePath, auditReportPath };
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

function toGodotRecipe(recipe: GameRecipeV1) {
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
    CREATE TABLE recipes (recipe_id TEXT PRIMARY KEY, artifact_version TEXT NOT NULL, item_type TEXT NOT NULL, simulation_profile TEXT NOT NULL, servings REAL NOT NULL, yield_amount REAL NOT NULL, yield_unit TEXT NOT NULL);
    CREATE TABLE ingredients (ingredient_id TEXT PRIMARY KEY, default_state TEXT NOT NULL, nutrition_provenance_id TEXT NOT NULL, nutrition_json TEXT NOT NULL, source_json TEXT NOT NULL);
    CREATE TABLE recipe_ingredients (recipe_id TEXT NOT NULL, portion_id TEXT NOT NULL, ingredient_id TEXT NOT NULL, mass_g REAL NOT NULL, volume_ml REAL, optional INTEGER NOT NULL, phase TEXT NOT NULL, PRIMARY KEY (recipe_id, portion_id));
    CREATE TABLE operations (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, operation_type TEXT NOT NULL, equipment_id TEXT, active_duration_ms INTEGER NOT NULL, wait_duration_ms INTEGER NOT NULL, parameters_json TEXT NOT NULL, criticality TEXT NOT NULL, PRIMARY KEY (recipe_id, node_id));
    CREATE TABLE operation_dependencies (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, depends_on_node_id TEXT NOT NULL, PRIMARY KEY (recipe_id, node_id, depends_on_node_id));
    CREATE TABLE target_states (recipe_id TEXT NOT NULL, node_id TEXT NOT NULL, dimension TEXT NOT NULL, minimum REAL, maximum REAL, unit TEXT NOT NULL, PRIMARY KEY (recipe_id, node_id, dimension));
    CREATE TABLE nutrition (recipe_id TEXT NOT NULL, scope TEXT NOT NULL, calories REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, saturated_fat REAL NOT NULL, carbs REAL NOT NULL, sugar REAL NOT NULL, added_sugar REAL NOT NULL, fiber REAL NOT NULL, sodium REAL NOT NULL, provenance_json TEXT NOT NULL, PRIMARY KEY (recipe_id, scope));
    CREATE TABLE sources (source_id TEXT PRIMARY KEY, title TEXT NOT NULL, institution TEXT NOT NULL, rights_status TEXT NOT NULL, source_json TEXT NOT NULL);
    CREATE TABLE rights_decisions (decision_id TEXT PRIMARY KEY, artifact_id TEXT NOT NULL, intended_use TEXT NOT NULL, decision TEXT NOT NULL, decision_json TEXT NOT NULL);
    CREATE TABLE scenarios (recipe_id TEXT NOT NULL, scenario_id TEXT NOT NULL, mutation_type TEXT NOT NULL, recoverability TEXT NOT NULL, nutrition_effect TEXT NOT NULL, scenario_json TEXT NOT NULL, PRIMARY KEY (recipe_id, scenario_id));
    CREATE TABLE mutations (recipe_id TEXT NOT NULL, scenario_id TEXT NOT NULL, mutation_type TEXT NOT NULL, target_node_id TEXT, target_portion_id TEXT, scalar REAL, replacement_ingredient_id TEXT, PRIMARY KEY (recipe_id, scenario_id));
  `);
  database.exec("BEGIN IMMEDIATE");
  try {
    const insertRecipe = database.prepare("INSERT INTO recipes VALUES (?, ?, ?, ?, ?, ?, ?)");
    const insertIngredient = database.prepare("INSERT INTO ingredients VALUES (?, ?, ?, ?, ?)");
    const insertPortion = database.prepare("INSERT INTO recipe_ingredients VALUES (?, ?, ?, ?, ?, ?, ?)");
    const insertOperation = database.prepare("INSERT INTO operations VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const insertDependency = database.prepare("INSERT INTO operation_dependencies VALUES (?, ?, ?)");
    const insertTarget = database.prepare("INSERT INTO target_states VALUES (?, ?, ?, ?, ?, ?)");
    const insertNutrition = database.prepare("INSERT INTO nutrition VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const insertSource = database.prepare("INSERT INTO sources VALUES (?, ?, ?, ?, ?)");
    const insertDecision = database.prepare("INSERT INTO rights_decisions VALUES (?, ?, ?, ?, ?)");
    const insertScenario = database.prepare("INSERT INTO scenarios VALUES (?, ?, ?, ?, ?, ?)");
    const insertMutation = database.prepare("INSERT INTO mutations VALUES (?, ?, ?, ?, ?, ?, ?)");

    for (const ingredient of ingredients.ingredients) {
      insertIngredient.run(ingredient.ingredientId, ingredient.defaultState, ingredient.nutritionProvenanceId, compactJson(ingredient.nutritionPer100g), compactJson(ingredient.nutritionSource));
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
      insertRecipe.run(recipe.recipeId, recipe.artifactVersion, recipe.itemType, recipe.simulationProfile, recipe.servings, recipe.yield.amount, recipe.yield.unit);
      for (const portion of recipe.ingredientPortions) {
        insertPortion.run(recipe.recipeId, portion.portionId, portion.ingredientId, portion.massG, portion.volumeMl ?? null, portion.optional ? 1 : 0, portion.phase);
      }
      for (const node of recipe.operationGraph.nodes) {
        insertOperation.run(recipe.recipeId, node.nodeId, node.operationType, node.equipmentId ?? null, node.activeDurationMs, node.waitDurationMs, compactJson(node.parameters), node.criticality);
        for (const dependency of [...node.dependsOn].sort()) insertDependency.run(recipe.recipeId, node.nodeId, dependency);
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
          scenario.mutation.targetPortionId ?? null, scenario.mutation.scalar ?? null, scenario.mutation.replacementIngredientId ?? null,
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

function compactJson(value: unknown): string {
  return stableJson(value).trimEnd();
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}
