import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createGameCrossCheckAssertionHash,
  createGameSourceFactBundleVersion,
  evaluateGameSourceFactBundle,
} from "@/lib/game-source-fact-validation";
import { createLocSourceFactBundle } from "@/lib/loc-source-fact-bundles";
import { parseGameNormalizationRegistry, parseGameSourceFactBundle } from "@/lib/game-source-fact-runtime-schema";
import {
  gameNormalizationRegistrySchemaVersion,
  type GameNormalizationRegistryV1,
} from "@/types/game-source-facts";
import { locPublicDomainStatement, type LocRecipeCandidateV1, type LocSourceRegistryV1 } from "@/types/loc-recipe-source";

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
const sourceVersions = { sourceRegistry: sourceRegistryFixture(), sourceCacheVersion: sha256("cache") } as const;

describe("LOC source fact bundles", () => {
  it("preserves exact rational quantities, ordered method facts and source-line hashes", () => {
    const bundle = createLocSourceFactBundle(candidateFixture(), sourceVersions);

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
    const bundle = createLocSourceFactBundle(candidateFixture(), sourceVersions);
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
    const bundle = createLocSourceFactBundle(candidateFixture(), sourceVersions);
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

  it("rejects malformed source-fact and normalization JSON before semantic validation", () => {
    const bundle = createLocSourceFactBundle(candidateFixture(), sourceVersions);
    expect(parseGameSourceFactBundle(bundle)).toEqual(bundle);
    expect(parseGameNormalizationRegistry(registry)).toEqual(registry);
    expect(() => parseGameSourceFactBundle({ ...bundle, unexpected: true })).toThrow(/unexpected property/);
    expect(() => parseGameNormalizationRegistry({ ...registry, operationRules: [{ ruleId: "x", operationToken: "x", operationId: "teleport" }] }))
      .toThrow(/expected one of/);
  });

  it("preserves related cross-checks for discovery but requires exact assertion coverage for normalization", () => {
    const candidate = candidateFixture();
    candidate.crossChecks[0].matchBasis = "related-title-and-facts";
    const bundle = createLocSourceFactBundle(candidate, sourceVersions);

    expect(bundle.crossCheckAssertions[0].matchBasis).toBe("related-title-and-facts");
    expect(evaluateGameSourceFactBundle(bundle, registry)).toEqual([]);

    bundle.status = "normalization-ready";
    bundle.riskFlags = [];
    bundle.bundleVersion = createGameSourceFactBundleVersion(bundle);
    expect(evaluateGameSourceFactBundle(bundle, registry)).toContainEqual(expect.objectContaining({
      code: "ambiguous-fact",
      field: "crossCheckAssertions",
    }));

    const missingAssertion = createLocSourceFactBundle(candidateFixture(), sourceVersions);
    missingAssertion.crossCheckAssertions = [];
    missingAssertion.bundleVersion = createGameSourceFactBundleVersion(missingAssertion);
    expect(evaluateGameSourceFactBundle(missingAssertion, registry)).toContainEqual(expect.objectContaining({
      code: "missing-reference",
      field: "crossCheckAssertions",
    }));
  });

  it("recomputes shared terms from hashed cross-check facts instead of trusting author claims", () => {
    const bundle = createLocSourceFactBundle(candidateFixture(), sourceVersions);
    const assertion = bundle.crossCheckAssertions[0];
    assertion.ingredientTerms = ["invented-one", "invented-two"];
    assertion.sharedIngredientTerms = ["invented-one", "invented-two"];
    assertion.factSha256 = createGameCrossCheckAssertionHash(assertion);
    bundle.bundleVersion = createGameSourceFactBundleVersion(bundle);

    expect(evaluateGameSourceFactBundle(bundle, registry)).toContainEqual(expect.objectContaining({
      code: "ambiguous-fact",
      field: "crossCheckAssertions.0.sharedIngredientTerms",
    }));
  });

  it("re-derives cross-check facts from locator-anchored OCR lines", () => {
    const bundle = createLocSourceFactBundle(candidateFixture(), sourceVersions);
    const assertion = bundle.crossCheckAssertions[0];
    assertion.sourceLines[1].text = "1 cup invented";
    assertion.sourceLines[1].sha256 = sha256(assertion.sourceLines[1].text);
    assertion.factSha256 = createGameCrossCheckAssertionHash(assertion);
    bundle.bundleVersion = createGameSourceFactBundleVersion(bundle);

    expect(evaluateGameSourceFactBundle(bundle, registry)).toContainEqual(expect.objectContaining({
      code: "ambiguous-fact",
      field: "crossCheckAssertions.0.ingredientTerms",
    }));
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
      normalizedTitle: "apple pie",
      ingredientTerms: ["apple", "flour"],
      operationTerms: ["bake"],
      sourceLines: [
        { line: 3, text: "Apple Pie", sha256: sha256("Apple Pie") },
        { line: 4, text: "1 cup apple", sha256: sha256("1 cup apple") },
        { line: 5, text: "1 cup flour", sha256: sha256("1 cup flour") },
        { line: 6, text: "Bake for 20 minutes.", sha256: sha256("Bake for 20 minutes.") },
      ],
      sourceLineSha256s: [sha256("1 cup apple"), sha256("1 cup flour"), sha256("Bake for 20 minutes.")].sort(),
      sharedIngredientTerms: ["apple", "flour"],
      sharedOperationTerms: ["bake"],
    }],
    extractedFacts: {
      ingredients: [
        {
          quantity: 1.25,
          quantityNumerator: 5,
          quantityDenominator: 4,
          rawQuantityToken: "1 1/4",
          unit: "cup",
          ingredient: "flour",
          pageId: "12",
          line: 13,
          lineSha256: sha256("1 1/4 cups flour"),
        },
        {
          quantity: 2,
          quantityNumerator: 2,
          quantityDenominator: 1,
          rawQuantityToken: "2",
          unit: "cup",
          ingredient: "apple",
          pageId: "12",
          line: 14,
          lineSha256: sha256("2 cups apple"),
        },
      ],
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

function sourceRegistryFixture(): LocSourceRegistryV1 {
  return {
    schemaVersion: "cooking-lab-loc-source-registry-v1",
    provider: "Library of Congress",
    collectionUrl: "https://www.loc.gov/collections/selected-digitized-books/",
    rightsStatement: locPublicDomainStatement,
    rightsStatementUrl: "https://www.loc.gov/collections/selected-digitized-books/about-this-collection/rights-and-access/",
    accessedAt: "2026-09-08",
    documents: [
      {
        documentId: "loc-book-a",
        itemId: "100",
        itemUrl: "https://www.loc.gov/item/100/",
        title: "Fixture book a",
        creators: ["Fixture creator a"],
        publicationYear: 1900,
        workFamilyId: "compiler-a",
        rightsStatement: locPublicDomainStatement,
        rightsStatementUrl: "https://www.loc.gov/item/100/",
        ocr: {
          derivativeUrl: "https://tile.loc.gov/storage-services/public/a.text.json",
          fileName: "a.text.json",
          sha256: sha256("book-a"),
          format: "loc-page-text-json",
        },
      },
      {
        documentId: "loc-book-b",
        itemId: "200",
        itemUrl: "https://www.loc.gov/item/200/",
        title: "Fixture book b",
        creators: ["Fixture creator b"],
        publicationYear: 1900,
        workFamilyId: "compiler-b",
        rightsStatement: locPublicDomainStatement,
        rightsStatementUrl: "https://www.loc.gov/item/200/",
        ocr: {
          derivativeUrl: "https://tile.loc.gov/storage-services/public/b.text.json",
          fileName: "b.text.json",
          sha256: sha256("book-b"),
          format: "loc-page-text-json",
        },
      },
    ],
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
