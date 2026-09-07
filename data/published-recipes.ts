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
import { adaptRecipeToCulinaryItem } from "@/lib/culinary-item-adapter";
import { assertContentRightsReady, getContentRightsEvaluationDate } from "@/lib/content-rights";
import { createContentRightsRegistry, createM10TextArtifactDerivations, m10AuditedCulinaryItemIds } from "./content-rights";
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

const publishedRecipeCandidates = publicationCandidates.filter((recipe) => recipe.publication.status === "published");
const recipeRightsItems = publishedRecipeCandidates.map(adaptRecipeToCulinaryItem);
const recipeRightsRegistry = createContentRightsRegistry({
  items: recipeRightsItems,
  auditedItemIds: m10AuditedCulinaryItemIds.filter((id) => recipeRightsItems.some((item) => item.id === id)),
  images: recipeImages,
  ingredients,
  stories: [],
  evidence: m9RecipeResearchRegistry.evidence,
  sources: m9RecipeResearchRegistry.sources,
  researchRecords: m9RecipeResearchRegistry.records,
  textArtifactDerivations: createM10TextArtifactDerivations(recipeRightsItems, [], m9RecipeResearchRegistry.records),
});
assertContentRightsReady(recipeRightsRegistry, {
  items: recipeRightsItems,
  images: recipeImages,
  ingredients,
  stories: [],
  evidence: m9RecipeResearchRegistry.evidence,
  sources: m9RecipeResearchRegistry.sources,
  researchRecords: m9RecipeResearchRegistry.records,
  now: getContentRightsEvaluationDate(),
});

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
