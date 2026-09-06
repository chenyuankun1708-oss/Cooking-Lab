export const reviewDimensions = [
  "rights-license",
  "provenance",
  "factual-culinary",
  "editorial",
  "visual-image",
  "human-approval",
] as const;
export type ReviewDimension = (typeof reviewDimensions)[number];

export type ReviewActorType = "agent" | "human" | "domain-expert" | "lawyer";
export type PublishingRiskLevel = "low" | "medium" | "high";

export interface ReviewActorIdentity {
  actorType: ReviewActorType;
  actorId: string;
  runId: string;
  contextId: string;
}

export interface ReviewFinding {
  code: string;
  kind: "quality" | "reviewer-disagreement";
  severity: "minor" | "major";
  summary: string;
  disposition: "resolved" | "unresolved";
}

export interface ReviewAttestation {
  id: string;
  batchId: string;
  dimension: ReviewDimension;
  itemIds: [string, ...string[]];
  artifactSetVersion: string;
  author: ReviewActorIdentity;
  reviewer: ReviewActorIdentity;
  reviewedCommit: string;
  evidenceReference: string;
  rubricVersion: string;
  policyVersion: string;
  reviewedAt: string;
  verdict: "pass" | "revise" | "block";
  findings: ReviewFinding[];
  reviewerModifiedContent: false;
  representations: {
    humanApproval: boolean;
    culinaryFieldTest: boolean;
    legalOpinion: boolean;
  };
}

export const publishingRiskReasonCodes = [
  "clear-first-party-or-reference-only-rights",
  "multi-source-factual-synthesis",
  "standard-open-image-license",
  "approved-nutrition-or-cost-method",
  "ai-assisted-expression",
  "single-source-deep-adaptation",
  "resolved-source-conflict",
  "restaurant-reconstruction",
  "product-profile",
  "ai-generated-image",
  "weak-image-fidelity",
  "culinary-authenticity-judgment",
  "official-authorization-or-brand-relationship",
  "health-or-medical-claim",
  "food-safety-critical-process",
  "unresolved-material-factual-conflict",
  "complex-trademark-publicity-or-privacy",
  "unresolved-reviewer-disagreement",
  "professional-legal-checkpoint",
] as const;
export type PublishingRiskReasonCode = (typeof publishingRiskReasonCodes)[number];

export interface PublishingRiskClassification {
  id: string;
  itemId: string;
  artifactSetVersion: string;
  level: PublishingRiskLevel;
  reasonCodes: [PublishingRiskReasonCode, ...PublishingRiskReasonCode[]];
  equivalenceClassKeys: [string, ...string[]];
  policyVersion: string;
  classifiedAt: string;
}

export interface SamplingEquivalenceClass {
  key: string;
  itemIds: [string, ...string[]];
  sampledItemIds: [string, ...string[]];
}

export interface SamplingQaFinding extends ReviewFinding {
  equivalenceClassKeys: [string, ...string[]];
}

export interface SamplingQaSample {
  itemId: string;
  equivalenceClassKeys: [string, ...string[]];
  dimensions: [Exclude<ReviewDimension, "human-approval">, ...Exclude<ReviewDimension, "human-approval">[]];
  verdict: "pass" | "revise" | "block";
  findings: ReviewFinding[];
}

export interface SamplingQaBatch {
  id: string;
  batchId: string;
  sequence: number;
  previousBatchId?: string;
  policyVersion: string;
  itemIds: [string, ...string[]];
  artifactSetVersion: string;
  equivalenceClasses: [SamplingEquivalenceClass, ...SamplingEquivalenceClass[]];
  author: ReviewActorIdentity;
  auditor: ReviewActorIdentity;
  reviewedCommit: string;
  evidenceReference: string;
  rubricVersion: string;
  verdict: "pass" | "revise" | "block";
  samples: SamplingQaSample[];
  findings: SamplingQaFinding[];
  auditorModifiedContent: false;
  metrics: {
    escapeCount: number;
    reviewerDisagreementCount: number;
    reworkItemCount: number;
    provenanceLicenseNoveltyCount: number;
  };
  auditedAt: string;
}

export interface PublishingGovernanceRegistry {
  policyVersion: string;
  attestations: readonly ReviewAttestation[];
  riskClassifications: readonly PublishingRiskClassification[];
  samplingBatches: readonly SamplingQaBatch[];
}
