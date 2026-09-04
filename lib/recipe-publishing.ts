import type { Ingredient } from "@/types/ingredient";
import type { RecipeImage } from "@/types/image";
import type { Recipe } from "@/types/recipe";
import { calculateCost } from "./cost";
import { validateImageAssets, validateRecipeImageReferences } from "./image-validation";
import type { IngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";
import { validateRecipes } from "./recipe-validation";

export type RecipePublishingIssueCode =
  | "recipe-schema"
  | "nutrition-incomplete"
  | "cost-incomplete"
  | "hero-missing"
  | "hero-invalid"
  | "hero-asset-missing"
  | "hero-alt"
  | "step-incomplete"
  | "culture-provenance";

export interface RecipePublishingIssue {
  code: RecipePublishingIssueCode;
  field: string;
  message: string;
}

export interface RecipePublishingResult {
  recipeId: string;
  eligible: boolean;
  issues: RecipePublishingIssue[];
}

export interface RecipePublishingContext {
  ingredients: readonly Ingredient[];
  images: readonly RecipeImage[];
  localAssetExists: (src: string) => boolean;
}

export function evaluateRecipePublishingEligibility(
  recipe: Recipe,
  context: RecipePublishingContext,
): RecipePublishingResult {
  const issues: RecipePublishingIssue[] = [];
  const add = (code: RecipePublishingIssueCode, field: string, message: string) => {
    issues.push({ code, field, message });
  };
  const repository = createRepository(context.ingredients);

  for (const issue of validateRecipes([recipe], [...context.ingredients])) {
    add("recipe-schema", issue.field, issue.message);
  }

  const nutrition = calculateNutrition(recipe.ingredients, repository);
  if (!nutrition.complete) add("nutrition-incomplete", "ingredients", "营养估算依赖的数据不完整");

  const cost = calculateCost(recipe.ingredients, repository);
  if (!cost.complete) add("cost-incomplete", "ingredients", "成本估算依赖的数据不完整");

  validateHero(recipe, context, add);
  validateEditorialCompleteness(recipe, add);

  return { recipeId: recipe.id, eligible: issues.length === 0, issues };
}

export function isRecipePubliclyVisible(recipe: Recipe, context: RecipePublishingContext): boolean {
  return recipe.publication?.status === "published" && evaluateRecipePublishingEligibility(recipe, context).eligible;
}

export function getPubliclyVisibleRecipes(
  recipes: readonly Recipe[],
  context: RecipePublishingContext,
): Recipe[] {
  return recipes.filter((recipe) => isRecipePubliclyVisible(recipe, context));
}

export function assertPublishedRecipesEligible(
  recipes: readonly Recipe[],
  context: RecipePublishingContext,
): void {
  const failures = recipes
    .filter((recipe) => recipe.publication?.status === "published")
    .map((recipe) => evaluateRecipePublishingEligibility(recipe, context))
    .filter((result) => !result.eligible);

  if (!failures.length) return;

  const detail = failures
    .map((result) => `${result.recipeId}: ${result.issues.map((issue) => `${issue.code} (${issue.field})`).join(", ")}`)
    .join("; ");
  throw new Error(`Published recipes failed eligibility: ${detail}`);
}

function validateHero(
  recipe: Recipe,
  context: RecipePublishingContext,
  add: (code: RecipePublishingIssueCode, field: string, message: string) => void,
) {
  if (!recipe.heroImageId) {
    add("hero-missing", "heroImageId", "公开菜谱必须引用已审核 hero image");
    return;
  }

  const image = context.images.find((item) => item.id === recipe.heroImageId);
  if (!image) {
    add("hero-invalid", "heroImageId", "Hero image 引用不存在");
    return;
  }

  for (const issue of validateImageAssets([image])) {
    add("hero-invalid", `heroImage.${issue.field}`, issue.message);
  }
  for (const issue of validateRecipeImageReferences([recipe], context.images)) {
    add("hero-invalid", issue.field, issue.message);
  }

  const alt = image.alt.trim();
  if (alt.length < 10 || alt === recipe.name || /^(?:图片|菜品图片|食物图片)$/.test(alt)) {
    add("hero-alt", "heroImage.alt", "Hero image 必须有描述实际画面的 alt");
  }
  if (image.delivery === "local" && !context.localAssetExists(image.src)) {
    add("hero-asset-missing", "heroImage.src", "本地 hero image 文件不存在");
  }
}

function validateEditorialCompleteness(
  recipe: Recipe,
  add: (code: RecipePublishingIssueCode, field: string, message: string) => void,
) {
  for (const [index, step] of recipe.steps.entries()) {
    if ([...step.instruction.trim()].length < 12 || [...step.why.trim()].length < 10) {
      add("step-incomplete", `steps.${index}`, "公开步骤需要完整动作说明和有用的料理原因");
    }
  }

  if (recipe.culture?.originNote || recipe.culture?.traditionalContext) {
    const sources = recipe.culture.sources ?? [];
    const complete = sources.length > 0 && sources.every((source) =>
      source.title.trim() &&
      source.publisher?.trim() &&
      source.url && isHttpsUrl(source.url) &&
      source.accessedAt && isIsoDate(source.accessedAt));
    if (!complete) {
      add("culture-provenance", "culture.sources", "起源或传统语境必须提供标题、发布者、HTTPS URL 与访问日期");
    }
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function createRepository(ingredients: readonly Ingredient[]): IngredientRepository {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return {
    getById: (id) => ingredientById.get(id),
    list: () => ingredients,
  };
}
