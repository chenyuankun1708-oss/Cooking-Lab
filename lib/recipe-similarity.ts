import { tasteIds } from "@/types/flavor";
import type { Ingredient } from "@/types/ingredient";
import type { Recipe } from "@/types/recipe";

export const recipeSimilarityWeights = Object.freeze({
  flavor: 0.42,
  ingredient: 0.33,
  cuisine: 0.1,
  technique: 0.1,
  dishType: 0.05,
});

export const defaultRecipeSimilarityThreshold = 0.28;

export type IngredientSimilarityFamily = "chicken" | "pork" | "fish" | "legume" | "rice" | "noodle";
export type RecipeSimilarityDimension = keyof typeof recipeSimilarityWeights;
export type RecipeSimilaritySignalKind =
  | "taste"
  | "aroma"
  | "texture"
  | "character"
  | "ingredient"
  | "ingredient-family"
  | "cuisine"
  | "technique"
  | "dish-type";

export interface RecipeSimilarityBreakdown {
  flavor: number;
  ingredient: number;
  cuisine: number;
  technique: number;
  dishType: number;
}

export interface RecipeSimilaritySignal {
  kind: RecipeSimilaritySignalKind;
  ids: string[];
  strength: number;
}

export interface RecipeSimilarityResult {
  recipe: Recipe;
  score: number;
  breakdown: RecipeSimilarityBreakdown;
  signals: RecipeSimilaritySignal[];
}

export interface RecipeSimilarityOptions {
  ingredients: readonly Ingredient[];
  limit?: number;
  minimumScore?: number;
}

const flavorWeights = Object.freeze({ tastes: 0.5, aromas: 0.2, textures: 0.15, characters: 0.15 });
const ingredientFamilyById: Readonly<Record<string, IngredientSimilarityFamily>> = Object.freeze({
  "chicken-breast": "chicken",
  "chicken-thigh": "chicken",
  "pork-tenderloin": "pork",
  "pork-shoulder": "pork",
  salmon: "fish",
  "white-fish": "fish",
  "canned-tuna": "fish",
  "dry-lentil": "legume",
  "cooked-chickpea": "legume",
  "cooked-black-bean": "legume",
  rice: "rice",
  "cooked-rice": "rice",
  noodles: "noodle",
  pasta: "noodle",
  "rice-noodles": "noodle",
  "glass-noodles": "noodle",
});
const supportingIngredientIds = new Set([
  "garlic",
  "ginger",
  "scallion",
  "onion",
  "fresh-chili",
  "fresh-basil",
  "cilantro",
  "lemongrass",
  "lemon",
  "lime",
]);

export function calculateFlavorSimilarity(left: Recipe["flavor"], right: Recipe["flavor"]): number {
  const tastes = weightedTasteOverlap(left.tastes, right.tastes);
  const aromas = setOverlap(left.aromaIds, right.aromaIds);
  const textures = setOverlap(left.textureIds, right.textureIds);
  const characters = setOverlap(left.characterIds, right.characterIds);
  return roundScore(
    tastes * flavorWeights.tastes +
    aromas * flavorWeights.aromas +
    textures * flavorWeights.textures +
    characters * flavorWeights.characters,
  );
}

export function calculateRecipeSimilarity(
  target: Recipe,
  candidate: Recipe,
  ingredients: readonly Ingredient[],
): RecipeSimilarityResult {
  const signals: RecipeSimilaritySignal[] = [];
  const flavor = calculateFlavorSimilarity(target.flavor, candidate.flavor);
  collectFlavorSignals(target, candidate, signals);

  const ingredientResult = calculateIngredientSimilarity(target, candidate, ingredients);
  if (ingredientResult.exactIds.length) {
    signals.push({ kind: "ingredient", ids: ingredientResult.exactIds, strength: ingredientResult.score });
  }
  if (ingredientResult.familyIds.length) {
    signals.push({ kind: "ingredient-family", ids: ingredientResult.familyIds, strength: ingredientResult.score });
  }

  const cuisineResult = calculateCuisineSimilarity(target, candidate);
  if (cuisineResult.ids.length) {
    signals.push({ kind: "cuisine", ids: cuisineResult.ids, strength: cuisineResult.score });
  }

  const sharedTechniques = intersection(target.taxonomy.techniques, candidate.taxonomy.techniques);
  const technique = overlapCoefficient(target.taxonomy.techniques, candidate.taxonomy.techniques);
  if (sharedTechniques.length) {
    signals.push({ kind: "technique", ids: sharedTechniques, strength: technique });
  }

  const sameDishType = target.taxonomy.mealType.dishTypeId === candidate.taxonomy.mealType.dishTypeId;
  const dishType = sameDishType ? 1 : 0;
  if (sameDishType) {
    signals.push({ kind: "dish-type", ids: [target.taxonomy.mealType.dishTypeId], strength: 1 });
  }

  const breakdown = {
    flavor,
    ingredient: ingredientResult.score,
    cuisine: cuisineResult.score,
    technique,
    dishType,
  };
  const score = roundScore(
    breakdown.flavor * recipeSimilarityWeights.flavor +
    breakdown.ingredient * recipeSimilarityWeights.ingredient +
    breakdown.cuisine * recipeSimilarityWeights.cuisine +
    breakdown.technique * recipeSimilarityWeights.technique +
    breakdown.dishType * recipeSimilarityWeights.dishType,
  );

  return { recipe: candidate, score, breakdown, signals };
}

export function rankSimilarRecipes(
  target: Recipe,
  candidates: readonly Recipe[],
  options: RecipeSimilarityOptions,
): RecipeSimilarityResult[] {
  const limit = options.limit ?? 4;
  const minimumScore = options.minimumScore ?? defaultRecipeSimilarityThreshold;
  const uniqueCandidates = new Map<string, Recipe>();

  for (const candidate of candidates) {
    if (candidate.id === target.id || candidate.slug === target.slug) continue;
    if (!uniqueCandidates.has(candidate.slug)) uniqueCandidates.set(candidate.slug, candidate);
  }

  return [...uniqueCandidates.values()]
    .map((candidate) => calculateRecipeSimilarity(target, candidate, options.ingredients))
    .filter((result) => result.score >= minimumScore)
    .sort((left, right) => right.score - left.score || compareText(left.recipe.slug, right.recipe.slug))
    .slice(0, Math.max(0, limit));
}

function collectFlavorSignals(target: Recipe, candidate: Recipe, signals: RecipeSimilaritySignal[]) {
  const sharedTastes = tasteIds
    .filter((id) => (target.flavor.tastes[id] ?? 0) > 0 && (candidate.flavor.tastes[id] ?? 0) > 0)
    .sort((left, right) =>
      Math.min(candidate.flavor.tastes[right] ?? 0, target.flavor.tastes[right] ?? 0) -
      Math.min(candidate.flavor.tastes[left] ?? 0, target.flavor.tastes[left] ?? 0));
  if (sharedTastes.length) {
    signals.push({ kind: "taste", ids: sharedTastes, strength: weightedTasteOverlap(target.flavor.tastes, candidate.flavor.tastes) });
  }

  for (const [kind, left, right] of [
    ["aroma", target.flavor.aromaIds, candidate.flavor.aromaIds],
    ["texture", target.flavor.textureIds, candidate.flavor.textureIds],
    ["character", target.flavor.characterIds, candidate.flavor.characterIds],
  ] as const) {
    const ids = intersection(left ?? [], right ?? []);
    if (ids.length) signals.push({ kind, ids, strength: setOverlap(left, right) });
  }
}

function calculateIngredientSimilarity(target: Recipe, candidate: Recipe, ingredients: readonly Ingredient[]) {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const left = buildIngredientSignals(target, ingredientById);
  const right = buildIngredientSignals(candidate, ingredientById);
  const rightById = new Map(right.map((signal) => [signal.id, signal]));
  const matchedRightIds = new Set<string>();
  const exactIds: string[] = [];
  const familyIds: IngredientSimilarityFamily[] = [];
  let matchedWeight = 0;

  for (const signal of left) {
    const match = rightById.get(signal.id);
    if (!match) continue;
    exactIds.push(signal.id);
    matchedRightIds.add(match.id);
    matchedWeight += Math.min(signal.weight, match.weight);
  }

  for (const signal of left) {
    if (!signal.family || exactIds.includes(signal.id)) continue;
    const match = right.find((item) =>
      !matchedRightIds.has(item.id) && item.family === signal.family && item.id !== signal.id);
    if (!match) continue;
    matchedRightIds.add(match.id);
    if (!familyIds.includes(signal.family)) familyIds.push(signal.family);
    matchedWeight += Math.min(signal.weight, match.weight) * 0.65;
  }

  const totalWeight = left.reduce((sum, signal) => sum + signal.weight, 0) +
    right.reduce((sum, signal) => sum + signal.weight, 0);
  const score = totalWeight ? roundScore((2 * matchedWeight) / totalWeight) : 0;
  return { score, exactIds, familyIds };
}

function buildIngredientSignals(recipe: Recipe, ingredientById: ReadonlyMap<string, Ingredient>) {
  return recipe.ingredients.flatMap(({ ingredientId }) => {
    const ingredient = ingredientById.get(ingredientId);
    if (!ingredient || ingredient.category === "seasoning" || ingredient.category === "oil") return [];
    if (supportingIngredientIds.has(ingredientId)) return [];
    const weight = ingredient.category === "protein" || ingredient.category === "grain"
      ? 1
      : ingredient.category === "dairy" ? 0.85 : 0.75;
    return [{ id: ingredientId, family: ingredientFamilyById[ingredientId], weight }];
  });
}

function calculateCuisineSimilarity(target: Recipe, candidate: Recipe): { score: number; ids: string[] } {
  const targetCuisine = target.taxonomy.cuisine;
  const candidateCuisine = candidate.taxonomy.cuisine;
  if (targetCuisine.subCuisineId && targetCuisine.subCuisineId === candidateCuisine.subCuisineId) {
    return { score: 1, ids: [targetCuisine.subCuisineId] };
  }
  if (targetCuisine.cuisineId === candidateCuisine.cuisineId) {
    return { score: 0.8, ids: [targetCuisine.cuisineId] };
  }
  if (target.taxonomy.origin?.regionId && target.taxonomy.origin.regionId === candidate.taxonomy.origin?.regionId) {
    return { score: 0.65, ids: [target.taxonomy.origin.regionId] };
  }
  if (target.taxonomy.origin?.countryId && target.taxonomy.origin.countryId === candidate.taxonomy.origin?.countryId) {
    return { score: 0.45, ids: [target.taxonomy.origin.countryId] };
  }
  return { score: 0, ids: [] };
}

function weightedTasteOverlap(left: Recipe["flavor"]["tastes"], right: Recipe["flavor"]["tastes"]): number {
  let shared = 0;
  let total = 0;
  for (const id of tasteIds) {
    const leftIntensity = left[id] ?? 0;
    const rightIntensity = right[id] ?? 0;
    shared += Math.min(leftIntensity, rightIntensity);
    total += Math.max(leftIntensity, rightIntensity);
  }
  return total ? roundScore(shared / total) : 0;
}

function setOverlap(left: readonly string[] | undefined, right: readonly string[] | undefined): number {
  const leftIds = new Set(left ?? []);
  const rightIds = new Set(right ?? []);
  if (!leftIds.size || !rightIds.size) return 0;
  return roundScore((2 * [...leftIds].filter((id) => rightIds.has(id)).length) / (leftIds.size + rightIds.size));
}

function overlapCoefficient(left: readonly string[], right: readonly string[]): number {
  if (!left.length || !right.length) return 0;
  return roundScore(intersection(left, right).length / Math.min(new Set(left).size, new Set(right).size));
}

function intersection(left: readonly string[], right: readonly string[]): string[] {
  const rightIds = new Set(right);
  return [...new Set(left)].filter((id) => rightIds.has(id));
}

function roundScore(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
