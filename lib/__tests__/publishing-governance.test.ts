import { describe, expect, it } from "vitest";
import { createContentRightsRegistry, m10AuditedCulinaryItemIds } from "@/data/content-rights";
import { culinaryImages } from "@/data/culinary/images";
import { culinaryEvidence } from "@/data/culinary/evidence";
import { culinarySources } from "@/data/culinary/sources";
import { culinaryStories } from "@/data/culinary/stories";
import { ingredients } from "@/data/ingredients";
import { publishedLocalContentPackages } from "@/data/content-packages";
import { createPublishingGovernanceRegistry } from "@/data/publishing-governance";
import { createPublishingLocalizationVersions } from "@/data/publishing-localization-versions";
import { recipeImages } from "@/data/recipe-images";
import { m9RecipeResearchRecords, m9RecipeResearchSources } from "@/data/research/m9-recipe-research";
import { createImageAssetVersions } from "../image-asset-version";
import { buildConsumerRightsDisclosure } from "../content-rights-consumer";
import { evaluateContentRightsRegistry } from "../content-rights";
import type { PublishingGovernanceRegistry, ReviewAttestation } from "@/types/publishing-governance";
import {
  createArtifactSetVersion,
  createSamplingEquivalenceClasses,
  evaluatePublishingGovernance,
  type PublishingGovernanceContext,
} from "../publishing-governance";

const items = publishedLocalContentPackages.map((contentPackage) => contentPackage.item);
const allImages = [...recipeImages, ...culinaryImages];
const contentRightsSources = [...culinarySources, ...m9RecipeResearchSources];
const contentRightsRegistry = createContentRightsRegistry({
  items,
  auditedItemIds: m10AuditedCulinaryItemIds,
  images: allImages,
  ingredients,
  stories: culinaryStories,
  evidence: culinaryEvidence,
  sources: contentRightsSources,
  researchRecords: m9RecipeResearchRecords,
});
const contentImageAssetVersions = createImageAssetVersions(allImages);
const contentLocalizationVersions = createPublishingLocalizationVersions(publishedLocalContentPackages, ingredients);
const context: PublishingGovernanceContext = {
  items,
  rightsRegistry: contentRightsRegistry,
  images: allImages,
  sources: contentRightsSources,
  evidence: culinaryEvidence,
  researchRecords: m9RecipeResearchRecords,
  ingredients,
  contentPaths: publishedLocalContentPackages.map((contentPackage) => ({
    itemId: contentPackage.itemId,
    kind: contentPackage.sourceKind === "legacy-recipe"
      ? "adapted-recipe" as const
      : contentPackage.sourceKind === "legacy-native"
        ? "native-culinary" as const
        : "standalone-package" as const,
  })),
  localizationVersions: contentLocalizationVersions,
  imageAssetVersions: contentImageAssetVersions,
};

function readyRegistry(): PublishingGovernanceRegistry {
  const registry = structuredClone(createPublishingGovernanceRegistry({
    items,
    rightsRegistry: contentRightsRegistry,
    images: allImages,
    sources: contentRightsSources,
    evidence: culinaryEvidence,
    researchRecords: m9RecipeResearchRecords,
    ingredients,
    contentPackages: publishedLocalContentPackages,
    localizationVersions: contentLocalizationVersions,
    imageAssetVersions: contentImageAssetVersions,
  }));
  const itemIds = registry.riskClassifications.map((entry) => entry.itemId) as [string, ...string[]];
  const artifactSetVersion = createArtifactSetVersion(itemIds, context);
  registry.attestations.forEach((attestation) => {
    attestation.artifactSetVersion = artifactSetVersion;
    attestation.reviewedCommit = "1111111111111111111111111111111111111111";
    attestation.evidenceReference = "test-fixture://independent-review";
  });
  const equivalenceClasses = createSamplingEquivalenceClasses(registry.riskClassifications);
  const sampledItemIds = [...new Set(equivalenceClasses.flatMap((entry) => entry.sampledItemIds))].sort();
  registry.samplingBatches = [{
    id: "sampling-test-ready",
    batchId: "test-ready",
    sequence: 1,
    policyVersion: registry.policyVersion,
    itemIds,
    artifactSetVersion,
    equivalenceClasses,
    author: structuredClone(registry.attestations[0].author),
    auditor: {
      actorType: "agent",
      actorId: "test-fixture:sampling-auditor",
      runId: "test-fixture-sampling-run",
      contextId: "test-fixture-sampling-context",
    },
    reviewedCommit: "1111111111111111111111111111111111111111",
    evidenceReference: "test-fixture://sampling-evidence",
    rubricVersion: "test-sampling-rubric-v1",
    verdict: "pass",
    samples: sampledItemIds.map((itemId) => ({
      itemId,
      equivalenceClassKeys: equivalenceClasses
        .filter((entry) => entry.sampledItemIds.includes(itemId))
        .map((entry) => entry.key) as [string, ...string[]],
      dimensions: ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"],
      verdict: "pass",
      findings: [],
    })),
    findings: [],
    auditorModifiedContent: false,
    metrics: {
      escapeCount: 0,
      reviewerDisagreementCount: 0,
      reworkItemCount: 0,
      provenanceLicenseNoveltyCount: 0,
    },
    auditedAt: "2026-09-06",
  }];
  return registry;
}

function issueCodes(registry: PublishingGovernanceRegistry, customContext = context) {
  return evaluatePublishingGovernance(registry, customContext).issues.map((issue) => issue.code);
}

describe("risk-based publishing governance", () => {
  it("keeps the real M10 migration fail closed until genuine sampling evidence is recorded", () => {
    const registry = createPublishingGovernanceRegistry({
      items,
      rightsRegistry: contentRightsRegistry,
      images: allImages,
      sources: contentRightsSources,
      evidence: culinaryEvidence,
      researchRecords: m9RecipeResearchRecords,
      ingredients,
      contentPackages: publishedLocalContentPackages,
      localizationVersions: contentLocalizationVersions,
      imageAssetVersions: contentImageAssetVersions,
    });
    expect(registry.samplingBatches).toEqual([]);
    expect(issueCodes(registry)).toContain("missing-sampling-coverage");
  });

  it("accepts a complete low-risk agent-review fixture without claiming human review", () => {
    const registry = readyRegistry();
    const result = evaluatePublishingGovernance(registry, context);
    expect(result.ready, result.issues.map((issue) => `${issue.code}:${issue.subjectId}`).join(", ")).toBe(true);
    expect(result.auditedItemIds).toHaveLength(50);
    expect(registry.attestations.every((entry) => entry.reviewer.actorType === "agent")).toBe(true);
    expect(registry.attestations.every((entry) => !entry.representations.humanApproval)).toBe(true);
  });

  it("requires every review dimension and a distinct author/reviewer actor, run, and context", () => {
    const missing = readyRegistry();
    missing.attestations = missing.attestations.filter((entry) => entry.dimension !== "provenance");
    expect(issueCodes(missing)).toContain("missing-review-dimension");

    const sameContext = readyRegistry();
    sameContext.attestations[0].reviewer.contextId = sameContext.attestations[0].author.contextId;
    sameContext.attestations[0].reviewer.runId = sameContext.attestations[0].author.runId;
    expect(issueCodes(sameContext)).toContain("reviewer-not-independent");
  });

  it("fails closed when a published item has no risk or review record", () => {
    const unreviewedItem = {
      ...structuredClone(items[0]),
      id: "unreviewed-new-item",
      slug: "unreviewed-new-item",
    };
    const expandedContext = { ...context, items: [...items, unreviewedItem] };
    expect(issueCodes(readyRegistry(), expandedContext)).toContain("missing-risk-classification");
  });

  it("blocks reviewer edits, unresolved findings, and agent claims of human, field, or legal review", () => {
    const registry = readyRegistry();
    Object.assign(registry.attestations[0], { reviewerModifiedContent: true });
    registry.attestations[1].findings = [{ code: "unresolved", kind: "quality", severity: "major", summary: "Open", disposition: "unresolved" }];
    registry.attestations[2].representations.humanApproval = true;
    expect(issueCodes(registry)).toEqual(expect.arrayContaining([
      "reviewer-modified-content",
      "unresolved-review-finding",
      "review-claim-misrepresentation",
    ]));
  });

  it("requires durable evidence and never infers human approval from an agent label", () => {
    const registry = readyRegistry();
    registry.attestations[0].evidenceReference = "";
    registry.attestations[1].dimension = "human-approval";
    registry.attestations[1].representations.humanApproval = true;
    expect(issueCodes(registry)).toEqual(expect.arrayContaining([
      "invalid-review-attestation",
      "review-claim-misrepresentation",
    ]));
  });

  it("invalidates PASS when an artifact version changes", () => {
    const registry = readyRegistry();
    const changedRights = structuredClone(contentRightsRegistry);
    changedRights.artifacts[0].version = "clv1-content-changed-after-review";
    const changedContext = { ...context, rightsRegistry: changedRights };
    expect(issueCodes(registry, changedContext)).toEqual(expect.arrayContaining([
      "stale-review-attestation",
      "stale-risk-classification",
      "missing-sampling-coverage",
    ]));
  });

  it("invalidates PASS when any reviewed provenance, rights, attribution, AI, data, translation, or image byte dependency changes", () => {
    const usedArtifact = contentRightsRegistry.artifacts.find((artifact) => artifact.sourceIds.length > 0)!;
    const usedSourceId = usedArtifact.sourceIds[0];
    const sourceContext = structuredClone(context);
    const source = sourceContext.sources.find((entry) => entry.id === usedSourceId)!;
    const urlLocator = source.locators.find((locator) => locator.kind === "url")!;
    if (urlLocator.kind === "url") urlLocator.url = "https://changed.example.test/source";
    expect(issueCodes(readyRegistry(), sourceContext)).toContain("stale-review-attestation");

    const evidenceArtifact = contentRightsRegistry.artifacts.find((artifact) => artifact.evidenceIds.length > 0)!;
    const evidenceContext = structuredClone(context);
    evidenceContext.evidence.find((entry) => entry.id === evidenceArtifact.evidenceIds[0])!.editorialNote += " changed";
    expect(issueCodes(readyRegistry(), evidenceContext)).toContain("stale-review-attestation");

    const researchContext = structuredClone(context);
    const researchRecord = researchContext.researchRecords.find((entry) => items.some((item) => item.id === entry.subject.id))!;
    researchRecord.editorialDecision += " changed";
    expect(issueCodes(readyRegistry(), researchContext)).toContain("stale-review-attestation");

    const rightsContext = structuredClone(context);
    rightsContext.rightsRegistry.assessments[0].authorityVersion += "-changed";
    expect(issueCodes(readyRegistry(), rightsContext)).toContain("stale-review-attestation");

    const attributionContext = structuredClone(context);
    attributionContext.rightsRegistry.attributions[0].notice += " changed";
    expect(issueCodes(readyRegistry(), attributionContext)).toContain("stale-review-attestation");

    const aiContext = structuredClone(context);
    const aiArtifact = aiContext.rightsRegistry.artifacts.find((artifact) => artifact.kind === "identity")!;
    aiContext.rightsRegistry.ai = [{
      id: "test-ai-record",
      artifactId: aiArtifact.id,
      provider: "test-provider",
      model: "test-model",
      modelVersion: "test-model-v2",
      generatedAt: "2026-09-06",
      termsUrl: "https://example.test/terms",
      termsEffectiveDate: "2026-09-01",
      promptTemplateVersion: "test-prompt-v2",
      inputArtifactIds: [],
      inputRightsReviewed: true,
      reviewAttestationIds: ["test-attestation"],
      similarityReview: "passed",
      trademarkReview: "not-applicable",
    }];
    expect(issueCodes(readyRegistry(), aiContext)).toContain("stale-review-attestation");

    const nutritionContext = structuredClone(context);
    const nutrition = nutritionContext.rightsRegistry.nutrition.find((entry) => entry.kind === "editorial-estimate")!;
    if (nutrition.kind === "editorial-estimate") nutrition.method += " changed";
    expect(issueCodes(readyRegistry(), nutritionContext)).toContain("stale-review-attestation");

    const translationPathContext = structuredClone(context);
    translationPathContext.localizationVersions[0].path = translationPathContext.localizationVersions[0].path === "adapted-recipe"
      ? "native-culinary"
      : "adapted-recipe";
    expect(issueCodes(readyRegistry(), translationPathContext)).toContain("stale-review-attestation");

    const translationCopyContext = structuredClone(context);
    translationCopyContext.localizationVersions[0].localeVersions[1].version = "clv1-0000000000000000";
    expect(issueCodes(readyRegistry(), translationCopyContext)).toContain("stale-review-attestation");

    const imageBytesContext = structuredClone(context);
    imageBytesContext.imageAssetVersions[0].sha256 = "0".repeat(64);
    expect(issueCodes(readyRegistry(), imageBytesContext)).toContain("stale-review-attestation");
  });

  it("publishes CC0 and public-domain image provenance without inventing a license obligation", () => {
    const item = items.find((entry) => entry.id === "thai-green-papaya-salad")!;
    const imageId = item.images.availability === "available" ? item.images.references.primaryImageId : undefined;
    const disclosure = buildConsumerRightsDisclosure(item.id, imageId, item.storyIds, contentRightsRegistry, "en");
    const provenance = disclosure.attributions.find((entry) => entry.disclosureKind === "provenance-only");
    expect(provenance).toBeDefined();
    expect(provenance?.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    const artifact = contentRightsRegistry.artifacts.find((entry) => entry.subject.type === "image" && entry.subject.id === imageId)!;
    expect(artifact.attributionRequirementIds).toEqual([]);
    const assessment = contentRightsRegistry.assessments.find((entry) => entry.id === artifact.rightsAssessmentId)!;
    expect(assessment.attributionRequirementIds).toEqual([]);
    expect(assessment.permissions.publish.status).toBe("allowed");

    const missingDisclosure = structuredClone(contentRightsRegistry);
    missingDisclosure.attributions = missingDisclosure.attributions.filter((entry) => entry.id !== provenance?.id);
    const rightsResult = evaluateContentRightsRegistry(missingDisclosure, {
      items,
      images: allImages,
      ingredients,
      stories: culinaryStories,
      evidence: culinaryEvidence,
      sources: contentRightsSources,
      researchRecords: m9RecipeResearchRecords,
      now: "2026-09-06",
    });
    expect(rightsResult.issues.map((issue) => issue.code)).toContain("missing-reference");
  });

  it("requires separate reviewer contexts for medium risk", () => {
    const registry = readyRegistry();
    const itemId = registry.riskClassifications[0].itemId;
    registry.riskClassifications[0].level = "medium";
    registry.riskClassifications[0].reasonCodes = ["culinary-authenticity-judgment"];
    expect(issueCodes(registry)).toContain("insufficient-medium-independence");

    const secondReviewer = {
      actorType: "agent" as const,
      actorId: "codex-agent:content-reviewer",
      runId: "content-review-run-2",
      contextId: "content-review-context-2",
    };
    const contentDimensions = new Set(["factual-culinary", "editorial", "visual-image"]);
    registry.attestations = [
      ...registry.attestations,
      ...registry.attestations
        .filter((entry) => contentDimensions.has(entry.dimension) && entry.itemIds.includes(itemId))
        .map((entry): ReviewAttestation => ({
          ...structuredClone(entry),
          id: `${entry.id}-second-context`,
          reviewer: secondReviewer,
        })),
    ];
    expect(issueCodes(registry)).not.toContain("insufficient-medium-independence");
  });

  it("escalates unresolved reviewer disagreement beyond LOW or MEDIUM", () => {
    const registry = readyRegistry();
    const itemId = registry.riskClassifications[0].itemId;
    const disagreementAttestation = structuredClone(registry.attestations[0]);
    disagreementAttestation.id = "attestation-unresolved-disagreement";
    disagreementAttestation.itemIds = [itemId];
    disagreementAttestation.artifactSetVersion = createArtifactSetVersion([itemId], context);
    disagreementAttestation.verdict = "revise";
    disagreementAttestation.findings = [{
      code: "reviewers-disagree-on-authenticity",
      kind: "reviewer-disagreement",
      severity: "major",
      summary: "The reviewers disagree on a material culinary claim.",
      disposition: "unresolved",
    }];
    registry.attestations = [...registry.attestations, disagreementAttestation];
    expect(issueCodes(registry)).toEqual(expect.arrayContaining(["under-classified-risk", "unresolved-review-finding"]));

    registry.riskClassifications[0].level = "high";
    registry.riskClassifications[0].reasonCodes = ["unresolved-reviewer-disagreement", "clear-first-party-or-reference-only-rights"];
    expect(issueCodes(registry)).not.toContain("under-classified-risk");
    expect(issueCodes(registry)).toContain("high-risk-human-checkpoint");
  });

  it("keeps high risk blocked until an explicit non-agent human approval checkpoint", () => {
    const registry = readyRegistry();
    const classification = registry.riskClassifications[0];
    classification.level = "high";
    classification.reasonCodes = ["professional-legal-checkpoint"];
    expect(issueCodes(registry)).toContain("high-risk-human-checkpoint");

    const template = registry.attestations[0];
    registry.attestations = [...registry.attestations, {
      ...structuredClone(template),
      id: "human-approval-test",
      dimension: "human-approval",
      reviewer: {
        actorType: "lawyer",
        actorId: "lawyer:test-reviewer",
        runId: "legal-review-run",
        contextId: "legal-review-context",
      },
      representations: { humanApproval: true, culinaryFieldTest: false, legalOpinion: true },
    }];
    expect(issueCodes(registry)).not.toContain("high-risk-human-checkpoint");
  });

  it("uses risk-class coverage and freezes classes after major findings", () => {
    const missing = readyRegistry();
    const key = missing.riskClassifications[0].equivalenceClassKeys[0];
    missing.samplingBatches[0].equivalenceClasses = missing.samplingBatches[0].equivalenceClasses.filter((entry) => entry.key !== key) as typeof missing.samplingBatches[0]["equivalenceClasses"];
    expect(issueCodes(missing)).toContain("missing-sampling-coverage");

    const frozen = readyRegistry();
    const frozenKey = frozen.samplingBatches[0].equivalenceClasses[0].key;
    frozen.samplingBatches[0].findings = [{
      code: "major-sampling-finding",
      kind: "quality",
      severity: "major",
      summary: "A major escape freezes this risk class.",
      disposition: "resolved",
      equivalenceClassKeys: [frozenKey],
    }];
    frozen.samplingBatches[0].metrics.escapeCount = 1;
    expect(issueCodes(frozen)).toContain("sampling-class-frozen");

    const recovered = readyRegistry();
    recovered.samplingBatches[0].findings = structuredClone(frozen.samplingBatches[0].findings);
    recovered.samplingBatches[0].metrics.escapeCount = 1;
    const second = structuredClone(recovered.samplingBatches[0]);
    second.id = "sampling-recovery-2";
    second.batchId = "sampling-recovery-2";
    second.sequence = 2;
    second.previousBatchId = recovered.samplingBatches[0].id;
    second.findings = [];
    second.metrics.escapeCount = 0;
    setFullReview(second, frozenKey);
    const third = structuredClone(second);
    third.id = "sampling-recovery-3";
    third.batchId = "sampling-recovery-3";
    third.sequence = 3;
    third.previousBatchId = second.id;
    recovered.samplingBatches = [...recovered.samplingBatches, second, third];
    expect(issueCodes(recovered)).not.toContain("sampling-class-frozen");
  });

  it("requires two consecutive clean 100% recovery batches after an automatic class freeze", () => {
    const registry = readyRegistry();
    const frozenKey = registry.samplingBatches[0].equivalenceClasses[0].key;
    registry.samplingBatches[0].findings = [{
      code: "major-escape",
      kind: "quality",
      severity: "major",
      summary: "A major escape freezes this class.",
      disposition: "resolved",
      equivalenceClassKeys: [frozenKey],
    }];
    registry.samplingBatches[0].metrics.escapeCount = 1;

    const oneClean = makeNextSamplingBatch(registry, "sampling-clean-2");
    setFullReview(oneClean, frozenKey);
    registry.samplingBatches = [...registry.samplingBatches, oneClean];
    expect(issueCodes(registry)).toContain("sampling-class-frozen");

    const twoClean = makeNextSamplingBatch(registry, "sampling-clean-3");
    setFullReview(twoClean, frozenKey);
    registry.samplingBatches = [...registry.samplingBatches, twoClean];
    expect(issueCodes(registry)).not.toContain("sampling-class-frozen");
  });

  it("freezes every sampled risk class after a resolved sample-level major finding until two clean full reviews", () => {
    const registry = readyRegistry();
    const sample = registry.samplingBatches[0].samples.find((entry) => entry.equivalenceClassKeys.length > 1)!;
    sample.findings = [{
      code: "sample-major-escape",
      kind: "quality",
      severity: "major",
      summary: "A resolved major issue was discovered in this sampled item.",
      disposition: "resolved",
    }];
    registry.samplingBatches[0].metrics.escapeCount = 1;

    expect(issueCodes(registry)).toContain("sampling-class-frozen");

    const oneClean = makeNextSamplingBatch(registry, "sample-major-clean-2");
    oneClean.samples.forEach((entry) => { entry.findings = []; });
    for (const classKey of sample.equivalenceClassKeys) setFullReview(oneClean, classKey);
    registry.samplingBatches = [...registry.samplingBatches, oneClean];
    expect(issueCodes(registry)).toContain("sampling-class-frozen");

    const twoClean = makeNextSamplingBatch(registry, "sample-major-clean-3");
    twoClean.samples.forEach((entry) => { entry.findings = []; });
    for (const classKey of sample.equivalenceClassKeys) setFullReview(twoClean, classKey);
    registry.samplingBatches = [...registry.samplingBatches, twoClean];
    expect(issueCodes(registry)).not.toContain("sampling-class-frozen");
  });

  it("requires sampling escape metrics to agree with batch-level and sample-level major findings", () => {
    const uncounted = readyRegistry();
    uncounted.samplingBatches[0].samples[0].findings = [{
      code: "uncounted-major",
      kind: "quality",
      severity: "major",
      summary: "This major finding must be represented by the escape metric.",
      disposition: "resolved",
    }];
    expect(issueCodes(uncounted)).toContain("sampling-metrics-invalid");

    const unexplained = readyRegistry();
    unexplained.samplingBatches[0].metrics.escapeCount = 1;
    expect(issueCodes(unexplained)).toContain("sampling-metrics-invalid");
  });

  it("rejects forged sampling sequence and previous-batch chains", () => {
    const registry = readyRegistry();
    const second = makeNextSamplingBatch(registry, "sampling-chain-2");
    second.sequence = 7;
    second.previousBatchId = "not-the-previous-record";
    registry.samplingBatches = [...registry.samplingBatches, second];
    expect(issueCodes(registry)).toContain("sampling-metrics-invalid");
  });

  it("keeps stale sampling as history but never uses it for current publication coverage", () => {
    const registry = readyRegistry();
    const historical = structuredClone(registry.samplingBatches[0]);
    historical.id = "sampling-historical-revise";
    historical.batchId = "historical-revise";
    historical.artifactSetVersion = "clv1-0000000000000000";
    historical.verdict = "revise";
    historical.samples[0].verdict = "revise";
    historical.samples[0].findings = [{ code: "historical-finding", kind: "quality", severity: "minor", summary: "Fixed later.", disposition: "unresolved" }];
    const current = structuredClone(registry.samplingBatches[0]);
    current.id = "sampling-current-pass";
    current.batchId = "current-pass";
    current.sequence = 2;
    current.previousBatchId = historical.id;
    registry.samplingBatches = [historical, current];
    expect(issueCodes(registry)).not.toEqual(expect.arrayContaining(["unresolved-review-finding", "missing-sampling-coverage"]));

    current.artifactSetVersion = "clv1-1111111111111111";
    expect(issueCodes(registry)).toContain("missing-sampling-coverage");
  });

  it("rejects fake samples and class membership that differs from current classifications", () => {
    const registry = readyRegistry();
    const target = registry.samplingBatches[0].equivalenceClasses[0];
    target.itemIds = [...target.itemIds, "fake-item"] as [string, ...string[]];
    target.sampledItemIds = ["fake-item"];
    expect(issueCodes(registry)).toContain("missing-sampling-coverage");

    const fakeSample = readyRegistry();
    fakeSample.samplingBatches[0].samples[0].itemId = "fake-item";
    expect(issueCodes(fakeSample)).toContain("missing-sampling-coverage");
  });

  it("requires sampling QA to use a third context and durable evidence", () => {
    const registry = readyRegistry();
    registry.samplingBatches[0].auditor = structuredClone(registry.attestations[0].reviewer);
    registry.samplingBatches[0].evidenceReference = "";
    Object.assign(registry.samplingBatches[0], { auditorModifiedContent: true });
    expect(issueCodes(registry)).toEqual(expect.arrayContaining([
      "reviewer-not-independent",
      "missing-sampling-coverage",
      "reviewer-modified-content",
    ]));
  });
});

function makeNextSamplingBatch(registry: PublishingGovernanceRegistry, id: string) {
  const previous = registry.samplingBatches.at(-1)!;
  return {
    ...structuredClone(previous),
    id,
    batchId: id,
    sequence: previous.sequence + 1,
    previousBatchId: previous.id,
    findings: [],
    metrics: { ...previous.metrics, escapeCount: 0 },
  };
}

function setFullReview(batch: PublishingGovernanceRegistry["samplingBatches"][number], classKey: string) {
  const equivalence = batch.equivalenceClasses.find((entry) => entry.key === classKey)!;
  equivalence.sampledItemIds = [...equivalence.itemIds] as [string, ...string[]];
  for (const itemId of equivalence.itemIds) {
    const existing = batch.samples.find((sample) => sample.itemId === itemId);
    if (existing) {
      if (!existing.equivalenceClassKeys.includes(classKey)) existing.equivalenceClassKeys.push(classKey);
      continue;
    }
    batch.samples.push({
      itemId,
      equivalenceClassKeys: [classKey],
      dimensions: ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"],
      verdict: "pass",
      findings: [],
    });
  }
}
