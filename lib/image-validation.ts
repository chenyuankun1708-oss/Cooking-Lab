import type { RecipeImage } from "@/types/image";
import { recipeImageLicenses, recipeImageRoles, recipeImageSources } from "@/types/image";
import type { Recipe } from "@/types/recipe";
import { isPositiveFinite, isSlug } from "./validation-utils";

export interface ImageValidationIssue {
  imageId: string;
  field: string;
  message: string;
}

export interface RecipeImageReferenceIssue {
  recipeId: string;
  field: string;
  message: string;
}

const roles = new Set<string>(recipeImageRoles);
const sources = new Set<string>(recipeImageSources);
const licenses = new Set<string>(recipeImageLicenses);
const aspectRatios = new Set(["3:2", "4:3", "16:9", "1:1"]);
const licensesRequiringAttribution = new Set(["cc-by", "cc-by-sa"]);
const restrictedLicenses = new Set(["cc-by-nc", "cc-by-nd", "cc-by-nc-sa", "cc-by-nc-nd", "unknown", "prohibited"]);
const localRecipeImagePath = /^\/images\/recipes\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:hero(?:-[2-9][0-9]*)?|thumbnail(?:-[2-9][0-9]*)?|step-[0-9]{2}|ingredient-[a-z0-9]+(?:-[a-z0-9]+)*|editorial-[a-z0-9]+(?:-[a-z0-9]+)*)\.(?:webp|avif)$/;

export function validateImageAssets(images: readonly RecipeImage[]): ImageValidationIssue[] {
  const issues: ImageValidationIssue[] = [];
  const ids = new Set<string>();
  const report = (imageId: string, field: string, message: string) => issues.push({ imageId, field, message });

  for (const image of images) {
    const imageId = image.id || "<unknown>";
    if (!isSlug(image.id)) report(imageId, "id", "Image ID 必须使用 kebab-case");
    if (ids.has(image.id)) report(imageId, "id", "Image ID 重复");
    ids.add(image.id);

    if (!roles.has(image.role)) report(imageId, "role", "Image role 不在当前 schema 中");
    if (!sources.has(image.source)) report(imageId, "source", "Image source 不在当前 schema 中");
    if (!licenses.has(image.license)) report(imageId, "license", "Image license 不在当前 schema 中");
    if (!aspectRatios.has(image.aspectRatio)) report(imageId, "aspectRatio", "Image aspectRatio 不在当前 schema 中");
    if (restrictedLicenses.has(image.license)) {
      report(imageId, "license", "非商业、禁止改编、未知或禁止授权的图片不能进入可用 registry");
    }
    if (image.role === "hero" && !image.alt.trim()) report(imageId, "alt", "Hero image alt 不能为空");

    if (image.delivery === "local") {
      if (!localRecipeImagePath.test(image.src)) report(imageId, "src", "本地图片路径必须符合 recipe asset naming convention");
    } else if (image.delivery === "remote") {
      if (!isHttpsUrl(image.src)) report(imageId, "src", "远程图片必须使用有效 HTTPS URL");
    } else {
      report(imageId, "delivery", "Image delivery 不在当前 schema 中");
    }

    if ((image.width === undefined) !== (image.height === undefined)) {
      report(imageId, "dimensions", "width 与 height 必须同时提供或同时省略");
    }
    if (image.width !== undefined && !isPositiveFinite(image.width)) report(imageId, "width", "width 必须是正有限数");
    if (image.height !== undefined && !isPositiveFinite(image.height)) report(imageId, "height", "height 必须是正有限数");
    if (image.focalPoint && (!isUnitInterval(image.focalPoint.x) || !isUnitInterval(image.focalPoint.y))) {
      report(imageId, "focalPoint", "focalPoint x/y 必须在 0 到 1 之间");
    }

    if (licensesRequiringAttribution.has(image.license)) {
      if (!image.author?.trim()) report(imageId, "author", `${image.license} 必须记录作者`);
      if (!image.attribution?.trim()) report(imageId, "attribution", `${image.license} 必须提供 attribution`);
      if (!image.licenseUrl || !isHttpsUrl(image.licenseUrl)) report(imageId, "licenseUrl", `${image.license} 必须提供有效 license URL`);
    }
    if (!["self-created", "ai-generated"].includes(image.source) && (!image.sourceUrl || !isHttpsUrl(image.sourceUrl))) {
      report(imageId, "sourceUrl", "外部来源图片必须提供有效 source URL");
    }
    if (image.source === "ai-generated") {
      if (!image.ai?.generator.trim() || !image.ai.promptVersion.trim() || !isIsoDate(image.ai.createdAt)) {
        report(imageId, "ai", "AI-generated 图片必须记录 generator、promptVersion 与 ISO createdAt");
      }
    } else if (image.ai !== undefined) {
      report(imageId, "ai", "只有 AI-generated 图片可以包含 AI provenance");
    }
  }

  return issues;
}

export function validateRecipeImageReferences(
  recipes: readonly Recipe[],
  images: readonly RecipeImage[],
): RecipeImageReferenceIssue[] {
  const issues: RecipeImageReferenceIssue[] = [];
  const imageById = new Map(images.map((image) => [image.id, image]));

  for (const recipe of recipes) {
    if (!recipe.heroImageId) continue;
    const image = imageById.get(recipe.heroImageId);
    if (!image) {
      issues.push({ recipeId: recipe.id, field: "heroImageId", message: `不存在的 hero image ID: ${recipe.heroImageId}` });
      continue;
    }
    if (image.role !== "hero") {
      issues.push({ recipeId: recipe.id, field: "heroImageId", message: "heroImageId 必须引用 hero role 图片" });
    }
    if (image.delivery === "local" && !image.src.startsWith(`/images/recipes/${recipe.slug}/`)) {
      issues.push({ recipeId: recipe.id, field: "heroImageId", message: "本地 hero image 路径必须与 recipe slug 对齐" });
    }
  }

  return issues;
}

const isUnitInterval = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}
