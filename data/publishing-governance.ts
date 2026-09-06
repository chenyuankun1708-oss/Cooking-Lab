import {
  createArtifactSetVersion,
  createSamplingEquivalenceClasses,
  deriveEquivalenceClassKeys,
  deriveMinimumPublishingRisk,
  deriveProvenanceLicenseNoveltyClassKeys,
} from "@/lib/publishing-governance";
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
  SamplingQaBatch,
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

const historicalSamplingItemIds = [
  "apple-crumble",
  "cantonese-mushroom-steamed-chicken",
  "chaoshan-fish-congee",
  "dongpo-pork",
  "espresso",
  "filipino-chicken-adobo-home",
  "fino-sherry",
  "french-lentil-soup",
  "greek-lemon-oregano-chicken",
  "hibiscus-agua-fresca",
  "huevos-rancheros-home",
  "hunan-chili-pork",
  "indian-chana-masala-home",
  "indonesian-chili-eggplant",
  "japanese-miso-salmon",
  "japanese-oyakodon",
  "korean-glass-noodle-stir-fry",
  "korean-tofu-stew-home",
  "lebanese-mujadara",
  "longjing-green-tea",
  "malaysian-turmeric-chicken",
  "mexican-black-bean-tacos",
  "northwest-cumin-lamb",
  "singapore-chicken-rice-home",
  "spanish-chickpea-spinach",
  "spanish-potato-omelet",
  "thai-green-papaya-salad",
  "vietnamese-iced-coffee",
] as const;

function createHistoricalSamplingBatch(
  riskClassifications: readonly PublishingRiskClassification[],
): SamplingQaBatch {
  const auditedItems = new Set<string>(historicalSamplingItemIds);
  const equivalenceClasses = createSamplingEquivalenceClasses(riskClassifications).map((entry) => {
    const representative = entry.itemIds.find((itemId) => auditedItems.has(itemId));
    if (!representative) throw new Error(`Historical sampling audit did not cover class ${entry.key}`);
    return { ...entry, sampledItemIds: [representative] as [string, ...string[]] };
  });

  // Preserve all 28 actually inspected samples, even when the deterministic
  // minimum set changes after a policy taxonomy addition.
  for (const itemId of historicalSamplingItemIds) {
    const represented = equivalenceClasses.find((entry) => entry.itemIds.includes(itemId));
    if (!represented) throw new Error(`Historical sampling item ${itemId} has no equivalence class`);
    if (!represented.sampledItemIds.includes(itemId)) represented.sampledItemIds.push(itemId);
  }
  const visualDish = equivalenceClasses.find((entry) => entry.key === "visual-fidelity:dish");
  if (!visualDish?.itemIds.includes("thai-green-papaya-salad")) {
    throw new Error("Historical visual escape must map to the dish fidelity class");
  }
  if (!visualDish.sampledItemIds.includes("thai-green-papaya-salad")) {
    visualDish.sampledItemIds.push("thai-green-papaya-salad");
  }

  const samples = historicalSamplingItemIds.map((itemId) => ({
    itemId,
    equivalenceClassKeys: equivalenceClasses
      .filter((entry) => entry.sampledItemIds.includes(itemId))
      .map((entry) => entry.key) as [string, ...string[]],
    dimensions: ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"] as [
      "rights-license",
      "provenance",
      "factual-culinary",
      "editorial",
      "visual-image",
    ],
    verdict: itemId === "thai-green-papaya-salad" ? "revise" as const : "pass" as const,
    findings: itemId === "thai-green-papaya-salad" ? [{
      code: "visual-ingredient-mismatch-cashew-peanut",
      kind: "quality" as const,
      severity: "major" as const,
      summary: "The Hero visibly showed cashews while the bilingual content, ingredients, final step, and alt identified peanuts.",
      disposition: "unresolved" as const,
      equivalenceClassKeys: ["visual-fidelity:dish"] as [string, ...string[]],
    }] : [],
  }));
  const noveltyClassKeys = deriveProvenanceLicenseNoveltyClassKeys(equivalenceClasses);

  return {
    id: "sampling-m10-existing-50-81afe4c-revise",
    batchId: "m10-existing-50-sampling-review-1",
    sequence: 1,
    policyVersion: publishingGovernancePolicyVersion,
    itemIds: [...m10AuditedCulinaryItemIds] as [string, ...string[]],
    artifactSetVersion: "clv1-f30d9a1f9213c90c",
    equivalenceClasses: equivalenceClasses as [typeof equivalenceClasses[number], ...typeof equivalenceClasses[number][]],
    author,
    auditor: {
      actorType: "agent",
      actorId: "/root/m11_sampling_reaudit_default",
      runId: "issue-96-sampling-content-visual-reaudit-81afe4c",
      contextId: "/root/m11_sampling_reaudit_default/review-1",
    },
    reviewedCommit: "81afe4c16abd66e93dab9a4afb75f4e6624bfab6",
    evidenceReference: "https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/96#issuecomment-5559359576",
    rubricVersion: "m10.1-sampling-content-visual-audit-v1",
    verdict: "revise",
    samples,
    findings: [],
    auditorModifiedContent: false,
    metrics: {
      escapeCount: 1,
      reviewerDisagreementCount: 0,
      reworkItemCount: 0,
      provenanceLicenseNoveltyCount: noveltyClassKeys.length,
      reworkItemIds: [],
      provenanceLicenseNoveltyClassKeys: noveltyClassKeys,
    },
    auditedAt: "2026-09-06",
  };
}

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
    samplingBatches: [createHistoricalSamplingBatch(riskClassifications)],
  };
}
