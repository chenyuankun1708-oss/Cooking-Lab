import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ingredients } from "./ingredients";
import { recipeImages } from "./recipe-images";
import { m9RecipeResearchRegistry } from "./research/m9-recipe-research";
import { recipes } from "./recipes";
import { applyM9RecipePublicationOverrides } from "./m9-published-recipes";
import { m9PromotedRecipeSlugs } from "./m9-published-recipes";
import { hasCompleteRecipeTranslation } from "./localization/public-recipes";
import { assertM9RecipesPublicationReady } from "@/lib/m9-recipe-publishing";
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

const publicationCandidates = applyM9RecipePublicationOverrides(recipes);

assertM9RecipesPublicationReady({
  recipes: publicationCandidates,
  slugs: m9PromotedRecipeSlugs,
  researchRegistry: m9RecipeResearchRegistry,
  hasCompleteEnglishTranslation: (recipe) => hasCompleteRecipeTranslation(recipe, "en"),
});
assertPublishedRecipesEligible(publicationCandidates, publishingContext);

const publishedRecipes = Object.freeze(getPubliclyVisibleRecipes(publicationCandidates, publishingContext));
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
