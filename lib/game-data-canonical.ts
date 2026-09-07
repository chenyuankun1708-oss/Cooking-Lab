import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type {
  GameIngredientCatalogV1,
  GameRecipeV1,
  GameRightsRegistryV1,
} from "@/types/game-recipe";

export const gameDataSourceRoot = "game-data/source";

export interface CanonicalGameData {
  recipes: GameRecipeV1[];
  ingredients: GameIngredientCatalogV1;
  rightsRegistry: GameRightsRegistryV1;
}

export function loadCanonicalGameData(root = process.cwd()): CanonicalGameData {
  const sourceRoot = resolve(root, gameDataSourceRoot);
  const recipeRoot = resolve(sourceRoot, "recipes");
  const recipes = readdirSync(recipeRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson<GameRecipeV1>(resolve(recipeRoot, name)));
  return {
    recipes,
    ingredients: readJson<GameIngredientCatalogV1>(resolve(sourceRoot, "ingredients.json")),
    rightsRegistry: readJson<GameRightsRegistryV1>(resolve(sourceRoot, "rights-registry.json")),
  };
}

export function sha256(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
