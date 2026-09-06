import { createArtifactSetVersion, getItemArtifacts } from "@/lib/publishing-governance";
import type { CulinaryItem, Source } from "@/types/culinary";
import type { ContentRightsRegistry } from "@/types/content-rights";
import type { RecipeImage } from "@/types/image";
import type {
  PublishingGovernanceRegistry,
  PublishingRiskClassification,
  ReviewActorIdentity,
  ReviewAttestation,
  ReviewDimension,
  SamplingEquivalenceClass,
} from "@/types/publishing-governance";
import { m10AuditedCulinaryItemIds } from "./content-rights";

export const publishingGovernancePolicyVersion = "m10.1-risk-based-2026-09-06";

// This value is a committed review checkpoint, not a runtime-derived PASS. Any
// content artifact change invalidates the attestation and blocks publication.
const m10BaselineReviewedArtifactSetVersion = "clv1-f5c87a7ef999023e";
const m10BaselineReviewedCommit = "de4ea4164d89c6cf2665b0769ab00b94d89bb808";
const m10BaselineBatchId = "m10-existing-50-independent-review";

const author: ReviewActorIdentity = {
  actorType: "agent",
  actorId: "codex-agent:m10-implementation",
  runId: "m10-pr84-implementation",
  contextId: "m10-root-implementation-context",
};

const reviewer: ReviewActorIdentity = {
  actorType: "agent",
  actorId: "codex-agent:m10-independent-content-rights-reviewer",
  runId: "m10-pr84-independent-review-final",
  contextId: "m10-independent-review-context",
};

export interface CreatePublishingGovernanceRegistryInput {
  items: readonly CulinaryItem[];
  rightsRegistry: ContentRightsRegistry;
  images: readonly RecipeImage[];
  sources: readonly Source[];
}

export function createPublishingGovernanceRegistry(
  input: CreatePublishingGovernanceRegistryInput,
): PublishingGovernanceRegistry {
  const itemIds = [...m10AuditedCulinaryItemIds] as [string, ...string[]];
  const context = { items: input.items, rightsRegistry: input.rightsRegistry };
  const riskClassifications = input.items
    .filter((item) => itemIds.includes(item.id))
    .map((item): PublishingRiskClassification => ({
      id: `risk-${item.id}-${publishingGovernancePolicyVersion}`,
      itemId: item.id,
      artifactSetVersion: createArtifactSetVersion([item.id], context),
      level: "low",
      reasonCodes: ["clear-first-party-or-reference-only-rights"],
      equivalenceClassKeys: equivalenceClassKeys(item, input) as [string, ...string[]],
      policyVersion: publishingGovernancePolicyVersion,
      classifiedAt: "2026-09-06",
    }));

  const dimensions: ReviewDimension[] = [
    "rights-license",
    "provenance",
    "factual-culinary",
    "editorial",
    "visual-image",
  ];
  const attestations = dimensions.map((dimension): ReviewAttestation => ({
    id: `attestation-${m10BaselineBatchId}-${dimension}`,
    batchId: m10BaselineBatchId,
    dimension,
    itemIds,
    artifactSetVersion: m10BaselineReviewedArtifactSetVersion,
    author,
    reviewer,
    reviewedCommit: m10BaselineReviewedCommit,
    evidenceReference: "docs/M10_CONTENT_RIGHTS_AUDIT.md",
    rubricVersion: "m10-independent-content-rights-review-v1",
    policyVersion: publishingGovernancePolicyVersion,
    reviewedAt: "2026-09-06",
    verdict: "pass",
    findings: [],
    reviewerModifiedContent: false,
    representations: {
      humanApproval: false,
      culinaryFieldTest: false,
      legalOpinion: false,
    },
  }));

  const classes = buildSamplingClasses(riskClassifications);
  return {
    policyVersion: publishingGovernancePolicyVersion,
    attestations,
    riskClassifications,
    samplingBatches: [{
      id: `sampling-${m10BaselineBatchId}`,
      batchId: m10BaselineBatchId,
      policyVersion: publishingGovernancePolicyVersion,
      itemIds,
      artifactSetVersion: m10BaselineReviewedArtifactSetVersion,
      equivalenceClasses: classes,
      author,
      auditor: {
        actorType: "agent",
        actorId: "codex-agent:m10-independent-sampling-auditor",
        runId: "m10-pr84-sampling-audit-final",
        contextId: "m10-independent-sampling-context",
      },
      reviewedCommit: m10BaselineReviewedCommit,
      evidenceReference: "docs/M10_CONTENT_RIGHTS_AUDIT.md",
      rubricVersion: "m10-risk-equivalence-sampling-v1",
      findings: [],
      auditorModifiedContent: false,
      metrics: {
        escapeCount: 0,
        reviewerDisagreementCount: 0,
        reworkItemCount: 0,
        provenanceLicenseNoveltyCount: 0,
      },
      frozenClassKeys: [],
      fullReReviewClassKeys: [],
      consecutiveCleanBatchesByClass: {},
      auditedAt: "2026-09-06",
    }],
  };
}

function equivalenceClassKeys(
  item: CulinaryItem,
  input: CreatePublishingGovernanceRegistryInput,
): string[] {
  const artifacts = getItemArtifacts(item, input.rightsRegistry);
  const imageId = item.images.availability === "available" ? item.images.references.primaryImageId : undefined;
  const image = input.images.find((entry) => entry.id === imageId);
  const sourceById = new Map(input.sources.map((source) => [source.id, source]));
  const domains = new Set(
    artifacts.flatMap((artifact) => artifact.sourceIds)
      .flatMap((sourceId) => sourceById.get(sourceId)?.locators ?? [])
      .flatMap((locator) => locator.kind === "url" ? [new URL(locator.url).hostname] : []),
  );
  const derivations = new Set(artifacts.map((artifact) => artifact.derivation));
  const aiRecords = artifacts.flatMap((artifact) => input.rightsRegistry.ai.filter((record) => record.artifactId === artifact.id));
  const keys = [
    `content-type:${item.itemType}`,
    `image-license:${image?.license ?? "none"}`,
    `image-source:${image?.source ?? "none"}`,
    `nutrition:${item.nutrition.applicability === "applicable" ? item.nutrition.source : item.nutrition.applicability}`,
    `cost:${item.cost.source}`,
    "translation-path:zh-CN+en-reviewed",
    ...[...domains].sort().map((domain) => `source-domain:${domain}`),
    ...[...derivations].sort().map((derivation) => `derivation:${derivation}`),
    ...aiRecords.map((record) => `model-prompt:${record.provider}/${record.model}/${record.modelVersion}/${record.promptTemplateVersion}`),
  ];
  return [...new Set(keys)].sort();
}

function buildSamplingClasses(
  classifications: readonly PublishingRiskClassification[],
): [SamplingEquivalenceClass, ...SamplingEquivalenceClass[]] {
  const members = new Map<string, string[]>();
  for (const classification of classifications) {
    for (const key of classification.equivalenceClassKeys) {
      members.set(key, [...(members.get(key) ?? []), classification.itemId]);
    }
  }
  const classes = [...members.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, itemIds]): SamplingEquivalenceClass => {
      const sorted = [...itemIds].sort() as [string, ...string[]];
      return { key, itemIds: sorted, sampledItemIds: [sorted[0]] };
    });
  if (!classes.length) throw new Error("Publishing governance requires at least one sampling equivalence class");
  return classes as [SamplingEquivalenceClass, ...SamplingEquivalenceClass[]];
}
