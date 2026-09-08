import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestLocRecipeSources } from "@/lib/loc-recipe-ingestion";
import { loadLatestLocSourceCache } from "@/lib/loc-source-cache";
import { stableJson } from "@/lib/stable-json";

const ocrDirectoryArgument = process.argv.find((argument) => argument.startsWith("--ocr-dir="));

const repositoryRoot = process.cwd();
const registryPath = resolve(repositoryRoot, "game-data/source-research/loc-sources.json");
const outputPath = resolve(repositoryRoot, ".local/game-data/source-research/loc-candidates.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8")) as unknown;
const input = ocrDirectoryArgument
  ? { ocrDirectory: resolve(ocrDirectoryArgument.slice("--ocr-dir=".length)) }
  : loadLatestLocSourceCache(registry, {
      cacheRoot: resolve(repositoryRoot, ".local/game-data/source-cache/loc"),
    });
const batch = "ocrDirectory" in input
  ? ingestLocRecipeSources(registry, { ocrDirectory: input.ocrDirectory })
  : ingestLocRecipeSources(registry, { ocrFilesByDocumentId: input.ocrFilesByDocumentId });

mkdirSync(resolve(outputPath, ".."), { recursive: true });
writeFileSync(outputPath, stableJson(batch));

process.stdout.write([
  "# LOC recipe candidate ingestion",
  `Source documents: ${batch.sourceDocumentCount}`,
  `Cross-checked draft candidates: ${batch.candidateCount}`,
  `Extraction-usable candidates: ${batch.normalizationEligibleCount}`,
  `High-risk blocks filtered: ${batch.rejectedHighRisk.length}`,
  `Output: ${outputPath}`,
  "All candidates remain draft-research-only and are not export eligible.",
  "",
].join("\n"));
