import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import {
  createGameArtifactSetVersion,
  createGameRecipeArtifactVersion,
  deriveGameEquivalenceClassKeys,
  evaluateGameRecipeCorpus,
} from "@/lib/game-recipe-validation";
import { createSamplingBatchEvidenceDigest } from "@/lib/publishing-governance";
import type {
  GameNutritionDatasetSubsetV1,
  GameRecipeV1,
  GameRightsRegistryV1,
} from "@/types/game-recipe";
import type { ReviewAttestation, ReviewDimension, SamplingQaBatch } from "@/types/publishing-governance";

const reviewDimensions: ReviewDimension[] = ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"];
const reviewedCommit = "a".repeat(40);
const nutritionDataset = JSON.parse(readFileSync(
  resolve(process.cwd(), "game-data/nutrition/usda-fooddata-central-subset.json"),
  "utf8",
)) as GameNutritionDatasetSubsetV1;

describe("M12 game governance hostile cases", () => {
  it("accepts only a fully current low-risk fixture", () => {
    const result = audit(readyFixture());
    expect(result.issues).toEqual([]);
    expect(result.ready).toBe(true);
  });

  it("requires one LOW reviewer context to cover every dimension", () => {
    const fixture = readyFixture();
    fixture.registry.governance.attestations.forEach((attestation, index) => {
      attestation.reviewer.actorId = `reviewer-${index}`;
      attestation.reviewer.runId = `review-run-${index}`;
      attestation.reviewer.contextId = `review-context-${index}`;
    });
    expect(audit(fixture).issues).toContainEqual(expect.objectContaining({
      code: "invalid-governance",
      field: "governance.reviewAttestationIds",
    }));
  });

  it("rejects the same actor even when run and context IDs differ", () => {
    const fixture = readyFixture();
    fixture.registry.governance.attestations[0].reviewer.actorId = fixture.registry.governance.attestations[0].author.actorId;
    expect(audit(fixture).issues.some((issue) => issue.field.includes("independence"))).toBe(true);
  });

  it("rejects malformed attestations and fabricated sampling records", () => {
    const fixture = readyFixture();
    const attestation = fixture.registry.governance.attestations[0];
    attestation.reviewedCommit = "";
    attestation.policyVersion = "stale-policy";
    const sampling = fixture.registry.governance.samplingBatches[0];
    sampling.samples = [];
    sampling.equivalenceClasses[0].sampledItemIds = ["not-a-real-recipe"];
    sampling.metrics.escapeCount = -1;
    sampling.evidenceDigest = "clv1-0000000000000000";
    const issues = audit(fixture).issues;
    expect(issues.some((issue) => issue.field.startsWith("attestation."))).toBe(true);
    expect(issues.some((issue) => issue.field === "sampling")).toBe(true);
    expect(issues.some((issue) => issue.field === "sampling.samples")).toBe(true);
    expect(issues.some((issue) => issue.field === "sampling.metrics")).toBe(true);
  });

  it("rejects policy drift and hand-authored risk equivalence classes", () => {
    const fixture = readyFixture();
    const classification = fixture.registry.governance.riskClassifications.find((entry) => entry.itemId === fixture.recipe.recipeId);
    if (!classification) throw new Error("classification missing");
    classification.policyVersion = "stale-policy";
    classification.equivalenceClassKeys = ["content-type:dish"];
    expect(audit(fixture).issues.filter((issue) => issue.field === "governance.riskClassificationId").length).toBeGreaterThan(0);
  });

  it("requires valid claim-level Evidence for every artifact use", () => {
    const fixture = readyFixture();
    const record = fixture.registry.researchRecords.find((entry) => entry.subject.id === fixture.recipe.recipeId);
    if (!record) throw new Error("research record missing");
    record.claims = [];
    expect(audit(fixture).issues).toContainEqual(expect.objectContaining({
      code: "invalid-rights",
      field: "researchRecord.claims",
    }));

    const noSimulationUse = readyFixture();
    const nextRecord = noSimulationUse.registry.researchRecords.find((entry) => entry.subject.id === noSimulationUse.recipe.recipeId);
    if (!nextRecord) throw new Error("research record missing");
    for (const decision of nextRecord.sourceDecisions) {
      if (decision.disposition === "accepted") decision.uses = decision.uses.filter((use) => use !== "simulation") as typeof decision.uses;
    }
    expect(audit(noSimulationUse).issues.some((issue) => issue.field.includes("simulation") && issue.field.includes("evidenceIds"))).toBe(true);
  });

  it("binds evidence origin, active policy and supporting catalogs into the review fingerprint", () => {
    const fixture = readyFixture();
    const base = createGameArtifactSetVersion([fixture.recipe], fixture.registry, fixture.context);
    const originChanged = structuredClone(fixture.registry);
    originChanged.evidenceOrigins[0].origin = "ai-output";
    const policyChanged = structuredClone(fixture.registry);
    policyChanged.policyVersion = "next-policy";
    const operationChanged = structuredClone(fixture.context);
    operationChanged.operations = operationChanged.operations.map((operation, index) => index === 0 ? { ...operation, simulationAffecting: !operation.simulationAffecting } : operation);
    expect(createGameArtifactSetVersion([fixture.recipe], originChanged, fixture.context)).not.toBe(base);
    expect(createGameArtifactSetVersion([fixture.recipe], policyChanged, fixture.context)).not.toBe(base);
    expect(createGameArtifactSetVersion([fixture.recipe], fixture.registry, operationChanged)).not.toBe(base);
  });

  it("rejects a USDA subset that no longer exactly matches the ingredient catalog", () => {
    const fixture = readyFixture();
    const ingredientId = fixture.recipe.ingredientPortions[0].ingredientId;
    const record = fixture.context.nutritionDataset.records.find((entry) => entry.ingredientId === ingredientId);
    if (!record) throw new Error("USDA record missing");
    record.nutritionPer100g.calories += 1;
    expect(audit(fixture).issues).toContainEqual(expect.objectContaining({
      code: "invalid-nutrition",
      recipeId: ingredientId,
      field: "nutritionDataset",
    }));
  });

  it("requires explicit reorder destinations and wrong-equipment replacements", () => {
    const reordered = readyFixture();
    const reorderScenario = reordered.recipe.scenarios[0];
    reorderScenario.mutation.type = "reorder";
    delete reorderScenario.mutation.destinationBeforeNodeId;
    expect(audit(reordered).issues.some((issue) => issue.field.endsWith("destinationBeforeNodeId"))).toBe(true);

    const wrongEquipment = readyFixture();
    const equipmentScenario = wrongEquipment.recipe.scenarios[0];
    equipmentScenario.mutation.type = "wrong-equipment";
    delete equipmentScenario.mutation.replacementEquipmentId;
    expect(audit(wrongEquipment).issues.some((issue) => issue.field.endsWith("replacementEquipmentId"))).toBe(true);
  });

  it("freezes a risk class after any major sampling escape", () => {
    const fixture = readyFixture();
    const sampling = fixture.registry.governance.samplingBatches[0];
    sampling.findings = [{
      code: "major-escape",
      kind: "quality",
      severity: "major",
      summary: "hostile fixture",
      disposition: "resolved",
      equivalenceClassKeys: [sampling.equivalenceClasses[0].key],
    }];
    sampling.metrics.escapeCount = 1;
    sampling.evidenceDigest = createSamplingBatchEvidenceDigest(sampling);
    expect(audit(fixture).issues).toContainEqual(expect.objectContaining({
      code: "invalid-governance",
      field: "sampling.history",
    }));
  });
});

function readyFixture() {
  const source = loadCanonicalGameData();
  const recipe = structuredClone(source.recipes.find((entry) => !entry.sourceCulinaryItemId)) as GameRecipeV1;
  const registry = structuredClone(source.rightsRegistry) as GameRightsRegistryV1;
  const context = {
    operations: structuredClone(gameOperationCatalog),
    ingredients: structuredClone(source.ingredients),
    nutritionDataset: structuredClone(nutritionDataset),
    rightsRegistry: registry,
    now: "2026-09-08",
  };
  recipe.eligibility = "exportable";
  for (const scenario of recipe.scenarios) {
    if (scenario.mutation.type === "reorder" && scenario.mutation.targetNodeId) {
      scenario.mutation.destinationBeforeNodeId = recipe.operationGraph.nodes.find((node) => node.nodeId !== scenario.mutation.targetNodeId)?.nodeId;
    }
    if (scenario.mutation.type === "wrong-equipment") scenario.mutation.replacementEquipmentId = "deliberately-incompatible-test-tool";
    if (scenario.mutation.type === "allowed-substitution" && scenario.mutation.targetPortionId) {
      const target = recipe.ingredientPortions.find((portion) => portion.portionId === scenario.mutation.targetPortionId);
      scenario.mutation.replacementIngredientId = source.ingredients.ingredients.find((ingredient) => ingredient.ingredientId !== target?.ingredientId)?.ingredientId;
      scenario.nutritionEffect = "recalculate-from-quantities";
    }
  }
  recipe.artifactVersion = createGameRecipeArtifactVersion(recipe);
  recipe.scenarios.forEach((scenario) => { scenario.baselineArtifactVersion = recipe.artifactVersion; });
  registry.artifacts.filter((artifact) => artifact.subject.type === "game-recipe" && artifact.subject.id === recipe.recipeId)
    .forEach((artifact) => { artifact.version = recipe.artifactVersion; });
  const record = registry.researchRecords.find((entry) => entry.subject.id === recipe.recipeId);
  if (!record) throw new Error("research record missing");
  record.status = "closed";
  record.unresolvedQuestions = [];
  record.editorialDecision = "Hostile-test fixture only: current evidence and review records satisfy the export contract.";
  const usdaEvidence = recipe.rights.evidenceIds.find((id) => id.includes("usda"));
  const contextualEvidence = recipe.rights.evidenceIds.find((id) => !id.includes("usda"));
  if (!usdaEvidence || !contextualEvidence) throw new Error("evidence fixture missing");
  for (const decision of record.sourceDecisions) {
    if (decision.disposition === "accepted") {
      for (const use of ["identity", "preparation", "nutrition", "simulation"] as const) {
        if (!decision.uses.includes(use)) decision.uses.push(use);
      }
    }
  }
  record.claims = [
    claim("identity", usdaEvidence),
    claim("preparation", contextualEvidence),
    claim("nutrition", usdaEvidence),
    claim("simulation", contextualEvidence),
  ];
  const classification = registry.governance.riskClassifications.find((entry) => entry.itemId === recipe.recipeId);
  if (!classification) throw new Error("classification missing");
  classification.level = "low";
  classification.policyVersion = registry.policyVersion;
  classification.reasonCodes = ["clear-first-party-or-reference-only-rights", "approved-nutrition-or-cost-method"];
  classification.equivalenceClassKeys = deriveGameEquivalenceClassKeys(recipe, registry) as [string, ...string[]];
  classification.artifactSetVersion = createGameArtifactSetVersion([recipe], registry, context);
  const attestationIds = reviewDimensions.map((dimension) => `hostile-review-${dimension}`);
  recipe.governance.reviewAttestationIds = attestationIds;
  recipe.governance.samplingBatchId = "hostile-sampling";
  registry.governance.attestations = reviewDimensions.map((dimension, index): ReviewAttestation => ({
    id: attestationIds[index],
    batchId: "hostile-review",
    dimension,
    itemIds: [recipe.recipeId],
    artifactSetVersion: classification.artifactSetVersion,
    author: { actorType: "agent", actorId: "author", runId: "author-run", contextId: "author-context" },
    reviewer: { actorType: "agent", actorId: "reviewer", runId: "review-run", contextId: "review-context" },
    reviewedCommit,
    evidenceReference: `review-artifact-${dimension}`,
    rubricVersion: "game-review-v1",
    policyVersion: registry.policyVersion,
    reviewedAt: "2026-09-08",
    verdict: "pass",
    findings: [],
    reviewerModifiedContent: false,
    representations: { humanApproval: false, culinaryFieldTest: false, legalOpinion: false },
  }));
  const equivalenceClasses = classification.equivalenceClassKeys.map((key) => ({
    key,
    itemIds: [recipe.recipeId] as [string],
    sampledItemIds: [recipe.recipeId] as [string],
  })) as unknown as SamplingQaBatch["equivalenceClasses"];
  const noveltyKeys = classification.equivalenceClassKeys.filter((key) =>
    ["source-domain:", "source-institution:", "source-rights:", "nutrition:", "authoring:"].some((prefix) => key.startsWith(prefix)));
  const sampling: SamplingQaBatch = {
    id: "hostile-sampling",
    batchId: "hostile-review",
    sequence: 1,
    policyVersion: registry.policyVersion,
    itemIds: [recipe.recipeId],
    artifactSetVersion: classification.artifactSetVersion,
    equivalenceClasses,
    author: { actorType: "agent", actorId: "author", runId: "author-run", contextId: "author-context" },
    auditor: { actorType: "agent", actorId: "auditor", runId: "audit-run", contextId: "audit-context" },
    reviewedCommit,
    evidenceReference: "sampling-artifact",
    rubricVersion: "game-sampling-v1",
    verdict: "pass",
    samples: [{ itemId: recipe.recipeId, equivalenceClassKeys: classification.equivalenceClassKeys, dimensions: [...reviewDimensions] as SamplingQaBatch["samples"][number]["dimensions"], verdict: "pass", findings: [] }],
    findings: [],
    auditorModifiedContent: false,
    metrics: {
      escapeCount: 0,
      reviewerDisagreementCount: 0,
      reworkItemCount: 0,
      provenanceLicenseNoveltyCount: noveltyKeys.length,
      reworkItemIds: [],
      provenanceLicenseNoveltyClassKeys: noveltyKeys,
    },
    auditedAt: "2026-09-08",
    evidenceDigest: "",
  };
  sampling.evidenceDigest = createSamplingBatchEvidenceDigest(sampling);
  registry.governance.samplingBatches = [sampling];
  return { recipe, registry, context };
}

function claim(use: string, evidenceId: string) {
  return {
    id: `claim-${use}`,
    statement: `Structured ${use} facts are supported by the linked evidence.`,
    kind: "documented-fact" as const,
    disposition: "include" as const,
    evidenceIds: [evidenceId],
    rationale: `Required ${use} provenance coverage.`,
  };
}

function audit(fixture: ReturnType<typeof readyFixture>) {
  return evaluateGameRecipeCorpus([fixture.recipe], fixture.context);
}
