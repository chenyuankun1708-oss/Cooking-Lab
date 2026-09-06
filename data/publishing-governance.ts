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
import type { PublishingGovernanceContext, PublishingLocalizationVersion } from "@/lib/publishing-governance";
import type { ResearchRecord } from "@/types/research";
import type {
  PublishingGovernanceRegistry,
  PublishingRiskClassification,
  ReviewActorIdentity,
  ReviewAttestation,
  ReviewDimension,
  SamplingQaBatch,
  SamplingQaFinding,
  SamplingQaSample,
} from "@/types/publishing-governance";
import { m10AuditedCulinaryItemIds } from "./content-rights";

export const publishingGovernancePolicyVersion = "m10.1-risk-based-2026-09-06";

// This value is a committed review checkpoint, not a runtime-derived PASS. Any
// content artifact change invalidates the attestation and blocks publication.
const currentReviewedArtifactSetVersion = "clv1-271de8aee026edb3";
const currentLowRiskArtifactSetVersion = "clv1-47cb77371633608e";
const currentMediumRiskArtifactSetVersion = "clv1-284cf465a54bc99a";
const currentReviewedCommit = "849a313a6fb2e67a4595b9878ab3f325bca1438c";
const currentReviewBatchId = "issue-96-risk-split-primary-review-849a313-run-1";
const priorRecoveryArtifactSetVersion = "clv1-cb1aa4def15f2c08";
const priorRecoveryReviewedCommit = "9c018f6be00be66ea89d59e37d0feab2da0a2995";
const mediumReviewedCommit = "9c018f6be00be66ea89d59e37d0feab2da0a2995";
const weakImageFidelityItemIds = new Set([
  "cantonese-mushroom-steamed-chicken",
  "malaysian-turmeric-chicken",
  "mexican-black-bean-tacos",
]);

const author: ReviewActorIdentity = {
  actorType: "agent",
  actorId: "/root",
  runId: "issue-96-governance-implementation-2026-09-06",
  contextId: "/root/m11-risk-based-governance",
};

const reviewer: ReviewActorIdentity = {
  actorType: "agent",
  actorId: "/root/m11_primary_readonly_final",
  runId: "issue-96-risk-split-primary-review-849a313-run-1",
  contextId: "/root/m11_primary_readonly_final/849a313-risk-split-primary-context-1",
};

const mediumContentVisualReviewer: ReviewActorIdentity = {
  actorType: "agent",
  actorId: "/root/m11_medium_clean_reviewer_final",
  runId: "issue-96-medium-content-visual-9c018f6-run-0276f44d",
  contextId: "/root/m11_medium_clean_reviewer_final/9c018f6-review-0276f44d-37e7-483b-a095-3cef9502cc26",
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
    evidenceDigest: "clv1-ca0394e7b678dc93",
  };
}

function createFullDishRecoveryCoverage(
  riskClassifications: readonly PublishingRiskClassification[],
  findingsByItemId: Readonly<Record<string, SamplingQaFinding[]>> = {},
  revisedItemIds: ReadonlySet<string> = new Set<string>(),
): Pick<SamplingQaBatch, "equivalenceClasses" | "samples"> {
  const equivalenceClasses = createSamplingEquivalenceClasses(riskClassifications);
  const visualDish = equivalenceClasses.find((entry) => entry.key === "visual-fidelity:dish");
  if (!visualDish) throw new Error("Recovery sampling requires the visual-fidelity:dish class");
  visualDish.sampledItemIds = [...visualDish.itemIds];
  const sampledItemIds = [...new Set(equivalenceClasses.flatMap((entry) => entry.sampledItemIds))].sort();
  const dimensions = [
    "rights-license",
    "provenance",
    "factual-culinary",
    "editorial",
    "visual-image",
  ] as const;
  const samples = sampledItemIds.map((itemId): SamplingQaSample => ({
    itemId,
    equivalenceClassKeys: equivalenceClasses
      .filter((entry) => entry.sampledItemIds.includes(itemId))
      .map((entry) => entry.key) as [string, ...string[]],
    dimensions: [...dimensions],
    verdict: revisedItemIds.has(itemId) ? "revise" : "pass",
    findings: findingsByItemId[itemId] ?? [],
  }));
  return {
    equivalenceClasses,
    samples: samples as [SamplingQaSample, ...SamplingQaSample[]],
  };
}

function createRecoverySamplingBatch2(
  riskClassifications: readonly PublishingRiskClassification[],
): SamplingQaBatch {
  const itemIds = [...m10AuditedCulinaryItemIds] as [string, ...string[]];
  const resolvedFindingsByItemId: Record<string, SamplingQaFinding[]> = {
    "cantonese-mushroom-steamed-chicken": [{
      code: "medium-review-visual-rework-resolution-verified",
      kind: "quality",
      severity: "minor",
      summary: "Verified that the replacement Hero depicts mushroom chicken served over rice, matches the recipe's fresh shiitake, and discloses the rice serving context in the alt text.",
      disposition: "resolved",
      equivalenceClassKeys: ["visual-fidelity:dish"],
    }],
    "malaysian-turmeric-chicken": [{
      code: "medium-review-visual-rework-resolution-verified",
      kind: "quality",
      severity: "minor",
      summary: "Verified that the revised recipe and replacement Hero align on turmeric chicken, cauliflower, carrot, onion, and fresh chili while retaining the explicit lower-oil home-adaptation disclosure.",
      disposition: "resolved",
      equivalenceClassKeys: ["visual-fidelity:dish"],
    }],
    "mexican-black-bean-tacos": [{
      code: "medium-review-visual-rework-resolution-verified",
      kind: "quality",
      severity: "minor",
      summary: "Verified that the revised recipe and Hero align on black beans, tomato, mushrooms, leafy cabbage, and avocado, and that the copy identifies the dish as a modern home version rather than a canonical regional recipe.",
      disposition: "resolved",
      equivalenceClassKeys: ["visual-fidelity:dish"],
    }],
    "thai-green-papaya-salad": [{
      code: "prior-major-visual-escape-resolution-verified",
      kind: "quality",
      severity: "minor",
      summary: "Verified that the prior cashew-versus-peanut visual escape was resolved: the replacement Hero visibly shows green papaya, tomato, carrot, and peanuts, with no visible cashews.",
      disposition: "resolved",
      equivalenceClassKeys: ["visual-fidelity:dish"],
    }],
  };
  const { equivalenceClasses, samples } = createFullDishRecoveryCoverage(
    riskClassifications,
    resolvedFindingsByItemId,
  );

  return {
    id: "sampling-m10-existing-50-9c018f6-recovery-2",
    batchId: "m10-existing-50-sampling-recovery-2",
    sequence: 2,
    previousBatchId: "sampling-m10-existing-50-81afe4c-revise",
    policyVersion: publishingGovernancePolicyVersion,
    itemIds,
    artifactSetVersion: priorRecoveryArtifactSetVersion,
    equivalenceClasses,
    author,
    auditor: {
      actorType: "agent",
      actorId: "/root/m11_sampling_reaudit_default",
      runId: "issue-96-sampling-recovery-batch-2-9c018f6-run-2",
      contextId: "/root/m11_sampling_reaudit_default/9c018f6-recovery-2",
    },
    reviewedCommit: priorRecoveryReviewedCommit,
    evidenceReference: "https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/96#issuecomment-5559746893",
    rubricVersion: "m10.1-sampling-content-visual-audit-v1",
    verdict: "pass",
    samples,
    findings: [],
    auditorModifiedContent: false,
    metrics: {
      escapeCount: 0,
      reviewerDisagreementCount: 0,
      reworkItemCount: 4,
      provenanceLicenseNoveltyCount: 0,
      reworkItemIds: [
        "cantonese-mushroom-steamed-chicken",
        "malaysian-turmeric-chicken",
        "mexican-black-bean-tacos",
        "thai-green-papaya-salad",
      ],
      provenanceLicenseNoveltyClassKeys: [],
    },
    auditedAt: "2026-09-06",
    evidenceDigest: "clv1-49532a39a4b936b0",
  };
}

function createRecoverySamplingBatch3(
  riskClassifications: readonly PublishingRiskClassification[],
): SamplingQaBatch {
  const itemIds = [...m10AuditedCulinaryItemIds] as [string, ...string[]];
  const finding: SamplingQaFinding = {
    code: "hero-alt-container-and-pepper-color-mismatch",
    kind: "quality",
    severity: "minor",
    summary: "The Chinese Hero alt says the Hunan chili pork is on a white plate with green and red chilies, but the image shows the dish in a black wok with green chilies and no visible red chilies.",
    disposition: "unresolved",
    equivalenceClassKeys: ["visual-fidelity:dish"],
  };
  const { equivalenceClasses, samples } = createFullDishRecoveryCoverage(
    riskClassifications,
    { "hunan-chili-pork": [finding] },
    new Set(["hunan-chili-pork"]),
  );

  return {
    id: "sampling-m10-existing-50-9c018f6-recovery-3",
    batchId: "m10-existing-50-sampling-recovery-3",
    sequence: 3,
    previousBatchId: "sampling-m10-existing-50-9c018f6-recovery-2",
    policyVersion: publishingGovernancePolicyVersion,
    itemIds,
    artifactSetVersion: priorRecoveryArtifactSetVersion,
    equivalenceClasses,
    author,
    auditor: {
      actorType: "agent",
      actorId: "/root/m11_sampling_reaudit_default",
      runId: "issue-96-sampling-recovery-batch-3-9c018f6-run-3",
      contextId: "/root/m11_sampling_reaudit_default/9c018f6-recovery-3",
    },
    reviewedCommit: priorRecoveryReviewedCommit,
    evidenceReference: "https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/96#issuecomment-5559813212",
    rubricVersion: "m10.1-sampling-content-visual-audit-v1",
    verdict: "revise",
    samples,
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
    auditedAt: "2026-09-06",
    evidenceDigest: "clv1-cd5381a719cb956e",
  };
}

function createRecoverySamplingBatch4(
  riskClassifications: readonly PublishingRiskClassification[],
): SamplingQaBatch {
  const itemIds = [...m10AuditedCulinaryItemIds] as [string, ...string[]];
  const finding: SamplingQaFinding = {
    code: "hero-alt-container-and-pepper-color-rework-resolution-verified",
    kind: "quality",
    severity: "minor",
    summary: "Verified that the corrected Hunan chili pork Hero alt now matches the black cooking vessel, pork slices, and visible green chilies.",
    disposition: "resolved",
    equivalenceClassKeys: ["visual-fidelity:dish"],
  };
  const { equivalenceClasses, samples } = createFullDishRecoveryCoverage(
    riskClassifications,
    { "hunan-chili-pork": [finding] },
  );

  return {
    id: "sampling-m10-existing-50-849a313-recovery-4",
    batchId: "m10-existing-50-sampling-recovery-4",
    sequence: 4,
    previousBatchId: "sampling-m10-existing-50-9c018f6-recovery-3",
    policyVersion: publishingGovernancePolicyVersion,
    itemIds,
    artifactSetVersion: currentReviewedArtifactSetVersion,
    equivalenceClasses,
    author,
    auditor: {
      actorType: "agent",
      actorId: "/root/m11_sampling_reaudit_default",
      runId: "issue-96-sampling-recovery-batch-4-849a313-run-4",
      contextId: "/root/m11_sampling_reaudit_default/849a313-recovery-4",
    },
    reviewedCommit: currentReviewedCommit,
    evidenceReference: "https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/96#issuecomment-5559892456",
    rubricVersion: "m10.1-sampling-content-visual-audit-v1",
    verdict: "pass",
    samples,
    findings: [],
    auditorModifiedContent: false,
    metrics: {
      escapeCount: 0,
      reviewerDisagreementCount: 0,
      reworkItemCount: 1,
      provenanceLicenseNoveltyCount: 0,
      reworkItemIds: ["hunan-chili-pork"],
      provenanceLicenseNoveltyClassKeys: [],
    },
    auditedAt: "2026-09-06",
    evidenceDigest: "clv1-cf835c57e697047c",
  };
}

function createRecoverySamplingBatch5(
  riskClassifications: readonly PublishingRiskClassification[],
): SamplingQaBatch {
  const { equivalenceClasses, samples } = createFullDishRecoveryCoverage(riskClassifications);
  return {
    id: "sampling-m10-existing-50-849a313-recovery-5",
    batchId: "m10-existing-50-sampling-recovery-5",
    sequence: 5,
    previousBatchId: "sampling-m10-existing-50-849a313-recovery-4",
    policyVersion: publishingGovernancePolicyVersion,
    itemIds: [...m10AuditedCulinaryItemIds] as [string, ...string[]],
    artifactSetVersion: currentReviewedArtifactSetVersion,
    equivalenceClasses,
    author,
    auditor: {
      actorType: "agent",
      actorId: "/root/m11_sampling_reaudit_default",
      runId: "issue-96-sampling-recovery-batch-5-849a313-run-5",
      contextId: "/root/m11_sampling_reaudit_default/849a313-recovery-5",
    },
    reviewedCommit: currentReviewedCommit,
    evidenceReference: "https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/96#issuecomment-5559928563",
    rubricVersion: "m10.1-sampling-content-visual-audit-v1",
    verdict: "pass",
    samples,
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
    auditedAt: "2026-09-06",
    evidenceDigest: "clv1-fa945f15f6f14fa5",
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

export function createPublishingGovernanceContext(
  input: CreatePublishingGovernanceRegistryInput,
): PublishingGovernanceContext {
  return {
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
}

export function mergePublishingGovernanceRegistries(
  ...registries: readonly PublishingGovernanceRegistry[]
): PublishingGovernanceRegistry {
  if (!registries.length) throw new Error("At least one publishing governance registry is required");
  if (registries.some((registry) => registry.policyVersion !== publishingGovernancePolicyVersion)) {
    throw new Error("Publishing governance registries must use the active policy version");
  }
  return {
    policyVersion: publishingGovernancePolicyVersion,
    attestations: registries.flatMap((registry) => registry.attestations),
    riskClassifications: registries.flatMap((registry) => registry.riskClassifications),
    samplingBatches: registries.flatMap((registry) => registry.samplingBatches).sort((left, right) => left.sequence - right.sequence),
  };
}

export function createPublishingGovernanceRegistry(
  input: CreatePublishingGovernanceRegistryInput,
): PublishingGovernanceRegistry {
  const itemIds = [...m10AuditedCulinaryItemIds] as [string, ...string[]];
  const context = createPublishingGovernanceContext(input);
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

  const lowRiskItemIds = riskClassifications
    .filter((classification) => classification.level === "low")
    .map((classification) => classification.itemId) as [string, ...string[]];
  const mediumRiskItemIds = riskClassifications
    .filter((classification) => classification.level === "medium")
    .map((classification) => classification.itemId) as [string, ...string[]];
  const representations = {
    humanApproval: false,
    culinaryFieldTest: false,
    legalOpinion: false,
  } as const;
  const primaryEvidenceReference = "https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/96#issuecomment-5559853300";
  const mediumEvidenceReference = "https://github.com/chenyuankun1708-oss/Cooking-Lab/issues/96#issuecomment-5559696752";
  const rightsDimensions: ReviewDimension[] = ["rights-license", "provenance"];
  const contentDimensions: ReviewDimension[] = ["factual-culinary", "editorial", "visual-image"];

  const attestations: ReviewAttestation[] = [
    ...rightsDimensions.map((dimension): ReviewAttestation => ({
      id: `attestation-${currentReviewBatchId}-${dimension}`,
      batchId: currentReviewBatchId,
      dimension,
      itemIds,
      artifactSetVersion: currentReviewedArtifactSetVersion,
      author,
      reviewer,
      reviewedCommit: currentReviewedCommit,
      evidenceReference: primaryEvidenceReference,
      rubricVersion: "m10.1-risk-split-primary-review-v1",
      policyVersion: publishingGovernancePolicyVersion,
      reviewedAt: "2026-09-06",
      verdict: "pass",
      findings: [],
      reviewerModifiedContent: false,
      representations,
    })),
    ...contentDimensions.map((dimension): ReviewAttestation => ({
      id: `attestation-${currentReviewBatchId}-${dimension}`,
      batchId: currentReviewBatchId,
      dimension,
      itemIds: lowRiskItemIds,
      artifactSetVersion: currentLowRiskArtifactSetVersion,
      author,
      reviewer,
      reviewedCommit: currentReviewedCommit,
      evidenceReference: primaryEvidenceReference,
      rubricVersion: "m10.1-risk-split-primary-review-v1",
      policyVersion: publishingGovernancePolicyVersion,
      reviewedAt: "2026-09-06",
      verdict: "pass",
      findings: [],
      reviewerModifiedContent: false,
      representations,
    })),
    ...contentDimensions.map((dimension): ReviewAttestation => ({
      id: `attestation-issue-96-medium-content-visual-9c018f6-${dimension}`,
      batchId: "issue-96-medium-content-visual-9c018f6-run-0276f44d",
      dimension,
      itemIds: mediumRiskItemIds,
      artifactSetVersion: currentMediumRiskArtifactSetVersion,
      author,
      reviewer: mediumContentVisualReviewer,
      reviewedCommit: mediumReviewedCommit,
      evidenceReference: mediumEvidenceReference,
      rubricVersion: "m10.1-medium-content-visual-review-v1",
      policyVersion: publishingGovernancePolicyVersion,
      reviewedAt: "2026-09-06",
      verdict: "pass",
      findings: [],
      reviewerModifiedContent: false,
      representations,
    })),
  ];

  return {
    policyVersion: publishingGovernancePolicyVersion,
    attestations,
    riskClassifications,
    samplingBatches: [
      createHistoricalSamplingBatch(riskClassifications),
      createRecoverySamplingBatch2(riskClassifications),
      createRecoverySamplingBatch3(riskClassifications),
      createRecoverySamplingBatch4(riskClassifications),
      createRecoverySamplingBatch5(riskClassifications),
    ],
  };
}
