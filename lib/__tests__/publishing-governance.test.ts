import { describe, expect, it } from "vitest";
import { culinaryImages } from "@/data/culinary/images";
import { createPublishingGovernanceRegistry } from "@/data/publishing-governance";
import {
  contentRightsRegistry,
  contentRightsSources,
  getPublishedCulinaryItems,
} from "@/data/published-culinary-items";
import { recipeImages } from "@/data/recipe-images";
import type { PublishingGovernanceRegistry, ReviewAttestation } from "@/types/publishing-governance";
import {
  evaluatePublishingGovernance,
  type PublishingGovernanceContext,
} from "../publishing-governance";

const items = getPublishedCulinaryItems();
const context: PublishingGovernanceContext = { items, rightsRegistry: contentRightsRegistry };

function readyRegistry(): PublishingGovernanceRegistry {
  return structuredClone(createPublishingGovernanceRegistry({
    items,
    rightsRegistry: contentRightsRegistry,
    images: [...recipeImages, ...culinaryImages],
    sources: contentRightsSources,
  }));
}

function issueCodes(registry: PublishingGovernanceRegistry, customContext = context) {
  return evaluatePublishingGovernance(registry, customContext).issues.map((issue) => issue.code);
}

describe("risk-based publishing governance", () => {
  it("allows the reviewed M10 baseline through the low-risk agent path", () => {
    const registry = readyRegistry();
    const result = evaluatePublishingGovernance(registry, context);
    expect(result.ready, result.issues.map((issue) => `${issue.code}:${issue.subjectId}`).join(", ")).toBe(true);
    expect(result.auditedItemIds).toHaveLength(50);
    expect(registry.attestations.every((entry) => entry.reviewer.actorType === "agent")).toBe(true);
    expect(registry.attestations.every((entry) => !entry.representations.humanApproval)).toBe(true);
  });

  it("requires every review dimension and a distinct author/reviewer actor, run, and context", () => {
    const missing = readyRegistry();
    missing.attestations = missing.attestations.filter((entry) => entry.dimension !== "provenance");
    expect(issueCodes(missing)).toContain("missing-review-dimension");

    const sameContext = readyRegistry();
    sameContext.attestations[0].reviewer.contextId = sameContext.attestations[0].author.contextId;
    sameContext.attestations[0].reviewer.runId = sameContext.attestations[0].author.runId;
    expect(issueCodes(sameContext)).toContain("reviewer-not-independent");
  });

  it("fails closed when a published item has no risk or review record", () => {
    const unreviewedItem = {
      ...structuredClone(items[0]),
      id: "unreviewed-new-item",
      slug: "unreviewed-new-item",
    };
    const expandedContext = { items: [...items, unreviewedItem], rightsRegistry: contentRightsRegistry };
    expect(issueCodes(readyRegistry(), expandedContext)).toContain("missing-risk-classification");
  });

  it("blocks reviewer edits, unresolved findings, and agent claims of human, field, or legal review", () => {
    const registry = readyRegistry();
    Object.assign(registry.attestations[0], { reviewerModifiedContent: true });
    registry.attestations[1].findings = [{ code: "unresolved", severity: "major", summary: "Open", disposition: "unresolved" }];
    registry.attestations[2].representations.humanApproval = true;
    expect(issueCodes(registry)).toEqual(expect.arrayContaining([
      "reviewer-modified-content",
      "unresolved-review-finding",
      "review-claim-misrepresentation",
    ]));
  });

  it("requires durable evidence and never infers human approval from an agent label", () => {
    const registry = readyRegistry();
    registry.attestations[0].evidenceReference = "";
    registry.attestations[1].dimension = "human-approval";
    registry.attestations[1].representations.humanApproval = true;
    expect(issueCodes(registry)).toEqual(expect.arrayContaining([
      "invalid-review-attestation",
      "review-claim-misrepresentation",
    ]));
  });

  it("invalidates PASS when an artifact version changes", () => {
    const registry = readyRegistry();
    const changedRights = structuredClone(contentRightsRegistry);
    changedRights.artifacts[0].version = "clv1-content-changed-after-review";
    const changedContext = { items, rightsRegistry: changedRights };
    expect(issueCodes(registry, changedContext)).toEqual(expect.arrayContaining([
      "stale-review-attestation",
      "stale-risk-classification",
      "missing-sampling-coverage",
    ]));
  });

  it("requires separate reviewer contexts for medium risk", () => {
    const registry = readyRegistry();
    const itemId = registry.riskClassifications[0].itemId;
    registry.riskClassifications[0].level = "medium";
    registry.riskClassifications[0].reasonCodes = ["culinary-authenticity-judgment"];
    expect(issueCodes(registry)).toContain("insufficient-medium-independence");

    const secondReviewer = {
      actorType: "agent" as const,
      actorId: "codex-agent:content-reviewer",
      runId: "content-review-run-2",
      contextId: "content-review-context-2",
    };
    const contentDimensions = new Set(["factual-culinary", "editorial", "visual-image"]);
    registry.attestations = [
      ...registry.attestations,
      ...registry.attestations
        .filter((entry) => contentDimensions.has(entry.dimension) && entry.itemIds.includes(itemId))
        .map((entry): ReviewAttestation => ({
          ...structuredClone(entry),
          id: `${entry.id}-second-context`,
          reviewer: secondReviewer,
        })),
    ];
    expect(issueCodes(registry)).not.toContain("insufficient-medium-independence");
  });

  it("keeps high risk blocked until an explicit non-agent human approval checkpoint", () => {
    const registry = readyRegistry();
    const classification = registry.riskClassifications[0];
    classification.level = "high";
    classification.reasonCodes = ["professional-legal-checkpoint"];
    expect(issueCodes(registry)).toContain("high-risk-human-checkpoint");

    const template = registry.attestations[0];
    registry.attestations = [...registry.attestations, {
      ...structuredClone(template),
      id: "human-approval-test",
      dimension: "human-approval",
      reviewer: {
        actorType: "lawyer",
        actorId: "lawyer:test-reviewer",
        runId: "legal-review-run",
        contextId: "legal-review-context",
      },
      representations: { humanApproval: true, culinaryFieldTest: false, legalOpinion: true },
    }];
    expect(issueCodes(registry)).not.toContain("high-risk-human-checkpoint");
  });

  it("uses risk-class coverage and freezes classes after major findings", () => {
    const missing = readyRegistry();
    const key = missing.riskClassifications[0].equivalenceClassKeys[0];
    missing.samplingBatches[0].equivalenceClasses = missing.samplingBatches[0].equivalenceClasses.filter((entry) => entry.key !== key) as typeof missing.samplingBatches[0]["equivalenceClasses"];
    expect(issueCodes(missing)).toContain("missing-sampling-coverage");

    const frozen = readyRegistry();
    const frozenKey = frozen.samplingBatches[0].equivalenceClasses[0].key;
    frozen.samplingBatches[0].frozenClassKeys = [frozenKey];
    frozen.samplingBatches[0].fullReReviewClassKeys = [frozenKey];
    frozen.samplingBatches[0].consecutiveCleanBatchesByClass[frozenKey] = 1;
    expect(issueCodes(frozen)).toContain("sampling-class-frozen");
  });

  it("requires sampling QA to use a third context and durable evidence", () => {
    const registry = readyRegistry();
    registry.samplingBatches[0].auditor = structuredClone(registry.attestations[0].reviewer);
    registry.samplingBatches[0].evidenceReference = "";
    Object.assign(registry.samplingBatches[0], { auditorModifiedContent: true });
    expect(issueCodes(registry)).toEqual(expect.arrayContaining([
      "reviewer-not-independent",
      "missing-sampling-coverage",
      "reviewer-modified-content",
    ]));
  });
});
