import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLocSourceCache, loadLatestLocSourceCache, verifyLocItemMetadata } from "@/lib/loc-source-cache";
import { ingestLocRecipeSources } from "@/lib/loc-recipe-ingestion";
import { locPublicDomainStatement, type LocSourceDocumentV1 } from "@/types/loc-recipe-source";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { force: true, recursive: true });
});

describe("LOC source cache", () => {
  it("verifies metadata and derivatives before atomically publishing a local cache", async () => {
    const fixture = createFixture();
    const cacheRoot = resolve(createTemporaryDirectory(), "source-cache/loc");
    const result = await fetchLocSourceCache(fixture.registry, { cacheRoot, fetchImpl: fixture.fetchImpl });

    expect(fixture.fetchImpl).toHaveBeenCalledTimes(4);
    expect(result.manifest.documents).toHaveLength(2);
    expect(result.manifest.documents.every((document) => document.pageCount === 1)).toBe(true);
    expect(readFileSync(resolve(result.cacheDirectory, "loc-book-a/source.text.json"), "utf8")).toBe(fixture.derivatives[0]);
    expect(readFileSync(resolve(result.cacheDirectory, "loc-book-a/item.json"), "utf8")).toBe(fixture.items[0]);
    const latest = JSON.parse(readFileSync(resolve(cacheRoot, "latest.json"), "utf8"));
    expect(latest.cacheDirectory).toBe(`cache-${result.manifest.cacheVersion.slice(0, 24)}`);
    expect(readdirSync(cacheRoot).some((entry) => entry.startsWith(".staging-"))).toBe(false);
  });

  it("is byte-stable when the verified upstream bytes are unchanged", async () => {
    const fixture = createFixture();
    const cacheRoot = resolve(createTemporaryDirectory(), "source-cache/loc");
    const first = await fetchLocSourceCache(fixture.registry, { cacheRoot, fetchImpl: fixture.fetchImpl });
    const second = await fetchLocSourceCache(fixture.registry, { cacheRoot, fetchImpl: fixture.fetchImpl });

    expect(second.manifest).toEqual(first.manifest);
    expect(second.cacheDirectory).toBe(first.cacheDirectory);
    expect(readdirSync(cacheRoot).filter((entry) => entry.startsWith("cache-"))).toHaveLength(1);
  });

  it("loads the content-addressed cache directly into candidate ingestion", async () => {
    const fixture = createFixture();
    const cacheRoot = resolve(createTemporaryDirectory(), "source-cache/loc");
    await fetchLocSourceCache(fixture.registry, { cacheRoot, fetchImpl: fixture.fetchImpl });

    const loaded = loadLatestLocSourceCache(fixture.registry, { cacheRoot });
    const candidates = ingestLocRecipeSources(fixture.registry, {
      ocrFilesByDocumentId: loaded.ocrFilesByDocumentId,
    });

    expect(Object.keys(loaded.ocrFilesByDocumentId).sort()).toEqual(["loc-book-a", "loc-book-b"]);
    expect(candidates.candidateCount).toBe(1);
    expect(candidates.normalizationEligibleCount).toBe(1);
    expect(candidates.candidates[0].normalizedTitle).toBe("apple pie");
  });

  it("fails closed and removes staging when official metadata is inconsistent", async () => {
    const fixture = createFixture({ mutateFirstItem: (item) => ({ ...item, title: "Wrong title" }) });
    const cacheRoot = resolve(createTemporaryDirectory(), "source-cache/loc");

    await expect(fetchLocSourceCache(fixture.registry, { cacheRoot, fetchImpl: fixture.fetchImpl }))
      .rejects.toThrow(/title mismatch/);
    expect(readdirSync(cacheRoot)).toEqual([]);
  });

  it("fails closed on missing item-level rights and derivative hash mismatch", async () => {
    const missingRights = createFixture({ mutateFirstItem: (item) => ({ ...item, rights: [] }) });
    await expect(fetchLocSourceCache(missingRights.registry, {
      cacheRoot: resolve(createTemporaryDirectory(), "rights-cache"),
      fetchImpl: missingRights.fetchImpl,
    })).rejects.toThrow(/rights statement mismatch/);

    const wrongHash = createFixture();
    wrongHash.registry.documents[0].ocr.sha256 = "0".repeat(64);
    await expect(fetchLocSourceCache(wrongHash.registry, {
      cacheRoot: resolve(createTemporaryDirectory(), "hash-cache"),
      fetchImpl: wrongHash.fetchImpl,
    })).rejects.toThrow(/derivative hash mismatch/);
  });
});

describe("LOC item metadata verification", () => {
  it("checks creators, year, canonical URL and fulltext URL", () => {
    const fixture = createFixture();
    const document = fixture.registry.documents[0];
    const item = JSON.parse(fixture.items[0]);
    expect(() => verifyLocItemMetadata(item, document)).not.toThrow();
    expect(() => verifyLocItemMetadata({
      ...item,
      item: { ...item.item, contributor_names: ["Different creator"] },
    }, document)).toThrow(/creators mismatch/);
    expect(() => verifyLocItemMetadata({
      ...item,
      item: { ...item.item, resources: [{ fulltext_derivative: "https://tile.loc.gov/wrong.text.json" }] },
    }, document)).toThrow(/fulltext derivative URL mismatch/);
  });
});

function createFixture(options: {
  mutateFirstItem?: (item: Record<string, unknown>) => Record<string, unknown>;
} = {}) {
  const derivatives = [
    JSON.stringify({ "1": { fulltext: "APPLE PIE.\n1 cup flour\n2 cups apples\nMix ingredients and bake 40 minutes." } }),
    JSON.stringify({ "2": { fulltext: "Apple Pie.\n1 cup flour\n3 cups apples\nMix ingredients and bake 35 minutes." } }),
  ];
  const documents = [
    fixtureDocument("a", "100", "work-a", derivatives[0]),
    fixtureDocument("b", "200", "work-b", derivatives[1]),
  ];
  const itemObjects: Array<{ item: Record<string, unknown> }> = documents.map((document) => createItemResponse(document));
  if (options.mutateFirstItem) {
    itemObjects[0] = {
      ...itemObjects[0],
      item: options.mutateFirstItem(itemObjects[0].item as Record<string, unknown>),
    };
  }
  const items = itemObjects.map((item) => JSON.stringify(item));
  const responses = new Map<string, string>();
  documents.forEach((document, index) => {
    responses.set(`${document.itemUrl}?fo=json`, items[index]);
    responses.set(document.ocr.derivativeUrl, derivatives[index]);
  });
  const fetchImpl = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    const body = responses.get(url);
    return body === undefined ? new Response("not found", { status: 404 }) : new Response(body, { status: 200 });
  }) as unknown as typeof fetch;
  return {
    derivatives,
    items,
    fetchImpl,
    registry: {
      schemaVersion: "cooking-lab-loc-source-registry-v1" as const,
      provider: "Library of Congress" as const,
      collectionUrl: "https://www.loc.gov/collections/selected-digitized-books/",
      rightsStatement: locPublicDomainStatement,
      rightsStatementUrl: "https://www.loc.gov/collections/selected-digitized-books/about-this-collection/rights-and-access/",
      accessedAt: "2026-09-08",
      documents,
    },
  };
}

function fixtureDocument(suffix: string, itemId: string, workFamilyId: string, derivative: string): LocSourceDocumentV1 {
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
      fileName: `book-${suffix}.text.json`,
      sha256: sha256(derivative),
      format: "loc-page-text-json",
    },
  };
}

function createItemResponse(document: LocSourceDocumentV1) {
  return {
    item: {
      url: document.itemUrl,
      title: document.title,
      date: String(document.publicationYear),
      contributor_names: document.creators,
      rights: [`<p>${locPublicDomainStatement}</p><p>Credit Line: Library of Congress</p>`],
      resources: [{ fulltext_derivative: document.ocr.derivativeUrl }],
    },
  };
}

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(resolve(tmpdir(), "cooking-lab-loc-cache-"));
  temporaryDirectories.push(directory);
  return directory;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
