import type { ClaimKind, SourceLocator, SourceType } from "./culinary";

export const researchTemplateIds = [
  "dish-dessert",
  "tea",
  "coffee",
  "drink",
  "story-culture",
  "historical-person-attribution",
  "award-recognition",
  "image",
] as const;
export type ResearchTemplateId = (typeof researchTemplateIds)[number];

export const sourceRejectionReasons = [
  "unclear-authorship",
  "weak-provenance",
  "rights-unclear",
  "source-inaccessible",
  "duplicate",
  "unreliable-claim",
  "unsuitable-creative-prose",
  "image-mismatch",
  "outdated-superseded",
] as const;
export type SourceRejectionReason = (typeof sourceRejectionReasons)[number];

export type CatalogReuseDecision = "allowed" | "prohibited" | "item-specific-review";
export type CatalogObligation = "required" | "not-required" | "item-specific-review";

export interface SourceCatalogEntry {
  id: string;
  name: string;
  sourceType: SourceType;
  coverage: string;
  locator: SourceLocator;
  reliability: "primary" | "authoritative-secondary" | "general-secondary" | "contested";
  rightsSummary: string;
  suitableUses: string[];
  unsuitableUses: string[];
  directReuse: CatalogReuseDecision;
  adaptation: CatalogReuseDecision;
  attribution: CatalogObligation;
  shareAlike: CatalogObligation;
  factualReferenceOnly: boolean;
  knownRisks: string[];
  evaluatedAt: string;
}

export type ResearchSourceDecision =
  | {
      id: string;
      disposition: "accepted";
      sourceId: string;
      rationale: string;
    }
  | {
      id: string;
      disposition: "rejected";
      candidateName: string;
      locator?: SourceLocator;
      reason: SourceRejectionReason;
      rationale: string;
    };

export interface ResearchClaimAssessment {
  id: string;
  statement: string;
  kind: ClaimKind;
  disposition: "include" | "exclude" | "defer";
  evidenceIds: string[];
  rationale: string;
}

export interface ResearchRecord {
  id: string;
  templateId: ResearchTemplateId;
  question: string;
  sourceDecisions: ResearchSourceDecision[];
  claims: ResearchClaimAssessment[];
  unresolvedQuestions: string[];
  editorialDecision: string;
  reviewer: string;
  reviewedAt: string;
  status: "in-progress" | "ready-for-editorial-review" | "publication-candidate" | "closed";
}
