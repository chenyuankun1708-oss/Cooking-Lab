import type { CulinaryItem, Evidence, Source, Story } from "@/types/culinary";
import type {
  ContentArtifact,
  ContentRightsRegistry,
  RightsAction,
  RightsAssessment,
} from "@/types/content-rights";
import { rightsActions } from "@/types/content-rights";
import type { Ingredient } from "@/types/ingredient";
import type { RecipeImage } from "@/types/image";
import type { ResearchRecord } from "@/types/research";
import { createContentVersion } from "./content-version";

export const contentRightsIssueCodes = [
  "duplicate-id",
  "missing-reference",
  "missing-artifact",
  "permission-blocked",
  "permission-review-required",
  "obligation-missing",
  "attribution-invalid",
  "share-alike-not-isolated",
  "reference-only-expression-reuse",
  "source-rights-unknown",
  "source-rights-changed",
  "review-incomplete",
  "assessment-expired",
  "risk-review-incomplete",
  "ai-review-incomplete",
  "ai-input-rights-unknown",
  "database-extraction-prohibited",
  "dataset-provenance-incomplete",
  "restaurant-identity-invalid",
  "external-media-copy-prohibited",
  "external-media-privacy-review",
  "product-profile-invalid",
  "nutrition-provenance-missing",
  "cost-provenance-missing",
] as const;
export type ContentRightsIssueCode = (typeof contentRightsIssueCodes)[number];

export interface ContentRightsIssue {
  code: ContentRightsIssueCode;
  subjectId: string;
  field: string;
  message: string;
}

export interface ContentRightsContext {
  items: readonly CulinaryItem[];
  images: readonly RecipeImage[];
  ingredients: readonly Ingredient[];
  stories: readonly Story[];
  evidence: readonly Evidence[];
  sources: readonly Source[];
  researchRecords: readonly ResearchRecord[];
  now: string;
}

export interface ContentRightsAuditResult {
  ready: boolean;
  issues: ContentRightsIssue[];
  auditedItemIds: string[];
  artifactCount: number;
}

const requiredItemArtifactKinds = ["identity", "preparation", "nutrition", "cost"] as const;

export function evaluateContentRightsRegistry(
  registry: ContentRightsRegistry,
  context: ContentRightsContext,
): ContentRightsAuditResult {
  const issues: ContentRightsIssue[] = [];
  const report = (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => {
    issues.push({ code, subjectId, field, message });
  };

  const assessments = uniqueMap(registry.assessments, "RightsAssessment", report);
  const artifacts = uniqueMap(registry.artifacts, "ContentArtifact", report);
  const decisions = uniqueMap(registry.decisions, "UsageDecision", report);
  const attributions = uniqueMap(registry.attributions, "AttributionRequirement", report);
  uniqueMap(registry.datasets, "DatasetSource", report);
  uniqueMap(registry.costs, "CostProvenance", report);
  uniqueMap(registry.aiInputs, "AiInputArtifact", report);
  uniqueMap(registry.ai, "AiGenerationRecord", report);
  uniqueMap(registry.externalMedia, "ExternalMediaReference", report);
  uniqueMap(registry.productProfiles, "ProductProfile", report);
  reportDuplicateKey(registry.nutrition, (entry) => entry.ingredientId, "NutritionProvenance ingredient", report);
  reportDuplicateKey(registry.ai, (entry) => entry.artifactId, "AI artifact", report);
  reportDuplicateKey(registry.restaurants, (entry) => entry.culinaryItemId, "Restaurant CulinaryItem", report);

  for (const assessment of registry.assessments) {
    validateAssessment(assessment, context.now, report);
    for (const attributionId of assessment.attributionRequirementIds) {
      if (!attributions.has(attributionId)) report("missing-reference", assessment.id, "attributionRequirementIds", `Missing attribution ${attributionId}`);
    }
  }

  for (const artifact of registry.artifacts) {
    const assessment = assessments.get(artifact.rightsAssessmentId);
    const decision = decisions.get(artifact.usageDecisionId);
    if (!assessment) report("missing-reference", artifact.id, "rightsAssessmentId", `Missing assessment ${artifact.rightsAssessmentId}`);
    else if (assessment.subject.type !== "artifact" || assessment.subject.id !== artifact.id) {
      report("missing-reference", artifact.id, "rightsAssessmentId", "Artifact assessment must identify the same artifact");
    }
    if (!decision) report("missing-reference", artifact.id, "usageDecisionId", `Missing decision ${artifact.usageDecisionId}`);
    if (!artifact.version.trim()) report("review-incomplete", artifact.id, "version", "Artifact requires a deterministic content version");
    for (const attributionId of artifact.attributionRequirementIds) {
      const attribution = attributions.get(attributionId);
      if (!attribution) report("missing-reference", artifact.id, "attributionRequirementIds", `Missing attribution ${attributionId}`);
      else if (attribution.artifactId !== artifact.id) report("attribution-invalid", artifact.id, "attributionRequirementIds", `Attribution ${attributionId} belongs to another artifact`);
    }
    if (assessment) validateArtifactPermission(artifact, assessment, report);
    if (decision) validateDecision(artifact, decision, assessments, attributions, context.sources, report);
  }

  validateAttributions(registry, artifacts, report);
  validateAi(registry, context, artifacts, assessments, report);
  validateDatasets(registry, assessments, report);
  validateCosts(registry, assessments, report);
  validateExternalMedia(registry, assessments, context.sources, report);
  validateRestaurants(registry, context, assessments, report);
  validateProductProfiles(registry, context, assessments, artifacts, report);
  validateSources(context.sources, context.evidence, registry, report);
  validatePublishedCoverage(registry, context, report);

  return {
    ready: issues.length === 0,
    issues: issues.sort((a, b) => `${a.subjectId}:${a.code}:${a.field}`.localeCompare(`${b.subjectId}:${b.code}:${b.field}`)),
    auditedItemIds: context.items.filter((item) => item.publication.status === "published").map((item) => item.id).sort(),
    artifactCount: registry.artifacts.length,
  };
}

export function assertContentRightsReady(registry: ContentRightsRegistry, context: ContentRightsContext): void {
  const result = evaluateContentRightsRegistry(registry, context);
  if (result.ready) return;
  throw new Error(`Content rights gate blocked Production: ${formatContentRightsIssues(result.issues)}`);
}

export function getContentRightsEvaluationDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatContentRightsIssues(issues: readonly ContentRightsIssue[]): string {
  return issues.map((issue) => `${issue.code}:${issue.subjectId}:${issue.field}`).join("; ");
}

export function formatAiRightsObligationCondition(assessmentId: string): string {
  return `Comply with obligations recorded in RightsAssessment ${assessmentId}.`;
}

export function createContentRightsAuditReport(result: ContentRightsAuditResult): string {
  const header = [
    "# Content rights audit",
    "",
    `Status: ${result.ready ? "PASS" : "BLOCKED"}`,
    `Published items audited: ${result.auditedItemIds.length}`,
    `Artifacts audited: ${result.artifactCount}`,
    `Issues: ${result.issues.length}`,
  ];
  if (!result.issues.length) return `${header.join("\n")}\n`;
  return `${header.join("\n")}\n\n${result.issues.map((issue) => `- ${issue.code} | ${issue.subjectId} | ${issue.field}: ${issue.message}`).join("\n")}\n`;
}

function validateAssessment(
  assessment: RightsAssessment,
  now: string,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  if (assessment.jurisdictionBaseline.join(",") !== "CN,US,EU,UK") {
    report("risk-review-incomplete", assessment.id, "jurisdictionBaseline", "Production assessments must use the CN/US/EU/UK baseline");
  }
  if (assessment.applicableTerritories.join(",") !== "CN,US,EU,UK" || !assessment.authorityVersion.trim() || !isIsoDate(assessment.accessedAt)) {
    report("risk-review-incomplete", assessment.id, "authority", "Authority version, access date, and applicable territories are required");
  }
  if (!assessment.reviewer.trim() || !isIsoDate(assessment.assessedAt) || !assessment.reviewDueAt || !isIsoDate(assessment.reviewDueAt)) {
    report("review-incomplete", assessment.id, "review", "Assessment requires reviewer, assessment date, and review-due date");
  }
  if (assessment.reviewDueAt && assessment.reviewDueAt < now) {
    report("assessment-expired", assessment.id, "reviewDueAt", "Rights assessment is past its review date");
  }
  for (const action of rightsActions) {
    if (!assessment.permissions[action].scope.trim()) {
      report("risk-review-incomplete", assessment.id, `permissions.${action}.scope`, "Every permission decision requires a non-empty scope");
    }
  }
  if (!isAssessmentBasisComplete(assessment)) {
    report("risk-review-incomplete", assessment.id, "basis", "Rights basis metadata is incomplete or unsafe");
  }
  for (const [risk, review] of Object.entries(assessment.risks)) {
    if (review.status === "review-required") report("risk-review-incomplete", assessment.id, `risks.${risk}`, "Risk review is unresolved");
  }
  if (assessment.uncertainty.trim()) report("risk-review-incomplete", assessment.id, "uncertainty", "Unresolved uncertainty blocks Production");
}

function validateArtifactPermission(
  artifact: ContentArtifact,
  assessment: RightsAssessment,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  for (const action of rightsActions) {
    const permission = assessment.permissions[action];
    if (permission.status === "prohibited") report("permission-blocked", artifact.id, `permissions.${action}`, `${action} is prohibited`);
    if (permission.status === "review-required") report("permission-review-required", artifact.id, `permissions.${action}`, `${action} still requires review`);
  }
}

function validateDecision(
  artifact: ContentArtifact,
  decision: ContentRightsRegistry["decisions"][number],
  assessments: ReadonlyMap<string, RightsAssessment>,
  attributions: ReadonlyMap<string, ContentRightsRegistry["attributions"][number]>,
  sources: readonly Source[],
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  if (decision.artifactId !== artifact.id) report("missing-reference", decision.id, "artifactId", "UsageDecision points to another artifact");
  if (!decision.assessmentIds.includes(artifact.rightsAssessmentId)) report("missing-reference", decision.id, "assessmentIds", "UsageDecision must include the artifact's own RightsAssessment");
  if (!decision.reviewer.trim() || !isIsoDate(decision.decidedAt)) report("review-incomplete", decision.id, "review", "UsageDecision requires reviewer and ISO decision date");
  if (decision.decision === "block") report("permission-blocked", artifact.id, "usageDecision", "UsageDecision blocks Production");
  for (const assessmentId of decision.assessmentIds) {
    const assessment = assessments.get(assessmentId);
    if (!assessment) report("missing-reference", decision.id, "assessmentIds", `Missing assessment ${assessmentId}`);
    if (assessment?.basis.kind === "reference-only" && ["adaptation", "licensed-copy"].includes(artifact.derivation)) {
      report("reference-only-expression-reuse", artifact.id, "derivation", "Reference-only material cannot authorize copied or adapted expression");
    }
  }
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  for (const sourceId of artifact.sourceIds) {
    const sourceAssessment = [...assessments.values()].find((assessment) => assessment.subject.type === "source" && assessment.subject.id === sourceId);
    if (!sourceAssessment || !decision.assessmentIds.includes(sourceAssessment.id)) {
      report("missing-reference", artifact.id, "usageDecision.assessmentIds", `Source ${sourceId} must have its own linked RightsAssessment`);
    }
    if (sourceById.get(sourceId)?.rights.status === "reference-only" && ["adaptation", "licensed-copy"].includes(artifact.derivation)) {
      report("reference-only-expression-reuse", artifact.id, "derivation", "Reference-only Source metadata cannot authorize copied or adapted expression");
    }
  }
  const ownAssessment = assessments.get(artifact.rightsAssessmentId);
  const obligationIds = new Set([...(ownAssessment?.attributionRequirementIds ?? []), ...artifact.attributionRequirementIds]);
  const alignedAttributions = [...obligationIds].flatMap((id) => {
    const attribution = attributions.get(id);
    return attribution?.artifactId === artifact.id ? [attribution] : [];
  });
  const assessmentRequiresObligations = ownAssessment && rightsActions.some((action) => ownAssessment.permissions[action].status === "allowed-with-obligations");
  if (assessmentRequiresObligations && decision.decision !== "allow-with-obligations") {
    report("obligation-missing", artifact.id, "usageDecision", "An assessment with obligations requires an allow-with-obligations UsageDecision");
  }
  if (ownAssessment?.basis.kind === "open-license") {
    const basis = ownAssessment.basis;
    const matchingAttribution = alignedAttributions.find((attribution) => attribution.licenseId === basis.licenseId && attribution.licenseUrl === basis.licenseUrl && isHttps(attribution.licenseUrl));
    const shareAlikeRequired = basis.licenseId.startsWith("cc-by-sa");
    if (!matchingAttribution || decision.decision !== "allow-with-obligations" || (shareAlikeRequired && (!matchingAttribution.shareAlikeRequired || !matchingAttribution.isolationBoundary))) {
      report("obligation-missing", artifact.id, "attribution", "Open-license artifacts require aligned attribution, license link, UsageDecision obligations, and any ShareAlike isolation");
    }
  }
  if (decision.decision === "allow-with-obligations" && !obligationIds.size && !decision.conditions.length) {
    report("obligation-missing", artifact.id, "usageDecision", "Allowed-with-obligations decision must record enforceable conditions");
  }
  for (const attributionId of obligationIds) {
    if (!attributions.has(attributionId)) report("obligation-missing", artifact.id, "attribution", `Required attribution ${attributionId} is missing`);
  }
}

function validateAttributions(
  registry: ContentRightsRegistry,
  artifacts: ReadonlyMap<string, ContentArtifact>,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  for (const attribution of registry.attributions) {
    if (!artifacts.has(attribution.artifactId)) report("missing-reference", attribution.id, "artifactId", `Missing artifact ${attribution.artifactId}`);
    if (!attribution.creator.trim() || !attribution.workTitle.trim() || !attribution.licenseId.trim() || !attribution.notice.trim() || !isHttps(attribution.sourceUrl) || (attribution.licenseUrl !== undefined && !isHttps(attribution.licenseUrl))) {
      report("attribution-invalid", attribution.id, "notice", "Creator, work, notice, and HTTPS source URL are required");
    }
    if (attribution.licenseId.startsWith("cc-by") && !isHttps(attribution.licenseUrl)) {
      report("attribution-invalid", attribution.id, "licenseUrl", "Creative Commons attribution requires the official HTTPS license URL");
    }
    if (attribution.shareAlikeRequired && !attribution.isolationBoundary) {
      report("share-alike-not-isolated", attribution.id, "isolationBoundary", "ShareAlike material must use an isolated asset or dataset boundary");
    }
    if (attribution.disclosureKind === "provenance-only" && (attribution.shareAlikeRequired || attribution.isolationBoundary)) {
      report("attribution-invalid", attribution.id, "disclosureKind", "A provenance-only disclosure cannot claim ShareAlike obligations");
    }
  }
}

function validateAi(
  registry: ContentRightsRegistry,
  context: ContentRightsContext,
  artifacts: ReadonlyMap<string, ContentArtifact>,
  assessments: ReadonlyMap<string, RightsAssessment>,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  const inputsById = new Map(registry.aiInputs.map((input) => [input.id, input]));
  const sourcesById = new Map(context.sources.map((source) => [source.id, source]));
  const recordsByArtifact = new Map<string, (typeof registry.ai)[number][]>();
  for (const record of registry.ai) {
    recordsByArtifact.set(record.artifactId, [...(recordsByArtifact.get(record.artifactId) ?? []), record]);
    const artifact = artifacts.get(record.artifactId);
    if (!artifact || artifact.derivation !== "generated") {
      report("ai-review-incomplete", record.id, "artifactId", "AI provenance may only reference an existing generated ContentArtifact");
    }
  }

  const usedInputIds = new Set(registry.ai.flatMap((record) => record.inputArtifactIds));
  for (const input of registry.aiInputs) {
    if (!usedInputIds.has(input.id)) {
      report("ai-review-incomplete", input.id, "usage", "AI input provenance cannot be retained as unused publication metadata");
    }
    if (!input.version.trim() || !isContentHash(input.contentHash)) {
      report("ai-review-incomplete", input.id, "version", "AI input requires a deterministic version and content hash");
    }
    const expectedContentHash = createContentVersion({
      kind: input.kind,
      sourceIds: [...input.sourceIds].sort(),
      evidenceIds: [...input.evidenceIds].sort(),
      researchRecordIds: [...input.researchRecordIds].sort(),
      rightsAssessmentIds: [...input.rightsAssessmentIds].sort(),
      containsThirdPartyExpression: input.containsThirdPartyExpression,
    });
    if (input.contentHash !== expectedContentHash) {
      report("ai-review-incomplete", input.id, "contentHash", "AI input hash must match the canonical structured input payload");
    }
    if (input.containsThirdPartyExpression !== false) {
      report("ai-input-rights-unknown", input.id, "containsThirdPartyExpression", "AI input bundles cannot contain copied third-party expression");
    }
    if (new Set(input.sourceIds).size !== input.sourceIds.length
      || new Set(input.evidenceIds).size !== input.evidenceIds.length
      || new Set(input.researchRecordIds).size !== input.researchRecordIds.length
      || new Set(input.rightsAssessmentIds).size !== input.rightsAssessmentIds.length) {
      report("ai-review-incomplete", input.id, "references", "AI input references must be unique");
    }

    const sourceIds = new Set(input.sourceIds);
    const evidence = input.evidenceIds.map((id) => context.evidence.find((entry) => entry.id === id));
    const researchRecords = input.researchRecordIds.map((id) => context.researchRecords.find((entry) => entry.id === id));
    if (evidence.some((entry) => !entry) || evidence.some((entry) => entry && !sourceIds.has(entry.sourceId))) {
      report("ai-input-rights-unknown", input.id, "evidenceIds", "Every AI input Evidence record must resolve to one of the input Sources");
    }
    if (researchRecords.some((entry) => !entry || entry.status !== "closed")) {
      report("ai-input-rights-unknown", input.id, "researchRecordIds", "AI input ResearchRecords must exist and be closed");
    }
    const acceptedSourceIds = new Set(researchRecords.flatMap((record) => record?.sourceDecisions.flatMap((decision) =>
      decision.disposition === "accepted" ? [decision.sourceId] : []) ?? []));
    if (input.kind === "structured-research-bundle" && (!input.sourceIds.length || input.sourceIds.some((id) => !acceptedSourceIds.has(id)))) {
      report("ai-input-rights-unknown", input.id, "sourceIds", "Structured AI inputs must contain only Sources accepted by the linked closed ResearchRecords");
    }

    const linkedAssessments = input.rightsAssessmentIds.map((id) => assessments.get(id));
    const inputAssessments = linkedAssessments.filter((assessment) => assessment?.subject.type === "ai-input" && assessment.subject.id === input.id);
    const sourcesResolve = input.sourceIds.every((sourceId) => sourcesById.has(sourceId));
    const sourceAssessmentsComplete = input.sourceIds.every((sourceId) => linkedAssessments.filter((assessment) =>
      assessment?.subject.type === "source" && assessment.subject.id === sourceId).length === 1);
    const assessmentSubjectsExact = linkedAssessments.every((assessment) => assessment && (
      (assessment.subject.type === "ai-input" && assessment.subject.id === input.id)
      || (assessment.subject.type === "source" && sourceIds.has(assessment.subject.id))
    ));
    const transformAllowed = linkedAssessments.every((assessment) => assessment
      && !["prohibited", "review-required"].includes(assessment.permissions.store.status)
      && !["prohibited", "review-required"].includes(assessment.permissions.transform.status));
    if (inputAssessments.length !== 1 || !sourcesResolve || !sourceAssessmentsComplete || !assessmentSubjectsExact || !transformAllowed) {
      report("ai-input-rights-unknown", input.id, "rightsAssessmentIds", "AI input requires its own assessment plus every registered Source assessment, all allowing storage and transformation");
    }
  }

  for (const artifact of registry.artifacts.filter((entry) => entry.derivation === "generated")) {
    const records = recordsByArtifact.get(artifact.id) ?? [];
    if (records.length !== 1) {
      report("ai-review-incomplete", artifact.id, "ai", "Generated artifact requires exactly one AI provenance record");
      continue;
    }
    const [record] = records;
    if (record.outputArtifactVersion !== artifact.version) {
      report("ai-review-incomplete", artifact.id, "ai.outputArtifactVersion", "AI provenance must identify the current output artifact version");
    }
    if (
      record.author.actorType !== "agent"
      || !record.author.actorId.trim()
      || !record.author.runId.trim()
      || !record.author.contextId.trim()
      || !record.provider.trim()
      || !record.model.trim()
      || !record.modelVersion.trim()
      || !isIsoDate(record.generatedAt)
      || !record.promptTemplateId.trim()
      || !record.promptTemplateVersion.trim()
      || !isContentHash(record.promptTemplateHash)
    ) {
      report("ai-review-incomplete", artifact.id, "ai.identity", "AI author context, provider/model version, generation date, and versioned prompt identity are required");
    }
    if (!record.reviewAttestationIds.length || record.similarityReview !== "passed" || record.trademarkReview === "required") {
      report("ai-review-incomplete", artifact.id, "ai.review", "Risk-based review attestations, similarity review, and trademark review must be present before Production");
    }
    const chainAssessmentIds = record.serviceChain.map((entry) => entry.termsAssessmentId);
    const chainIdsUnique = new Set(record.serviceChain.map((entry) => entry.serviceId)).size === record.serviceChain.length;
    const assessmentIdsUnique = new Set(chainAssessmentIds).size === chainAssessmentIds.length;
    const exactTermsSet = sameStringSet(record.termsAssessmentIds, chainAssessmentIds);
    const modelProviders = record.serviceChain.filter((entry) => entry.role === "model-provider");
    const gateways = record.serviceChain.filter((entry) => entry.role === "gateway");
    const routeShapeValid = record.serviceRoute === "direct"
      ? record.serviceChain.length === 1 && gateways.length === 0 && modelProviders.length === 1
      : record.serviceRoute === "gateway"
        && gateways.length >= 1
        && modelProviders.length === 1
        && record.serviceChain.at(-1)?.role === "model-provider";
    const serviceChainAllowed = record.serviceChain.length > 0
      && chainIdsUnique
      && assessmentIdsUnique
      && exactTermsSet
      && routeShapeValid
      && modelProviders.length === 1
      && modelProviders[0].provider === record.provider
      && record.serviceChain.every((entry) => {
        const assessment = assessments.get(entry.termsAssessmentId);
        return entry.serviceId.trim()
          && entry.provider.trim()
          && entry.termsAssessmentId.trim()
          && assessment?.subject.type === "ai-service"
          && assessment.subject.id === entry.serviceId
          && assessment.basis.kind === "terms"
          && assessment.basis.provider === entry.provider
          && rightsActions.every((action) => !["prohibited", "review-required"].includes(assessment.permissions[action].status));
      });
    if (!serviceChainAllowed) {
      report("ai-input-rights-unknown", artifact.id, "ai.serviceChain", "The declared direct-provider or gateway route must map one-to-one to dated assessments allowing storage, transformation, publication, and commercial use");
    }
    const inputs = record.inputArtifactIds.map((inputId) => inputsById.get(inputId));
    if (inputs.some((input) => !input)) {
      report("missing-reference", artifact.id, "ai.inputArtifactIds", "AI input provenance record is missing");
    }
    const inputSources = new Set(inputs.flatMap((input) => input?.sourceIds ?? []));
    const inputEvidence = new Set(inputs.flatMap((input) => input?.evidenceIds ?? []));
    if (artifact.sourceIds.some((sourceId) => !inputSources.has(sourceId)) || artifact.evidenceIds.some((evidenceId) => !inputEvidence.has(evidenceId))) {
      report("ai-input-rights-unknown", artifact.id, "ai.inputArtifactIds", "Generated output provenance must be contained in its versioned AI input bundles");
    }
    const decision = registry.decisions.find((entry) => entry.id === artifact.usageDecisionId);
    const requiredAiAssessmentIds = new Set([
      ...chainAssessmentIds,
      ...inputs.flatMap((input) => input?.rightsAssessmentIds ?? []),
    ]);
    if (!decision || [...requiredAiAssessmentIds].some((assessmentId) => !decision.assessmentIds.includes(assessmentId))) {
      report("ai-input-rights-unknown", artifact.id, "usageDecision.assessmentIds", "UsageDecision must close over every AI input, Source, gateway, and model-provider assessment");
    }
    const obligationAssessmentIds = [...requiredAiAssessmentIds].filter((assessmentId) => {
      const assessment = assessments.get(assessmentId);
      return assessment && rightsActions.some((action) => assessment.permissions[action].status === "allowed-with-obligations");
    });
    if (obligationAssessmentIds.length && (
      decision?.decision !== "allow-with-obligations"
      || obligationAssessmentIds.some((assessmentId) => !decision.conditions.includes(formatAiRightsObligationCondition(assessmentId)))
    )) {
      report("obligation-missing", artifact.id, "usageDecision.conditions", "AI input and service terms obligations must be explicitly carried into the final UsageDecision");
    }
    const undisclosedAiAttributionAssessmentIds = [...requiredAiAssessmentIds].filter((assessmentId) => {
      const assessment = assessments.get(assessmentId);
      return assessment
        && ["ai-input", "ai-service"].includes(assessment.subject.type)
        && Boolean(assessment.attributionRequirementIds?.length);
    });
    if (undisclosedAiAttributionAssessmentIds.length) {
      report("attribution-invalid", artifact.id, "ai.attribution", "AI input or service attribution obligations cannot publish until an artifact-aligned consumer disclosure placement is implemented");
    }
    for (const inputId of record.inputArtifactIds) {
      if (!inputsById.has(inputId)) report("missing-reference", artifact.id, "ai.inputArtifactIds", `Missing AI input artifact ${inputId}`);
    }
  }
}

function validateDatasets(
  registry: ContentRightsRegistry,
  assessments: ReadonlyMap<string, RightsAssessment>,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  for (const dataset of registry.datasets) {
    const assessment = assessments.get(dataset.rightsAssessmentId);
    const usedForNutrition = registry.nutrition.some((entry) => entry.kind === "dataset" && entry.datasetId === dataset.id);
    if (!dataset.provider.trim() || !dataset.title.trim() || !dataset.version.trim() || !dataset.licenseId.trim() || !isHttps(dataset.sourceUrl)) {
      report("dataset-provenance-incomplete", dataset.id, "metadata", "Dataset provider, title, version, license, and HTTPS source URL are required");
    }
    if (usedForNutrition && (dataset.version === "not-yet-imported" || !dataset.releaseDate || !isIsoDate(dataset.releaseDate))) {
      report("dataset-provenance-incomplete", dataset.id, "version", "A DatasetSource used by nutrition requires an imported version and ISO release date");
    }
    if (!assessment) report("missing-reference", dataset.id, "rightsAssessmentId", "Dataset has no assessment");
    else if (assessment.subject.type !== "dataset" || assessment.subject.id !== dataset.id) report("missing-reference", dataset.id, "rightsAssessmentId", "Dataset assessment must identify the same dataset");
    if (assessment && rightsActions.some((action) => ["prohibited", "review-required"].includes(assessment.permissions[action].status))) {
      report("permission-blocked", dataset.id, "permissions", "Dataset use requires all four Production permissions to be allowed");
    }
    if (dataset.reuse.extraction === "systematic-scrape") {
      report("database-extraction-prohibited", dataset.id, "reuse.extraction", "Systematic scraping is outside the M10 policy");
    }
    if (dataset.reuse.scope === "substantial-dataset" && assessment?.basis.kind !== "public-domain" && assessment?.basis.kind !== "open-license") {
      report("database-extraction-prohibited", dataset.id, "reuse.scope", "Substantial database reuse requires an explicit compatible grant");
    }
  }
}

function validateCosts(
  registry: ContentRightsRegistry,
  assessments: ReadonlyMap<string, RightsAssessment>,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  for (const cost of registry.costs) {
    const assessment = assessments.get(cost.rightsAssessmentId);
    const assessmentAligned = assessment && assessment.subject.type === "dataset" && assessment.subject.id === cost.id;
    const allowed = assessment && rightsActions.every((action) => !["prohibited", "review-required"].includes(assessment.permissions[action].status));
    if (!cost.geography.trim() || !/^[A-Z]{3}$/.test(cost.currency) || !isIsoDate(cost.effectiveDate) || !cost.methodology.trim() || !assessmentAligned || !allowed) {
      report("cost-provenance-missing", cost.id, "provenance", "Cost provenance requires region, ISO currency and date, methodology, and an aligned allowed assessment");
    }
  }
}

function validateExternalMedia(
  registry: ContentRightsRegistry,
  assessments: ReadonlyMap<string, RightsAssessment>,
  sources: readonly Source[],
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  for (const media of registry.externalMedia) {
    const assessment = assessments.get(media.rightsAssessmentId);
    if (!assessment) report("missing-reference", media.id, "rightsAssessmentId", "External media has no rights assessment");
    if (!sources.some((source) => source.id === media.sourceId) || !isHttps(media.url)) report("missing-reference", media.id, "sourceId", "External media requires a registered Source and HTTPS URL");
    if (media.downloaded || media.transcriptStored || media.screenshotStored || media.automatedCollection) {
      report("external-media-copy-prohibited", media.id, "storage", "Downloaded media, transcripts, screenshots, and automated collection are prohibited");
    }
    if (media.use === "reference-only" && !media.timestamp) {
      report("external-media-copy-prohibited", media.id, "timestamp", "Reference-only video Evidence requires a retrievable timestamp");
    }
    if (media.use === "official-embed" && media.privacyReview !== "passed") {
      report("external-media-privacy-review", media.id, "privacyReview", "Official embeds require a completed privacy review");
    }
    if (media.use === "reference-only" && assessment && (assessment.subject.type !== "source" || assessment.subject.id !== media.sourceId)) {
      report("missing-reference", media.id, "rightsAssessmentId", "Reference-only media must use the matching Source assessment");
    }
    if (media.use === "official-embed" && (!assessment || assessment.subject.type !== "external-media" || assessment.subject.id !== media.id || ["prohibited", "review-required"].includes(assessment.permissions.publish.status) || ["prohibited", "review-required"].includes(assessment.permissions.commercialize.status))) {
      report("permission-blocked", media.id, "rightsAssessmentId", "Official embed requires its own assessment allowing publish and commercialize use");
    }
  }
}

function validateRestaurants(
  registry: ContentRightsRegistry,
  context: ContentRightsContext,
  assessments: ReadonlyMap<string, RightsAssessment>,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  const itemById = new Map(context.items.map((item) => [item.id, item]));
  const sourceIds = new Set(context.sources.map((source) => source.id));
  for (const identity of registry.restaurants) {
    if (!itemById.has(identity.culinaryItemId)) report("restaurant-identity-invalid", identity.culinaryItemId, "culinaryItemId", "Restaurant identity must reference a CulinaryItem");
    if (identity.kind === "official-authorized-recipe") {
      const permission = registry.assessments.find((assessment) => assessment.basis.kind === "permission" && assessment.basis.permissionReferenceId === identity.permissionReferenceId);
      const permissionAllowsAll = permission && rightsActions.every((action) => !["prohibited", "review-required"].includes(permission.permissions[action].status));
      const relevantArtifacts = registry.artifacts.filter((artifact) => artifact.subject.type === "culinary-item" && artifact.subject.id === identity.culinaryItemId && ["identity", "preparation"].includes(artifact.kind));
      const permissionLinked = permission && relevantArtifacts.length === 2 && relevantArtifacts.every((artifact) => registry.decisions.find((decision) => decision.id === artifact.usageDecisionId)?.assessmentIds.includes(permission.id));
      if (!permissionAllowsAll || !permissionLinked || !identity.commercialUse || !identity.translationAllowed || !identity.adaptationAllowed) {
        report("restaurant-identity-invalid", identity.culinaryItemId, "restaurant", "Official identity requires written commercial, translation, and adaptation permission");
      }
    } else if (identity.kind === "cooking-lab-reconstruction") {
      const sourceAssessments = identity.sourceIds.map((sourceId) => [...assessments.values()].find((assessment) => assessment.subject.type === "source" && assessment.subject.id === sourceId));
      const relevantArtifacts = registry.artifacts.filter((artifact) => artifact.subject.type === "culinary-item" && artifact.subject.id === identity.culinaryItemId && ["identity", "preparation"].includes(artifact.kind));
      const artifactsAligned = relevantArtifacts.length === 2 && relevantArtifacts.every((artifact) => identity.sourceIds.every((sourceId) => artifact.sourceIds.includes(sourceId)));
      if (new Set(identity.sourceIds).size < 2 || identity.sourceIds.some((sourceId) => !sourceIds.has(sourceId)) || sourceAssessments.some((assessment) => !assessment) || !artifactsAligned || !identity.independentlyWritten || identity.culinaryReview !== "passed" || !identity.nonEndorsementDisclosure) {
        report("restaurant-identity-invalid", identity.culinaryItemId, "restaurant", "Reconstruction requires two sources, independent writing, culinary review, and non-endorsement disclosure");
      }
    } else {
      const item = itemById.get(identity.culinaryItemId);
      const sourceAssessments = identity.sourceIds.map((sourceId) => [...assessments.values()].find((assessment) => assessment.subject.type === "source" && assessment.subject.id === sourceId));
      const identityArtifact = registry.artifacts.find((artifact) => artifact.subject.type === "culinary-item" && artifact.subject.id === identity.culinaryItemId && artifact.kind === "identity");
      const decision = identityArtifact ? registry.decisions.find((entry) => entry.id === identityArtifact.usageDecisionId) : undefined;
      const sourcesValid = identity.sourceIds.every((sourceId) => sourceIds.has(sourceId)) && sourceAssessments.every(Boolean);
      const artifactAligned = identityArtifact && sameStringSet(identityArtifact.sourceIds, identity.sourceIds);
      const decisionLinksSources = decision && sourceAssessments.every((assessment) => assessment && decision.assessmentIds.includes(assessment.id));
      if (!sourcesValid || !artifactAligned || !decisionLinksSources || identity.includesPreparation || item?.preparation.kind !== "no-consumer-preparation" || !identity.nonEndorsementDisclosure) {
        report("restaurant-identity-invalid", identity.culinaryItemId, "restaurant", "Dish-profile-only content cannot include inferred preparation");
      }
    }
  }
}

function validateProductProfiles(
  registry: ContentRightsRegistry,
  context: ContentRightsContext,
  assessments: ReadonlyMap<string, RightsAssessment>,
  artifacts: ReadonlyMap<string, ContentArtifact>,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  const itemIds = new Set(context.items.map((item) => item.id));
  const registeredSourceIds = new Set(context.sources.map((source) => source.id));
  const decisions = new Map(registry.decisions.map((decision) => [decision.id, decision]));
  for (const profile of registry.productProfiles) {
    const assessment = assessments.get(profile.rightsAssessmentId);
    const artifact = [...artifacts.values()].find((entry) => entry.subject.type === "product-profile" && entry.subject.id === profile.id && entry.kind === "product-profile");
    const sourceAssessments = profile.sourceIds.map((sourceId) => [...assessments.values()].find((entry) => entry.subject.type === "source" && entry.subject.id === sourceId));
    const sourceAssessmentsComplete = profile.sourceIds.every((sourceId) => registeredSourceIds.has(sourceId)) && sourceAssessments.every(Boolean);
    const artifactSourcesAligned = artifact && sameStringSet(artifact.sourceIds, profile.sourceIds);
    const decision = artifact ? decisions.get(artifact.usageDecisionId) : undefined;
    const decisionLinksSources = decision && sourceAssessments.every((entry) => entry && decision.assessmentIds.includes(entry.id));
    const assessmentAligned = artifact && assessment && artifact.rightsAssessmentId === assessment.id && assessment.subject.type === "artifact" && assessment.subject.id === artifact.id;
    const allowed = assessment && rightsActions.every((action) => !["prohibited", "review-required"].includes(assessment.permissions[action].status));
    if (!itemIds.has(profile.culinaryItemId) || !artifact || !sourceAssessmentsComplete || !artifactSourcesAligned || !decisionLinksSources || !assessmentAligned || !allowed || !isIsoDate(profile.verifiedAt) || !profile.brandName.trim() || !profile.producerName.trim() || !profile.vintageBatchOrModel.trim() || !profile.independentEditorialCopy || profile.usesUnlicensedBrandArtwork || profile.impliesEndorsement || profile.affiliateSales) {
      report("product-profile-invalid", profile.id, "profile", "Product profile violates provenance, artwork, endorsement, or affiliate boundaries");
    }
  }
}

function validateSources(
  sources: readonly Source[],
  evidenceRecords: readonly Evidence[],
  registry: ContentRightsRegistry,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  const evidenceById = new Map(evidenceRecords.map((evidence) => [evidence.id, evidence]));
  const usedSourceIds = new Set([
    ...registry.artifacts.flatMap((artifact) => artifact.sourceIds),
    ...registry.artifacts.flatMap((artifact) => artifact.evidenceIds.flatMap((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      return evidence ? [evidence.sourceId] : [];
    })),
    ...registry.aiInputs.flatMap((input) => input.sourceIds),
    ...registry.aiInputs.flatMap((input) => input.evidenceIds.flatMap((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      return evidence ? [evidence.sourceId] : [];
    })),
    ...registry.externalMedia.map((media) => media.sourceId),
    ...registry.restaurants.flatMap((identity) => "sourceIds" in identity ? identity.sourceIds : []),
    ...registry.productProfiles.flatMap((profile) => profile.sourceIds),
  ]);
  for (const source of sources.filter((entry) => usedSourceIds.has(entry.id))) {
    if (source.rights.status === "unknown") report("source-rights-unknown", source.id, "rights", "Unknown source rights block Production");
    if (source.health.status === "rights-changed") report("source-rights-changed", source.id, "health", "Changed source rights require reassessment");
  }
}

function validatePublishedCoverage(
  registry: ContentRightsRegistry,
  context: ContentRightsContext,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  const artifactKeys = new Set(registry.artifacts.map((artifact) => `${artifact.subject.type}:${artifact.subject.id}:${artifact.kind}`));
  const imageIds = new Set(context.images.map((image) => image.id));
  const imageById = new Map(context.images.map((image) => [image.id, image]));
  const nutritionIds = new Set(registry.nutrition.map((entry) => entry.kind === "dataset" ? `${entry.datasetId}:${entry.ingredientId}` : entry.provenanceId));
  const nutritionByIngredient = new Map(registry.nutrition.map((entry) => [entry.ingredientId, entry]));
  const costIds = new Set(registry.costs.map((entry) => entry.id));
  const assessmentById = new Map(registry.assessments.map((assessment) => [assessment.id, assessment]));
  const decisionById = new Map(registry.decisions.map((decision) => [decision.id, decision]));
  const attributionById = new Map(registry.attributions.map((attribution) => [attribution.id, attribution]));
  const datasetById = new Map(registry.datasets.map((dataset) => [dataset.id, dataset]));
  const storyIds = new Set(context.stories.map((story) => story.id));
  const evidenceIds = new Set(context.evidence.map((evidence) => evidence.id));
  const evidenceById = new Map(context.evidence.map((entry) => [entry.id, entry]));
  const sourceIds = new Set(context.sources.map((source) => source.id));
  const closedResearch = context.researchRecords.filter((record) => record.status === "closed");

  for (const item of context.items.filter((entry) => entry.publication.status === "published")) {
    for (const kind of requiredItemArtifactKinds) {
      if (!artifactKeys.has(`culinary-item:${item.id}:${kind}`)) report("missing-artifact", item.id, kind, `Published item is missing ${kind} artifact`);
    }
    if (item.images.availability === "available") {
      const imageId = item.images.references.primaryImageId;
      if (!imageIds.has(imageId)) report("missing-reference", item.id, "image", `Missing image ${imageId}`);
      if (!artifactKeys.has(`image:${imageId}:image`)) report("missing-artifact", item.id, "image", `Image ${imageId} has no rights artifact`);
      const image = imageById.get(imageId);
      const artifact = registry.artifacts.find((entry) => entry.subject.type === "image" && entry.subject.id === imageId && entry.kind === "image");
      if (image && artifact) {
        const assessment = assessmentById.get(artifact.rightsAssessmentId);
        const decision = decisionById.get(artifact.usageDecisionId);
        const needsAttribution = ["cc-by", "cc-by-sa", "unsplash-license", "pexels-license", "pixabay-content-license", "other-permitted"].includes(image.license);
        const needsProvenanceDisclosure = image.source !== "self-created" && Boolean(image.sourceUrl);
        const requirementIds = new Set([...(artifact.attributionRequirementIds ?? []), ...(assessment?.attributionRequirementIds ?? [])]);
        const validRequirement = [...requirementIds].some((id) => {
          const attribution = attributionById.get(id);
          return attribution?.disclosureKind === "license-required" && attribution.artifactId === artifact.id && attribution.creator === image.author && attribution.notice === image.attribution && attribution.sourceUrl === image.sourceUrl && attribution.licenseId === image.license && attribution.licenseUrl === image.licenseUrl;
        });
        const validProvenanceDisclosure = registry.attributions.some((attribution) =>
          attribution.artifactId === artifact.id
          && attribution.creator === image.author
          && attribution.notice === image.attribution
          && attribution.sourceUrl === image.sourceUrl
          && attribution.licenseId === image.license
          && attribution.licenseUrl === image.licenseUrl
          && (needsAttribution ? attribution.disclosureKind === "license-required" : attribution.disclosureKind === "provenance-only"));
        if (needsAttribution && (!assessment || assessment.basis.kind !== "open-license" || assessment.basis.licenseId !== image.license || !validRequirement || decision?.decision !== "allow-with-obligations")) {
          report("obligation-missing", imageId, "attribution", "Image license metadata must produce aligned assessment, attribution, and allowed-with-obligations decision records");
        }
        if (needsProvenanceDisclosure && !validProvenanceDisclosure) {
          report("missing-reference", imageId, "imageProvenance", "Externally sourced images require an aligned consumer provenance disclosure even when the license does not require attribution");
        }
      }
    }
    for (const storyId of item.storyIds) {
      if (!storyIds.has(storyId)) report("missing-reference", item.id, "storyIds", `Missing Story ${storyId}`);
      if (!artifactKeys.has(`story:${storyId}:story`)) report("missing-artifact", item.id, "story", `Story ${storyId} has no rights artifact`);
    }
    if ("inputs" in item.preparation) {
      for (const input of item.preparation.inputs) {
        const ingredient = context.ingredients.find((entry) => entry.id === input.ingredientId);
        const nutrition = nutritionByIngredient.get(input.ingredientId);
        const nutritionMatches = ingredient && nutrition && (nutrition.kind === "editorial-estimate"
          ? nutrition.provenanceId === ingredient.nutritionProvenanceId
          : `${nutrition.datasetId}:${nutrition.ingredientId}` === ingredient.nutritionProvenanceId);
        const dataset = nutrition?.kind === "dataset" ? datasetById.get(nutrition.datasetId) : undefined;
        const datasetAssessment = dataset ? assessmentById.get(dataset.rightsAssessmentId) : undefined;
        const datasetAllowed = nutrition?.kind !== "dataset" || Boolean(
          dataset && datasetAssessment &&
          datasetAssessment.subject.type === "dataset" && datasetAssessment.subject.id === dataset.id &&
          rightsActions.every((action) => !["prohibited", "review-required"].includes(datasetAssessment.permissions[action].status)) &&
          nutrition.upstreamRecordId.trim() && nutrition.conversionMethod.trim() && isIsoDate(nutrition.accessedAt) && nutrition.reviewer.trim()
        );
        const editorialComplete = nutrition?.kind !== "editorial-estimate" || Boolean(nutrition.method.trim() && nutrition.limitations.trim() && isIsoDate(nutrition.reviewedAt) && nutrition.reviewer.trim());
        if (!nutritionMatches || !nutritionIds.has(ingredient?.nutritionProvenanceId ?? "") || !datasetAllowed || !editorialComplete) report("nutrition-provenance-missing", item.id, `ingredient.${input.ingredientId}`, "Ingredient nutrition provenance is missing, incomplete, belongs to another ingredient, or lacks an allowed DatasetSource");
        const cost = ingredient ? registry.costs.find((entry) => entry.id === ingredient.costProvenanceId) : undefined;
        const costAssessment = cost ? assessmentById.get(cost.rightsAssessmentId) : undefined;
        const costAllowed = costAssessment && costAssessment.subject.type === "dataset" && costAssessment.subject.id === cost?.id && rightsActions.every((action) => !["prohibited", "review-required"].includes(costAssessment.permissions[action].status));
        if (!ingredient || !cost || !costIds.has(ingredient.costProvenanceId) || !costAllowed) report("cost-provenance-missing", item.id, `ingredient.${input.ingredientId}`, "Ingredient cost provenance or its allowed assessment is missing");
      }
    }
    const hasFactualSynthesis = registry.artifacts.some((artifact) => artifact.subject.type === "culinary-item" && artifact.subject.id === item.id && artifact.derivation === "factual-synthesis");
    if (hasFactualSynthesis) {
      const records = closedResearch.filter((record) => record.subject.type === "culinary-item" && record.subject.id === item.id);
      const acceptedSourceIds = new Set(records.flatMap((record) => record.sourceDecisions.flatMap((decision) => decision.disposition === "accepted" ? [decision.sourceId] : [])));
      const synthesisArtifacts = registry.artifacts.filter((artifact) => artifact.subject.type === "culinary-item" && artifact.subject.id === item.id && artifact.derivation === "factual-synthesis");
      const sourcesAligned = acceptedSourceIds.size >= 2 && synthesisArtifacts.every((artifact) => artifact.sourceIds.length === acceptedSourceIds.size && artifact.sourceIds.every((sourceId) => acceptedSourceIds.has(sourceId)));
      if (!sourcesAligned) report("review-incomplete", item.id, "researchRecord", "Factual synthesis requires two accepted Sources from a closed subject ResearchRecord, aligned to every synthesis artifact");
    }
  }

  for (const artifact of registry.artifacts) {
    for (const evidenceId of artifact.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidenceIds.has(evidenceId) || !evidence) {
        report("missing-reference", artifact.id, "evidenceIds", `Missing Evidence ${evidenceId}`);
      } else if (!artifact.sourceIds.includes(evidence.sourceId)) {
        report("missing-reference", artifact.id, "sourceIds", `Evidence ${evidenceId} requires Source ${evidence.sourceId} in the artifact provenance and UsageDecision chain`);
      }
    }
    for (const sourceId of artifact.sourceIds) if (!sourceIds.has(sourceId)) report("missing-reference", artifact.id, "sourceIds", `Missing Source ${sourceId}`);
  }

  const storyArtifacts = new Map(registry.artifacts.filter((artifact) => artifact.subject.type === "story").map((artifact) => [artifact.subject.id, artifact]));
  for (const story of context.stories.filter((entry) => entry.publication.status === "published")) {
    const artifact = storyArtifacts.get(story.id);
    if (!artifact) {
      report("missing-artifact", story.id, "story", "Every published Story requires its own rights artifact");
      continue;
    }
    for (const claim of story.claims) {
      for (const evidenceId of claim.evidenceIds) {
        const evidence = evidenceById.get(evidenceId);
        if (!artifact.evidenceIds.includes(evidenceId) || (evidence && !artifact.sourceIds.includes(evidence.sourceId))) {
          report("missing-reference", story.id, `claim.${claim.id}`, "Each Story claim must remain connected to its Evidence and Source in the rights artifact");
        }
      }
    }
  }
}

function uniqueMap<T extends { id: string }>(
  values: readonly T[],
  label: string,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
): Map<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    if (result.has(value.id)) report("duplicate-id", value.id, "id", `Duplicate ${label} ID`);
    result.set(value.id, value);
  }
  return result;
}

function reportDuplicateKey<T>(
  values: readonly T[],
  keyOf: (value: T) => string,
  label: string,
  report: (code: ContentRightsIssueCode, subjectId: string, field: string, message: string) => void,
) {
  const seen = new Set<string>();
  for (const value of values) {
    const key = keyOf(value);
    if (seen.has(key)) report("duplicate-id", key, "id", `Duplicate ${label}`);
    seen.add(key);
  }
}

function isHttps(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isAssessmentBasisComplete(assessment: RightsAssessment): boolean {
  const basis = assessment.basis;
  if (basis.kind === "first-party") return Boolean(basis.owner.trim());
  if (basis.kind === "public-domain") return Boolean(basis.basis.trim());
  if (basis.kind === "open-license") return Boolean(basis.licenseId.trim()) && isHttps(basis.licenseUrl);
  if (basis.kind === "permission") return Boolean(basis.permissionReferenceId.trim());
  if (basis.kind === "terms") return Boolean(basis.provider.trim()) && isHttps(basis.termsUrl) && Boolean(basis.effectiveDate && isIsoDate(basis.effectiveDate));
  return Boolean(basis.boundary.trim());
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && new Set(left).size === new Set(right).size && left.every((value) => right.includes(value));
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isContentHash(value: string): boolean {
  return /^clv1-[a-f0-9]{16}$/.test(value);
}

export function permissionStatuses(assessment: RightsAssessment): Record<RightsAction, string> {
  return Object.fromEntries(rightsActions.map((action) => [action, assessment.permissions[action].status])) as Record<RightsAction, string>;
}
