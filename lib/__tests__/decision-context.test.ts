import { describe, expect, it } from "vitest";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { flavorPreferenceIds } from "@/types/flavor";
import { ingredients } from "@/data/ingredients";
import { getPublishedCulinaryItems } from "@/data/published-culinary-items";
import { getPublishedRecipes } from "@/data/published-recipes";
import { getRecipeTagIds } from "@/lib/taxonomy";
import {
  createDecisionContextValueAllowlist,
  normalizeDecisionContext,
  parseDecisionContext,
  serializeDecisionContext,
  toMealCompositionOptions,
} from "../decision-context";
import {
  decisionContextFieldDefinitions,
  decisionContextFieldOrder,
} from "@/types/decision-context";
import type { RecommendationCriteria } from "@/types/recommendation";

const publishedRecipes = getPublishedRecipes();
const publishedCulinaryItems = getPublishedCulinaryItems();
const allowlist = createDecisionContextValueAllowlist({
  ingredients,
  recipes: publishedRecipes,
  culinaryItems: publishedCulinaryItems,
  supportedTagIds: publishedRecipes.flatMap(getRecipeTagIds),
  flavorPreferenceIds,
});

describe("Decision Context contract", () => {
  it("classifies every RecommendationCriteria field with stable dc-prefixed keys", () => {
    expect(new Set(decisionContextFieldOrder).size).toBe(decisionContextFieldOrder.length);
    expect(decisionContextFieldOrder).toEqual(Object.keys(decisionContextFieldDefinitions));
    expect(Object.values(decisionContextFieldDefinitions).every(({ queryKey }) => queryKey.startsWith("dc"))).toBe(true);
    expect(decisionContextFieldDefinitions.maxTime.scope).toBe("estimated-meal-hard");
    expect(decisionContextFieldDefinitions.availableTools.scope).toBe("meal-hard");
    expect([
      "maxCost",
      "maxCalories",
      "minProtein",
      "maxAddedSugar",
      "maxOil",
      "maxSalt",
    ].map((field) => decisionContextFieldDefinitions[field as keyof typeof decisionContextFieldDefinitions].scope))
      .toEqual(Array(6).fill("recipe-only-hard"));
  });

  it("round-trips every field with normalized stable ordering", () => {
    const context: RecommendationCriteria = {
      availableIngredients: ["tomato", "egg"],
      availableTools: ["mixing-bowl", "frying-pan"],
      maxTime: 45,
      maxCalories: 600,
      minProtein: 20,
      maxOil: 8,
      maxSalt: 1.5,
      maxAddedSugar: 0,
      maxCost: 30,
      preferredCuisine: "chinese",
      preferredTags: ["quick", "high-protein"],
      preferredMethods: ["steam", "stir-fry"],
      flavorPreferences: ["warming", "light"],
    };

    const serialized = serializeDecisionContext(context, allowlist);
    const parsed = parseDecisionContext(serialized, allowlist);

    expect(parsed).toEqual({
      ...context,
      availableIngredients: ["egg", "tomato"],
      availableTools: ["frying-pan", "mixing-bowl"],
      preferredMethods: ["steam", "stir-fry"],
      preferredTags: ["high-protein", "quick"],
      flavorPreferences: ["light", "warming"],
    });
    expect(serializeDecisionContext(parsed, allowlist).toString()).toBe(serialized.toString());
    expect([...serialized.keys()]).toEqual([
      "dcIngredient", "dcIngredient", "dcTool", "dcTool", "dcMaxTime", "dcMaxCalories",
      "dcMinProtein", "dcMaxOil", "dcMaxSalt", "dcMaxAddedSugar", "dcMaxCost", "dcCuisine",
      "dcTag", "dcTag", "dcMethod", "dcMethod", "dcFlavor", "dcFlavor",
    ]);
  });

  it("normalizes malformed, unknown, duplicated, and conflicting values deterministically", () => {
    const forward = new URLSearchParams([
      ["unknown", "kept-out"],
      ["dcIngredient", "unknown-ingredient"],
      ["dcIngredient", "egg"],
      ["dcIngredient", "egg"],
      ["dcTool", "frying-pan"],
      ["dcTool", "unknown-tool"],
      ["dcMaxTime", "45"],
      ["dcMaxTime", "30"],
      ["dcMaxCalories", "Infinity"],
      ["dcMaxCost", "-1"],
      ["dcMaxOil", "0x10"],
      ["dcMaxSalt", "1.50"],
      ["dcMinProtein", "20"],
      ["dcMinProtein", "30"],
      ["dcCuisine", "western"],
      ["dcCuisine", "chinese"],
    ]);
    const reverse = new URLSearchParams([...forward].reverse());

    const expected = {
      availableIngredients: ["egg"],
      availableTools: ["frying-pan"],
      maxTime: 30,
      minProtein: 30,
      maxSalt: 1.5,
      preferredCuisine: "chinese",
    };
    expect(parseDecisionContext(forward, allowlist)).toEqual(expected);
    expect(parseDecisionContext(reverse, allowlist)).toEqual(expected);
    expect(serializeDecisionContext(expected, allowlist).toString()).not.toContain("unknown");
  });

  it("keeps context-free URLs valid and removes runtime-invalid values", () => {
    expect(parseDecisionContext(new URLSearchParams(), allowlist)).toEqual({});
    expect(serializeDecisionContext({}, allowlist).toString()).toBe("");
    expect(normalizeDecisionContext({
      maxTime: Number.NaN,
      maxCalories: Number.POSITIVE_INFINITY,
      availableTools: ["not-a-tool"],
      flavorPreferences: ["not-a-flavor" as never],
    }, allowlist)).toEqual({});
  });

  it("round-trips finite non-negative numbers that JavaScript serializes with exponents", () => {
    const parsed = parseDecisionContext(new URLSearchParams([
      ["dcMaxAddedSugar", "1e-7"],
      ["dcMaxCost", "1e21"],
      ["dcMaxCalories", "1e309"],
    ]), allowlist);

    expect(parsed).toEqual({ maxAddedSugar: 1e-7, maxCost: 1e21 });
    const serialized = serializeDecisionContext(parsed, allowlist);
    expect(serialized.get("dcMaxAddedSugar")).toBe("1e-7");
    expect(serialized.get("dcMaxCost")).toBe("1e+21");
    expect(parseDecisionContext(serialized, allowlist)).toEqual(parsed);
  });

  it("maps only estimated time and the non-empty closed-world tool set to Meal Composition", () => {
    expect(toMealCompositionOptions({
      maxTime: 45,
      availableTools: ["mixing-bowl", "frying-pan", "frying-pan"],
      maxCost: 20,
      maxCalories: 500,
      minProtein: 30,
      maxAddedSugar: 5,
      maxOil: 5,
      maxSalt: 1,
      preferredCuisine: "chinese",
      preferredTags: ["quick"],
    }, allowlist)).toEqual({
      maxTotalTimeMinutes: 45,
      availableToolIds: ["frying-pan", "mixing-bowl"],
    });
    expect(toMealCompositionOptions({ availableTools: [] }, allowlist)).toEqual({});
  });

  it("builds a vocabulary that covers every current Recipe and CulinaryItem tool", () => {
    const allCurrentTools = new Set([
      ...publishedRecipes.flatMap(({ tools }) => tools),
      ...publishedCulinaryItems.flatMap(({ preparation }) =>
        "toolIds" in preparation ? preparation.toolIds : [],
      ),
    ]);
    expect(allowlist.availableTools).toEqual([...allCurrentTools].sort());

    const recipeTools = new Set(publishedRecipes.flatMap(({ tools }) => tools));
    const nativeOnlyTools = new Set(nativeCulinaryItems.flatMap(({ preparation }) =>
      "toolIds" in preparation ? preparation.toolIds.filter((id) => !recipeTools.has(id)) : [],
    ));
    expect(nativeOnlyTools.size).toBeGreaterThan(0);
    expect([...nativeOnlyTools].every((id) => allowlist.availableTools.includes(id))).toBe(true);
  });
});
