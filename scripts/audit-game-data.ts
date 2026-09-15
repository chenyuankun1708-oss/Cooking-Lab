import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import { evaluateGameRecipeCorpus } from "@/lib/game-recipe-validation";
import { getContentRightsEvaluationDate } from "@/lib/content-rights";

const data = loadCanonicalGameData();
const result = evaluateGameRecipeCorpus(data.recipes, {
  operations: gameOperationCatalog,
  ingredients: data.ingredients,
  nutritionDataset: data.nutritionDataset,
  rightsRegistry: data.rightsRegistry,
  normalizationRegistry: data.normalizationRegistry,
  sourceFactBundles: data.sourceFactBundles,
  locSourceRegistry: data.locSourceRegistry,
  locSourceCacheManifest: data.locSourceCacheManifest,
  now: getContentRightsEvaluationDate(),
});
const minimumArgument = process.argv.find((argument) => argument.startsWith("--minimum-exportable="));
const minimumExportable = minimumArgument ? Number(minimumArgument.split("=")[1]) : 0;
const minimumDatabaseArgument = process.argv.find((argument) => argument.startsWith("--minimum-database="));
const minimumDatabase = minimumDatabaseArgument ? Number(minimumDatabaseArgument.split("=")[1]) : 0;

process.stdout.write([
  "# Game data source audit",
  `Canonical recipes: ${result.recipeCount}`,
  `Database entries: ${result.databaseEntryCount}`,
  `Exportable recipes: ${result.exportableCount}`,
  `Structural or governance issues: ${result.issues.length}`,
  `Minimum database target: ${minimumDatabase}`,
  `Minimum exportable target: ${minimumExportable}`,
  "",
].join("\n"));

if (result.issues.length) {
  process.stderr.write(`${result.issues.map((issue) => `${issue.code}:${issue.recipeId}:${issue.field}`).join("\n")}\n`);
  process.exitCode = 1;
}
if (!Number.isInteger(minimumExportable) || minimumExportable < 0 || result.exportableCount < minimumExportable) {
  process.stderr.write(`Game export target not met: ${result.exportableCount} < ${minimumExportable}\n`);
  process.exitCode = 1;
}
if (!Number.isInteger(minimumDatabase) || minimumDatabase < 0 || result.databaseEntryCount < minimumDatabase) {
  process.stderr.write(`Recipe database target not met: ${result.databaseEntryCount} < ${minimumDatabase}\n`);
  process.exitCode = 1;
}
