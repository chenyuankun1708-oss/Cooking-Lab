import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ingestLocRecipeSources,
  LocSourceSchemaError,
  parseLocPageTextDerivative,
  parseLocSourceRegistry,
} from "@/lib/loc-recipe-ingestion";
import { locPublicDomainStatement } from "@/types/loc-recipe-source";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { force: true, recursive: true });
});

describe("LOC source registry", () => {
  it("accepts the checked-in official document registry", () => {
    const input = JSON.parse(readFileSync(resolve(process.cwd(), "game-data/source-research/loc-sources.json"), "utf8"));
    const registry = parseLocSourceRegistry(input);

    expect(registry.documents).toHaveLength(14);
    expect(new Set(registry.documents.map((document) => document.workFamilyId)).size).toBe(14);
    expect(registry.documents.every((document) => document.ocr.derivativeUrl.startsWith("https://tile.loc.gov/"))).toBe(true);
  });

  it("fails closed on non-official URLs, altered rights text, and unpaged OCR files", () => {
    const { registry } = createFixture();

    expect(() => parseLocSourceRegistry({ ...registry, rightsStatement: "Public domain" })).toThrow(LocSourceSchemaError);
    expect(() => parseLocSourceRegistry({
      ...registry,
      documents: registry.documents.map((document, index) => index === 0
        ? { ...document, rightsStatement: "Public domain" }
        : document),
    })).toThrow(/documents\[0\]\.rightsStatement/);
    expect(() => parseLocSourceRegistry({
      ...registry,
      documents: registry.documents.map((document, index) => index === 0
        ? { ...document, itemUrl: "https://example.com/item/100/" }
        : document),
    })).toThrow(/official HTTPS www\.loc\.gov/);
    expect(() => parseLocSourceRegistry({
      ...registry,
      documents: registry.documents.map((document, index) => index === 0
        ? { ...document, ocr: { ...document.ocr, fileName: "source.txt" } }
        : document),
    })).toThrow(/\.text\.json/);
  });
});

describe("LOC page-text derivative", () => {
  it("sorts numeric pages and rejects missing fulltext", () => {
    expect(parseLocPageTextDerivative({ "10": { fulltext: "ten" }, "2": { fulltext: "two" } }))
      .toEqual([{ pageId: "2", fulltext: "two" }, { pageId: "10", fulltext: "ten" }]);
    expect(() => parseLocPageTextDerivative({ "1": { width: "100" } })).toThrow(/fulltext/);
  });
});

describe("LOC candidate ingestion", () => {
  it("emits only page-addressable, independently cross-checked draft facts", () => {
    const { directory, registry } = createFixture();
    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });

    expect(result.candidateCount).toBe(1);
    expect(result.candidates[0]).toMatchObject({
      normalizedTitle: "apple pie",
      status: "draft-research-only",
      exportEligible: false,
      primarySource: { pageId: "12", segmentId: expect.stringMatching(/^page-12-lines-/) },
    });
    expect(result.candidates[0].crossChecks).toEqual([
      expect.objectContaining({ documentId: "loc-book-b", pageId: "3", workFamilyId: "work-b" }),
    ]);
    expect(result.candidates[0].extractedFacts.ingredients).toEqual(expect.arrayContaining([
      expect.objectContaining({ ingredient: "flour", pageId: "12", quantity: 1, unit: "cup" }),
      expect.objectContaining({ ingredient: "apples", pageId: "12", quantity: 2, unit: "cup" }),
    ]));
    expect(result.candidates[0].extractedFacts.durations).toEqual([
      expect.objectContaining({ minutes: 40, pageId: "12" }),
    ]);
    expect(result.candidates[0].blockers).toContain("rights-decision-required");
    expect(JSON.stringify(result)).not.toContain("Mix ingredients and bake");
  });

  it("filters high-risk categories instead of turning them into candidates", () => {
    const { directory, registry } = createFixture();
    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });

    expect(result.rejectedHighRisk).toEqual(expect.arrayContaining([
      expect.objectContaining({ normalizedTitle: "wine sauce", reasonCodes: expect.arrayContaining(["alcohol"]) }),
    ]));
    expect(result.candidates.some((candidate) => candidate.normalizedTitle === "wine sauce")).toBe(false);
  });

  it("requires matching recipes to come from independent work families", () => {
    const { directory, registry } = createFixture({ includeIndependentMatch: false });
    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });

    expect(result.candidateCount).toBe(0);
  });

  it("fails closed on derivative hash mismatch and path escape", () => {
    const { directory, registry } = createFixture();
    const alteredRegistry = {
      ...registry,
      documents: registry.documents.map((document, index) => index === 0
        ? { ...document, ocr: { ...document.ocr, sha256: "0".repeat(64) } }
        : document),
    };
    expect(() => ingestLocRecipeSources(alteredRegistry, { ocrDirectory: directory })).toThrow(/OCR hash mismatch/);

    const outside = createTemporaryDirectory();
    writeFileSync(resolve(outside, "outside.text.json"), "{}\n");
    symlinkSync(resolve(outside, "outside.text.json"), resolve(directory, "linked.text.json"));
    const linkedRegistry = {
      ...registry,
      documents: registry.documents.map((document, index) => index === 0
        ? {
            ...document,
            ocr: {
              ...document.ocr,
              fileName: "linked.text.json",
              sha256: sha256("{}\n"),
            },
          }
        : document),
    };
    expect(() => ingestLocRecipeSources(linkedRegistry, { ocrDirectory: directory })).toThrow(/escapes input directory/);
  });
});

function createFixture(options: { includeIndependentMatch?: boolean } = {}) {
  const directory = createTemporaryDirectory();
  const bookA = JSON.stringify({
    "12": {
      fulltext: [
        "APPLE PIE.",
        "1 cup flour",
        "2 cups apples",
        "Mix ingredients and bake 40 minutes.",
        "",
        "WINE SAUCE.",
        "1 cup wine",
        "2 cups sugar",
        "Mix and boil 10 minutes.",
      ].join("\n"),
    },
  });
  const bookB = JSON.stringify({
    "3": {
      fulltext: options.includeIndependentMatch === false
        ? "PEAR TART.\n1 cup flour\n2 cups pears\nMix and bake 35 minutes."
        : "Apple Pie.\n1 cup flour\n3 cups apples\nMix and bake 35 minutes.",
    },
  });
  writeFileSync(resolve(directory, "book-a.text.json"), bookA);
  writeFileSync(resolve(directory, "book-b.text.json"), bookB);
  return {
    directory,
    registry: {
      schemaVersion: "cooking-lab-loc-source-registry-v1",
      provider: "Library of Congress",
      collectionUrl: "https://www.loc.gov/collections/selected-digitized-books/",
      rightsStatement: locPublicDomainStatement,
      rightsStatementUrl: "https://www.loc.gov/collections/selected-digitized-books/about-this-collection/rights-and-access/",
      accessedAt: "2026-09-08",
      documents: [
        fixtureDocument("a", "100", "work-a", "book-a.text.json", bookA),
        fixtureDocument("b", "200", "work-b", "book-b.text.json", bookB),
      ],
    },
  };
}

function fixtureDocument(suffix: string, itemId: string, workFamilyId: string, fileName: string, contents: string) {
  return {
    documentId: `loc-book-${suffix}`,
    itemId,
    itemUrl: `https://www.loc.gov/item/${itemId}/`,
    title: `Fixture book ${suffix}`,
    creators: [`Fixture creator ${suffix}`],
    publicationYear: 1900,
    workFamilyId,
    rightsStatement: locPublicDomainStatement,
    rightsStatementUrl: `https://www.loc.gov/item/${itemId}/`,
    ocr: {
      derivativeUrl: `https://tile.loc.gov/storage-services/public/fixture/book-${suffix}.text.json`,
      fileName,
      sha256: sha256(contents),
      format: "loc-page-text-json",
    },
  };
}

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(resolve(tmpdir(), "cooking-lab-loc-"));
  temporaryDirectories.push(directory);
  return directory;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
