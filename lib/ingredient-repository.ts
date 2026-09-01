import { ingredients } from "@/data/ingredients";
import type { Ingredient } from "@/types/ingredient";
export interface IngredientRepository { getById(id:string):Ingredient|undefined; list():Ingredient[] }
export const localIngredientRepository:IngredientRepository={getById:id=>ingredients.find(x=>x.id===id),list:()=>ingredients};
