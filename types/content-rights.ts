export const contentArtifactKinds = [
  "identity",
  "preparation",
  "story",
  "nutrition",
  "cost",
  "image",
  "product-profile",
] as const;
export type ContentArtifactKind = (typeof contentArtifactKinds)[number];

export const contentDerivations = [
  "original",
  "factual-synthesis",
  "adaptation",
  "licensed-copy",
  "generated",
] as const;
export type ContentDerivation = (typeof contentDerivations)[number];

export const rightsActions = ["store", "transform", "publish", "commercialize"] as const;
export type RightsAction = (typeof rightsActions)[number];
export type RightsPermissionStatus = "allowed" | "allowed-with-obligations" | "review-required" | "prohibited";

export interface RightsPermission {
  status: RightsPermissionStatus;
  scope: string;
}

export type RightsAssessmentBasis =
  | { kind: "first-party"; owner: string }
  | { kind: "public-domain"; basis: string }
  | { kind: "open-license"; licenseId: string; licenseUrl: string }
  | { kind: "permission"; permissionReferenceId: string }
  | { kind: "terms"; provider: string; termsUrl: string; effectiveDate?: string }
  | { kind: "reference-only"; boundary: string };

export type RightsRiskDimension = "copyright" | "database" | "contract" | "trademark" | "publicity-privacy";
export interface RightsRiskReview {
  status: "cleared" | "not-applicable" | "review-required";
  notes: string;
}

export interface RightsAssessment {
  id: string;
  subject: { type: "artifact" | "source" | "dataset" | "external-media"; id: string };
  jurisdictionBaseline: readonly ["CN", "US", "EU", "UK"];
  basis: RightsAssessmentBasis;
  authorityVersion: string;
  accessedAt: string;
  applicableTerritories: readonly ["CN", "US", "EU", "UK"];
  permissions: Record<RightsAction, RightsPermission>;
  attributionRequirementIds: string[];
  risks: Record<RightsRiskDimension, RightsRiskReview>;
  uncertainty: string;
  assessedAt: string;
  reviewer: string;
  reviewDueAt?: string;
}

export interface AttributionRequirement {
  id: string;
  artifactId: string;
  disclosureKind: "license-required" | "provenance-only";
  creator: string;
  workTitle: string;
  sourceUrl: string;
  licenseId: string;
  licenseUrl?: string;
  notice: string;
  modificationNotice?: string;
  placement: "item" | "asset" | "global";
  shareAlikeRequired: boolean;
  isolationBoundary?: "asset-file" | "isolated-dataset";
}

export type ContentSubject =
  | { type: "culinary-item"; id: string }
  | { type: "story"; id: string }
  | { type: "image"; id: string }
  | { type: "ingredient-data"; id: string }
  | { type: "product-profile"; id: string };

export interface ContentArtifact {
  id: string;
  version: string;
  subject: ContentSubject;
  kind: ContentArtifactKind;
  derivation: ContentDerivation;
  sourceIds: string[];
  evidenceIds: string[];
  rightsAssessmentId: string;
  usageDecisionId: string;
  attributionRequirementIds: string[];
}

export interface UsageDecision {
  id: string;
  artifactId: string;
  assessmentIds: [string, ...string[]];
  intendedUse: "production-commercial-ready";
  decision: "allow" | "allow-with-obligations" | "block";
  conditions: string[];
  decidedAt: string;
  reviewer: string;
}

export interface DatasetSource {
  id: string;
  provider: string;
  title: string;
  version: string;
  releaseDate?: string;
  sourceUrl: string;
  licenseId: string;
  rightsAssessmentId: string;
  access: {
    method: "versioned-download" | "manual-editorial";
    buildTimeNetworkAccess: false;
    apiKeyRequired: boolean;
  };
  reuse: {
    scope: "record-level" | "substantial-dataset";
    extraction: "manual" | "versioned-download" | "systematic-scrape";
    redistribution: "none" | "attribution" | "share-alike";
  };
}

export type NutritionProvenance =
  | {
      ingredientId: string;
      kind: "dataset";
      datasetId: string;
      upstreamRecordId: string;
      basis: "per-100g";
      conversionMethod: string;
      accessedAt: string;
      reviewer: string;
    }
  | {
      ingredientId: string;
      kind: "editorial-estimate";
      provenanceId: string;
      basis: "per-100g";
      method: string;
      limitations: string;
      reviewedAt: string;
      reviewer: string;
    };

export interface CostProvenance {
  id: string;
  method: "first-party-estimate" | "licensed-dataset";
  geography: string;
  currency: string;
  effectiveDate: string;
  methodology: string;
  rightsAssessmentId: string;
}

export interface AiGenerationRecord {
  id: string;
  artifactId: string;
  provider: string;
  model: string;
  modelVersion: string;
  generatedAt: string;
  termsUrl: string;
  termsEffectiveDate: string;
  promptTemplateVersion: string;
  inputArtifactIds: string[];
  inputRightsReviewed: boolean;
  reviewAttestationIds: [string, ...string[]];
  similarityReview: "passed" | "required";
  trademarkReview: "passed" | "not-applicable" | "required";
}

export interface ExternalMediaReference {
  id: string;
  sourceId: string;
  platform: "youtube" | "bilibili" | "other";
  url: string;
  use: "reference-only" | "official-embed";
  timestamp?: string;
  downloaded: false;
  transcriptStored: false;
  screenshotStored: false;
  automatedCollection: false;
  privacyReview: "not-required" | "passed" | "required";
  rightsAssessmentId: string;
}

export type RestaurantContentIdentity =
  | {
      culinaryItemId: string;
      kind: "official-authorized-recipe";
      restaurantName: string;
      permissionReferenceId: string;
      commercialUse: true;
      translationAllowed: true;
      adaptationAllowed: true;
      endorsementLanguageApproved: boolean;
    }
  | {
      culinaryItemId: string;
      kind: "cooking-lab-reconstruction";
      restaurantName: string;
      sourceIds: [string, string, ...string[]];
      independentlyWritten: true;
      culinaryReview: "passed";
      nonEndorsementDisclosure: true;
    }
  | {
      culinaryItemId: string;
      kind: "dish-profile-only";
      restaurantName: string;
      sourceIds: [string, ...string[]];
      includesPreparation: false;
      nonEndorsementDisclosure: true;
    };

export interface ProductProfile {
  id: string;
  culinaryItemId: string;
  brandName: string;
  producerName: string;
  region?: string;
  vintageBatchOrModel: string;
  verifiedAt: string;
  sourceIds: [string, ...string[]];
  independentEditorialCopy: true;
  usesUnlicensedBrandArtwork: false;
  impliesEndorsement: false;
  affiliateSales: false;
  rightsAssessmentId: string;
}

export interface ContentRightsRegistry {
  artifacts: readonly ContentArtifact[];
  assessments: readonly RightsAssessment[];
  attributions: readonly AttributionRequirement[];
  decisions: readonly UsageDecision[];
  datasets: readonly DatasetSource[];
  nutrition: readonly NutritionProvenance[];
  costs: readonly CostProvenance[];
  ai: readonly AiGenerationRecord[];
  externalMedia: readonly ExternalMediaReference[];
  restaurants: readonly RestaurantContentIdentity[];
  productProfiles: readonly ProductProfile[];
}
