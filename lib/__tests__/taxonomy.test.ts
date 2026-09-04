import { describe, expect, it } from "vitest";
import { getTaxonomyLabel } from "@/data/taxonomy";
import { recipes } from "@/data/recipes";
import { getFlavorProfileLabels } from "../flavor";
import {
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
    expect(recipe!.flavor.tastes.umami).toBe(3);
    expect(getRecipeTagIds(recipe!)).toEqual(expect.arrayContaining(["one-pot", "vegan", "staple", "no-added-sugar"]));
    expect(getRecipeTagLabels(recipe!)).toEqual(expect.arrayContaining(["一锅完成", "纯素"]));
  });

  it("derives quick from total time instead of storing it in browseTagIds", () => {
    const quickRecipe = recipes.find((recipe) => recipe.slug === "tomato-scrambled-eggs");
    const slowerRecipe = recipes.find((recipe) => recipe.slug === "mushroom-tofu-rice");
    expect(quickRecipe?.taxonomy.browseTagIds).toBeUndefined();
    expect(getRecipeTagIds(quickRecipe!)).toContain("quick");
    expect(getRecipeTagIds(slowerRecipe!)).not.toContain("quick");
  });

  it("keeps optional geography separate from the canonical flavor display adapter", () => {
    const chineseRecipe = recipes.find((recipe) => recipe.slug === "tomato-scrambled-eggs");
    const fusionRecipe = recipes.find((recipe) => recipe.slug === "lemon-chicken-breast");
    expect(chineseRecipe).toBeDefined();
    expect(fusionRecipe).toBeDefined();
    expect(getRecipeOriginLabel(chineseRecipe!)).toBe("中国");
    expect(getRecipeOriginLabel(fusionRecipe!)).toBeUndefined();
    expect(getFlavorProfileLabels(chineseRecipe!.flavor)).toMatchObject({
      tastes: expect.arrayContaining([
        { id: "salty", label: "咸香", intensity: 1 },
        { id: "sour", label: "酸香", intensity: 2 },
      ]),
      aromas: ["番茄浓香"],
      textures: ["软嫩", "裹汁"],
      characters: ["家常舒服", "下饭"],
    });
  });

  it("keeps cultural metadata optional and structured", () => {
    const withCulture = recipes.find((recipe) => recipe.slug === "lemon-chicken-breast");
    const withoutCulture = recipes.find((recipe) => recipe.slug === "broccoli-chicken");
    expect(withCulture?.culture?.summary).toContain("现代");
    expect(withCulture?.culture?.sources).toBeUndefined();
    expect(withoutCulture?.culture).toBeUndefined();
  });
});
