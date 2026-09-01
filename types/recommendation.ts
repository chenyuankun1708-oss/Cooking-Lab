import type { Recipe } from "./recipe";
export interface RecommendationCriteria { availableIngredients?:string[]; maxTime?:number; maxCalories?:number; minProtein?:number; maxOil?:number; maxSalt?:number; maxAddedSugar?:number; maxCost?:number; availableTools?:string[]; cuisine?:string; dietaryTags?:string[]; preferredCookingMethods?:string[] }
export interface RecommendationResult { recipe:Recipe; score:number; matchedConditions:string[]; unmatchedConditions:string[]; explanation:string }
export interface RecommendationEngine { rank(recipes:Recipe[], criteria:RecommendationCriteria):RecommendationResult[] }
