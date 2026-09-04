import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import { buildRecipeDetail } from "../recipe-detail";
import { RuleRecommendationEngine } from "../recommendation";

const sharedCoreFiles = [
  "lib/cost.ts",
  "lib/dataset-validation.ts",
  "lib/ingredient-repository.ts",
  "lib/ingredient-validation.ts",
  "lib/image-validation.ts",
  "lib/nutrition.ts",
  "lib/recipe-detail.ts",
  "lib/recipe-exploration.ts",
  "lib/recipe-images.ts",
  "lib/recipe-validation.ts",
  "lib/recommendation.ts",
  "lib/taxonomy.ts",
  "lib/tool-labels.ts",
  "lib/unit-conversion.ts",
  "data/additional-recipes.ts",
  "data/ingredients.ts",
  "data/recipe-images.ts",
  "data/recipe-factories.ts",
  "data/recipes.ts",
  "data/taxonomy.ts",
  "types/ingredient.ts",
  "types/image.ts",
  "types/nutrition.ts",
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
      expect(source, file).not.toMatch(/from\s+["'][^"']*(?:display-labels|formatters|recipe-detail-display)["']/);
    }
  });

  it("returns JSON-serializable application and recommendation results", () => {
    const detail = buildRecipeDetail(recipes[0]);
    const recommendations = new RuleRecommendationEngine().rank(recipes, {
      maxTime: 30,
      preferredCuisine: "chinese",
      preferredTags: ["quick"],
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
