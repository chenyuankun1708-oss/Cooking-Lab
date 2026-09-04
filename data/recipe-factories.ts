import type { Unit } from "@/types/ingredient";
import type { Difficulty, Recipe, RecipeIngredient, RecipeStep } from "@/types/recipe";
import type { RecipeCulturalContext, RecipeTaxonomy } from "@/types/taxonomy";
import { ingredients } from "./ingredients";
import { getRecipeFlavorProfile } from "./recipe-flavors";

export type IngredientInput = [ingredientId: string, amount: number, unit?: Unit, note?: string];
export type StepInput = [instruction: string, why: string, heat?: RecipeStep["heat"]];

interface TaxonomyInput {
  countryId?: string;
  regionId?: string;
  cuisineId: string;
  subCuisineId?: string;
  techniqueIds: string[];
  dishTypeId: string;
  mealOccasionIds?: string[];
  dietaryTagIds?: string[];
  browseTagIds?: string[];
}

export interface RecipeInput {
  slug: string;
  name: string;
  description: string;
  heroImageId?: string;
  servings: number;
  ingredients: IngredientInput[];
  prep: number;
  cook: number;
  oil: number;
  salt: number;
  tools: string[];
  taxonomy: TaxonomyInput;
  steps: StepInput[];
  principles: string[];
  difficulty?: Difficulty;
  culture?: RecipeCulturalContext;
}

export const ingredient = (ingredientId: string, amount: number, unit: Unit = "g", note?: string): RecipeIngredient => ({
  ingredientId,
  amount,
  unit,
  optional: false,
  ...(note ? { note } : {}),
});

const ingredientById = new Map(ingredients.map((item) => [item.id, item]));

function calculateAddedSugar(inputs: IngredientInput[]): number {
  return inputs.reduce((total, [ingredientId, amount, unit = "g"]) => {
    const item = ingredientById.get(ingredientId);
    if (!item) return total;
    const grams = unit === "g" ? amount
      : unit === "kg" ? amount * 1000
      : amount * (item.approximateUnitWeight?.[unit] ?? 0);
    return total + grams / 100 * item.nutritionPer100g.addedSugar;
  }, 0);
}

function buildTaxonomy(input: TaxonomyInput): RecipeTaxonomy {
  return {
    ...(input.countryId ? { origin: { countryId: input.countryId, ...(input.regionId ? { regionId: input.regionId } : {}) } } : {}),
    cuisine: {
      cuisineId: input.cuisineId,
      ...(input.subCuisineId ? { subCuisineId: input.subCuisineId } : {}),
    },
    techniques: input.techniqueIds,
    mealType: {
      dishTypeId: input.dishTypeId,
      ...(input.mealOccasionIds?.length ? { mealOccasionIds: input.mealOccasionIds } : {}),
    },
    ...(input.dietaryTagIds?.length ? { dietaryTagIds: input.dietaryTagIds } : {}),
    ...(input.browseTagIds?.length ? { browseTagIds: input.browseTagIds } : {}),
  };
}

export const buildRecipe = (input: RecipeInput): Recipe => ({
  id: input.slug,
  slug: input.slug,
  name: input.name,
  description: input.description,
  ...(input.heroImageId ? { heroImageId: input.heroImageId } : {}),
  taxonomy: buildTaxonomy(input.taxonomy),
  flavor: getRecipeFlavorProfile(input.slug),
  servings: input.servings,
  ingredients: input.ingredients.map(([ingredientId, amount, unit = "g", note]) => ingredient(ingredientId, amount, unit, note)),
  cooking: {
    prepTime: input.prep,
    cookTime: input.cook,
    totalTime: input.prep + input.cook,
    oil: input.oil,
    salt: input.salt,
    addedSugar: calculateAddedSugar(input.ingredients),
    difficulty: input.difficulty ?? "easy",
  },
  tools: input.tools,
  cost: { currency: "CNY", basis: "按静态食材参考价估算" },
  steps: input.steps.map(([instruction, why, heat = "none"], index) => ({ order: index + 1, instruction, why, heat })),
  principles: input.principles,
  dataQuality: "demo-estimated",
  ...(input.culture ? { culture: input.culture } : {}),
});
