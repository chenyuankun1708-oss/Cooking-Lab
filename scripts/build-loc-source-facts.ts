import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { assertSafeGameDataOutputDirectory } from "@/lib/game-data-build";
import { createContentVersion } from "@/lib/content-version";
import { evaluateGameSourceFactBundle } from "@/lib/game-source-fact-validation";
import { ingestLocRecipeSources, parseLocSourceRegistry } from "@/lib/loc-recipe-ingestion";
import { createLocSourceFactBundle, locSourceFactCompilerVersion } from "@/lib/loc-source-fact-bundles";
import { loadLatestLocSourceCache } from "@/lib/loc-source-cache";
import { stableJson } from "@/lib/stable-json";
import { gameNormalizationRegistrySchemaVersion, type GameNormalizationRegistryV1 } from "@/types/game-source-facts";

const repositoryRoot = process.cwd();
const registryPath = resolve(repositoryRoot, "game-data/source-research/loc-sources.json");
const cacheRoot = resolve(repositoryRoot, ".local/game-data/source-cache/loc");
const outputRoot = resolve(repositoryRoot, ".local/game-data/source-facts/loc");
const allowedOutputParent = resolve(repositoryRoot, ".local/game-data/source-facts");
const registry = parseLocSourceRegistry(JSON.parse(readFileSync(registryPath, "utf8")) as unknown);
const cache = loadLatestLocSourceCache(registry, { cacheRoot });
const candidates = ingestLocRecipeSources(registry, { ocrFilesByDocumentId: cache.ocrFilesByDocumentId });
const bundles = candidates.candidates
  .filter((candidate) => candidate.extractionQuality.status === "usable")
  .map((candidate) => createLocSourceFactBundle(candidate, {
    sourceRegistry: registry,
    sourceCacheVersion: cache.manifest.cacheVersion,
  }))
  .sort((left, right) => left.bundleId.localeCompare(right.bundleId));
const emptyRegistry: GameNormalizationRegistryV1 = {
  schemaVersion: gameNormalizationRegistrySchemaVersion,
  policyVersion: "m13-normalization-registry-pending-v1",
  ingredientAliases: [],
  operationRules: [],
  equipmentRules: [],
  heatDescriptors: [],
  targetStateRules: [],
  mutationRules: [],
};

for (const bundle of bundles) {
  const issues = evaluateGameSourceFactBundle(bundle, emptyRegistry);
  if (issues.length) throw new Error(`Source fact bundle ${bundle.bundleId} failed validation: ${issues.map((issue) => `${issue.code}:${issue.field}`).join(", ")}`);
}

assertSafeGameDataOutputDirectory(outputRoot);
mkdirSync(allowedOutputParent, { recursive: true });
const staging = mkdtempSync(resolve(allowedOutputParent, ".loc-staging-"));
try {
  const recipesRoot = resolve(staging, "recipes");
  mkdirSync(recipesRoot);
  const entries = bundles.map((bundle) => {
    const path = `recipes/${bundle.bundleId}.json`;
    const content = stableJson(bundle);
    writeFileSync(resolve(staging, path), content, { flag: "wx" });
    return { bundleId: bundle.bundleId, bundleVersion: bundle.bundleVersion, path, sha256: sha256(content) };
  });
  const manifest = {
    schemaVersion: "cooking-lab-source-fact-manifest-v1",
    compilerVersion: locSourceFactCompilerVersion,
    sourceRegistryCatalogVersion: createContentVersion(registry),
    sourceCacheVersion: cache.manifest.cacheVersion,
    sourceCacheManifestSha256: sha256(stableJson(cache.manifest)),
    sourceDocumentCount: cache.manifest.documents.length,
    discoveryCandidateCount: candidates.candidateCount,
    sourceFactBundleCount: bundles.length,
    entries,
  } as const;
  writeFileSync(resolve(staging, "loc-cache-manifest.json"), stableJson(cache.manifest), { flag: "wx" });
  writeFileSync(resolve(staging, "manifest.json"), stableJson(manifest), { flag: "wx" });
  if (existsSync(outputRoot)) rmSync(outputRoot, { recursive: true });
  renameSync(staging, outputRoot);

  process.stdout.write([
    "# LOC source fact bundle build",
    `Verified source documents: ${manifest.sourceDocumentCount}`,
    `Discovery candidates: ${manifest.discoveryCandidateCount}`,
    `Draft source fact bundles: ${manifest.sourceFactBundleCount}`,
    `Output: ${outputRoot}`,
    "Bundles remain draft and cannot satisfy game-commercial-ready export without normalization, rights and independent review.",
    "",
  ].join("\n"));
} catch (error) {
  rmSync(staging, { force: true, recursive: true });
  throw error;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
