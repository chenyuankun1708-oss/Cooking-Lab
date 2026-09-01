import type { IngredientRepository } from "./ingredient-repository";
import type { RecipeIngredient } from "@/types/recipe";
import { emptyNutrition,type Nutrition } from "@/types/nutrition";
import { toGrams } from "./unit-conversion";
export interface CalculationWarning { ingredientId:string; message:string }
export interface NutritionCalculation { total:Nutrition; warnings:CalculationWarning[]; estimated:true }
export function calculateNutrition(items:RecipeIngredient[],repo:IngredientRepository):NutritionCalculation {
  const total=emptyNutrition(),warnings:CalculationWarning[]=[];
  for(const item of items){const ingredient=repo.getById(item.ingredientId);if(!ingredient){warnings.push({ingredientId:item.ingredientId,message:"未找到食材数据"});continue;}try{const factor=toGrams(item.amount,item.unit,ingredient)/100;for(const key of Object.keys(total) as (keyof Nutrition)[])total[key]+=ingredient.nutritionPer100g[key]*factor;}catch(error){warnings.push({ingredientId:item.ingredientId,message:error instanceof Error?error.message:"无法换算用量"});}}
  for(const key of Object.keys(total) as (keyof Nutrition)[])total[key]=Math.round(total[key]*10)/10;
  return{total,warnings,estimated:true};
}
