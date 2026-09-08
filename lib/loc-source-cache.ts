import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { parseLocPageTextDerivative, parseLocSourceRegistry } from "@/lib/loc-recipe-ingestion";
import { stableJson } from "@/lib/stable-json";
import { locPublicDomainStatement, type LocSourceDocumentV1 } from "@/types/loc-recipe-source";

export const locSourceCacheSchemaVersion = "cooking-lab-loc-source-cache-v1" as const;

export interface LocSourceCacheManifestV1 {
  schemaVersion: typeof locSourceCacheSchemaVersion;
  cacheVersion: string;
  sourceAccessedAt: string;
  documents: Array<{
    documentId: string;
    itemJsonPath: string;
    itemJsonSha256: string;
    derivativePath: string;
    derivativeSha256: string;
    pageCount: number;
  }>;
}

export function loadLatestLocSourceCache(
  registryInput: unknown,
  options: { cacheRoot: string },
): {
  cacheDirectory: string;
  manifest: LocSourceCacheManifestV1;
  ocrFilesByDocumentId: Readonly<Record<string, string>>;
} {
  const registry = parseLocSourceRegistry(registryInput);
  const cacheRoot = realpathSync(options.cacheRoot);
  if (!statSync(cacheRoot).isDirectory()) throw new Error(`LOC cache root is not a directory: ${cacheRoot}`);
  const pointerBytes = readFileSync(resolve(cacheRoot, "latest.json"));
  const pointer = asRecord(parseJson(pointerBytes, "LOC latest pointer"), "LOC latest pointer");
  if (pointer.schemaVersion !== locSourceCacheSchemaVersion
    || typeof pointer.cacheDirectory !== "string"
    || !/^cache-[a-f0-9]{24}$/.test(pointer.cacheDirectory)
    || typeof pointer.manifestSha256 !== "string"
    || !/^[a-f0-9]{64}$/.test(pointer.manifestSha256)) {
    throw new Error("LOC latest pointer is malformed");
  }
  const cacheDirectory = realpathSync(resolve(cacheRoot, pointer.cacheDirectory));
  assertInside(cacheRoot, cacheDirectory, "LOC cache directory");
  const manifestBytes = readFileSync(resolve(cacheDirectory, "manifest.json"));
  if (sha256(manifestBytes) !== pointer.manifestSha256) throw new Error("LOC cache manifest hash does not match latest pointer");
  const manifest = parseCacheManifest(parseJson(manifestBytes, "LOC cache manifest"));
  if (!manifest.cacheVersion.startsWith(pointer.cacheDirectory.slice("cache-".length))) {
    throw new Error("LOC cache directory does not match manifest version");
  }
  if (manifest.sourceAccessedAt !== registry.accessedAt || manifest.documents.length !== registry.documents.length) {
    throw new Error("LOC cache manifest does not match the current source registry");
  }
  const recordById = new Map(manifest.documents.map((entry) => [entry.documentId, entry]));
  const ocrFilesByDocumentId: Record<string, string> = {};
  for (const document of registry.documents) {
    const entry = recordById.get(document.documentId);
    if (!entry
      || entry.derivativeSha256 !== document.ocr.sha256
      || entry.derivativePath !== `${document.documentId}/source.text.json`
      || entry.itemJsonPath !== `${document.documentId}/item.json`) {
      throw new Error(`LOC cache entry does not match registry for ${document.documentId}`);
    }
    const itemPath = realpathSync(resolve(cacheDirectory, entry.itemJsonPath));
    const path = realpathSync(resolve(cacheDirectory, entry.derivativePath));
    assertInside(cacheDirectory, itemPath, `LOC item metadata ${document.documentId}`);
    assertInside(cacheDirectory, path, `LOC derivative ${document.documentId}`);
    const itemBytes = readFileSync(itemPath);
    if (!statSync(itemPath).isFile() || sha256(itemBytes) !== entry.itemJsonSha256) {
      throw new Error(`LOC cached item metadata is invalid for ${document.documentId}`);
    }
    verifyLocItemMetadata(parseJson(itemBytes, `${document.documentId} cached item metadata`), document);
    if (!statSync(path).isFile() || sha256(readFileSync(path)) !== entry.derivativeSha256) {
      throw new Error(`LOC cached derivative is invalid for ${document.documentId}`);
    }
    ocrFilesByDocumentId[document.documentId] = path;
  }
  return { cacheDirectory, manifest, ocrFilesByDocumentId };
}

export async function fetchLocSourceCache(
  registryInput: unknown,
  options: {
    cacheRoot: string;
    fetchImpl?: typeof fetch;
  },
): Promise<{ cacheDirectory: string; manifest: LocSourceCacheManifestV1 }> {
  const registry = parseLocSourceRegistry(registryInput);
  const fetchImpl = options.fetchImpl ?? fetch;
  const cacheRoot = resolve(options.cacheRoot);
  mkdirSync(cacheRoot, { recursive: true });
  const stagingDirectory = mkdtempSync(resolve(cacheRoot, ".staging-"));

  try {
    const records = [];
    for (const document of registry.documents) {
      const itemBytes = await fetchBytes(fetchImpl, `${document.itemUrl}?fo=json`, "LOC item JSON");
      const itemJson = parseJson(itemBytes, `${document.documentId} item metadata`);
      verifyLocItemMetadata(itemJson, document);

      const derivativeBytes = await fetchBytes(fetchImpl, document.ocr.derivativeUrl, "LOC page-text derivative");
      const derivativeHash = sha256(derivativeBytes);
      if (derivativeHash !== document.ocr.sha256) {
        throw new Error(`LOC derivative hash mismatch for ${document.documentId}: expected ${document.ocr.sha256}, received ${derivativeHash}`);
      }
      const derivativeJson = parseJson(derivativeBytes, `${document.documentId} page-text derivative`);
      const pages = parseLocPageTextDerivative(derivativeJson, document.documentId);

      const documentDirectory = resolve(stagingDirectory, document.documentId);
      mkdirSync(documentDirectory);
      writeFileSync(resolve(documentDirectory, "item.json"), itemBytes, { flag: "wx" });
      writeFileSync(resolve(documentDirectory, "source.text.json"), derivativeBytes, { flag: "wx" });
      records.push({
        documentId: document.documentId,
        itemJsonPath: `${document.documentId}/item.json`,
        itemJsonSha256: sha256(itemBytes),
        derivativePath: `${document.documentId}/source.text.json`,
        derivativeSha256: derivativeHash,
        pageCount: pages.length,
      });
    }

    const cacheVersion = sha256(stableJson({
      schemaVersion: locSourceCacheSchemaVersion,
      sourceAccessedAt: registry.accessedAt,
      documents: records,
    }));
    const manifest: LocSourceCacheManifestV1 = {
      schemaVersion: locSourceCacheSchemaVersion,
      cacheVersion,
      sourceAccessedAt: registry.accessedAt,
      documents: records,
    };
    const manifestText = stableJson(manifest);
    writeFileSync(resolve(stagingDirectory, "manifest.json"), manifestText, { flag: "wx" });

    const cacheDirectoryName = `cache-${cacheVersion.slice(0, 24)}`;
    const cacheDirectory = resolve(cacheRoot, cacheDirectoryName);
    if (existsSync(cacheDirectory)) {
      const existingManifest = readFileSync(resolve(cacheDirectory, "manifest.json"), "utf8");
      if (existingManifest !== manifestText) throw new Error(`Existing LOC cache version is inconsistent: ${cacheDirectory}`);
      rmSync(stagingDirectory, { recursive: true });
    } else {
      renameSync(stagingDirectory, cacheDirectory);
    }
    writeLatestPointer(cacheRoot, cacheDirectoryName, sha256(manifestText));
    return { cacheDirectory, manifest };
  } catch (error) {
    rmSync(stagingDirectory, { force: true, recursive: true });
    throw error;
  }
}

export function verifyLocItemMetadata(value: unknown, document: LocSourceDocumentV1): void {
  const root = asRecord(value, `${document.documentId} item response`);
  const item = asRecord(root.item, `${document.documentId}.item`);
  if (item.url !== document.itemUrl) mismatch(document, "item URL", document.itemUrl, item.url);
  if (item.title !== document.title) mismatch(document, "title", document.title, item.title);
  if (item.date !== String(document.publicationYear)) mismatch(document, "publication year", String(document.publicationYear), item.date);

  const creators = item.contributor_names === undefined ? [] : stringArray(item.contributor_names, `${document.documentId}.item.contributor_names`);
  if (stableJson(creators) !== stableJson(document.creators)) {
    mismatch(document, "creators", document.creators, creators);
  }
  const rights = stringArray(item.rights, `${document.documentId}.item.rights`).map(stripHtml);
  if (!rights.some((entry) => entry.includes(locPublicDomainStatement))) {
    throw new Error(`LOC item rights statement mismatch for ${document.documentId}`);
  }
  if (document.rightsStatement !== locPublicDomainStatement || document.rightsStatementUrl !== document.itemUrl) {
    throw new Error(`Registry item-level rights record mismatch for ${document.documentId}`);
  }

  const resources = arrayValue(item.resources, `${document.documentId}.item.resources`);
  const derivativeUrls = resources.flatMap((entry, index) => {
    const resource = asRecord(entry, `${document.documentId}.item.resources[${index}]`);
    return typeof resource.fulltext_derivative === "string" ? [resource.fulltext_derivative] : [];
  });
  if (!derivativeUrls.includes(document.ocr.derivativeUrl)) {
    mismatch(document, "fulltext derivative URL", document.ocr.derivativeUrl, derivativeUrls);
  }
}

async function fetchBytes(fetchImpl: typeof fetch, url: string, label: string): Promise<Uint8Array> {
  const response = await fetchImpl(url, {
    headers: { accept: "application/json" },
    redirect: "error",
  });
  if (!response.ok) throw new Error(`${label} request failed (${response.status}) for ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

function parseJson(bytes: Uint8Array, label: string): unknown {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function writeLatestPointer(cacheRoot: string, cacheDirectory: string, manifestSha256: string): void {
  const pointerPath = resolve(cacheRoot, "latest.json");
  const temporaryPath = resolve(cacheRoot, `.latest-${process.pid}-${randomUUID()}.json`);
  writeFileSync(temporaryPath, stableJson({
    schemaVersion: locSourceCacheSchemaVersion,
    cacheDirectory,
    manifestSha256,
  }), { flag: "wx" });
  renameSync(temporaryPath, pointerPath);
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replace(/\s+/g, " ")
    .trim();
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${path}: expected object`);
  return value as Record<string, unknown>;
}

function arrayValue(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path}: expected array`);
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  return arrayValue(value, path).map((entry, index) => {
    if (typeof entry !== "string") throw new Error(`${path}[${index}]: expected string`);
    return entry;
  });
}

function mismatch(document: LocSourceDocumentV1, field: string, expected: unknown, actual: unknown): never {
  throw new Error(`LOC item ${field} mismatch for ${document.documentId}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
}

function parseCacheManifest(value: unknown): LocSourceCacheManifestV1 {
  const root = asRecord(value, "LOC cache manifest");
  if (root.schemaVersion !== locSourceCacheSchemaVersion
    || typeof root.cacheVersion !== "string"
    || !/^[a-f0-9]{64}$/.test(root.cacheVersion)
    || typeof root.sourceAccessedAt !== "string"
    || !Array.isArray(root.documents)) {
    throw new Error("LOC cache manifest is malformed");
  }
  const documents = root.documents.map((value, index) => {
    const entry = asRecord(value, `LOC cache manifest documents[${index}]`);
    if (typeof entry.documentId !== "string"
      || typeof entry.itemJsonPath !== "string"
      || typeof entry.itemJsonSha256 !== "string"
      || typeof entry.derivativePath !== "string"
      || typeof entry.derivativeSha256 !== "string"
      || typeof entry.pageCount !== "number"
      || !Number.isInteger(entry.pageCount)
      || entry.pageCount < 1
      || !/^[a-f0-9]{64}$/.test(entry.itemJsonSha256)
      || !/^[a-f0-9]{64}$/.test(entry.derivativeSha256)) {
      throw new Error(`LOC cache manifest documents[${index}] is malformed`);
    }
    return entry as LocSourceCacheManifestV1["documents"][number];
  });
  if (new Set(documents.map((entry) => entry.documentId)).size !== documents.length) {
    throw new Error("LOC cache manifest has duplicate document IDs");
  }
  return {
    schemaVersion: locSourceCacheSchemaVersion,
    cacheVersion: root.cacheVersion,
    sourceAccessedAt: root.sourceAccessedAt,
    documents,
  } as LocSourceCacheManifestV1;
}

function assertInside(root: string, path: string, label: string): void {
  const relativePath = relative(root, path);
  if (!relativePath || relativePath.startsWith("..") || resolve(root, relativePath) !== path) {
    throw new Error(`${label} escapes its verified root`);
  }
}

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}
