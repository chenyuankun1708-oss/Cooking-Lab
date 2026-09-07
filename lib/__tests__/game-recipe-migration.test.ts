import { describe, expect, it } from "vitest";
import { ingredients } from "@/data/ingredients";
import {
  contentRightsRegistry,
  getPublishedCulinaryItems,
  publishingGovernanceRegistry,
} from "@/data/published-culinary-items";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import {
  createMigrationIngredientCatalog,
  migratePublishedItemToGameRecipe,
} from "@/lib/game-recipe-migration";
import { evaluateGameRecipeCorpus } from "@/lib/game-recipe-validation";

describe("M12 deterministic migration", () => {
  const items = getPublishedCulinaryItems();
  const catalog = createMigrationIngredientCatalog(items, ingredients);
  const recipes = items.map((item) => migratePublishedItemToGameRecipe(item, {
    ingredients,
    rightsRegistry: contentRightsRegistry,
    governanceRegistry: publishingGovernanceRegistry,
  }));

  it("migrates the current 50 without changing their web publication state", () => {
    expect(items).toHaveLength(50);
    expect(recipes).toHaveLength(50);
    expect(new Set(recipes.map((recipe) => recipe.recipeId)).size).toBe(50);
    expect(recipes.every((recipe) => recipe.eligibility === "draft")).toBe(true);
    expect(recipes.every((recipe) => recipe.authoring.containsGeneratedExpression === false)).toBe(true);
  });

  it("produces quantified portions, acyclic operations and deterministic mistake scenarios", () => {
    const result = evaluateGameRecipeCorpus(recipes, {
      operations: gameOperationCatalog,
      ingredients: catalog,
      now: "2026-09-08",
    });

    expect(result.ready).toBe(false);
    expect(result.exportableCount).toBe(0);
    expect(result.issues).toEqual([]);
    expect(recipes.every((recipe) => recipe.ingredientPortions.every((portion) => portion.massG > 0))).toBe(true);
    expect(recipes.every((recipe) => recipe.operationGraph.nodes.length > 0)).toBe(true);
    expect(recipes.every((recipe) => recipe.operationGraph.nodes
      .filter((node) => node.criticality !== "completion")
      .every((node) => recipe.scenarios.some((scenario) => scenario.mutation.targetNodeId === node.nodeId)))).toBe(true);
  });

  it("keeps demo nutrition visibly non-exportable", () => {
    expect(catalog.ingredients.every((ingredient) => ingredient.nutritionSource.kind === "migration-estimate")).toBe(true);
    expect(() => evaluateGameRecipeCorpus([{ ...recipes[0], eligibility: "exportable" }], {
      operations: gameOperationCatalog,
      ingredients: catalog,
      now: "2026-09-08",
    })).not.toThrow();
    const result = evaluateGameRecipeCorpus([{ ...recipes[0], eligibility: "exportable" }], {
      operations: gameOperationCatalog,
      ingredients: catalog,
      now: "2026-09-08",
    });
    expect(result.issues.some((issue) => issue.code === "invalid-nutrition")).toBe(true);
    expect(result.issues.some((issue) => issue.field === "rightsRegistry")).toBe(true);
  });
});
