import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchLocSourceCache } from "@/lib/loc-source-cache";

const repositoryRoot = process.cwd();
const registryPath = resolve(repositoryRoot, "game-data/source-research/loc-sources.json");
const cacheRoot = resolve(repositoryRoot, ".local/game-data/source-cache/loc");
const registry = JSON.parse(readFileSync(registryPath, "utf8")) as unknown;

async function main(): Promise<void> {
  const result = await fetchLocSourceCache(registry, { cacheRoot });
  process.stdout.write([
    "# LOC source cache",
    `Verified source documents: ${result.manifest.documents.length}`,
    `Cache version: ${result.manifest.cacheVersion}`,
    `Cache directory: ${result.cacheDirectory}`,
    "The cache is local-only and is not canonical game recipe data.",
    "",
  ].join("\n"));
}

void main();
