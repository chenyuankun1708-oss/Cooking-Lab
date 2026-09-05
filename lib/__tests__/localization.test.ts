import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { homeHeroEditorialItems } from "@/data/homepage";
import { ingredients } from "@/data/ingredients";
import { recipeImages } from "@/data/recipe-images";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { culinaryStories } from "@/data/culinary/stories";
import { getPublishedRecipes } from "@/data/published-recipes";
import { getPublishedStories, getPublishedStoryPageModel, getStoryExperienceContext } from "@/data/published-stories";
import { hasCompleteNativeCulinaryTranslation } from "@/data/localization/public-culinary";
import { getLocalizedRecipe, getLocalizedRecipes, hasCompleteRecipeTranslation } from "@/data/localization/public-recipes";
import { getLocalizedStoryTranslation, hasCompleteStoryTranslation } from "@/data/localization/public-stories";
import { buildCulinaryDetailModel } from "../culinary-detail";
import { formatHumanCookingTime } from "../cooking-time";
import { getHeatLabel, getUnitLabel } from "../display-labels";
import { describeFlavorProfile } from "../flavor";
import { buildHomeHeroItems } from "../homepage-hero";
import { buildLocaleAlternates } from "../locale-metadata";
import { getLocalizedPath, isSupportedLocale, replacePathLocale, resolveReviewedTranslation, toURLSearchParams } from "../localization";
import { buildRecommendationExplanation } from "../recommendation-display";
import { recommendationEngine } from "../recommendation";
import { describeRecipeSimilarity } from "../recipe-similarity-display";
import { rankSimilarRecipes } from "../recipe-similarity";
import { formatImageAttribution } from "../recipe-images";
import { getRecipeCuisineLabel, getRecipePrimaryTechniqueLabel } from "../taxonomy";
import type { TranslationSet } from "@/types/localization";

const cjk = /[\u3400-\u9fff]/;

describe("locale and route architecture", () => {
  it("parses only the two canonical locales", () => {
    expect(isSupportedLocale("zh-CN")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("zh")).toBe(false);
    expect(isSupportedLocale("en-US")).toBe(false);
  });

  it("generates locale paths and preserves slug and query while switching", () => {
    expect(getLocalizedPath("zh-CN", "/recipes")).toBe("/zh-CN/recipes");
    expect(replacePathLocale("/zh-CN/stories/dongpo-pork-name-and-attribution", "en"))
      .toBe("/en/stories/dongpo-pork-name-and-attribution");
    expect(replacePathLocale("/zh-CN/recipes", "en", "cuisine=sichuan&q=tofu"))
      .toBe("/en/recipes?cuisine=sichuan&q=tofu");
    expect(getLocalizedPath("zh-CN", "/recipes/tomato-scrambled-eggs", toURLSearchParams({
      from: "legacy",
      ingredient: ["egg", "tomato"],
    }))).toBe("/zh-CN/recipes/tomato-scrambled-eggs?from=legacy&ingredient=egg&ingredient=tomato");
  });

  it("keeps legacy routes as redirects to the default locale", () => {
    const files = [
      "app/(legacy)/page.tsx",
      "app/(legacy)/recipes/page.tsx",
      "app/(legacy)/recipes/[slug]/page.tsx",
      "app/(legacy)/culinary/[slug]/page.tsx",
      "app/(legacy)/stories/page.tsx",
      "app/(legacy)/stories/[slug]/page.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source, file).toContain("permanentRedirect(");
      expect(source, file).toContain("zh-CN");
    }
  });

  it("builds one canonical and two hreflang alternates per localized path", () => {
    const alternates = buildLocaleAlternates("en", "/recipes/tomato-scrambled-eggs");
    const languages = alternates.languages as Record<string, string>;
    expect(alternates.canonical).toBe("https://cooking-lab-pied.vercel.app/en/recipes/tomato-scrambled-eggs");
    expect(languages["zh-CN"]).toBe("https://cooking-lab-pied.vercel.app/zh-CN/recipes/tomato-scrambled-eggs");
    expect(languages.en).toBe("https://cooking-lab-pied.vercel.app/en/recipes/tomato-scrambled-eggs");
    expect(languages["zh-CN"]).not.toBe(languages.en);
    expect(readFileSync(resolve(process.cwd(), "app/[locale]/layout.tsx"), "utf8")).toContain("<html lang={locale}>");
  });
});

describe("reviewed public translation policy", () => {
  it("does not fallback when a reviewed public locale is absent", () => {
    const set: TranslationSet<string> = { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: "中文" }] };
    expect(resolveReviewedTranslation(set, "en")).toBeUndefined();
  });

  it("covers all 10 published Recipes without rewriting the 100-item draft dataset", () => {
    const recipes = getPublishedRecipes();
    expect(recipes).toHaveLength(10);
    expect(recipes.every((recipe) => hasCompleteRecipeTranslation(recipe, "en"))).toBe(true);
    const english = getLocalizedRecipes(recipes, "en");
    expect(english).toHaveLength(10);
    expect(english.every((recipe) => !cjk.test([recipe.name, recipe.description, ...recipe.steps.flatMap((step) => [step.instruction, step.why])].join(" ")))).toBe(true);
  });

  it("covers all 16 native CulinaryItems, including procedural and serving-only semantics", () => {
    expect(nativeCulinaryItems).toHaveLength(16);
    for (const item of nativeCulinaryItems) {
      const preparation = item.preparation;
      const hasSteps = "steps" in preparation;
      expect(hasCompleteNativeCulinaryTranslation(
        item.id,
        "en",
        hasSteps ? preparation.steps.length : 0,
        !hasSteps,
        "inputs" in preparation ? preparation.inputs.filter((input) => input.note).map((input) => input.ingredientId) : [],
      ), item.id).toBe(true);
      const detail = buildCulinaryDetailModel(item, ingredients, getStoryExperienceContext("en"), "en");
      expect(cjk.test(JSON.stringify({ name: detail.name, description: detail.description, preparation: detail.preparation })), item.id).toBe(false);
    }
  });

  it("covers all six Stories and preserves claim certainty in English", () => {
    expect(getPublishedStories()).toHaveLength(6);
    for (const story of culinaryStories) {
      expect(hasCompleteStoryTranslation(story.id, "en", story.claims.map((claim) => claim.id)), story.id).toBe(true);
    }
    const dongpo = getLocalizedStoryTranslation("dongpo-pork-name-and-attribution", "en")!;
    const tomyum = getLocalizedStoryTranslation("tomyum-kung-documented-practice", "en")!;
    expect(dongpo.claims["dongpo-pork-direct-invention-disputed"]).toMatch(/does not establish|disputed/i);
    expect(JSON.stringify(dongpo.story)).toMatch(/cannot be used backward as proof|remains disputed/i);
    expect(JSON.stringify(tomyum.story)).toMatch(/does not automatically establish one birthplace/i);
  });
});

describe("localized domain presentation", () => {
  const sourceRecipes = getPublishedRecipes();
  const englishRecipes = getLocalizedRecipes(sourceRecipes, "en");

  it("localizes taxonomy, Flavor, time, units, and hero editorial lines without changing IDs", () => {
    const source = sourceRecipes[0];
    const translated = getLocalizedRecipe(source, "en")!;
    expect(translated.id).toBe(source.id);
    expect(translated.taxonomy).toEqual(source.taxonomy);
    expect(getRecipeCuisineLabel(source, "en")).toBe("Chinese");
    expect(getRecipePrimaryTechniqueLabel(source, "en")).toBe("Stir fry");
    expect(describeFlavorProfile(source.flavor, "en")).not.toMatch(cjk);
    expect(formatHumanCookingTime(20, "en")).toBe("Quick and easy · about 20 min");
    expect(getUnitLabel("g", "en")).toBe("g");
    expect(getHeatLabel("high", "en")).toBe("High heat");
    expect(formatImageAttribution("Author / Wikimedia Commons，裁切处理，CC BY 4.0", "en"))
      .toBe("Author / Wikimedia Commons, cropped, CC BY 4.0");
    const heroes = buildHomeHeroItems(homeHeroEditorialItems, englishRecipes, recipeImages, "en");
    expect(heroes).toHaveLength(5);
    expect(heroes.every((hero) => !cjk.test(`${hero.name} ${hero.editorialLine}`))).toBe(true);
  });

  it("generates recommendation and similarity explanations in either locale from structured results", () => {
    const result = recommendationEngine.rank([englishRecipes[0]], { availableIngredients: ["egg"], preferredCuisine: "chinese" })[0];
    expect(buildRecommendationExplanation(result, "en")).not.toMatch(cjk);
    expect(buildRecommendationExplanation(result, "zh-CN")).toMatch(cjk);

    const target = englishRecipes[0];
    const similar = rankSimilarRecipes(target, englishRecipes, { ingredients })[0];
    if (similar) {
      expect(describeRecipeSimilarity(target, similar, ingredients, "en")).not.toMatch(cjk);
    }
  });

  it("localizes Story evidence locators while preserving source titles and locator values", () => {
    const story = getPublishedStoryPageModel("espresso-developed-through-stages", "en")!;
    expect(story.title).toBe("A coffee shaped by machines and practice");
    expect(story.evidenceContext).toMatch(/retrievable sources/i);
    expect(story.sources.some((source) => source.locatorLabel?.startsWith("Section:"))).toBe(true);
    expect(story.sources.some((source) => source.title === "The Long History of the Espresso Machine")).toBe(true);
  });
});
