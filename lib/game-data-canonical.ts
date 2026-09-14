import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type {
  GameIngredientCatalogV1,
  GameNutritionDatasetSubsetV1,
  GameRecipeV1,
  GameRightsRegistryV1,
} from "@/types/game-recipe";
import type { GameNormalizationRegistryV1, GameSourceFactBundleV1 } from "@/types/game-source-facts";
import {
  GameDataSchemaError,
  parseGameIngredientCatalog,
  parseGameNutritionDataset,
  parseGameRecipe,
  parseGameRightsRegistry,
} from "@/lib/game-data-runtime-schema";
import { parseGameNormalizationRegistry, parseGameSourceFactBundle } from "@/lib/game-source-fact-runtime-schema";
import { parseLocSourceRegistry } from "@/lib/loc-recipe-ingestion";
import type { LocSourceRegistryV1 } from "@/types/loc-recipe-source";
import { parseLocSourceCacheManifest, type LocSourceCacheManifestV1 } from "@/lib/loc-source-cache";

export const gameDataSourceRoot = "game-data/source";

export interface CanonicalGameData {
  recipes: GameRecipeV1[];
  ingredients: GameIngredientCatalogV1;
  nutritionDataset: GameNutritionDatasetSubsetV1;
  rightsRegistry: GameRightsRegistryV1;
  normalizationRegistry?: GameNormalizationRegistryV1;
  sourceFactBundles: GameSourceFactBundleV1[];
  locSourceRegistry: LocSourceRegistryV1;
  locSourceCacheManifest?: LocSourceCacheManifestV1;
}

export function loadCanonicalGameData(root = process.cwd()): CanonicalGameData {
  const sourceRoot = resolve(root, gameDataSourceRoot);
  const recipeRoot = resolve(sourceRoot, "recipes");
  const recipes = readdirSync(recipeRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(resolve(recipeRoot, name), parseGameRecipe));
  const normalizationPath = resolve(root, "game-data/normalization/registry.json");
  const sourceFactRoot = resolve(root, "game-data/source-facts/recipes");
  const sourceCacheManifestPath = resolve(root, "game-data/source-facts/loc-cache-manifest.json");
  const hasNormalization = existsSync(normalizationPath);
  const hasSourceFacts = existsSync(sourceFactRoot);
  const hasSourceCacheManifest = existsSync(sourceCacheManifestPath);
  if (new Set([hasNormalization, hasSourceFacts, hasSourceCacheManifest]).size !== 1) {
    throw new GameDataSchemaError("game-data/normalization", "normalization registry, source-fact recipes and LOC cache manifest must be committed together");
  }
  const normalizationRegistry = hasNormalization
    ? readJson(normalizationPath, parseGameNormalizationRegistry)
    : undefined;
  const sourceFactBundles = hasSourceFacts
    ? readdirSync(sourceFactRoot)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => readJson(resolve(sourceFactRoot, name), parseGameSourceFactBundle))
    : [];
  return {
    recipes,
    ingredients: readJson(resolve(sourceRoot, "ingredients.json"), parseGameIngredientCatalog),
    nutritionDataset: readJson(
      resolve(root, "game-data/nutrition/usda-fooddata-central-subset.json"),
      parseGameNutritionDataset,
    ),
    rightsRegistry: readJson(resolve(sourceRoot, "rights-registry.json"), parseGameRightsRegistry),
    normalizationRegistry,
    sourceFactBundles,
    locSourceRegistry: readJson(resolve(root, "game-data/source-research/loc-sources.json"), parseLocSourceRegistry),
    locSourceCacheManifest: hasSourceCacheManifest
      ? readJson(sourceCacheManifestPath, parseLocSourceCacheManifest)
      : undefined,
  };
}

export function sha256(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function readJson<T>(path: string, parse: (value: unknown, path: string) => T): T {
  try {
    return parse(JSON.parse(readFileSync(path, "utf8")) as unknown, path);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new GameDataSchemaError(path, `invalid JSON: ${error.message}`);
    }
    throw error;
  }
}
