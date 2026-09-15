import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import type { GameIngredientCatalogV1, GameIngredientState } from "@/types/game-recipe";
import type { PortionRole } from "@/types/game-recipe-database";
import type { Nutrition } from "@/types/nutrition";

/**
 * Batch C ingredient expansion: ingredients for the 130-recipe batch
 * (250-entry milestone). Editorial-estimate nutrition; conversion records
 * are generated only for ingredients this run actually adds.
 */
interface NewIngredient {
  ingredientId: string;
  defaultState: GameIngredientState;
  role: PortionRole;
  unitWeightsG?: Partial<Record<"piece" | "tbsp" | "tsp" | "ml" | "cup" | "l", number>>;
  densityGPerMl?: number;
  nutritionPer100g: Nutrition;
}

const estimate = (partial: Partial<Nutrition>): Nutrition => ({
  calories: 0, protein: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0, sodium: 0,
  ...partial,
});

const newIngredients: NewIngredient[] = [
  // --- bartending ---
  { ingredientId: "absinthe", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.97, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "orgeat-syrup", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 21 }, densityGPerMl: 1.27, nutritionPer100g: estimate({ calories: 333, fat: 4, carbs: 78, sugar: 78, addedSugar: 78, sodium: 15 }) },
  { ingredientId: "passion-fruit-syrup", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 20 }, densityGPerMl: 1.28, nutritionPer100g: estimate({ calories: 320, carbs: 80, sugar: 80, addedSugar: 80 }) },
  { ingredientId: "cream-of-coconut", defaultState: "liquid", role: "main", unitWeightsG: { tbsp: 18 }, densityGPerMl: 1.11, nutritionPer100g: estimate({ calories: 330, protein: 1.3, fat: 21, saturatedFat: 18.8, carbs: 37, sugar: 36, addedSugar: 36, sodium: 40 }) },
  { ingredientId: "celery", defaultState: "raw", role: "garnish", unitWeightsG: { piece: 40 }, nutritionPer100g: estimate({ calories: 14, protein: 0.7, fat: 0.2, carbs: 3, sugar: 1.8, fiber: 1.6, sodium: 80 }) },
  { ingredientId: "celery-salt", defaultState: "dry", role: "seasoning", unitWeightsG: { tsp: 2.3 }, nutritionPer100g: estimate({ calories: 273, carbs: 12, sodium: 24500 }) },
  { ingredientId: "pisco", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "cachaca", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "blackstrap-rum", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.96, nutritionPer100g: estimate({ calories: 230, carbs: 0.4, sodium: 3 }) },
  { ingredientId: "aperitif-wine", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 155, carbs: 14, sugar: 14, addedSugar: 14 }) },
  { ingredientId: "ginger-ale", defaultState: "liquid", role: "main", densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 34, carbs: 9, sugar: 9, addedSugar: 9, sodium: 7 }) },
  { ingredientId: "horseradish", defaultState: "prepared", role: "seasoning", unitWeightsG: { tsp: 6 }, nutritionPer100g: estimate({ calories: 48, protein: 1.3, fat: 0.4, carbs: 11.3, sugar: 6.9, fiber: 3.3, sodium: 420 }) },
  { ingredientId: "hot-sauce", defaultState: "liquid", role: "seasoning", unitWeightsG: { tsp: 5 }, densityGPerMl: 1, nutritionPer100g: estimate({ calories: 30, carbs: 4.5, sugar: 2, sodium: 2100 }) },
  { ingredientId: "worcestershire-sauce", defaultState: "liquid", role: "seasoning", unitWeightsG: { tsp: 6 }, densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 77, protein: 0.8, carbs: 19, sugar: 17, sodium: 1600 }) },
  { ingredientId: "blackberry-liqueur", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 296, carbs: 38, sugar: 38, addedSugar: 38 }) },
  { ingredientId: "green-chartreuse", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 309, carbs: 40, sugar: 40, addedSugar: 40 }) },
  { ingredientId: "yellow-chartreuse", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 322, carbs: 44, sugar: 44, addedSugar: 44 }) },
  { ingredientId: "drambuie", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 297, carbs: 38, sugar: 38, addedSugar: 38 }) },
  { ingredientId: "galliano", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.06, nutritionPer100g: estimate({ calories: 312, carbs: 42, sugar: 42, addedSugar: 42 }) },
  { ingredientId: "white-creme-de-cacao", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 271, carbs: 34, sugar: 34, addedSugar: 34 }) },
  { ingredientId: "white-creme-de-menthe", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 267, carbs: 32, sugar: 32, addedSugar: 32 }) },
  { ingredientId: "grapefruit-juice", defaultState: "liquid", role: "main", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 39, protein: 0.5, fat: 0.1, carbs: 9.2, sugar: 7.9, fiber: 0.2, sodium: 1 }) },
  { ingredientId: "milk-powder", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 8 }, nutritionPer100g: estimate({ calories: 496, protein: 26.3, fat: 26.7, saturatedFat: 16.9, carbs: 38.4, sugar: 38.4, sodium: 397 }) },
  { ingredientId: "pistachio", defaultState: "raw", role: "main", unitWeightsG: { cup: 128 }, nutritionPer100g: estimate({ calories: 560, protein: 20.2, fat: 45.3, saturatedFat: 5.9, carbs: 27.2, sugar: 7.7, fiber: 10.6, sodium: 1 }) },
  { ingredientId: "canned-pineapple", defaultState: "prepared", role: "main", unitWeightsG: { cup: 181 }, nutritionPer100g: estimate({ calories: 60, protein: 0.4, fat: 0.1, carbs: 15.7, sugar: 14.9, addedSugar: 8, fiber: 0.8, sodium: 1 }) },
  { ingredientId: "sesame-oil", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 13.6 }, densityGPerMl: 0.92, nutritionPer100g: estimate({ calories: 884, fat: 100, saturatedFat: 14.2, sodium: 0 }) },
  { ingredientId: "green-chartreuse", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 309, carbs: 40, sugar: 40, addedSugar: 40 }) },
  { ingredientId: "yellow-chartreuse", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 322, carbs: 44, sugar: 44, addedSugar: 44 }) },
  { ingredientId: "drambuie", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 297, carbs: 38, sugar: 38, addedSugar: 38 }) },
  { ingredientId: "galliano", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.06, nutritionPer100g: estimate({ calories: 312, carbs: 42, sugar: 42, addedSugar: 42 }) },
  { ingredientId: "white-creme-de-cacao", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 271, carbs: 34, sugar: 34, addedSugar: 34 }) },
  { ingredientId: "white-creme-de-menthe", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 267, carbs: 32, sugar: 32, addedSugar: 32 }) },
  { ingredientId: "grapefruit-juice", defaultState: "liquid", role: "main", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 39, protein: 0.5, fat: 0.1, carbs: 9.2, sugar: 7.9, fiber: 0.2, sodium: 1 }) },
  // --- baking ---
  { ingredientId: "dark-cherries", defaultState: "prepared", role: "main", unitWeightsG: { cup: 174 }, nutritionPer100g: estimate({ calories: 58, protein: 0.9, fat: 0.1, carbs: 14.4, sugar: 11, fiber: 1.6, sodium: 2 }) },
  { ingredientId: "cake-flour", defaultState: "dry", role: "main", unitWeightsG: { cup: 120 }, nutritionPer100g: estimate({ calories: 362, protein: 8, fat: 1, carbs: 78, fiber: 2, sodium: 2 }) },
  { ingredientId: "bread-flour", defaultState: "dry", role: "main", unitWeightsG: { cup: 137 }, nutritionPer100g: estimate({ calories: 366, protein: 12.2, fat: 1.2, carbs: 75, fiber: 2.7, sodium: 3 }) },
  { ingredientId: "molasses", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 20 }, densityGPerMl: 1.4, nutritionPer100g: estimate({ calories: 290, protein: 0, fat: 0.1, carbs: 75, sugar: 75, addedSugar: 75, sodium: 37 }) },
  { ingredientId: "candied-ginger", defaultState: "prepared", role: "seasoning", unitWeightsG: { tbsp: 10 }, nutritionPer100g: estimate({ calories: 350, carbs: 88, sugar: 78, addedSugar: 78, sodium: 15 }) },
  { ingredientId: "marzipan", defaultState: "raw", role: "main", unitWeightsG: { tbsp: 15 }, nutritionPer100g: estimate({ calories: 424, protein: 6.9, fat: 17.5, saturatedFat: 1.6, carbs: 60, sugar: 58, addedSugar: 58, fiber: 5, sodium: 5 }) },
  { ingredientId: "applesauce", defaultState: "prepared", role: "main", unitWeightsG: { cup: 246 }, densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 42, protein: 0.2, fat: 0.1, carbs: 11.3, sugar: 9.4, fiber: 1.1, sodium: 2 }) },
  { ingredientId: "candied-peel", defaultState: "prepared", role: "seasoning", unitWeightsG: { tbsp: 8 }, nutritionPer100g: estimate({ calories: 331, carbs: 84, sugar: 76, addedSugar: 76, fiber: 3, sodium: 6 }) },
  // --- dessert ---
  { ingredientId: "mung-bean", defaultState: "dry", role: "main", unitWeightsG: { cup: 192 }, nutritionPer100g: estimate({ calories: 347, protein: 23.9, fat: 1.2, saturatedFat: 0.2, carbs: 62.6, sugar: 3, fiber: 16.3, sodium: 5 }) },
  { ingredientId: "grass-jelly", defaultState: "prepared", role: "main", unitWeightsG: { cup: 250 }, nutritionPer100g: estimate({ calories: 45, protein: 0.5, fat: 0.1, carbs: 11, sugar: 8, addedSugar: 8, fiber: 1, sodium: 10 }) },
  { ingredientId: "asian-pear", defaultState: "raw", role: "main", unitWeightsG: { piece: 275 }, nutritionPer100g: estimate({ calories: 42, protein: 0.5, fat: 0.2, carbs: 10.7, sugar: 7, fiber: 3.6, sodium: 2 }) },
  { ingredientId: "agar-powder", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 8 }, nutritionPer100g: estimate({ calories: 306, protein: 0.5, fat: 0.1, carbs: 76, fiber: 73, sodium: 20 }) },
  { ingredientId: "pandan-leaf", defaultState: "raw", role: "seasoning", unitWeightsG: { piece: 3 }, nutritionPer100g: estimate({ calories: 45, carbs: 10, fiber: 2, sodium: 1 }) },
  { ingredientId: "palm-sugar", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 17 }, nutritionPer100g: estimate({ calories: 375, carbs: 95, sugar: 90, addedSugar: 90, sodium: 15 }) },
  { ingredientId: "kinako", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 8 }, nutritionPer100g: estimate({ calories: 437, protein: 33, fat: 22, saturatedFat: 3.2, carbs: 33, sugar: 7, fiber: 15, sodium: 3 }) },
  { ingredientId: "purple-sweet-potato", defaultState: "raw", role: "main", unitWeightsG: { piece: 150 }, nutritionPer100g: estimate({ calories: 86, protein: 1.6, fat: 0.1, carbs: 20, sugar: 4, fiber: 3, sodium: 55 }) },
  { ingredientId: "water-chestnut", defaultState: "raw", role: "main", unitWeightsG: { cup: 140 }, nutritionPer100g: estimate({ calories: 97, protein: 1.4, fat: 0.1, carbs: 23.9, sugar: 4.6, fiber: 3, sodium: 14 }) },
  { ingredientId: "candied-winter-melon", defaultState: "prepared", role: "seasoning", unitWeightsG: { tbsp: 18 }, nutritionPer100g: estimate({ calories: 311, carbs: 77, sugar: 76, addedSugar: 76, sodium: 20 }) },
  { ingredientId: "salted-egg-yolk", defaultState: "prepared", role: "main", unitWeightsG: { piece: 18 }, nutritionPer100g: estimate({ calories: 385, protein: 14, fat: 33, saturatedFat: 11, carbs: 2, sugar: 0.4, sodium: 1500 }) },
  { ingredientId: "snow-fungus", defaultState: "dry", role: "main", unitWeightsG: { tbsp: 7 }, nutritionPer100g: estimate({ calories: 200, protein: 7.8, fat: 0.5, carbs: 70, fiber: 60, sodium: 20 }) },
  { ingredientId: "papaya", defaultState: "raw", role: "main", unitWeightsG: { piece: 500 }, nutritionPer100g: estimate({ calories: 43, protein: 0.5, fat: 0.3, carbs: 11, sugar: 7.8, fiber: 1.7, sodium: 8 }) },
  { ingredientId: "black-glutinous-rice", defaultState: "dry", role: "main", unitWeightsG: { cup: 190 }, nutritionPer100g: estimate({ calories: 357, protein: 8.5, fat: 3.3, carbs: 76, sugar: 1, fiber: 4.9, sodium: 4 }) },
  { ingredientId: "hawthorn", defaultState: "raw", role: "main", unitWeightsG: { piece: 5 }, nutritionPer100g: estimate({ calories: 59, protein: 0.5, fat: 0.3, carbs: 14, sugar: 8.8, fiber: 2.3, sodium: 3 }) },
  { ingredientId: "shiratama-flour", defaultState: "dry", role: "main", unitWeightsG: { cup: 150 }, nutritionPer100g: estimate({ calories: 371, protein: 5.5, fat: 0.6, carbs: 84, sugar: 0.5, fiber: 0.5, sodium: 5 }) },
  { ingredientId: "miso", defaultState: "prepared", role: "seasoning", unitWeightsG: { tbsp: 17 }, nutritionPer100g: estimate({ calories: 199, protein: 12.8, fat: 6, saturatedFat: 1, carbs: 25.4, sugar: 6, fiber: 5.4, sodium: 3728 }) },
];

const path = resolve(process.cwd(), "game-data/source/ingredients.json");
const catalog = JSON.parse(readFileSync(path, "utf8")) as GameIngredientCatalogV1;
const existing = new Set(catalog.ingredients.map((ingredient) => ingredient.ingredientId));

let added = 0;
for (const item of newIngredients) {
  if (existing.has(item.ingredientId)) continue;
  catalog.ingredients.push({
    ingredientId: item.ingredientId,
    defaultState: item.defaultState,
    unitWeightsG: item.unitWeightsG ?? {},
    ...(item.densityGPerMl !== undefined ? { densityGPerMl: item.densityGPerMl } : {}),
    nutritionPer100g: item.nutritionPer100g,
    nutritionProvenanceId: `cooking-lab-editorial-nutrition-${item.ingredientId}`,
    nutritionSource: {
      kind: "migration-estimate",
      provenanceId: `cooking-lab-editorial-nutrition-${item.ingredientId}`,
      limitations: "Cooking Lab editorial estimate for database ingestion; not eligible for commercial game export.",
    },
    role: item.role,
  });
  added += 1;
}

const existingRecordIds = new Set(catalog.conversionRecords.map((r) => r.recordId));
// Recompute the truly-new set (items not present before this run)
const beforeCount = catalog.ingredients.length - added;
const addedIds = new Set(catalog.ingredients.slice(beforeCount).map((i) => i.ingredientId));

for (const item of newIngredients) {
  if (!addedIds.has(item.ingredientId)) continue; // only newly added ingredients get conversion records
  const provId = `cooking-lab-editorial-nutrition-${item.ingredientId}`;
  const pushRecord = (unit: string, gramsPerUnit: number) => {
    const recordId = `${item.ingredientId}:${unit}:weight-v1`;
    if (existingRecordIds.has(recordId)) return;
    catalog.conversionRecords.push({
      recordId,
      unit: unit as never,
      gramsPerUnit,
      ingredientId: item.ingredientId,
      basis: "Cooking Lab editorial estimate unit weight; database batch C.",
      provenanceId: provId,
    });
    existingRecordIds.add(recordId);
  };
  if (item.unitWeightsG?.tsp) pushRecord("tsp", item.unitWeightsG.tsp);
  if (item.unitWeightsG?.tbsp) pushRecord("tbsp", item.unitWeightsG.tbsp);
  if (item.unitWeightsG?.piece) pushRecord("piece", item.unitWeightsG.piece);
  if (item.unitWeightsG?.cup) pushRecord("cup", item.unitWeightsG.cup);
  if (item.densityGPerMl !== undefined) pushRecord("ml", item.densityGPerMl);
}

writeFileSync(path, stableJson(catalog), "utf8");
process.stdout.write(`Added ${added} ingredients (${catalog.ingredients.length} total)\n`);
