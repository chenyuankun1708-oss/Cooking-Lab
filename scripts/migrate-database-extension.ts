import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getPublishedCulinaryItems } from "@/data/published-culinary-items";
import { getPublishedRecipeBySlug } from "@/data/published-recipes";
import { stableJson } from "@/lib/stable-json";
import { createGameRecipeArtifactVersion } from "@/lib/game-recipe-validation";
import type { GameIngredientPortionV1, GameRecipeV1 } from "@/types/game-recipe";
import type {
  DatabaseCategoryTag,
  DatabaseImageRefV1,
  PortionRole,
  RecipeDatabaseExtensionV1,
} from "@/types/game-recipe-database";
import { getRecipeFlavorProfile } from "@/data/recipe-flavors";
import { recipeImages } from "@/data/recipe-images";

/**
 * M13 revised scope backfill: attach the recipe-database extension to the 50
 * canonical game recipes, reusing Web-side flavor / taxonomy / image data.
 *
 * - categoryTags: derived from itemType (dessert / bartending) and Web techniques (bake).
 * - flavor: Web FlavorProfile by slug.
 * - images: `published` when the slug has a Web hero image, otherwise `missing`.
 * - sourceType: `web-migrated` for the current corpus.
 * - portion roles: derived from the ingredient catalog `role` hints.
 * - eligibility: rewritten from `draft` to `database-entry`.
 * - heatControl: intentionally left as-is (missing stays missing by design).
 */
const recipeRoot = resolve(process.cwd(), "game-data/source/recipes");
const ingredientCatalog = JSON.parse(readFileSync(resolve(process.cwd(), "game-data/source/ingredients.json"), "utf8")) as {
  ingredients: Array<{ ingredientId: string; role?: PortionRole }>;
};
const catalogRoleById = new Map(ingredientCatalog.ingredients.map((ingredient) => [ingredient.ingredientId, ingredient.role]));

const webImageIds = new Set(recipeImages.map((image) => image.id));
const culinaryItems = new Map(getPublishedCulinaryItems().map((item) => [item.slug, item]));

function categoryTagsFor(recipe: GameRecipeV1, techniqueIds: readonly string[]): DatabaseCategoryTag[] {
  const tags = new Set<DatabaseCategoryTag>();
  const itemType = recipe.itemType;
  const usesBakeOperation = recipe.operationGraph.nodes.some((node) => node.operationType === "bake" || node.operationType === "roast");
  if (itemType === "dish" && (techniqueIds.includes("bake") || usesBakeOperation)) tags.add("baking");
  if (usesBakeOperation) tags.add("baking");
  if (itemType === "dish" || itemType === "dessert") {
    // Dessert-typed items are dessert entries; baked dishes also carry baking.
    const item = culinaryItems.get(recipe.slug);
    const mealRoles = item?.pairing.mealRoleIds ?? [];
    if (itemType === "dessert" || mealRoles.includes("dessert")) tags.add("dessert");
  }
  if (itemType === "tea" || itemType === "coffee" || itemType === "alcoholic-drink" || itemType === "non-alcoholic-drink") {
    tags.add("bartending");
  }
  return [...tags].sort();
}

function flavorFor(recipe: GameRecipeV1): RecipeDatabaseExtensionV1["flavor"] {
  const item = culinaryItems.get(recipe.slug);
  if (item) return item.flavor;
  const webRecipe = getPublishedRecipeBySlug(recipe.slug);
  if (webRecipe) return webRecipe.flavor;
  return getRecipeFlavorProfile(recipe.slug);
}

function taxonomyFor(recipe: GameRecipeV1): Pick<RecipeDatabaseExtensionV1["tags"], "cuisineIds" | "techniqueIds" | "dietaryTagIds" | "mealRoleIds" | "servingContextIds"> {
  const item = culinaryItems.get(recipe.slug);
  const webRecipe = getPublishedRecipeBySlug(recipe.slug);
  const result: ReturnType<typeof taxonomyFor> = {};
  if (webRecipe) {
    const cuisines = [webRecipe.taxonomy.cuisine.cuisineId, webRecipe.taxonomy.cuisine.subCuisineId].filter((id): id is string => Boolean(id));
    if (cuisines.length) result.cuisineIds = [...new Set(cuisines)].sort();
    if (webRecipe.taxonomy.techniques.length) result.techniqueIds = [...new Set(webRecipe.taxonomy.techniques)].sort();
    if (webRecipe.taxonomy.dietaryTagIds?.length) result.dietaryTagIds = [...new Set(webRecipe.taxonomy.dietaryTagIds)].sort();
  }
  if (item) {
    if (item.pairing.cuisineIds.length) result.cuisineIds = [...new Set([...(result.cuisineIds ?? []), ...item.pairing.cuisineIds])].sort();
    const mealRoles = item.pairing.mealRoleIds.map((role) => role as string);
    if (mealRoles.length) result.mealRoleIds = [...new Set(mealRoles)].sort();
    if (item.pairing.servingContextIds.length) result.servingContextIds = [...new Set(item.pairing.servingContextIds)].sort();
  }
  return result;
}

function imageFor(recipe: GameRecipeV1): DatabaseImageRefV1[] {
  const heroImageId = `${recipe.slug}-hero`;
  if (webImageIds.has(heroImageId)) return [{ imageId: heroImageId, status: "published" }];
  const item = culinaryItems.get(recipe.slug);
  if (item && item.images.availability === "available" && item.images.references.primaryImageId) {
    return [{ imageId: item.images.references.primaryImageId, status: "published" }];
  }
  return [{ status: "missing" }];
}

let migrated = 0;
for (const name of readdirSync(recipeRoot).filter((entry) => entry.endsWith(".json"))) {
  const path = resolve(recipeRoot, name);
  const recipe = JSON.parse(readFileSync(path, "utf8")) as GameRecipeV1;
  const techniqueIds = taxonomyFor(recipe).techniqueIds ?? [];
  const extension: RecipeDatabaseExtensionV1 = {
    extensionVersion: "cooking-lab-recipe-database-v1",
    tags: {
      categoryTags: categoryTagsFor(recipe, techniqueIds),
      ...taxonomyFor(recipe),
    },
    flavor: flavorFor(recipe),
    images: imageFor(recipe),
    sourceType: "web-migrated",
  };
  recipe.database = extension;
  recipe.eligibility = "database-entry";
  for (const portion of recipe.ingredientPortions) {
    const catalogRole = catalogRoleById.get(portion.ingredientId);
    (portion as GameIngredientPortionV1).role = catalogRole ?? "main";
  }
  // Heat control intentionally untouched: missing values stay missing in the database.
  // The database extension and portion roles change the payload, so refresh the
  // artifact version and every scenario baseline together.
  recipe.artifactVersion = createGameRecipeArtifactVersion(recipe);
  for (const scenario of recipe.scenarios) scenario.baselineArtifactVersion = recipe.artifactVersion;
  writeFileSync(path, stableJson(recipe), "utf8");
  migrated += 1;
}

process.stdout.write(`Backfilled ${migrated} recipe database entries\n`);
if (migrated === 0) {
  process.stderr.write("No recipes found to backfill\n");
  process.exitCode = 1;
}
