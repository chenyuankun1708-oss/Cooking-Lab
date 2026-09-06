import { describe, expect, it } from "vitest";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { buildMealPlan, MealPlanError, mergeMealPlanSelections, mergeShoppingLines, resolveIncomingMealPlanSelections, scheduleMealPlanTasks, type MealPlanBuildItem } from "@/lib/meal-plan";
import { decodeMealPlanAddPayload, decodeMealPlanSharePayload, encodeMealPlanAddPayload, encodeMealPlanSharePayload, migrateMealPlanV0Selections, parseMealPlanLocalState } from "@/lib/meal-plan-codec";
import { mealPlanMaxItems, mealPlanSchemaVersion, type MealPlanTask } from "@/types/meal-plan";

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

  it("adds new decisions to the local plan without replacing existing items", () => {
    expect(mergeMealPlanSelections(
      [{ itemId: "tomato-scrambled-eggs", servings: 2 }],
      [
        { itemId: "home-mapo-tofu", servings: 4 },
        { itemId: "tomato-scrambled-eggs", servings: 6 },
      ],
    )).toEqual([
      { itemId: "tomato-scrambled-eggs", servings: 2 },
      { itemId: "home-mapo-tofu", servings: 4 },
    ]);
  });

  it("keeps add links additive while shared plans replace local selections exactly", () => {
    const local = [{ itemId: "tomato-scrambled-eggs", servings: 2 }];
    const incoming = [{ itemId: "home-mapo-tofu", servings: 4 }];
    expect(resolveIncomingMealPlanSelections(local, incoming, "merge")).toEqual({
      selections: [...local, ...incoming],
      limitExceeded: false,
    });
    expect(resolveIncomingMealPlanSelections(local, incoming, "replace")).toEqual({
      selections: incoming,
      limitExceeded: false,
    });
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

  it("uses the earliest free resource interval independent of input order", () => {
    const tasks: MealPlanTask[] = [
      task("prep", [], [], 100),
      task("oven-late", ["prep"], ["oven"], 10),
      task("oven-now", [], ["oven"], 10),
    ];
    const forward = scheduleMealPlanTasks(tasks);
    const reverse = scheduleMealPlanTasks(tasks.toReversed());

    expect(forward).toEqual(reverse);
    expect(forward.find((entry) => entry.id === "oven-now")?.startOffsetMinutes).toBe(0);
    expect(forward.find((entry) => entry.id === "oven-late")?.startOffsetMinutes).toBe(100);
  });

  it("rejects cyclic dependencies", () => {
    expect(() => scheduleMealPlanTasks([
      task("a", ["b"], [], 1),
      task("b", ["a"], [], 1),
    ])).toThrowError(MealPlanError);
  });

  it("allocates remaining canonical time when step durations are partially authored", () => {
    const recipeLike: MealPlanBuildItem = {
      id: "partial-duration",
      slug: "partial-duration",
      preparation: {
        kind: "cooking" as const,
        time: { prepMinutes: 5, processMinutes: 15, totalMinutes: 20, activeMinutes: 20 },
        yield: { amount: 2, unit: "serving" as const },
        inputs: [],
        toolIds: [],
        steps: [
          { order: 1, durationMinutes: 5, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "One" } }] } },
          { order: 2, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "Two" } }] } },
          { order: 3, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "Three" } }] } },
        ],
      },
    };

    const plan = buildMealPlan([recipeLike], [{ itemId: "partial-duration", servings: 2 }]);
    expect(plan.timeline.map((entry) => entry.durationMinutes)).toEqual([5, 8, 7]);
    expect(plan.totalMinutes).toBe(20);
  });

  it("includes metadata-authored durations when allocating remaining canonical time", () => {
    const recipeLike: MealPlanBuildItem = {
      id: "metadata-duration",
      slug: "metadata-duration",
      preparation: {
        kind: "cooking" as const,
        time: { prepMinutes: 5, processMinutes: 15, totalMinutes: 20, activeMinutes: 20 },
        yield: { amount: 2, unit: "serving" as const },
        inputs: [],
        toolIds: [],
        steps: [
          { order: 1, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "One" } }] } },
          { order: 2, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "Two" } }] } },
          { order: 3, content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { instruction: "Three" } }] } },
        ],
      },
    };

    const plan = buildMealPlan([recipeLike], [{ itemId: "metadata-duration", servings: 2 }], {
      stepMetadata: { "metadata-duration": { 1: { kind: "wait", durationMinutes: 6 } } },
    });
    expect(plan.timeline.map((entry) => entry.durationMinutes)).toEqual([6, 7, 7]);
    expect(plan.totalMinutes).toBe(20);
  });

  it("round trips the public share payload and rejects unsafe input", () => {
    const query = encodeMealPlanSharePayload({ version: mealPlanSchemaVersion, items: [{ slug: "mango-sticky-rice", servings: 4 }], template: "drink-dessert" });
    expect(decodeMealPlanSharePayload(new URLSearchParams(query))).toEqual({ version: 1, items: [{ slug: "mango-sticky-rice", servings: 4 }], template: "drink-dessert" });
    expect(decodeMealPlanSharePayload(new URLSearchParams("v=1&items=../../secret:2"))).toBeUndefined();
    const addQuery = encodeMealPlanAddPayload({ version: mealPlanSchemaVersion, items: [{ slug: "home-mapo-tofu", servings: 2 }] });
    expect(decodeMealPlanAddPayload(new URLSearchParams(addQuery))).toEqual({ version: 1, items: [{ slug: "home-mapo-tofu", servings: 2 }] });
    expect(decodeMealPlanSharePayload(new URLSearchParams(addQuery))).toBeUndefined();
  });

  it("uses one eight-item limit for building, merging, local state and sharing", () => {
    const selections = Array.from({ length: mealPlanMaxItems + 1 }, (_, index) => ({ itemId: `item-${index}`, servings: 1 }));
    expect(() => buildMealPlan([], selections)).toThrowError(expect.objectContaining({ code: "TOO_MANY_ITEMS" }));
    expect(() => mergeMealPlanSelections(selections.slice(0, mealPlanMaxItems), [selections.at(-1)!])).toThrowError(expect.objectContaining({ code: "TOO_MANY_ITEMS" }));
    expect(() => encodeMealPlanSharePayload({ version: mealPlanSchemaVersion, items: selections.map(({ itemId, servings }) => ({ slug: itemId, servings })) })).toThrow();
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

  it("migrates the pre-release v0 selection-only state into the v1 rebuild path", () => {
    const raw = JSON.stringify({
      schemaVersion: 0,
      selections: [
        { itemId: "mango-sticky-rice", servings: 2 },
        { itemId: "fino-sherry", servings: 1 },
      ],
    });
    expect(migrateMealPlanV0Selections(raw)).toEqual([
      { itemId: "mango-sticky-rice", servings: 2 },
      { itemId: "fino-sherry", servings: 1 },
    ]);
    expect(migrateMealPlanV0Selections(JSON.stringify({ schemaVersion: 0, selections: [{ itemId: "../../bad", servings: 1 }] }))).toBeUndefined();
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
    const excessiveSelections = { ...state, plan: { ...plan, selections: Array.from({ length: 25 }, (_, index) => ({ itemId: `item-${index}`, servings: 1 })) } };
    expect(parseMealPlanLocalState(JSON.stringify(excessiveSelections))).toBeUndefined();
  });
});

function task(id: string, dependencyIds: string[], resourceIds: string[], durationMinutes: number): MealPlanTask {
  return { id, itemId: id, kind: "active", durationMinutes, startOffsetMinutes: 0, dependencyIds, resourceIds };
}
