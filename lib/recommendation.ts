import type { RecommendationCriteria,RecommendationEngine,RecommendationResult } from "@/types/recommendation";
import type { Recipe } from "@/types/recipe";
import { calculateNutrition } from "./nutrition";
import {calculateCost} from "./cost";
import{localIngredientRepository as repo}from"./ingredient-repository";
type Check={active:boolean;matched:boolean;ok:string;bad:string};
export class RuleRecommendationEngine implements RecommendationEngine {
  rank(recipes:Recipe[],criteria:RecommendationCriteria):RecommendationResult[]{return recipes.map(recipe=>this.score(recipe,criteria)).sort((a,b)=>b.score-a.score)}
  private score(recipe:Recipe,c:RecommendationCriteria):RecommendationResult{
    const nutrition=calculateNutrition(recipe.ingredients,repo).total,cost=calculateCost(recipe.ingredients,repo).estimated;
    const available=new Set(c.availableIngredients??[]),tools=new Set(c.availableTools??[]);
    const checks:Check[]=[
      {active:c.maxTime!==undefined,matched:recipe.cooking.totalTime<=(c.maxTime??Infinity),ok:"满足时间限制",bad:"超过时间限制"},
      {active:c.maxCalories!==undefined,matched:nutrition.calories<=(c.maxCalories??Infinity),ok:"满足热量上限",bad:"超过热量上限"},
      {active:c.minProtein!==undefined,matched:nutrition.protein>=(c.minProtein??0),ok:"达到蛋白质目标",bad:"未达到蛋白质目标"},
      {active:c.maxOil!==undefined,matched:recipe.cooking.oil<=(c.maxOil??Infinity),ok:"满足用油限制",bad:"超过用油限制"},
      {active:c.maxCost!==undefined,matched:cost<=(c.maxCost??Infinity),ok:"满足预算",bad:"超过预算"},
      {active:available.size>0,matched:recipe.ingredients.filter(x=>!x.optional).every(x=>available.has(x.ingredientId)),ok:"所需食材齐全",bad:`缺少 ${recipe.ingredients.filter(x=>!x.optional&&!available.has(x.ingredientId)).length} 种食材`},
      {active:tools.size>0,matched:recipe.tools.every(x=>tools.has(x)),ok:"厨具匹配",bad:"缺少所需厨具"}
    ];
    const active=checks.filter(x=>x.active),matched=active.filter(x=>x.matched).map(x=>x.ok),unmatched=active.filter(x=>!x.matched).map(x=>x.bad),score=active.length?Math.round(matched.length/active.length*100):100;
    return{recipe,score,matchedConditions:matched,unmatchedConditions:unmatched,explanation:active.length?`${matched.length}/${active.length} 项已启用条件匹配。`:"尚未设置条件，展示全部菜谱。"};
  }
}
export const recommendationEngine:RecommendationEngine=new RuleRecommendationEngine();
