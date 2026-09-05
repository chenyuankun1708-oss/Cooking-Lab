import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import { buildRecipeDetail } from "../recipe-detail";
import { RuleRecommendationEngine } from "../recommendation";

const sharedCoreFiles = [
  "lib/cost.ts",
  "lib/decision-context.ts",
  "lib/decision-context-navigation.ts",
  "lib/culinary-item-adapter.ts",
  "lib/culinary-pairing.ts",
  "lib/culinary-detail.ts",
  "lib/culinary-library-validation.ts",
  "lib/culinary-publishing.ts",
  "lib/culinary-routes.ts",
  "lib/culinary-validation.ts",
  "lib/cooking-time.ts",
  "lib/dataset-validation.ts",
  "lib/ingredient-repository.ts",
  "lib/ingredient-validation.ts",
  "lib/image-validation.ts",
  "lib/flavor.ts",
  "lib/flavor-validation.ts",
  "lib/homepage-hero-rotation.ts",
  "lib/homepage-hero.ts",
  "lib/nutrition.ts",
  "lib/localization.ts",
  "lib/meal-composition.ts",
  "lib/recipe-detail.ts",
  "lib/recipe-exploration.ts",
  "lib/recipe-images.ts",
  "lib/recipe-publishing.ts",
  "lib/recipe-similarity.ts",
  "lib/recipe-validation.ts",
  "lib/recommendation.ts",
  "lib/story-experience.ts",
  "lib/story-publishing.ts",
  "lib/taxonomy.ts",
  "lib/tool-labels.ts",
  "lib/unit-conversion.ts",
  "data/additional-recipes.ts",
  "data/culinary/evidence.ts",
  "data/culinary/images.ts",
  "data/culinary/item-factories.ts",
  "data/culinary/items-desserts.ts",
  "data/culinary/items-dishes.ts",
  "data/culinary/items-drinks.ts",
  "data/culinary/items.ts",
  "data/culinary/sources.ts",
  "data/culinary/stories.ts",
  "data/culinary/taxonomy.ts",
  "data/flavor.ts",
  "data/ingredients.ts",
  "data/recipe-images.ts",
  "data/recipe-flavors.ts",
  "data/recipe-factories.ts",
  "data/recipes.ts",
  "data/taxonomy.ts",
  "types/ingredient.ts",
  "types/culinary.ts",
  "types/decision-context.ts",
  "types/flavor.ts",
  "types/image.ts",
  "types/nutrition.ts",
  "types/pairing.ts",
  "types/localization.ts",
  "types/publication.ts",
  "types/recipe.ts",
  "types/recommendation.ts",
  "types/taxonomy.ts",
] as const;

describe("shared core boundaries", () => {
  it("does not import React, Next.js, DOM, or styling modules", () => {
    for (const file of sharedCoreFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source, file).not.toMatch(/from\s+["'](?:react|next(?:\/[^"']*)?)["']/);
      expect(source, file).not.toMatch(/\b(?:window|document|localStorage|sessionStorage)\b/);
      expect(source, file).not.toMatch(/\.css["']/);
      expect(source, file).not.toMatch(/from\s+["'](?:node:fs|fs|@prisma\/client|prisma|[^"']*(?:database|sql)[^"']*)["']/i);
      expect(source, file).not.toMatch(/from\s+["'][^"']*(?:display-labels|formatters|recipe-detail-display)["']/);
    }
  });

  it("returns JSON-serializable application and recommendation results", () => {
    const detail = buildRecipeDetail(recipes[0]);
    const recommendations = new RuleRecommendationEngine().rank(recipes, {
      maxTime: 30,
      preferredCuisine: "chinese",
      preferredTags: ["quick"],
      flavorPreferences: ["light"],
    });

    expect(() => JSON.stringify(detail)).not.toThrow();
    expect(() => JSON.stringify(recommendations)).not.toThrow();
    expect(JSON.parse(JSON.stringify(detail))).toMatchObject({
      recipe: { slug: recipes[0].slug },
      times: { totalMinutes: recipes[0].cooking.totalTime },
    });
    expect(JSON.parse(JSON.stringify(recommendations))).toHaveLength(100);
  });
});
