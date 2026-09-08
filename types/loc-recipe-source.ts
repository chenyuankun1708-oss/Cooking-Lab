export const locSourceRegistrySchemaVersion = "cooking-lab-loc-source-registry-v1" as const;
export const locCandidateBatchSchemaVersion = "cooking-lab-loc-candidate-batch-v1" as const;
export const locPublicDomainStatement = "The books in this collection are in the public domain and are free to use and reuse." as const;

export interface LocSourceDocumentV1 {
  documentId: string;
  itemId: string;
  itemUrl: string;
  title: string;
  creators: string[];
  publicationYear: number;
  workFamilyId: string;
  rightsStatement: typeof locPublicDomainStatement;
  rightsStatementUrl: string;
  ocr: {
    derivativeUrl: string;
    fileName: string;
    sha256: string;
    format: "loc-page-text-json";
  };
}

export interface LocSourceRegistryV1 {
  schemaVersion: typeof locSourceRegistrySchemaVersion;
  provider: "Library of Congress";
  collectionUrl: string;
  rightsStatement: typeof locPublicDomainStatement;
  rightsStatementUrl: string;
  accessedAt: string;
  documents: LocSourceDocumentV1[];
}

export type LocCandidateBlocker =
  | "candidate-only-not-canonical"
  | "ingredient-normalization-required"
  | "operation-graph-required"
  | "nutrition-provenance-required"
  | "rights-decision-required"
  | "independent-review-required";

export type LocHighRiskReason =
  | "alcohol"
  | "brand-or-restaurant"
  | "dangerous-process"
  | "fermentation-or-preservation"
  | "medical-or-health-claim"
  | "raw-animal-product"
  | "wild-game";

export interface LocSourceLocatorV1 {
  documentId: string;
  sourceTitle: string;
  itemUrl: string;
  workFamilyId: string;
  ocrDerivativeUrl: string;
  ocrSha256: string;
  pageId: string;
  segmentId: string;
  startLine: number;
  endLine: number;
}

export interface LocCrossCheckV1 extends LocSourceLocatorV1 {
  matchBasis: "exact-title" | "related-title-and-facts";
  titleTokenJaccard: number;
  sharedIngredientTerms: string[];
  sharedOperationTerms: string[];
}

export interface LocIngredientFactV1 {
  quantity: number;
  unit: string;
  ingredient: string;
  pageId: string;
  line: number;
}

export interface LocDurationFactV1 {
  minutes: number;
  pageId: string;
  line: number;
}

export interface LocRecipeCandidateV1 {
  candidateId: string;
  title: string;
  normalizedTitle: string;
  status: "draft-research-only";
  exportEligible: false;
  primarySource: LocSourceLocatorV1;
  crossChecks: LocCrossCheckV1[];
  extractedFacts: {
    ingredients: LocIngredientFactV1[];
    operationTerms: string[];
    durations: LocDurationFactV1[];
  };
  blockers: LocCandidateBlocker[];
}

export interface LocRejectedBlockV1 {
  title: string;
  normalizedTitle: string;
  source: LocSourceLocatorV1;
  reasonCodes: LocHighRiskReason[];
}

export interface LocCandidateBatchV1 {
  schemaVersion: typeof locCandidateBatchSchemaVersion;
  generatorVersion: string;
  sourceRegistrySchemaVersion: typeof locSourceRegistrySchemaVersion;
  sourceDocumentCount: number;
  candidateCount: number;
  candidates: LocRecipeCandidateV1[];
  rejectedHighRisk: LocRejectedBlockV1[];
}
