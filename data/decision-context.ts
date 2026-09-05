import { getPublishedCulinaryItems } from "./published-culinary-items";
import { getPublishedRecipes } from "./published-recipes";
import { ingredients } from "./ingredients";
import { flavorPreferenceIds } from "@/types/flavor";
import { createDecisionContextValueAllowlist } from "@/lib/decision-context";
import { getRecipeTagIds } from "@/lib/taxonomy";

const publishedRecipes = getPublishedRecipes();

export const decisionContextValueAllowlist = createDecisionContextValueAllowlist({
  ingredients,
  recipes: publishedRecipes,
  culinaryItems: getPublishedCulinaryItems(),
  supportedTagIds: publishedRecipes.flatMap(getRecipeTagIds),
  flavorPreferenceIds,
});
