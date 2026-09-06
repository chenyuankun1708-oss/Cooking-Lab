import type { CulinaryItem, Source } from "@/types/culinary";
import type { Ingredient, Unit } from "@/types/ingredient";
import type { SupportedLocale } from "@/types/localization";
import type { Nutrition } from "@/types/nutrition";
import type { Recipe } from "@/types/recipe";
import type { ResearchRecord } from "@/types/research";
import { getLocalizedCulinaryCopy } from "@/data/localization/public-culinary";
import { getIngredientLabel } from "@/data/localization/ingredients";
import { describeFlavorProfile } from "./flavor";
import { resolveTranslation } from "./localization";
import { getToolLabel } from "./tool-labels";
import {
  buildEmbeddedStoryModel,
  buildStoryPreview,
  getCulinaryItemHeroImage,
  getCulinaryItemPlaceLabel,
  getCulinaryItemTypeLabel,
  listStoriesForCulinaryItem,
  type EmbeddedStoryModel,
  type StoryExperienceContext,
  type StoryPreview,
} from "./story-experience";
import { calculateCost } from "./cost";
import { calculateNutrition } from "./nutrition";
import type { IngredientRepository } from "./ingredient-repository";
import { listConsumerResearchSources, type CulinaryDetailSource } from "./research-consumer";
import type { ContentRightsRegistry } from "@/types/content-rights";
import { buildConsumerRightsDisclosure, listConsumerRightsSources, type ConsumerRightsDisclosure } from "./content-rights-consumer";

export interface CulinaryDetailStep {
  order: number;
  instruction: string;
  rationale?: string;
  stateCue?: string;
  durationLabel?: string;
}

export type CulinaryDetailPreparation =
  | {
      kind: "procedural";
      label: string;
      totalTimeLabel: string;
      yieldLabel: string;
      tools: string[];
      inputs: Array<{ id: string; name: string; amount: string; optional: boolean; note?: string }>;
      steps: CulinaryDetailStep[];
    }
  | { kind: "guidance"; label: string; estimatedTimeLabel: string; tools: string[]; guidance: string }
  | { kind: "ready"; label: string; guidance: string };

export interface CulinaryDetailModel {
  id: string;
  slug: string;
  name: string;
  description: string;
  itemTypeLabel: string;
  placeLabel?: string;
  flavorLabel: string;
  image: ReturnType<typeof getCulinaryItemHeroImage>;
  fallbackInitial: string;
  preparation: CulinaryDetailPreparation;
  stories: StoryPreview[];
  embeddedStories: EmbeddedStoryModel[];
  nutrition:
    | { status: "available"; basis: "per-serving" | "per-100g" | "per-100ml" | "whole-item"; value: Nutrition }
    | { status: "not-modeled"; reason: "insufficient-data" | "out-of-scope" };
  cost:
    | { status: "available"; currency: "CNY"; whole: number; perServing?: number }
    | { status: "not-modeled" };
  principles: string[];
  sources: CulinaryDetailSource[];
  rights?: ConsumerRightsDisclosure;
}

export interface CulinaryDetailOptions {
  recipe?: Recipe;
  researchRecords?: readonly ResearchRecord[];
  researchSources?: readonly Source[];
  rightsRegistry?: ContentRightsRegistry;
}

const preparationLabels: Readonly<Record<CulinaryItem["preparation"]["kind"], Record<SupportedLocale, string>>> = {
  cooking: { "zh-CN": "烹饪", en: "Cooking" },
  baking: { "zh-CN": "烘焙", en: "Baking" },
  brewing: { "zh-CN": "冲泡", en: "Brewing" },
  extraction: { "zh-CN": "萃取", en: "Extraction" },
  mixing: { "zh-CN": "调制", en: "Mixing" },
  assembly: { "zh-CN": "组合", en: "Assembly" },
  "serving-guidance": { "zh-CN": "服务建议", en: "Serving guidance" },
  "no-consumer-preparation": { "zh-CN": "开启即用", en: "Ready to serve" },
};

const unitLabels: Readonly<Record<Unit | "serving" | "ml" | "piece" | "g", Record<SupportedLocale, string>>> = {
  g: { "zh-CN": "克", en: "g" },
  kg: { "zh-CN": "千克", en: "kg" },
  ml: { "zh-CN": "毫升", en: "ml" },
  piece: { "zh-CN": "个", en: "pc" },
  tbsp: { "zh-CN": "大勺", en: "tbsp" },
  tsp: { "zh-CN": "小勺", en: "tsp" },
  serving: { "zh-CN": "份", en: "servings" },
};

export function buildCulinaryDetailModel(
  item: CulinaryItem,
  ingredients: readonly Ingredient[],
  storyContext: StoryExperienceContext,
  locale: SupportedLocale = "zh-CN",
  options: CulinaryDetailOptions = {},
): CulinaryDetailModel {
  const translated = getLocalizedCulinaryCopy(item.id, locale);
  const recipe = options.recipe;
  const copy = recipe
    ? { name: recipe.name, description: recipe.description }
    : translated ?? resolveTranslation(item.content, locale).value;
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const relatedStories = listStoriesForCulinaryItem(item, storyContext.stories);
  const repository = createRepository(ingredients);
  const image = getCulinaryItemHeroImage(item, storyContext.images);
  const localizedImage = image && locale === "en"
    ? { ...image, alt: `${copy.name}, ready to serve` }
    : image;
  const rights = options.rightsRegistry
    ? buildConsumerRightsDisclosure(item.id, image?.id, item.storyIds, options.rightsRegistry, locale)
    : undefined;
  const researchSources = listConsumerResearchSources(
    item.id,
    options.researchRecords ?? [],
    options.researchSources ?? [],
    locale,
  );
  const rightsSources = rights
    ? listConsumerRightsSources(rights, options.researchSources ?? [], locale)
    : [];
  const sources = [...new Map([...researchSources, ...rightsSources].map((source) => [source.id, source])).values()];
  return {
    id: item.id,
    slug: item.slug,
    name: copy.name,
    description: copy.description,
    itemTypeLabel: getCulinaryItemTypeLabel(item.itemType, locale),
    placeLabel: getCulinaryItemPlaceLabel(item, locale),
    flavorLabel: describeFlavorProfile(item.flavor, locale),
    image: localizedImage,
    fallbackInitial: [...copy.name][0] ?? "食",
    preparation: recipe
      ? buildRecipePreparation(item, recipe, ingredientById, locale)
      : buildPreparation(item, ingredientById, locale, translated),
    stories: relatedStories.map((story) => buildStoryPreview(story, storyContext)),
    embeddedStories: relatedStories.map((story) => buildEmbeddedStoryModel(story, storyContext)),
    nutrition: buildNutrition(item, repository),
    cost: buildCost(item, repository),
    principles: [...(options.recipe?.principles ?? [])],
    sources,
    ...(rights ? { rights } : {}),
  };
}

function buildRecipePreparation(
  item: CulinaryItem,
  recipe: Recipe,
  ingredientById: ReadonlyMap<string, Ingredient>,
  locale: SupportedLocale,
): CulinaryDetailPreparation {
  if (!("inputs" in item.preparation)) {
    throw new Error(`Recipe ${recipe.id} must adapt to a procedural preparation`);
  }
  return {
    kind: "procedural",
    label: preparationLabels[item.preparation.kind][locale],
    totalTimeLabel: `${recipe.cooking.totalTime} ${locale === "zh-CN" ? "分钟" : "min"}`,
    yieldLabel: `${recipe.servings} ${unitLabels.serving[locale]}`,
    tools: recipe.tools.map((tool) => getToolLabel(tool, locale)),
    inputs: recipe.ingredients.map((input) => ({
      id: input.ingredientId,
      name: getIngredientLabel(input.ingredientId, ingredientById.get(input.ingredientId)?.name, locale),
      amount: `${input.amount} ${unitLabels[input.unit][locale]}`,
      optional: input.optional ?? false,
      note: locale === "zh-CN" ? input.note : undefined,
    })),
    steps: recipe.steps.map((step) => ({
      order: step.order,
      instruction: step.instruction,
      rationale: step.why,
      durationLabel: step.duration === undefined
        ? undefined
        : `${step.duration} ${locale === "zh-CN" ? "分钟" : "min"}`,
    })),
  };
}

function buildNutrition(item: CulinaryItem, repository: IngredientRepository): CulinaryDetailModel["nutrition"] {
  if (item.nutrition.applicability === "not-modeled") {
    return { status: "not-modeled", reason: item.nutrition.reason };
  }
  if (item.nutrition.source === "declared-estimate") {
    return { status: "available", basis: item.nutrition.basis, value: item.nutrition.value };
  }
  if (!("inputs" in item.preparation)) return { status: "not-modeled", reason: "insufficient-data" };
  const result = calculateNutrition(item.preparation.inputs, repository);
  if (!result.complete) return { status: "not-modeled", reason: "insufficient-data" };
  if (item.preparation.yield.unit === "serving") {
    const servings = item.preparation.yield.amount;
    return {
      status: "available",
      basis: "per-serving",
      value: scaleNutrition(result.total, 1 / servings),
    };
  }
  return { status: "available", basis: "whole-item", value: result.total };
}

function buildCost(item: CulinaryItem, repository: IngredientRepository): CulinaryDetailModel["cost"] {
  if (item.cost.source === "not-modeled" || !("inputs" in item.preparation)) return { status: "not-modeled" };
  const result = calculateCost(item.preparation.inputs, repository);
  if (!result.complete) return { status: "not-modeled" };
  const perServing = item.preparation.yield.unit === "serving" ? result.estimated / item.preparation.yield.amount : undefined;
  return { status: "available", currency: item.cost.currency, whole: result.estimated, ...(perServing === undefined ? {} : { perServing }) };
}

function scaleNutrition(value: Nutrition, factor: number): Nutrition {
  return {
    calories: value.calories * factor,
    protein: value.protein * factor,
    fat: value.fat * factor,
    saturatedFat: value.saturatedFat * factor,
    carbs: value.carbs * factor,
    sugar: value.sugar * factor,
    addedSugar: value.addedSugar * factor,
    fiber: value.fiber * factor,
    sodium: value.sodium * factor,
  };
}

function createRepository(ingredients: readonly Ingredient[]): IngredientRepository {
  const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return { getById: (id) => byId.get(id), list: () => ingredients };
}

function buildPreparation(item: CulinaryItem, ingredientById: ReadonlyMap<string, Ingredient>, locale: SupportedLocale, translated?: ReturnType<typeof getLocalizedCulinaryCopy>): CulinaryDetailPreparation {
  const preparation = item.preparation;
  if ("inputs" in preparation) {
    return {
      kind: "procedural",
      label: preparationLabels[preparation.kind][locale],
      totalTimeLabel: `${preparation.time.totalMinutes} ${locale === "zh-CN" ? "分钟" : "min"}`,
      yieldLabel: `${preparation.yield.amount} ${unitLabels[preparation.yield.unit][locale]}`,
      tools: preparation.toolIds.map((tool) => getToolLabel(tool, locale)),
      inputs: preparation.inputs.map((input) => ({
        id: input.ingredientId,
        name: getIngredientLabel(input.ingredientId, ingredientById.get(input.ingredientId)?.name, locale),
        amount: `${input.amount} ${unitLabels[input.unit][locale]}`,
        optional: input.optional,
        note: locale === "zh-CN" ? input.note : translated?.inputNotes?.[input.ingredientId],
      })),
      steps: preparation.steps.map((step, index) => {
        const copy = translated?.steps?.[index] ?? resolveTranslation(step.content, locale).value;
        return {
          order: step.order,
          instruction: copy.instruction,
          rationale: copy.rationale,
          stateCue: copy.stateCue,
          durationLabel: step.durationMinutes === undefined ? undefined : `${step.durationMinutes} ${locale === "zh-CN" ? "分钟" : "min"}`,
        };
      }),
    };
  }
  if (preparation.kind === "serving-guidance") {
    return {
      kind: "guidance",
      label: preparationLabels[preparation.kind][locale],
      estimatedTimeLabel: `${preparation.estimatedMinutes} ${locale === "zh-CN" ? "分钟" : "min"}`,
      tools: preparation.toolIds.map((tool) => getToolLabel(tool, locale)),
      guidance: translated?.guidance ?? resolveTranslation(preparation.content, locale).value.guidance,
    };
  }
  return {
    kind: "ready",
    label: preparationLabels[preparation.kind][locale],
    guidance: translated?.guidance ?? resolveTranslation(preparation.content, locale).value.servingNote,
  };
}
