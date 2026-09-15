import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import type { GameIngredientCatalogV1, GameIngredientState } from "@/types/game-recipe";
import type { PortionRole } from "@/types/game-recipe-database";
import type { Nutrition } from "@/types/nutrition";

/**
 * Batch B ingredient expansion: baking / bartending / dessert ingredients
 * for the 50-recipe batch (120-entry milestone). Editorial-estimate
 * nutrition; conversion records stay consistent with unit weights.
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
  // --- bartending: spirits, liqueurs, mixers, fruit ---
  { ingredientId: "bourbon-80", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.94, nutritionPer100g: estimate({ calories: 231, sodium: 1 }) },
  { ingredientId: "scotch-80", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.94, nutritionPer100g: estimate({ calories: 231, sodium: 1 }) },
  { ingredientId: "brandy-80", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.94, nutritionPer100g: estimate({ calories: 231, sodium: 4 }) },
  { ingredientId: "amaretto-80", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 298, carbs: 42, sugar: 42, addedSugar: 42, sodium: 5 }) },
  { ingredientId: "blue-curacao-80", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 296, carbs: 36, sugar: 36, addedSugar: 36, sodium: 12 }) },
  { ingredientId: "aperol", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.06, nutritionPer100g: estimate({ calories: 234, carbs: 32, sugar: 32, addedSugar: 32, sodium: 40 }) },
  { ingredientId: "prosecco", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.99, nutritionPer100g: estimate({ calories: 80, carbs: 3, sugar: 3, addedSugar: 3, sodium: 10 }) },
  { ingredientId: "dry-white-wine", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.99, nutritionPer100g: estimate({ calories: 82, carbs: 2.6, sugar: 1.4, sodium: 5 }) },
  { ingredientId: "peach-schnapps", defaultState: "liquid", role: "seasoning", densityGPerMl: 0.96, nutritionPer100g: estimate({ calories: 276, carbs: 34, sugar: 34, addedSugar: 34, sodium: 8 }) },
  { ingredientId: "irish-cream-34", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 253, protein: 3.4, fat: 11, saturatedFat: 7, carbs: 17, sugar: 17, addedSugar: 17, sodium: 40 }) },
  { ingredientId: "elderflower-liqueur", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 296, carbs: 40, sugar: 40, addedSugar: 40, sodium: 8 }) },
  { ingredientId: "raspberry-liqueur", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.06, nutritionPer100g: estimate({ calories: 312, carbs: 44, sugar: 44, addedSugar: 44, sodium: 6 }) },
  { ingredientId: "agave-syrup", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 22 }, densityGPerMl: 1.35, nutritionPer100g: estimate({ calories: 310, carbs: 76, sugar: 76, addedSugar: 76, sodium: 4 }) },
  { ingredientId: "orange-bitters", defaultState: "liquid", role: "seasoning", unitWeightsG: { tsp: 5 }, nutritionPer100g: estimate({ calories: 390, carbs: 60, sugar: 60, addedSugar: 60, sodium: 110 }) },
  { ingredientId: "peach", defaultState: "raw", role: "main", unitWeightsG: { piece: 150 }, nutritionPer100g: estimate({ calories: 39, protein: 0.9, fat: 0.3, carbs: 9.5, sugar: 8.4, fiber: 1.5 }) },
  { ingredientId: "raspberry", defaultState: "raw", role: "main", unitWeightsG: { cup: 123 }, nutritionPer100g: estimate({ calories: 52, protein: 1.2, fat: 0.7, carbs: 12, sugar: 4.4, fiber: 6.5, sodium: 1 }) },
  { ingredientId: "pineapple-juice", defaultState: "liquid", role: "main", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 53, protein: 0.4, fat: 0.1, carbs: 13, sugar: 10, fiber: 0.2, sodium: 2 }) },
  { ingredientId: "orange-juice", defaultState: "liquid", role: "main", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 45, protein: 0.7, fat: 0.2, carbs: 10.4, sugar: 8.4, fiber: 0.2, sodium: 1 }) },
  { ingredientId: "cranberry-juice", defaultState: "liquid", role: "main", densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 46, protein: 0.4, fat: 0.1, carbs: 12.2, sugar: 12.1, addedSugar: 12.1, fiber: 0.2, sodium: 2 }) },
  { ingredientId: "tomato-juice", defaultState: "liquid", role: "main", densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 17, protein: 0.8, fat: 0.1, carbs: 3.5, sugar: 2.6, fiber: 0.4, sodium: 110 }) },
  { ingredientId: "basil-fresh", defaultState: "raw", role: "garnish", unitWeightsG: { tbsp: 3 }, nutritionPer100g: estimate({ calories: 23, protein: 3.2, fat: 0.6, carbs: 2.7, sugar: 0.3, fiber: 1.6, sodium: 4 }) },
  { ingredientId: "cucumber", defaultState: "raw", role: "main", unitWeightsG: { piece: 300 }, nutritionPer100g: estimate({ calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, sugar: 1.7, fiber: 0.5, sodium: 2 }) },
  { ingredientId: "cola", defaultState: "liquid", role: "main", densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 42, carbs: 10.6, sugar: 10.6, addedSugar: 10.6, sodium: 4 }) },
  // --- baking ---
  { ingredientId: "almond-flour", defaultState: "dry", role: "main", unitWeightsG: { cup: 96 }, nutritionPer100g: estimate({ calories: 579, protein: 21.2, fat: 50.2, saturatedFat: 3.8, carbs: 19.5, sugar: 4.4, fiber: 10.9, sodium: 7 }) },
  { ingredientId: "cream-cheese", defaultState: "raw", role: "main", unitWeightsG: { tbsp: 15 }, nutritionPer100g: estimate({ calories: 342, protein: 6.2, fat: 34.4, saturatedFat: 19.9, carbs: 5.5, sugar: 3.2, sodium: 321 }) },
  { ingredientId: "sour-cream", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 14 }, densityGPerMl: 1, nutritionPer100g: estimate({ calories: 198, protein: 2.4, fat: 19.4, saturatedFat: 10.7, carbs: 4.6, sugar: 3.4, sodium: 91 }) },
  { ingredientId: "buttermilk", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 62, protein: 3.2, fat: 3.5, saturatedFat: 2, carbs: 4.8, sugar: 4.8, sodium: 105 }) },
  { ingredientId: "evaporated-milk", defaultState: "liquid", role: "seasoning", densityGPerMl: 1.07, nutritionPer100g: estimate({ calories: 134, protein: 6.8, fat: 7.6, saturatedFat: 4.6, carbs: 10, sugar: 10, sodium: 106 }) },
  { ingredientId: "cream-of-tartar", defaultState: "dry", role: "seasoning", unitWeightsG: { tsp: 3 }, nutritionPer100g: estimate({ calories: 258, carbs: 62, fiber: 0.1, sodium: 2 }) },
  { ingredientId: "walnut", defaultState: "raw", role: "main", unitWeightsG: { piece: 5, cup: 117 }, nutritionPer100g: estimate({ calories: 654, protein: 15.2, fat: 65.2, saturatedFat: 6.1, carbs: 13.7, sugar: 2.6, fiber: 6.7, sodium: 2 }) },
  { ingredientId: "pecan", defaultState: "raw", role: "main", unitWeightsG: { piece: 4, cup: 109 }, nutritionPer100g: estimate({ calories: 691, protein: 9.2, fat: 71.9, saturatedFat: 6.2, carbs: 13.9, sugar: 3.9, fiber: 9.6 }) },
  { ingredientId: "raisin", defaultState: "dry", role: "main", unitWeightsG: { tbsp: 10, cup: 145 }, nutritionPer100g: estimate({ calories: 299, protein: 3.1, fat: 0.5, saturatedFat: 0.1, carbs: 79.2, sugar: 59.2, fiber: 3.7, sodium: 11 }) },
  { ingredientId: "shredded-coconut", defaultState: "dry", role: "main", unitWeightsG: { cup: 80 }, nutritionPer100g: estimate({ calories: 660, protein: 6.9, fat: 64.5, saturatedFat: 57.2, carbs: 7.4, sugar: 7.4, fiber: 16.3, sodium: 37 }) },
  { ingredientId: "semisweet-chocolate-chips", defaultState: "raw", role: "main", unitWeightsG: { cup: 170 }, nutritionPer100g: estimate({ calories: 479, protein: 4.2, fat: 28.5, saturatedFat: 16.7, carbs: 63.9, sugar: 53.7, fiber: 5.3, sodium: 24 }) },
  { ingredientId: "pumpkin-puree", defaultState: "prepared", role: "main", unitWeightsG: { cup: 245 }, nutritionPer100g: estimate({ calories: 34, protein: 1.1, fat: 0.3, saturatedFat: 0.1, carbs: 8.1, sugar: 2.8, fiber: 0.5, sodium: 1 }) },
  { ingredientId: "zucchini", defaultState: "raw", role: "main", unitWeightsG: { piece: 196 }, nutritionPer100g: estimate({ calories: 17, protein: 1.2, fat: 0.3, carbs: 3.1, sugar: 2.5, fiber: 1, sodium: 8 }) },
  // --- dessert extras ---
  { ingredientId: "ricotta", defaultState: "raw", role: "main", unitWeightsG: { tbsp: 15 }, nutritionPer100g: estimate({ calories: 174, protein: 11.3, fat: 13, saturatedFat: 8, carbs: 3, sugar: 3, sodium: 84 }) },
  { ingredientId: "black-sesame-paste", defaultState: "prepared", role: "main", unitWeightsG: { tbsp: 16 }, nutritionPer100g: estimate({ calories: 595, protein: 10, fat: 48, saturatedFat: 6.5, carbs: 22, sugar: 2, fiber: 11, sodium: 35 }) },
  { ingredientId: "glutinous-rice-flour", defaultState: "dry", role: "main", unitWeightsG: { cup: 150 }, nutritionPer100g: estimate({ calories: 365, protein: 6.3, fat: 0.7, saturatedFat: 0.2, carbs: 81.5, fiber: 1.8, sodium: 5 }) },
  { ingredientId: "red-bean-paste", defaultState: "prepared", role: "main", unitWeightsG: { tbsp: 20 }, nutritionPer100g: estimate({ calories: 328, protein: 6, fat: 0.6, saturatedFat: 0.1, carbs: 75, sugar: 48, addedSugar: 48, fiber: 6, sodium: 20 }) },
  { ingredientId: "taro", defaultState: "raw", role: "main", unitWeightsG: { piece: 350 }, nutritionPer100g: estimate({ calories: 142, protein: 1.5, fat: 0.1, saturatedFat: 0.02, carbs: 34, sugar: 1, fiber: 3, sodium: 14 }) },
  { ingredientId: "sago-pearls", defaultState: "dry", role: "main", unitWeightsG: { tbsp: 10 }, nutritionPer100g: estimate({ calories: 355, protein: 0.2, carbs: 88, fiber: 0.2, sodium: 3 }) },
  { ingredientId: "lychee", defaultState: "raw", role: "main", unitWeightsG: { piece: 20 }, nutritionPer100g: estimate({ calories: 66, protein: 0.8, fat: 0.4, carbs: 16.5, sugar: 15.2, fiber: 1.3, sodium: 1 }) },
  { ingredientId: "goji-berry", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 8 }, nutritionPer100g: estimate({ calories: 349, protein: 14.3, fat: 0.4, carbs: 77, sugar: 45, fiber: 13, sodium: 298 }) },
  { ingredientId: "dried-longan", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 10 }, nutritionPer100g: estimate({ calories: 286, protein: 5, fat: 0.5, carbs: 71, sugar: 60, fiber: 3, sodium: 5 }) },
  { ingredientId: "osmanthus-dried", defaultState: "dry", role: "seasoning", unitWeightsG: { tsp: 1 }, nutritionPer100g: estimate({ calories: 300, protein: 8, fat: 3, carbs: 62, sugar: 30, fiber: 20, sodium: 20 }) },
  { ingredientId: "lotus-seed", defaultState: "dry", role: "main", unitWeightsG: { tbsp: 12 }, nutritionPer100g: estimate({ calories: 332, protein: 17, fat: 2, saturatedFat: 0.3, carbs: 64, sugar: 2, fiber: 9, sodium: 5 }) },
  { ingredientId: "soy-milk", defaultState: "liquid", role: "main", densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 54, protein: 3.3, fat: 1.8, saturatedFat: 0.4, carbs: 6, sugar: 4, sodium: 40 }) },
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
const newlyAdded = new Set<string>();
for (const item of newIngredients) {
  if (!existing.has(item.ingredientId)) newlyAdded.add(item.ingredientId);
}
for (const item of newIngredients) {
  // Only generate conversion records for ingredients this run actually added;
  // pre-existing ingredients keep their own unit-weight contract untouched.
  if (!newlyAdded.has(item.ingredientId)) continue;
  const provId = `cooking-lab-editorial-nutrition-${item.ingredientId}`;
  const pushRecord = (unit: string, gramsPerUnit: number) => {
    const recordId = `${item.ingredientId}:${unit}:weight-v1`;
    if (existingRecordIds.has(recordId)) return;
    catalog.conversionRecords.push({
      recordId,
      unit: unit as never,
      gramsPerUnit,
      ingredientId: item.ingredientId,
      basis: "Cooking Lab editorial estimate unit weight; database batch B.",
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
