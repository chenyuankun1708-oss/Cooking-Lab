import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import {
  GameDataSchemaError,
  parseGameIngredientCatalog,
  parseGameOperationCatalog,
  parseGameRecipe,
  parseGameRightsRegistry,
} from "@/lib/game-data-runtime-schema";
import { stableJson } from "@/lib/stable-json";

describe("M12 fail-closed runtime schemas", () => {
  const canonical = loadCanonicalGameData();

  it("accepts every committed canonical contract", () => {
    expect(() => canonical.recipes.forEach((recipe) => parseGameRecipe(recipe))).not.toThrow();
    expect(() => parseGameIngredientCatalog(canonical.ingredients)).not.toThrow();
    expect(() => parseGameRightsRegistry(canonical.rightsRegistry)).not.toThrow();
    expect(() => parseGameOperationCatalog({ version: "cooking-lab-game-operations-v1", operations: gameOperationCatalog })).not.toThrow();
  });

  it.each([
    ["unknown item type", (recipe: Record<string, unknown>) => { recipe.itemType = "invalid-runtime-enum"; }, "itemType"],
    ["unknown simulation profile", (recipe: Record<string, unknown>) => { recipe.simulationProfile = "unknown-engine"; }, "simulationProfile"],
    ["unknown yield unit", (recipe: Record<string, unknown>) => { (recipe.yield as Record<string, unknown>).unit = "litres"; }, "yield.unit"],
    ["unknown authoring method", (recipe: Record<string, unknown>) => { (recipe.authoring as Record<string, unknown>).method = "opaque"; }, "authoring.method"],
    ["unexpected nested property", (recipe: Record<string, unknown>) => { (recipe.authoring as Record<string, unknown>).invented = true; }, "authoring.invented"],
  ])("rejects hostile recipe JSON: %s", (_label, mutate, expectedPath) => {
    const recipe = structuredClone(canonical.recipes[0]) as unknown as Record<string, unknown>;
    mutate(recipe);
    expect(() => parseGameRecipe(recipe, "hostile.json")).toThrow(new RegExp(`hostile\\.json\\.${expectedPath.replace(".", "\\.")}`));
  });

  it("rejects malformed rights and operation catalog records before semantic audit", () => {
    const registry = structuredClone(canonical.rightsRegistry) as unknown as Record<string, unknown>;
    const governance = registry.governance as Record<string, unknown>;
    const classifications = governance.riskClassifications as Array<Record<string, unknown>>;
    classifications[0].level = "mostly-low";
    expect(() => parseGameRightsRegistry(registry, "rights.json")).toThrow(/rights\.json\.governance\.riskClassifications\[0\]\.level/);

    const operations = structuredClone(gameOperationCatalog) as unknown as Array<Record<string, unknown>>;
    operations[0].compatibility = "best-effort";
    expect(() => parseGameOperationCatalog({ version: "cooking-lab-game-operations-v1", operations }, "operations.json")).toThrow(/operations\.json\.operations\[0\]\.compatibility/);
  });

  it("loads files through the schemas and identifies the hostile file path", () => {
    const root = mkdtempSync(resolve(tmpdir(), "cooking-lab-runtime-schema-"));
    const sourceRoot = resolve(root, "game-data/source");
    mkdirSync(resolve(sourceRoot, "recipes"), { recursive: true });
    mkdirSync(resolve(root, "game-data/nutrition"), { recursive: true });
    const hostile = structuredClone(canonical.recipes[0]) as unknown as Record<string, unknown>;
    hostile.simulationProfile = "unknown-engine";
    writeFileSync(resolve(sourceRoot, "recipes/hostile.json"), stableJson(hostile));
    writeFileSync(resolve(sourceRoot, "ingredients.json"), stableJson(canonical.ingredients));
    writeFileSync(resolve(sourceRoot, "rights-registry.json"), stableJson(canonical.rightsRegistry));
    writeFileSync(resolve(root, "game-data/nutrition/usda-fooddata-central-subset.json"), stableJson(canonical.nutritionDataset));

    expect(() => loadCanonicalGameData(root)).toThrow(GameDataSchemaError);
    expect(() => loadCanonicalGameData(root)).toThrow(/recipes\/hostile\.json\.simulationProfile/);
  });
});
