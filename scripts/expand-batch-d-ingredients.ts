import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import type { GameIngredientCatalogV1, GameIngredientState } from "@/types/game-recipe";
import type { PortionRole } from "@/types/game-recipe-database";
import type { Nutrition } from "@/types/nutrition";

/**
 * Batch D ingredient expansion: ingredients for the 244-recipe batch
 * (500-entry milestone). Editorial-estimate nutrition; conversion records
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
  // --- bartending (22) ---
  { ingredientId: "mezcal", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "grand-marnier", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 308, carbs: 40, sugar: 40, addedSugar: 40 }) },
  { ingredientId: "st-germain", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 296, carbs: 40, sugar: 40, addedSugar: 40 }) },
  { ingredientId: "maraschino-liqueur", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 288, carbs: 36, sugar: 36, addedSugar: 36 }) },
  { ingredientId: "benedictine", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 300, carbs: 38, sugar: 38, addedSugar: 38 }) },
  { ingredientId: "creme-de-violette", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 285, carbs: 36, sugar: 36, addedSugar: 36 }) },
  { ingredientId: "apple-brandy", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "apricot-brandy", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 265, carbs: 26, sugar: 26, addedSugar: 26 }) },
  { ingredientId: "peach-brandy", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 260, carbs: 24, sugar: 24, addedSugar: 24 }) },
  { ingredientId: "blackberry-brandy", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 272, carbs: 30, sugar: 30, addedSugar: 30 }) },
  { ingredientId: "allspice-dram", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 296, carbs: 38, sugar: 38, addedSugar: 38 }) },
  { ingredientId: "falernum", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.08, nutritionPer100g: estimate({ calories: 320, carbs: 48, sugar: 48, addedSugar: 48 }) },
  { ingredientId: "angostura-bitters", defaultState: "liquid", role: "seasoning", unitWeightsG: { tsp: 5 }, densityGPerMl: 1, nutritionPer100g: estimate({ calories: 380, carbs: 62, sugar: 55, addedSugar: 55, sodium: 120 }) },
  { ingredientId: "peychauds-bitters", defaultState: "liquid", role: "seasoning", unitWeightsG: { tsp: 5 }, densityGPerMl: 1, nutritionPer100g: estimate({ calories: 375, carbs: 60, sugar: 52, addedSugar: 52, sodium: 110 }) },
  { ingredientId: "dry-sherry", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.99, nutritionPer100g: estimate({ calories: 120, carbs: 4, sugar: 3, sodium: 5 }) },
  { ingredientId: "cream-sherry", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 165, carbs: 14, sugar: 13, addedSugar: 13 }) },
  { ingredientId: "port-wine", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 172, carbs: 14, sugar: 12, addedSugar: 12 }) },
  { ingredientId: "madeira", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.01, nutritionPer100g: estimate({ calories: 140, carbs: 6, sugar: 5, addedSugar: 5 }) },
  { ingredientId: "soju", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.96, nutritionPer100g: estimate({ calories: 207 }) },
  { ingredientId: "shochu", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 205 }) },
  { ingredientId: "midori", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 280, carbs: 36, sugar: 36, addedSugar: 36 }) },
  { ingredientId: "yuzushu", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 195, carbs: 24, sugar: 24, addedSugar: 24 }) },
  // --- dessert & baking (20) ---
  { ingredientId: "rice-flour", defaultState: "dry", role: "main", unitWeightsG: { cup: 158 }, nutritionPer100g: estimate({ calories: 366, protein: 5.9, fat: 1.4, carbs: 80, fiber: 2.4, sodium: 3 }) },
  { ingredientId: "tapioca-starch", defaultState: "dry", role: "main", unitWeightsG: { cup: 110 }, nutritionPer100g: estimate({ calories: 358, carbs: 88, fiber: 0.2, sodium: 2 }) },
  { ingredientId: "potato-starch", defaultState: "dry", role: "main", unitWeightsG: { cup: 150 }, nutritionPer100g: estimate({ calories: 353, protein: 0.3, fat: 0.1, carbs: 87, sodium: 5 }) },
  { ingredientId: "wheat-starch", defaultState: "dry", role: "main", unitWeightsG: { cup: 120 }, nutritionPer100g: estimate({ calories: 361, protein: 0.3, fat: 0.1, carbs: 89, sodium: 3 }) },
  { ingredientId: "lard", defaultState: "raw", role: "main", unitWeightsG: { tbsp: 12.8 }, densityGPerMl: 0.9, nutritionPer100g: estimate({ calories: 902, fat: 100, saturatedFat: 39.2, sodium: 2 }) },
  { ingredientId: "creme-fraiche", defaultState: "raw", role: "main", unitWeightsG: { tbsp: 15 }, densityGPerMl: 0.98, nutritionPer100g: estimate({ calories: 293, protein: 2.4, fat: 30, saturatedFat: 18.9, carbs: 3, sugar: 3, sodium: 27 }) },
  { ingredientId: "dulce-de-leche", defaultState: "prepared", role: "main", unitWeightsG: { tbsp: 19 }, densityGPerMl: 1.2, nutritionPer100g: estimate({ calories: 320, protein: 6.8, fat: 7.6, saturatedFat: 4.6, carbs: 54, sugar: 54, addedSugar: 54, sodium: 105 }) },
  { ingredientId: "guava-paste", defaultState: "prepared", role: "main", unitWeightsG: { tbsp: 18 }, nutritionPer100g: estimate({ calories: 300, carbs: 75, sugar: 70, addedSugar: 55, fiber: 3, sodium: 20 }) },
  { ingredientId: "tamarind-paste", defaultState: "prepared", role: "seasoning", unitWeightsG: { tbsp: 18 }, nutritionPer100g: estimate({ calories: 239, protein: 2.8, fat: 0.6, carbs: 62, sugar: 56, fiber: 5.1, sodium: 25 }) },
  { ingredientId: "instant-coffee", defaultState: "dry", role: "seasoning", unitWeightsG: { tsp: 2 }, nutritionPer100g: estimate({ calories: 250, protein: 12, carbs: 55, sodium: 40 }) },
  { ingredientId: "persimmon", defaultState: "raw", role: "main", unitWeightsG: { piece: 168 }, nutritionPer100g: estimate({ calories: 70, protein: 0.6, fat: 0.2, carbs: 18.6, sugar: 12.5, fiber: 3.6, sodium: 1 }) },
  { ingredientId: "fig", defaultState: "raw", role: "main", unitWeightsG: { piece: 50 }, nutritionPer100g: estimate({ calories: 74, protein: 0.8, fat: 0.3, carbs: 19.2, sugar: 16.3, fiber: 2.9, sodium: 1 }) },
  { ingredientId: "date-fruit", defaultState: "raw", role: "main", unitWeightsG: { piece: 24 }, nutritionPer100g: estimate({ calories: 282, protein: 2.5, fat: 0.4, carbs: 75, sugar: 63, fiber: 8, sodium: 2 }) },
  { ingredientId: "jackfruit", defaultState: "raw", role: "main", unitWeightsG: { cup: 165 }, nutritionPer100g: estimate({ calories: 95, protein: 1.7, fat: 0.6, carbs: 23.2, sugar: 19.1, fiber: 1.5, sodium: 2 }) },
  { ingredientId: "passionfruit", defaultState: "raw", role: "main", unitWeightsG: { piece: 18 }, nutritionPer100g: estimate({ calories: 97, protein: 2.2, fat: 0.7, carbs: 23.4, sugar: 11.2, fiber: 10.4, sodium: 5 }) },
  { ingredientId: "dragonfruit", defaultState: "raw", role: "main", unitWeightsG: { piece: 200 }, nutritionPer100g: estimate({ calories: 60, protein: 1.2, fat: 0.4, carbs: 13, sugar: 8, fiber: 3, sodium: 5 }) },
  { ingredientId: "rambutan", defaultState: "raw", role: "main", unitWeightsG: { piece: 9 }, nutritionPer100g: estimate({ calories: 82, protein: 0.7, fat: 0.2, carbs: 20.9, sugar: 15.2, fiber: 1.3, sodium: 2 }) },
  { ingredientId: "guava", defaultState: "raw", role: "main", unitWeightsG: { piece: 55 }, nutritionPer100g: estimate({ calories: 68, protein: 2.6, fat: 1, carbs: 14.3, sugar: 8.9, fiber: 5.4, sodium: 2 }) },
  { ingredientId: "quince", defaultState: "raw", role: "main", unitWeightsG: { piece: 92 }, nutritionPer100g: estimate({ calories: 57, protein: 0.4, fat: 0.1, carbs: 15.3, sugar: 7.8, fiber: 1.9, sodium: 4 }) },
  { ingredientId: "pandan-extract", defaultState: "liquid", role: "seasoning", unitWeightsG: { tsp: 4 }, nutritionPer100g: estimate({ calories: 40, carbs: 9, sugar: 9, addedSugar: 9 }) },
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
// Only the truly-new set (items not present before this run) gets conversion records
const beforeCount = catalog.ingredients.length - added;
const addedIds = new Set(catalog.ingredients.slice(beforeCount).map((i) => i.ingredientId));

for (const item of newIngredients) {
  if (!addedIds.has(item.ingredientId)) continue;
  const provId = `cooking-lab-editorial-nutrition-${item.ingredientId}`;
  const pushRecord = (unit: string, gramsPerUnit: number) => {
    const recordId = `${item.ingredientId}:${unit}:weight-v1`;
    if (existingRecordIds.has(recordId)) return;
    catalog.conversionRecords.push({
      recordId,
      unit: unit as never,
      gramsPerUnit,
      ingredientId: item.ingredientId,
      basis: "Cooking Lab editorial estimate unit weight; database batch D.",
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
