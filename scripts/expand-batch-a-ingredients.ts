import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import type { GameIngredientCatalogV1, GameIngredientState } from "@/types/game-recipe";
import type { PortionRole } from "@/types/game-recipe-database";
import type { Nutrition } from "@/types/nutrition";

/**
 * Batch A ingredient expansion: adds the baking / bartending / dessert
 * ingredients needed by the 20-recipe pilot batch. Nutrition values are
 * editor estimates (migration-estimate provenance); per-100g basis.
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
  // --- baking ---
  { ingredientId: "baking-soda", defaultState: "dry", role: "seasoning", unitWeightsG: { tsp: 4.6 }, nutritionPer100g: estimate({ calories: 0, sodium: 12590 }) },
  { ingredientId: "dark-chocolate", defaultState: "raw", role: "main", unitWeightsG: { piece: 5 }, densityGPerMl: 1.3, nutritionPer100g: estimate({ calories: 598, protein: 7.8, fat: 42.6, saturatedFat: 24.5, carbs: 45.9, sugar: 24, fiber: 10.9, sodium: 20 }) },
  { ingredientId: "milk-chocolate", defaultState: "raw", role: "main", unitWeightsG: { piece: 5 }, nutritionPer100g: estimate({ calories: 535, protein: 7.6, fat: 30, saturatedFat: 18.9, carbs: 59.4, sugar: 51.5, sodium: 79 }) },
  { ingredientId: "white-chocolate", defaultState: "raw", role: "main", unitWeightsG: { piece: 5 }, nutritionPer100g: estimate({ calories: 539, protein: 5.9, fat: 32.1, saturatedFat: 19.4, carbs: 59.2, sugar: 59.2, sodium: 90 }) },
  { ingredientId: "heavy-cream", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15, cup: 238 }, densityGPerMl: 1, nutritionPer100g: estimate({ calories: 340, protein: 2.1, fat: 36, saturatedFat: 23, carbs: 2.8, sugar: 2.8 }) },
  { ingredientId: "brown-sugar", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 12.5, cup: 213 }, nutritionPer100g: estimate({ calories: 380, carbs: 98.1, sugar: 97, addedSugar: 97, sodium: 28 }) },
  { ingredientId: "powdered-sugar", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 7.5, cup: 121 }, nutritionPer100g: estimate({ calories: 389, carbs: 99.8, sugar: 99.8, addedSugar: 99.8 }) },
  { ingredientId: "active-dry-yeast", defaultState: "dry", role: "seasoning", unitWeightsG: { tsp: 3 }, nutritionPer100g: estimate({ calories: 325, protein: 40.4, carbs: 41.2, fiber: 26.4, sodium: 51 }) },
  // --- bartending ---
  { ingredientId: "vodka-80", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "gin-80", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "white-rum-80", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "dark-rum-80", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 0.96, nutritionPer100g: estimate({ calories: 236 }) },
  { ingredientId: "tequila-blanco-80", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 0.95, nutritionPer100g: estimate({ calories: 231 }) },
  { ingredientId: "orange-liqueur-80", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 296, carbs: 36, sugar: 36, addedSugar: 36 }) },
  { ingredientId: "coffee-liqueur-80", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 1.05, nutritionPer100g: estimate({ calories: 327, carbs: 33, sugar: 32, addedSugar: 32, sodium: 9 }) },
  { ingredientId: "sweet-vermouth", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 1.03, nutritionPer100g: estimate({ calories: 168, carbs: 15, sugar: 14, addedSugar: 14 }) },
  { ingredientId: "dry-vermouth", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 1.02, nutritionPer100g: estimate({ calories: 118, carbs: 5, sugar: 4, addedSugar: 4 }) },
  { ingredientId: "campari", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 15 }, densityGPerMl: 1.04, nutritionPer100g: estimate({ calories: 252, carbs: 32, sugar: 32, addedSugar: 32 }) },
  { ingredientId: "club-soda", defaultState: "liquid", role: "main", unitWeightsG: { ml: 1, cup: 237 }, densityGPerMl: 1, nutritionPer100g: estimate({ sodium: 12 }) },
  { ingredientId: "ginger-beer", defaultState: "liquid", role: "main", unitWeightsG: { ml: 1, cup: 237 }, densityGPerMl: 1.01, nutritionPer100g: estimate({ calories: 39, carbs: 9.8, sugar: 9.5, addedSugar: 9.5 }) },
  { ingredientId: "grenadine-syrup", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 20 }, densityGPerMl: 1.31, nutritionPer100g: estimate({ calories: 288, carbs: 71, sugar: 70, addedSugar: 70 }) },
  { ingredientId: "simple-syrup", defaultState: "liquid", role: "seasoning", unitWeightsG: { tbsp: 20 }, densityGPerMl: 1.28, nutritionPer100g: estimate({ calories: 333, carbs: 83, sugar: 83, addedSugar: 83 }) },
  // --- dessert extras ---
  { ingredientId: "strawberry", defaultState: "raw", role: "main", unitWeightsG: { piece: 12, cup: 152 }, nutritionPer100g: estimate({ calories: 32, protein: 0.7, fat: 0.3, saturatedFat: 0, carbs: 7.7, sugar: 4.9, fiber: 2, sodium: 1 }) },
  { ingredientId: "matcha-powder", defaultState: "dry", role: "seasoning", unitWeightsG: { tsp: 2 }, nutritionPer100g: estimate({ calories: 325, protein: 24, fat: 5, saturatedFat: 1, carbs: 50, sugar: 5, fiber: 33, sodium: 60 }) },
  { ingredientId: "gelatin-powder", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 9 }, nutritionPer100g: estimate({ calories: 335, protein: 85, carbs: 0.7, sodium: 77 }) },
  { ingredientId: "dark-cocoa-70", defaultState: "dry", role: "seasoning", unitWeightsG: { tbsp: 6 }, nutritionPer100g: estimate({ calories: 598, protein: 12, fat: 43, saturatedFat: 25, carbs: 33, sugar: 3, fiber: 30, sodium: 18 }) },
  { ingredientId: "fresh-rosemary", defaultState: "raw", role: "garnish", unitWeightsG: { tbsp: 3 }, nutritionPer100g: estimate({ calories: 131, protein: 3.3, fat: 5.9, carbs: 20.7, fiber: 14.1, sodium: 26 }) },
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

// Conversion records for ingredient-specific units
for (const item of newIngredients) {
  const provId = `cooking-lab-editorial-nutrition-${item.ingredientId}`;
  const pushRecord = (unit: string, gramsPerUnit: number, basis: string) => {
    catalog.conversionRecords.push({
      recordId: `${item.ingredientId}:${unit}:weight-v1`,
      unit: unit as never,
      gramsPerUnit,
      ingredientId: item.ingredientId,
      basis,
      provenanceId: provId,
    });
  };
  if (item.unitWeightsG?.tsp) pushRecord("tsp", item.unitWeightsG.tsp, "Cooking Lab editorial estimate unit weight; database batch A.");
  if (item.unitWeightsG?.tbsp) pushRecord("tbsp", item.unitWeightsG.tbsp, "Cooking Lab editorial estimate unit weight; database batch A.");
  if (item.unitWeightsG?.piece) pushRecord("piece", item.unitWeightsG.piece, "Cooking Lab editorial estimate unit weight; database batch A.");
  if (item.unitWeightsG?.cup) pushRecord("cup", item.unitWeightsG.cup, "Cooking Lab editorial estimate unit weight; database batch A.");
  if (item.densityGPerMl !== undefined) pushRecord("ml", item.densityGPerMl, "Cooking Lab editorial estimate density; database batch A.");
}

writeFileSync(path, stableJson(catalog), "utf8");
process.stdout.write(`Added ${added} ingredients (${catalog.ingredients.length} total)\n`);
