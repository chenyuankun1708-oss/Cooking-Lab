import { ingredients } from "@/data/ingredients";
import type { Ingredient } from "@/types/ingredient";

export interface IngredientRepository {
  getById(id: string): Ingredient | undefined;
  list(): readonly Ingredient[];
}

const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

export const localIngredientRepository: IngredientRepository = {
  getById: (id) => ingredientById.get(id),
  list: () => ingredients,
};
