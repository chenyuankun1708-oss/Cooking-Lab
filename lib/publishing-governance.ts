import type { CulinaryItem } from "@/types/culinary";
import type { ContentArtifact, ContentRightsRegistry } from "@/types/content-rights";
import type {
  PublishingGovernanceRegistry,
  PublishingRiskClassification,
  PublishingRiskLevel,
  PublishingRiskReasonCode,
  ReviewAttestation,
  ReviewDimension,
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
  const artifacts = context.items
    .filter((item) => itemIdSet.has(item.id))
    .flatMap((item) => getItemArtifacts(item, context.rightsRegistry))
    .map((artifact) => ({ id: artifact.id, version: artifact.version }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return createContentVersion({ itemIds: [...itemIds].sort(), artifacts });
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
  const riskByItem = uniqueMap(governance.riskClassifications, "risk classification", report, (entry) => entry.itemId);
  uniqueMap(governance.attestations, "review attestation", report);
  uniqueMap(governance.samplingBatches, "sampling batch", report);

  for (const attestation of governance.attestations) validateAttestation(attestation, governance.policyVersion, context, publishedItemIds, report);
  for (const batch of governance.samplingBatches) validateSamplingBatch(batch, governance.attestations, governance.policyVersion, context, publishedItemIds, report);

  for (const item of publishedItems) {
    const classification = riskByItem.get(item.id);
    if (!classification) {
      report("missing-risk-classification", item.id, "Published item has no risk classification");
      continue;
    }
    validateRiskClassification(classification, item, governance.policyVersion, context, report);
    validateReviewCoverage(item, classification, governance.attestations, context, report);
    validateSamplingCoverage(item, classification, governance.samplingBatches, context, report);
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
  context: PublishingGovernanceContext,
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
  const currentVersion = createArtifactSetVersion(attestation.itemIds, context);
  if (attestation.artifactSetVersion !== currentVersion) {
    report("stale-review-attestation", attestation.id, "Content changed after review; the attestation no longer matches the artifact set");
  }
}

function validateRiskClassification(
  classification: PublishingRiskClassification,
  item: CulinaryItem,
  policyVersion: string,
  context: PublishingGovernanceContext,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const currentVersion = createArtifactSetVersion([item.id], context);
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
  const highReasons = new Set<PublishingRiskReasonCode>([
    "official-authorization-or-brand-relationship",
    "health-or-medical-claim",
    "food-safety-critical-process",
    "unresolved-material-factual-conflict",
    "complex-trademark-publicity-or-privacy",
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
  policyVersion: string,
  context: PublishingGovernanceContext,
  publishedItemIds: ReadonlySet<string>,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  const completeIdentity = [batch.author, batch.auditor].every((identity) => identity.actorId.trim() && identity.runId.trim() && identity.contextId.trim());
  if (!completeIdentity || !isGitCommit(batch.reviewedCommit) || !batch.evidenceReference.trim() || !batch.rubricVersion.trim() || !isIsoDate(batch.auditedAt)) {
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
  if (batch.findings.some((finding) => finding.disposition === "unresolved")) {
    report("unresolved-review-finding", batch.id, "Sampling QA cannot pass with unresolved findings");
  }
  if (batch.policyVersion !== policyVersion || batch.artifactSetVersion !== createArtifactSetVersion(batch.itemIds, context)) {
    report("missing-sampling-coverage", batch.id, "Sampling batch does not match the active policy and current artifact set");
  }
  if (batch.itemIds.some((itemId) => !publishedItemIds.has(itemId))) {
    report("missing-sampling-coverage", batch.id, "Sampling batch contains an item outside the published boundary");
  }
  const metricValues = Object.values(batch.metrics);
  if (metricValues.some((value) => !Number.isInteger(value) || value < 0) || batch.metrics.reworkItemCount > batch.itemIds.length) {
    report("sampling-metrics-invalid", batch.id, "Sampling metrics must be non-negative integers within the batch size");
  }
  for (const equivalence of batch.equivalenceClasses) {
    if (!equivalence.key.trim() || !equivalence.itemIds.length || !equivalence.sampledItemIds.length || equivalence.sampledItemIds.some((itemId) => !equivalence.itemIds.includes(itemId))) {
      report("missing-sampling-coverage", batch.id, `Sampling class ${equivalence.key || "unknown"} requires a valid representative sample`);
    }
  }
  for (const classKey of batch.frozenClassKeys) {
    const fullReview = batch.fullReReviewClassKeys.includes(classKey);
    const cleanBatches = batch.consecutiveCleanBatchesByClass[classKey] ?? 0;
    if (!fullReview || cleanBatches < 2) {
      report("sampling-class-frozen", batch.id, `Risk class ${classKey} remains frozen until full re-review and two consecutive clean batches`);
    }
  }
}

function validateSamplingCoverage(
  item: CulinaryItem,
  classification: PublishingRiskClassification,
  batches: readonly PublishingGovernanceRegistry["samplingBatches"][number][],
  context: PublishingGovernanceContext,
  report: (code: PublishingGovernanceIssueCode, subjectId: string, message: string) => void,
) {
  for (const key of classification.equivalenceClassKeys) {
    const covered = batches.some((batch) =>
      batch.itemIds.includes(item.id)
      && batch.artifactSetVersion === createArtifactSetVersion(batch.itemIds, context)
      && batch.equivalenceClasses.some((entry) => entry.key === key && entry.itemIds.includes(item.id) && entry.sampledItemIds.length > 0));
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

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isGitCommit(value: string): boolean {
  return /^[0-9a-f]{40}$/i.test(value);
}
