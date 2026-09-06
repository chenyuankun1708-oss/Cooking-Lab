import { mealPlanSchemaVersion, type MealPlanLocalStateV1, type MealPlanSharePayloadV1 } from "@/types/meal-plan";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxSharedItems = 8;

export function encodeMealPlanSharePayload(payload: MealPlanSharePayloadV1): string {
  assertSharePayload(payload);
  const params = new URLSearchParams();
  params.set("v", String(mealPlanSchemaVersion));
  params.set("items", payload.items.map(({ slug, servings }) => `${slug}:${servings}`).join(","));
  if (payload.template) params.set("template", payload.template);
  return params.toString();
}

export function decodeMealPlanSharePayload(input: URLSearchParams): MealPlanSharePayloadV1 | undefined {
  if (input.get("v") !== String(mealPlanSchemaVersion)) return undefined;
  const rawItems = input.get("items");
  if (!rawItems) return undefined;
  const items = rawItems.split(",").map((entry) => {
    const separator = entry.lastIndexOf(":");
    if (separator < 1) return undefined;
    const slug = entry.slice(0, separator);
    const servings = Number(entry.slice(separator + 1));
    return slugPattern.test(slug) && validServings(servings) ? { slug, servings } : undefined;
  });
  if (!items.length || items.length > maxSharedItems || items.some((item) => !item)) return undefined;
  const payload: MealPlanSharePayloadV1 = {
    version: mealPlanSchemaVersion,
    items: items as Array<{ slug: string; servings: number }>,
    ...(input.get("template") ? { template: input.get("template")! } : {}),
  };
  try {
    assertSharePayload(payload);
    return payload;
  } catch {
    return undefined;
  }
}

export function parseMealPlanLocalState(value: string | null): MealPlanLocalStateV1 | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed) || parsed.schemaVersion !== mealPlanSchemaVersion || !isRecord(parsed.plan)) return undefined;
    if (parsed.plan.schemaVersion !== mealPlanSchemaVersion || typeof parsed.plan.id !== "string" || !parsed.plan.id.trim()) return undefined;
    if (!isStringArray(parsed.checkedShoppingLineIds) || !isStringArray(parsed.completedTaskIds) || !isIsoDateTime(parsed.updatedAt)) return undefined;
    if (!Array.isArray(parsed.plan.selections) || !Array.isArray(parsed.plan.shopping) || !Array.isArray(parsed.plan.timeline)) return undefined;
    if (!isFiniteNonNegative(parsed.plan.totalMinutes)) return undefined;

    const selectionsValid = parsed.plan.selections.every((selection) =>
      isRecord(selection) && typeof selection.itemId === "string" && selection.itemId.length > 0 && validServings(selection.servings),
    );
    const shoppingValid = parsed.plan.shopping.every((line) =>
      isRecord(line)
      && typeof line.id === "string"
      && (line.kind === "ingredient" || line.kind === "finished-item")
      && isFiniteNonNegative(line.amount)
      && typeof line.unit === "string"
      && ["g", "kg", "ml", "piece", "tbsp", "tsp", "item"].includes(line.unit)
      && typeof line.optional === "boolean"
      && isStringArray(line.sourceItemIds)
      && (line.kind === "ingredient" ? typeof line.ingredientId === "string" : typeof line.itemId === "string"),
    );
    const timelineValid = parsed.plan.timeline.every((task) =>
      isRecord(task)
      && typeof task.id === "string"
      && typeof task.itemId === "string"
      && ["active", "wait", "prepare-ahead", "serve"].includes(String(task.kind))
      && isFiniteNonNegative(task.durationMinutes)
      && isFiniteNonNegative(task.startOffsetMinutes)
      && isStringArray(task.dependencyIds)
      && isStringArray(task.resourceIds)
      && (task.stepOrder === undefined || (Number.isInteger(task.stepOrder) && Number(task.stepOrder) > 0)),
    );
    if (!selectionsValid || !shoppingValid || !timelineValid) return undefined;

    const selections = parsed.plan.selections as Array<{ itemId: string; servings: number }>;
    const shopping = parsed.plan.shopping as Array<{ id: string; sourceItemIds: string[] }>;
    const timeline = parsed.plan.timeline as Array<{ id: string; itemId: string; dependencyIds: string[]; startOffsetMinutes: number; durationMinutes: number }>;
    const selectedItemIds = new Set(selections.map((selection) => selection.itemId));
    const shoppingIds = new Set(shopping.map((line) => line.id));
    const taskIds = new Set(timeline.map((task) => task.id));
    if (selectedItemIds.size !== selections.length || shoppingIds.size !== shopping.length || taskIds.size !== timeline.length) return undefined;
    if (shopping.some((line) => line.sourceItemIds.some((itemId) => !selectedItemIds.has(itemId)))) return undefined;
    if (timeline.some((task) => !selectedItemIds.has(task.itemId) || task.dependencyIds.some((id) => !taskIds.has(id)))) return undefined;
    const calculatedTotalMinutes = Math.max(0, ...timeline.map((task) => task.startOffsetMinutes + task.durationMinutes));
    if (calculatedTotalMinutes !== parsed.plan.totalMinutes) return undefined;
    if (new Set(parsed.checkedShoppingLineIds).size !== parsed.checkedShoppingLineIds.length || new Set(parsed.completedTaskIds).size !== parsed.completedTaskIds.length) return undefined;
    if (parsed.checkedShoppingLineIds.some((id) => !shoppingIds.has(id)) || parsed.completedTaskIds.some((id) => !taskIds.has(id))) return undefined;
    if (parsed.activeTimer !== undefined) {
      if (!isRecord(parsed.activeTimer) || typeof parsed.activeTimer.taskId !== "string" || !taskIds.has(parsed.activeTimer.taskId) || !isIsoDateTime(parsed.activeTimer.startedAt)) return undefined;
    }
    return parsed as unknown as MealPlanLocalStateV1;
  } catch {
    return undefined;
  }
}

function assertSharePayload(payload: MealPlanSharePayloadV1): void {
  if (payload.version !== mealPlanSchemaVersion || !payload.items.length || payload.items.length > maxSharedItems) {
    throw new Error("Invalid meal plan share payload.");
  }
  const seen = new Set<string>();
  for (const item of payload.items) {
    if (!slugPattern.test(item.slug) || !validServings(item.servings) || seen.has(item.slug)) throw new Error("Invalid shared meal plan item.");
    seen.add(item.slug);
  }
  if (payload.template && !/^[a-z0-9-]{1,48}$/.test(payload.template)) throw new Error("Invalid meal plan template.");
}

function validServings(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 50;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}
