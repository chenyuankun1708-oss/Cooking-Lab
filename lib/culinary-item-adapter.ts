import type {
  DishItem,
  DishPreparation,
  MealRoleId,
  PreparationStep,
  ProceduralPreparationKind,
} from "@/types/culinary";
import type { Recipe } from "@/types/recipe";

const mealRoleByDishType: Readonly<Record<string, MealRoleId | undefined>> = {
  "main-dish": "main",
  "side-dish": "side",
  staple: "staple",
  soup: "soup",
  "cold-dish": "starter",
};

export function adaptRecipeToCulinaryItem(recipe: Recipe): DishItem {
  const role = mealRoleByDishType[recipe.taxonomy.mealType.dishTypeId];
  const servingContextIds = recipe.taxonomy.mealType.mealOccasionIds?.length
    ? [...recipe.taxonomy.mealType.mealOccasionIds]
    : ["lunch", "dinner"];
  const preparationKind = getPreparationKind(recipe);
  const translationStatus = recipe.publication.status === "draft" ? "draft" as const : "reviewed" as const;
  const steps: PreparationStep[] = recipe.steps.map((step) => ({
    order: step.order,
    content: {
      defaultLocale: "zh-CN",
      entries: [{
        locale: "zh-CN",
        status: translationStatus,
        value: { instruction: step.instruction, rationale: step.why },
      }],
    },
    ...(step.duration === undefined ? {} : { durationMinutes: step.duration }),
  }));
  const [firstStep, ...remainingSteps] = steps;
  if (!firstStep) throw new Error(`Recipe ${recipe.id} cannot be adapted without preparation steps`);

  const preparation: DishPreparation = {
    kind: preparationKind,
    time: {
      prepMinutes: recipe.cooking.prepTime,
      processMinutes: recipe.cooking.cookTime,
      totalMinutes: recipe.cooking.totalTime,
    },
    yield: { amount: recipe.servings, unit: "serving" },
    inputs: recipe.ingredients.map((ingredient) => ({ ...ingredient, optional: ingredient.optional ?? false })),
    toolIds: [...recipe.tools],
    steps: [firstStep, ...remainingSteps],
  };

  return {
    id: recipe.id,
    slug: recipe.slug,
    itemType: "dish",
    content: {
      defaultLocale: "zh-CN",
      entries: [{
        locale: "zh-CN",
        status: recipe.publication.status === "draft" ? "draft" : "reviewed",
        value: { name: recipe.name, description: recipe.description },
      }],
    },
    taxonomy: {
      origin: recipe.taxonomy.origin,
      cuisine: recipe.taxonomy.cuisine,
      techniqueIds: [...recipe.taxonomy.techniques],
      formIds: [recipe.taxonomy.mealType.dishTypeId],
      dietaryTagIds: [...(recipe.taxonomy.dietaryTagIds ?? [])],
      browseTagIds: [...(recipe.taxonomy.browseTagIds ?? [])],
    },
    flavor: recipe.flavor,
    images: recipe.heroImageId
      ? { availability: "available", references: { primaryImageId: recipe.heroImageId, imageIds: [recipe.heroImageId] } }
      : { availability: "none" },
    storyIds: [],
    pairing: {
      mealRoleIds: role ? [role] : [],
      servingContextIds,
      cuisineIds: [recipe.taxonomy.cuisine.cuisineId],
      facets: [],
    },
    publication: { ...recipe.publication },
    nutrition: { applicability: "applicable", source: "ingredient-derived" },
    cost: { source: "ingredient-derived", currency: "CNY" },
    preparation,
  };
}

function getPreparationKind(recipe: Recipe): Extract<ProceduralPreparationKind, "cooking" | "baking" | "assembly"> {
  if (recipe.taxonomy.techniques.includes("bake")) return "baking";
  if (recipe.taxonomy.techniques.every((id) => id === "dress" || id === "cold-mix")) return "assembly";
  return "cooking";
}
