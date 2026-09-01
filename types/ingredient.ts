import type { Nutrition } from "./nutrition";
export type IngredientCategory = "protein"|"vegetable"|"grain"|"dairy"|"seasoning"|"oil";
export interface Ingredient { id:string; name:string; aliases:string[]; category:IngredientCategory; nutritionPer100g:Nutrition; defaultUnit:Unit; approximateUnitWeight?:Partial<Record<"piece"|"tbsp"|"tsp"|"ml",number>>; estimatedPricePer100g:number; tags:string[]; dataQuality:"demo-estimated" }
export type Unit = "g"|"kg"|"ml"|"piece"|"tbsp"|"tsp";
