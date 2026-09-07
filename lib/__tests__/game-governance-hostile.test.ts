import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { createM13DraftCorpus } from "@/game-data/corpus-generator";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import {
  createGameArtifactSetVersion,
  createGameRecipeArtifactVersion,
  deriveGameEquivalenceClassKeys,
  deriveMinimumGamePublishingRisk,
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
const canonicalFixtureSource = loadCanonicalGameData();
const generatedFixtureSource = createM13DraftCorpus(nutritionDataset, {
  ...canonicalFixtureSource.ingredients,
  ingredients: canonicalFixtureSource.ingredients.ingredients.filter((ingredient) => ingredient.nutritionSource.kind === "migration-estimate"),
});

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
    const sourceRoleChanged = structuredClone(fixture.registry);
    sourceRoleChanged.sourceRoles[0].workFamilyId = "different-work-family";
    expect(createGameArtifactSetVersion([fixture.recipe], originChanged, fixture.context)).not.toBe(base);
    expect(createGameArtifactSetVersion([fixture.recipe], policyChanged, fixture.context)).not.toBe(base);
    expect(createGameArtifactSetVersion([fixture.recipe], fixture.registry, operationChanged)).not.toBe(base);
    expect(createGameArtifactSetVersion([fixture.recipe], sourceRoleChanged, fixture.context)).not.toBe(base);
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

  it("enforces operation inputs, compatible equipment, required parameters, duration and targets", () => {
    const mutations: Array<[string, (recipe: GameRecipeV1) => void]> = [
      ["inputs", (recipe) => { recipe.operationGraph.nodes.find((node) => node.operationType === "pan-fry")!.inputPortionIds = []; }],
      ["equipment", (recipe) => { recipe.operationGraph.nodes.find((node) => node.operationType === "simmer")!.equipmentId = "knife"; }],
      ["parameters", (recipe) => { recipe.operationGraph.nodes.find((node) => node.operationType === "pan-fry")!.parameters = {}; }],
      ["duration", (recipe) => {
        const node = recipe.operationGraph.nodes.find((entry) => entry.operationType === "simmer")!;
        node.activeDurationMs = 0;
        node.waitDurationMs = 0;
      }],
      ["targets", (recipe) => { recipe.operationGraph.nodes.find((node) => node.operationType === "pan-fry")!.targetStates = []; }],
    ];
    for (const [field, mutate] of mutations) {
      const fixture = readyFixture();
      mutate(fixture.recipe);
      expect(audit(fixture).issues.some((issue) => issue.field.endsWith(`.${field}`))).toBe(true);
    }
  });

  it("rejects malformed target-state bounds", () => {
    const fixture = readyFixture();
    const node = fixture.recipe.operationGraph.nodes.find((entry) => entry.targetStates.length > 0)!;
    node.targetStates[0].minimum = 1.1;
    node.targetStates[0].maximum = -0.1;
    expect(audit(fixture).issues.some((issue) => issue.field.includes("targetStates"))).toBe(true);
  });

  it("rejects operation-incompatible targets and incomplete scenario provenance", () => {
    const target = readyFixture();
    target.recipe.operationGraph.nodes.find((node) => node.operationType === "pan-fry")!.targetStates = [{ dimension: "salt", maximum: 0.8, unit: "normalized" }];
    expect(audit(target).issues.some((issue) => issue.message.includes("not meaningful"))).toBe(true);

    const scenario = readyFixture();
    scenario.recipe.scenarios[0].applicableEngine = scenario.recipe.simulationProfile === "cat-kitchen-goal1-v1" ? "requires-cat-kitchen-v2" : "cat-kitchen-goal1-v1";
    scenario.recipe.scenarios[0].causeCodes = [];
    const issues = audit(scenario).issues;
    expect(issues.some((issue) => issue.field.endsWith(".applicableEngine"))).toBe(true);
    expect(issues.some((issue) => issue.field.endsWith(".causeCodes"))).toBe(true);
  });

  it("requires unique output transitions and physically valid operation parameters", () => {
    const missingOutput = readyFixture();
    missingOutput.recipe.operationGraph.nodes[0].outputStateIds = [];
    expect(audit(missingOutput).issues.some((issue) => issue.field.endsWith(".outputStateIds"))).toBe(true);

    const duplicateOutput = readyFixture();
    const stateId = duplicateOutput.recipe.operationGraph.nodes[0].outputStateIds[0];
    duplicateOutput.recipe.operationGraph.nodes[0].outputStateIds = [stateId, stateId];
    expect(audit(duplicateOutput).issues.some((issue) => issue.code === "duplicate-id" && issue.field.endsWith(".outputStateIds"))).toBe(true);

    const invalidCapacity = readyFixture();
    invalidCapacity.recipe.operationGraph.nodes.find((node) => node.operationType === "pan-fry")!.parameters.capacityG = -1;
    expect(audit(invalidCapacity).issues.some((issue) => issue.field.endsWith(".capacityG"))).toBe(true);

    const invalidTemperature = readyFixture();
    invalidTemperature.recipe.operationGraph.nodes.find((node) => node.operationType === "simmer")!.parameters.temperatureC = -300;
    expect(audit(invalidTemperature).issues.some((issue) => issue.field.endsWith(".temperatureC"))).toBe(true);
  });

  it("requires mutation-specific targets and scalar direction", () => {
    const fixture = readyFixture();
    const scenario = fixture.recipe.scenarios[0];
    scenario.mutation = { type: "quantity-too-low", scalar: 2 };
    scenario.nutritionEffect = "unchanged";
    const issues = audit(fixture).issues;
    expect(issues.some((issue) => issue.field.endsWith("targetPortionId"))).toBe(true);
    expect(issues.some((issue) => issue.field.endsWith("scalar"))).toBe(true);
    expect(issues.some((issue) => issue.field.endsWith("nutritionEffect"))).toBe(true);
  });

  it("binds assessments exactly and blocks unapproved or ShareAlike licenses", () => {
    const wrongSubject = readyFixture();
    const sourceAssessment = wrongSubject.registry.assessments.find((entry) => entry.subject.type === "source")!;
    sourceAssessment.subject = { type: "source", id: "unrelated-source" };
    expect(audit(wrongSubject).issues.some((issue) => issue.field.endsWith(".subject"))).toBe(true);

    const unapproved = readyFixture();
    const source = unapproved.registry.sources[0];
    source.rights = {
      status: "open-license",
      licenseId: "custom-open",
      licenseUrl: "https://example.invalid/license",
      attribution: "test",
      adaptationStatus: "adapted",
      shareAlikeRequired: false,
      notes: "hostile fixture",
    };
    expect(audit(unapproved).issues.some((issue) => issue.field.endsWith("licenseId"))).toBe(true);

    const shareAlike = readyFixture();
    const shareAlikeSource = shareAlike.registry.sources[0];
    if (shareAlikeSource.rights.status !== "open-license") throw new Error("open-license fixture missing");
    shareAlikeSource.rights.shareAlikeRequired = true;
    expect(audit(shareAlike).issues.some((issue) => issue.field.endsWith("shareAlikeRequired"))).toBe(true);
  });

  it("requires complete CC BY attribution and globally unique registry IDs", () => {
    const attribution = readyFixture();
    const source = attribution.registry.sources[0];
    source.rights = {
      status: "open-license",
      licenseId: "CC-BY-4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      attribution: "Required",
      adaptationStatus: "adapted",
      shareAlikeRequired: false,
      notes: "hostile fixture",
    };
    expect(audit(attribution).issues.some((issue) => issue.field.endsWith("attributionRequirementIds"))).toBe(true);

    const duplicate = readyFixture();
    duplicate.registry.assessments[1].id = duplicate.registry.artifacts[0].id;
    expect(audit(duplicate).issues).toContainEqual(expect.objectContaining({
      code: "duplicate-id",
      recipeId: "rights-registry",
    }));
  });

  it("requires complete OGL attribution and complete assessment provenance", () => {
    const ogl = readyFixture();
    const source = ogl.registry.sources[0];
    source.rights = {
      status: "open-license",
      licenseId: "OGL-3.0",
      licenseUrl: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      attribution: "Required",
      adaptationStatus: "adapted",
      shareAlikeRequired: false,
      notes: "hostile fixture",
    };
    expect(audit(ogl).issues.some((issue) => issue.field.endsWith("attributionRequirementIds"))).toBe(true);

    const incomplete = readyFixture();
    const assessment = incomplete.registry.assessments[0];
    assessment.authorityVersion = "";
    assessment.accessedAt = "not-a-date";
    assessment.reviewer = "";
    assessment.permissions.publish.scope = "";
    assessment.basis = { kind: "open-license", licenseId: "CC-BY-4.0", licenseUrl: "http://example.invalid/license" };
    const issues = audit(incomplete).issues;
    expect(issues.some((issue) => issue.field.endsWith(".provenance"))).toBe(true);
    expect(issues.some((issue) => issue.field.endsWith(".basis"))).toBe(true);
    expect(issues.some((issue) => issue.field.endsWith(".permissions.publish.scope"))).toBe(true);
  });

  it("requires usage decision review metadata and material two-institution evidence", () => {
    const invalidDecision = readyFixture();
    invalidDecision.registry.decisions[0].reviewer = "";
    invalidDecision.registry.decisions[0].decidedAt = "not-a-date";
    expect(audit(invalidDecision).issues.some((issue) => issue.field.endsWith(".review"))).toBe(true);

    const unusedSecondSource = readyFixture();
    const firstEvidence = unusedSecondSource.recipe.rights.evidenceIds[0];
    for (const artifact of unusedSecondSource.registry.artifacts.filter((entry) =>
      entry.subject.id === unusedSecondSource.recipe.recipeId && (entry.kind === "identity" || entry.kind === "preparation"))) {
      artifact.evidenceIds = [firstEvidence];
    }
    expect(audit(unusedSecondSource).issues.some((issue) => issue.field === "rights.materialSourceCoverage")).toBe(true);
  });

  it("does not treat identity-only evidence as a preparation cross-check", () => {
    const fixture = readyFixture();
    const crossCheckSourceId = fixture.recipe.rights.sourceIds[1];
    const preparation = fixture.registry.artifacts.find((entry) => entry.subject.id === fixture.recipe.recipeId && entry.kind === "preparation")!;
    preparation.evidenceIds = preparation.evidenceIds.filter((evidenceId) =>
      fixture.registry.evidence.find((evidence) => evidence.id === evidenceId)?.sourceId !== crossCheckSourceId);
    expect(audit(fixture).issues).toContainEqual(expect.objectContaining({
      code: "invalid-rights",
      field: "rights.materialSourceCoverage",
    }));
  });

  it("requires exact artifact assessments and rejects undeclared or AI-origin artifact Evidence", () => {
    const wrongAssessment = readyFixture();
    const artifact = wrongAssessment.registry.artifacts.find((entry) => entry.subject.id === wrongAssessment.recipe.recipeId)!;
    const sourceAssessment = wrongAssessment.registry.assessments.find((entry) => entry.subject.type === "source")!;
    artifact.rightsAssessmentId = sourceAssessment.id;
    const decision = wrongAssessment.registry.decisions.find((entry) => entry.id === artifact.usageDecisionId)!;
    if (!decision.assessmentIds.includes(sourceAssessment.id)) decision.assessmentIds.push(sourceAssessment.id);
    expect(audit(wrongAssessment).issues.some((issue) => issue.field.endsWith(".rightsAssessmentId"))).toBe(true);

    const aiEvidence = readyFixture();
    const aiArtifact = aiEvidence.registry.artifacts.find((entry) => entry.subject.id === aiEvidence.recipe.recipeId)!;
    const newEvidenceId = "hostile-ai-artifact-evidence";
    aiEvidence.registry.evidence.push({
      id: newEvidenceId,
      sourceId: aiArtifact.sourceIds[0],
      relation: "supports",
      strength: "limited",
      locators: [{ kind: "section", value: "hostile fixture" }],
      editorialNote: "Hostile fixture only.",
    });
    aiEvidence.registry.evidenceOrigins.push({ evidenceId: newEvidenceId, origin: "ai-output" });
    aiArtifact.evidenceIds.push(newEvidenceId);
    expect(audit(aiEvidence).issues.some((issue) => issue.field.endsWith(".evidenceIds") && issue.message.includes("source record"))).toBe(true);
  });

  it("rejects duplicate or non-neutral ingredient-sum provenance and escalates permission sources", () => {
    const nutrition = readyFixture();
    nutrition.recipe.nutritionProfile.provenance.push(structuredClone(nutrition.recipe.nutritionProfile.provenance[0]));
    nutrition.recipe.nutritionProfile.provenance.at(-1)!.yieldFactor = 0.8;
    const issues = audit(nutrition).issues;
    expect(issues.some((issue) => issue.field === "nutritionProfile.provenance")).toBe(true);
    expect(issues.some((issue) => issue.field.includes("nutritionProfile.provenance.") && issue.message.includes("neutral yield"))).toBe(true);

    const permission = readyFixture();
    const source = permission.registry.sources[0];
    source.rights = { status: "permission-granted", notes: "Hostile fixture permission route." };
    const assessment = permission.registry.assessments.find((entry) => entry.subject.type === "source" && entry.subject.id === source.id)!;
    assessment.basis = { kind: "permission", permissionReferenceId: "hostile-permission" };
    expect(deriveMinimumGamePublishingRisk(permission.recipe, permission.registry).level).toBe("high");
  });

  it("rejects portion-state drift from ingredient-sum provenance", () => {
    const fixture = readyFixture();
    const portion = fixture.recipe.ingredientPortions[0];
    portion.initialState = portion.initialState === "raw" ? "prepared" : "raw";
    expect(audit(fixture).issues.some((issue) => issue.field.includes(`nutritionProfile.provenance.${portion.ingredientId}`))).toBe(true);
  });

  it("rejects dangling rights references even while a recipe remains draft", () => {
    const recipe = structuredClone(canonicalFixtureSource.recipes[0]);
    recipe.rights.artifactIds = ["missing-artifact"];
    expect(evaluateGameRecipeCorpus([recipe], {
      operations: gameOperationCatalog,
      ingredients: canonicalFixtureSource.ingredients,
      rightsRegistry: canonicalFixtureSource.rightsRegistry,
      now: "2026-09-08",
    }).issues).toContainEqual(expect.objectContaining({
      code: "missing-reference",
      field: "rights.artifactIds",
    }));
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

  it("does not thaw a frozen class with an incomplete historical full-review sample", () => {
    const fixture = readyFixture();
    const base = fixture.registry.governance.samplingBatches[0];
    const key = base.equivalenceClasses[0].key;
    const major = structuredClone(base);
    major.id = "hostile-history-major";
    major.sequence = 1;
    delete major.previousBatchId;
    major.evidenceReference = "hostile-history-major-evidence";
    major.auditor.runId = "hostile-history-major-run";
    major.auditor.contextId = "hostile-history-major-context";
    major.findings = [{ code: "major-history", kind: "quality", severity: "major", summary: "hostile fixture", disposition: "resolved", equivalenceClassKeys: [key] }];
    major.metrics.escapeCount = 1;
    major.evidenceDigest = createSamplingBatchEvidenceDigest(major);

    const incomplete = structuredClone(base);
    incomplete.id = "hostile-history-incomplete";
    incomplete.sequence = 2;
    incomplete.previousBatchId = major.id;
    incomplete.evidenceReference = "hostile-history-incomplete-evidence";
    incomplete.auditor.runId = "hostile-history-incomplete-run";
    incomplete.auditor.contextId = "hostile-history-incomplete-context";
    incomplete.metrics.provenanceLicenseNoveltyClassKeys = [];
    incomplete.metrics.provenanceLicenseNoveltyCount = 0;
    incomplete.samples[0].dimensions = ["rights-license"];
    incomplete.evidenceDigest = createSamplingBatchEvidenceDigest(incomplete);

    const clean = structuredClone(base);
    clean.id = "hostile-history-clean";
    clean.sequence = 3;
    clean.previousBatchId = incomplete.id;
    clean.evidenceReference = "hostile-history-clean-evidence";
    clean.auditor.runId = "hostile-history-clean-run";
    clean.auditor.contextId = "hostile-history-clean-context";
    clean.metrics.provenanceLicenseNoveltyClassKeys = [];
    clean.metrics.provenanceLicenseNoveltyCount = 0;
    clean.evidenceDigest = createSamplingBatchEvidenceDigest(clean);

    fixture.recipe.governance.samplingBatchId = clean.id;
    fixture.registry.governance.samplingBatches = [major, incomplete, clean];
    expect(audit(fixture).issues).toContainEqual(expect.objectContaining({
      code: "invalid-governance",
      field: "sampling.history",
      message: expect.stringContaining("remains frozen"),
    }));
  });
});

function readyFixture() {
  const recipe = structuredClone(generatedFixtureSource.recipes[0]) as GameRecipeV1;
  const registry = structuredClone(generatedFixtureSource.rightsRegistry) as GameRightsRegistryV1;
  const context = {
    operations: structuredClone(gameOperationCatalog),
    ingredients: structuredClone(generatedFixtureSource.ingredients),
    nutritionDataset: structuredClone(nutritionDataset),
    rightsRegistry: registry,
    now: "2026-09-08",
  };
  recipe.eligibility = "exportable";
  registry.sourceRoles = [
    { sourceId: recipe.rights.sourceIds[0], role: "recipe-primary", recipeId: recipe.recipeId, workFamilyId: "hostile-fixture-primary" },
    { sourceId: recipe.rights.sourceIds[1], role: "recipe-cross-check", recipeId: recipe.recipeId, workFamilyId: "hostile-fixture-cross-check" },
  ];
  for (const scenario of recipe.scenarios) {
    if (scenario.mutation.type === "reorder" && scenario.mutation.targetNodeId) {
      scenario.mutation.destinationBeforeNodeId = recipe.operationGraph.nodes.find((node) => node.nodeId !== scenario.mutation.targetNodeId)?.nodeId;
    }
    if (scenario.mutation.type === "wrong-equipment") scenario.mutation.replacementEquipmentId = "deliberately-incompatible-test-tool";
    if (scenario.mutation.type === "allowed-substitution" && scenario.mutation.targetPortionId) {
      const target = recipe.ingredientPortions.find((portion) => portion.portionId === scenario.mutation.targetPortionId);
      scenario.mutation.replacementIngredientId = generatedFixtureSource.ingredients.ingredients.find((ingredient) => ingredient.ingredientId !== target?.ingredientId)?.ingredientId;
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
