import { describe, expect, it } from "vitest";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { buildMealPlan, MealPlanError, mergeShoppingLines, scheduleMealPlanTasks, type MealPlanBuildItem } from "@/lib/meal-plan";
import { decodeMealPlanSharePayload, encodeMealPlanSharePayload, parseMealPlanLocalState } from "@/lib/meal-plan-codec";
import { mealPlanSchemaVersion, type MealPlanTask } from "@/types/meal-plan";

describe("meal plan", () => {
  it("scales servings and safely merges compatible units", () => {
    const lines = mergeShoppingLines([
      { id: "a", kind: "ingredient", ingredientId: "milk", amount: 1, unit: "tbsp", optional: true, sourceItemIds: ["a"] },
      { id: "b", kind: "ingredient", ingredientId: "milk", amount: 10, unit: "ml", optional: false, sourceItemIds: ["b"] },
      { id: "c", kind: "ingredient", ingredientId: "milk", amount: 10, unit: "g", optional: false, sourceItemIds: ["c"] },
    ]);
    expect(lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ ingredientId: "milk", amount: 25, unit: "ml", optional: false }),
      expect.objectContaining({ ingredientId: "milk", amount: 10, unit: "g" }),
    ]));
  });

  it("builds procedural and ready-to-serve tasks without invented steps", () => {
    const plan = buildMealPlan(nativeCulinaryItems, [
      { itemId: "mango-sticky-rice", servings: 2 },
      { itemId: "fino-sherry", servings: 2 },
    ], { stepMetadata: { "mango-sticky-rice": { 1: { kind: "prepare-ahead" }, 4: { kind: "wait" } } } });
    expect(plan.selections).toHaveLength(2);
    expect(plan.shopping).toContainEqual(expect.objectContaining({ ingredientId: "glutinous-rice", amount: 125 }));
    expect(plan.shopping).toContainEqual(expect.objectContaining({ itemId: "fino-sherry", kind: "finished-item" }));
    expect(plan.timeline).toContainEqual(expect.objectContaining({ id: "fino-sherry:serve", kind: "serve" }));
    expect(plan.timeline).toContainEqual(expect.objectContaining({ id: "mango-sticky-rice:step:1", kind: "prepare-ahead" }));
    expect(plan.timeline.find((task) => task.id === "fino-sherry:serve")?.startOffsetMinutes).toBeGreaterThanOrEqual(
      plan.timeline.filter((task) => task.itemId === "mango-sticky-rice").reduce((end, task) => Math.max(end, task.startOffsetMinutes + task.durationMinutes), 0),
    );
  });

  it("allocates canonical active time when legacy steps have no authored duration", () => {
    const recipeLike: MealPlanBuildItem = {
      id: "legacy",
      slug: "legacy",
      preparation: {
        kind: "cooking" as const,
        time: { prepMinutes: 5, processMinutes: 10, totalMinutes: 15, activeMinutes: 15 },
        yield: { amount: 2, unit: "serving" as const },
        inputs: [],
        toolIds: [],
        steps: [
          { order: 1, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "One" } }] } },
          { order: 2, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "Two" } }] } },
        ],
      },
    };
    const plan = buildMealPlan([recipeLike], [{ itemId: "legacy", servings: 2 }]);
    expect(plan.totalMinutes).toBe(15);
    expect(plan.timeline.map((task) => task.durationMinutes)).toEqual([8, 7]);
  });

  it("respects dependencies and serializes shared equipment", () => {
    const tasks: MealPlanTask[] = [
      task("a", [], ["oven"], 10),
      task("b", [], ["oven"], 5),
      task("c", ["a"], [], 2),
    ];
    const result = scheduleMealPlanTasks(tasks);
    expect(result.find((entry) => entry.id === "b")?.startOffsetMinutes).toBe(10);
    expect(result.find((entry) => entry.id === "c")?.startOffsetMinutes).toBe(10);
  });

  it("rejects cyclic dependencies", () => {
    expect(() => scheduleMealPlanTasks([
      task("a", ["b"], [], 1),
      task("b", ["a"], [], 1),
    ])).toThrowError(MealPlanError);
  });

  it("round trips the public share payload and rejects unsafe input", () => {
    const query = encodeMealPlanSharePayload({ version: mealPlanSchemaVersion, items: [{ slug: "mango-sticky-rice", servings: 4 }], template: "drink-dessert" });
    expect(decodeMealPlanSharePayload(new URLSearchParams(query))).toEqual({ version: 1, items: [{ slug: "mango-sticky-rice", servings: 4 }], template: "drink-dessert" });
    expect(decodeMealPlanSharePayload(new URLSearchParams("v=1&items=../../secret:2"))).toBeUndefined();
  });

  it("fails closed for corrupt or obsolete local state", () => {
    expect(parseMealPlanLocalState("not json")).toBeUndefined();
    expect(parseMealPlanLocalState(JSON.stringify({ schemaVersion: 0 }))).toBeUndefined();
    expect(parseMealPlanLocalState(JSON.stringify({
      schemaVersion: 1,
      plan: { schemaVersion: 1, id: "bad", selections: [], shopping: [], timeline: [], totalMinutes: "10" },
      checkedShoppingLineIds: [], completedTaskIds: [], updatedAt: new Date().toISOString(),
    }))).toBeUndefined();
  });

  it("restores a deeply validated plan including local-only progress and timer state", () => {
    const plan = buildMealPlan(nativeCulinaryItems, [{ itemId: "mango-sticky-rice", servings: 2 }]);
    const state = {
      schemaVersion: mealPlanSchemaVersion,
      plan,
      checkedShoppingLineIds: [plan.shopping[0].id],
      completedTaskIds: [plan.timeline[0].id],
      activeTimer: { taskId: plan.timeline[1].id, startedAt: "2026-09-06T10:00:00.000Z" },
      updatedAt: "2026-09-06T10:00:00.000Z",
    } as const;
    expect(parseMealPlanLocalState(JSON.stringify(state))).toEqual(state);

    const invalidReference = { ...state, completedTaskIds: ["unknown-task"] };
    expect(parseMealPlanLocalState(JSON.stringify(invalidReference))).toBeUndefined();
    const duplicateSelection = { ...state, plan: { ...plan, selections: [...plan.selections, plan.selections[0]] } };
    expect(parseMealPlanLocalState(JSON.stringify(duplicateSelection))).toBeUndefined();
  });
});

function task(id: string, dependencyIds: string[], resourceIds: string[], durationMinutes: number): MealPlanTask {
  return { id, itemId: id, kind: "active", durationMinutes, startOffsetMinutes: 0, dependencyIds, resourceIds };
}
