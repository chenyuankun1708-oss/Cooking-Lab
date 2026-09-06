import { describe, expect, it } from "vitest";
import { homeHeroEditorialItems, homeHeroRecipeSlugs } from "@/data/homepage";
import { getPublishedRecipes } from "@/data/published-recipes";
import { recipeImages } from "@/data/recipe-images";
import { buildHomeHeroItems } from "../homepage-hero";

const heroItems = buildHomeHeroItems(homeHeroEditorialItems, getPublishedRecipes(), recipeImages);

describe("homepage hero editorial boundary", () => {
  it("uses a unique, published recipe set with valid hero images", () => {
    expect(homeHeroRecipeSlugs).toHaveLength(5);
    expect(new Set(homeHeroRecipeSlugs).size).toBe(homeHeroRecipeSlugs.length);
    expect(heroItems.map(({ slug }) => slug)).toEqual(homeHeroRecipeSlugs);
    expect(homeHeroEditorialItems.every(({ editorialLine }) => editorialLine["zh-CN"].trim().length > 0 && editorialLine.en.trim().length > 0)).toBe(true);
    expect(heroItems.every(({ image }) => image.role === "hero" && Boolean(image.src))).toBe(true);
    expect(JSON.parse(JSON.stringify(heroItems))).toHaveLength(5);
  });

  it("keeps the initial item deterministic and exposes active display data", () => {
    expect(heroItems[0].slug).toBe("tomato-scrambled-eggs");
    expect(heroItems[0]).toMatchObject({
      href: "/zh-CN/recipes/tomato-scrambled-eggs",
      editorialLine: expect.any(String),
      flavor: expect.any(String),
      time: expect.stringContaining("分钟"),
    });
    expect(heroItems[0].image.attribution).toContain("Wikimedia Commons");
    expect(heroItems[0].image.sourceUrl).toMatch(/^https:\/\//);
    expect(heroItems[0].image.licenseUrl).toMatch(/^https:\/\//);
  });

  it("fails fast for duplicate, unpublished, or imageless editorial entries", () => {
    expect(() => buildHomeHeroItems(
      [homeHeroEditorialItems[0], homeHeroEditorialItems[0]],
      getPublishedRecipes(),
      recipeImages,
    )).toThrow(/unique/);
    expect(() => buildHomeHeroItems(
      [{ slug: "not-published", editorialLine: { "zh-CN": "test", en: "test" } }],
      getPublishedRecipes(),
      recipeImages,
    )).toThrow(/published/);
    expect(() => buildHomeHeroItems(
      [homeHeroEditorialItems[0]],
      getPublishedRecipes(),
      [],
    )).toThrow(/valid hero image/);
  });
});
