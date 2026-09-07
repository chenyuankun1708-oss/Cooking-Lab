import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import type { GameNutritionDatasetSubsetV1 } from "@/types/game-recipe";
import type { Nutrition } from "@/types/nutrition";

type FdcFood = {
  fdcId: number;
  dataType: string;
  description: string;
  foodNutrients: Array<{
    nutrient: { id: number; name: string; unitName: string };
    amount?: number;
  }>;
};

type Mapping = {
  ingredientId: string;
  fdcId: number;
  dataset: "foundation" | "sr";
  addedSugar?: boolean;
};

const mappings: Mapping[] = [
  { ingredientId: "usda-egg", fdcId: 748967, dataset: "foundation" },
  { ingredientId: "usda-chicken-breast", fdcId: 2646170, dataset: "foundation" },
  { ingredientId: "usda-chicken-thigh", fdcId: 2646171, dataset: "foundation" },
  { ingredientId: "usda-salmon", fdcId: 2684441, dataset: "foundation" },
  { ingredientId: "usda-shrimp", fdcId: 2684443, dataset: "foundation" },
  { ingredientId: "usda-ground-beef", fdcId: 2514743, dataset: "foundation" },
  { ingredientId: "usda-ground-pork", fdcId: 2514745, dataset: "foundation" },
  { ingredientId: "usda-ground-turkey", fdcId: 2514747, dataset: "foundation" },
  { ingredientId: "usda-black-bean", fdcId: 2644285, dataset: "foundation" },
  { ingredientId: "usda-chickpea", fdcId: 2644288, dataset: "foundation" },
  { ingredientId: "usda-lentil-dry", fdcId: 2644283, dataset: "foundation" },
  { ingredientId: "usda-white-rice", fdcId: 2512381, dataset: "foundation" },
  { ingredientId: "usda-brown-rice", fdcId: 2512380, dataset: "foundation" },
  { ingredientId: "usda-oats", fdcId: 2346396, dataset: "foundation" },
  { ingredientId: "usda-wheat-flour", fdcId: 789951, dataset: "foundation" },
  { ingredientId: "usda-whole-wheat-flour", fdcId: 790085, dataset: "foundation" },
  { ingredientId: "usda-corn-flour", fdcId: 2710835, dataset: "foundation" },
  { ingredientId: "usda-corn", fdcId: 2710826, dataset: "foundation" },
  { ingredientId: "usda-tomato", fdcId: 1999634, dataset: "foundation" },
  { ingredientId: "usda-onion", fdcId: 790646, dataset: "foundation" },
  { ingredientId: "usda-garlic", fdcId: 1104647, dataset: "foundation" },
  { ingredientId: "usda-carrot", fdcId: 2258586, dataset: "foundation" },
  { ingredientId: "usda-broccoli", fdcId: 747447, dataset: "foundation" },
  { ingredientId: "usda-cauliflower", fdcId: 2685573, dataset: "foundation" },
  { ingredientId: "usda-red-pepper", fdcId: 2258590, dataset: "foundation" },
  { ingredientId: "usda-mushroom", fdcId: 1999629, dataset: "foundation" },
  { ingredientId: "usda-spinach", fdcId: 1999632, dataset: "foundation" },
  { ingredientId: "usda-potato", fdcId: 2346401, dataset: "foundation" },
  { ingredientId: "usda-sweet-potato", fdcId: 2346404, dataset: "foundation" },
  { ingredientId: "usda-zucchini", fdcId: 2685568, dataset: "foundation" },
  { ingredientId: "usda-eggplant", fdcId: 2685577, dataset: "foundation" },
  { ingredientId: "usda-cabbage", fdcId: 2346407, dataset: "foundation" },
  { ingredientId: "usda-cucumber", fdcId: 2346406, dataset: "foundation" },
  { ingredientId: "usda-bok-choy", fdcId: 2685572, dataset: "foundation" },
  { ingredientId: "usda-scallion", fdcId: 170005, dataset: "sr" },
  { ingredientId: "usda-leek", fdcId: 169246, dataset: "sr" },
  { ingredientId: "usda-radish", fdcId: 2747665, dataset: "foundation" },
  { ingredientId: "usda-asparagus", fdcId: 2710823, dataset: "foundation" },
  { ingredientId: "usda-mango", fdcId: 2710833, dataset: "foundation" },
  { ingredientId: "usda-pineapple", fdcId: 2346398, dataset: "foundation" },
  { ingredientId: "usda-apple", fdcId: 1750340, dataset: "foundation" },
  { ingredientId: "usda-banana", fdcId: 1105314, dataset: "foundation" },
  { ingredientId: "usda-orange", fdcId: 746771, dataset: "foundation" },
  { ingredientId: "usda-watermelon", fdcId: 167765, dataset: "sr" },
  { ingredientId: "usda-strawberry", fdcId: 2346409, dataset: "foundation" },
  { ingredientId: "usda-blueberry", fdcId: 2346411, dataset: "foundation" },
  { ingredientId: "usda-pear", fdcId: 2710836, dataset: "foundation" },
  { ingredientId: "usda-raspberry", fdcId: 2346410, dataset: "foundation" },
  { ingredientId: "usda-avocado", fdcId: 2710824, dataset: "foundation" },
  { ingredientId: "usda-whole-milk", fdcId: 746782, dataset: "foundation" },
  { ingredientId: "usda-yogurt", fdcId: 2259793, dataset: "foundation" },
  { ingredientId: "usda-feta", fdcId: 2259796, dataset: "foundation" },
  { ingredientId: "usda-butter", fdcId: 173430, dataset: "sr" },
  { ingredientId: "usda-olive-oil", fdcId: 171413, dataset: "sr" },
  { ingredientId: "usda-canola-oil", fdcId: 172336, dataset: "sr" },
  { ingredientId: "usda-sugar", fdcId: 746784, dataset: "foundation", addedSugar: true },
  { ingredientId: "usda-salt", fdcId: 173468, dataset: "sr" },
  { ingredientId: "usda-almond", fdcId: 2346393, dataset: "foundation" },
  { ingredientId: "usda-walnut", fdcId: 2346394, dataset: "foundation" },
  { ingredientId: "usda-peanut", fdcId: 2515376, dataset: "foundation" },
  { ingredientId: "usda-water", fdcId: 173647, dataset: "sr" },
  { ingredientId: "usda-coffee-brewed", fdcId: 171890, dataset: "sr" },
  { ingredientId: "usda-espresso", fdcId: 171891, dataset: "sr" },
  { ingredientId: "usda-black-tea-brewed", fdcId: 173227, dataset: "sr" },
  { ingredientId: "usda-green-tea-brewed", fdcId: 171917, dataset: "sr" },
  { ingredientId: "usda-cocoa", fdcId: 169593, dataset: "sr" },
  { ingredientId: "usda-cinnamon", fdcId: 171320, dataset: "sr" },
  { ingredientId: "usda-vinegar", fdcId: 172237, dataset: "sr" },
  { ingredientId: "usda-baking-powder", fdcId: 172803, dataset: "sr" },
  { ingredientId: "usda-vanilla", fdcId: 173471, dataset: "sr" },
  { ingredientId: "usda-lemon-juice", fdcId: 167747, dataset: "sr" },
  { ingredientId: "usda-honey", fdcId: 169640, dataset: "sr", addedSugar: true },
  { ingredientId: "usda-ginger", fdcId: 169231, dataset: "sr" },
  { ingredientId: "usda-basil", fdcId: 172232, dataset: "sr" },
  { ingredientId: "usda-parsley", fdcId: 170416, dataset: "sr" },
  { ingredientId: "usda-cornstarch", fdcId: 169698, dataset: "sr" },
  { ingredientId: "usda-pasta-dry", fdcId: 169736, dataset: "sr" },
  { ingredientId: "usda-rice-noodle-dry", fdcId: 169742, dataset: "sr" },
  { ingredientId: "usda-tofu", fdcId: 172476, dataset: "sr" },
  { ingredientId: "usda-soy-sauce", fdcId: 174277, dataset: "sr" },
  { ingredientId: "usda-coconut-milk", fdcId: 170173, dataset: "sr" },
];

const foundationPath = process.argv[2];
const srPath = process.argv[3];
if (!foundationPath || !srPath) {
  throw new Error("Usage: tsx scripts/import-usda-subset.ts <foundation-json> <sr-legacy-json>");
}
const foundation = JSON.parse(readFileSync(foundationPath, "utf8")) as { FoundationFoods: Array<FdcFood | null> };
const sr = JSON.parse(readFileSync(srPath, "utf8")) as { SRLegacyFoods: Array<FdcFood | null> };
const foundationById = new Map(foundation.FoundationFoods.filter((food): food is FdcFood => Boolean(food)).map((food) => [food.fdcId, food]));
const srById = new Map(sr.SRLegacyFoods.filter((food): food is FdcFood => Boolean(food)).map((food) => [food.fdcId, food]));

const subset: GameNutritionDatasetSubsetV1 = {
  schemaVersion: "cooking-lab-usda-subset-v1",
  provider: "USDA FoodData Central",
  sourceUrl: "https://fdc.nal.usda.gov/download-datasets",
  licenseId: "CC0-1.0",
  records: mappings.map((mapping) => {
    const food = (mapping.dataset === "foundation" ? foundationById : srById).get(mapping.fdcId);
    if (!food) throw new Error(`Missing FDC record ${mapping.fdcId}`);
    const nutrition = extractNutrition(food, Boolean(mapping.addedSugar));
    return {
      ingredientId: mapping.ingredientId,
      fdcId: String(food.fdcId),
      dataType: mapping.dataset === "foundation" ? "Foundation" as const : "SR Legacy" as const,
      datasetVersion: mapping.dataset === "foundation" ? "foundation-2026-04-30" : "sr-legacy-2018-04",
      sourceDescription: food.description,
      accessedAt: "2026-09-08",
      nutritionPer100g: nutrition,
    };
  }).sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
};

const outputPath = resolve(process.cwd(), "game-data/nutrition/usda-fooddata-central-subset.json");
mkdirSync(resolve(outputPath, ".."), { recursive: true });
writeFileSync(outputPath, stableJson(subset));
process.stdout.write(`Imported ${subset.records.length} USDA records.\n`);

function extractNutrition(food: FdcFood, addedSugarIngredient: boolean): Nutrition {
  const byId = new Map(food.foodNutrients.map((entry) => [entry.nutrient.id, entry.amount ?? 0]));
  const energy = byId.get(1008) ?? byId.get(2047) ?? byId.get(2048);
  if (energy === undefined) throw new Error(`FDC ${food.fdcId} has no energy value`);
  const sugar = byId.get(2000) ?? byId.get(1063) ?? 0;
  return {
    calories: round(energy),
    protein: round(byId.get(1003) ?? 0),
    fat: round(byId.get(1004) ?? 0),
    saturatedFat: round(byId.get(1258) ?? 0),
    carbs: round(byId.get(1005) ?? 0),
    sugar: round(sugar),
    addedSugar: addedSugarIngredient ? round(sugar) : 0,
    fiber: round(byId.get(1079) ?? 0),
    sodium: round(byId.get(1093) ?? 0),
  };
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
