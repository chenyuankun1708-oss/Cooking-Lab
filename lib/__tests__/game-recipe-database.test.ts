import { describe, expect, it } from "vitest";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";
import { createGameRecipeArtifactVersion, evaluateGameRecipeCorpus } from "@/lib/game-recipe-validation";
import type { GameRecipeV1 } from "@/types/game-recipe";
import type { RecipeDatabaseExtensionV1 } from "@/types/game-recipe-database";

function databaseExtension(partial: Partial<RecipeDatabaseExtensionV1> = {}): RecipeDatabaseExtensionV1 {
  return {
    extensionVersion: "cooking-lab-recipe-database-v1",
    tags: { categoryTags: [], ...partial.tags },
    images: partial.images ?? [],
    sourceType: partial.sourceType ?? "web-migrated",
    sourceNotes: partial.sourceNotes,
    flavor: partial.flavor,
  };
}

function refreshArtifactVersion(recipe: GameRecipeV1): GameRecipeV1 {
  const next = { ...recipe, artifactVersion: createGameRecipeArtifactVersion(recipe) };
  for (const scenario of next.scenarios) scenario.baselineArtifactVersion = next.artifactVersion;
  return next;
}

describe("M13 revised scope: recipe database entries", () => {
  const data = loadCanonicalGameData();

  it("keeps the 50-item corpus structurally valid after the eligibility extension", () => {
    const result = evaluateGameRecipeCorpus(data.recipes, {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toEqual([]);
    expect(result.recipeCount).toBe(50);
    expect(result.databaseEntryCount).toBe(50);
    expect(result.exportableCount).toBe(0);
  });

  it("accepts database-entry eligibility with missing heat, flavor and images", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    recipe.database = databaseExtension({
      images: [{ status: "missing" }],
      flavor: undefined,
    });
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toEqual([]);
    expect(result.databaseEntryCount).toBe(1);
    expect(result.exportableCount).toBe(0);
  });

  it("accepts baking, bartending and dessert category tags on the same entry", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    recipe.database = databaseExtension({
      tags: {
        categoryTags: ["baking", "dessert"],
        cuisineIds: ["french"],
        techniqueIds: ["bake"],
        mealRoleIds: ["dessert"],
        servingContextIds: ["afternoon-tea"],
      },
    });
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toEqual([]);
  });

  it("marks portion roles including seasoning while keeping structure valid", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    const saltLike = recipe.ingredientPortions[recipe.ingredientPortions.length - 1];
    saltLike.role = "seasoning";
    recipe.ingredientPortions[0].role = "main";
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toEqual([]);
  });

  it("rejects ai-assisted entries without usage-limitation notes", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    recipe.database = databaseExtension({ sourceType: "ai-assisted" });
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "invalid-database-extension",
      field: "database.sourceNotes",
    });
  });

  it("accepts ai-assisted entries when notes are present", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    recipe.database = databaseExtension({
      sourceType: "ai-assisted",
      sourceNotes: "AI-assisted draft for internal database study; never eligible for Web or game export without a full rights review.",
    });
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toEqual([]);
  });

  it("rejects unknown database category tags and image statuses", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    recipe.database = databaseExtension({
      tags: { categoryTags: ["snack" as never] },
      images: [{ status: "maybe" as never }],
    });
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toHaveLength(2);
    expect(result.issues.map((issue) => issue.field).sort()).toEqual(["database.images", "database.tags.categoryTags"]);
  });

  it("requires internal images to explain why they cannot go on the Web", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    recipe.database = databaseExtension({ images: [{ status: "internal" }] });
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].field).toBe("database.images");
  });

  it("keeps the game export gate closed for database entries", () => {
    const recipe = structuredClone(data.recipes[0]) as GameRecipeV1;
    recipe.eligibility = "database-entry";
    recipe.database = databaseExtension({ sourceType: "web-migrated" });
    const withVersion = refreshArtifactVersion(recipe);
    const result = evaluateGameRecipeCorpus([withVersion], {
      operations: gameOperationCatalog,
      ingredients: data.ingredients,
      rightsRegistry: data.rightsRegistry,
      now: "2026-09-11",
    });
    expect(result.exportableCount).toBe(0);
    expect(result.ready).toBe(false);
  });
});
