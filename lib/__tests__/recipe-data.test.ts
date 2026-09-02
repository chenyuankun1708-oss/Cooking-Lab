import { describe, expect, it } from "vitest";
import { ingredients } from "@/data/ingredients";
import { recipes } from "@/data/recipes";
import type { Recipe } from "@/types/recipe";
import { calculateCost } from "../cost";
import { localIngredientRepository as repository } from "../ingredient-repository";
import { calculateNutrition } from "../nutrition";
import { validateRecipes } from "../recipe-validation";

describe("recipe dataset", () => {
  it("contains 30 valid recipes without dangling ingredient references", () => {
    expect(recipes).toHaveLength(30);
    expect(validateRecipes(recipes, ingredients)).toEqual([]);
  });

  it("covers the planned cooking methods and stable metadata values", () => {
    const methods = new Set(recipes.map((recipe) => recipe.cooking.method));
    for (const method of ["煎", "炒", "蒸", "煮", "炖", "焖", "烤", "汤", "凉拌", "电饭锅"]) {
      expect(methods.has(method), `missing method ${method}`).toBe(true);
    }
    expect(new Set(recipes.map((recipe) => recipe.cuisine))).toEqual(new Set(["中式", "融合", "西式"]));
  });

  it("covers the MVP protein and staple ingredient groups", () => {
    const used = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((item) => item.ingredientId)));
    for (const id of [
      "chicken-breast", "chicken-thigh", "beef-lean", "pork-tenderloin", "salmon", "shrimp",
      "egg", "tofu", "lentil", "rice", "noodles", "potato", "sweet-potato", "oats",
    ]) {
      expect(used.has(id), `unused required ingredient ${id}`).toBe(true);
    }
  });

  it("calculates complete nutrition and cost estimates for every recipe", () => {
    for (const recipe of recipes) {
      const nutrition = calculateNutrition(recipe.ingredients, repository);
      const cost = calculateCost(recipe.ingredients, repository);
      expect(nutrition.warnings, recipe.slug).toEqual([]);
      expect(cost.warnings, recipe.slug).toEqual([]);
      expect(Object.values(nutrition.total).every((value) => Number.isFinite(value) && value >= 0), recipe.slug).toBe(true);
      expect(Number.isFinite(cost.estimated) && cost.estimated >= 0, recipe.slug).toBe(true);
    }
  });

  it("reports structural, reference and cooking consistency errors", () => {
    const invalid = {
      ...recipes[0], id: recipes[1].id, slug: recipes[1].slug, servings: 0,
      ingredients: [{ ingredientId: "missing", amount: -1, unit: "g", optional: false }],
      cooking: { ...recipes[0].cooking, prepTime: -1, oil: 99 },
      tools: ["Bad Tool"], steps: [{ order: 2, instruction: "", why: "" }],
    } as Recipe;
    const messages = validateRecipes([recipes[1], invalid], ingredients).map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining([
      "Recipe ID 重复", "Slug 重复", "份数必须是正有限数", "不存在的食材 ID: missing",
      "食材用量必须是正有限数", "烹饪数值必须是非负有限数", "用油字段与食材明细不一致",
      "工具必须是非空 kebab-case 列表", "步骤序号必须从 1 连续递增", "步骤说明不能为空", "步骤原理不能为空",
    ]));
  });
});
