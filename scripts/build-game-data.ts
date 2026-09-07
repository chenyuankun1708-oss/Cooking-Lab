import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { buildGameData } from "@/lib/game-data-build";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";

const data = loadCanonicalGameData();
const result = buildGameData({
  recipes: data.recipes,
  ingredients: data.ingredients,
  operations: gameOperationCatalog,
  rightsRegistry: data.rightsRegistry,
  now: "2026-09-08",
});
process.stdout.write(`Built ${result.manifest.recipeCount} game recipes at ${result.outputDirectory}.\n`);
