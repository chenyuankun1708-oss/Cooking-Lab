import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { buildGameData } from "@/lib/game-data-build";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import { createGameArtifactSetVersion } from "@/lib/game-recipe-validation";
import type { GameRecipeV1, GameRightsRegistryV1 } from "@/types/game-recipe";
import type { ReviewDimension } from "@/types/publishing-governance";

describe("M12 deterministic game exports", () => {
  it("builds byte-stable Godot JSON, SQLite, rights and attribution from one canonical source", () => {
    const source = loadCanonicalGameData();
    const recipe = structuredClone(source.recipes.find((entry) => !entry.sourceCulinaryItemId)) as GameRecipeV1;
    const registry = structuredClone(source.rightsRegistry);
    promoteFixture(recipe, registry);
    const rootA = mkdtempSync(resolve(tmpdir(), "cooking-lab-game-a-"));
    const rootB = mkdtempSync(resolve(tmpdir(), "cooking-lab-game-b-"));
    const buildA = buildGameData({
      recipes: [recipe],
      ingredients: source.ingredients,
      operations: gameOperationCatalog,
      rightsRegistry: registry,
      now: "2026-09-08",
    }, rootA);
    buildGameData({
      recipes: [recipe],
      ingredients: source.ingredients,
      operations: gameOperationCatalog,
      rightsRegistry: registry,
      now: "2026-09-08",
    }, rootB);

    expect(buildA.manifest.recipeCount).toBe(1);
    expect(fileMap(rootA)).toEqual(fileMap(rootB));
    const database = new DatabaseSync(buildA.sqlitePath, { readOnly: true });
    expect(database.prepare("SELECT COUNT(*) AS count FROM recipes").get()).toEqual({ count: 1 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM recipe_ingredients").get()).toEqual({ count: recipe.ingredientPortions.length });
    expect(database.prepare("SELECT COUNT(*) AS count FROM operations").get()).toEqual({ count: recipe.operationGraph.nodes.length });
    expect(database.prepare("SELECT COUNT(*) AS count FROM scenarios").get()).toEqual({ count: recipe.scenarios.length });
    expect(database.prepare("SELECT COUNT(*) AS count FROM rights_decisions").get()).toEqual({ count: 4 });
    database.close();
  });
});

function promoteFixture(recipe: GameRecipeV1, registry: GameRightsRegistryV1) {
  const dimensions: ReviewDimension[] = ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"];
  const attestationIds = dimensions.map((dimension) => `fixture-attestation-${dimension}`);
  const samplingId = "fixture-sampling";
  recipe.eligibility = "exportable";
  recipe.governance.reviewAttestationIds = attestationIds;
  recipe.governance.samplingBatchId = samplingId;
  const artifactSetVersion = createGameArtifactSetVersion([recipe], registry);
  registry.governance.attestations = dimensions.map((dimension, index) => ({
    id: attestationIds[index],
    batchId: "fixture-review",
    dimension,
    itemIds: [recipe.recipeId],
    artifactSetVersion,
    author: { actorType: "agent", actorId: "/root", runId: "fixture-author", contextId: "/root/fixture-author" },
    reviewer: { actorType: "agent", actorId: "/root/fixture-reviewer", runId: "fixture-review", contextId: "/root/fixture-reviewer" },
    reviewedCommit: "fixture",
    evidenceReference: "test fixture",
    rubricVersion: "fixture-v1",
    policyVersion: registry.policyVersion,
    reviewedAt: "2026-09-08",
    verdict: "pass",
    findings: [],
    reviewerModifiedContent: false,
    representations: { humanApproval: false, culinaryFieldTest: false, legalOpinion: false },
  }));
  const classification = registry.governance.riskClassifications.find((entry) => entry.itemId === recipe.recipeId);
  if (!classification) throw new Error("fixture risk classification missing");
  registry.governance.samplingBatches = [{
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
    reviewedCommit: "fixture",
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
      provenanceLicenseNoveltyCount: 0,
      reworkItemIds: [],
      provenanceLicenseNoveltyClassKeys: [],
    },
    auditedAt: "2026-09-08",
    evidenceDigest: "fixture",
  }];
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
