import { describe, expect, it } from "vitest";
import { ingredients } from "@/data/ingredients";
import type { Ingredient } from "@/types/ingredient";
import { validateIngredients } from "../ingredient-validation";
import { toGrams } from "../unit-conversion";

describe("ingredient dataset", () => {
  it("passes structural and numeric validation", () => {
    expect(ingredients.length).toBeGreaterThanOrEqual(29);
    expect(validateIngredients(ingredients)).toEqual([]);
    expect(ingredients.every((ingredient) => ingredient.dataQuality === "demo-estimated")).toBe(true);
  });

  it("covers the MVP ingredient groups", () => {
    const ids = new Set(ingredients.map((ingredient) => ingredient.id));
    for (const required of [
      "chicken-breast", "chicken-thigh", "pork-tenderloin", "beef-lean", "shrimp", "salmon", "egg",
      "tofu", "lentil", "rice", "noodles", "oats", "potato", "sweet-potato",
      "tomato", "broccoli", "spinach", "cabbage", "mushroom", "cooking-oil", "salt", "soy-sauce",
    ]) {
      expect(ids.has(required), `missing ${required}`).toBe(true);
    }
  });

  it("supports representative piece, ml, tsp and tbsp conversions", () => {
    const byId = (id: string) => ingredients.find((ingredient) => ingredient.id === id)!;
    expect(toGrams(1, "piece", byId("egg"))).toBe(50);
    expect(toGrams(100, "ml", byId("milk"))).toBe(100);
    expect(toGrams(1, "tsp", byId("salt"))).toBe(6);
    expect(toGrams(1, "tbsp", byId("soy-sauce"))).toBe(15);
  });

  it("reports duplicate IDs and invalid numeric values", () => {
    const invalid: Ingredient[] = [
      ingredients[0],
      { ...ingredients[0], estimatedPricePer100g: -1, nutritionPer100g: { ...ingredients[0].nutritionPer100g, protein: Number.NaN } },
    ];
    const issues = validateIngredients(invalid);
    expect(issues.map((issue) => issue.message)).toEqual(expect.arrayContaining(["ID 重复", "名称重复", "参考价格必须是非负有限数", "营养值必须是非负有限数"]));
  });

  it("reports alias conflicts and invalid runtime metadata", () => {
    const conflicting = {
      ...ingredients[1],
      id: "conflicting-item",
      name: "测试食材",
      aliases: [ingredients[0].name],
      category: "unknown",
      dataQuality: "verified",
    } as unknown as Ingredient;
    const messages = validateIngredients([ingredients[0], conflicting]).map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining([
      "名称或别名与 egg 冲突",
      "类别不在当前 schema 中",
      "数据质量必须标记为 demo-estimated",
    ]));
  });
});
