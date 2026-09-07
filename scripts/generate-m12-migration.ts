import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingredients } from "@/data/ingredients";
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
import type { GameRightsRegistryV1 } from "@/types/game-recipe";

const root = process.cwd();
const sourceRoot = resolve(root, "game-data/source");
const recipeRoot = resolve(sourceRoot, "recipes");
mkdirSync(recipeRoot, { recursive: true });

const items = getPublishedCulinaryItems();
const catalog = createMigrationIngredientCatalog(items, ingredients);
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
  researchRecords: [],
  governance: {
    policyVersion: "m12-game-publishing-v1",
    attestations: [],
    riskClassifications: [],
    samplingBatches: [],
  },
};

writeFileSync(resolve(sourceRoot, "ingredients.json"), stableJson(catalog));
writeFileSync(resolve(sourceRoot, "rights-registry.json"), stableJson(rightsRegistry));
for (const recipe of recipes) {
  writeFileSync(resolve(recipeRoot, `${recipe.recipeId}.json`), stableJson(recipe));
}

process.stdout.write(`Generated ${recipes.length} draft GameRecipeV1 files.\n`);
