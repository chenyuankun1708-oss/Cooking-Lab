import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import {
  GameDataSchemaError,
  parseGameDataManifest,
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
    governance.riskClassifications = [{
      id: "hostile-classification",
      itemId: "hostile-item",
      artifactSetVersion: "hostile-version",
      level: "mostly-low",
      reasonCodes: ["clear-first-party-or-reference-only-rights"],
      equivalenceClassKeys: ["hostile:key"],
      policyVersion: "hostile-policy",
      classifiedAt: "2026-09-08",
    }];
    expect(() => parseGameRightsRegistry(registry, "rights.json")).toThrow(/rights\.json\.governance\.riskClassifications\[0\]\.level/);

    const operations = structuredClone(gameOperationCatalog) as unknown as Array<Record<string, unknown>>;
    operations[0].compatibility = "best-effort";
    expect(() => parseGameOperationCatalog({ version: "cooking-lab-game-operations-v1", operations }, "operations.json")).toThrow(/operations\.json\.operations\[0\]\.compatibility/);
  });

  it.each([
    ["absolute path", "/tmp/recipes.json"],
    ["parent traversal", "godot/../rights.json"],
    ["portable parent traversal", "godot\\..\\rights.json"],
  ])("rejects manifest artifact %s", (_label, hostilePath) => {
    const manifest = {
      schemaVersion: "cooking-lab-game-manifest-v1",
      catalogVersion: "fixture",
      generatorVersion: "fixture",
      minimumAdapterVersion: "fixture",
      recipeCount: 1,
      recipes: [{ recipeId: "fixture", path: hostilePath, sha256: "hash", artifactVersion: "v1", simulationProfile: "data-only" }],
      ingredientCatalog: { path: "godot/ingredients.json", sha256: "hash" },
      nutritionDataset: { path: "nutrition-dataset.json", sha256: "hash", schemaVersion: "cooking-lab-usda-subset-v1", provider: "USDA FoodData Central", upstreamArchives: [] },
      operationCatalog: { path: "godot/operations.json", sha256: "hash", version: "cooking-lab-game-operations-v1" },
      rightsRegistry: { path: "rights-registry.json", sha256: "hash", version: "cooking-lab-game-rights-v1" },
      attribution: { path: "attribution.json", sha256: "hash" },
      sqlite: { path: "game-data.sqlite", sha256: "hash" },
    };
    expect(() => parseGameDataManifest(manifest, "manifest.json")).toThrow(/manifest\.json\.recipes\[0\]\.path/);
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
