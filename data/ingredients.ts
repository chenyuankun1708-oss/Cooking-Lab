import type { Ingredient } from "@/types/ingredient";

const nutrition = (
  calories: number, protein: number, fat: number, saturatedFat: number,
  carbs: number, sugar: number, fiber: number, sodium: number, addedSugar = 0,
) => ({ calories, protein, fat, saturatedFat, carbs, sugar, fiber, sodium, addedSugar });

const estimatedIngredients: Omit<Ingredient, "dataQuality">[] = [
  {
    id: "egg", name: "鸡蛋", aliases: ["蛋"], category: "protein",
    nutritionPer100g: nutrition(143, 12.6, 9.5, 3.1, 0.7, 0.4, 0, 142),
    defaultUnit: "piece", approximateUnitWeight: { piece: 50 }, estimatedPricePer100g: 1.6,
    tags: ["vegetarian"],
  },
  {
    id: "chicken-breast", name: "鸡胸肉", aliases: ["鸡胸"], category: "protein",
    nutritionPer100g: nutrition(120, 22.5, 2.6, 0.7, 0, 0, 0, 45),
    defaultUnit: "g", estimatedPricePer100g: 2.8, tags: ["high-protein"],
  },
  {
    id: "chicken-thigh", name: "去皮鸡腿肉", aliases: ["鸡腿肉"], category: "protein",
    nutritionPer100g: nutrition(145, 19, 7, 1.8, 0, 0, 0, 70),
    defaultUnit: "g", estimatedPricePer100g: 2.6, tags: ["high-protein"],
  },
  {
    id: "pork-tenderloin", name: "猪里脊", aliases: ["里脊肉"], category: "protein",
    nutritionPer100g: nutrition(143, 22.2, 5.3, 1.8, 0, 0, 0, 48),
    defaultUnit: "g", estimatedPricePer100g: 3.6, tags: ["high-protein"],
  },
  {
    id: "beef-lean", name: "瘦牛肉", aliases: ["牛肉"], category: "protein",
    nutritionPer100g: nutrition(170, 20.7, 9.4, 3.8, 0, 0, 0, 55),
    defaultUnit: "g", estimatedPricePer100g: 6.8, tags: ["high-protein"],
  },
  {
    id: "shrimp", name: "虾仁", aliases: ["鲜虾仁"], category: "protein",
    nutritionPer100g: nutrition(93, 18.6, 0.8, 0.2, 2.8, 0, 0, 119),
    defaultUnit: "g", estimatedPricePer100g: 6.5, tags: ["high-protein"],
  },
  {
    id: "salmon", name: "三文鱼", aliases: [], category: "protein",
    nutritionPer100g: nutrition(208, 20.4, 13.4, 3.1, 0, 0, 0, 59),
    defaultUnit: "g", estimatedPricePer100g: 12, tags: ["high-protein"],
  },
  {
    id: "tofu", name: "北豆腐", aliases: ["豆腐"], category: "protein",
    nutritionPer100g: nutrition(90, 10, 5, 0.8, 2, 0.5, 0.5, 10),
    defaultUnit: "g", estimatedPricePer100g: 0.7, tags: ["vegan"],
  },
  {
    id: "lentil", name: "干扁豆", aliases: ["扁豆"], category: "protein",
    nutritionPer100g: nutrition(352, 24.6, 1.1, 0.2, 63.4, 2, 10.7, 6),
    defaultUnit: "g", estimatedPricePer100g: 1.8, tags: ["vegan", "high-fiber"],
  },
  {
    id: "rice", name: "大米（生）", aliases: ["米"], category: "grain",
    nutritionPer100g: nutrition(346, 7.4, 0.8, 0.2, 77.2, 0.1, 0.7, 2),
    defaultUnit: "g", estimatedPricePer100g: 0.7, tags: ["vegan", "staple"],
  },
  {
    id: "oats", name: "燕麦片", aliases: ["燕麦"], category: "grain",
    nutritionPer100g: nutrition(379, 13.2, 6.5, 1.2, 67.7, 1, 10.1, 6),
    defaultUnit: "g", estimatedPricePer100g: 1.6, tags: ["vegan", "high-fiber", "staple"],
  },
  {
    id: "noodles", name: "干面条", aliases: ["面条"], category: "grain",
    nutritionPer100g: nutrition(348, 10.3, 1.5, 0.3, 73.6, 2.5, 3, 15),
    defaultUnit: "g", estimatedPricePer100g: 0.9, tags: ["vegan", "staple"],
  },
  {
    id: "corn", name: "甜玉米粒", aliases: ["玉米"], category: "grain",
    nutritionPer100g: nutrition(86, 3.3, 1.4, 0.2, 19, 6.3, 2.7, 15),
    defaultUnit: "g", estimatedPricePer100g: 1, tags: ["vegan", "staple"],
  },
  {
    id: "tomato", name: "番茄", aliases: ["西红柿"], category: "vegetable",
    nutritionPer100g: nutrition(18, 0.9, 0.2, 0, 3.9, 2.6, 1.2, 5),
    defaultUnit: "g", approximateUnitWeight: { piece: 180 }, estimatedPricePer100g: 0.8,
    tags: ["vegan"],
  },
  {
    id: "broccoli", name: "西兰花", aliases: [], category: "vegetable",
    nutritionPer100g: nutrition(34, 2.8, 0.4, 0.1, 6.6, 1.7, 2.6, 33),
    defaultUnit: "g", estimatedPricePer100g: 1.2, tags: ["vegan", "high-fiber"],
  },
  {
    id: "mushroom", name: "鲜蘑菇", aliases: ["口蘑"], category: "vegetable",
    nutritionPer100g: nutrition(22, 3.1, 0.3, 0.1, 3.3, 2, 1, 5),
    defaultUnit: "g", estimatedPricePer100g: 1.8, tags: ["vegan"],
  },
  {
    id: "potato", name: "土豆", aliases: ["马铃薯"], category: "vegetable",
    nutritionPer100g: nutrition(77, 2, 0.1, 0, 17.5, 0.8, 2.1, 6),
    defaultUnit: "g", approximateUnitWeight: { piece: 180 }, estimatedPricePer100g: 0.5,
    tags: ["vegan", "staple"],
  },
  {
    id: "sweet-potato", name: "红薯", aliases: ["甘薯"], category: "vegetable",
    nutritionPer100g: nutrition(86, 1.6, 0.1, 0, 20.1, 4.2, 3, 55),
    defaultUnit: "g", approximateUnitWeight: { piece: 200 }, estimatedPricePer100g: 0.7,
    tags: ["vegan", "high-fiber", "staple"],
  },
  {
    id: "carrot", name: "胡萝卜", aliases: [], category: "vegetable",
    nutritionPer100g: nutrition(41, 0.9, 0.2, 0, 9.6, 4.7, 2.8, 69),
    defaultUnit: "g", approximateUnitWeight: { piece: 120 }, estimatedPricePer100g: 0.6,
    tags: ["vegan"],
  },
  {
    id: "cucumber", name: "黄瓜", aliases: ["青瓜"], category: "vegetable",
    nutritionPer100g: nutrition(15, 0.7, 0.1, 0, 3.6, 1.7, 0.5, 2),
    defaultUnit: "g", approximateUnitWeight: { piece: 200 }, estimatedPricePer100g: 0.8,
    tags: ["vegan"],
  },
  {
    id: "spinach", name: "菠菜", aliases: [], category: "vegetable",
    nutritionPer100g: nutrition(23, 2.9, 0.4, 0.1, 3.6, 0.4, 2.2, 79),
    defaultUnit: "g", estimatedPricePer100g: 1.2, tags: ["vegan"],
  },
  {
    id: "cabbage", name: "圆白菜", aliases: ["卷心菜"], category: "vegetable",
    nutritionPer100g: nutrition(25, 1.3, 0.1, 0, 5.8, 3.2, 2.5, 18),
    defaultUnit: "g", estimatedPricePer100g: 0.5, tags: ["vegan"],
  },
  {
    id: "bell-pepper", name: "彩椒", aliases: ["甜椒"], category: "vegetable",
    nutritionPer100g: nutrition(31, 1, 0.3, 0, 6, 4.2, 2.1, 4),
    defaultUnit: "g", approximateUnitWeight: { piece: 150 }, estimatedPricePer100g: 1.6,
    tags: ["vegan"],
  },
  {
    id: "onion", name: "洋葱", aliases: [], category: "vegetable",
    nutritionPer100g: nutrition(40, 1.1, 0.1, 0, 9.3, 4.2, 1.7, 4),
    defaultUnit: "g", approximateUnitWeight: { piece: 180 }, estimatedPricePer100g: 0.6,
    tags: ["vegan"],
  },
  {
    id: "lemon", name: "柠檬", aliases: [], category: "vegetable",
    nutritionPer100g: nutrition(29, 1.1, 0.3, 0, 9.3, 2.5, 2.8, 2),
    defaultUnit: "piece", approximateUnitWeight: { piece: 90 }, estimatedPricePer100g: 2,
    tags: ["vegan", "fruit"],
  },
  {
    id: "milk", name: "纯牛奶", aliases: ["牛奶"], category: "dairy",
    nutritionPer100g: nutrition(61, 3.2, 3.3, 1.9, 4.8, 4.8, 0, 43),
    defaultUnit: "ml", approximateUnitWeight: { ml: 1 }, estimatedPricePer100g: 1.2,
    tags: ["vegetarian"],
  },
  {
    id: "yogurt", name: "无糖酸奶", aliases: ["酸奶"], category: "dairy",
    nutritionPer100g: nutrition(63, 5.3, 1.6, 1, 7, 4.7, 0, 70),
    defaultUnit: "g", estimatedPricePer100g: 2.2, tags: ["vegetarian"],
  },
  {
    id: "salt", name: "食盐", aliases: ["盐"], category: "seasoning",
    nutritionPer100g: nutrition(0, 0, 0, 0, 0, 0, 0, 39300),
    defaultUnit: "g", approximateUnitWeight: { tsp: 6 }, estimatedPricePer100g: 0.2,
    tags: ["vegan"],
  },
  {
    id: "soy-sauce", name: "生抽", aliases: ["酱油"], category: "seasoning",
    nutritionPer100g: nutrition(53, 8.1, 0.6, 0.1, 4.9, 0.4, 0.8, 5493),
    defaultUnit: "g", approximateUnitWeight: { tbsp: 15, tsp: 5, ml: 1.15 },
    estimatedPricePer100g: 1.2, tags: ["vegan"],
  },
  {
    id: "cooking-oil", name: "食用油", aliases: ["油"], category: "oil",
    nutritionPer100g: nutrition(884, 0, 100, 14, 0, 0, 0, 0),
    defaultUnit: "g", approximateUnitWeight: { tbsp: 14, tsp: 4.5, ml: 0.92 },
    estimatedPricePer100g: 1.5, tags: ["vegan"],
  },
];

export const ingredients: Ingredient[] = estimatedIngredients.map((ingredient) => ({
  ...ingredient,
  dataQuality: "demo-estimated",
}));
