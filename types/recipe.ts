import type { Nutrition } from "./nutrition";
import type { Unit } from "./ingredient";
import type { FlavorProfile } from "./flavor";
import type { RecipeCulturalContext, RecipeTaxonomy } from "./taxonomy";
import { publicationStatuses, type EditorialPublication, type PublicationStatus } from "./publication";
export type Difficulty = "easy"|"medium"|"hard";
export const recipePublicationStatuses = publicationStatuses;
export type RecipePublicationStatus = PublicationStatus;
export type RecipePublication = EditorialPublication;
export interface RecipeIngredient { ingredientId:string; amount:number; unit:Unit; optional?:boolean; note?:string }
export interface RecipeStep { order:number; instruction:string; duration?:number; heat?:"none"|"low"|"medium"|"high"; why:string }
export interface Recipe { id:string; slug:string; name:string; description:string; heroImageId?:string; publication:RecipePublication; taxonomy:RecipeTaxonomy; flavor:FlavorProfile; culture?:RecipeCulturalContext; servings:number; ingredients:RecipeIngredient[]; nutrition?:Nutrition; cooking:{prepTime:number;cookTime:number;totalTime:number;oil:number;salt:number;addedSugar:number;difficulty:Difficulty}; tools:string[]; cost:{estimated?:number;currency:"CNY";basis:string};steps:RecipeStep[];principles:string[];dataQuality:"demo-estimated" }
