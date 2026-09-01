import type { IngredientRepository } from "./ingredient-repository";
import type { RecipeIngredient } from "@/types/recipe";
import { toGrams } from "./unit-conversion";
export interface CostCalculation { estimated:number;currency:"CNY";warnings:string[];basis:string }
export function calculateCost(items:RecipeIngredient[],repo:IngredientRepository):CostCalculation{
  let estimated=0;const warnings:string[]=[];
  for(const item of items){const ingredient=repo.getById(item.ingredientId);if(!ingredient){warnings.push(`缺少 ${item.ingredientId} 的价格数据`);continue;}try{estimated+=toGrams(item.amount,item.unit,ingredient)/100*ingredient.estimatedPricePer100g;}catch(error){warnings.push(error instanceof Error?error.message:"价格换算失败");}}
  return{estimated:Math.round(estimated),currency:"CNY",warnings,basis:"静态参考价格估算"};
}
