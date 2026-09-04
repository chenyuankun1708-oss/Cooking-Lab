import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ingredients } from "./ingredients";
import { recipeImages } from "./recipe-images";
import { recipes } from "./recipes";
import {
  assertPublishedRecipesEligible,
  getPubliclyVisibleRecipes,
  type RecipePublishingContext,
} from "@/lib/recipe-publishing";
import type { Recipe } from "@/types/recipe";

const publishingContext: RecipePublishingContext = {
  ingredients,
  images: recipeImages,
  localAssetExists: (src) => existsSync(resolve(process.cwd(), "public", src.replace(/^\//, ""))),
};

assertPublishedRecipesEligible(recipes, publishingContext);

const publishedRecipes = Object.freeze(getPubliclyVisibleRecipes(recipes, publishingContext));
const publishedRecipeBySlug = new Map(publishedRecipes.map((recipe) => [recipe.slug, recipe]));

export function getPublishedRecipes(): readonly Recipe[] {
  return publishedRecipes;
}

export function getPublishedRecipeBySlug(slug: string): Recipe | undefined {
  return publishedRecipeBySlug.get(slug);
}

export function listPublishedRecipesByTechnique(techniqueId: string): readonly Recipe[] {
  return publishedRecipes.filter((recipe) => recipe.taxonomy.techniques.includes(techniqueId));
}

export function getPublishedRecipesBySlugs(slugs: readonly string[]): Recipe[] {
  return slugs.map((slug) => {
    const recipe = getPublishedRecipeBySlug(slug);
    if (!recipe) throw new Error(`Featured recipe must be published: ${slug}`);
    return recipe;
  });
}

export function getPublishedRecipeStaticParams(): Array<{ slug: string }> {
  return publishedRecipes.map(({ slug }) => ({ slug }));
}
