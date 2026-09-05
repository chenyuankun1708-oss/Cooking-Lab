import { claimKinds, sourceTypes, type Evidence, type Source } from "@/types/culinary";
import {
  researchTemplateIds,
  sourceRejectionReasons,
  type ResearchRecord,
  type SourceCatalogEntry,
} from "@/types/research";
import { isSlug } from "./validation-utils";
import { isIsoDate, validateEvidence, validateSource, validateSourceLocator } from "./culinary-validation";

export interface ResearchValidationIssue {
  entityId: string;
  field: string;
  message: string;
}

export interface ResearchRegistry {
  sources: readonly Source[];
  evidence: readonly Evidence[];
  records: readonly ResearchRecord[];
}

const sourceReliabilityValues = new Set(["primary", "authoritative-secondary", "general-secondary", "contested"]);
const catalogReuseValues = new Set(["allowed", "prohibited", "item-specific-review"]);
const catalogObligationValues = new Set(["required", "not-required", "item-specific-review"]);
const researchStatuses = new Set(["in-progress", "ready-for-editorial-review", "publication-candidate", "closed"]);
const claimDispositions = new Set(["include", "exclude", "defer"]);

export function validateSourceCatalog(entries: readonly SourceCatalogEntry[]): ResearchValidationIssue[] {
  const issues: ResearchValidationIssue[] = [];
  const ids = new Set<string>();

  for (const entry of entries) {
    const entityId = entry.id || "<unknown>";
    const report = (field: string, message: string) => issues.push({ entityId, field, message });
    if (!isSlug(entry.id)) report("id", "Catalog entry ID 必须使用 kebab-case");
    if (ids.has(entry.id)) report("id", "Catalog entry ID 重复");
    ids.add(entry.id);
    if (!entry.name.trim()) report("name", "Catalog source name 不能为空");
    if (!sourceTypes.includes(entry.sourceType)) report("sourceType", "未知 catalog source type");
    if (!entry.coverage.trim()) report("coverage", "Catalog coverage 不能为空");
    validateSourceLocator(entry.locator, "locator", report);
    if (!sourceReliabilityValues.has(entry.reliability)) report("reliability", "未知 catalog reliability assessment");
    if (!entry.rightsSummary.trim()) report("rightsSummary", "Catalog rights summary 不能为空");
    validateNonEmptyStrings(entry.suitableUses, "suitableUses", report, true);
    validateNonEmptyStrings(entry.unsuitableUses, "unsuitableUses", report, true);
    validateNonEmptyStrings(entry.knownRisks, "knownRisks", report, true);
    if (!catalogReuseValues.has(entry.directReuse)) report("directReuse", "未知 direct reuse decision");
    if (!catalogReuseValues.has(entry.adaptation)) report("adaptation", "未知 adaptation decision");
    if (!catalogObligationValues.has(entry.attribution)) report("attribution", "未知 attribution obligation");
    if (!catalogObligationValues.has(entry.shareAlike)) report("shareAlike", "未知 share-alike obligation");
    if (!isIsoDate(entry.evaluatedAt)) report("evaluatedAt", "Catalog evaluatedAt 必须是有效 YYYY-MM-DD");
  }

  return issues;
}

export function validateResearchRegistry(registry: ResearchRegistry): ResearchValidationIssue[] {
  const issues: ResearchValidationIssue[] = [];
  const sourceIds = new Set(registry.sources.map(({ id }) => id));
  const evidenceById = new Map(registry.evidence.map((record) => [record.id, record]));

  reportDuplicateEntityIds(registry.sources, "Source", issues);
  reportDuplicateEntityIds(registry.evidence, "Evidence", issues);
  reportDuplicateEntityIds(registry.records, "ResearchRecord", issues);
  registry.sources.forEach((source) => issues.push(...validateSource(source)));
  registry.evidence.forEach((record) => issues.push(...validateEvidence(record, sourceIds)));

  for (const record of registry.records) {
    issues.push(...validateResearchRecord(record, sourceIds, evidenceById));
  }

  return issues;
}

export function collectResearchRecordReferences(
  record: ResearchRecord,
  registry: Pick<ResearchRegistry, "sources" | "evidence">,
): { sources: Source[]; evidence: Evidence[] } {
  const acceptedSourceIds = new Set(
    record.sourceDecisions.flatMap((decision) => decision.disposition === "accepted" ? [decision.sourceId] : []),
  );
  const evidenceIds = new Set(record.claims.flatMap((claim) => claim.evidenceIds));

  return {
    sources: registry.sources.filter((source) => acceptedSourceIds.has(source.id)),
    evidence: registry.evidence.filter((record) => evidenceIds.has(record.id)),
  };
}

function validateResearchRecord(
  record: ResearchRecord,
  sourceIds: ReadonlySet<string>,
  evidenceById: ReadonlyMap<string, Evidence>,
): ResearchValidationIssue[] {
  const issues: ResearchValidationIssue[] = [];
  const entityId = record.id || "<unknown>";
  const report = (field: string, message: string) => issues.push({ entityId, field, message });

  if (!isSlug(record.id)) report("id", "ResearchRecord ID 必须使用 kebab-case");
  if (!researchTemplateIds.includes(record.templateId)) report("templateId", "未知 research template");
  if (!record.question.trim()) report("question", "Research question 不能为空");
  if (!record.sourceDecisions.length) report("sourceDecisions", "ResearchRecord 必须记录 candidate source decisions");
  if (!record.claims.length) report("claims", "ResearchRecord 必须记录 considered claims");
  if (!record.editorialDecision.trim()) report("editorialDecision", "Editorial decision 不能为空");
  if (!record.reviewer.trim()) report("reviewer", "Reviewer 不能为空");
  if (!isIsoDate(record.reviewedAt)) report("reviewedAt", "reviewedAt 必须是有效 YYYY-MM-DD");
  if (!researchStatuses.has(record.status)) report("status", "未知 ResearchRecord status");
  validateNonEmptyStrings(record.unresolvedQuestions, "unresolvedQuestions", report, false);

  const decisionIds = new Set<string>();
  const acceptedSourceIds = new Set<string>();
  record.sourceDecisions.forEach((decision, index) => {
    if (!isSlug(decision.id)) report(`sourceDecisions.${index}.id`, "Source decision ID 必须使用 kebab-case");
    if (decisionIds.has(decision.id)) report(`sourceDecisions.${index}.id`, "Source decision ID 重复");
    decisionIds.add(decision.id);
    if (!decision.rationale.trim()) report(`sourceDecisions.${index}.rationale`, "Source decision rationale 不能为空");

    if (decision.disposition === "accepted") {
      if (!sourceIds.has(decision.sourceId)) report(`sourceDecisions.${index}.sourceId`, "Accepted decision 引用了不存在的 Source");
      if (acceptedSourceIds.has(decision.sourceId)) report(`sourceDecisions.${index}.sourceId`, "Accepted Source reference 重复");
      acceptedSourceIds.add(decision.sourceId);
    } else if (decision.disposition === "rejected") {
      if (!decision.candidateName.trim()) report(`sourceDecisions.${index}.candidateName`, "Rejected candidate name 不能为空");
      if (!sourceRejectionReasons.includes(decision.reason)) report(`sourceDecisions.${index}.reason`, "未知 source rejection reason");
      if (decision.locator) validateSourceLocator(decision.locator, `sourceDecisions.${index}.locator`, report);
    } else {
      report(`sourceDecisions.${index}.disposition`, "未知 source decision disposition");
    }
  });
  if (!acceptedSourceIds.size) report("sourceDecisions", "ResearchRecord 必须至少接受一个 Source");

  const claimIds = new Set<string>();
  record.claims.forEach((claim, index) => {
    if (!isSlug(claim.id)) report(`claims.${index}.id`, "Research claim ID 必须使用 kebab-case");
    if (claimIds.has(claim.id)) report(`claims.${index}.id`, "Research claim ID 重复");
    claimIds.add(claim.id);
    if (!claim.statement.trim()) report(`claims.${index}.statement`, "Research claim statement 不能为空");
    if (!claimKinds.includes(claim.kind)) report(`claims.${index}.kind`, "未知 claim kind");
    if (!claimDispositions.has(claim.disposition)) report(`claims.${index}.disposition`, "未知 research claim disposition");
    if (!claim.rationale.trim()) report(`claims.${index}.rationale`, "Research claim rationale 不能为空");
    if (new Set(claim.evidenceIds).size !== claim.evidenceIds.length) report(`claims.${index}.evidenceIds`, "Evidence reference 不能重复");
    if (claim.disposition === "include" && !claim.evidenceIds.length) {
      report(`claims.${index}.evidenceIds`, "Included claim 必须引用 Evidence");
    }
    claim.evidenceIds.forEach((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        report(`claims.${index}.evidenceIds`, `不存在的 Evidence ID: ${evidenceId}`);
      } else if (!acceptedSourceIds.has(evidence.sourceId)) {
        report(`claims.${index}.evidenceIds`, `Evidence ${evidenceId} 的 Source 未被本次研究接受`);
      }
    });
  });

  return issues;
}

function validateNonEmptyStrings(
  values: readonly string[],
  field: string,
  report: (field: string, message: string) => void,
  requireOne: boolean,
) {
  if (requireOne && !values.length) report(field, `${field} 必须至少有一项`);
  if (values.some((value) => !value.trim())) report(field, `${field} 不能包含空字符串`);
}

function reportDuplicateEntityIds(
  entities: readonly { id: string }[],
  label: string,
  issues: ResearchValidationIssue[],
) {
  const ids = new Set<string>();
  for (const entity of entities) {
    if (ids.has(entity.id)) issues.push({ entityId: entity.id || "<unknown>", field: "id", message: `${label} ID 重复` });
    ids.add(entity.id);
  }
}
