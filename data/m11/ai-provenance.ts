import type {
  AiGenerationRecord,
  AiInputArtifact,
  RightsAssessment,
} from "@/types/content-rights";
import { batchADishStories } from "./batch-a-dishes";
import {
  batchANonDishProductProfiles,
  batchANonDishStories,
} from "./batch-a-nondishes";
import { m11BatchAItemIds } from "./portfolio";

/**
 * Batch A text was produced with agent assistance before immutable per-artifact
 * author runs, prompt templates, input bundles, and the complete service terms
 * chain were recorded. Marking the outputs as generated makes that missing
 * provenance fail closed instead of relabelling the text as factual synthesis.
 */
export const m11BatchAGeneratedArtifactIds = Object.freeze([
  ...m11BatchAItemIds.flatMap((itemId) => [
    `${itemId}-identity`,
    `${itemId}-preparation`,
  ]),
  ...[...batchADishStories, ...batchANonDishStories].map((story) => `${story.id}-story`),
  ...batchANonDishProductProfiles.map((profile) => `${profile.id}-product-profile`),
]);

/**
 * These arrays intentionally remain empty. Reconstructing author/run/context,
 * prompts, or AI inputs after the fact would create false provenance. Batch A
 * therefore remains blocked until its text is regenerated through a fully
 * recorded pipeline whose complete service chain has cleared commercial use.
 */
export const m11BatchAAiInputs = Object.freeze([] satisfies AiInputArtifact[]);
export const m11BatchAAiGenerationRecords = Object.freeze([] satisfies AiGenerationRecord[]);

export const m11BatchAAiServiceAssessments = Object.freeze([
  {
    id: "rights-ai-service-newapi-upstream-unverified-2026-09",
    subject: { type: "ai-service", id: "newapi-upstream-unverified" },
    jurisdictionBaseline: ["CN", "US", "EU", "UK"],
    basis: {
      kind: "reference-only",
      boundary: "The local NewAPI gateway and its actual upstream model service do not have a verified, versioned commercial-output terms chain in the repository.",
    },
    authorityVersion: "unverified-service-chain-2026-09-07",
    accessedAt: "2026-09-07",
    applicableTerritories: ["CN", "US", "EU", "UK"],
    permissions: {
      store: { status: "review-required", scope: "No verified service-chain terms assessment is available." },
      transform: { status: "review-required", scope: "No verified service-chain terms assessment is available." },
      publish: { status: "review-required", scope: "Do not publish agent-generated Batch A expression." },
      commercialize: { status: "review-required", scope: "Commercial output rights remain unknown." },
    },
    attributionRequirementIds: [],
    risks: {
      copyright: { status: "review-required", notes: "Output and input rights cannot be cleared without the actual service and input records." },
      database: { status: "not-applicable", notes: "This assessment does not authorize database ingestion." },
      contract: { status: "review-required", notes: "The applicable gateway and upstream terms chain is not verified." },
      trademark: { status: "not-applicable", notes: "Trademark review is performed per content artifact." },
      "publicity-privacy": { status: "not-applicable", notes: "No participant or personal data is used." },
    },
    uncertainty: "Provider-chain commercial output rights, immutable model version, author run/context, prompt, and versioned AI inputs are not durably proven.",
    assessedAt: "2026-09-07",
    reviewer: "Codex agent preliminary fail-closed assessment; not human or legal review",
    reviewDueAt: "2026-09-07",
  },
] satisfies RightsAssessment[]);
