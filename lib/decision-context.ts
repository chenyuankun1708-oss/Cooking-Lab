import type { CulinaryItem } from "@/types/culinary";
import {
  decisionContextFieldDefinitions,
  decisionContextFieldOrder,
  type DecisionContext,
} from "@/types/decision-context";
import type { FlavorPreferenceId } from "@/types/flavor";
import type { Ingredient } from "@/types/ingredient";
import type { Recipe } from "@/types/recipe";
import type { RecommendationCriteria } from "@/types/recommendation";
import type { MealCompositionOptions } from "./meal-composition";

export interface DecisionContextValueAllowlist {
  availableIngredients: readonly string[];
  availableTools: readonly string[];
  preferredCuisine: readonly string[];
  preferredTags: readonly string[];
  preferredMethods: readonly string[];
  flavorPreferences: readonly FlavorPreferenceId[];
}

export interface DecisionContextVocabularySource {
  ingredients: readonly Pick<Ingredient, "id">[];
  recipes: readonly Recipe[];
  culinaryItems: readonly CulinaryItem[];
  supportedTagIds: readonly string[];
  flavorPreferenceIds: readonly FlavorPreferenceId[];
}

export type MealDecisionContextOptions = Pick<
  MealCompositionOptions,
  "maxTotalTimeMinutes" | "availableToolIds"
>;

type DecisionContextNumberField =
  | "maxTime"
  | "maxCalories"
  | "minProtein"
  | "maxOil"
  | "maxSalt"
  | "maxAddedSugar"
  | "maxCost";

const numberPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i;

export function createDecisionContextValueAllowlist({
  ingredients,
  recipes,
  culinaryItems,
  supportedTagIds,
  flavorPreferenceIds,
}: DecisionContextVocabularySource): DecisionContextValueAllowlist {
  const culinaryTools = culinaryItems.flatMap(({ preparation }) =>
    "toolIds" in preparation ? preparation.toolIds : [],
  );

  return Object.freeze({
    availableIngredients: Object.freeze(stableIds(ingredients.map(({ id }) => id))),
    availableTools: Object.freeze(stableIds([
      ...recipes.flatMap(({ tools }) => tools),
      ...culinaryTools,
    ])),
    preferredCuisine: Object.freeze(stableIds([
      ...recipes.map(({ taxonomy }) => taxonomy.cuisine.cuisineId),
      ...culinaryItems.flatMap(({ taxonomy }) => taxonomy.cuisine?.cuisineId ?? []),
    ])),
    preferredTags: Object.freeze(stableIds([
      ...recipes.flatMap(({ taxonomy }) => [
        ...(taxonomy.dietaryTagIds ?? []),
        ...(taxonomy.browseTagIds ?? []),
      ]),
      ...culinaryItems.flatMap(({ taxonomy }) => [
        ...taxonomy.dietaryTagIds,
        ...taxonomy.browseTagIds,
      ]),
      ...supportedTagIds,
    ])),
    preferredMethods: Object.freeze(stableIds([
      ...recipes.flatMap(({ taxonomy }) => taxonomy.techniques),
      ...culinaryItems.flatMap(({ taxonomy }) => taxonomy.techniqueIds),
    ])),
    flavorPreferences: Object.freeze(stableIds(flavorPreferenceIds)) as readonly FlavorPreferenceId[],
  });
}

export function parseDecisionContext(
  params: URLSearchParams,
  allowlist: DecisionContextValueAllowlist,
): DecisionContext {
  return normalizeValues({
    availableIngredients: params.getAll(queryKey("availableIngredients")),
    availableTools: params.getAll(queryKey("availableTools")),
    maxTime: params.getAll(queryKey("maxTime")),
    maxCalories: params.getAll(queryKey("maxCalories")),
    minProtein: params.getAll(queryKey("minProtein")),
    maxOil: params.getAll(queryKey("maxOil")),
    maxSalt: params.getAll(queryKey("maxSalt")),
    maxAddedSugar: params.getAll(queryKey("maxAddedSugar")),
    maxCost: params.getAll(queryKey("maxCost")),
    preferredCuisine: params.getAll(queryKey("preferredCuisine")),
    preferredTags: params.getAll(queryKey("preferredTags")),
    preferredMethods: params.getAll(queryKey("preferredMethods")),
    flavorPreferences: params.getAll(queryKey("flavorPreferences")),
  }, allowlist);
}

export function normalizeDecisionContext(
  context: DecisionContext,
  allowlist: DecisionContextValueAllowlist,
): DecisionContext {
  return normalizeValues({
    availableIngredients: context.availableIngredients ?? [],
    availableTools: context.availableTools ?? [],
    maxTime: rawNumber(context.maxTime),
    maxCalories: rawNumber(context.maxCalories),
    minProtein: rawNumber(context.minProtein),
    maxOil: rawNumber(context.maxOil),
    maxSalt: rawNumber(context.maxSalt),
    maxAddedSugar: rawNumber(context.maxAddedSugar),
    maxCost: rawNumber(context.maxCost),
    preferredCuisine: context.preferredCuisine ? [context.preferredCuisine] : [],
    preferredTags: context.preferredTags ?? [],
    preferredMethods: context.preferredMethods ?? [],
    flavorPreferences: context.flavorPreferences ?? [],
  }, allowlist);
}

export function serializeDecisionContext(
  context: DecisionContext,
  allowlist: DecisionContextValueAllowlist,
): URLSearchParams {
  const normalized = normalizeDecisionContext(context, allowlist);
  const params = new URLSearchParams();

  for (const field of decisionContextFieldOrder) {
    const value = normalized[field];
    if (Array.isArray(value)) {
      for (const entry of value) params.append(queryKey(field), entry);
    } else if (value !== undefined) {
      params.set(queryKey(field), String(value));
    }
  }

  return params;
}

/**
 * Maps only the two approved M7 whole-meal fields. maxTotalTimeMinutes is a
 * limit on Meal Composition's displayed estimated elapsed time, not a real
 * kitchen completion guarantee.
 */
export function toMealCompositionOptions(
  context: DecisionContext,
  allowlist: DecisionContextValueAllowlist,
): MealDecisionContextOptions {
  const normalized = normalizeDecisionContext(context, allowlist);
  return {
    ...(normalized.maxTime !== undefined
      ? { maxTotalTimeMinutes: normalized.maxTime }
      : {}),
    ...(normalized.availableTools?.length
      ? { availableToolIds: normalized.availableTools }
      : {}),
  };
}

interface RawDecisionContextValues {
  availableIngredients: readonly string[];
  availableTools: readonly string[];
  maxTime: readonly string[];
  maxCalories: readonly string[];
  minProtein: readonly string[];
  maxOil: readonly string[];
  maxSalt: readonly string[];
  maxAddedSugar: readonly string[];
  maxCost: readonly string[];
  preferredCuisine: readonly string[];
  preferredTags: readonly string[];
  preferredMethods: readonly string[];
  flavorPreferences: readonly string[];
}

function normalizeValues(
  raw: RawDecisionContextValues,
  allowlist: DecisionContextValueAllowlist,
): RecommendationCriteria {
  const context: RecommendationCriteria = {};
  assignList(context, "availableIngredients", normalizeIds(raw.availableIngredients, allowlist.availableIngredients));
  assignList(context, "availableTools", normalizeIds(raw.availableTools, allowlist.availableTools));
  assignNumber(context, "maxTime", selectNumber(raw.maxTime, "minimum"));
  assignNumber(context, "maxCalories", selectNumber(raw.maxCalories, "minimum"));
  assignNumber(context, "minProtein", selectNumber(raw.minProtein, "maximum"));
  assignNumber(context, "maxOil", selectNumber(raw.maxOil, "minimum"));
  assignNumber(context, "maxSalt", selectNumber(raw.maxSalt, "minimum"));
  assignNumber(context, "maxAddedSugar", selectNumber(raw.maxAddedSugar, "minimum"));
  assignNumber(context, "maxCost", selectNumber(raw.maxCost, "minimum"));

  const cuisines = normalizeIds(raw.preferredCuisine, allowlist.preferredCuisine);
  if (cuisines[0]) context.preferredCuisine = cuisines[0];

  assignList(context, "preferredTags", normalizeIds(raw.preferredTags, allowlist.preferredTags));
  assignList(context, "preferredMethods", normalizeIds(raw.preferredMethods, allowlist.preferredMethods));
  const flavors = normalizeIds(raw.flavorPreferences, allowlist.flavorPreferences) as FlavorPreferenceId[];
  if (flavors.length) context.flavorPreferences = flavors;
  return context;
}

function assignList(
  context: RecommendationCriteria,
  field: "availableIngredients" | "availableTools" | "preferredTags" | "preferredMethods",
  values: string[],
): void {
  if (values.length) context[field] = values;
}

function assignNumber(
  context: RecommendationCriteria,
  field: DecisionContextNumberField,
  value: number | undefined,
): void {
  if (value !== undefined) context[field] = value;
}

function selectNumber(values: readonly string[], mode: "minimum" | "maximum"): number | undefined {
  const valid = [...new Set(values.map(parseNonNegativeNumber).filter((value): value is number => value !== undefined))];
  if (!valid.length) return undefined;
  return mode === "minimum" ? Math.min(...valid) : Math.max(...valid);
}

function parseNonNegativeNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!numberPattern.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeIds(values: readonly string[], allowed: readonly string[]): string[] {
  const allowedIds = new Set(allowed);
  return stableIds(values.filter((value) => allowedIds.has(value)));
}

function stableIds(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
}

function rawNumber(value: number | undefined): string[] {
  return value === undefined ? [] : [String(value)];
}

function queryKey(field: keyof RecommendationCriteria): string {
  return decisionContextFieldDefinitions[field].queryKey;
}
