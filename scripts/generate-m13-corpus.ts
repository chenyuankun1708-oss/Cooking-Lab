import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createM13DraftCorpus } from "@/game-data/corpus-generator";
import { stableJson } from "@/lib/stable-json";
import type { GameIngredientCatalogV1, GameNutritionDatasetSubsetV1 } from "@/types/game-recipe";

const root = process.cwd();
const sourceRoot = resolve(root, "game-data/source");
const recipeRoot = resolve(sourceRoot, "recipes");
const loadedIngredients = JSON.parse(readFileSync(resolve(sourceRoot, "ingredients.json"), "utf8")) as GameIngredientCatalogV1;
const migrationIngredients: GameIngredientCatalogV1 = {
  ...loadedIngredients,
  catalogVersion: "m12-current-50-v1",
  ingredients: loadedIngredients.ingredients.filter((ingredient) => ingredient.nutritionSource.kind === "migration-estimate"),
};
const subset = JSON.parse(readFileSync(resolve(root, "game-data/nutrition/usda-fooddata-central-subset.json"), "utf8")) as GameNutritionDatasetSubsetV1;
const corpus = createM13DraftCorpus(subset, migrationIngredients);

for (const name of readdirSync(recipeRoot).filter((entry) => entry.startsWith("game-") && entry.endsWith(".json"))) {
  rmSync(resolve(recipeRoot, name));
}
for (const recipe of corpus.recipes) {
  writeFileSync(resolve(recipeRoot, `${recipe.recipeId}.json`), stableJson(recipe));
}
writeFileSync(resolve(sourceRoot, "ingredients.json"), stableJson(corpus.ingredients));
writeFileSync(resolve(sourceRoot, "rights-registry.json"), stableJson(corpus.rightsRegistry));

process.stdout.write(`Generated ${corpus.recipes.length} M13 draft recipes; Web migration files remain separate.\n`);
