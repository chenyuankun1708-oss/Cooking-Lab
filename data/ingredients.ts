import type { Ingredient } from "@/types/ingredient";
const n=(calories:number,protein:number,fat:number,saturatedFat:number,carbs:number,sugar:number,fiber:number,sodium:number,addedSugar=0)=>({calories,protein,fat,saturatedFat,carbs,sugar,fiber,sodium,addedSugar});
export const ingredients: Ingredient[] = [
 {id:"egg",name:"鸡蛋",aliases:["蛋"],category:"protein",nutritionPer100g:n(143,12.6,9.5,3.1,0.7,0.4,0,142),defaultUnit:"piece",approximateUnitWeight:{piece:50},estimatedPricePer100g:1.6,tags:["vegetarian"]},
 {id:"tomato",name:"番茄",aliases:["西红柿"],category:"vegetable",nutritionPer100g:n(18,0.9,0.2,0,3.9,2.6,1.2,5),defaultUnit:"g",approximateUnitWeight:{piece:180},estimatedPricePer100g:0.8,tags:["vegan"]},
 {id:"chicken-breast",name:"鸡胸肉",aliases:["鸡胸"],category:"protein",nutritionPer100g:n(120,22.5,2.6,0.7,0,0,0,45),defaultUnit:"g",estimatedPricePer100g:2.8,tags:["high-protein"]},
 {id:"chicken-thigh",name:"去皮鸡腿肉",aliases:["鸡腿肉"],category:"protein",nutritionPer100g:n(145,19,7,1.8,0,0,0,70),defaultUnit:"g",estimatedPricePer100g:2.6,tags:["high-protein"]},
 {id:"broccoli",name:"西兰花",aliases:[],category:"vegetable",nutritionPer100g:n(34,2.8,0.4,0.1,6.6,1.7,2.6,33),defaultUnit:"g",estimatedPricePer100g:1.2,tags:["vegan","high-fiber"]},
 {id:"mushroom",name:"鲜蘑菇",aliases:["口蘑"],category:"vegetable",nutritionPer100g:n(22,3.1,0.3,0.1,3.3,2,1,5),defaultUnit:"g",estimatedPricePer100g:1.8,tags:["vegan"]},
 {id:"tofu",name:"北豆腐",aliases:["豆腐"],category:"protein",nutritionPer100g:n(90,10,5,0.8,2,0.5,0.5,10),defaultUnit:"g",estimatedPricePer100g:0.7,tags:["vegan"]},
 {id:"rice",name:"大米（生）",aliases:["米"],category:"grain",nutritionPer100g:n(346,7.4,0.8,0.2,77.2,0.1,0.7,2),defaultUnit:"g",estimatedPricePer100g:0.7,tags:["vegan"]},
 {id:"cooking-oil",name:"食用油",aliases:["油"],category:"oil",nutritionPer100g:n(884,0,100,14,0,0,0,0),defaultUnit:"g",approximateUnitWeight:{tbsp:14,tsp:4.5,ml:0.92},estimatedPricePer100g:1.5,tags:["vegan"]},
 {id:"salt",name:"食盐",aliases:["盐"],category:"seasoning",nutritionPer100g:n(0,0,0,0,0,0,0,39300),defaultUnit:"g",approximateUnitWeight:{tsp:6},estimatedPricePer100g:0.2,tags:["vegan"]}
];
