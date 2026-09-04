import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import { exploreRecipeCatalog } from "../recipe-exploration";

describe("recipe catalog exploration", () => {
  it("returns the complete deterministic catalog without filters", () => {
    const results = exploreRecipeCatalog(recipes, {});
    expect(results).toHaveLength(100);
    expect(results.every((result) => result.eligible && result.score === 100)).toBe(true);
  });

  it("filters with canonical taxonomy values", () => {
    const results = exploreRecipeCatalog(recipes, {
      cuisineId: "sichuan",
      countryId: "china",
      regionId: "sichuan",
      techniqueId: "cold-mix",
      dishTypeId: "cold-dish",
    });
    expect(results.map((result) => result.recipe.slug)).toContain("sichuan-smashed-cucumber");
    expect(results.every(({ recipe }) =>
      recipe.taxonomy.cuisine.cuisineId === "sichuan" &&
      recipe.taxonomy.origin?.countryId === "china" &&
      recipe.taxonomy.origin.regionId === "sichuan" &&
      recipe.taxonomy.techniques.includes("cold-mix") &&
      recipe.taxonomy.mealType.dishTypeId === "cold-dish",
    )).toBe(true);
  });

  it("supports text and inclusive time filtering without changing ranking data", () => {
    const results = exploreRecipeCatalog(recipes, { query: "豆腐", maxTime: 30 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ recipe }) =>
      `${recipe.name} ${recipe.description}`.includes("豆腐") && recipe.cooking.totalTime <= 30,
    )).toBe(true);
    expect(results.every((result) => result.score === 100)).toBe(true);
  });

  it("browses by human time bands and flavor without changing canonical recipe data", () => {
    const before = JSON.stringify(recipes);
    const quick = exploreRecipeCatalog(recipes, { timeBandId: "quick" });
    const freshSpicy = exploreRecipeCatalog(recipes, { flavorPreferenceId: "fresh-spicy" });
    expect(quick.length).toBeGreaterThan(0);
    expect(quick.every(({ recipe }) => recipe.cooking.totalTime <= 20)).toBe(true);
    expect(freshSpicy.map(({ recipe }) => recipe.slug)).toEqual(expect.arrayContaining(["thai-basil-chicken", "hunan-chili-pork"]));
    expect(JSON.stringify(recipes)).toBe(before);
  });
});
