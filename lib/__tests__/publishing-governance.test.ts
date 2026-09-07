import { describe, expect, it } from "vitest";
import { createContentRightsRegistry, createM10TextArtifactDerivations, m10AuditedCulinaryItemIds } from "@/data/content-rights";
import { culinaryImages } from "@/data/culinary/images";
import { culinaryEvidence } from "@/data/culinary/evidence";
import { culinarySources } from "@/data/culinary/sources";
import { culinaryStories } from "@/data/culinary/stories";
import { ingredients } from "@/data/ingredients";
import { publishedLocalContentPackages } from "@/data/content-packages";
import { createPublishingGovernanceRegistry, publishingGovernancePolicyVersion } from "@/data/publishing-governance";
import { createPublishingLocalizationVersions } from "@/data/publishing-localization-versions";
import { recipeImages } from "@/data/recipe-images";
import { m9RecipeResearchRecords, m9RecipeResearchSources } from "@/data/research/m9-recipe-research";
import type { Evidence, Source } from "@/types/culinary";
import { createImageAssetVersions } from "../image-asset-version";
import { buildConsumerRightsDisclosure } from "../content-rights-consumer";
import { evaluateContentRightsRegistry } from "../content-rights";
import type { PublishingGovernanceRegistry, ReviewAttestation } from "@/types/publishing-governance";
import {
  createArtifactSetVersion,
  createSamplingBatchEvidenceDigest,
  deriveProvenanceLicenseNoveltyClassKeys,
  createSamplingEquivalenceClasses,
  deriveEquivalenceClassKeys,
  evaluatePublishingGovernance,
  type PublishingGovernanceContext,
} from "../publishing-governance";

const items = publishedLocalContentPackages.map((contentPackage) => contentPackage.item);
const allImages = [...recipeImages, ...culinaryImages];
const contentRightsSources = [...culinarySources, ...m9RecipeResearchSources];
const m10ItemIdSet = new Set<string>(m10AuditedCulinaryItemIds);
const m10ContentPackages = publishedLocalContentPackages.filter((contentPackage) => (
  m10ItemIdSet.has(contentPackage.itemId)
));
const m10Items = m10ContentPackages.map((contentPackage) => contentPackage.item);
const m10ContentRightsRegistry = createContentRightsRegistry({
  items: m10Items,
  auditedItemIds: m10AuditedCulinaryItemIds,
  images: allImages,
  ingredients,
  stories: culinaryStories,
  evidence: culinaryEvidence,
  sources: contentRightsSources,
  researchRecords: m9RecipeResearchRecords,
  restaurantRequirements: [],
  restaurants: [],
  textArtifactDerivations: createM10TextArtifactDerivations(m10Items, culinaryStories, m9RecipeResearchRecords),
});
const m10ContentLocalizationVersions = createPublishingLocalizationVersions(m10ContentPackages, ingredients);
const m10Context: PublishingGovernanceContext = {
  items: m10Items,
  rightsRegistry: m10ContentRightsRegistry,
  images: allImages,
  sources: contentRightsSources,
  evidence: culinaryEvidence,
  stories: culinaryStories,
  researchRecords: m9RecipeResearchRecords,
  ingredients,
  contentPaths: m10ContentPackages.map((contentPackage) => ({
    itemId: contentPackage.itemId,
    kind: contentPackage.sourceKind === "legacy-recipe"
      ? "adapted-recipe" as const
      : "native-culinary" as const,
  })),
  localizationVersions: m10ContentLocalizationVersions,
  imageAssetVersions: createImageAssetVersions(allImages),
};
const contentRightsRegistry = createContentRightsRegistry({
  items,
  auditedItemIds: m10AuditedCulinaryItemIds,
  images: allImages,
  ingredients,
  stories: culinaryStories,
  evidence: culinaryEvidence,
  sources: contentRightsSources,
  researchRecords: m9RecipeResearchRecords,
  restaurantRequirements: [],
  restaurants: [],
  textArtifactDerivations: createM10TextArtifactDerivations(items, culinaryStories, m9RecipeResearchRecords),
});
const contentImageAssetVersions = createImageAssetVersions(allImages);
const contentLocalizationVersions = createPublishingLocalizationVersions(publishedLocalContentPackages, ingredients);
const context: PublishingGovernanceContext = {
  items,
  rightsRegistry: contentRightsRegistry,
  images: allImages,
  sources: contentRightsSources,
  evidence: culinaryEvidence,
  stories: culinaryStories,
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
    stories: culinaryStories,
    researchRecords: m9RecipeResearchRecords,
    ingredients,
    contentPackages: publishedLocalContentPackages,
    localizationVersions: contentLocalizationVersions,
    imageAssetVersions: contentImageAssetVersions,
  }));
  const itemIds = registry.riskClassifications.map((entry) => entry.itemId) as [string, ...string[]];
  registry.attestations.forEach((attestation) => {
    attestation.artifactSetVersion = createArtifactSetVersion(attestation.itemIds, context);
    attestation.reviewedCommit = "1111111111111111111111111111111111111111";
    attestation.evidenceReference = "test-fixture://independent-review";
  });
  const mediumItemIds = registry.riskClassifications
    .filter((entry) => entry.level === "medium")
    .map((entry) => entry.itemId) as [string, ...string[]];
  if (mediumItemIds.length) {
    const secondReviewer = {
      actorType: "agent" as const,
      actorId: "test-fixture:medium-content-reviewer",
      runId: "test-fixture-medium-content-run",
      contextId: "test-fixture-medium-content-context",
    };
    registry.attestations = [
      ...registry.attestations,
      ...(["factual-culinary", "editorial", "visual-image"] as const).map((dimension): ReviewAttestation => ({
        ...structuredClone(registry.attestations[0]),
        id: `attestation-test-medium-${dimension}`,
        batchId: "test-medium-review",
        dimension,
        itemIds: mediumItemIds,
        artifactSetVersion: createArtifactSetVersion(mediumItemIds, context),
        reviewer: secondReviewer,
      })),
    ];
  }
  const artifactSetVersion = createArtifactSetVersion(itemIds, context);
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
      provenanceLicenseNoveltyCount: deriveProvenanceLicenseNoveltyClassKeys(equivalenceClasses).length,
      reworkItemIds: [],
      provenanceLicenseNoveltyClassKeys: deriveProvenanceLicenseNoveltyClassKeys(equivalenceClasses),
    },
    auditedAt: "2026-09-06",
    evidenceDigest: "clv1-placeholder00000000",
  }];
  sealSamplingBatch(registry.samplingBatches[0]);
  return registry;
}

function issueCodes(registry: PublishingGovernanceRegistry, customContext = context) {
  return evaluatePublishingGovernance(registry, customContext).issues.map((issue) => issue.code);
}

describe("risk-based publishing governance", () => {
  it("preserves failed sampling history and clears only after two current clean recovery batches", () => {
    const registry = createPublishingGovernanceRegistry({
      items: m10Items,
      rightsRegistry: m10ContentRightsRegistry,
      images: allImages,
      sources: contentRightsSources,
      evidence: culinaryEvidence,
      stories: culinaryStories,
      researchRecords: m9RecipeResearchRecords,
      ingredients,
      contentPackages: m10ContentPackages,
      localizationVersions: m10ContentLocalizationVersions,
      imageAssetVersions: contentImageAssetVersions,
    });
    expect(registry.samplingBatches).toHaveLength(5);
    expect(registry.samplingBatches[0]).toMatchObject({
      artifactSetVersion: "clv1-f30d9a1f9213c90c",
      reviewedCommit: "81afe4c16abd66e93dab9a4afb75f4e6624bfab6",
      verdict: "revise",
      metrics: { escapeCount: 1, reworkItemCount: 0 },
    });
    expect(registry.samplingBatches[0].samples.find((entry) => entry.itemId === "thai-green-papaya-salad")?.findings)
      .toEqual(expect.arrayContaining([expect.objectContaining({
        code: "visual-ingredient-mismatch-cashew-peanut",
        equivalenceClassKeys: ["visual-fidelity:dish"],
      })]));
    expect(registry.samplingBatches[1]).toMatchObject({
      id: "sampling-m10-existing-50-9c018f6-recovery-2",
      previousBatchId: "sampling-m10-existing-50-81afe4c-revise",
      verdict: "pass",
      metrics: { escapeCount: 0, reworkItemCount: 4 },
    });
    expect(registry.samplingBatches[2]).toMatchObject({
      id: "sampling-m10-existing-50-9c018f6-recovery-3",
      previousBatchId: "sampling-m10-existing-50-9c018f6-recovery-2",
      verdict: "revise",
      metrics: { escapeCount: 0, reworkItemCount: 0 },
    });
    expect(registry.samplingBatches[2].samples.find((entry) => entry.itemId === "hunan-chili-pork")?.findings)
      .toEqual(expect.arrayContaining([expect.objectContaining({
        code: "hero-alt-container-and-pepper-color-mismatch",
        severity: "minor",
        disposition: "unresolved",
      })]));
    expect(registry.samplingBatches[3]).toMatchObject({
      id: "sampling-m10-existing-50-849a313-recovery-4",
      previousBatchId: "sampling-m10-existing-50-9c018f6-recovery-3",
      verdict: "pass",
      metrics: { escapeCount: 0, reworkItemCount: 1 },
    });
    expect(registry.samplingBatches[4]).toMatchObject({
      id: "sampling-m10-existing-50-849a313-recovery-5",
      previousBatchId: "sampling-m10-existing-50-849a313-recovery-4",
      verdict: "pass",
      metrics: { escapeCount: 0, reworkItemCount: 0 },
    });
    expect(issueCodes(registry, m10Context)).not.toContain("missing-sampling-coverage");
    expect(issueCodes(registry, m10Context)).not.toContain("sampling-class-frozen");
    expect(issueCodes(registry, m10Context)).not.toContain("sampling-metrics-invalid");
    expect(evaluatePublishingGovernance(registry, m10Context).ready).toBe(true);
    expect(registry.attestations.filter((entry) => entry.batchId === "issue-96-medium-content-visual-9c018f6-run-0276f44d"))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ reviewedCommit: "9c018f6be00be66ea89d59e37d0feab2da0a2995" }),
      ]));
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

  it("requires current AI attestations whose author matches the generation record and whose reviewer is independent", () => {
    const fixture = () => {
      const aiContext = structuredClone(context);
      const item = items.find((entry) => (
        aiContext.rightsRegistry.artifacts.some((artifact) => (
          artifact.subject.type === "culinary-item"
          && artifact.subject.id === entry.id
          && artifact.kind === "identity"
        ))
      ))!;
      const artifact = aiContext.rightsRegistry.artifacts.find((entry) => (
        entry.subject.type === "culinary-item"
        && entry.subject.id === item.id
        && entry.kind === "identity"
      ))!;
      artifact.derivation = "generated";
      const governance = readyRegistry();
      const linked = (["rights-license", "provenance", "editorial"] as const).map((dimension) => (
        governance.attestations.find((attestation) => (
          attestation.dimension === dimension && attestation.itemIds.includes(item.id)
        ))!
      ));
      aiContext.rightsRegistry.ai = [{
        id: "test-ai-attestation-record",
        artifactId: artifact.id,
        outputArtifactVersion: artifact.version,
        author: structuredClone(linked[0].author) as typeof linked[0]["author"] & { actorType: "agent" },
        provider: "test-provider",
        model: "test-model",
        modelVersion: "test-model-v1",
        generatedAt: "2026-09-06",
        serviceChain: [{ serviceId: "test-provider", provider: "test-provider", role: "model-provider", termsAssessmentId: "test-ai-terms" }],
        termsAssessmentIds: ["test-ai-terms"],
        promptTemplateId: "test-prompt",
        promptTemplateVersion: "test-prompt-v1",
        promptTemplateHash: "clv1-1111111111111111",
        inputArtifactIds: ["test-ai-input"],
        reviewAttestationIds: linked.map((attestation) => attestation.id) as [string, ...string[]],
        similarityReview: "passed",
        trademarkReview: "not-applicable",
      }];
      for (const attestation of linked) {
        attestation.artifactSetVersion = createArtifactSetVersion(attestation.itemIds, aiContext);
      }
      return { aiContext, artifact, governance, linked };
    };

    const valid = fixture();
    expect(issueCodes(valid.governance, valid.aiContext)).not.toContain("ai-attestation-missing");

    const mismatchedAuthor = fixture();
    mismatchedAuthor.aiContext.rightsRegistry.ai[0].author.actorId = "different-ai-author";
    expect(issueCodes(mismatchedAuthor.governance, mismatchedAuthor.aiContext)).toContain("ai-attestation-missing");

    const missingDimension = fixture();
    missingDimension.aiContext.rightsRegistry.ai[0].reviewAttestationIds = missingDimension.aiContext.rightsRegistry.ai[0].reviewAttestationIds
      .filter((id) => id !== missingDimension.linked[2].id) as [string, ...string[]];
    expect(issueCodes(missingDimension.governance, missingDimension.aiContext)).toContain("ai-attestation-missing");

    const staleArtifact = fixture();
    staleArtifact.artifact.version = "clv1-stale-after-ai-review";
    expect(issueCodes(staleArtifact.governance, staleArtifact.aiContext)).toContain("ai-attestation-missing");

    const nonIndependent = fixture();
    nonIndependent.linked[0].reviewer.runId = nonIndependent.aiContext.rightsRegistry.ai[0].author.runId;
    expect(issueCodes(nonIndependent.governance, nonIndependent.aiContext)).toEqual(expect.arrayContaining([
      "reviewer-not-independent",
      "ai-attestation-missing",
    ]));
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

    const storyContext = structuredClone(context);
    storyContext.stories[0].content.entries[0].value.dek += " changed";
    expect(issueCodes(readyRegistry(), storyContext)).toContain("stale-review-attestation");

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
      outputArtifactVersion: aiArtifact.version,
      author: {
        actorType: "agent",
        actorId: "test-ai-author",
        runId: "test-ai-author-run",
        contextId: "test-ai-author-context",
      },
      provider: "test-provider",
      model: "test-model",
      modelVersion: "test-model-v2",
      generatedAt: "2026-09-06",
      serviceChain: [{ serviceId: "test-provider", provider: "test-provider", role: "model-provider", termsAssessmentId: "test-ai-terms" }],
      termsAssessmentIds: ["test-ai-terms"],
      promptTemplateId: "test-prompt",
      promptTemplateVersion: "test-prompt-v2",
      promptTemplateHash: "clv1-1111111111111111",
      inputArtifactIds: ["test-ai-input"],
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

  it("fingerprints used dataset and cost assessments plus versioned AI input and terms records", () => {
    const item = items.find((entry) =>
      "inputs" in entry.preparation
      && entry.preparation.inputs.length > 0
      && contentRightsRegistry.artifacts.some((artifact) =>
        artifact.subject.type === "culinary-item"
        && artifact.subject.id === entry.id
        && artifact.sourceIds.length > 0))!;
    const itemIds = [item.id];

    const costContext = structuredClone(context);
    const ingredientId = "inputs" in item.preparation ? item.preparation.inputs[0].ingredientId : "";
    const costProvenanceId = costContext.ingredients.find((entry) => entry.id === ingredientId)!.costProvenanceId;
    const costAssessmentId = costContext.rightsRegistry.costs.find((entry) => entry.id === costProvenanceId)!.rightsAssessmentId;
    const costVersion = createArtifactSetVersion(itemIds, costContext);
    costContext.rightsRegistry.assessments.find((entry) => entry.id === costAssessmentId)!.authorityVersion += "-changed";
    expect(createArtifactSetVersion(itemIds, costContext)).not.toBe(costVersion);

    const datasetContext = structuredClone(context);
    const dataset = datasetContext.rightsRegistry.datasets[0];
    Object.assign(datasetContext.rightsRegistry, {
      nutrition: datasetContext.rightsRegistry.nutrition.map((entry) => entry.ingredientId === ingredientId
        ? {
            ingredientId,
            kind: "dataset" as const,
            datasetId: dataset.id,
            upstreamRecordId: "test-food-code",
            basis: "per-100g" as const,
            conversionMethod: "identity-per-100g",
            accessedAt: "2026-09-06",
            reviewer: "test-fixture",
          }
        : entry),
    });
    const datasetVersion = createArtifactSetVersion(itemIds, datasetContext);
    datasetContext.rightsRegistry.assessments.find((entry) => entry.id === dataset.rightsAssessmentId)!.authorityVersion += "-changed";
    expect(createArtifactSetVersion(itemIds, datasetContext)).not.toBe(datasetVersion);

    const aiContext = structuredClone(context);
    const outputArtifact = aiContext.rightsRegistry.artifacts.find((entry) => entry.subject.type === "culinary-item" && entry.subject.id === item.id)!;
    const inputResearchRecord = aiContext.researchRecords.find((record) => record.subject.id === item.id)!;
    const sourceAssessmentIds = outputArtifact.sourceIds.map((sourceId) => `source-rights-${sourceId}`);
    const baseAssessment = structuredClone(aiContext.rightsRegistry.assessments[0]);
    const inputAssessment = {
      ...structuredClone(baseAssessment),
      id: "rights-test-ai-input",
      subject: { type: "ai-input" as const, id: "test-ai-input" },
    };
    const termsAssessment = {
      ...structuredClone(baseAssessment),
      id: "rights-test-ai-service",
      subject: { type: "ai-service" as const, id: "test-ai-service" },
      basis: { kind: "terms" as const, provider: "test-provider", termsUrl: "https://example.test/terms", effectiveDate: "2026-09-01" },
    };
    outputArtifact.derivation = "generated";
    Object.assign(aiContext.rightsRegistry, {
      assessments: [...aiContext.rightsRegistry.assessments, inputAssessment, termsAssessment],
      aiInputs: [{
        id: "test-ai-input",
        version: "ai-input-v1",
        contentHash: "clv1-1111111111111111",
        kind: "structured-research-bundle" as const,
        sourceIds: [...outputArtifact.sourceIds],
        evidenceIds: [...outputArtifact.evidenceIds],
        researchRecordIds: [inputResearchRecord.id],
        rightsAssessmentIds: [inputAssessment.id, ...sourceAssessmentIds] as [string, ...string[]],
        containsThirdPartyExpression: false as const,
      }],
      ai: [{
        id: "test-transitive-ai-record",
        artifactId: outputArtifact.id,
        outputArtifactVersion: outputArtifact.version,
        author: { actorType: "agent" as const, actorId: "test-author", runId: "test-author-run", contextId: "test-author-context" },
        provider: "test-provider",
        model: "test-model",
        modelVersion: "test-model-v1",
        generatedAt: "2026-09-06",
        serviceChain: [{
          serviceId: "test-ai-service",
          provider: "test-provider",
          role: "model-provider" as const,
          termsAssessmentId: termsAssessment.id,
        }],
        termsAssessmentIds: [termsAssessment.id] as [string, ...string[]],
        promptTemplateId: "test-prompt",
        promptTemplateVersion: "test-prompt-v1",
        promptTemplateHash: "clv1-2222222222222222",
        inputArtifactIds: ["test-ai-input"] as [string, ...string[]],
        reviewAttestationIds: ["test-attestation"],
        similarityReview: "passed",
        trademarkReview: "not-applicable",
      }],
    });
    const aiVersion = createArtifactSetVersion(itemIds, aiContext);
    aiContext.rightsRegistry.aiInputs[0].version += "-changed";
    expect(createArtifactSetVersion(itemIds, aiContext)).not.toBe(aiVersion);
    aiContext.rightsRegistry.aiInputs[0].version = aiContext.rightsRegistry.aiInputs[0].version.replace(/-changed$/, "");

    inputResearchRecord.editorialDecision += " changed";
    expect(createArtifactSetVersion(itemIds, aiContext)).not.toBe(aiVersion);
    inputResearchRecord.editorialDecision = inputResearchRecord.editorialDecision.replace(/ changed$/, "");

    termsAssessment.authorityVersion += " changed";
    expect(createArtifactSetVersion(itemIds, aiContext)).not.toBe(aiVersion);

    const mediaContext = structuredClone(context);
    const sourcedArtifact = mediaContext.rightsRegistry.artifacts.find((entry) =>
      entry.subject.type === "culinary-item"
      && entry.subject.id === item.id
      && entry.sourceIds.length > 0)!;
    const mediaAssessmentId = mediaContext.rightsRegistry.datasets[0].rightsAssessmentId;
    Object.assign(mediaContext.rightsRegistry, {
      externalMedia: [{
        id: "test-external-media",
        sourceId: sourcedArtifact.sourceIds[0],
        platform: "youtube" as const,
        url: "https://www.youtube.com/watch?v=test",
        use: "reference-only" as const,
        timestamp: "01:23",
        downloaded: false as const,
        transcriptStored: false as const,
        screenshotStored: false as const,
        automatedCollection: false as const,
        privacyReview: "not-required" as const,
        rightsAssessmentId: mediaAssessmentId,
      }],
    });
    const mediaVersion = createArtifactSetVersion(itemIds, mediaContext);
    mediaContext.rightsRegistry.assessments.find((entry) => entry.id === mediaAssessmentId)!.authorityVersion += "-media-changed";
    expect(createArtifactSetVersion(itemIds, mediaContext)).not.toBe(mediaVersion);
  });

  it("creates distinct sampling classes for image domains, license authorities, and cost transforms", () => {
    const item = items.find((entry) => entry.id === "huevos-rancheros-home")!;
    const originalKeys = deriveEquivalenceClassKeys(item, context);
    expect(originalKeys).toContain("image-source-domain:commons.wikimedia.org");
    expect(originalKeys.some((key) => key.startsWith("rights-authority:open-license:"))).toBe(true);
    expect(originalKeys.some((key) => key.startsWith("cost-transform:"))).toBe(true);

    const changedContext = structuredClone(context);
    const imageId = item.images.availability === "available" ? item.images.references.primaryImageId : "";
    changedContext.images.find((entry) => entry.id === imageId)!.sourceUrl = "https://images.example.test/new-origin";
    const openAssessment = changedContext.rightsRegistry.assessments.find((entry) =>
      entry.basis.kind === "open-license"
      && changedContext.rightsRegistry.artifacts.some((artifact) => artifact.subject.id === imageId && artifact.rightsAssessmentId === entry.id))!;
    openAssessment.authorityVersion += "-new-license-version";
    changedContext.rightsRegistry.costs[0].methodology += " New conversion path.";
    const changedKeys = deriveEquivalenceClassKeys(item, changedContext);

    expect(changedKeys).toContain("image-source-domain:images.example.test");
    expect(changedKeys).not.toContain("image-source-domain:commons.wikimedia.org");
    expect(changedKeys.filter((key) => key.startsWith("rights-authority:open-license:"))).not.toEqual(
      originalKeys.filter((key) => key.startsWith("rights-authority:open-license:")),
    );
    expect(changedKeys.filter((key) => key.startsWith("cost-transform:"))).not.toEqual(
      originalKeys.filter((key) => key.startsWith("cost-transform:")),
    );
  });

  it("covers artifact, risk, restaurant, external-media, product-profile, and Evidence-derived Source paths", () => {
    const item = items.find((entry) => entry.id === "japanese-oyakodon")!;
    const changedContext = structuredClone(context);
    const artifact = changedContext.rightsRegistry.artifacts.find((entry) =>
      entry.subject.type === "culinary-item" && entry.subject.id === item.id && entry.kind === "identity")!;
    const evidenceSource: Source = {
      ...structuredClone(changedContext.sources[0]),
      id: "evidence-only-source",
      locators: [{ kind: "url", url: "https://evidence-only.example.test/reference", accessedAt: "2026-09-06" }],
    };
    const evidence: Evidence = {
      id: "evidence-only-record",
      sourceId: evidenceSource.id,
      relation: "supports" as const,
      strength: "strong" as const,
      locators: [{ kind: "section" as const, value: "Test" }],
      editorialNote: "Mutation fixture for the Evidence-to-Source sampling path.",
    };
    artifact.evidenceIds = [evidence.id];
    changedContext.sources = [...changedContext.sources, evidenceSource];
    changedContext.evidence = [...changedContext.evidence, evidence];
    changedContext.rightsRegistry.restaurantRequirements = [{
      culinaryItemId: item.id,
      kind: "cooking-lab-reconstruction",
    }];
    changedContext.rightsRegistry.restaurants = [{
      culinaryItemId: item.id,
      kind: "cooking-lab-reconstruction",
      restaurantName: "Test restaurant",
      sourceIds: artifact.sourceIds as [string, string, ...string[]],
      independentlyWritten: true,
      reviewRequirement: { dimension: "factual-culinary", policyVersion: publishingGovernancePolicyVersion },
      nonEndorsementDisclosure: true,
    }];
    changedContext.rightsRegistry.externalMedia = [{
      id: "test-video-reference",
      sourceId: evidenceSource.id,
      platform: "youtube",
      url: "https://www.youtube.com/watch?v=test",
      use: "reference-only",
      timestamp: "01:20",
      downloaded: false,
      transcriptStored: false,
      screenshotStored: false,
      automatedCollection: false,
      privacyReview: "not-required",
      rightsAssessmentId: changedContext.rightsRegistry.datasets[0].rightsAssessmentId,
    }];
    const profile = {
      id: "test-profile",
      culinaryItemId: item.id,
      brandName: "Test",
      producerName: "Test",
      vintageBatchOrModel: "v1",
      verifiedAt: "2026-09-06",
      sourceIds: artifact.sourceIds as [string, ...string[]],
      independentEditorialCopy: true as const,
      usesUnlicensedBrandArtwork: false as const,
      impliesEndorsement: false as const,
      affiliateSales: false as const,
      rightsAssessmentId: artifact.rightsAssessmentId,
    };
    changedContext.rightsRegistry.productProfiles = [profile];
    const route = { level: "medium" as const, reasonCodes: ["restaurant-reconstruction" as const, "product-profile" as const] };
    const keys = deriveEquivalenceClassKeys(item, changedContext, route);

    expect(keys).toEqual(expect.arrayContaining([
      "artifact-kind:identity",
      "risk-level:medium",
      "risk-reason:restaurant-reconstruction",
      "risk-reason:product-profile",
      "restaurant:cooking-lab-reconstruction",
      "external-media:youtube:reference-only:not-required",
      "product-profile:versioned-independent-editorial",
      "source-domain:evidence-only.example.test",
    ]));
  });

  it("requires restaurant reconstruction review claims to resolve through current attestations", () => {
    const item = items.find((entry) => entry.id === "japanese-oyakodon")!;
    const changedContext = structuredClone(context);
    const identityArtifact = changedContext.rightsRegistry.artifacts.find((entry) =>
      entry.subject.type === "culinary-item" && entry.subject.id === item.id && entry.kind === "identity")!;
    changedContext.rightsRegistry.restaurantRequirements = [{ culinaryItemId: item.id, kind: "cooking-lab-reconstruction" }];
    changedContext.rightsRegistry.restaurants = [{
      culinaryItemId: item.id,
      kind: "cooking-lab-reconstruction",
      restaurantName: "Unnamed restaurant-style category",
      sourceIds: identityArtifact.sourceIds as [string, string, ...string[]],
      independentlyWritten: true,
      reviewRequirement: { dimension: "factual-culinary", policyVersion: publishingGovernancePolicyVersion },
      nonEndorsementDisclosure: true,
    }];

    const governance = readyRegistry();
    governance.attestations = governance.attestations.filter((attestation) => !(
      attestation.itemIds.includes(item.id) && attestation.dimension === "factual-culinary"
    ));
    const result = evaluatePublishingGovernance(governance, changedContext);
    expect(result.issues.some((issue) => issue.code === "restaurant-review-unlinked" && issue.subjectId === item.id)).toBe(true);
  });

  it("publishes CC0 and public-domain image provenance without inventing a license obligation", () => {
    const item = items.find((entry) => entry.id === "yunnan-mushroom-chicken-stew")!;
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

  it("routes a single-source non-image adaptation to MEDIUM without treating an image crop as deep adaptation", () => {
    const registry = readyRegistry();
    const itemId = registry.riskClassifications[0].itemId;
    const changedContext = structuredClone(context);
    const contentArtifact = changedContext.rightsRegistry.artifacts.find((entry) =>
      entry.subject.type === "culinary-item"
      && entry.subject.id === itemId
      && entry.kind === "preparation")!;
    contentArtifact.derivation = "adaptation";
    contentArtifact.sourceIds = [changedContext.sources[0].id];
    expect(issueCodes(registry, changedContext)).toContain("under-classified-risk");

    const imageOnlyContext = structuredClone(context);
    const imageArtifact = imageOnlyContext.rightsRegistry.artifacts.find((entry) => entry.kind === "image")!;
    imageArtifact.derivation = "adaptation";
    imageArtifact.sourceIds = [imageOnlyContext.sources[0].id];
    const imageItemId = imageOnlyContext.items.find((entry) =>
      entry.images.availability === "available"
      && entry.images.references.primaryImageId === imageArtifact.subject.id)!.id;
    const imageRegistry = readyRegistry();
    imageRegistry.riskClassifications.find((entry) => entry.itemId === imageItemId)!.artifactSetVersion = createArtifactSetVersion([imageItemId], imageOnlyContext);
    imageRegistry.attestations.forEach((entry) => { entry.artifactSetVersion = createArtifactSetVersion(entry.itemIds, imageOnlyContext); });
    imageRegistry.samplingBatches[0].artifactSetVersion = createArtifactSetVersion(imageRegistry.samplingBatches[0].itemIds, imageOnlyContext);
    expect(issueCodes(imageRegistry, imageOnlyContext)).not.toContain("under-classified-risk");
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

  it("cannot attach a HIGH reason to a LOW classification to bypass the required checkpoint", () => {
    const registry = readyRegistry();
    registry.riskClassifications[0].reasonCodes = [
      "clear-first-party-or-reference-only-rights",
      "health-or-medical-claim",
    ];
    registry.riskClassifications[0].equivalenceClassKeys = deriveEquivalenceClassKeys(
      items.find((item) => item.id === registry.riskClassifications[0].itemId)!,
      context,
      registry.riskClassifications[0],
    ) as [string, ...string[]];
    expect(issueCodes(registry)).toContain("under-classified-risk");
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
    const second = makeNextSamplingBatch(recovered, "sampling-recovery-2");
    second.findings = [];
    second.metrics.escapeCount = 0;
    second.metrics.provenanceLicenseNoveltyCount = 0;
    second.metrics.provenanceLicenseNoveltyClassKeys = [];
    setFullReview(second, frozenKey);
    sealSamplingBatch(second);
    recovered.samplingBatches = [...recovered.samplingBatches, second];
    const third = makeNextSamplingBatch(recovered, "sampling-recovery-3");
    setFullReview(third, frozenKey);
    sealSamplingBatch(third);
    recovered.samplingBatches = [...recovered.samplingBatches, third];
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
    sealSamplingBatch(oneClean);
    registry.samplingBatches = [...registry.samplingBatches, oneClean];
    expect(issueCodes(registry)).toContain("sampling-class-frozen");

    const twoClean = makeNextSamplingBatch(registry, "sampling-clean-3");
    setFullReview(twoClean, frozenKey);
    sealSamplingBatch(twoClean);
    registry.samplingBatches = [...registry.samplingBatches, twoClean];
    expect(issueCodes(registry)).not.toContain("sampling-class-frozen");
  });

  it("freezes only the affected classes named by a sample-level major finding", () => {
    const registry = readyRegistry();
    const sample = registry.samplingBatches[0].samples.find((entry) => entry.equivalenceClassKeys.length > 1)!;
    const frozenKey = sample.equivalenceClassKeys[0];
    sample.findings = [{
      code: "sample-major-escape",
      kind: "quality",
      severity: "major",
      summary: "A resolved major issue was discovered in this sampled item.",
      disposition: "resolved",
      equivalenceClassKeys: [frozenKey],
    }];
    registry.samplingBatches[0].metrics.escapeCount = 1;
    registry.samplingBatches[0].metrics.reworkItemCount = 1;
    registry.samplingBatches[0].metrics.reworkItemIds = [sample.itemId];

    expect(issueCodes(registry)).toContain("sampling-class-frozen");

    const oneClean = makeNextSamplingBatch(registry, "sample-major-clean-2");
    oneClean.samples.forEach((entry) => { entry.findings = []; });
    setFullReview(oneClean, frozenKey);
    sealSamplingBatch(oneClean);
    registry.samplingBatches = [...registry.samplingBatches, oneClean];
    expect(issueCodes(registry)).toContain("sampling-class-frozen");

    const twoClean = makeNextSamplingBatch(registry, "sample-major-clean-3");
    twoClean.samples.forEach((entry) => { entry.findings = []; });
    setFullReview(twoClean, frozenKey);
    sealSamplingBatch(twoClean);
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
      equivalenceClassKeys: [uncounted.samplingBatches[0].samples[0].equivalenceClassKeys[0]],
    }];
    expect(issueCodes(uncounted)).toContain("sampling-metrics-invalid");

    const unexplained = readyRegistry();
    unexplained.samplingBatches[0].metrics.escapeCount = 1;
    expect(issueCodes(unexplained)).toContain("sampling-metrics-invalid");
  });

  it("requires disagreement, rework, and provenance/license novelty metrics to match durable evidence", () => {
    const disagreement = readyRegistry();
    const sample = disagreement.samplingBatches[0].samples[0];
    sample.findings = [{
      code: "resolved-reviewer-disagreement",
      kind: "reviewer-disagreement",
      severity: "minor",
      summary: "A resolved disagreement required rework.",
      disposition: "resolved",
      equivalenceClassKeys: [sample.equivalenceClassKeys[0]],
    }];
    expect(issueCodes(disagreement)).toContain("sampling-metrics-invalid");

    disagreement.samplingBatches[0].metrics.reviewerDisagreementCount = 1;
    disagreement.samplingBatches[0].metrics.reworkItemCount = 1;
    disagreement.samplingBatches[0].metrics.reworkItemIds = [sample.itemId];
    expect(issueCodes(disagreement)).not.toContain("sampling-metrics-invalid");

    const overcounted = readyRegistry();
    overcounted.samplingBatches[0].metrics.reworkItemCount = 1;
    overcounted.samplingBatches[0].metrics.reworkItemIds = [overcounted.samplingBatches[0].itemIds[0]];
    expect(issueCodes(overcounted)).toContain("sampling-metrics-invalid");

    const novelty = readyRegistry();
    novelty.samplingBatches[0].metrics.provenanceLicenseNoveltyCount = 0;
    novelty.samplingBatches[0].metrics.provenanceLicenseNoveltyClassKeys = [];
    expect(issueCodes(novelty)).toContain("sampling-metrics-invalid");
  });

  it("rejects forged sampling sequence and previous-batch chains", () => {
    const registry = readyRegistry();
    const second = makeNextSamplingBatch(registry, "sampling-chain-2");
    second.sequence = 7;
    second.previousBatchId = "not-the-previous-record";
    registry.samplingBatches = [...registry.samplingBatches, second];
    expect(issueCodes(registry)).toContain("sampling-metrics-invalid");
  });

  it("fail closes when a committed sampling checkpoint is reconstructed differently", () => {
    const registry = readyRegistry();
    registry.samplingBatches[0].samples[0].equivalenceClassKeys.push("future-rule:retroactive-class");
    expect(issueCodes(registry)).toContain("sampling-evidence-mutated");
  });

  it("requires distinct auditor runs, contexts, and evidence for recovery batches", () => {
    const registry = readyRegistry();
    const previous = registry.samplingBatches[0];
    const duplicate = makeNextSamplingBatch(registry, "sampling-duplicate-audit");
    duplicate.auditor.runId = previous.auditor.runId;
    duplicate.auditor.contextId = previous.auditor.contextId;
    duplicate.evidenceReference = previous.evidenceReference;
    sealSamplingBatch(duplicate);
    registry.samplingBatches = [...registry.samplingBatches, duplicate];
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
    historical.samples[0].findings = [{
      code: "historical-finding",
      kind: "quality",
      severity: "minor",
      summary: "Fixed later.",
      disposition: "unresolved",
      equivalenceClassKeys: [historical.samples[0].equivalenceClassKeys[0]],
    }];
    sealSamplingBatch(historical);
    const current = structuredClone(registry.samplingBatches[0]);
    current.id = "sampling-current-pass";
    current.batchId = "current-pass";
    current.sequence = 2;
    current.previousBatchId = historical.id;
    current.metrics.provenanceLicenseNoveltyCount = 0;
    current.metrics.provenanceLicenseNoveltyClassKeys = [];
    current.auditor.runId = "test-fixture-current-pass-run";
    current.auditor.contextId = "test-fixture-current-pass-context";
    current.evidenceReference = "test-fixture://current-pass-evidence";
    sealSamplingBatch(current);
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
  const next = {
    ...structuredClone(previous),
    id,
    batchId: id,
    sequence: previous.sequence + 1,
    previousBatchId: previous.id,
    auditor: {
      ...structuredClone(previous.auditor),
      runId: `${id}-run`,
      contextId: `${id}-context`,
    },
    evidenceReference: `test-fixture://${id}`,
    findings: [],
    metrics: {
      ...previous.metrics,
      escapeCount: 0,
      provenanceLicenseNoveltyCount: 0,
      provenanceLicenseNoveltyClassKeys: [],
    },
  };
  sealSamplingBatch(next);
  return next;
}

function sealSamplingBatch(batch: PublishingGovernanceRegistry["samplingBatches"][number]) {
  batch.evidenceDigest = createSamplingBatchEvidenceDigest(batch);
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
