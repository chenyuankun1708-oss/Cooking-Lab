import { createArtifactSetVersion, deriveEquivalenceClassKeys, deriveMinimumPublishingRisk } from "@/lib/publishing-governance";
import type { CulinaryItem, Evidence, Source, Story } from "@/types/culinary";
import type { ContentRightsRegistry } from "@/types/content-rights";
import type { RecipeImage } from "@/types/image";
import type { Ingredient } from "@/types/ingredient";
import type { LocalContentPackageV1 } from "@/types/content-bundle";
import type { ImageAssetVersion } from "@/lib/image-asset-version";
import type { PublishingLocalizationVersion } from "@/lib/publishing-governance";
import type { ResearchRecord } from "@/types/research";
import type {
  PublishingGovernanceRegistry,
  PublishingRiskClassification,
  ReviewActorIdentity,
  ReviewAttestation,
  ReviewDimension,
} from "@/types/publishing-governance";
import { m10AuditedCulinaryItemIds } from "./content-rights";

export const publishingGovernancePolicyVersion = "m10.1-risk-based-2026-09-06";

// This value is a committed review checkpoint, not a runtime-derived PASS. Any
// content artifact change invalidates the attestation and blocks publication.
const m10BaselineReviewedArtifactSetVersion = "clv1-f5c87a7ef999023e";
const m10BaselineReviewedCommit = "de4ea4164d89c6cf2665b0769ab00b94d89bb808";
const m10BaselineBatchId = "m10-existing-50-independent-review";
const weakImageFidelityItemIds = new Set([
  "cantonese-mushroom-steamed-chicken",
  "malaysian-turmeric-chicken",
  "mexican-black-bean-tacos",
]);

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
  evidence: readonly Evidence[];
  stories: readonly Story[];
  researchRecords: readonly ResearchRecord[];
  ingredients: readonly Ingredient[];
  contentPackages: readonly LocalContentPackageV1[];
  localizationVersions: readonly PublishingLocalizationVersion[];
  imageAssetVersions: readonly ImageAssetVersion[];
}

export function createPublishingGovernanceRegistry(
  input: CreatePublishingGovernanceRegistryInput,
): PublishingGovernanceRegistry {
  const itemIds = [...m10AuditedCulinaryItemIds] as [string, ...string[]];
  const context = {
    items: input.items,
    rightsRegistry: input.rightsRegistry,
    images: input.images,
    sources: input.sources,
    evidence: input.evidence,
    stories: input.stories,
    researchRecords: input.researchRecords,
    ingredients: input.ingredients,
    contentPaths: input.contentPackages.map((contentPackage) => ({
      itemId: contentPackage.itemId,
      kind: contentPackage.sourceKind === "legacy-recipe"
        ? "adapted-recipe" as const
        : contentPackage.sourceKind === "legacy-native"
          ? "native-culinary" as const
          : "standalone-package" as const,
    })),
    localizationVersions: input.localizationVersions,
    imageAssetVersions: input.imageAssetVersions,
  };
  const riskClassifications = input.items
    .filter((item) => itemIds.includes(item.id))
    .map((item): PublishingRiskClassification => {
      const minimum = deriveMinimumPublishingRisk(item, input.rightsRegistry);
      const weakImageFidelity = weakImageFidelityItemIds.has(item.id);
      const level = weakImageFidelity && minimum.level === "low" ? "medium" : minimum.level;
      const reasonCodes = [...new Set([
        ...minimum.reasonCodes,
        ...(weakImageFidelity ? ["weak-image-fidelity" as const] : []),
      ])] as PublishingRiskClassification["reasonCodes"];
      return {
        id: `risk-${item.id}-${publishingGovernancePolicyVersion}`,
        itemId: item.id,
        artifactSetVersion: createArtifactSetVersion([item.id], context),
        level,
        reasonCodes,
        equivalenceClassKeys: deriveEquivalenceClassKeys(item, context, { level, reasonCodes }) as [string, ...string[]],
        policyVersion: publishingGovernancePolicyVersion,
        classifiedAt: "2026-09-06",
      };
    });

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

  return {
    policyVersion: publishingGovernancePolicyVersion,
    attestations,
    riskClassifications,
    // M10 did not perform risk-equivalence sampling. Keep this empty until a
    // real M10.1 auditor reviews a frozen commit and leaves item-level evidence.
    samplingBatches: [],
  };
}
