import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { recipeImages } from "@/data/recipe-images";
import { recipes } from "@/data/recipes";
import type { RecipeImage } from "@/types/image";
import type { Recipe } from "@/types/recipe";
import { validateImageAssets, validateRecipeImageReferences } from "../image-validation";
import { getRecipeHeroImage, getRecipeImageFallback } from "../recipe-images";

const heroImage: RecipeImage = {
  id: "tomato-scrambled-eggs-hero",
  src: "/images/recipes/tomato-scrambled-eggs/hero.webp",
  alt: "番茄炒蛋盛在浅色餐盘中，表面可见嫩鸡蛋与番茄块",
  role: "hero",
  delivery: "local",
  width: 1800,
  height: 1200,
  aspectRatio: "3:2",
  focalPoint: { x: 0.5, y: 0.45 },
  source: "self-created",
  license: "self-created",
};

describe("recipe image system", () => {
  it("keeps the seed registry valid and returns real or fallback presentation data", () => {
    expect(recipeImages).toHaveLength(10);
    expect(validateImageAssets(recipeImages)).toEqual([]);
    expect(validateRecipeImageReferences(recipes, recipeImages)).toEqual([]);
    expect(getRecipeHeroImage(recipes[0], recipeImages)?.id).toBe("tomato-scrambled-eggs-hero");
    expect(getRecipeImageFallback(recipes[0])).toEqual({ initial: "番", label: "番茄炒蛋" });
  });

  it("keeps every registered local asset present under public", () => {
    for (const image of recipeImages.filter((item) => item.delivery === "local")) {
      expect(existsSync(resolve(process.cwd(), "public", image.src.replace(/^\//, ""))), image.src).toBe(true);
    }
  });

  it("keeps source, author and license provenance for every seed image", () => {
    for (const image of recipeImages) {
      expect(image.sourceUrl, image.id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(image.author?.trim(), image.id).toBeTruthy();
      expect(image.licenseUrl, image.id).toMatch(/^https:\/\/creativecommons\.org\//);
      expect(image.attribution?.trim(), image.id).toBeTruthy();
      expect(image.alt.length, image.id).toBeGreaterThan(10);
    }
  });

  it("resolves a valid hero reference without framework-specific data", () => {
    const recipe: Recipe = { ...recipes[0], heroImageId: heroImage.id };
    expect(validateImageAssets([heroImage])).toEqual([]);
    expect(validateRecipeImageReferences([recipe], [heroImage])).toEqual([]);
    expect(getRecipeHeroImage(recipe, [heroImage])).toEqual(heroImage);
    expect(() => JSON.stringify(heroImage)).not.toThrow();
  });

  it("rejects duplicate, unsafe and malformed registry entries", () => {
    const invalid = {
      ...heroImage,
      alt: "",
      src: "/random-file.jpg",
      license: "unknown",
      focalPoint: { x: 2, y: 0.5 },
    } as RecipeImage;
    const messages = validateImageAssets([invalid, invalid]).map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining([
      "Image ID 重复",
      "非商业、禁止改编、未知或禁止授权的图片不能进入可用 registry",
      "Hero image alt 不能为空",
      "本地图片路径必须符合 recipe asset naming convention",
      "focalPoint x/y 必须在 0 到 1 之间",
    ]));
  });

  it("requires attribution metadata for CC BY assets and valid recipe references", () => {
    const ccByImage: RecipeImage = {
      ...heroImage,
      source: "open-license",
      sourceUrl: "https://example.com/photo",
      license: "cc-by",
    };
    expect(validateImageAssets([ccByImage]).map((issue) => issue.field)).toEqual(expect.arrayContaining([
      "author",
      "attribution",
      "licenseUrl",
    ]));

    const wrongRecipe = { ...recipes[1], heroImageId: heroImage.id };
    expect(validateRecipeImageReferences([wrongRecipe], [heroImage])).toContainEqual({
      recipeId: wrongRecipe.id,
      field: "heroImageId",
      message: "本地 hero image 路径必须与 recipe slug 对齐",
    });
    expect(validateRecipeImageReferences([{ ...recipes[0], heroImageId: "missing-hero" }], [])).toContainEqual({
      recipeId: recipes[0].id,
      field: "heroImageId",
      message: "不存在的 hero image ID: missing-hero",
    });
  });
});
