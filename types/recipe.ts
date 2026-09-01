import type { Nutrition } from "./nutrition";
import type { Unit } from "./ingredient";
export type Difficulty = "easy"|"medium"|"hard";
export interface RecipeIngredient { ingredientId:string; amount:number; unit:Unit; optional?:boolean; note?:string }
export interface RecipeStep { order:number; instruction:string; duration?:number; heat?:"none"|"low"|"medium"|"high"; why:string }
export interface Recipe { id:string; slug:string; name:string; description:string; cuisine:string; category:string; servings:number; ingredients:RecipeIngredient[]; nutrition?:Nutrition; cooking:{prepTime:number;cookTime:number;totalTime:number;oil:number;salt:number;addedSugar:number;difficulty:Difficulty;method:string}; tools:string[]; cost:{estimated?:number;currency:"CNY";basis:string}; tags:string[];steps:RecipeStep[];principles:string[];dataQuality:"demo-estimated" }
