import { describe, expect, it } from "vitest";
import { homeHeroEditorialItems, homeHeroRecipeSlugs } from "@/data/homepage";
import { getPublishedRecipes } from "@/data/published-recipes";
import { recipeImages } from "@/data/recipe-images";
import { buildHomeHeroItems } from "../homepage-hero";
import {
  getNextHomeHeroIndex,
  getPreviousHomeHeroIndex,
  HOME_HERO_ROTATION_INTERVAL_MS,
  HOME_HERO_TRANSITION_MS,
  normalizeHomeHeroIndex,
  shouldAutoRotateHomeHero,
} from "../homepage-hero-rotation";

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

describe("homepage hero rotation policy", () => {
  it("wraps next and previous indices and normalizes direct selection", () => {
    expect(getNextHomeHeroIndex(4, 5)).toBe(0);
    expect(getPreviousHomeHeroIndex(0, 5)).toBe(4);
    expect(normalizeHomeHeroIndex(7, 5)).toBe(2);
    expect(normalizeHomeHeroIndex(-1, 5)).toBe(4);
  });

  it("uses restrained timing without requiring real-time tests", () => {
    expect(HOME_HERO_ROTATION_INTERVAL_MS).toBeGreaterThanOrEqual(6_000);
    expect(HOME_HERO_ROTATION_INTERVAL_MS).toBeLessThanOrEqual(8_000);
    expect(HOME_HERO_TRANSITION_MS).toBeGreaterThanOrEqual(500);
    expect(HOME_HERO_TRANSITION_MS).toBeLessThanOrEqual(900);
  });

  it("disables auto rotation for reduced motion, pause, hidden pages, or one item", () => {
    const active = { itemCount: 5, reducedMotion: false, paused: false, visible: true };
    expect(shouldAutoRotateHomeHero(active)).toBe(true);
    expect(shouldAutoRotateHomeHero({ ...active, reducedMotion: true })).toBe(false);
    expect(shouldAutoRotateHomeHero({ ...active, paused: true })).toBe(false);
    expect(shouldAutoRotateHomeHero({ ...active, visible: false })).toBe(false);
    expect(shouldAutoRotateHomeHero({ ...active, itemCount: 1 })).toBe(false);
  });
});
