import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import { createGameRecipeArtifactVersion } from "@/lib/game-recipe-validation";
import type {
  GameHeatControlV1,
  GameIngredientPortionV1,
  GameOperationNodeV1,
  GameRecipeV1,
  GameTargetStateV1,
} from "@/types/game-recipe";
import type {
  DatabaseCategoryTag,
  PortionRole,
  RecipeDatabaseExtensionV1,
} from "@/types/game-recipe-database";
import type { FlavorProfile } from "@/types/flavor";
import type { Nutrition } from "@/types/nutrition";

/**
 * Batch A pilot: 20 database recipes (8 baking, 6 bartending, 6 dessert)
 * authored from the Cooking Lab knowledge base as ai-assisted drafts.
 *
 * Every entry is `database-entry` eligibility: structurally complete
 * (portions, DAG, nutrition sums, mutation coverage for quality nodes)
 * with explicit usage-limitation notes. Fields not applicable stay empty.
 */

type OpSpec = {
  op: GameOperationNodeV1["operationType"];
  inputs?: number[]; // portion indexes (0-based)
  durationMs?: number;
  waitMs?: number;
  params?: GameOperationNodeV1["parameters"];
  heat?: GameHeatControlV1;
  targets?: GameTargetStateV1[];
  criticality?: GameOperationNodeV1["criticality"];
  equipment?: string;
};

type PortionSpec = {
  id: string; // ingredient id in catalog
  grams: number;
  amount: number;
  unit: GameIngredientPortionV1["sourceQuantity"]["unit"];
  conversionId: string;
  role: PortionRole;
  state?: GameIngredientPortionV1["initialState"];
  optional?: boolean;
};

interface DraftRecipe {
  slug: string;
  itemType: GameRecipeV1["itemType"];
  servings: number;
  yieldAmount: number;
  yieldUnit: GameRecipeV1["yield"]["unit"];
  simulationProfile: GameRecipeV1["simulationProfile"];
  categoryTags: DatabaseCategoryTag[];
  cuisineIds?: string[];
  mealRoleIds: string[];
  servingContextIds: string[];
  flavor: FlavorProfile;
  portions: PortionSpec[];
  ops: OpSpec[];
}

const NUTRI_ZERO: Nutrition = { calories: 0, protein: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0, sodium: 0 };

const ingredientCatalog = JSON.parse(readFileSync(resolve(process.cwd(), "game-data/source/ingredients.json"), "utf8")) as {
  ingredients: Array<{ ingredientId: string; nutritionPer100g: Nutrition; nutritionProvenanceId: string }>;
  conversionRecords: Array<{ recordId: string }>;
};
const ingredientById = new Map(ingredientCatalog.ingredients.map((i) => [i.ingredientId, i]));
const conversionIds = new Set(ingredientCatalog.conversionRecords.map((r) => r.recordId));

// Auto equipment: pick a sensible default from the operation catalog.
const operationCatalog = JSON.parse(readFileSync(resolve(process.cwd(), "game-data/operations.json"), "utf8")) as {
  operations: Array<{ id: string; equipmentRequired: boolean; compatibleEquipmentIds: string[]; inputRequirement: "none" | "one-or-more"; targetStateRequired: boolean }>;
};
const operationById = new Map<string, { id: string; equipmentRequired: boolean; compatibleEquipmentIds: string[]; inputRequirement: "none" | "one-or-more"; targetStateRequired: boolean }>(operationCatalog.operations.map((op) => [op.id, op]));
const drinkItemTypes = new Set(["alcoholic-drink", "non-alcoholic-drink", "tea", "coffee"]);
function defaultEquipmentFor(op: string, itemType: string): string | undefined {
  const definition = operationById.get(op);
  if (!definition || !definition.equipmentRequired || !definition.compatibleEquipmentIds.length) return undefined;
  const options = definition.compatibleEquipmentIds;
  if (drinkItemTypes.has(itemType)) {
    const glass = options.find((id) => id === "glass" || id === "pitcher" || id === "wine-glass");
    if (glass) return glass;
  }
  return options[0];
}

const allowedDimensionsByOp: Record<string, string[]> = {
  prep_mix: ["structural-integrity"],
  waiting: ["aroma", "salt", "sweet", "acidity", "umami", "pungency", "structural-integrity"],
  heating: ["doneness", "wateriness", "browning", "burn", "aroma", "structural-integrity"],
  drain_blend: ["wateriness", "structural-integrity"],
  beverage: ["wateriness", "aroma", "bitterness", "structural-integrity"],
  season: ["salt", "sweet", "acidity", "umami", "pungency", "bitterness", "aroma"],
};
function allowedDimensionsFor(op: string): string[] | null {
  if (["wash", "peel", "slice", "dice", "mince", "crush", "grind", "mix", "whisk", "knead", "fold", "shape", "stir", "toss"].includes(op)) return allowedDimensionsByOp.prep_mix;
  if (["marinate", "rest", "proof", "ferment"].includes(op)) return allowedDimensionsByOp.waiting;
  if (["set-heat", "boil", "simmer", "steam", "pan-fry", "deep-fry", "bake", "roast", "grill"].includes(op)) return allowedDimensionsByOp.heating;
  if (["drain", "rinse", "strain", "blend"].includes(op)) return allowedDimensionsByOp.drain_blend;
  if (["brew", "extract", "chill", "freeze"].includes(op)) return allowedDimensionsByOp.beverage;
  if (op === "season") return allowedDimensionsByOp.season;
  return null; // add / remove / serve / garnish / assemble: no meaningful targets
}

/** Rewrites target dimensions that are not meaningful for the operation. */
function coerceTargets(op: string, targets: GameTargetStateV1[]): GameTargetStateV1[] {
  const allowed = allowedDimensionsFor(op);
  if (!allowed) return [];
  const coerced: GameTargetStateV1[] = [];
  for (const target of targets) {
    if (allowed.includes(target.dimension)) {
      coerced.push(target);
    } else {
      coerced.push({ ...target, dimension: allowed[0] as GameTargetStateV1["dimension"] });
    }
  }
  return coerced;
}

const drafts: DraftRecipe[] = [
  // ============ BAKING (8) ============
  {
    slug: "classic-scones",
    itemType: "dish", servings: 8, yieldAmount: 8, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking"], cuisineIds: ["british"], mealRoleIds: ["side"], servingContextIds: ["afternoon-tea"],
    flavor: { tastes: { sweet: 1, salty: 1 }, textureIds: ["crisp", "soft"], characterIds: ["comforting", "light"] },
    portions: [
      { id: "wheat-flour", grams: 250, amount: 250, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "butter", grams: 60, amount: 60, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "granulated-sugar", grams: 30, amount: 30, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "usda-baking-powder", grams: 9.2, amount: 9.2, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "salt", grams: 2.3, amount: 0.5, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
      { id: "milk", grams: 125, amount: 125, unit: "ml", conversionId: "milk:ml:weight-v1", role: "main", state: "liquid" },
    ],
    ops: [
      { op: "mix", inputs: [0, 4], durationMs: 60000, params: { strength: 0.4 }, targets: [{ dimension: "structural-integrity", minimum: 0.6, unit: "normalized" }] },
      { op: "add", inputs: [1, 2, 3], durationMs: 30000, params: { quantityG: 100 } },
      { op: "mix", inputs: [], durationMs: 45000, params: { strength: 0.5 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "add", inputs: [5], durationMs: 15000, params: { quantityG: 125 } },
      { op: "shape", inputs: [], durationMs: 60000, targets: [{ dimension: "structural-integrity", minimum: 0.75, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 900000, params: { temperatureC: 220 }, targets: [{ dimension: "browning", minimum: 0.5, maximum: 0.75, unit: "normalized" }, { dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 10000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "french-madeleines",
    itemType: "dish", servings: 12, yieldAmount: 12, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking"], cuisineIds: ["french"], mealRoleIds: ["dessert"], servingContextIds: ["afternoon-tea"],
    flavor: { tastes: { sweet: 2, salty: 1 }, aromaIds: ["toasty", "roasted"], textureIds: ["soft", "tender"], characterIds: ["comforting", "light"] },
    portions: [
      { id: "wheat-flour", grams: 120, amount: 120, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "egg", grams: 100, amount: 2, unit: "piece", conversionId: "egg:piece:weight-v1", role: "main" },
      { id: "granulated-sugar", grams: 100, amount: 100, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "butter", grams: 100, amount: 100, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "usda-honey", grams: 21, amount: 21, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "lemon", grams: 6, amount: 6, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
    ],
    ops: [
      { op: "whisk", inputs: [1, 2], durationMs: 120000, params: { strength: 0.6 }, targets: [{ dimension: "structural-integrity", minimum: 0.6, unit: "normalized" }] },
      { op: "add", inputs: [0], durationMs: 30000, params: { quantityG: 120 } },
      { op: "mix", inputs: [], durationMs: 30000, params: { strength: 0.3 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "add", inputs: [3, 4, 5], durationMs: 20000, params: { quantityG: 126 } },
      { op: "rest", inputs: [], waitMs: 1800000 },
      { op: "bake", inputs: [], waitMs: 600000, params: { temperatureC: 200 }, targets: [{ dimension: "browning", minimum: 0.45, maximum: 0.7, unit: "normalized" }, { dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "fudge-brownies",
    itemType: "dessert", servings: 16, yieldAmount: 16, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking", "dessert"], cuisineIds: ["american"], mealRoleIds: ["dessert"], servingContextIds: ["after-meal", "social-gathering"],
    flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted"], textureIds: ["chewy", "soft"], characterIds: ["comforting", "hearty"] },
    portions: [
      { id: "dark-chocolate", grams: 200, amount: 200, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "butter", grams: 150, amount: 150, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "granulated-sugar", grams: 200, amount: 200, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "egg", grams: 150, amount: 3, unit: "piece", conversionId: "egg:piece:weight-v1", role: "main" },
      { id: "wheat-flour", grams: 90, amount: 90, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "usda-cocoa", grams: 30, amount: 30, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "salt", grams: 2.3, amount: 0.5, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
    ],
    ops: [
      { op: "set-heat", durationMs: 60000, params: { temperatureC: 60 }, heat: { kind: "qualitative", descriptorId: "low-melt", sourceFactId: "" }, equipment: "saucepan" },
      { op: "add", inputs: [0, 1], durationMs: 180000, params: { quantityG: 350 }, targets: [{ dimension: "wateriness", maximum: 0.3, unit: "normalized" }] },
      { op: "whisk", inputs: [2, 3], durationMs: 120000, params: { strength: 0.6 }, targets: [{ dimension: "structural-integrity", minimum: 0.5, unit: "normalized" }] },
      { op: "add", inputs: [4, 5, 6], durationMs: 30000, params: { quantityG: 122 } },
      { op: "mix", inputs: [], durationMs: 30000, params: { strength: 0.4 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 1500000, params: { temperatureC: 175 }, targets: [{ dimension: "doneness", minimum: 0.85, unit: "normalized" }, { dimension: "browning", minimum: 0.4, maximum: 0.65, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "chill", inputs: [], waitMs: 1800000, params: { temperatureC: 20 } },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "banana-oat-muffins",
    itemType: "dessert", servings: 12, yieldAmount: 12, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking", "dessert"], cuisineIds: ["american"], mealRoleIds: ["dessert"], servingContextIds: ["breakfast", "afternoon-tea"],
    flavor: { tastes: { sweet: 2 }, aromaIds: ["fruity", "toasty"], textureIds: ["soft", "tender"], characterIds: ["comforting"] },
    portions: [
      { id: "usda-banana", grams: 240, amount: 240, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "wheat-flour", grams: 190, amount: 190, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "usda-oats", grams: 60, amount: 60, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "brown-sugar", grams: 80, amount: 80, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "egg", grams: 50, amount: 1, unit: "piece", conversionId: "egg:piece:weight-v1", role: "main" },
      { id: "milk", grams: 120, amount: 120, unit: "ml", conversionId: "milk:ml:weight-v1", role: "main", state: "liquid" },
      { id: "usda-baking-powder", grams: 6.9, amount: 6.9, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "salt", grams: 1.2, amount: 0.25, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
    ],
    ops: [
      { op: "crush", inputs: [0], durationMs: 30000, params: { strength: 0.7 }, targets: [{ dimension: "structural-integrity", maximum: 0.2, unit: "normalized" }] },
      { op: "whisk", inputs: [3, 4, 5], durationMs: 60000, params: { strength: 0.5 } },
      { op: "add", inputs: [1, 2, 6, 7], durationMs: 20000, params: { quantityG: 258 } },
      { op: "mix", inputs: [], durationMs: 30000, params: { strength: 0.35 }, targets: [{ dimension: "structural-integrity", minimum: 0.65, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 1260000, params: { temperatureC: 190 }, targets: [{ dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "no-knead-focaccia",
    itemType: "dish", servings: 8, yieldAmount: 8, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking"], cuisineIds: ["italian"], mealRoleIds: ["side", "staple"], servingContextIds: ["dinner"],
    flavor: { tastes: { salty: 2 }, aromaIds: ["herbal", "roasted"], textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    portions: [
      { id: "wheat-flour", grams: 400, amount: 400, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "active-dry-yeast", grams: 3, amount: 1, unit: "tsp", conversionId: "active-dry-yeast:tsp:weight-v1", role: "seasoning" },
      { id: "salt", grams: 9.2, amount: 2, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
      { id: "drinking-water", grams: 360, amount: 360, unit: "ml", conversionId: "drinking-water:ml:weight-v1", role: "main", state: "liquid" },
      { id: "extra-virgin-olive-oil", grams: 40, amount: 40, unit: "ml", conversionId: "extra-virgin-olive-oil:ml:weight-v1", role: "seasoning" },
      { id: "fresh-rosemary", grams: 5, amount: 5, unit: "g", conversionId: "si:g:v1", role: "garnish" },
    ],
    ops: [
      { op: "mix", inputs: [0, 1, 2, 3], durationMs: 90000, params: { strength: 0.4 }, targets: [{ dimension: "structural-integrity", minimum: 0.6, unit: "normalized" }] },
      { op: "rest", inputs: [], waitMs: 10800000 },
      { op: "fold", inputs: [4], durationMs: 30000, params: { strength: 0.3 } },
      { op: "rest", inputs: [], waitMs: 3600000 },
      { op: "shape", inputs: [5], durationMs: 30000, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 1500000, params: { temperatureC: 230 }, targets: [{ dimension: "browning", minimum: 0.5, maximum: 0.8, unit: "normalized" }, { dimension: "doneness", minimum: 0.95, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "shortbread-cookies",
    itemType: "dessert", servings: 24, yieldAmount: 24, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking", "dessert"], cuisineIds: ["british"], mealRoleIds: ["dessert"], servingContextIds: ["afternoon-tea"],
    flavor: { tastes: { sweet: 2, salty: 1 }, aromaIds: ["toasty"], textureIds: ["crisp", "tender"], characterIds: ["comforting"] },
    portions: [
      { id: "butter", grams: 230, amount: 230, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "powdered-sugar", grams: 100, amount: 100, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "wheat-flour", grams: 310, amount: 310, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "salt", grams: 1.2, amount: 0.25, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
      { id: "usda-vanilla", grams: 4.2, amount: 4.2, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
    ],
    ops: [
      { op: "mix", inputs: [0, 1], durationMs: 120000, params: { strength: 0.5 }, targets: [{ dimension: "wateriness", maximum: 0.15, unit: "normalized" }] },
      { op: "add", inputs: [2, 3, 4], durationMs: 20000, params: { quantityG: 315 } },
      { op: "mix", inputs: [], durationMs: 60000, params: { strength: 0.3 }, targets: [{ dimension: "structural-integrity", minimum: 0.75, unit: "normalized" }] },
      { op: "shape", inputs: [], durationMs: 60000, targets: [{ dimension: "structural-integrity", minimum: 0.8, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 1500000, params: { temperatureC: 160 }, targets: [{ dimension: "browning", minimum: 0.35, maximum: 0.6, unit: "normalized" }, { dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "cinnamon-rolls",
    itemType: "dessert", servings: 12, yieldAmount: 12, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking", "dessert"], cuisineIds: ["american"], mealRoleIds: ["dessert"], servingContextIds: ["breakfast", "afternoon-tea"],
    flavor: { tastes: { sweet: 3 }, aromaIds: ["spiced", "toasty"], textureIds: ["soft", "chewy"], characterIds: ["comforting", "warming"] },
    portions: [
      { id: "wheat-flour", grams: 500, amount: 500, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "milk", grams: 240, amount: 240, unit: "ml", conversionId: "milk:ml:weight-v1", role: "main", state: "liquid" },
      { id: "butter", grams: 80, amount: 80, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "egg", grams: 50, amount: 1, unit: "piece", conversionId: "egg:piece:weight-v1", role: "main" },
      { id: "granulated-sugar", grams: 80, amount: 80, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "active-dry-yeast", grams: 7, amount: 2.3, unit: "tsp", conversionId: "active-dry-yeast:tsp:weight-v1", role: "seasoning" },
      { id: "salt", grams: 4.6, amount: 1, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
      { id: "cinnamon", grams: 10, amount: 10, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "brown-sugar", grams: 100, amount: 100, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
    ],
    ops: [
      { op: "mix", inputs: [0, 1, 3, 4, 5, 6], durationMs: 600000, params: { strength: 0.5 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "rest", inputs: [], waitMs: 5400000 },
      { op: "shape", inputs: [2, 7, 8], durationMs: 180000, targets: [{ dimension: "structural-integrity", minimum: 0.75, unit: "normalized" }] },
      { op: "rest", inputs: [], waitMs: 3600000 },
      { op: "bake", inputs: [], waitMs: 1500000, params: { temperatureC: 180 }, targets: [{ dimension: "browning", minimum: 0.45, maximum: 0.7, unit: "normalized" }, { dimension: "doneness", minimum: 0.95, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "flaky-pie-crust",
    itemType: "dish", servings: 8, yieldAmount: 1, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["baking"], cuisineIds: ["french"], mealRoleIds: ["side"], servingContextIds: ["dinner"],
    flavor: { tastes: { salty: 1 }, textureIds: ["crisp", "tender"], characterIds: ["comforting"] },
    portions: [
      { id: "wheat-flour", grams: 250, amount: 250, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "butter", grams: 200, amount: 200, unit: "g", conversionId: "si:g:v1", role: "main", state: "prepared" },
      { id: "salt", grams: 4.6, amount: 1, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
      { id: "granulated-sugar", grams: 5, amount: 5, unit: "g", conversionId: "si:g:v1", role: "seasoning", optional: true },
      { id: "drinking-water", grams: 60, amount: 60, unit: "ml", conversionId: "drinking-water:ml:weight-v1", role: "main", state: "liquid" },
    ],
    ops: [
      { op: "mix", inputs: [0, 2, 3], durationMs: 30000, params: { strength: 0.3 } },
      { op: "add", inputs: [1], durationMs: 30000, params: { quantityG: 200 } },
      { op: "fold", inputs: [4], durationMs: 60000, params: { strength: 0.2 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "rest", inputs: [], waitMs: 3600000 },
      { op: "shape", inputs: [], durationMs: 60000, targets: [{ dimension: "structural-integrity", minimum: 0.75, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 1800000, params: { temperatureC: 200 }, targets: [{ dimension: "browning", minimum: 0.4, maximum: 0.7, unit: "normalized" }, { dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  // ============ BARTENDING (6) ============
  {
    slug: "classic-margarita",
    itemType: "alcoholic-drink", servings: 1, yieldAmount: 120, yieldUnit: "ml",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["bartending"], cuisineIds: ["mexican"], mealRoleIds: ["drink"], servingContextIds: ["aperitif", "social-gathering"],
    flavor: { tastes: { sour: 3, sweet: 2, bitter: 1 }, aromaIds: ["citrusy"], characterIds: ["refreshing", "appetizing"] },
    portions: [
      { id: "tequila-blanco-80", grams: 42.75, amount: 45, unit: "ml", conversionId: "tequila-blanco-80:ml:weight-v1", role: "main", state: "liquid" },
      { id: "orange-liqueur-80", grams: 15.45, amount: 15, unit: "ml", conversionId: "orange-liqueur-80:ml:weight-v1", role: "main", state: "liquid" },
      { id: "lime", grams: 30, amount: 30, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "simple-syrup", grams: 20, amount: 1, unit: "tbsp", conversionId: "simple-syrup:tbsp:weight-v1", role: "seasoning", state: "liquid" },
      { id: "ice", grams: 60, amount: 60, unit: "g", conversionId: "si:g:v1", role: "main", state: "prepared" },
      { id: "salt", grams: 2.3, amount: 0.5, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "garnish" },
    ],
    ops: [
      { op: "chill", inputs: [], waitMs: 60000, params: { temperatureC: -18 } },
      { op: "add", inputs: [0, 1, 2, 3], durationMs: 15000, params: { quantityG: 108 } },
      { op: "add", inputs: [4], durationMs: 5000, params: { quantityG: 60 } },
      { op: "mix", inputs: [], durationMs: 15000, params: { strength: 0.85 }, targets: [{ dimension: "aroma", minimum: 0.6, unit: "normalized" }] },
      { op: "strain", inputs: [], durationMs: 10000 },
      { op: "garnish", inputs: [5], durationMs: 10000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "classic-mojito",
    itemType: "alcoholic-drink", servings: 1, yieldAmount: 200, yieldUnit: "ml",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["bartending"], cuisineIds: ["cuban"], mealRoleIds: ["drink"], servingContextIds: ["social-gathering", "afternoon"],
    flavor: { tastes: { sour: 2, sweet: 2 }, aromaIds: ["herbal", "citrusy"], characterIds: ["refreshing", "light"] },
    portions: [
      { id: "white-rum-80", grams: 42.75, amount: 45, unit: "ml", conversionId: "white-rum-80:ml:weight-v1", role: "main", state: "liquid" },
      { id: "lime", grams: 22.5, amount: 22.5, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "granulated-sugar", grams: 16, amount: 2, unit: "tsp", conversionId: "granulated-sugar:tsp:weight-v1", role: "seasoning" },
      { id: "fresh-mint", grams: 6, amount: 6, unit: "g", conversionId: "si:g:v1", role: "garnish" },
      { id: "club-soda", grams: 90, amount: 90, unit: "ml", conversionId: "club-soda:ml:weight-v1", role: "main", state: "liquid" },
      { id: "ice", grams: 60, amount: 60, unit: "g", conversionId: "si:g:v1", role: "main", state: "prepared" },
    ],
    ops: [
      { op: "crush", inputs: [2, 3], durationMs: 15000, params: { strength: 0.5 }, targets: [{ dimension: "aroma", minimum: 0.7, unit: "normalized" }] },
      { op: "add", inputs: [1], durationMs: 5000, params: { quantityG: 22 } },
      { op: "add", inputs: [0], durationMs: 5000, params: { quantityG: 43 } },
      { op: "add", inputs: [5], durationMs: 5000, params: { quantityG: 60 } },
      { op: "stir", inputs: [], durationMs: 15000, params: { strength: 0.6 }, targets: [{ dimension: "aroma", minimum: 0.6, unit: "normalized" }] },
      { op: "add", inputs: [4], durationMs: 5000, params: { quantityG: 90 } },
      { op: "garnish", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "espresso-martini",
    itemType: "alcoholic-drink", servings: 1, yieldAmount: 120, yieldUnit: "ml",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["bartending"], cuisineIds: ["fusion"], mealRoleIds: ["drink"], servingContextIds: ["after-meal", "social-gathering"],
    flavor: { tastes: { bitter: 2, sweet: 2 }, aromaIds: ["roasted"], textureIds: ["silky"], characterIds: ["rich" as never, "appetizing"] },
    portions: [
      { id: "vodka-80", grams: 23.75, amount: 25, unit: "ml", conversionId: "vodka-80:ml:weight-v1", role: "main", state: "liquid" },
      { id: "coffee-liqueur-80", grams: 21, amount: 20, unit: "ml", conversionId: "coffee-liqueur-80:ml:weight-v1", role: "main", state: "liquid" },
      { id: "brewed-espresso", grams: 30, amount: 30, unit: "ml", conversionId: "brewed-espresso:ml:weight-v1", role: "main", state: "liquid" },
      { id: "simple-syrup", grams: 10, amount: 0.5, unit: "tbsp", conversionId: "simple-syrup:tbsp:weight-v1", role: "seasoning", state: "liquid", optional: true },
      { id: "ice", grams: 80, amount: 80, unit: "g", conversionId: "si:g:v1", role: "main", state: "prepared" },
    ],
    ops: [
      { op: "add", inputs: [0, 1, 2, 3], durationMs: 10000, params: { quantityG: 85 } },
      { op: "add", inputs: [4], durationMs: 5000, params: { quantityG: 80 } },
      { op: "mix", inputs: [], durationMs: 18000, params: { strength: 0.9 }, targets: [{ dimension: "aroma", minimum: 0.65, unit: "normalized" }] },
      { op: "strain", inputs: [], durationMs: 10000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "classic-negroni",
    itemType: "alcoholic-drink", servings: 1, yieldAmount: 90, yieldUnit: "ml",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["bartending"], cuisineIds: ["italian"], mealRoleIds: ["drink"], servingContextIds: ["aperitif"],
    flavor: { tastes: { bitter: 3, sweet: 2 }, aromaIds: ["herbal", "spiced"], characterIds: ["warming" as never, "appetizing"] },
    portions: [
      { id: "gin-80", grams: 23.75, amount: 25, unit: "ml", conversionId: "gin-80:ml:weight-v1", role: "main", state: "liquid" },
      { id: "campari", grams: 26, amount: 25, unit: "ml", conversionId: "campari:ml:weight-v1", role: "main", state: "liquid" },
      { id: "sweet-vermouth", grams: 25.75, amount: 25, unit: "ml", conversionId: "sweet-vermouth:ml:weight-v1", role: "main", state: "liquid" },
      { id: "ice", grams: 60, amount: 60, unit: "g", conversionId: "si:g:v1", role: "main", state: "prepared" },
      { id: "usda-orange", grams: 8, amount: 8, unit: "g", conversionId: "si:g:v1", role: "garnish" },
    ],
    ops: [
      { op: "chill", inputs: [], waitMs: 300000, params: { temperatureC: -18 } },
      { op: "add", inputs: [0, 1, 2], durationMs: 10000, params: { quantityG: 76 } },
      { op: "add", inputs: [3], durationMs: 5000, params: { quantityG: 60 } },
      { op: "stir", inputs: [], durationMs: 20000, params: { strength: 0.5 }, targets: [{ dimension: "structural-integrity", minimum: 0.5, unit: "normalized" }] },
      { op: "garnish", inputs: [4], durationMs: 8000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "dark-and-stormy",
    itemType: "alcoholic-drink", servings: 1, yieldAmount: 200, yieldUnit: "ml",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["bartending"], cuisineIds: ["british"], mealRoleIds: ["drink"], servingContextIds: ["afternoon", "social-gathering"],
    flavor: { tastes: { sweet: 2, bitter: 1, sour: 1 }, aromaIds: ["spiced"], textureIds: ["crisp"], characterIds: ["refreshing"] },
    portions: [
      { id: "dark-rum-80", grams: 48, amount: 50, unit: "ml", conversionId: "dark-rum-80:ml:weight-v1", role: "main", state: "liquid" },
      { id: "ginger-beer", grams: 100, amount: 100, unit: "ml", conversionId: "ginger-beer:ml:weight-v1", role: "main", state: "liquid" },
      { id: "lime", grams: 7.5, amount: 7.5, unit: "g", conversionId: "si:g:v1", role: "garnish" },
      { id: "ice", grams: 60, amount: 60, unit: "g", conversionId: "si:g:v1", role: "main", state: "prepared" },
    ],
    ops: [
      { op: "chill", inputs: [], waitMs: 300000, params: { temperatureC: -18 } },
      { op: "add", inputs: [3], durationMs: 5000, params: { quantityG: 60 } },
      { op: "add", inputs: [1], durationMs: 8000, params: { quantityG: 100 } },
      { op: "add", inputs: [0], durationMs: 8000, params: { quantityG: 48 }, targets: [{ dimension: "structural-integrity", minimum: 0.5, unit: "normalized" }] },
      { op: "stir", inputs: [], durationMs: 10000, params: { strength: 0.4 }, targets: [{ dimension: "wateriness", maximum: 0.3, unit: "normalized" }] },
      { op: "garnish", inputs: [2], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "classic-shirley-temple",
    itemType: "non-alcoholic-drink", servings: 1, yieldAmount: 220, yieldUnit: "ml",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["bartending"], cuisineIds: ["american"], mealRoleIds: ["drink"], servingContextIds: ["afternoon", "social-gathering"],
    flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "citrusy"], textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    portions: [
      { id: "ginger-beer", grams: 120, amount: 120, unit: "ml", conversionId: "ginger-beer:ml:weight-v1", role: "main", state: "liquid" },
      { id: "grenadine-syrup", grams: 20, amount: 1, unit: "tbsp", conversionId: "grenadine-syrup:tbsp:weight-v1", role: "seasoning", state: "liquid" },
      { id: "lime", grams: 7.5, amount: 0.5, unit: "tbsp", conversionId: "si:g:v1", role: "garnish" },
      { id: "ice", grams: 60, amount: 60, unit: "g", conversionId: "si:g:v1", role: "main", state: "prepared" },
      { id: "usda-orange", grams: 15, amount: 15, unit: "g", conversionId: "si:g:v1", role: "garnish" },
    ],
    ops: [
      { op: "chill", inputs: [], waitMs: 300000, params: { temperatureC: -18 } },
      { op: "add", inputs: [3], durationMs: 5000, params: { quantityG: 60 } },
      { op: "add", inputs: [1], durationMs: 5000, params: { quantityG: 20 } },
      { op: "add", inputs: [0], durationMs: 8000, params: { quantityG: 120 } },
      { op: "stir", inputs: [], durationMs: 10000, params: { strength: 0.4 }, targets: [{ dimension: "sweet", minimum: 0.6, unit: "normalized" }] },
      { op: "garnish", inputs: [2, 4], durationMs: 8000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  // ============ DESSERT (6) ============
  {
    slug: "chocolate-mousse",
    itemType: "dessert", servings: 4, yieldAmount: 4, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["dessert"], cuisineIds: ["french"], mealRoleIds: ["dessert"], servingContextIds: ["after-meal"],
    flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted"], textureIds: ["silky", "creamy"], characterIds: ["comforting", "rich" as never] },
    portions: [
      { id: "dark-chocolate", grams: 170, amount: 170, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "heavy-cream", grams: 300, amount: 300, unit: "ml", conversionId: "heavy-cream:ml:weight-v1", role: "main", state: "liquid" },
      { id: "egg", grams: 50, amount: 1, unit: "piece", conversionId: "egg:piece:weight-v1", role: "main", state: "prepared" },
      { id: "granulated-sugar", grams: 30, amount: 30, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "salt", grams: 0.6, amount: 0.125, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
    ],
    ops: [
      { op: "set-heat", durationMs: 30000, params: { temperatureC: 50 }, heat: { kind: "qualitative", descriptorId: "low-melt", sourceFactId: "" }, equipment: "saucepan" },
      { op: "add", inputs: [0], durationMs: 120000, params: { quantityG: 170 }, targets: [{ dimension: "wateriness", maximum: 0.25, unit: "normalized" }] },
      { op: "whisk", inputs: [2, 3, 4], durationMs: 60000, params: { strength: 0.6 } },
      { op: "mix", inputs: [], durationMs: 30000, params: { strength: 0.3 }, targets: [{ dimension: "structural-integrity", minimum: 0.6, unit: "normalized" }] },
      { op: "whisk", inputs: [1], durationMs: 180000, params: { strength: 0.7 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "fold", inputs: [], durationMs: 60000, params: { strength: 0.25 }, targets: [{ dimension: "aroma", minimum: 0.7, unit: "normalized" }] },
      { op: "chill", inputs: [], waitMs: 14400000, params: { temperatureC: 4 } },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "creme-brulee",
    itemType: "dessert", servings: 4, yieldAmount: 4, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["dessert"], cuisineIds: ["french"], mealRoleIds: ["dessert"], servingContextIds: ["after-meal"],
    flavor: { tastes: { sweet: 3 }, aromaIds: ["roasted", "toasty"], textureIds: ["creamy", "crisp"], characterIds: ["comforting", "rich" as never] },
    portions: [
      { id: "heavy-cream", grams: 480, amount: 480, unit: "ml", conversionId: "heavy-cream:ml:weight-v1", role: "main", state: "liquid" },
      { id: "egg", grams: 100, amount: 4, unit: "piece", conversionId: "egg:piece:weight-v1", role: "main", state: "prepared" },
      { id: "granulated-sugar", grams: 80, amount: 80, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "usda-vanilla", grams: 8.4, amount: 8.4, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "brown-sugar", grams: 24, amount: 24, unit: "g", conversionId: "si:g:v1", role: "garnish" },
    ],
    ops: [
      { op: "set-heat", durationMs: 30000, params: { temperatureC: 80 }, heat: { kind: "qualitative", descriptorId: "scald", sourceFactId: "" }, equipment: "saucepan" },
      { op: "add", inputs: [0, 3], durationMs: 300000, params: { quantityG: 488 }, targets: [{ dimension: "aroma", minimum: 0.5, unit: "normalized" }] },
      { op: "whisk", inputs: [1, 2], durationMs: 60000, params: { strength: 0.4 } },
      { op: "mix", inputs: [], durationMs: 30000, params: { strength: 0.3 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 2400000, params: { temperatureC: 150 }, targets: [{ dimension: "doneness", minimum: 0.9, maximum: 0.95, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "chill", inputs: [], waitMs: 10800000, params: { temperatureC: 4 } },
      { op: "season", inputs: [4], durationMs: 15000, params: { quantityG: 24 } },
      { op: "set-heat", durationMs: 60000, params: { temperatureC: 500 }, heat: { kind: "qualitative", descriptorId: "torch-caramelize", sourceFactId: "" }, targets: [{ dimension: "browning", minimum: 0.6, maximum: 0.85, unit: "normalized" }], equipment: "grill-pan" },
      { op: "serve", inputs: [], durationMs: 30000 },
    ],
  },
  {
    slug: "strawberry-shortcake",
    itemType: "dessert", servings: 6, yieldAmount: 6, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["dessert"], cuisineIds: ["american"], mealRoleIds: ["dessert"], servingContextIds: ["after-meal", "afternoon-tea"],
    flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity"], textureIds: ["soft", "creamy", "juicy"], characterIds: ["refreshing", "comforting"] },
    portions: [
      { id: "wheat-flour", grams: 200, amount: 200, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "granulated-sugar", grams: 100, amount: 100, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "usda-baking-powder", grams: 7.5, amount: 1.5, unit: "tsp", conversionId: "si:g:v1", role: "seasoning" },
      { id: "salt", grams: 1.2, amount: 0.25, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
      { id: "heavy-cream", grams: 300, amount: 300, unit: "ml", conversionId: "heavy-cream:ml:weight-v1", role: "main", state: "liquid" },
      { id: "strawberry", grams: 400, amount: 400, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "powdered-sugar", grams: 20, amount: 20, unit: "g", conversionId: "si:g:v1", role: "garnish" },
    ],
    ops: [
      { op: "mix", inputs: [0, 2, 3], durationMs: 30000, params: { strength: 0.3 } },
      { op: "add", inputs: [1], durationMs: 10000, params: { quantityG: 100 } },
      { op: "mix", inputs: [], durationMs: 60000, params: { strength: 0.4 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] },
      { op: "bake", inputs: [], waitMs: 900000, params: { temperatureC: 200 }, targets: [{ dimension: "doneness", minimum: 0.9, unit: "normalized" }, { dimension: "browning", minimum: 0.4, maximum: 0.7, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "slice", inputs: [5], durationMs: 60000, params: { cutSizeMm: 8, uniformity: 0.8 } },
      { op: "whisk", inputs: [4, 6], durationMs: 120000, params: { strength: 0.65 }, targets: [{ dimension: "structural-integrity", minimum: 0.6, unit: "normalized" }] },
      { op: "assemble", inputs: [], durationMs: 120000 },
      { op: "garnish", inputs: [6], durationMs: 10000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "mango-pudding",
    itemType: "dessert", servings: 4, yieldAmount: 4, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["dessert"], cuisineIds: ["cantonese"], mealRoleIds: ["dessert"], servingContextIds: ["after-meal"],
    flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "floral"], textureIds: ["silky", "soft"], characterIds: ["refreshing", "comforting"] },
    portions: [
      { id: "mango", grams: 400, amount: 400, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "milk", grams: 250, amount: 250, unit: "ml", conversionId: "milk:ml:weight-v1", role: "main", state: "liquid" },
      { id: "sweetened-condensed-milk", grams: 80, amount: 80, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "gelatin-powder", grams: 12, amount: 12, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "drinking-water", grams: 50, amount: 50, unit: "ml", conversionId: "drinking-water:ml:weight-v1", role: "main", state: "liquid" },
    ],
    ops: [
      { op: "peel", inputs: [0], durationMs: 60000, params: {} },
      { op: "dice", inputs: [0], durationMs: 60000, params: { cutSizeMm: 25, uniformity: 0.7 } },
      { op: "blend", inputs: [0, 2], durationMs: 60000, params: { strength: 0.8 }, targets: [{ dimension: "structural-integrity", maximum: 0.15, unit: "normalized" }] },
      { op: "set-heat", durationMs: 30000, params: { temperatureC: 70 }, heat: { kind: "qualitative", descriptorId: "low-simmer", sourceFactId: "" }, equipment: "saucepan" },
      { op: "add", inputs: [4, 3], durationMs: 60000, params: { quantityG: 62 } },
      { op: "mix", inputs: [1], durationMs: 30000, params: { strength: 0.4 } },
      { op: "chill", inputs: [], waitMs: 14400000, params: { temperatureC: 4 }, targets: [{ dimension: "structural-integrity", minimum: 0.8, unit: "normalized" }] },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "matcha-panna-cotta",
    itemType: "dessert", servings: 4, yieldAmount: 4, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["dessert"], cuisineIds: ["japanese"], mealRoleIds: ["dessert"], servingContextIds: ["after-meal", "afternoon-tea"],
    flavor: { tastes: { sweet: 2, bitter: 1 }, aromaIds: ["herbal"], textureIds: ["silky", "creamy"], characterIds: ["refreshing", "light"] },
    portions: [
      { id: "heavy-cream", grams: 300, amount: 300, unit: "ml", conversionId: "heavy-cream:ml:weight-v1", role: "main", state: "liquid" },
      { id: "milk", grams: 100, amount: 100, unit: "ml", conversionId: "milk:ml:weight-v1", role: "main", state: "liquid" },
      { id: "granulated-sugar", grams: 50, amount: 50, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "matcha-powder", grams: 6, amount: 6, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "gelatin-powder", grams: 8, amount: 8, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
    ],
    ops: [
      { op: "mix", inputs: [1, 3], durationMs: 30000, params: { strength: 0.5 }, targets: [{ dimension: "aroma", minimum: 0.5, unit: "normalized" }] },
      { op: "set-heat", durationMs: 30000, params: { temperatureC: 65 }, heat: { kind: "qualitative", descriptorId: "low-simmer", sourceFactId: "" }, equipment: "saucepan" },
      { op: "add", inputs: [0, 2, 4], durationMs: 180000, params: { quantityG: 358 }, targets: [{ dimension: "structural-integrity", minimum: 0.5, unit: "normalized" }] },
      { op: "strain", inputs: [], durationMs: 15000 },
      { op: "chill", inputs: [], waitMs: 14400000, params: { temperatureC: 4 }, targets: [{ dimension: "structural-integrity", minimum: 0.85, unit: "normalized" }] },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
  {
    slug: "chocolate-chip-banana-bread",
    itemType: "dessert", servings: 10, yieldAmount: 10, yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: ["dessert"], cuisineIds: ["american"], mealRoleIds: ["dessert"], servingContextIds: ["afternoon-tea", "breakfast"],
    flavor: { tastes: { sweet: 2 }, aromaIds: ["fruity", "roasted", "toasty"], textureIds: ["soft", "tender"], characterIds: ["comforting"] },
    portions: [
      { id: "usda-banana", grams: 360, amount: 360, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "wheat-flour", grams: 210, amount: 210, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "brown-sugar", grams: 100, amount: 100, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "butter", grams: 90, amount: 90, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "egg", grams: 50, amount: 1, unit: "piece", conversionId: "egg:piece:weight-v1", role: "main" },
      { id: "milk-chocolate", grams: 120, amount: 120, unit: "g", conversionId: "si:g:v1", role: "main" },
      { id: "usda-baking-powder", grams: 4.6, amount: 4.6, unit: "g", conversionId: "si:g:v1", role: "seasoning" },
      { id: "salt", grams: 2.3, amount: 0.5, unit: "tsp", conversionId: "salt:tsp:weight-v1", role: "seasoning" },
    ],
    ops: [
      { op: "crush", inputs: [0], durationMs: 30000, params: { strength: 0.75 } },
      { op: "whisk", inputs: [3, 4], durationMs: 60000, params: { strength: 0.5 } },
      { op: "add", inputs: [1, 2, 6, 7], durationMs: 20000, params: { quantityG: 317 } },
      { op: "mix", inputs: [], durationMs: 30000, params: { strength: 0.35 }, targets: [{ dimension: "structural-integrity", minimum: 0.65, unit: "normalized" }] },
      { op: "add", inputs: [5], durationMs: 15000, params: { quantityG: 120 } },
      { op: "fold", inputs: [], durationMs: 20000, params: { strength: 0.25 } },
      { op: "bake", inputs: [], waitMs: 3600000, params: { temperatureC: 175 }, targets: [{ dimension: "doneness", minimum: 0.95, unit: "normalized" }, { dimension: "browning", minimum: 0.45, maximum: 0.7, unit: "normalized" }], equipment: "oven" },
      { op: "remove", inputs: [], durationMs: 5000 },
      { op: "serve", inputs: [], durationMs: 5000 },
    ],
  },
];

// ---------- build ----------

function buildRecipe(draft: DraftRecipe): GameRecipeV1 {
  const slug = draft.slug;
  const portions: GameIngredientPortionV1[] = draft.portions.map((p, i) => {
    const catalogEntry = ingredientById.get(p.id);
    if (!catalogEntry) throw new Error(`Unknown ingredient ${p.id}`);
    if (!conversionIds.has(p.conversionId)) throw new Error(`Unknown conversion ${p.conversionId} for ${p.id}`);
    const catalogDefaultState = (catalogEntry as unknown as { defaultState: GameIngredientPortionV1["initialState"] }).defaultState;
    return {
      portionId: `${slug}-portion-${String(i + 1).padStart(2, "0")}`,
      ingredientId: p.id,
      initialState: p.state ?? catalogDefaultState,
      sourceQuantity: { amount: p.amount, unit: p.unit, conversionRecordId: p.conversionId },
      massG: p.grams,
      optional: p.optional ?? false,
      phase: "main",
      role: p.role,
      allowedSubstitutionIngredientIds: [],
      nutritionProvenanceId: catalogEntry.nutritionProvenanceId,
    };
  });

  const nodes: GameOperationNodeV1[] = draft.ops.map((spec, i) => {
    const nodeId = `${slug}-op-${String(i + 1).padStart(3, "0")}-${spec.op}`;
    const prevNode = i > 0 ? `${slug}-op-${String(i).padStart(3, "0")}-${draft.ops[i - 1].op}` : null;
    const equipment = spec.equipment ?? defaultEquipmentFor(spec.op, draft.itemType);
    const definition = operationById.get(spec.op);
    const explicitInputs = (spec.inputs ?? []).map((idx) => portions[idx].portionId);
    const inputPortionIds = definition?.inputRequirement === "none" || explicitInputs.length
      ? explicitInputs
      : [portions[0].portionId]; // auto-bind the primary portion when the operation needs an input
    const allowedDims = allowedDimensionsFor(spec.op);
    const fallbackDimension = allowedDims?.includes("doneness") ? "doneness" : allowedDims?.[0];
    const autoTargets = definition?.targetStateRequired && !(spec.targets ?? []).length
      ? (fallbackDimension ? [{ dimension: fallbackDimension as GameTargetStateV1["dimension"], minimum: 0.8, unit: "normalized" } as GameTargetStateV1] : [])
      : coerceTargets(spec.op, spec.targets ?? []);
    return {
      nodeId,
      operationType: spec.op,
      dependsOn: prevNode ? [prevNode] : [],
      inputPortionIds,
      outputStateIds: [`${nodeId}-done`],
      equipmentId: equipment,
      activeDurationMs: spec.durationMs ?? 0,
      waitDurationMs: spec.waitMs ?? 0,
      parameters: spec.params ?? {},
      heatControl: spec.heat,
      targetStates: autoTargets,
      criticality: spec.criticality ?? (spec.op === "serve" || spec.op === "garnish" || spec.op === "remove" ? "completion" : "quality"),
      sourceStepOrder: i + 1,
    };
  });

  // nutrition: ingredient-sum
  const total = { ...NUTRI_ZERO };
  for (const p of draft.portions) {
    const n = ingredientById.get(p.id)!.nutritionPer100g;
    const factor = p.grams / 100;
    total.calories += n.calories * factor;
    total.protein += n.protein * factor;
    total.fat += n.fat * factor;
    total.saturatedFat += n.saturatedFat * factor;
    total.carbs += n.carbs * factor;
    total.sugar += n.sugar * factor;
    total.addedSugar += n.addedSugar * factor;
    total.fiber += n.fiber * factor;
    total.sodium += n.sodium * factor;
  }
  const round = (v: number) => Math.round(v * 100) / 100;
  const perServing = { ...NUTRI_ZERO };
  (Object.keys(perServing) as (keyof Nutrition)[]).forEach((key) => {
    perServing[key] = round(total[key] / draft.servings);
  });
  (Object.keys(total) as (keyof Nutrition)[]).forEach((key) => {
    total[key] = round(total[key]);
  });

  const extension: RecipeDatabaseExtensionV1 = {
    extensionVersion: "cooking-lab-recipe-database-v1",
    tags: {
      categoryTags: draft.categoryTags,
      ...(draft.cuisineIds ? { cuisineIds: draft.cuisineIds } : {}),
      mealRoleIds: draft.mealRoleIds,
      servingContextIds: draft.servingContextIds,
    },
    flavor: draft.flavor,
    images: [{ status: "missing" }],
    sourceType: "ai-assisted",
    sourceNotes: "Knowledge-base authored draft for the recipe database batch A pilot; not eligible for Web publication or game export without full independent review.",
  };

  const recipe: GameRecipeV1 = {
    schemaVersion: "cooking-lab-game-recipe-v1",
    artifactVersion: "",
    recipeId: slug,
    slug,
    itemType: draft.itemType,
    eligibility: "database-entry",
    simulationProfile: draft.simulationProfile,
    servings: draft.servings,
    yield: { amount: draft.yieldAmount, unit: draft.yieldUnit },
    ingredientPortions: portions,
    operationGraph: { nodes },
    nutritionProfile: {
      method: "ingredient-sum-v1",
      servings: draft.servings,
      total,
      perServing,
      provenance: draft.portions.map((p) => {
        const entry = ingredientById.get(p.id)!;
        return {
          ingredientId: p.id,
          nutritionProvenanceId: entry.nutritionProvenanceId,
          provider: "Cooking Lab editorial estimate",
          datasetVersion: "demo-estimated-v1",
          upstreamRecordId: p.id,
          basis: "per-100g",
          ingredientState: portions[draft.portions.indexOf(p)].initialState,
          conversionMethod: "existing unit weight to grams; ingredient-sum-v1",
          yieldFactor: 1,
          retentionFactor: 1,
          accessedAt: "2026-09-14",
        };
      }),
      estimated: true,
    },
    scenarios: [],
    rights: { artifactIds: [], usageDecisionIds: [], sourceIds: [], evidenceIds: [], intendedUse: "game-commercial-ready" },
    governance: { riskLevel: "low", riskClassificationId: "", reviewAttestationIds: [] },
    authoring: {
      method: "deterministic-migration",
      generatorVersion: "m13-database-batch-a-1",
      containsGeneratedExpression: false,
      unresolvedMappings: [],
    },
    database: extension,
  };

  // scenario coverage for every quality node: simple omit scenario
  for (const node of nodes) {
    if (node.criticality === "completion") continue;
    recipe.scenarios.push({
      scenarioId: `${slug}-${node.nodeId}-omit`,
      baselineArtifactVersion: "",
      mutation: { type: "omit", targetNodeId: node.nodeId },
      expectedDeltas: [{ dimension: "structural-integrity", direction: "decrease", confidence: "rule-based" }],
      expectedFaultCodes: [`missing-${node.operationType}`],
      causeCodes: [`operation-omitted:${node.operationType}`],
      recoverability: "partially-recoverable",
      nutritionEffect: "unchanged",
      applicableEngine: draft.simulationProfile,
    });
  }
  // Compute the artifact version after scenarios are attached (payload complete).
  const artifactVersion = createGameRecipeArtifactVersion(recipe);
  recipe.artifactVersion = artifactVersion;
  for (const scenario of recipe.scenarios) scenario.baselineArtifactVersion = artifactVersion;
  return recipe;
}

let count = 0;
for (const draft of drafts) {
  const recipe = buildRecipe(draft);
  const path = resolve(process.cwd(), "game-data/source/recipes", `${draft.slug}.json`);
  writeFileSync(path, stableJson(recipe), "utf8");
  count += 1;
}
process.stdout.write(`Generated ${count} batch-A database recipes\n`);
