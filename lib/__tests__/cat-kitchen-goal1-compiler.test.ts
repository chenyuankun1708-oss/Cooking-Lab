import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { compileCatKitchenGoal1Recipe } from "@/lib/cat-kitchen-goal1-compiler";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import type { GameIngredientCatalogV1, GameOperationNodeV1, GameRecipeV1 } from "@/types/game-recipe";

describe("Cat Kitchen Goal 1 compiler contract", () => {
  const canonical = loadCanonicalGameData();

  it("compiles a fully calibrated supported graph deterministically", () => {
    const sourceRecipe = structuredClone(canonical.recipes[0]);
    const sourcePortion = sourceRecipe.ingredientPortions[0];
    const portion = { ...sourcePortion, massG: 100 };
    const nodes: GameOperationNodeV1[] = [
      node("cut", "slice", [], [portion.portionId], { cutSizeMm: 10, uniformity: 0.8 }),
      node("add", "add", ["cut"], [portion.portionId], { quantityG: 100 }),
      node("heat", "set-heat", ["add"], [], { heatLevel: 0.6 }),
      node("stir", "stir", ["heat"], [], { strength: 0.7 }),
      node("serve", "serve", ["stir"], [], {}),
    ];
    const recipe = {
      ...sourceRecipe,
      simulationProfile: "cat-kitchen-goal1-v1",
      ingredientPortions: [portion],
      operationGraph: { nodes },
    } satisfies GameRecipeV1;
    const ingredients = calibratedCatalog(canonical.ingredients, portion.ingredientId);
    const first = compileCatKitchenGoal1Recipe(recipe, ingredients, gameOperationCatalog);
    const second = compileCatKitchenGoal1Recipe(recipe, ingredients, gameOperationCatalog);
    expect(second).toEqual(first);
    expect(first.commands.map((command) => command.action)).toEqual(["CUT", "ADD", "SET_HEAT", "STIR", "PLATE"]);
  });

  it("fails closed for every currently unprovable Goal 1 profile", () => {
    const claimedGoal1 = canonical.recipes.filter((recipe) => recipe.simulationProfile === "cat-kitchen-goal1-v1");
    expect(claimedGoal1.length).toBeGreaterThan(0);
    for (const recipe of claimedGoal1) {
      expect(() => compileCatKitchenGoal1Recipe(recipe, canonical.ingredients, gameOperationCatalog)).toThrow();
    }
  });

  it("never silently compiles an engine-v2 recipe", () => {
    const recipe = canonical.recipes.find((entry) => entry.simulationProfile === "requires-cat-kitchen-v2");
    expect(recipe).toBeDefined();
    expect(() => compileCatKitchenGoal1Recipe(recipe!, canonical.ingredients, gameOperationCatalog)).toThrow(/does not target the Goal 1 engine/);
  });
});

function node(
  nodeId: string,
  operationType: GameOperationNodeV1["operationType"],
  dependsOn: string[],
  inputPortionIds: string[],
  parameters: GameOperationNodeV1["parameters"],
): GameOperationNodeV1 {
  return {
    nodeId,
    operationType,
    dependsOn,
    inputPortionIds,
    outputStateIds: [`${nodeId}-out`],
    activeDurationMs: 1_000,
    waitDurationMs: 0,
    parameters,
    targetStates: [],
    criticality: nodeId === "serve" ? "completion" : "quality",
  };
}

function calibratedCatalog(source: GameIngredientCatalogV1, ingredientId: string): GameIngredientCatalogV1 {
  return {
    ...source,
    ingredients: source.ingredients.map((ingredient) => ingredient.ingredientId === ingredientId ? {
      ...ingredient,
      simulationProfile: {
        waterFraction: 0.5,
        fatFraction: 0.1,
        proteinFraction: 0.2,
        sugarFraction: 0.05,
        provenance: "requires-cat-kitchen-calibration" as const,
      },
    } : ingredient),
  };
}
