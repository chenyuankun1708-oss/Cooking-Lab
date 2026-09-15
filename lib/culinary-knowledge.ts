import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  parseCulinaryKnowledgeManifest,
  parseCulinaryKnowledgeSnapshot,
  parseCulinaryKnowledgeSource,
  parseGameArtifactPath,
} from "@/lib/culinary-knowledge-runtime-schema";
import { sha256 } from "@/lib/game-data-canonical";
import { stableJson } from "@/lib/stable-json";
import {
  culinaryKnowledgeManifestSchemaId,
  culinaryKnowledgeSnapshotSchemaId,
  type CulinaryKnowledgeManifestV1,
  type CulinaryKnowledgeSnapshotV1,
  type CulinaryKnowledgeSourceFileV1,
  type CulinaryKnowledgeSourceV1,
} from "@/types/culinary-knowledge";

export const culinaryKnowledgeSourcePath = "game-data/culinary-knowledge/goal17-source.json";
export const culinaryKnowledgeSnapshotPath = ".local/game-data/culinary-knowledge/goal17-snapshot.json";
export const culinaryKnowledgeManifestPath = ".local/game-data/culinary-knowledge/goal17-manifest.json";
export const culinaryKnowledgeCompilerVersion = "cooking-lab-goal17-culinary-knowledge-compiler-v1";

export function compileCulinaryKnowledgeSnapshot(
  source: CulinaryKnowledgeSourceV1,
  sourcePath = culinaryKnowledgeSourcePath,
): { snapshot: CulinaryKnowledgeSnapshotV1; manifest: CulinaryKnowledgeManifestV1 } {
  const normalizedSource = normalizeNumbers(
    parseCulinaryKnowledgeSource(source),
  ) as CulinaryKnowledgeSourceV1;
  const sourceSha256 = sha256(stableJson(normalizedSource));
  const compiledSnapshotId = `ck-goal17-${createHash("sha256").update(`${source.snapshotId}:${sourceSha256}:${culinaryKnowledgeCompilerVersion}`).digest("hex").slice(0, 16)}`;
  const snapshot: CulinaryKnowledgeSnapshotV1 = {
    ...normalizedSource,
    schemaId: culinaryKnowledgeSnapshotSchemaId,
    compiledSnapshotId,
    sourceSha256,
  };
  const snapshotSha256 = sha256(stableJson(snapshot));
  const result: {
    snapshot: CulinaryKnowledgeSnapshotV1;
    manifest: CulinaryKnowledgeManifestV1;
  } = {
    snapshot,
    manifest: {
      schemaId: culinaryKnowledgeManifestSchemaId,
      schemaVersion: 1,
      snapshotId: source.snapshotId,
      sourcePath,
      sourceSha256,
      compiledSnapshotPath: culinaryKnowledgeSnapshotPath,
      compiledSnapshotSha256: snapshotSha256,
      sourceRevision: source.sourceRevision,
      sourceFiles: source.sourceFiles,
      counts: {
        ingredientStates: source.ingredientStates.length,
        ingredientKnowledge: source.ingredientKnowledge.length,
        seasonings: source.seasonings.length,
        transformationRules: source.transformationRules.length,
        flavorRelations: source.flavorRelations.length,
        dishArchetypes: source.dishArchetypes.length,
        cuisines: source.cuisines.length,
        platingComponents: source.platingComponents.length,
        engineCapabilities: source.engineCapabilities.length,
        commentaryEvidence: source.commentaryEvidence.length,
      },
    },
  };
  parseCulinaryKnowledgeSnapshot(result.snapshot);
  parseCulinaryKnowledgeManifest(result.manifest);
  return result;
}

export function compileCulinaryKnowledgeFiles(root = process.cwd()) {
  const source = parseCulinaryKnowledgeSource(
    JSON.parse(readFileSync(resolve(root, culinaryKnowledgeSourcePath), "utf8")) as unknown,
    culinaryKnowledgeSourcePath,
  );
  assertSourceFileHashes(source.sourceFiles, root);
  const { snapshot, manifest } = compileCulinaryKnowledgeSnapshot(source);
  writeStableJson(resolve(root, culinaryKnowledgeSnapshotPath), snapshot);
  writeStableJson(resolve(root, culinaryKnowledgeManifestPath), manifest);
  return { source, snapshot, manifest };
}

export function assertSourceFileHashes(sourceFiles: readonly CulinaryKnowledgeSourceFileV1[], root = process.cwd()): void {
  const seenPaths = new Set<string>();
  for (const sourceFile of sourceFiles) {
    parseGameArtifactPath(sourceFile.path, `sourceFiles.${sourceFile.path}.path`);
    if (seenPaths.has(sourceFile.path)) throw new Error(`duplicate source file path: ${sourceFile.path}`);
    seenPaths.add(sourceFile.path);
    const absolutePath = resolve(root, sourceFile.path);
    if (!existsSync(absolutePath)) throw new Error(`source file missing: ${sourceFile.path}`);
    const actual = sha256(readFileSync(absolutePath));
    if (actual !== sourceFile.sha256) {
      throw new Error(`source hash mismatch for ${sourceFile.path}: expected ${sourceFile.sha256}, got ${actual}`);
    }
  }
}

function writeStableJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stableJson(value));
}

function normalizeNumbers(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeNumbers);
  if (!value || typeof value !== "object") {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error("non-finite number cannot be canonicalized");
      return Number(value.toFixed(6));
    }
    return value;
  }
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeNumbers(entry)]));
}
