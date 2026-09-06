import type { CulinaryItem, PreparationStep } from "@/types/culinary";
import type { Unit } from "@/types/ingredient";
import {
  mealPlanMaxItems,
  mealPlanSchemaVersion,
  type MealPlanSelection,
  type MealPlanShoppingLine,
  type MealPlanTask,
  type MealPlanTaskKind,
  type MealPlanV1,
} from "@/types/meal-plan";

export interface MealPlanStepMetadata {
  kind: MealPlanTaskKind;
  durationMinutes?: number;
  resourceIds?: readonly string[];
  dependsOnStepOrders?: readonly number[];
}

export type MealPlanStepMetadataRegistry = Readonly<Record<string, Readonly<Record<number, MealPlanStepMetadata>>>>;

export interface BuildMealPlanOptions {
  stepMetadata?: MealPlanStepMetadataRegistry;
  planId?: string;
}

export type MealPlanBuildItem = Pick<CulinaryItem, "id" | "slug" | "preparation">;

export class MealPlanError extends Error {
  constructor(
    public readonly code: "EMPTY_SELECTION" | "TOO_MANY_ITEMS" | "UNKNOWN_ITEM" | "INVALID_SERVINGS" | "DUPLICATE_ITEM" | "INVALID_DEPENDENCY",
    message: string,
  ) {
    super(message);
    this.name = "MealPlanError";
  }
}

export function buildMealPlan(
  library: readonly MealPlanBuildItem[],
  selections: readonly MealPlanSelection[],
  options: BuildMealPlanOptions = {},
): MealPlanV1 {
  if (!selections.length) throw new MealPlanError("EMPTY_SELECTION", "A meal plan needs at least one culinary item.");
  if (selections.length > mealPlanMaxItems) throw new MealPlanError("TOO_MANY_ITEMS", `A meal plan supports up to ${mealPlanMaxItems} items.`);
  const itemsById = new Map(library.map((item) => [item.id, item]));
  const selectedIds = new Set<string>();
  const shopping: MealPlanShoppingLine[] = [];
  const timeline: MealPlanTask[] = [];

  for (const selection of selections) {
    if (!Number.isFinite(selection.servings) || selection.servings <= 0 || selection.servings > 50) {
      throw new MealPlanError("INVALID_SERVINGS", `Invalid servings for ${selection.itemId}.`);
    }
    if (selectedIds.has(selection.itemId)) throw new MealPlanError("DUPLICATE_ITEM", `Duplicate item ${selection.itemId}.`);
    selectedIds.add(selection.itemId);
    const item = itemsById.get(selection.itemId);
    if (!item) throw new MealPlanError("UNKNOWN_ITEM", `Unknown culinary item ${selection.itemId}.`);
    const preparation = item.preparation;
    if ("inputs" in preparation) {
      const multiplier = selection.servings / preparation.yield.amount;
      for (const input of preparation.inputs) {
        shopping.push({
          id: `${item.id}:${input.ingredientId}:${input.unit}`,
          kind: "ingredient",
          ingredientId: input.ingredientId,
          amount: input.amount * multiplier,
          unit: input.unit,
          optional: input.optional,
          sourceItemIds: [item.id],
        });
      }
      timeline.push(...buildProceduralTasks(item.id, preparation.steps, preparation.toolIds, preparation.time.activeMinutes, options.stepMetadata?.[item.id]));
    } else {
      shopping.push({
        id: `${item.id}:finished-item`,
        kind: "finished-item",
        itemId: item.id,
        amount: selection.servings,
        unit: "item",
        optional: false,
        sourceItemIds: [item.id],
      });
      const duration = preparation.kind === "serving-guidance" ? preparation.estimatedMinutes : 0;
      timeline.push({
        id: `${item.id}:serve`,
        itemId: item.id,
        kind: "serve",
        durationMinutes: duration,
        startOffsetMinutes: 0,
        dependencyIds: [],
        resourceIds: "toolIds" in preparation ? [...preparation.toolIds] : [],
      });
    }
  }

  const mergedShopping = mergeShoppingLines(shopping);
  const preparationTaskIds = timeline.filter((task) => task.kind !== "serve").map((task) => task.id);
  const synchronizedTimeline = timeline.map((task) => task.kind === "serve" && preparationTaskIds.length
    ? { ...task, dependencyIds: [...new Set([...task.dependencyIds, ...preparationTaskIds])] }
    : task);
  const scheduled = scheduleMealPlanTasks(synchronizedTimeline);
  return {
    schemaVersion: mealPlanSchemaVersion,
    id: options.planId ?? stablePlanId(selections),
    selections: selections.map((selection) => ({ ...selection })),
    shopping: mergedShopping,
    timeline: scheduled,
    totalMinutes: Math.max(0, ...scheduled.map((task) => task.startOffsetMinutes + task.durationMinutes)),
  };
}

export function mergeShoppingLines(lines: readonly MealPlanShoppingLine[]): MealPlanShoppingLine[] {
  const merged = new Map<string, MealPlanShoppingLine>();
  for (const line of lines) {
    const normalized = normalizeShoppingLine(line);
    const key = normalized.kind === "finished-item"
      ? `finished:${normalized.itemId}`
      : `ingredient:${normalized.ingredientId}:${unitDimension(normalized.unit)}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, normalized);
      continue;
    }
    existing.amount += normalized.amount;
    existing.optional = existing.optional && normalized.optional;
    existing.sourceItemIds = [...new Set([...existing.sourceItemIds, ...normalized.sourceItemIds])];
  }
  return [...merged.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function mergeMealPlanSelections(
  current: readonly MealPlanSelection[],
  incoming: readonly MealPlanSelection[],
): MealPlanSelection[] {
  const merged = current.map((selection) => ({ ...selection }));
  const existingIds = new Set(merged.map((selection) => selection.itemId));
  for (const selection of incoming) {
    if (existingIds.has(selection.itemId)) continue;
    merged.push({ ...selection });
    existingIds.add(selection.itemId);
  }
  if (merged.length > mealPlanMaxItems) throw new MealPlanError("TOO_MANY_ITEMS", `A meal plan supports up to ${mealPlanMaxItems} items.`);
  return merged;
}

export function resolveIncomingMealPlanSelections(
  current: readonly MealPlanSelection[],
  incoming: readonly MealPlanSelection[],
  mode: "merge" | "replace",
): { selections: MealPlanSelection[]; limitExceeded: boolean } {
  if (!incoming.length) return { selections: current.map((selection) => ({ ...selection })), limitExceeded: false };
  if (mode === "replace") return { selections: incoming.map((selection) => ({ ...selection })), limitExceeded: false };
  try {
    return { selections: mergeMealPlanSelections(current, incoming), limitExceeded: false };
  } catch (error) {
    if (error instanceof MealPlanError && error.code === "TOO_MANY_ITEMS") {
      return { selections: current.map((selection) => ({ ...selection })), limitExceeded: true };
    }
    throw error;
  }
}

export function scheduleMealPlanTasks(tasks: readonly MealPlanTask[]): MealPlanTask[] {
  const scheduled: MealPlanTask[] = [];
  const pending = new Map(tasks.map((task) => [task.id, { ...task, dependencyIds: [...task.dependencyIds], resourceIds: [...task.resourceIds] }]));
  if (pending.size !== tasks.length) {
    throw new MealPlanError("INVALID_DEPENDENCY", "Meal plan task IDs must be unique.");
  }
  while (pending.size) {
    const ready = [...pending.values()]
      .filter((task) => task.dependencyIds.every((dependencyId) => scheduled.some((entry) => entry.id === dependencyId)))
      .sort((left, right) => left.id.localeCompare(right.id));
    if (!ready.length) throw new MealPlanError("INVALID_DEPENDENCY", "Meal plan tasks contain a missing or cyclic dependency.");
    for (const task of ready) {
      const dependencies = task.dependencyIds.map((dependencyId) => scheduled.find((entry) => entry.id === dependencyId)!);
      const dependencyEnd = Math.max(0, ...dependencies.map((dependency) => dependency.startOffsetMinutes + dependency.durationMinutes));
      task.startOffsetMinutes = findEarliestResourceSlot(task, scheduled, dependencyEnd);
      scheduled.push(task);
      pending.delete(task.id);
    }
  }
  return scheduled.sort((a, b) => a.startOffsetMinutes - b.startOffsetMinutes || a.id.localeCompare(b.id));
}

function findEarliestResourceSlot(
  task: MealPlanTask,
  scheduled: readonly MealPlanTask[],
  earliestStart: number,
): number {
  if (!task.durationMinutes || !task.resourceIds.length) return earliestStart;
  const occupied = scheduled
    .filter((entry) => entry.durationMinutes > 0 && entry.resourceIds.some((resourceId) => task.resourceIds.includes(resourceId)))
    .map((entry) => ({ start: entry.startOffsetMinutes, end: entry.startOffsetMinutes + entry.durationMinutes }))
    .sort((left, right) => left.start - right.start || left.end - right.end);
  let candidate = earliestStart;
  for (const interval of occupied) {
    if (interval.end <= candidate) continue;
    if (interval.start >= candidate + task.durationMinutes) break;
    candidate = interval.end;
  }
  return candidate;
}

function buildProceduralTasks(
  itemId: string,
  steps: readonly PreparationStep[],
  defaultResources: readonly string[],
  fallbackActiveMinutes: number,
  metadata: Readonly<Record<number, MealPlanStepMetadata>> | undefined,
): MealPlanTask[] {
  const getAuthoredDuration = (step: PreparationStep) => metadata?.[step.order]?.durationMinutes ?? step.durationMinutes;
  const authoredDuration = steps.reduce((total, step) => total + (getAuthoredDuration(step) ?? 0), 0);
  const missingDurationCount = steps.filter((step) => getAuthoredDuration(step) === undefined).length;
  const unallocatedDuration = Math.max(0, fallbackActiveMinutes - authoredDuration);
  const baseDuration = missingDurationCount ? Math.floor(unallocatedDuration / missingDurationCount) : 0;
  let durationRemainder = missingDurationCount ? unallocatedDuration - baseDuration * missingDurationCount : 0;
  return steps.map((step, index) => {
    const explicit = metadata?.[step.order];
    const previousStep = steps[index - 1];
    const dependencyOrders = explicit?.dependsOnStepOrders ?? (previousStep ? [previousStep.order] : []);
    return {
      id: `${itemId}:step:${step.order}`,
      itemId,
      stepOrder: step.order,
      kind: explicit?.kind ?? "active",
      durationMinutes: getAuthoredDuration(step) ?? baseDuration + (durationRemainder-- > 0 ? 1 : 0),
      startOffsetMinutes: 0,
      dependencyIds: dependencyOrders.map((order) => `${itemId}:step:${order}`),
      resourceIds: [...(explicit?.resourceIds ?? defaultResources)],
    };
  });
}

function normalizeShoppingLine(line: MealPlanShoppingLine): MealPlanShoppingLine {
  if (line.kind === "finished-item") return { ...line, sourceItemIds: [...line.sourceItemIds] };
  const normalized = normalizeAmount(line.amount, line.unit);
  return { ...line, id: `${line.ingredientId}:${normalized.unit}`, amount: normalized.amount, unit: normalized.unit, sourceItemIds: [...line.sourceItemIds] };
}

function normalizeAmount(amount: number, unit: Unit | "item"): { amount: number; unit: Unit | "item" } {
  if (unit === "kg") return { amount: amount * 1000, unit: "g" };
  if (unit === "tbsp") return { amount: amount * 15, unit: "ml" };
  if (unit === "tsp") return { amount: amount * 5, unit: "ml" };
  return { amount, unit };
}

function unitDimension(unit: Unit | "item"): string {
  if (unit === "g" || unit === "kg") return "mass";
  if (unit === "ml" || unit === "tbsp" || unit === "tsp") return "volume";
  return unit;
}

function stablePlanId(selections: readonly MealPlanSelection[]): string {
  return `plan-${selections.map(({ itemId, servings }) => `${itemId}:${servings}`).join("+")}`;
}
