import type { CulinaryItem, Evidence, Source } from "@/types/culinary";
import type { ContentArtifact, ContentRightsRegistry } from "@/types/content-rights";
import type { Ingredient } from "@/types/ingredient";
import type { RecipeImage } from "@/types/image";
import type { ResearchRecord } from "@/types/research";
import type { ImageAssetVersion } from "./image-asset-version";
import type {
  PublishingGovernanceRegistry,
  PublishingRiskClassification,
  PublishingRiskLevel,
  PublishingRiskReasonCode,
  ReviewAttestation,
  ReviewDimension,
  SamplingEquivalenceClass,
} from "@/types/publishing-governance";
import { createContentVersion } from "./content-version";

export const publishingGovernanceIssueCodes = [
  "duplicate-id",
  "missing-risk-classification",
  "stale-risk-classification",
  "under-classified-risk",
  "invalid-review-attestation",
  "reviewer-not-independent",
  "reviewer-modified-content",
  "review-claim-misrepresentation",
  "stale-review-attestation",
  "unresolved-review-finding",
  "missing-review-dimension",
  "insufficient-medium-independence",
  "high-risk-human-checkpoint",
  "missing-sampling-coverage",
  "sampling-class-frozen",
  "sampling-metrics-invalid",
  "ai-attestation-missing",
] as const;
export type PublishingGovernanceIssueCode = (typeof publishingGovernanceIssueCodes)[number];

export interface PublishingGovernanceIssue {
  code: PublishingGovernanceIssueCode;
  subjectId: string;
  message: string;
}

export interface PublishingGovernanceContext {
  items: readonly CulinaryItem[];
  rightsRegistry: ContentRightsRegistry;
  images: readonly RecipeImage[];
  sources: readonly Source[];
  evidence: readonly Evidence[];
  researchRecords: readonly ResearchRecord[];
  ingredients: readonly Ingredient[];
  contentPaths: readonly PublishingContentPath[];
  localizationVersions: readonly PublishingLocalizationVersion[];
  imageAssetVersions: readonly ImageAssetVersion[];
}

export interface PublishingContentPath {
  itemId: string;
  kind: "adapted-recipe" | "native-culinary" | "standalone-package";
}

export interface PublishingLocalizationVersion {
  itemId: string;
  path: PublishingContentPath["kind"];
  localeVersions: readonly {
    locale: "zh-CN" | "en";
    status: "reviewed";
    version: string;
  }[];
}

export interface PublishingGovernanceResult {
  ready: boolean;
  issues: PublishingGovernanceIssue[];
  auditedItemIds: string[];
}

const riskRank: Record<PublishingRiskLevel, number> = { low: 0, medium: 1, high: 2 };

export function createArtifactSetVersion(
  itemIds: readonly string[],
  context: PublishingGovernanceContext,
): string {
  const itemIdSet = new Set(itemIds);
  const items = context.items.filter((item) => itemIdSet.has(item.id)).sort((left, right) => left.id.localeCompare(right.id));
  const artifacts = uniqueById(items.flatMap((item) => getItemArtifacts(item, context.rightsRegistry)));
  const decisions = uniqueById(artifacts.flatMap((artifact) => context.rightsRegistry.decisions.filter((decision) => decision.id === artifact.usageDecisionId)));
  const assessmentIds = new Set([
    ...artifacts.map((artifact) => artifact.rightsAssessmentId),
    ...decisions.flatMap((decision) => decision.assessmentIds),
  ]);
  const assessments = context.rightsRegistry.assessments.filter((assessment) => assessmentIds.has(assessment.id)).sort(byId);
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
  const attributions = context.rightsRegistry.attributions.filter((entry) => artifactIds.has(entry.artifactId)).sort(byId);
  const evidenceIds = new Set(artifacts.flatMap((artifact) => artifact.evidenceIds));
  const evidence = context.evidence.filter((entry) => evidenceIds.has(entry.id)).sort(byId);
  const sourceIds = new Set([
    ...artifacts.flatMap((artifact) => artifact.sourceIds),
    ...evidence.map((entry) => entry.sourceId),
  ]);
  const sources = context.sources.filter((source) => sourceIds.has(source.id)).sort(byId);
  const storyIds = new Set(items.flatMap((item) => item.storyIds));
  const researchRecords = context.researchRecords
    .filter((record) => itemIdSet.has(record.subject.id) || storyIds.has(record.subject.id))
    .sort(byId);
  const imageIds = new Set(items.flatMap((item) => item.images.availability === "available" ? item.images.references.imageIds : []));
  const images = context.images.filter((image) => imageIds.has(image.id)).sort(byId);
  const imageAssetVersions = context.imageAssetVersions.filter((entry) => imageIds.has(entry.imageId)).sort((left, right) => left.imageId.localeCompare(right.imageId));
  const ingredientIds = new Set(items.flatMap((item) => "inputs" in item.preparation ? item.preparation.inputs.map((input) => input.ingredientId) : []));
  const ingredients = context.ingredients.filter((ingredient) => ingredientIds.has(ingredient.id)).sort(byId);
  const nutrition = context.rightsRegistry.nutrition.filter((entry) => ingredientIds.has(entry.ingredientId)).sort((left, right) => left.ingredientId.localeCompare(right.ingredientId));
  const costIds = new Set(ingredients.map((ingredient) => ingredient.costProvenanceId));
  const costs = context.rightsRegistry.costs.filter((entry) => costIds.has(entry.id)).sort(byId);
  const datasetIds = new Set(nutrition.flatMap((entry) => entry.kind === "dataset" ? [entry.datasetId] : []));
  const datasets = context.rightsRegistry.datasets.filter((entry) => datasetIds.has(entry.id)).sort(byId);
  const ai = context.rightsRegistry.ai.filter((entry) => artifacts.some((artifact) => artifact.id === entry.artifactId)).sort(byId);
  const externalMedia = context.rightsRegistry.externalMedia.filter((entry) => sourceIds.has(entry.sourceId)).sort(byId);
  const restaurants = context.rightsRegistry.restaurants.filter((entry) => itemIdSet.has(entry.culinaryItemId)).sort((left, right) => left.culinaryItemId.localeCompare(right.culinaryItemId));
  const productProfiles = context.rightsRegistry.productProfiles.filter((entry) => itemIdSet.has(entry.culinaryItemId)).sort(byId);
  const contentPaths = context.contentPaths.filter((entry) => itemIdSet.has(entry.itemId)).sort((left, right) => left.itemId.localeCompare(right.itemId));
  const localizationVersions = context.localizationVersions.filter((entry) => itemIdSet.has(entry.itemId)).sort((left, right) => left.itemId.localeCompare(right.itemId));
  return createContentVersion({
    itemIds: [...itemIds].sort(),
    items,
    artifacts,
    assessments,
    attributions,
    decisions,
    sources,
    evidence,
    researchRecords,
    images,
    imageAssetVersions,
    ingredients,
    nutrition,
    costs,
    datasets,
    ai,
    externalMedia,
    restaurants,
    productProfiles,
    contentPaths,
    localizationVersions,
  });
}

export function deriveEquivalenceClassKeys(item: CulinaryItem, context: PublishingGovernanceContext): string[] {
  const artifacts = getItemArtifacts(item, context.rightsRegistry);
  const imageId = item.images.availability === "available" ? item.images.references.primaryImageId : undefined;
  const image = context.images.find((entry) => entry.id === imageId);
  const sourceById = new Map(context.sources.map((source) => [source.id, source]));
  const domains = new Set(
    artifacts.flatMap((artifact) => artifact.sourceIds)
      .flatMap((sourceId) => sourceById.get(sourceId)?.locators ?? [])
      .flatMap((locator) => locator.kind === "url" ? [safeSourceDomain(locator.url)] : []),
  );
  const derivations = new Set(artifacts.map((artifact) => artifact.derivation));
  const assessmentIds = new Set(artifacts.flatMap((artifact) => {
    const decision = context.rightsRegistry.decisions.find((entry) => entry.id === artifact.usageDecisionId);
    return [artifact.rightsAssessmentId, ...(decision?.assessmentIds ?? [])];
  }));
  const rightsBases = new Set(context.rightsRegistry.assessments.filter((entry) => assessmentIds.has(entry.id)).map((entry) => entry.basis.kind));
  const aiRecords = artifacts.flatMap((artifact) => context.rightsRegistry.ai.filter((record) => record.artifactId === artifact.id));
  const ingredientIds = new Set("inputs" in item.preparation ? item.preparation.inputs.map((input) => input.ingredientId) : []);
  const nutritionTransforms = context.rightsRegistry.nutrition
    .filter((entry) => ingredientIds.has(entry.ingredientId))
    .map((entry) => entry.kind === "dataset" ? `dataset:${entry.datasetId}:${entry.conversionMethod}` : `editorial:${entry.method}`);
  const localization = context.localizationVersions.find((entry) => entry.itemId === item.id);
  const translationStatus = (localization?.localeVersions ?? [])
    .map((entry) => `${entry.locale}-${entry.status}`)
    .sort()
    .join("+");
  const contentPath = localization?.path ?? context.contentPaths.find((entry) => entry.itemId === item.id)?.kind ?? "unknown";
  const keys = [
    `content-type:${item.itemType}`,
    `image-license:${image?.license ?? "none"}`,
    `image-source:${image?.source ?? "none"}`,
    `nutrition:${item.nutrition.applicability === "applicable" ? item.nutrition.source : item.nutrition.applicability}`,
    `cost:${item.cost.source}`,
    `translation-path:${contentPath}:${translationStatus}`,
    ...[...domains].sort().map((domain) => `source-domain:${domain}`),
    ...[...derivations].sort().map((derivation) => `derivation:${derivation}`),
    ...[...rightsBases].sort().map((basis) => `rights-basis:${basis}`),
    ...nutritionTransforms.sort().map((transform) => `data-transform:${transform}`),
    ...aiRecords.map((record) => `model-prompt:${record.provider}/${record.model}/${record.modelVersion}/${record.promptTemplateVersion}`),
  ];
  return [...new Set(keys)].sort();
}

export function createSamplingEquivalenceClasses(
  classifications: readonly PublishingRiskClassification[],
): [SamplingEquivalenceClass, ...SamplingEquivalenceClass[]] {
  const members = new Map<string, string[]>();
  const classesByItem = new Map<string, Set<string>>();
  for (const classification of classifications) {
    for (const key of classification.equivalenceClassKeys) {
      members.set(key, [...(members.get(key) ?? []), classification.itemId]);
      const itemClasses = classesByItem.get(classification.itemId) ?? new Set<string>();
      itemClasses.add(key);
      classesByItem.set(classification.itemId, itemClasses);
    }
  }
  if (!members.size) throw new Error("Publishing governance requires at least one sampling equivalence class");

  const uncovered = new Set(members.keys());
  const selectedItemIds: string[] = [];
  while (uncovered.size) {
    const candidate = [...classesByItem.entries()]
      .map(([itemId, keys]) => ({ itemId, coverage: [...keys].filter((key) => uncovered.has(key)) }))
      .filter((entry) => entry.coverage.length)
      .sort((left, right) => right.coverage.length - left.coverage.length || left.itemId.localeCompare(right.itemId))[0];
    if (!candidate) throw new Error("Sampling equivalence classes could not be covered by real classified items");
    selectedItemIds.push(candidate.itemId);
    candidate.coverage.forEach((key) => uncovered.delete(key));
  }

  const selected = new Set(selectedItemIds);
  const result = [...members.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, itemIds]) => {
      const sorted = [...new Set(itemIds)].sort() as [string, ...string[]];
      const representative = sorted.find((itemId) => selected.has(itemId));
      if (!representative) throw new Error(`Sampling class ${key} has no selected real representative`);
      return { key, itemIds: sorted, sampledItemIds: [representative] };
    });
  return result as unknown as [SamplingEquivalenceClass, ...SamplingEquivalenceClass[]];
}

export function evaluatePublishingGovernance(
  governance: PublishingGovernanceRegistry,
  context: PublishingGovernanceContext,
): PublishingGovernanceResult {
  const issues: PublishingGovernanceIssue[] = [];
  const report = (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => {
    issues.push({ code, subjectId, message });
  };
  const publishedItems = context.items.filter((item) => item.publication.status === "published");
  const publishedItemIds = new Set(publishedItems.map((item) => item.id));
  const versionCache = new Map<string, string>();
  const versionOf = (itemIds: readonly string[]) => {
    const key = [...itemIds].sort().join("\0");
    const cached = versionCache.get(key);
    if (cached) return cached;
    const version = createArtifactSetVersion(itemIds, context);
    versionCache.set(key, version);
    return version;
  };
  const riskByItem = uniqueMap(governance.riskClassifications, "risk classification", report, (entry) => entry.itemId);
  uniqueMap(governance.attestations, "review attestation", report);
  uniqueMap(governance.samplingBatches, "sampling batch", report);

  for (const attestation of governance.attestations) validateAttestation(attestation, governance.policyVersion, versionOf, publishedItemIds, report);
  for (const batch of governance.samplingBatches) validateSamplingBatch(batch, governance.attestations, governance.riskClassifications, governance.policyVersion, versionOf, publishedItemIds, report);
  validateSamplingHistory(governance.samplingBatches, governance.riskClassifications, governance.policyVersion, versionOf, report);

  for (const item of publishedItems) {
    const classification = riskByItem.get(item.id);
    if (!classification) {
      report("missing-risk-classification", item.id, "Published item has no risk classification");
      continue;
    }
    validateRiskClassification(classification, item, governance.policyVersion, context, versionOf, report);
    validateDisagreementEscalation(classification, item, governance.attestations, report);
    validateReviewCoverage(item, classification, governance.attestations, context, report);
    validateSamplingCoverage(item, classification, governance.samplingBatches, versionOf, report);
  }

  for (const record of context.rightsRegistry.ai) {
    const ownerItemIds = publishedItems
      .filter((item) => getItemArtifacts(item, context.rightsRegistry).some((artifact) => artifact.id === record.artifactId))
      .map((item) => item.id);
    const linked = record.reviewAttestationIds.map((id) => governance.attestations.find((entry) => entry.id === id));
    if (
      !ownerItemIds.length
      || linked.some((entry) => !entry)
      || !linked.some((entry) => entry?.verdict === "pass" && entry.dimension === "editorial" && ownerItemIds.some((itemId) => entry.itemIds.includes(itemId)))
    ) {
      report("ai-attestation-missing", record.artifactId, "AI artifact requires a linked passing editorial review attestation");
    }
  }

  return {
    ready: issues.length === 0,
    issues: issues.sort((left, right) => `${left.subjectId}:${left.code}`.localeCompare(`${right.subjectId}:${right.code}`)),
    auditedItemIds: publishedItems.map((item) => item.id).sort(),
  };
}

export function assertPublishingGovernanceReady(
  governance: PublishingGovernanceRegistry,
  context: PublishingGovernanceContext,
): void {
  const result = evaluatePublishingGovernance(governance, context);
  if (result.ready) return;
  throw new Error(`Publishing governance blocked Production: ${result.issues.map((issue) => `${issue.code}:${issue.subjectId}`).join("; ")}`);
}

export function createPublishingGovernanceReport(result: PublishingGovernanceResult): string {
  const lines = [
    "# Publishing governance audit",
    "",
    `Status: ${result.ready ? "PASS" : "BLOCKED"}`,
    `Published items audited: ${result.auditedItemIds.length}`,
    `Issues: ${result.issues.length}`,
  ];
  if (result.issues.length) {
    lines.push("", ...result.issues.map((issue) => `- ${issue.code} | ${issue.subjectId}: ${issue.message}`));
  }
  return `${lines.join("\n")}\n`;
}

export function getItemArtifacts(item: CulinaryItem, registry: ContentRightsRegistry): ContentArtifact[] {
  const primaryImageId = item.images.availability === "available" ? item.images.references.primaryImageId : undefined;
  const productProfileIds = new Set(registry.productProfiles.filter((profile) => profile.culinaryItemId === item.id).map((profile) => profile.id));
  return registry.artifacts.filter((artifact) => {
    if (artifact.subject.type === "culinary-item") return artifact.subject.id === item.id;
    if (artifact.subject.type === "story") return item.storyIds.includes(artifact.subject.id);
    if (artifact.subject.type === "image") return artifact.subject.id === primaryImageId;
    if (artifact.subject.type === "product-profile") return productProfileIds.has(artifact.subject.id);
    return false;
  });
}

function validateAttestation(
  attestation: ReviewAttestation,
  policyVersion: string,
  versionOf: (itemIds: readonly string[]) => string,
  publishedItemIds: ReadonlySet<string>,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const identities = [attestation.author, attestation.reviewer];
  const completeIdentity = identities.every((identity) => identity.actorId.trim() && identity.runId.trim() && identity.contextId.trim());
  if (!attestation.id.trim() || !attestation.batchId.trim() || !completeIdentity || !isIsoDate(attestation.reviewedAt) || !isGitCommit(attestation.reviewedCommit) || !attestation.evidenceReference.trim() || !attestation.rubricVersion.trim() || !attestation.policyVersion.trim()) {
    report("invalid-review-attestation", attestation.id || "missing-attestation-id", "Attestation identity, actors, commit, rubric, policy, and review date are required");
  }
  if (attestation.policyVersion !== policyVersion) {
    report("stale-review-attestation", attestation.id, "Attestation policy version does not match the active policy");
  }
  if (attestation.itemIds.some((itemId) => !publishedItemIds.has(itemId))) {
    report("invalid-review-attestation", attestation.id, "Attestation includes an item outside the published boundary");
  }
  if (
    attestation.author.actorId === attestation.reviewer.actorId
    || attestation.author.runId === attestation.reviewer.runId
    || attestation.author.contextId === attestation.reviewer.contextId
  ) {
    report("reviewer-not-independent", attestation.id, "Author and reviewer actor, run, and context must be distinct");
  }
  if (attestation.reviewerModifiedContent !== false) {
    report("reviewer-modified-content", attestation.id, "A reviewer cannot modify content and issue PASS in the same attestation");
  }
  if (attestation.verdict === "pass" && attestation.findings.some((finding) => finding.disposition === "unresolved")) {
    report("unresolved-review-finding", attestation.id, "PASS cannot contain unresolved findings");
  }
  if (attestation.verdict !== "pass") {
    report("unresolved-review-finding", attestation.id, `Active attestation verdict ${attestation.verdict} blocks publication`);
  }
  if (attestation.reviewer.actorType === "agent" && Object.values(attestation.representations).some(Boolean)) {
    report("review-claim-misrepresentation", attestation.id, "Agent review cannot claim human approval, culinary field testing, or legal opinion");
  }
  if (attestation.dimension === "human-approval" && (attestation.reviewer.actorType === "agent" || !attestation.representations.humanApproval)) {
    report("review-claim-misrepresentation", attestation.id, "Human approval requires a non-agent reviewer and an explicit human-approval representation");
  }
  if (attestation.representations.culinaryFieldTest && !["human", "domain-expert"].includes(attestation.reviewer.actorType)) {
    report("review-claim-misrepresentation", attestation.id, "Culinary field testing requires a human or domain expert");
  }
  if (attestation.representations.legalOpinion && attestation.reviewer.actorType !== "lawyer") {
    report("review-claim-misrepresentation", attestation.id, "Legal opinion requires a lawyer reviewer");
  }
  const currentVersion = versionOf(attestation.itemIds);
  if (attestation.artifactSetVersion !== currentVersion) {
    report("stale-review-attestation", attestation.id, "Content changed after review; the attestation no longer matches the artifact set");
  }
}

function validateRiskClassification(
  classification: PublishingRiskClassification,
  item: CulinaryItem,
  policyVersion: string,
  context: PublishingGovernanceContext,
  versionOf: (itemIds: readonly string[]) => string,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const currentVersion = versionOf([item.id]);
  if (classification.policyVersion !== policyVersion || classification.artifactSetVersion !== currentVersion) {
    report("stale-risk-classification", item.id, "Risk classification does not match the active policy and current artifact version");
  }
  const minimum = deriveMinimumRisk(item, context.rightsRegistry);
  if (riskRank[classification.level] < riskRank[minimum.level]) {
    report("under-classified-risk", item.id, `Declared ${classification.level} is below deterministic minimum ${minimum.level}`);
  }
  for (const reason of minimum.reasonCodes) {
    if (!classification.reasonCodes.includes(reason)) report("under-classified-risk", item.id, `Missing deterministic risk reason ${reason}`);
  }
  if (!classification.equivalenceClassKeys.length || classification.equivalenceClassKeys.some((key) => !key.trim())) {
    report("missing-sampling-coverage", item.id, "Risk classification requires non-empty sampling equivalence classes");
  }
  const expectedClassKeys = deriveEquivalenceClassKeys(item, context);
  if (classification.equivalenceClassKeys.join(",") !== expectedClassKeys.join(",")) {
    report("stale-risk-classification", item.id, "Risk equivalence classes do not match current sources, licenses, content, images, AI, data transformations, and translations");
  }
  const highReasons = new Set<PublishingRiskReasonCode>([
    "official-authorization-or-brand-relationship",
    "health-or-medical-claim",
    "food-safety-critical-process",
    "unresolved-material-factual-conflict",
    "complex-trademark-publicity-or-privacy",
    "unresolved-reviewer-disagreement",
    "professional-legal-checkpoint",
  ]);
  const mediumReasons = new Set<PublishingRiskReasonCode>([
    "single-source-deep-adaptation",
    "resolved-source-conflict",
    "restaurant-reconstruction",
    "product-profile",
    "ai-generated-image",
    "weak-image-fidelity",
    "culinary-authenticity-judgment",
  ]);
  if (classification.level === "high" && !classification.reasonCodes.some((reason) => highReasons.has(reason))) {
    report("under-classified-risk", item.id, "HIGH risk requires an explicit high-risk reason code");
  }
  if (classification.level === "medium" && !classification.reasonCodes.some((reason) => mediumReasons.has(reason))) {
    report("under-classified-risk", item.id, "MEDIUM risk requires an explicit medium-risk reason code");
  }
}

function validateDisagreementEscalation(
  classification: PublishingRiskClassification,
  item: CulinaryItem,
  attestations: readonly ReviewAttestation[],
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const unresolvedDisagreement = attestations.some((attestation) =>
    attestation.itemIds.includes(item.id)
    && attestation.findings.some((finding) => finding.kind === "reviewer-disagreement" && finding.disposition === "unresolved"));
  if (unresolvedDisagreement && classification.level !== "high") {
    report("under-classified-risk", item.id, "Unresolved reviewer disagreement must escalate the item to HIGH risk");
  }
  if (classification.level === "high" && unresolvedDisagreement && !classification.reasonCodes.includes("unresolved-reviewer-disagreement")) {
    report("under-classified-risk", item.id, "HIGH risk must record the unresolved reviewer disagreement reason");
  }
}

function validateReviewCoverage(
  item: CulinaryItem,
  classification: PublishingRiskClassification,
  attestations: readonly ReviewAttestation[],
  context: PublishingGovernanceContext,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const required = requiredDimensions(item, context.rightsRegistry);
  const passes = attestations.filter((attestation) => attestation.verdict === "pass" && attestation.itemIds.includes(item.id));
  for (const dimension of required) {
    if (!passes.some((attestation) => attestation.dimension === dimension)) {
      report("missing-review-dimension", item.id, `Missing passing ${dimension} review`);
    }
  }

  const contextsByDimension = new Map<ReviewDimension, Set<string>>();
  for (const attestation of passes) {
    const contexts = contextsByDimension.get(attestation.dimension) ?? new Set<string>();
    contexts.add(attestation.reviewer.contextId);
    contextsByDimension.set(attestation.dimension, contexts);
  }

  if (classification.level === "low") {
    const reviewerContexts = new Set(passes.map((attestation) => attestation.reviewer.contextId));
    const oneContextCoversAll = [...reviewerContexts].some((contextId) => required.every((dimension) => contextsByDimension.get(dimension)?.has(contextId)));
    if (!oneContextCoversAll) report("missing-review-dimension", item.id, "LOW risk requires one independent reviewer context to pass every applicable dimension");
  }

  if (classification.level === "medium") {
    const rightsContexts = intersect(contextsByDimension.get("rights-license"), contextsByDimension.get("provenance"));
    const contentDimensions = required.filter((dimension) => !["rights-license", "provenance"].includes(dimension));
    const allContentContexts = contentDimensions.length
      ? contentDimensions.map((dimension) => contextsByDimension.get(dimension) ?? new Set<string>()).reduce(intersect)
      : new Set<string>();
    const separated = [...rightsContexts].some((rightsContext) => [...allContentContexts].some((contentContext) => contentContext !== rightsContext));
    if (!separated) report("insufficient-medium-independence", item.id, "MEDIUM risk requires separate rights/provenance and content/visual reviewer contexts");
  }

  if (classification.level === "high") {
    const approval = passes.find((attestation) => attestation.dimension === "human-approval" && attestation.reviewer.actorType !== "agent" && attestation.representations.humanApproval);
    if (!approval) report("high-risk-human-checkpoint", item.id, "HIGH risk remains blocked without an explicit applicable human, expert, or legal checkpoint");
    const requiresLawyer = classification.reasonCodes.some((reason) => [
      "official-authorization-or-brand-relationship",
      "complex-trademark-publicity-or-privacy",
      "professional-legal-checkpoint",
    ].includes(reason));
    if (requiresLawyer && (!approval || approval.reviewer.actorType !== "lawyer" || !approval.representations.legalOpinion)) {
      report("high-risk-human-checkpoint", item.id, "This HIGH risk class requires a lawyer attestation with legal-opinion scope");
    }
    const requiresDomainExpert = classification.reasonCodes.some((reason) => ["health-or-medical-claim", "food-safety-critical-process"].includes(reason));
    if (requiresDomainExpert && (!approval || approval.reviewer.actorType !== "domain-expert")) {
      report("high-risk-human-checkpoint", item.id, "Health or safety-critical content requires a domain-expert checkpoint");
    }
  }
}

function validateSamplingBatch(
  batch: PublishingGovernanceRegistry["samplingBatches"][number],
  attestations: readonly ReviewAttestation[],
  classifications: readonly PublishingRiskClassification[],
  policyVersion: string,
  versionOf: (itemIds: readonly string[]) => string,
  publishedItemIds: ReadonlySet<string>,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const currentArtifactSet = batch.artifactSetVersion === versionOf(batch.itemIds);
  const currentPublicationRecord = currentArtifactSet && batch.policyVersion === policyVersion;
  const completeIdentity = [batch.author, batch.auditor].every((identity) => identity.actorId.trim() && identity.runId.trim() && identity.contextId.trim());
  if (!completeIdentity || !isGitCommit(batch.reviewedCommit) || !isArtifactSetVersion(batch.artifactSetVersion) || !batch.evidenceReference.trim() || !batch.rubricVersion.trim() || !isIsoDate(batch.auditedAt)) {
    report("missing-sampling-coverage", batch.id, "Sampling QA requires author/auditor identity, commit, evidence, rubric, and audit date");
  }
  if (
    batch.author.actorId === batch.auditor.actorId
    || batch.author.runId === batch.auditor.runId
    || batch.author.contextId === batch.auditor.contextId
    || attestations.some((attestation) =>
      attestation.itemIds.some((itemId) => batch.itemIds.includes(itemId))
      && (
        attestation.reviewer.actorId === batch.auditor.actorId
        || attestation.reviewer.runId === batch.auditor.runId
        || attestation.reviewer.contextId === batch.auditor.contextId
      ))
  ) {
    report("reviewer-not-independent", batch.id, "Sampling auditor must be independent from the author and primary review contexts");
  }
  if (batch.auditorModifiedContent !== false) {
    report("reviewer-modified-content", batch.id, "Sampling auditor cannot modify content and issue the same QA record");
  }
  if (currentPublicationRecord && batch.verdict !== "pass") {
    report("unresolved-review-finding", batch.id, `Sampling QA verdict ${batch.verdict} blocks publication`);
  }
  if (currentPublicationRecord && batch.findings.some((finding) => finding.disposition === "unresolved")) {
    report("unresolved-review-finding", batch.id, "Sampling QA cannot pass with unresolved findings");
  }
  if (batch.policyVersion !== policyVersion) {
    report("missing-sampling-coverage", batch.id, "Sampling batch does not match the active policy");
  }
  if (currentArtifactSet && batch.itemIds.some((itemId) => !publishedItemIds.has(itemId))) {
    report("missing-sampling-coverage", batch.id, "Sampling batch contains an item outside the published boundary");
  }
  const metricValues = Object.values(batch.metrics);
  if (metricValues.some((value) => !Number.isInteger(value) || value < 0) || batch.metrics.reworkItemCount > batch.itemIds.length) {
    report("sampling-metrics-invalid", batch.id, "Sampling metrics must be non-negative integers within the batch size");
  }
  if (batch.metrics.escapeCount > 0 && !batch.findings.some((finding) => finding.severity === "major")) {
    report("sampling-metrics-invalid", batch.id, "A recorded escape requires a class-linked major finding");
  }
  const seenClassKeys = new Set<string>();
  if (new Set(batch.itemIds).size !== batch.itemIds.length) {
    report("duplicate-id", batch.id, "Sampling batch item IDs must be unique");
  }
  const sampleByItem = new Map(batch.samples.map((sample) => [sample.itemId, sample]));
  const recordedSampledItemIds = new Set(batch.equivalenceClasses.flatMap((entry) => entry.sampledItemIds));
  if (sampleByItem.size !== batch.samples.length) {
    report("duplicate-id", batch.id, "Sampling QA requires one durable sample record per sampled item");
  }
  if (
    sampleByItem.size !== recordedSampledItemIds.size
    || [...sampleByItem.keys()].some((itemId) => !recordedSampledItemIds.has(itemId))
  ) {
    report("missing-sampling-coverage", batch.id, "Sampling item records must exactly match the real representatives named by equivalence classes");
  }
  const requiredSampleDimensions = ["rights-license", "provenance", "factual-culinary", "editorial", "visual-image"] as const;
  for (const sample of batch.samples) {
    const dimensions = new Set(sample.dimensions);
    if (
      !batch.itemIds.includes(sample.itemId)
      || !sample.equivalenceClassKeys.length
      || sample.equivalenceClassKeys.some((key) => !batch.equivalenceClasses.some((entry) => entry.key === key && entry.sampledItemIds.includes(sample.itemId)))
      || (currentPublicationRecord && sample.verdict !== "pass")
      || (currentPublicationRecord && sample.findings.some((finding) => finding.disposition === "unresolved"))
      || dimensions.size !== requiredSampleDimensions.length
      || requiredSampleDimensions.some((dimension) => !dimensions.has(dimension))
    ) {
      report("missing-sampling-coverage", `${batch.id}:${sample.itemId}`, "Each sampled item requires a passing, all-dimension durable audit record");
    }
  }
  for (const equivalence of batch.equivalenceClasses) {
    const actualMembers = [...equivalence.itemIds].sort();
    const expectedMembers = currentArtifactSet
      ? classifications
        .filter((classification) => batch.itemIds.includes(classification.itemId) && classification.equivalenceClassKeys.includes(equivalence.key))
        .map((classification) => classification.itemId)
        .sort()
      : actualMembers;
    if (seenClassKeys.has(equivalence.key)) report("duplicate-id", `${batch.id}:${equivalence.key}`, "Sampling equivalence class must be unique within a batch");
    seenClassKeys.add(equivalence.key);
    if (
      !equivalence.key.trim()
      || !equivalence.itemIds.length
      || !equivalence.sampledItemIds.length
      || equivalence.itemIds.some((itemId) => !batch.itemIds.includes(itemId) || (currentArtifactSet && !publishedItemIds.has(itemId)))
      || equivalence.sampledItemIds.some((itemId) => !equivalence.itemIds.includes(itemId) || !batch.itemIds.includes(itemId) || (currentArtifactSet && !publishedItemIds.has(itemId)))
      || equivalence.sampledItemIds.some((itemId) => !sampleByItem.get(itemId)?.equivalenceClassKeys.includes(equivalence.key))
      || expectedMembers.join(",") !== actualMembers.join(",")
    ) {
      report("missing-sampling-coverage", batch.id, `Sampling class ${equivalence.key || "unknown"} requires a valid representative sample`);
    }
  }
  const expectedClassKeys = currentArtifactSet
    ? new Set(classifications.filter((classification) => batch.itemIds.includes(classification.itemId)).flatMap((classification) => classification.equivalenceClassKeys))
    : seenClassKeys;
  if (currentArtifactSet) {
    for (const key of expectedClassKeys) {
      if (!seenClassKeys.has(key)) report("missing-sampling-coverage", batch.id, `Sampling batch omits risk class ${key}`);
    }
  }
  for (const finding of batch.findings) {
    if (!finding.equivalenceClassKeys.length || finding.equivalenceClassKeys.some((key) => !expectedClassKeys.has(key))) {
      report("missing-sampling-coverage", batch.id, `Sampling finding ${finding.code} must identify a current equivalence class`);
    }
  }
  for (const sample of batch.samples) {
    if (sample.equivalenceClassKeys.some((key) => !seenClassKeys.has(key))) {
      report("missing-sampling-coverage", `${batch.id}:${sample.itemId}`, "Sample evidence references a class outside the recorded batch");
    }
  }
}

function validateSamplingHistory(
  batches: readonly PublishingGovernanceRegistry["samplingBatches"][number][],
  classifications: readonly PublishingRiskClassification[],
  policyVersion: string,
  versionOf: (itemIds: readonly string[]) => string,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const ordered = [...batches].sort((left, right) => left.sequence - right.sequence);
  const currentPopulationByClass = new Map<string, string[]>();
  for (const classification of classifications) {
    for (const key of classification.equivalenceClassKeys) {
      currentPopulationByClass.set(key, [...(currentPopulationByClass.get(key) ?? []), classification.itemId]);
    }
  }
  const states = new Map<string, { frozen: boolean; consecutiveCleanFullReviews: number; lastBatchId: string }>();

  ordered.forEach((batch, index) => {
    if (batch.sequence !== index + 1 || (index === 0 ? batch.previousBatchId !== undefined : batch.previousBatchId !== ordered[index - 1].id)) {
      report("sampling-metrics-invalid", batch.id, "Sampling batches require a contiguous sequence and explicit previous-batch chain");
    }
    const majorClassKeys = new Set(batch.findings.filter((finding) => finding.severity === "major").flatMap((finding) => finding.equivalenceClassKeys));

    for (const [key, state] of states) {
      if (!state.frozen) continue;
      const equivalence = batch.equivalenceClasses.find((entry) => entry.key === key);
      const currentPopulation = [...(currentPopulationByClass.get(key) ?? [])].sort();
      const cleanCurrentRecord = batch.policyVersion === policyVersion
        && batch.artifactSetVersion === versionOf(batch.itemIds)
        && batch.verdict === "pass"
        && !batch.findings.some((finding) => finding.severity === "major" || finding.disposition === "unresolved");
      const fullReview = Boolean(
        cleanCurrentRecord
        && equivalence
        && [...equivalence.itemIds].sort().join(",") === currentPopulation.join(",")
        && [...equivalence.sampledItemIds].sort().join(",") === currentPopulation.join(",")
        && currentPopulation.every((itemId) => batch.samples.some((sample) =>
          sample.itemId === itemId
          && sample.verdict === "pass"
          && sample.equivalenceClassKeys.includes(key)
          && !sample.findings.some((finding) => finding.disposition === "unresolved"))),
      );
      if (!fullReview) {
        report("sampling-class-frozen", batch.id, `Frozen risk class ${key} requires 100% review of the current class population`);
        state.consecutiveCleanFullReviews = 0;
      } else if (majorClassKeys.has(key)) {
        state.consecutiveCleanFullReviews = 0;
      } else {
        state.consecutiveCleanFullReviews += 1;
        if (state.consecutiveCleanFullReviews >= 2) state.frozen = false;
      }
      state.lastBatchId = batch.id;
    }

    for (const key of majorClassKeys) {
      states.set(key, { frozen: true, consecutiveCleanFullReviews: 0, lastBatchId: batch.id });
    }
  });

  for (const [key, state] of states) {
    if (state.frozen && currentPopulationByClass.has(key)) {
      report("sampling-class-frozen", state.lastBatchId, `Risk class ${key} remains frozen until two consecutive clean 100% re-review batches`);
    }
  }
}

function validateSamplingCoverage(
  item: CulinaryItem,
  classification: PublishingRiskClassification,
  batches: readonly PublishingGovernanceRegistry["samplingBatches"][number][],
  versionOf: (itemIds: readonly string[]) => string,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  for (const key of classification.equivalenceClassKeys) {
    const covered = batches.some((batch) =>
      batch.itemIds.includes(item.id)
      && batch.artifactSetVersion === versionOf(batch.itemIds)
      && batch.verdict === "pass"
      && batch.equivalenceClasses.some((entry) =>
        entry.key === key
        && entry.itemIds.includes(item.id)
        && entry.sampledItemIds.some((sampledItemId) => batch.samples.some((sample) =>
          sample.itemId === sampledItemId
          && sample.verdict === "pass"
          && sample.equivalenceClassKeys.includes(key)))));
    if (!covered) report("missing-sampling-coverage", item.id, `No current sampling QA coverage for risk class ${key}`);
  }
}

function requiredDimensions(item: CulinaryItem, registry: ContentRightsRegistry): ReviewDimension[] {
  const artifacts = getItemArtifacts(item, registry);
  const dimensions: ReviewDimension[] = ["rights-license", "provenance"];
  if (artifacts.some((artifact) => artifact.kind !== "image")) dimensions.push("factual-culinary");
  if (artifacts.some((artifact) => ["identity", "preparation", "story", "product-profile"].includes(artifact.kind))) dimensions.push("editorial");
  if (artifacts.some((artifact) => artifact.kind === "image")) dimensions.push("visual-image");
  return dimensions;
}

function deriveMinimumRisk(item: CulinaryItem, registry: ContentRightsRegistry): { level: PublishingRiskLevel; reasonCodes: PublishingRiskReasonCode[] } {
  const artifacts = getItemArtifacts(item, registry);
  const assessments = artifacts.flatMap((artifact) => registry.assessments.filter((assessment) => assessment.id === artifact.rightsAssessmentId));
  const highRights = assessments.some((assessment) =>
    Object.values(assessment.permissions).some((permission) => ["prohibited", "review-required"].includes(permission.status))
    || Object.values(assessment.risks).some((risk) => risk.status === "review-required")
    || Boolean(assessment.uncertainty.trim()));
  const restaurant = registry.restaurants.find((entry) => entry.culinaryItemId === item.id);
  const hasProductProfile = registry.productProfiles.some((entry) => entry.culinaryItemId === item.id);
  const hasGeneratedImage = artifacts.some((artifact) => artifact.kind === "image" && artifact.derivation === "generated");
  const hasLicensedCopy = artifacts.some((artifact) => artifact.derivation === "licensed-copy");
  const hasAi = artifacts.some((artifact) => registry.ai.some((record) => record.artifactId === artifact.id));

  if (highRights || restaurant?.kind === "official-authorized-recipe") {
    return {
      level: "high",
      reasonCodes: [highRights ? "professional-legal-checkpoint" : "official-authorization-or-brand-relationship"],
    };
  }
  const mediumReasons: PublishingRiskReasonCode[] = [];
  if (restaurant?.kind === "cooking-lab-reconstruction") mediumReasons.push("restaurant-reconstruction");
  if (hasProductProfile) mediumReasons.push("product-profile");
  if (hasGeneratedImage) mediumReasons.push("ai-generated-image");
  if (hasLicensedCopy) mediumReasons.push("single-source-deep-adaptation");
  if (mediumReasons.length) return { level: "medium", reasonCodes: mediumReasons };
  return {
    level: "low",
    reasonCodes: [hasAi ? "ai-assisted-expression" : "clear-first-party-or-reference-only-rights"],
  };
}

function intersect<T>(left: ReadonlySet<T> | undefined, right: ReadonlySet<T> | undefined): Set<T> {
  if (!left || !right) return new Set<T>();
  return new Set([...left].filter((value) => right.has(value)));
}

function uniqueMap<T>(
  entries: readonly T[],
  label: string,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
  key: (entry: T) => string = (entry) => (entry as { id: string }).id,
): Map<string, T> {
  const result = new Map<string, T>();
  for (const entry of entries) {
    const id = key(entry);
    if (result.has(id)) report("duplicate-id", id, `Duplicate ${label}`);
    result.set(id, entry);
  }
  return result;
}

function uniqueById<T extends { id: string }>(entries: readonly T[]): T[] {
  return [...new Map(entries.map((entry) => [entry.id, entry])).values()].sort(byId);
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function safeSourceDomain(url: string): string {
  try {
    return new URL(url).hostname || "invalid-url";
  } catch {
    return "invalid-url";
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isGitCommit(value: string): boolean {
  return /^[0-9a-f]{40}$/i.test(value);
}

function isArtifactSetVersion(value: string): boolean {
  return /^clv1-[0-9a-f]{16}$/i.test(value);
}
