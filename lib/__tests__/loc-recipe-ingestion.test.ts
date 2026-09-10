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

    expect(registry.documents).toHaveLength(152);
    expect(new Set(registry.documents.map((document) => document.workFamilyId)).size).toBe(144);
    expect(registry.documents.every((document) => document.ocr.derivativeUrl.startsWith("https://tile.loc.gov/"))).toBe(true);

    const familiesByContributor = new Map<string, Set<string>>();
    for (const document of registry.documents) {
      const contributor = document.creators[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!contributor) continue;
      const families = familiesByContributor.get(contributor) ?? new Set<string>();
      families.add(document.workFamilyId);
      familiesByContributor.set(contributor, families);
    }
    expect([...familiesByContributor.values()].every((families) => families.size === 1)).toBe(true);
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
    expect(result.normalizationEligibleCount).toBe(1);
    expect(result.candidates[0]).toMatchObject({
      normalizedTitle: "apple pie",
      status: "draft-research-only",
      exportEligible: false,
      extractionQuality: { status: "usable", flags: [] },
      primarySource: { pageId: "12", segmentId: expect.stringMatching(/^page-12-lines-/) },
    });
    expect(result.candidates[0].crossChecks).toEqual([
      expect.objectContaining({ documentId: "loc-book-b", pageId: "3", workFamilyId: "work-b" }),
    ]);
    expect(result.candidates[0].extractedFacts.ingredients).toEqual(expect.arrayContaining([
      expect.objectContaining({ ingredient: "flour", pageId: "12", quantity: 1.25, unit: "cup" }),
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

  it("filters inflected preservation terms before normalization", () => {
    const { directory, registry } = createFixture();
    const bookAPath = resolve(directory, "book-a.text.json");
    const preserved = JSON.stringify({
      "12": { fulltext: "PICKLED PEACHES.\n1 cup peaches\n2 cups sugar\nMix and boil 10 minutes, then bottle the pickled fruit." },
    });
    writeFileSync(bookAPath, preserved);
    registry.documents[0].ocr.sha256 = sha256(preserved);

    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
    expect(result.candidates).toEqual([]);
    expect(result.rejectedHighRisk).toEqual(expect.arrayContaining([
      expect.objectContaining({ normalizedTitle: "pickled peaches", reasonCodes: ["fermentation-or-preservation"] }),
    ]));
  });

  it.each(["APPLE CHUTNEY", "CURRANT CATSUP", "GRAPE CONSERVE", "TOMATO MARMALADE", "PLUM JAM", "CRANBERRY JELLY"])(
    "treats historical preserve category %s as high risk",
    (title) => {
      const { directory, registry } = createFixture();
      const bookAPath = resolve(directory, "book-a.text.json");
      const preserved = JSON.stringify({
        "12": { fulltext: `${title}.\n1 cup fruit\n2 cups sugar\nMix and boil 10 minutes.` },
      });
      writeFileSync(bookAPath, preserved);
      registry.documents[0].ocr.sha256 = sha256(preserved);

      const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
      expect(result.candidates).toEqual([]);
      expect(result.rejectedHighRisk[0]?.reasonCodes).toContain("fermentation-or-preservation");
    },
  );

  it("orders multiple operations by their source-text position", () => {
    const { directory, registry } = createFixture();
    const bookAPath = resolve(directory, "book-a.text.json");
    const ordered = JSON.stringify({
      "12": { fulltext: "APPLE PIE.\n1 cup flour\n2 cups apples\nStir, then bake 40 minutes." },
    });
    writeFileSync(bookAPath, ordered);
    registry.documents[0].ocr.sha256 = sha256(ordered);

    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
    const candidate = result.candidates.find((entry) => entry.normalizedTitle === "apple pie");
    expect(candidate?.extractedFacts.methodFacts.map((fact) => fact.operation)).toEqual(["stir", "bake"]);
    expect(candidate?.extractedFacts.methodFacts.every((fact) => fact.durationMinutes === undefined)).toBe(true);
  });

  it("reduces fractional-hour durations after converting them to minutes", () => {
    const { directory, registry } = createFixture();
    const bookAPath = resolve(directory, "book-a.text.json");
    const bookBPath = resolve(directory, "book-b.text.json");
    const fractional = JSON.stringify({
      "12": { fulltext: "APPLE PIE.\n1 cup flour\n2 cups apples\nBake 1 1/2 hours in a moderate oven." },
    });
    const independentCheck = JSON.stringify({
      "3": { fulltext: "Apple Pie.\n1 cup flour\n3 cups apples\nBake for 35 minutes in the oven." },
    });
    writeFileSync(bookAPath, fractional);
    writeFileSync(bookBPath, independentCheck);
    registry.documents[0].ocr.sha256 = sha256(fractional);
    registry.documents[1].ocr.sha256 = sha256(independentCheck);

    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
    const bake = result.candidates.find((entry) => entry.normalizedTitle === "apple pie")?.extractedFacts.methodFacts[0];
    expect(bake?.durationMinutes).toBe(90);
    expect(bake?.durationRational).toEqual({ numerator: 90, denominator: 1, rawToken: "1 1/2 hours" });
  });

  it("keeps fuzzy matches for discovery but blocks them from normalization", () => {
    const { directory, registry } = createFixture({ relatedMatchOnly: true });
    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });

    expect(result.candidateCount).toBe(2);
    expect(result.normalizationEligibleCount).toBe(0);
    expect(result.candidates.find((candidate) => candidate.normalizedTitle === "apple pie")).toMatchObject({
      crossChecks: [expect.objectContaining({ matchBasis: "related-title-and-facts" })],
      extractionQuality: {
        status: "needs-resolution",
        flags: expect.arrayContaining(["no-strong-identity-cross-check"]),
      },
    });
  });

  it("keeps ambiguous OCR visible but blocks it from deterministic normalization", () => {
    const { directory, registry } = createFixture();
    const bookAPath = resolve(directory, "book-a.text.json");
    const ambiguous = JSON.stringify({
      "12": { fulltext: "APPLE PIE.\n14 cups flour\n2 cups of\nMix ingredients and bake 40 minutes." },
    });
    writeFileSync(bookAPath, ambiguous);
    registry.documents[0].ocr.sha256 = sha256(ambiguous);

    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
    expect(result.normalizationEligibleCount).toBe(0);
    expect(result.candidates[0]).toMatchObject({
      extractionQuality: {
        status: "needs-resolution",
        flags: expect.arrayContaining(["ambiguous-ingredient-phrase", "implausible-source-quantity"]),
      },
      blockers: expect.arrayContaining(["source-extraction-resolution-required"]),
    });
  });

  it("blocks merged quantities, state-only fragments and trailing OCR hyphens from normalization", () => {
    for (const phrase of ["milk 2 eggs", "boiling", "baking pow-", "cream or milk", "flour (sifted four times)"]) {
      const { directory, registry } = createFixture();
      const bookAPath = resolve(directory, "book-a.text.json");
      const malformed = JSON.stringify({
        "12": { fulltext: `APPLE PIE.\n1 cup flour\n2 cups ${phrase}\nMix, then bake for 40 minutes in the oven.` },
      });
      writeFileSync(bookAPath, malformed);
      registry.documents[0].ocr.sha256 = sha256(malformed);

      const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
      expect(result.candidates.find((candidate) => candidate.primarySource.documentId === "loc-book-a")).toMatchObject({
        extractionQuality: {
          status: "needs-resolution",
          flags: expect.arrayContaining(["ambiguous-ingredient-phrase"]),
        },
      });
    }
  });

  it("filters detected historical brand ingredients before normalization", () => {
    const { directory, registry } = createFixture();
    const bookAPath = resolve(directory, "book-a.text.json");
    const branded = JSON.stringify({
      "12": { fulltext: "CARAMEL SAUCE.\n1 cup Karo syrup\n2 cups sugar\nMix and boil for 10 minutes." },
    });
    writeFileSync(bookAPath, branded);
    registry.documents[0].ocr.sha256 = sha256(branded);

    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
    expect(result.rejectedHighRisk).toContainEqual(expect.objectContaining({
      normalizedTitle: "caramel sauce",
      reasonCodes: expect.arrayContaining(["brand-or-restaurant"]),
    }));
  });

  it("keeps OCR-damaged headings visible but blocks them from normalization", () => {
    const { directory, registry } = createFixture();
    const bookAPath = resolve(directory, "book-a.text.json");
    const damagedTitle = JSON.stringify({
      "12": { fulltext: "APPLE PIE |\n1 cup flour\n2 cups apples\nMix, then bake for 40 minutes in the oven." },
    });
    writeFileSync(bookAPath, damagedTitle);
    registry.documents[0].ocr.sha256 = sha256(damagedTitle);

    const result = ingestLocRecipeSources(registry, { ocrDirectory: directory });
    expect(result.candidates.find((candidate) => candidate.primarySource.documentId === "loc-book-a")).toMatchObject({
      extractionQuality: {
        status: "needs-resolution",
        flags: expect.arrayContaining(["ambiguous-title"]),
      },
    });
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

function createFixture(options: { includeIndependentMatch?: boolean; relatedMatchOnly?: boolean } = {}) {
  const directory = createTemporaryDirectory();
  const bookA = JSON.stringify({
    "12": {
      fulltext: [
        "APPLE PIE.",
        "1¼ cups flour",
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
        : options.relatedMatchOnly
          ? "APPLE FRUIT PIE.\n1 cup flour\n3 cups apples\nMix and bake 35 minutes."
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
