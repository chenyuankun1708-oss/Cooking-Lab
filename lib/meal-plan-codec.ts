import { mealPlanMaxItems, mealPlanSchemaVersion, type MealPlanLocalStateV1, type MealPlanSelection, type MealPlanSharePayloadV1 } from "@/types/meal-plan";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function encodeMealPlanSharePayload(payload: MealPlanSharePayloadV1): string {
  return encodePayload(payload, "items");
}

export function encodeMealPlanAddPayload(payload: MealPlanSharePayloadV1): string {
  return encodePayload(payload, "add");
}

function encodePayload(payload: MealPlanSharePayloadV1, itemParameter: "items" | "add"): string {
  assertPayload(payload);
  const params = new URLSearchParams();
  params.set("v", String(mealPlanSchemaVersion));
  params.set(itemParameter, payload.items.map(({ slug, servings }) => `${slug}:${servings}`).join(","));
  if (payload.template) params.set("template", payload.template);
  return params.toString();
}

export function decodeMealPlanSharePayload(input: URLSearchParams): MealPlanSharePayloadV1 | undefined {
  return decodePayload(input, "items");
}

export function decodeMealPlanAddPayload(input: URLSearchParams): MealPlanSharePayloadV1 | undefined {
  return decodePayload(input, "add");
}

function decodePayload(input: URLSearchParams, itemParameter: "items" | "add"): MealPlanSharePayloadV1 | undefined {
  if (input.get("v") !== String(mealPlanSchemaVersion)) return undefined;
  const rawItems = input.get(itemParameter);
  if (!rawItems) return undefined;
  const items = rawItems.split(",").map((entry) => {
    const separator = entry.lastIndexOf(":");
    if (separator < 1) return undefined;
    const slug = entry.slice(0, separator);
    const servings = Number(entry.slice(separator + 1));
    return slugPattern.test(slug) && validServings(servings) ? { slug, servings } : undefined;
  });
  if (!items.length || items.length > mealPlanMaxItems || items.some((item) => !item)) return undefined;
  const payload: MealPlanSharePayloadV1 = {
    version: mealPlanSchemaVersion,
    items: items as Array<{ slug: string; servings: number }>,
    ...(input.get("template") ? { template: input.get("template")! } : {}),
  };
  try {
    assertPayload(payload);
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
    if (!Array.isArray(parsed.plan.selections) || !parsed.plan.selections.length || parsed.plan.selections.length > mealPlanMaxItems || !Array.isArray(parsed.plan.shopping) || !Array.isArray(parsed.plan.timeline)) return undefined;
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

export function migrateMealPlanV0Selections(value: string | null): MealPlanSelection[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed) || parsed.schemaVersion !== 0 || !Array.isArray(parsed.selections)) return undefined;
    if (!parsed.selections.length || parsed.selections.length > mealPlanMaxItems) return undefined;
    const selections = parsed.selections.map((selection) => {
      if (!isRecord(selection) || typeof selection.itemId !== "string" || !slugPattern.test(selection.itemId) || !validServings(selection.servings)) return undefined;
      return { itemId: selection.itemId, servings: selection.servings };
    });
    if (selections.some((selection) => !selection)) return undefined;
    const migrated = selections as MealPlanSelection[];
    return new Set(migrated.map((selection) => selection.itemId)).size === migrated.length ? migrated : undefined;
  } catch {
    return undefined;
  }
}

function assertPayload(payload: MealPlanSharePayloadV1): void {
  if (payload.version !== mealPlanSchemaVersion || !payload.items.length || payload.items.length > mealPlanMaxItems) {
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
