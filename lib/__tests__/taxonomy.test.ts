import { describe, expect, it } from "vitest";
import { getTaxonomyLabel } from "@/data/taxonomy";
import { recipes } from "@/data/recipes";
import {
  getFlavorProfileLabels,
  getRecipeCuisineLabel,
  getRecipeDishTypeLabel,
  getRecipeLegacyCategoryLabel,
  getRecipeMealOccasionLabels,
  getRecipeOriginLabel,
  getRecipePrimaryTechniqueLabel,
  getRecipeTagIds,
  getRecipeTagLabels,
  getRecipeTechniqueLabels,
} from "../taxonomy";

describe("taxonomy helpers", () => {
  it("separates machine values from localized labels", () => {
    expect(getTaxonomyLabel("countries", "china", "zh-CN")).toBe("中国");
    expect(getTaxonomyLabel("countries", "china", "en")).toBe("China");
    expect(getTaxonomyLabel("subCuisines", "guangfu", "zh-CN")).toBe("广府菜");
  });

  it("resolves recipe taxonomy labels for display", () => {
    const recipe = recipes[0];
    expect(getRecipeCuisineLabel(recipe)).toBe("中式");
    expect(getRecipePrimaryTechniqueLabel(recipe)).toBe("炒");
    expect(getRecipeDishTypeLabel(recipe)).toBe("主菜");
    expect(getRecipeTechniqueLabels(recipe)).toContain("炒");
  });

  it("keeps breakfast as a meal occasion instead of a dish type", () => {
    const breakfastRecipe = recipes.find((recipe) => recipe.slug === "savory-oat-egg-porridge");
    expect(breakfastRecipe).toBeDefined();
    expect(getRecipeDishTypeLabel(breakfastRecipe!)).toBe("主食");
    expect(getRecipeMealOccasionLabels(breakfastRecipe!)).toEqual(["早餐"]);
    expect(getRecipeLegacyCategoryLabel(breakfastRecipe!)).toBe("早餐");
  });

  it("derives browse and nutrition-related tags without storing them as source-of-truth taxonomy", () => {
    const recipe = recipes.find((item) => item.slug === "mushroom-tofu-rice");
    expect(recipe).toBeDefined();
    expect(recipe!.taxonomy.browseTagIds).toEqual(["one-pot"]);
    expect(recipe!.taxonomy.dietaryTagIds).toEqual(["vegan"]);
    expect(recipe!.taxonomy.mealType.dishTypeId).toBe("staple");
    expect(recipe!.taxonomy.flavorProfile?.tasteIds).toContain("umami");
    expect(getRecipeTagIds(recipe!)).toEqual(expect.arrayContaining(["one-pot", "vegan", "staple", "no-added-sugar"]));
    expect(getRecipeTagLabels(recipe!)).toEqual(expect.arrayContaining(["一锅完成", "纯素"]));
  });

  it("supports optional origin and flavor labels without requiring full hierarchy", () => {
    const chineseRecipe = recipes.find((recipe) => recipe.slug === "tomato-scrambled-eggs");
    const fusionRecipe = recipes.find((recipe) => recipe.slug === "lemon-chicken-breast");
    expect(chineseRecipe).toBeDefined();
    expect(fusionRecipe).toBeDefined();
    expect(getRecipeOriginLabel(chineseRecipe!)).toBe("中国");
    expect(getRecipeOriginLabel(fusionRecipe!)).toBeUndefined();
    expect(getFlavorProfileLabels(chineseRecipe!)).toEqual({
      tastes: ["咸鲜", "微酸"],
      characteristics: ["带汁", "嫩"],
    });
  });

  it("keeps cultural metadata optional and structured", () => {
    const withCulture = recipes.find((recipe) => recipe.slug === "tomato-scrambled-eggs");
    const withoutCulture = recipes.find((recipe) => recipe.slug === "broccoli-chicken");
    expect(withCulture?.culture?.summary).toContain("家常菜");
    expect(withCulture?.culture?.sources).toBeUndefined();
    expect(withoutCulture?.culture).toBeUndefined();
  });
});
