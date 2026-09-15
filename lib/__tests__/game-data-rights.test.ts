import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createM13DraftFixture } from "@/game-data/corpus-generator";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import { evaluateGameRecipeCorpus } from "@/lib/game-recipe-validation";
import type { GameNutritionDatasetSubsetV1, GameRecipeV1, GameRightsRegistryV1 } from "@/types/game-recipe";

describe("game-commercial-ready fail-closed gate", () => {
  const data = loadCanonicalGameData();
  const fixture = createM13DraftFixture(nutritionDataset, {
    ...data.ingredients,
    ingredients: data.ingredients.ingredients.filter((ingredient) => ingredient.nutritionSource.kind === "migration-estimate"),
  });
  const sourceRecipe = fixture.recipes[0] as GameRecipeV1;

  it("does not turn a draft into an export merely by changing eligibility", () => {
    const result = evaluate([{ ...sourceRecipe, eligibility: "exportable" }], fixture.rightsRegistry);
    expect(result.some((issue) => issue.code === "invalid-governance")).toBe(true);
    expect(result.some((issue) => issue.field.includes("reviewAttestationIds"))).toBe(true);
    expect(result.some((issue) => issue.field.includes("samplingBatchId"))).toBe(true);
  });

  it("blocks unknown rights, NC/ND and rights-changed sources", () => {
    for (const rights of [
      { status: "unknown", notes: "test" } as const,
      {
        status: "open-license",
        licenseId: "CC-BY-NC-4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
        attribution: "test",
        adaptationStatus: "adapted",
        shareAlikeRequired: false,
        notes: "test",
      } as const,
    ]) {
      const registry = clone(fixture.rightsRegistry);
      registry.sources[0].rights = rights;
      const result = evaluate([{ ...sourceRecipe, eligibility: "exportable" }], registry);
      expect(result.some((issue) => issue.code === "invalid-rights")).toBe(true);
    }
    const registry = clone(fixture.rightsRegistry);
    registry.sources[0].health.status = "rights-changed";
    const result = evaluate([{ ...sourceRecipe, eligibility: "exportable" }], registry);
    expect(result.some((issue) => issue.code === "invalid-rights")).toBe(true);
  });

  it("blocks generated expression and AI output used as Evidence", () => {
    const generatedRegistry = clone(fixture.rightsRegistry);
    const artifact = generatedRegistry.artifacts.find((entry) => entry.id === sourceRecipe.rights.artifactIds[0]);
    if (!artifact) throw new Error("fixture artifact missing");
    artifact.derivation = "generated";
    expect(evaluate([{ ...sourceRecipe, eligibility: "exportable" }], generatedRegistry)
      .some((issue) => issue.code === "invalid-rights" && issue.field.includes("derivation"))).toBe(true);

    const aiEvidenceRegistry = clone(fixture.rightsRegistry);
    const evidenceId = sourceRecipe.rights.evidenceIds[0];
    const origin = aiEvidenceRegistry.evidenceOrigins.find((entry) => entry.evidenceId === evidenceId);
    if (!origin) throw new Error("fixture evidence origin missing");
    origin.origin = "ai-output";
    expect(evaluate([{ ...sourceRecipe, eligibility: "exportable" }], aiEvidenceRegistry)
      .some((issue) => issue.code === "invalid-rights" && issue.field.includes("evidence"))).toBe(true);
  });

  it("blocks missing attribution obligations and expired assessment review", () => {
    const registry = clone(fixture.rightsRegistry);
    const artifact = registry.artifacts.find((entry) => entry.id === sourceRecipe.rights.artifactIds[0]);
    if (!artifact) throw new Error("fixture artifact missing");
    const assessment = registry.assessments.find((entry) => entry.id === artifact.rightsAssessmentId);
    if (!assessment) throw new Error("fixture assessment missing");
    assessment.attributionRequirementIds = ["missing-attribution"];
    assessment.permissions.publish.status = "allowed-with-obligations";
    assessment.reviewDueAt = "2026-01-01";
    const issues = evaluate([{ ...sourceRecipe, eligibility: "exportable" }], registry);
    expect(issues.some((issue) => issue.field.includes("attributionRequirementIds"))).toBe(true);
    expect(issues.some((issue) => issue.field.includes("review"))).toBe(true);
  });

  it("blocks malformed allowed substitutions", () => {
    const recipe = clone(sourceRecipe);
    const scenario = recipe.scenarios.find((entry) => entry.mutation.type === "allowed-substitution")
      ?? recipe.scenarios[0];
    const targetPortion = recipe.ingredientPortions[0];
    scenario.mutation = {
      type: "allowed-substitution",
      targetNodeId: scenario.mutation.targetNodeId,
      targetPortionId: targetPortion.portionId,
      replacementIngredientId: targetPortion.ingredientId,
    };
    scenario.nutritionEffect = "unchanged";

    const issues = evaluate([recipe], fixture.rightsRegistry);
    expect(issues.some((issue) => issue.code === "invalid-scenario" && issue.field.endsWith("replacementIngredientId"))).toBe(true);
    expect(issues.some((issue) => issue.code === "invalid-scenario" && issue.field.endsWith("nutritionEffect"))).toBe(true);

    delete scenario.mutation.targetPortionId;
    scenario.mutation.replacementIngredientId = "missing-ingredient";
    const missingReferenceIssues = evaluate([recipe], fixture.rightsRegistry);
    expect(missingReferenceIssues.some((issue) => issue.code === "invalid-scenario" && issue.field.endsWith("targetPortionId"))).toBe(true);
    expect(missingReferenceIssues.some((issue) => issue.code === "missing-reference" && issue.field.endsWith("replacementIngredientId"))).toBe(true);
  });
});

function evaluate(recipes: GameRecipeV1[], registry: GameRightsRegistryV1) {
  return evaluateGameRecipeCorpus(recipes, {
    operations: gameOperationCatalog,
    ingredients: dataIngredients,
    rightsRegistry: registry,
    now: "2026-09-08",
  }).issues;
}

const nutritionDataset = JSON.parse(readFileSync(
  resolve(process.cwd(), "game-data/nutrition/usda-fooddata-central-subset.json"),
  "utf8",
)) as GameNutritionDatasetSubsetV1;
const canonical = loadCanonicalGameData();
const dataIngredients = createM13DraftFixture(nutritionDataset, {
  ...canonical.ingredients,
  ingredients: canonical.ingredients.ingredients.filter((ingredient) => ingredient.nutritionSource.kind === "migration-estimate"),
}).ingredients;

function clone<T>(value: T): T {
  return structuredClone(value);
}
