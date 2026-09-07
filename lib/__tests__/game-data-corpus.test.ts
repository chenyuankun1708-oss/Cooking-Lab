import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getPublishedCulinaryItems, getPublishedCulinaryItemBySlug } from "@/data/published-culinary-items";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import { evaluateGameRecipeCorpus } from "@/lib/game-recipe-validation";
import { stableJson } from "@/lib/stable-json";

describe("M12-M13 canonical game corpus", () => {
  const data = loadCanonicalGameData();
  const webItems = getPublishedCulinaryItems();
  const migrated = data.recipes.filter((recipe) => recipe.sourceCulinaryItemId);
  const gameOnly = data.recipes.filter((recipe) => !recipe.sourceCulinaryItemId);

  it("keeps the 50-item Web library isolated from 510 game-only recipes", () => {
    expect(webItems).toHaveLength(50);
    expect(migrated).toHaveLength(50);
    expect(gameOnly).toHaveLength(510);
    expect(data.recipes).toHaveLength(560);
    expect(gameOnly.every((recipe) => getPublishedCulinaryItemBySlug(recipe.slug) === undefined)).toBe(true);
  });

  it("matches the locked M13 type and formula composition", () => {
    expect(gameOnly.filter((recipe) => recipe.itemType === "dish")).toHaveLength(260);
    expect(gameOnly.filter((recipe) => recipe.itemType === "dessert")).toHaveLength(100);
    expect(gameOnly.filter((recipe) => recipe.itemType === "tea")).toHaveLength(50);
    expect(gameOnly.filter((recipe) => recipe.itemType === "coffee")).toHaveLength(40);
    expect(gameOnly.filter((recipe) => recipe.itemType === "non-alcoholic-drink")).toHaveLength(60);
    expect(gameOnly.filter((recipe) => recipe.itemType === "alcoholic-drink")).toHaveLength(0);
  });

  it("passes structural, numerical, DAG, nutrition and mutation validation while remaining draft before review", () => {
    const result = evaluateGameRecipeCorpus(data.recipes, {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-08",
    });
    expect(result.issues).toEqual([]);
    expect(result.recipeCount).toBe(560);
    expect(result.exportableCount).toBe(0);
    expect(result.ready).toBe(false);
    expect(gameOnly.every((recipe) => recipe.scenarios.length > 0)).toBe(true);
    expect(gameOnly.every((recipe) => recipe.authoring.containsGeneratedExpression === false)).toBe(true);
  });

  it("keeps allowed substitutions catalog-backed, non-identical and nutrition-aware", () => {
    const ingredientIds = new Set(data.ingredients.ingredients.map((ingredient) => ingredient.ingredientId));
    const substitutions = gameOnly.flatMap((recipe) => recipe.scenarios
      .filter((scenario) => scenario.mutation.type === "allowed-substitution")
      .map((scenario) => ({ recipe, scenario })));

    expect(substitutions.length).toBeGreaterThan(0);
    for (const { recipe, scenario } of substitutions) {
      const target = recipe.ingredientPortions.find((portion) => portion.portionId === scenario.mutation.targetPortionId);
      expect(target).toBeDefined();
      expect(ingredientIds.has(scenario.mutation.replacementIngredientId ?? "")).toBe(true);
      expect(scenario.mutation.replacementIngredientId).not.toBe(target?.ingredientId);
      expect(scenario.nutritionEffect).toBe("recalculate-from-quantities");
    }
  });

  it("uses ingredient-aware base cooking and root-vegetable preparation", () => {
    const brownRice = gameOnly.find((recipe) => recipe.recipeId.startsWith("game-bowl-brown-rice-"));
    const pasta = gameOnly.find((recipe) => recipe.recipeId.startsWith("game-bowl-pasta-dry-"));
    const potato = gameOnly.find((recipe) => recipe.recipeId.endsWith("-potato"));
    if (!brownRice || !pasta || !potato) throw new Error("Expected corpus fixtures are missing");

    expect(brownRice.operationGraph.nodes.find((node) => node.operationType === "simmer")?.waitDurationMs).toBe(35 * 60_000);
    expect(pasta.operationGraph.nodes.find((node) => node.operationType === "boil")?.waitDurationMs).toBe(10 * 60_000);
    expect(potato.operationGraph.nodes.filter((node) => node.operationType === "boil")).toHaveLength(1);
    expect(potato.operationGraph.nodes.some((node) => node.operationType === "dice")).toBe(true);
  });

  it("stores canonical JSON with deterministic key order and terminal newline", () => {
    const recipeRoot = resolve(process.cwd(), "game-data/source/recipes");
    for (const name of readdirSync(recipeRoot).filter((entry) => entry.endsWith(".json"))) {
      const content = readFileSync(resolve(recipeRoot, name), "utf8");
      expect(content).toBe(stableJson(JSON.parse(content)));
    }
    for (const path of ["game-data/source/ingredients.json", "game-data/source/rights-registry.json", "game-data/nutrition/usda-fooddata-central-subset.json"]) {
      const content = readFileSync(resolve(process.cwd(), path), "utf8");
      expect(content).toBe(stableJson(JSON.parse(content)));
    }
  });

  it("does not let app, components or Web repositories import game data", () => {
    const roots = ["app", "components", "data"];
    const offenders: string[] = [];
    for (const root of roots) scan(resolve(process.cwd(), root), offenders);
    expect(offenders).toEqual([]);
  });
});

function scan(root: string, offenders: string[]) {
  for (const name of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, name.name);
    if (name.isDirectory()) scan(path, offenders);
    else if (/\.(?:ts|tsx|js|jsx)$/.test(name.name)) {
      const content = readFileSync(path, "utf8");
      if (/from\s+["'][^"']*(?:game-data|game-recipe)|require\(["'][^"']*(?:game-data|game-recipe)/.test(content)) {
        offenders.push(path);
      }
    }
  }
}
