import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingredients } from "@/data/ingredients";
import { createGameIngredientCatalogFromUsdaSubset } from "@/game-data/corpus-generator";
import {
  contentRightsRegistry,
  getPublishedCulinaryItems,
  publishingGovernanceRegistry,
} from "@/data/published-culinary-items";
import {
  createMigrationIngredientCatalog,
  migratePublishedItemToGameRecipe,
} from "@/lib/game-recipe-migration";
import { stableJson } from "@/lib/stable-json";
import { parseGameIngredientCatalog, parseGameRecipe, parseGameRightsRegistry } from "@/lib/game-data-runtime-schema";
import type { GameNutritionDatasetSubsetV1, GameRightsRegistryV1 } from "@/types/game-recipe";

const root = process.cwd();
const sourceRoot = resolve(root, "game-data/source");
const recipeRoot = resolve(sourceRoot, "recipes");

const items = getPublishedCulinaryItems();
const migrationCatalog = createMigrationIngredientCatalog(items, ingredients);
const subset = JSON.parse(readFileSync(
  resolve(root, "game-data/nutrition/usda-fooddata-central-subset.json"),
  "utf8",
)) as GameNutritionDatasetSubsetV1;
const catalog = createGameIngredientCatalogFromUsdaSubset(subset, migrationCatalog);
const recipes = items.map((item) => migratePublishedItemToGameRecipe(item, {
  ingredients,
  rightsRegistry: contentRightsRegistry,
  governanceRegistry: publishingGovernanceRegistry,
}));
const rightsRegistry: GameRightsRegistryV1 = {
  schemaVersion: "cooking-lab-game-rights-v1",
  policyVersion: "m12-game-publishing-v1",
  artifacts: [],
  assessments: [],
  attributions: [],
  decisions: [],
  sources: [],
  evidence: [],
  evidenceOrigins: [],
  sourceRoles: [],
  researchRecords: [],
  governance: {
    policyVersion: "m12-game-publishing-v1",
    attestations: [],
    riskClassifications: [],
    samplingBatches: [],
  },
};

const serializedCatalog = stableJson(catalog);
const serializedRegistry = stableJson(rightsRegistry);
parseGameIngredientCatalog(JSON.parse(serializedCatalog), "generated ingredients");
parseGameRightsRegistry(JSON.parse(serializedRegistry), "generated rights registry");

const localRoot = resolve(root, ".local");
mkdirSync(localRoot, { recursive: true });
const stagingRoot = mkdtempSync(resolve(localRoot, "m12-migration-"));
const stagingRecipes = resolve(stagingRoot, "recipes");
mkdirSync(stagingRecipes);
try {
  for (const recipe of recipes) {
    const serialized = stableJson(recipe);
    parseGameRecipe(JSON.parse(serialized), `generated recipe ${recipe.recipeId}`);
    writeFileSync(resolve(stagingRecipes, `${recipe.recipeId}.json`), serialized);
  }

  mkdirSync(sourceRoot, { recursive: true });
  replaceDirectory(recipeRoot, stagingRecipes);
  writeAtomicFile(resolve(sourceRoot, "ingredients.json"), serializedCatalog);
  writeAtomicFile(resolve(sourceRoot, "rights-registry.json"), serializedRegistry);
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}

process.stdout.write(`Generated ${recipes.length} draft GameRecipeV1 files.\n`);

function replaceDirectory(target: string, prepared: string): void {
  const backup = `${target}.backup-${process.pid}`;
  rmSync(backup, { recursive: true, force: true });
  let movedOriginal = false;
  try {
    try {
      renameSync(target, backup);
      movedOriginal = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    renameSync(prepared, target);
    if (movedOriginal) rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    rmSync(target, { recursive: true, force: true });
    if (movedOriginal) renameSync(backup, target);
    throw error;
  }
}

function writeAtomicFile(target: string, content: string): void {
  const temporary = `${target}.tmp-${process.pid}`;
  writeFileSync(temporary, content);
  renameSync(temporary, target);
}
