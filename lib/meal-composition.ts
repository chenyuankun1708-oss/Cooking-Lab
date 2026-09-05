import type { CulinaryItem, MealRoleId, PairingWeight } from "@/types/culinary";
import { emptyNutrition, type Nutrition } from "@/types/nutrition";
import type {
  MealComposition,
  MealCompositionItem,
  MealCompositionResult,
  MealCostEstimate,
  MealNutritionEstimate,
  MealPreparationBurden,
  MealSlotId,
  MealTemplateId,
  PairingCaution,
  PairingReason,
} from "@/types/pairing";
import { calculateCost } from "./cost";
import { defaultPairingThreshold, getRoleCompatibility, scorePairing } from "./culinary-pairing";
import type { IngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";

interface MealSlotDefinition {
  id: MealSlotId;
  roleIds: readonly MealRoleId[];
}

export interface MealTemplateDefinition {
  id: MealTemplateId;
  slots: readonly MealSlotDefinition[];
}

export const mealTemplates: readonly MealTemplateDefinition[] = Object.freeze([
  { id: "main-drink", slots: [slot("main", "main", "staple", "soup"), slot("drink", "drink")] },
  { id: "starter-main-drink", slots: [slot("starter", "starter", "side", "soup"), slot("main", "main", "staple"), slot("drink", "drink")] },
  { id: "main-drink-dessert", slots: [slot("main", "main", "staple", "soup"), slot("drink", "drink"), slot("dessert", "dessert")] },
  { id: "drink-dessert", slots: [slot("drink", "drink"), slot("dessert", "dessert")] },
]);

export interface MealCompositionOptions {
  excludeAlcohol?: boolean;
  servingContextId?: string;
  maxTotalTimeMinutes?: number;
  availableToolIds?: readonly string[];
  minimumPairingScore?: number;
  minimumMealScore?: number;
  limit?: number;
}

export interface MealCompositionContext {
  ingredientRepository: IngredientRepository;
}

export interface PairingReadinessItem {
  id: string;
  itemType: CulinaryItem["itemType"];
  mealRoleIds: MealRoleId[];
  servingContextIds: string[];
  cuisineIds: string[];
  weight?: string;
  temperature?: string;
  textureIds: string[];
  nutritionAvailable: boolean;
  costAvailable: boolean;
  totalMinutes: number;
  activeMinutes: number;
  possiblePairingRoleIds: MealRoleId[];
}

export interface PairingReadinessAudit {
  itemCount: number;
  roleCounts: Record<MealRoleId, number>;
  typeCounts: Record<CulinaryItem["itemType"], number>;
  drinkShare: number;
  availableTemplateIds: MealTemplateId[];
  items: PairingReadinessItem[];
}

export function composeMealsAround(
  anchor: CulinaryItem,
  library: readonly CulinaryItem[],
  context: MealCompositionContext,
  options: MealCompositionOptions = {},
): MealCompositionResult {
  if (anchor.publication.status !== "published") return { anchor, alternatives: [] };
  const excludeAlcohol = options.excludeAlcohol ?? true;
  const minimumPairingScore = options.minimumPairingScore ?? 0.44;
  const minimumMealScore = options.minimumMealScore ?? 0.5;
  const limit = Math.max(1, options.limit ?? 3);
  const candidates = uniquePublishedCandidates(anchor, library, excludeAlcohol);
  const meals: MealComposition[] = [];

  for (const template of mealTemplates) {
    for (const anchorSlot of template.slots) {
      const anchorRole = selectRole(anchor, anchorSlot.roleIds);
      if (!anchorRole) continue;
      const slotCandidates = template.slots.map((templateSlot) => {
        if (templateSlot.id === anchorSlot.id) return [[{ item: anchor, slotId: templateSlot.id, roleId: anchorRole }]];
        const ranked = candidates.flatMap((candidate) => {
          const candidateRole = selectRole(candidate, templateSlot.roleIds);
          if (!candidateRole) return [];
          const pairing = scorePairing(anchor, candidate, {
            servingContextId: options.servingContextId,
            anchorRoleId: anchorRole,
            candidateRoleId: candidateRole,
          });
          return pairing.eligible && pairing.score >= minimumPairingScore
            ? [{ item: candidate, slotId: templateSlot.id, roleId: candidateRole, pairingScore: pairing.score }]
            : [];
        })
          .sort((left, right) => right.pairingScore - left.pairingScore || compareText(left.item.id, right.item.id))
          .slice(0, 8)
          .map(({ item, slotId, roleId }) => [{ item, slotId, roleId }]);
        return ranked;
      });
      if (slotCandidates.some((choices) => choices.length === 0)) continue;
      for (const selected of cartesian(slotCandidates).map((parts) => parts.flat())) {
        if (new Set(selected.map(({ item }) => item.id)).size !== selected.length) continue;
        const meal = scoreMealComposition(template, selected, anchor.id, context, options);
        if (meal.score >= minimumMealScore && meetsConstraints(meal, options)) meals.push(meal);
      }
    }
  }

  const ranked = deduplicateMeals(meals)
    .sort((left, right) => right.score - left.score || compareText(mealIdentity(left), mealIdentity(right)));
  if (ranked.length) {
    const selected = ranked.slice(0, limit);
    if (!excludeAlcohol && !selected.some(hasAlcohol) && limit > 1) {
      const alcoholicAlternative = ranked.find(hasAlcohol);
      if (alcoholicAlternative) selected[selected.length - 1] = alcoholicAlternative;
    }
    return { anchor, primary: selected[0], alternatives: selected.slice(1) };
  }

  const partial = buildPartialMeal(anchor, candidates, context, options, minimumPairingScore);
  return partial && meetsConstraints(partial, options) ? { anchor, primary: partial, alternatives: [] } : { anchor, alternatives: [] };
}

export function scoreMealComposition(
  template: MealTemplateDefinition,
  items: readonly MealCompositionItem[],
  anchorId: string,
  context: MealCompositionContext,
  options: MealCompositionOptions = {},
): MealComposition {
  const pairings = allPairs(items).map(([left, right]) => scorePairing(left.item, right.item, {
    servingContextId: options.servingContextId,
    anchorRoleId: left.roleId,
    candidateRoleId: right.roleId,
  }));
  const preparation = calculatePreparationBurden(items.map(({ item }) => item));
  const repetitionPenalty = calculateRepetitionPenalty(items.map(({ item }) => item));
  const pairCompatibility = average(pairings.map(({ score }) => score));
  const roleCompleteness = items.length / template.slots.length * (template.slots.length >= 3 ? 1 : 0.86);
  const flavorBalance = clamp(1 - repetitionPenalty * 1.8 + (pairings.some(({ breakdown }) => breakdown.flavorComplement > 0) ? 0.08 : 0));
  const textureVariety = calculateTextureVariety(items.map(({ item }) => item));
  const weightProgression = calculateWeightProgression(items);
  const preparationPracticality = preparation.level === "simple" ? 1 : preparation.level === "moderate" ? 0.72 : 0.38;
  const breakdown = {
    pairCompatibility,
    roleCompleteness,
    flavorBalance,
    textureVariety,
    weightProgression,
    preparationPracticality,
    repetitionPenalty,
  };
  const score = roundScore(clamp(
    pairCompatibility * 0.55 +
    roleCompleteness * 0.15 +
    flavorBalance * 0.1 +
    textureVariety * 0.07 +
    weightProgression * 0.08 +
    preparationPracticality * 0.05 -
    repetitionPenalty * 0.15,
  ));
  const missingSlotIds = template.slots.filter((templateSlot) => !items.some(({ slotId }) => slotId === templateSlot.id)).map(({ id }) => id);

  return {
    templateId: template.id,
    completeness: missingSlotIds.length ? "partial" : "complete",
    anchorId,
    items: [...items],
    missingSlotIds,
    score,
    breakdown,
    pairings,
    reasons: uniqueReasons(pairings.flatMap(({ reasons }) => reasons)),
    cautions: uniqueCautions(pairings.flatMap(({ cautions }) => cautions)),
    preparation,
    nutrition: calculateMealNutrition(items.map(({ item }) => item), context.ingredientRepository),
    cost: calculateMealCost(items.map(({ item }) => item), context.ingredientRepository),
  };
}

export function auditPairingReadiness(items: readonly CulinaryItem[]): PairingReadinessAudit {
  const published = items.filter((item) => item.publication.status === "published");
  const roleCounts = Object.fromEntries(["starter", "main", "side", "staple", "soup", "dessert", "drink"].map((role) => [role, 0])) as Record<MealRoleId, number>;
  const typeCounts = Object.fromEntries(["dish", "dessert", "tea", "coffee", "non-alcoholic-drink", "alcoholic-drink"].map((type) => [type, 0])) as PairingReadinessAudit["typeCounts"];
  for (const item of published) {
    typeCounts[item.itemType] += 1;
    item.pairing.mealRoleIds.forEach((role) => { roleCounts[role] += 1; });
  }
  return {
    itemCount: published.length,
    roleCounts,
    typeCounts,
    drinkShare: published.length ? roundScore(roleCounts.drink / published.length) : 0,
    availableTemplateIds: mealTemplates.filter((template) => template.slots.every((templateSlot) =>
      published.some((item) => Boolean(selectRole(item, templateSlot.roleIds))))).map(({ id }) => id),
    items: published.map((item) => {
      const time = getPreparationTime(item);
      return {
        id: item.id,
        itemType: item.itemType,
        mealRoleIds: [...item.pairing.mealRoleIds],
        servingContextIds: [...item.pairing.servingContextIds],
        cuisineIds: [...item.pairing.cuisineIds],
        weight: getFacet(item, "weight"),
        temperature: getFacet(item, "temperature"),
        textureIds: [...new Set([
          ...item.pairing.facets.filter((facet) => facet.dimension === "texture").map((facet) => facet.value),
          ...(item.flavor.textureIds ?? []),
        ])],
        nutritionAvailable: item.nutrition.applicability === "applicable",
        costAvailable: item.cost.source !== "not-modeled",
        totalMinutes: time.total,
        activeMinutes: time.active,
        possiblePairingRoleIds: possiblePairingRoles(item.pairing.mealRoleIds),
      };
    }),
  };
}

export function calculatePreparationBurden(items: readonly CulinaryItem[]): MealPreparationBurden {
  const times = items.map(getPreparationTime);
  const activeMinutes = times.reduce((sum, time) => sum + time.active, 0);
  const sequentialElapsedMinutes = times.reduce((sum, time) => sum + time.total, 0);
  const estimatedElapsedMinutes = Math.max(activeMinutes, ...times.map((time) => time.total));
  const toolCounts = new Map<string, number>();
  for (const item of items) getToolIds(item).forEach((id) => toolCounts.set(id, (toolCounts.get(id) ?? 0) + 1));
  const overlappingToolIds = [...toolCounts].filter(([, count]) => count > 1).map(([id]) => id).sort(compareText);
  const proceduralItemCount = items.filter((item) => "time" in item.preparation).length;
  const servingOnlyItemCount = items.length - proceduralItemCount;
  const level = activeMinutes <= 30 && proceduralItemCount <= 2
    ? "simple"
    : activeMinutes <= 65 && proceduralItemCount <= 3
      ? "moderate"
      : "involved";
  return {
    level,
    activeMinutes,
    estimatedElapsedMinutes,
    sequentialElapsedMinutes,
    parallelizableMinutes: Math.max(0, sequentialElapsedMinutes - estimatedElapsedMinutes),
    proceduralItemCount,
    servingOnlyItemCount,
    overlappingToolIds,
  };
}

export function calculateMealNutrition(items: readonly CulinaryItem[], repository: IngredientRepository): MealNutritionEstimate {
  const total = emptyNutrition();
  let includedItemCount = 0;
  let notApplicableItemCount = 0;
  for (const item of items) {
    const value = getItemNutrition(item, repository);
    if (value.kind === "not-applicable") {
      notApplicableItemCount += 1;
      continue;
    }
    if (value.kind !== "available") continue;
    includedItemCount += 1;
    addNutrition(total, value.value);
  }
  return {
    coverage: includedItemCount === 0 ? "unavailable" : includedItemCount === items.length ? "complete" : "partial",
    includedItemCount,
    totalItemCount: items.length,
    notApplicableItemCount,
    ...(includedItemCount ? { value: total } : {}),
  };
}

export function calculateMealCost(items: readonly CulinaryItem[], repository: IngredientRepository): MealCostEstimate {
  let value = 0;
  let includedItemCount = 0;
  for (const item of items) {
    const itemCost = getItemCost(item, repository);
    if (itemCost === undefined) continue;
    value += itemCost;
    includedItemCount += 1;
  }
  return {
    coverage: includedItemCount === 0 ? "unavailable" : includedItemCount === items.length ? "complete" : "partial",
    includedItemCount,
    totalItemCount: items.length,
    currency: "CNY",
    ...(includedItemCount ? { value: roundMoney(value) } : {}),
  };
}

export function findNonAlcoholicDrinkAlternative(
  meal: MealComposition,
  library: readonly CulinaryItem[],
): CulinaryItem | undefined {
  if (!hasAlcohol(meal)) return undefined;
  const foodItems = meal.items.filter(({ item }) => item.pairing.mealRoleIds.some((role) => role !== "drink"));
  if (!foodItems.length) return undefined;
  return library
    .filter((item) => item.publication.status === "published" && item.itemType !== "alcoholic-drink" && item.pairing.mealRoleIds.includes("drink"))
    .map((candidate) => ({
      candidate,
      score: average(foodItems.map(({ item, roleId }) => scorePairing(item, candidate, { anchorRoleId: roleId, candidateRoleId: "drink" }).score)),
    }))
    .filter(({ score }) => score >= defaultPairingThreshold)
    .sort((left, right) => right.score - left.score || compareText(left.candidate.id, right.candidate.id))[0]?.candidate;
}

function buildPartialMeal(
  anchor: CulinaryItem,
  candidates: readonly CulinaryItem[],
  context: MealCompositionContext,
  options: MealCompositionOptions,
  minimumPairingScore: number,
): MealComposition | undefined {
  const pairing = candidates
    .map((candidate) => scorePairing(anchor, candidate, { servingContextId: options.servingContextId }))
    .filter((result) => result.eligible && result.score >= minimumPairingScore)
    .sort((left, right) => right.score - left.score || compareText(left.candidate.id, right.candidate.id))[0];
  if (!pairing?.roles) return undefined;
  const items = [
    { item: anchor, slotId: roleToSlot(pairing.roles[0]), roleId: pairing.roles[0] },
    { item: pairing.candidate, slotId: roleToSlot(pairing.roles[1]), roleId: pairing.roles[1] },
  ];
  const template: MealTemplateDefinition = {
    id: "main-drink",
    slots: [slot("main", "main", "staple", "soup"), slot("drink", "drink"), slot("dessert", "dessert")],
  };
  const scored = scoreMealComposition(template, items, anchor.id, context, options);
  return { ...scored, templateId: "partial-pair", completeness: "partial" };
}

function getItemNutrition(item: CulinaryItem, repository: IngredientRepository): { kind: "available"; value: Nutrition } | { kind: "unknown" } | { kind: "not-applicable" } {
  if (item.nutrition.applicability === "not-modeled") {
    return item.nutrition.reason === "out-of-scope" ? { kind: "not-applicable" } : { kind: "unknown" };
  }
  if (item.nutrition.source === "declared-estimate") {
    return item.nutrition.basis === "per-serving" ? { kind: "available", value: item.nutrition.value } : { kind: "unknown" };
  }
  if (!("inputs" in item.preparation) || item.preparation.yield.unit !== "serving") return { kind: "unknown" };
  const calculation = calculateNutrition(item.preparation.inputs, repository);
  if (!calculation.complete) return { kind: "unknown" };
  return { kind: "available", value: scaleNutrition(calculation.total, 1 / item.preparation.yield.amount) };
}

function getItemCost(item: CulinaryItem, repository: IngredientRepository): number | undefined {
  if (item.cost.source === "not-modeled" || !("inputs" in item.preparation) || item.preparation.yield.unit !== "serving") return undefined;
  const calculation = calculateCost(item.preparation.inputs, repository);
  return calculation.complete ? calculation.estimated / item.preparation.yield.amount : undefined;
}

function uniquePublishedCandidates(anchor: CulinaryItem, library: readonly CulinaryItem[], excludeAlcohol: boolean): CulinaryItem[] {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  return library.filter((item) => {
    if (item.publication.status !== "published" || item.id === anchor.id || item.slug === anchor.slug) return false;
    if (excludeAlcohol && item.itemType === "alcoholic-drink") return false;
    if (seenIds.has(item.id) || seenSlugs.has(item.slug)) return false;
    seenIds.add(item.id);
    seenSlugs.add(item.slug);
    return true;
  });
}

function meetsConstraints(meal: MealComposition, options: MealCompositionOptions): boolean {
  if (options.maxTotalTimeMinutes !== undefined && meal.preparation.estimatedElapsedMinutes > options.maxTotalTimeMinutes) return false;
  if (options.availableToolIds?.length) {
    const available = new Set(options.availableToolIds);
    if (meal.items.some(({ item }) => getToolIds(item).some((id) => !available.has(id)))) return false;
  }
  return true;
}

function calculateRepetitionPenalty(items: readonly CulinaryItem[]): number {
  const richCount = items.filter((item) => getFacet(item, "weight") === "rich").length;
  const textureCounts = countValues(items.flatMap(primaryTextures));
  const strongTasteCounts = countValues(items.flatMap((item) =>
    Object.entries(item.flavor.tastes).filter(([, intensity]) => (intensity ?? 0) >= 2).map(([id]) => id)));
  const textureRepeats = [...textureCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const tasteRepeats = [...strongTasteCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 2), 0);
  return roundScore(Math.min(0.45, Math.max(0, richCount - 1) * 0.12 + textureRepeats * 0.08 + tasteRepeats * 0.04));
}

function calculateTextureVariety(items: readonly CulinaryItem[]): number {
  const known = items.flatMap(primaryTextures);
  if (!known.length) return 0.5;
  return roundScore(Math.min(1, new Set(known).size / items.length + 0.25));
}

function calculateWeightProgression(items: readonly MealCompositionItem[]): number {
  const scores = items.map(({ item, slotId }) => {
    const weight = getFacet<PairingWeight>(item, "weight");
    if (!weight) return 0.5;
    if (slotId === "starter") return weight === "light" ? 1 : weight === "medium" ? 0.65 : 0.25;
    if (slotId === "main") return weight === "light" ? 0.68 : 1;
    if (slotId === "drink") return weight === "rich" ? 0.58 : 1;
    return weight === "light" ? 0.65 : 1;
  });
  return average(scores);
}

function possiblePairingRoles(roles: readonly MealRoleId[]): MealRoleId[] {
  const allRoles: MealRoleId[] = ["starter", "main", "side", "staple", "soup", "dessert", "drink"];
  return allRoles.filter((candidateRole) => roles.some((role) => getRoleCompatibility(role, candidateRole) > 0));
}

function selectRole(item: CulinaryItem, allowed: readonly MealRoleId[]): MealRoleId | undefined {
  return allowed.find((role) => item.pairing.mealRoleIds.includes(role));
}

function roleToSlot(role: MealRoleId): MealSlotId {
  if (role === "drink") return "drink";
  if (role === "dessert") return "dessert";
  if (role === "starter" || role === "side") return "starter";
  return "main";
}

function getPreparationTime(item: CulinaryItem): { active: number; total: number } {
  if ("time" in item.preparation) return { active: item.preparation.time.activeMinutes, total: item.preparation.time.totalMinutes };
  if (item.preparation.kind === "serving-guidance") return { active: item.preparation.estimatedMinutes, total: item.preparation.estimatedMinutes };
  return { active: 0, total: 0 };
}

function getToolIds(item: CulinaryItem): readonly string[] {
  return "toolIds" in item.preparation ? item.preparation.toolIds : [];
}

function getFacet<T extends string = string>(item: CulinaryItem, dimension: "weight" | "temperature"): T | undefined {
  return item.pairing.facets.find((facet) => facet.dimension === dimension)?.value as T | undefined;
}

function primaryTextures(item: CulinaryItem): string[] {
  const facet = item.pairing.facets.find((candidate) => candidate.dimension === "texture")?.value;
  return facet ? [facet] : item.flavor.textureIds?.slice(0, 1) ?? [];
}

function addNutrition(target: Nutrition, value: Nutrition): void {
  (Object.keys(target) as Array<keyof Nutrition>).forEach((key) => { target[key] += value[key]; });
}

function scaleNutrition(value: Nutrition, factor: number): Nutrition {
  return Object.fromEntries((Object.keys(value) as Array<keyof Nutrition>).map((key) => [key, value[key] * factor])) as unknown as Nutrition;
}

function uniqueReasons(reasons: readonly PairingReason[]): PairingReason[] {
  return uniqueBy(reasons, reasonIdentity).slice(0, 6);
}

function uniqueCautions(cautions: readonly PairingCaution[]): PairingCaution[] {
  return uniqueBy(cautions, (caution) => JSON.stringify(caution)).slice(0, 4);
}

function reasonIdentity(reason: PairingReason): string {
  return JSON.stringify(reason);
}

function deduplicateMeals(meals: readonly MealComposition[]): MealComposition[] {
  return uniqueBy(meals, mealIdentity);
}

function mealIdentity(meal: MealComposition): string {
  return meal.items.map(({ item, slotId }) => `${slotId}:${item.id}`).sort(compareText).join("|");
}

function hasAlcohol(meal: MealComposition): boolean {
  return meal.items.some(({ item }) => item.itemType === "alcoholic-drink");
}

function allPairs<T>(items: readonly T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) pairs.push([items[left], items[right]]);
  }
  return pairs;
}

function cartesian<T>(sets: readonly T[][][]): T[][][] {
  return sets.reduce<T[][][]>((combinations, choices) =>
    combinations.flatMap((combination) => choices.map((choice) => [...combination, choice])), [[]]);
}

function slot(id: MealSlotId, ...roleIds: MealRoleId[]): MealSlotDefinition {
  return { id, roleIds };
}

function countValues(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return counts;
}

function uniqueBy<T>(items: readonly T[], identity: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = identity(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function average(values: readonly number[]): number {
  return values.length ? roundScore(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
