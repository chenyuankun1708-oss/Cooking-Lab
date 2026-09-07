import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type {
  GameIngredientCatalogV1,
  GameNutritionDatasetSubsetV1,
  GameRecipeV1,
  GameRightsRegistryV1,
} from "@/types/game-recipe";
import {
  GameDataSchemaError,
  parseGameIngredientCatalog,
  parseGameNutritionDataset,
  parseGameRecipe,
  parseGameRightsRegistry,
} from "@/lib/game-data-runtime-schema";

export const gameDataSourceRoot = "game-data/source";

export interface CanonicalGameData {
  recipes: GameRecipeV1[];
  ingredients: GameIngredientCatalogV1;
  nutritionDataset: GameNutritionDatasetSubsetV1;
  rightsRegistry: GameRightsRegistryV1;
}

export function loadCanonicalGameData(root = process.cwd()): CanonicalGameData {
  const sourceRoot = resolve(root, gameDataSourceRoot);
  const recipeRoot = resolve(sourceRoot, "recipes");
  const recipes = readdirSync(recipeRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(resolve(recipeRoot, name), parseGameRecipe));
  return {
    recipes,
    ingredients: readJson(resolve(sourceRoot, "ingredients.json"), parseGameIngredientCatalog),
    nutritionDataset: readJson(
      resolve(root, "game-data/nutrition/usda-fooddata-central-subset.json"),
      parseGameNutritionDataset,
    ),
    rightsRegistry: readJson(resolve(sourceRoot, "rights-registry.json"), parseGameRightsRegistry),
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
