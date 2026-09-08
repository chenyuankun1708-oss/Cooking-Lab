import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { buildGameData } from "@/lib/game-data-build";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import { getContentRightsEvaluationDate } from "@/lib/content-rights";

const data = loadCanonicalGameData();
const result = buildGameData({
  recipes: data.recipes,
  ingredients: data.ingredients,
  nutritionDataset: data.nutritionDataset,
  operations: gameOperationCatalog,
  rightsRegistry: data.rightsRegistry,
  normalizationRegistry: data.normalizationRegistry,
  sourceFactBundles: data.sourceFactBundles,
  locSourceRegistry: data.locSourceRegistry,
  now: getContentRightsEvaluationDate(),
});
process.stdout.write(`Built ${result.manifest.recipeCount} game recipes at ${result.outputDirectory}.\n`);
