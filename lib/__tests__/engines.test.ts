import { describe, expect, it } from "vitest";
import { ingredients } from "@/data/ingredients";
import { recipes } from "@/data/recipes";
import type { Ingredient } from "@/types/ingredient";
import type { RecipeIngredient } from "@/types/recipe";
import { calculateCost } from "../cost";
import { type IngredientRepository, localIngredientRepository } from "../ingredient-repository";
import { calculateNutrition } from "../nutrition";
import { RuleRecommendationEngine } from "../recommendation";
import { toGrams, UnitConversionError } from "../unit-conversion";

const byId = (id: string) => ingredients.find((ingredient) => ingredient.id === id)!;
const repositoryFor = (items: Ingredient[]): IngredientRepository => {
  const byIdMap = new Map(items.map((ingredient) => [ingredient.id, ingredient]));
  return { getById: (id) => byIdMap.get(id), list: () => items };
};

describe("unit conversion", () => {
  it("converts g and kg without density assumptions", () => {
    expect(toGrams(125, "g", byId("rice"))).toBe(125);
    expect(toGrams(1.25, "kg", byId("rice"))).toBe(1250);
  });

  it("uses ingredient-specific ml, piece, tsp and tbsp weights", () => {
    expect(toGrams(100, "ml", byId("milk"))).toBe(100);
    expect(toGrams(2, "piece", byId("egg"))).toBe(100);
    expect(toGrams(1, "tsp", byId("salt"))).toBe(6);
    expect(toGrams(1, "tbsp", byId("soy-sauce"))).toBe(15);
  });

  it("rejects missing and invalid approximate weights", () => {
    expect(() => toGrams(1, "ml", byId("egg"))).toThrowError(expect.objectContaining({ code: "MISSING_UNIT_WEIGHT" }));
    const invalid = { ...byId("egg"), approximateUnitWeight: { piece: 0 } };
    expect(() => toGrams(1, "piece", invalid)).toThrowError(expect.objectContaining({ code: "INVALID_UNIT_WEIGHT" }));
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid amount %s", (amount) => {
    expect(() => toGrams(amount, "g", byId("rice"))).toThrowError(expect.objectContaining({ code: "INVALID_AMOUNT" }));
  });

  it("rejects unknown runtime units", () => {
    expect(() => toGrams(1, "cup" as never, byId("rice"))).toThrowError(expect.objectContaining({ code: "UNSUPPORTED_UNIT" }));
  });

  it("rejects conversion overflow", () => {
    expect(() => toGrams(Number.MAX_VALUE, "kg", byId("rice"))).toThrowError(expect.objectContaining({ code: "NON_FINITE_RESULT" }));
  });

  it("exposes a domain-specific error type", () => {
    expect(() => toGrams(0, "g", byId("rice"))).toThrow(UnitConversionError);
  });
});

describe("nutrition engine", () => {
  it("sums every nutrition field without premature rounding", () => {
    const result = calculateNutrition([
      { ingredientId: "egg", amount: 1, unit: "piece" },
      { ingredientId: "milk", amount: 100, unit: "ml" },
    ], localIngredientRepository);
    expect(result.total.calories).toBe(132.5);
    expect(result.total.protein).toBeCloseTo(9.5);
    expect(Object.keys(result.total)).toEqual([
      "calories", "protein", "fat", "saturatedFat", "carbs", "sugar", "addedSugar", "fiber", "sodium",
    ]);
    expect(result).toMatchObject({ warnings: [], complete: true, estimated: true });
  });

  it("includes an optional ingredient when it is present in the input", () => {
    const result = calculateNutrition([
      { ingredientId: "egg", amount: 1, unit: "piece", optional: true },
    ], localIngredientRepository);
    expect(result.total.calories).toBe(71.5);
  });

  it("returns structured warnings for missing ingredients and conversion errors", () => {
    const items: RecipeIngredient[] = [
      { ingredientId: "missing", amount: 1, unit: "g" },
      { ingredientId: "egg", amount: 1, unit: "ml" },
      { ingredientId: "rice", amount: Number.NaN, unit: "g" },
    ];
    const result = calculateNutrition(items, localIngredientRepository);
    expect(result.complete).toBe(false);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "MISSING_INGREDIENT", "UNIT_CONVERSION", "UNIT_CONVERSION",
    ]);
    expect(Object.values(result.total).every(Number.isFinite)).toBe(true);
  });

  it("rejects invalid nutrition data without contaminating totals", () => {
    const invalid = { ...byId("egg"), nutritionPer100g: { ...byId("egg").nutritionPer100g, protein: Number.POSITIVE_INFINITY } };
    const result = calculateNutrition([{ ingredientId: "egg", amount: 1, unit: "piece" }], repositoryFor([invalid]));
    expect(result.warnings[0].code).toBe("INVALID_NUTRITION");
    expect(Object.values(result.total).every((value) => value === 0)).toBe(true);
  });

  it("does not let finite inputs overflow the nutrition total", () => {
    const result = calculateNutrition([{ ingredientId: "rice", amount: Number.MAX_VALUE, unit: "g" }], localIngredientRepository);
    expect(result.warnings[0].code).toBe("NON_FINITE_RESULT");
    expect(Object.values(result.total).every(Number.isFinite)).toBe(true);
  });

  it("treats an empty input as a complete zero estimate", () => {
    const result = calculateNutrition([], localIngredientRepository);
    expect(result.complete).toBe(true);
    expect(Object.values(result.total).every((value) => value === 0)).toBe(true);
  });
});

describe("cost engine", () => {
  it("keeps calculation precision instead of rounding for display", () => {
    expect(calculateCost([{ ingredientId: "chicken-breast", amount: 200, unit: "g" }], localIngredientRepository).estimated).toBeCloseTo(5.6);
    expect(calculateCost([{ ingredientId: "shrimp", amount: 123, unit: "g" }], localIngredientRepository).estimated).toBeCloseTo(7.995);
  });

  it("sums multiple ingredients", () => {
    const result = calculateCost([
      { ingredientId: "egg", amount: 2, unit: "piece" },
      { ingredientId: "tomato", amount: 1, unit: "piece" },
    ], localIngredientRepository);
    expect(result.estimated).toBeCloseTo(3.04);
    expect(result).toMatchObject({ warnings: [], complete: true, estimated: 3.04, currency: "CNY" });
  });

  it("returns warnings for missing ingredients, conversion errors and invalid amounts", () => {
    const result = calculateCost([
      { ingredientId: "missing", amount: 1, unit: "g" },
      { ingredientId: "egg", amount: 1, unit: "ml" },
      { ingredientId: "rice", amount: Number.POSITIVE_INFINITY, unit: "g" },
    ], localIngredientRepository);
    expect(result.complete).toBe(false);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "MISSING_INGREDIENT", "UNIT_CONVERSION", "UNIT_CONVERSION",
    ]);
    expect(Number.isFinite(result.estimated)).toBe(true);
  });

  it("rejects invalid prices without contaminating totals", () => {
    const invalid = { ...byId("egg"), estimatedPricePer100g: Number.NaN };
    const result = calculateCost([{ ingredientId: "egg", amount: 1, unit: "piece" }], repositoryFor([invalid]));
    expect(result).toMatchObject({ estimated: 0, complete: false });
    expect(result.warnings[0].code).toBe("INVALID_PRICE");
  });

  it("does not let finite inputs overflow the cost total", () => {
    const costly = { ...byId("egg"), estimatedPricePer100g: Number.MAX_VALUE };
    const result = calculateCost([{ ingredientId: "egg", amount: 3, unit: "piece" }], repositoryFor([costly]));
    expect(result.warnings[0].code).toBe("NON_FINITE_RESULT");
    expect(Number.isFinite(result.estimated)).toBe(true);
  });

  it("treats an empty input as a complete zero estimate", () => {
    expect(calculateCost([], localIngredientRepository)).toMatchObject({ estimated: 0, warnings: [], complete: true });
  });
});

describe("ingredient repository", () => {
  it("provides lookup and read-only listing without domain rules", () => {
    expect(localIngredientRepository.getById("egg")?.name).toBe("鸡蛋");
    expect(localIngredientRepository.getById("missing")).toBeUndefined();
    expect(localIngredientRepository.list()).toHaveLength(30);
  });
});

describe("recommendation integration", () => {
  it("ranks matching time constraints first", () => {
    const results = new RuleRecommendationEngine().rank(recipes, { maxTime: 20 });
    expect(results[0].score).toBe(100);
    expect(results.at(-1)?.hardFailures).toContainEqual(expect.objectContaining({ criterion: "maxTime" }));
  });

  it("explains ingredient mismatch", () => {
    const result = new RuleRecommendationEngine().rank([recipes[0]], { availableIngredients: ["egg"] })[0];
    expect(result.score).toBeGreaterThan(0);
    expect(result.missingIngredients.length).toBeGreaterThan(0);
    expect(result.explanation).toMatch(/还缺/);
  });
});
