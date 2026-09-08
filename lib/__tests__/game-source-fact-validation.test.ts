import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createGameSourceFactBundleVersion,
  evaluateGameSourceFactBundle,
} from "@/lib/game-source-fact-validation";
import { createLocSourceFactBundle } from "@/lib/loc-source-fact-bundles";
import {
  gameNormalizationRegistrySchemaVersion,
  type GameNormalizationRegistryV1,
} from "@/types/game-source-facts";
import type { LocRecipeCandidateV1 } from "@/types/loc-recipe-source";

const registry: GameNormalizationRegistryV1 = {
  schemaVersion: gameNormalizationRegistrySchemaVersion,
  policyVersion: "m13-normalization-v1",
  ingredientAliases: [],
  operationRules: [],
  equipmentRules: [],
  heatDescriptors: [],
  targetStateRules: [],
  mutationRules: [],
};

describe("LOC source fact bundles", () => {
  it("preserves exact rational quantities, ordered method facts and source-line hashes", () => {
    const bundle = createLocSourceFactBundle(candidateFixture());

    expect(bundle.status).toBe("draft");
    expect(bundle.ingredientFacts[0]).toMatchObject({
      phrase: "flour",
      quantity: { numerator: 5, denominator: 4, rawToken: "1 1/4", unitToken: "cup" },
      locator: { pageId: "12", startLine: 13, endLine: 13 },
      sourceLineSha256: sha256("1 1/4 cups flour"),
    });
    expect(bundle.methodFacts[0]).toMatchObject({
      order: 1,
      operationToken: "bake",
      durationMinutes: { numerator: 40, denominator: 1, rawToken: "40 minutes", unitToken: "minute" },
      qualitativeHeatToken: "moderate-oven",
      ingredientFactIds: [],
    });
    expect(bundle.riskFlags).toEqual(["method-ingredient-binding-required"]);
    expect(evaluateGameSourceFactBundle(bundle, registry)).toEqual([]);
  });

  it("invalidates stale facts, non-independent cross-checks and noncanonical rationals", () => {
    const bundle = createLocSourceFactBundle(candidateFixture());
    bundle.ingredientFacts[0].quantity = { ...bundle.ingredientFacts[0].quantity, numerator: 10, denominator: 8 };
    bundle.crossCheckSources[0].workFamilyId = bundle.primarySource.workFamilyId;
    bundle.bundleVersion = createGameSourceFactBundleVersion(bundle);

    const issues = evaluateGameSourceFactBundle(bundle, registry);
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "ambiguous-fact", field: "ingredientFacts.0.quantity" }),
      expect.objectContaining({ code: "invalid-source", field: "crossCheckSources.0.workFamilyId" }),
      expect.objectContaining({ code: "stale-version", field: "ingredientFacts.0.factSha256" }),
    ]));
  });

  it("fails closed when a bundle claims normalization readiness without exact rules or bindings", () => {
    const bundle = createLocSourceFactBundle(candidateFixture());
    bundle.status = "normalization-ready";
    bundle.riskFlags = [];
    bundle.bundleVersion = createGameSourceFactBundleVersion(bundle);

    const issues = evaluateGameSourceFactBundle(bundle, registry);
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: expect.stringContaining("ingredientFacts.") }),
      expect.objectContaining({ field: expect.stringContaining("methodFacts.") }),
    ]));
    expect(issues.some((issue) => issue.message.includes("explicit ingredient inputs"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("no normalization rule"))).toBe(true);
  });
});

function candidateFixture(): LocRecipeCandidateV1 {
  return {
    candidateId: "loc-candidate-abc123",
    title: "Apple Pie",
    normalizedTitle: "apple pie",
    status: "draft-research-only",
    exportEligible: false,
    primarySource: {
      documentId: "loc-book-a",
      sourceTitle: "Apple Pie",
      itemUrl: "https://www.loc.gov/item/100/",
      workFamilyId: "compiler-a",
      ocrDerivativeUrl: "https://tile.loc.gov/a.text.json",
      ocrSha256: sha256("book-a"),
      pageId: "12",
      segmentId: "page-12-lines-12-15",
      startLine: 12,
      endLine: 15,
    },
    crossChecks: [{
      documentId: "loc-book-b",
      sourceTitle: "Apple Pie",
      itemUrl: "https://www.loc.gov/item/200/",
      workFamilyId: "compiler-b",
      ocrDerivativeUrl: "https://tile.loc.gov/b.text.json",
      ocrSha256: sha256("book-b"),
      pageId: "3",
      segmentId: "page-3-lines-3-6",
      startLine: 3,
      endLine: 6,
      matchBasis: "exact-title",
      titleTokenJaccard: 1,
      sharedIngredientTerms: ["apple", "flour"],
      sharedOperationTerms: ["bake"],
    }],
    extractedFacts: {
      ingredients: [{
        quantity: 1.25,
        quantityNumerator: 5,
        quantityDenominator: 4,
        rawQuantityToken: "1 1/4",
        unit: "cup",
        ingredient: "flour",
        pageId: "12",
        line: 13,
        lineSha256: sha256("1 1/4 cups flour"),
      }],
      operationTerms: ["bake"],
      durations: [{ minutes: 40, numerator: 40, denominator: 1, rawToken: "40 minutes", pageId: "12", line: 15 }],
      methodFacts: [{
        factId: "method-12-15-01",
        pageId: "12",
        line: 15,
        order: 1,
        operation: "bake",
        lineSha256: sha256("Bake 40 minutes in a moderate oven."),
        durationMinutes: 40,
        durationRational: { numerator: 40, denominator: 1, rawToken: "40 minutes" },
        qualitativeHeatToken: "moderate-oven",
        equipmentToken: "oven",
      }],
    },
    extractionQuality: { status: "usable", flags: [] },
    blockers: [
      "candidate-only-not-canonical",
      "ingredient-normalization-required",
      "operation-graph-required",
      "nutrition-provenance-required",
      "rights-decision-required",
      "independent-review-required",
    ],
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
