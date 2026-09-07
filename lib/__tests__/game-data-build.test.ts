import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { createM13DraftCorpus } from "@/game-data/corpus-generator";
import { buildGameData, createGameDataCatalogVersion } from "@/lib/game-data-build";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import { createGameArtifactSetVersion, deriveGameEquivalenceClassKeys } from "@/lib/game-recipe-validation";
import { createSamplingBatchEvidenceDigest } from "@/lib/publishing-governance";
import { stableJson } from "@/lib/stable-json";
import type { GameIngredientCatalogV1, GameNutritionDatasetSubsetV1, GameOperationDefinitionV1, GameRecipeV1, GameRightsRegistryV1 } from "@/types/game-recipe";
import type { ReviewDimension } from "@/types/publishing-governance";

describe("M12 deterministic game exports", () => {
  it("builds byte-stable Godot JSON, SQLite, rights and attribution from one canonical source", () => {
    const source = loadCanonicalGameData();
    const generated = createM13DraftCorpus(source.nutritionDataset, source.ingredients);
    const fixtureIngredients = {
      ...generated.ingredients,
      ingredients: [...new Map(generated.ingredients.ingredients.map((ingredient) => [ingredient.ingredientId, ingredient])).values()],
    };
    const recipe = structuredClone(generated.recipes[0]) as GameRecipeV1;
    const registry = structuredClone(generated.rightsRegistry);
    promoteFixture(recipe, registry, fixtureIngredients, source.nutritionDataset, gameOperationCatalog);
    const rootA = resolve(mkdtempSync(resolve(realpathSync(tmpdir()), "cooking-lab-game-a-")), "output");
    const rootB = resolve(mkdtempSync(resolve(realpathSync(tmpdir()), "cooking-lab-game-b-")), "output");
    const buildA = buildGameData({
      recipes: [recipe],
      ingredients: fixtureIngredients,
      nutritionDataset: source.nutritionDataset,
      operations: gameOperationCatalog,
      rightsRegistry: registry,
      now: "2026-09-08",
    }, rootA);
    buildGameData({
      recipes: [recipe],
      ingredients: fixtureIngredients,
      nutritionDataset: source.nutritionDataset,
      operations: gameOperationCatalog,
      rightsRegistry: registry,
      now: "2026-09-08",
    }, rootB);

    expect(buildA.manifest.recipeCount).toBe(1);
    expect(buildA.manifest.rightsSummary).toMatchObject({
      intendedUse: "game-commercial-ready",
      artifactCount: 4,
      decisionCount: 4,
      sourceCount: 2,
    });
    expect(buildA.manifest.reviewSummary).toMatchObject({
      riskCounts: { low: 1, medium: 0, high: 0 },
      reviewedRecipeCount: 1,
    });
    expect(buildA.manifest.sqlite).toEqual({
      path: "game-data.sqlite",
      sha256: createHash("sha256").update(readFileSync(buildA.sqlitePath)).digest("hex"),
    });
    expect(fileMap(rootA)).toEqual(fileMap(rootB));
    const database = new DatabaseSync(buildA.sqlitePath, { readOnly: true });
    expect(database.prepare("SELECT COUNT(*) AS count FROM recipes").get()).toEqual({ count: 1 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM recipe_ingredients").get()).toEqual({ count: recipe.ingredientPortions.length });
    expect(database.prepare("SELECT COUNT(*) AS count FROM operations").get()).toEqual({ count: recipe.operationGraph.nodes.length });
    expect(database.prepare("SELECT COUNT(*) AS count FROM operation_inputs").get()).toEqual({ count: recipe.operationGraph.nodes.reduce((sum, node) => sum + node.inputPortionIds.length, 0) });
    expect(database.prepare("SELECT COUNT(*) AS count FROM operation_outputs").get()).toEqual({ count: recipe.operationGraph.nodes.reduce((sum, node) => sum + node.outputStateIds.length, 0) });
    expect(database.prepare("SELECT COUNT(*) AS count FROM scenarios").get()).toEqual({ count: recipe.scenarios.length });
    expect(database.prepare("SELECT mutation_type, target_node_id, destination_before_node_id, target_portion_id, scalar, replacement_ingredient_id, replacement_equipment_id FROM mutations WHERE recipe_id = ? ORDER BY scenario_id").all(recipe.recipeId)).toEqual(
      [...recipe.scenarios].sort((left, right) => left.scenarioId.localeCompare(right.scenarioId)).map((scenario) => ({
        mutation_type: scenario.mutation.type,
        target_node_id: scenario.mutation.targetNodeId ?? null,
        destination_before_node_id: scenario.mutation.destinationBeforeNodeId ?? null,
        target_portion_id: scenario.mutation.targetPortionId ?? null,
        scalar: scenario.mutation.scalar ?? null,
        replacement_ingredient_id: scenario.mutation.replacementIngredientId ?? null,
        replacement_equipment_id: scenario.mutation.replacementEquipmentId ?? null,
      })),
    );
    expect(database.prepare("SELECT COUNT(*) AS count FROM rights_decisions").get()).toEqual({ count: 4 });
    expect(database.prepare("SELECT portion_id, ingredient_id, initial_state, mass_g, volume_ml, optional, phase, nutrition_provenance_id FROM recipe_ingredients WHERE recipe_id = ? ORDER BY portion_id").all(recipe.recipeId)).toEqual(
      [...recipe.ingredientPortions].sort((left, right) => left.portionId.localeCompare(right.portionId)).map((portion) => ({
        portion_id: portion.portionId,
        ingredient_id: portion.ingredientId,
        initial_state: portion.initialState,
        mass_g: portion.massG,
        volume_ml: portion.volumeMl ?? null,
        optional: portion.optional ? 1 : 0,
        phase: portion.phase,
        nutrition_provenance_id: portion.nutritionProvenanceId,
      })),
    );
    expect(database.prepare("SELECT node_id, operation_type, equipment_id, active_duration_ms, wait_duration_ms, parameters_json, criticality, source_step_order FROM operations WHERE recipe_id = ? ORDER BY node_id").all(recipe.recipeId)).toEqual(
      [...recipe.operationGraph.nodes].sort((left, right) => left.nodeId.localeCompare(right.nodeId)).map((node) => ({
        node_id: node.nodeId,
        operation_type: node.operationType,
        equipment_id: node.equipmentId ?? null,
        active_duration_ms: node.activeDurationMs,
        wait_duration_ms: node.waitDurationMs,
        parameters_json: stableJson(node.parameters).trimEnd(),
        criticality: node.criticality,
        source_step_order: node.sourceStepOrder ?? null,
      })),
    );
    database.close();
  }, 20_000);

  it("content-addresses recipe and every supporting artifact hash", () => {
    const recipes = [{
      recipeId: "fixture",
      path: "godot/recipes/fixture.json",
      sha256: "recipe-a",
      artifactVersion: "artifact-a",
      simulationProfile: "requires-cat-kitchen-v2" as const,
    }];
    const supporting = {
      ingredientCatalog: "ingredients-a",
      nutritionDataset: "nutrition-a",
      operationCatalog: "operations-a",
      rightsRegistry: "rights-a",
      attribution: "attribution-a",
      sqlite: "sqlite-a",
    };
    const baseline = createGameDataCatalogVersion(recipes, supporting);
    expect(createGameDataCatalogVersion([{ ...recipes[0], sha256: "recipe-b" }], supporting)).not.toBe(baseline);
    for (const key of Object.keys(supporting) as Array<keyof typeof supporting>) {
      expect(createGameDataCatalogVersion(recipes, { ...supporting, [key]: `${supporting[key]}-changed` })).not.toBe(baseline);
    }
    expect(createGameDataCatalogVersion(recipes, supporting)).toBe(baseline);
  });

  it("refuses broad destructive output targets", () => {
    const source = loadCanonicalGameData();
    expect(() => buildGameData({
      recipes: [],
      ingredients: source.ingredients,
      nutritionDataset: source.nutritionDataset,
      operations: gameOperationCatalog,
      rightsRegistry: source.rightsRegistry,
      now: "2026-09-08",
    }, process.cwd())).toThrow(/unsafe game-data output directory/);
  });

  it("refuses a symlinked output path component", () => {
    const source = loadCanonicalGameData();
    const external = mkdtempSync(resolve(realpathSync(tmpdir()), "cooking-lab-game-external-"));
    const symlinkContainer = mkdtempSync(resolve(realpathSync(tmpdir()), "cooking-lab-game-symlink-"));
    rmSync(symlinkContainer, { recursive: true });
    symlinkSync(external, symlinkContainer, "dir");
    try {
      expect(() => buildGameData({
        recipes: source.recipes,
        ingredients: source.ingredients,
        nutritionDataset: source.nutritionDataset,
        operations: gameOperationCatalog,
        rightsRegistry: source.rightsRegistry,
        now: "2026-09-08",
      }, resolve(symlinkContainer, "output"))).toThrow(/symlinked game-data output path/);
    } finally {
      rmSync(symlinkContainer, { force: true });
      rmSync(external, { recursive: true, force: true });
    }
  });

  it("fails closed with a clear reason when no recipe is exportable", () => {
    const source = loadCanonicalGameData();
    const output = resolve(mkdtempSync(resolve(realpathSync(tmpdir()), "cooking-lab-game-empty-")), "output");
    expect(() => buildGameData({
      recipes: source.recipes,
      ingredients: source.ingredients,
      nutritionDataset: source.nutritionDataset,
      operations: gameOperationCatalog,
      rightsRegistry: source.rightsRegistry,
      now: "2026-09-08",
    }, output)).toThrow("Game data gate blocked export: no exportable recipes");
  });
});

function promoteFixture(
  recipe: GameRecipeV1,
  registry: GameRightsRegistryV1,
  ingredients: GameIngredientCatalogV1,
  nutritionDataset: GameNutritionDatasetSubsetV1,
  operations: readonly GameOperationDefinitionV1[],
) {
  const dimensions: ReviewDimension[] = ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"];
  const attestationIds = dimensions.map((dimension) => `fixture-attestation-${dimension}`);
  const samplingId = "fixture-sampling";
  recipe.eligibility = "exportable";
  registry.sourceRoles = [
    { sourceId: recipe.rights.sourceIds[0], role: "recipe-primary", recipeId: recipe.recipeId, workFamilyId: "fixture-primary" },
    { sourceId: recipe.rights.sourceIds[1], role: "recipe-cross-check", recipeId: recipe.recipeId, workFamilyId: "fixture-cross-check" },
  ];
  recipe.governance.reviewAttestationIds = attestationIds;
  recipe.governance.samplingBatchId = samplingId;
  const researchRecord = registry.researchRecords.find((entry) => entry.subject.type === "game-recipe" && entry.subject.id === recipe.recipeId);
  if (!researchRecord) throw new Error("fixture research record missing");
  researchRecord.status = "closed";
  researchRecord.unresolvedQuestions = [];
  researchRecord.editorialDecision = "Fixture-only closed record for deterministic export tests.";
  for (const decision of researchRecord.sourceDecisions) {
    if (decision.disposition === "accepted") decision.uses = ["identity", "preparation", "nutrition", "simulation"];
  }
  for (const claim of researchRecord.claims) {
    claim.disposition = "include";
    claim.evidenceIds = [...recipe.rights.evidenceIds];
  }
  const classification = registry.governance.riskClassifications.find((entry) => entry.itemId === recipe.recipeId);
  if (!classification) throw new Error("fixture risk classification missing");
  classification.equivalenceClassKeys = deriveGameEquivalenceClassKeys(recipe, registry) as [string, ...string[]];
  const support = { ingredients, nutritionDataset, operations };
  const artifactSetVersion = createGameArtifactSetVersion([recipe], registry, support);
  classification.artifactSetVersion = artifactSetVersion;
  registry.governance.attestations = dimensions.map((dimension, index) => ({
    id: attestationIds[index],
    batchId: "fixture-review",
    dimension,
    itemIds: [recipe.recipeId],
    artifactSetVersion,
    author: { actorType: "agent", actorId: "/root", runId: "fixture-author", contextId: "/root/fixture-author" },
    reviewer: { actorType: "agent", actorId: "/root/fixture-reviewer", runId: "fixture-review", contextId: "/root/fixture-reviewer" },
    reviewedCommit: "0123456789abcdef0123456789abcdef01234567",
    evidenceReference: "test fixture",
    rubricVersion: "fixture-v1",
    policyVersion: registry.policyVersion,
    reviewedAt: "2026-09-08",
    verdict: "pass",
    findings: [],
    reviewerModifiedContent: false,
    representations: { humanApproval: false, culinaryFieldTest: false, legalOpinion: false },
  }));
  const sampling = {
    id: samplingId,
    batchId: "fixture-review",
    sequence: 1,
    policyVersion: registry.policyVersion,
    itemIds: [recipe.recipeId],
    artifactSetVersion,
    equivalenceClasses: classification.equivalenceClassKeys.map((key) => ({
      key,
      itemIds: [recipe.recipeId],
      sampledItemIds: [recipe.recipeId],
    })) as [{ key: string; itemIds: [string]; sampledItemIds: [string] }],
    author: { actorType: "agent", actorId: "/root", runId: "fixture-author", contextId: "/root/fixture-author" },
    auditor: { actorType: "agent", actorId: "/root/fixture-auditor", runId: "fixture-audit", contextId: "/root/fixture-auditor" },
    reviewedCommit: "0123456789abcdef0123456789abcdef01234567",
    evidenceReference: "test fixture",
    rubricVersion: "fixture-v1",
    verdict: "pass",
    samples: [{
      itemId: recipe.recipeId,
      equivalenceClassKeys: classification.equivalenceClassKeys,
      dimensions: ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"],
      verdict: "pass",
      findings: [],
    }],
    findings: [],
    auditorModifiedContent: false,
    metrics: {
      escapeCount: 0,
      reviewerDisagreementCount: 0,
      reworkItemCount: 0,
      provenanceLicenseNoveltyCount: classification.equivalenceClassKeys.filter(isProvenanceLicenseNoveltyKey).length,
      reworkItemIds: [],
      provenanceLicenseNoveltyClassKeys: classification.equivalenceClassKeys.filter(isProvenanceLicenseNoveltyKey),
    },
    auditedAt: "2026-09-08",
    evidenceDigest: "",
  } satisfies GameRightsRegistryV1["governance"]["samplingBatches"][number];
  sampling.evidenceDigest = createSamplingBatchEvidenceDigest(sampling);
  registry.governance.samplingBatches = [sampling];
}

function isProvenanceLicenseNoveltyKey(key: string) {
  return ["source-domain:", "source-institution:", "source-rights:", "nutrition:", "authoring:"].some((prefix) => key.startsWith(prefix));
}

function fileMap(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  visit(root, root, result);
  return result;
}

function visit(root: string, path: string, result: Record<string, string>) {
  for (const name of readdirSync(path)) {
    const entry = resolve(path, name);
    if (statSync(entry).isDirectory()) visit(root, entry, result);
    else result[entry.slice(root.length)] = readFileSync(entry).toString("base64");
  }
}
