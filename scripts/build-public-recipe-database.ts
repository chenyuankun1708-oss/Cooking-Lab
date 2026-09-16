import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadCanonicalGameData } from "@/lib/game-data-canonical";

/**
 * Parse the public culinary image registry (data/culinary/images.ts) into a
 * id -> { src, alt, sourceUrl, author, license } map. Database entries whose
 * images[].imageId matches a published public asset get that image attached.
 */
function parsePublicImageRegistry(): Map<string, { src: string; alt: string; sourceUrl: string; author: string; license: string }> {
  const registry = readFileSync(resolve(process.cwd(), "data/culinary/images.ts"), "utf8");
  const map = new Map<string, { src: string; alt: string; sourceUrl: string; author: string; license: string }>();
  const block = /\{\s*id: "([a-z0-9-]+)",\s*\n\s*src: "([^"]+)",\s*\n\s*alt: "([^"]+)",[\s\S]*?source: "([^"]+)",\s*\n\s*sourceUrl: "([^"]+)",\s*\n\s*author: "([^"]+)",\s*\n\s*license: "([^"]+)"/g;
  for (const match of registry.matchAll(block)) {
    map.set(match[1], { src: match[2], alt: match[3], sourceUrl: match[5], author: match[6], license: match[7] });
  }
  return map;
}

/**
 * Projects the M13 recipe database into a PUBLIC browsing dataset
 * (`data/public-recipe-database.ts`): the top 300 entries ranked by a
 * complexity score (steps × 2 + portion count + heat-target count).
 *
 * Public projection depth: ingredients, step chain and per-serving
 * nutrition only — no engine-only fields (target states, fault scenarios)
 * and no internal governance notes.
 */
const data = loadCanonicalGameData();

interface PublicRecipeEntry {
  slug: string;
  itemType: string;
  categories: string[];
  cuisine: string;
  contexts: string[];
  servings: number;
  kcalPerServing: number;
  portions: number;
  steps: number;
  complexity: number;
  sourceType: string;
  flavors: string[];
  image: { src: string; alt: string; sourceUrl: string; author: string; license: string } | null;
  portionRows: Array<{ ingredient: string; grams: number; unit: string; role: string; optional: boolean }>;
  stepRows: Array<{ order: number; op: string; durationS: number; equipment: string }>;
  nutrition: { calories: number; protein: number; fat: number; saturatedFat: number; carbs: number; sugar: number; fiber: number; sodium: number };
}

const LIMIT = 300;

const publicImages = parsePublicImageRegistry();

const scored = data.recipes.map((recipe) => {
  const db = recipe.database;
  const flavor = db?.flavor;
  const flavors: string[] = [];
  if (flavor) {
    for (const [taste, intensity] of Object.entries(flavor.tastes)) {
      if (intensity > 0) flavors.push(`${taste}${intensity}`);
    }
    for (const aroma of flavor.aromaIds ?? []) flavors.push(aroma);
    for (const texture of flavor.textureIds ?? []) flavors.push(texture);
    for (const character of flavor.characterIds ?? []) flavors.push(character);
  }
  const stepCount = recipe.operationGraph.nodes.length;
  const portionCount = recipe.ingredientPortions.length;
  const targetCount = recipe.operationGraph.nodes.reduce((sum, node) => sum + (node.targetStates?.length ?? 0), 0);
  const complexity = stepCount * 2 + portionCount + targetCount;
  const per = recipe.nutritionProfile.perServing;
  return {
    slug: recipe.slug,
    itemType: recipe.itemType,
    categories: [...(db?.tags.categoryTags ?? [])],
    cuisine: db?.tags.cuisineIds?.[0] ?? "",
    contexts: [...(db?.tags.servingContextIds ?? [])],
    servings: recipe.servings,
    kcalPerServing: Math.round(per.calories),
    portions: portionCount,
    steps: stepCount,
    complexity,
    sourceType: db?.sourceType ?? "",
    flavors: flavors.slice(0, 5),
    image: (() => {
      const published = (db?.images ?? []).find((img) => img.status === "published" && img.imageId !== undefined && publicImages.has(img.imageId));
      const asset = published?.imageId ? publicImages.get(published.imageId) : undefined;
      return asset ? { ...asset } : null;
    })(),
    portionRows: recipe.ingredientPortions.map((portion) => ({
      ingredient: portion.ingredientId,
      grams: portion.massG,
      unit: `${portion.sourceQuantity.amount} ${portion.sourceQuantity.unit}`,
      role: portion.role ?? "main",
      optional: portion.optional,
    })),
    stepRows: recipe.operationGraph.nodes.map((node, index) => ({
      order: node.sourceStepOrder ?? index + 1,
      op: node.operationType,
      durationS: Math.round((node.activeDurationMs + node.waitDurationMs) / 1000),
      equipment: node.equipmentId ?? "",
    })),
    nutrition: {
      calories: Math.round(per.calories), protein: Math.round(per.protein), fat: Math.round(per.fat),
      saturatedFat: Math.round(per.saturatedFat), carbs: Math.round(per.carbs), sugar: Math.round(per.sugar),
      fiber: Math.round(per.fiber), sodium: Math.round(per.sodium),
    },
  } satisfies PublicRecipeEntry;
});

// Rank by complexity (descending), then slug for deterministic order.
scored.sort((a, b) => b.complexity - a.complexity || (a.slug < b.slug ? -1 : 1));
const entries = scored.slice(0, LIMIT);

const summary = {
  total: entries.length,
  withImages: entries.filter((entry) => entry.image !== null).length,
  databaseTotal: data.recipes.length,
  baking: entries.filter((entry) => entry.categories.includes("baking")).length,
  bartending: entries.filter((entry) => entry.categories.includes("bartending")).length,
  dessert: entries.filter((entry) => entry.categories.includes("dessert")).length,
  ingredients: data.ingredients.ingredients.length,
  sources: Object.entries(
    entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.sourceType] = (acc[entry.sourceType] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([sourceType, count]) => ({ sourceType, count })),
  cuisines: [...new Set(entries.map((entry) => entry.cuisine).filter(Boolean))].sort(),
};

const content = `// AUTO-GENERATED by scripts/build-public-recipe-database.ts — do not edit by hand.
// Public projection of the M13 recipe database: top ${LIMIT} entries by complexity
// (steps × 2 + portions + heat targets). Public depth only — ingredients,
// step chain and per-serving nutrition. No engine-only fields.

export interface PublicRecipeEntry {
  slug: string;
  itemType: string;
  categories: string[];
  cuisine: string;
  contexts: string[];
  servings: number;
  kcalPerServing: number;
  portions: number;
  steps: number;
  complexity: number;
  sourceType: string;
  flavors: string[];
  image: { src: string; alt: string; sourceUrl: string; author: string; license: string } | null;
  portionRows: Array<{ ingredient: string; grams: number; unit: string; role: string; optional: boolean }>;
  stepRows: Array<{ order: number; op: string; durationS: number; equipment: string }>;
  nutrition: { calories: number; protein: number; fat: number; saturatedFat: number; carbs: number; sugar: number; fiber: number; sodium: number };
}

export interface PublicRecipeDatabaseSummary {
  total: number;
  databaseTotal: number;
  baking: number;
  bartending: number;
  dessert: number;
  ingredients: number;
  withImages: number;
  sources: Array<{ sourceType: string; count: number }>;
  cuisines: string[];
}

export const publicRecipeDatabaseSummary: PublicRecipeDatabaseSummary = ${JSON.stringify(summary, null, 2)};

export const publicRecipeEntries: PublicRecipeEntry[] = ${JSON.stringify(entries, null, 2)};
`;

const path = resolve(process.cwd(), "data/public-recipe-database.ts");
writeFileSync(path, content, "utf8");
process.stdout.write(
  `Projected ${entries.length} public recipe entries (of ${data.recipes.length} total, top by complexity)\n` +
    `Complexity range: ${entries[0]?.complexity} (top) … ${entries[entries.length - 1]?.complexity} (cut line)\n`,
);
