import type { CulinaryItem } from "@/types/culinary";
import type { Ingredient, Unit } from "@/types/ingredient";
import type { SupportedLocale } from "@/types/localization";
import { getLocalizedCulinaryCopy } from "@/data/localization/public-culinary";
import { getIngredientLabel } from "@/data/localization/ingredients";
import { describeFlavorProfile } from "./flavor";
import { resolveTranslation } from "./localization";
import { getToolLabel } from "./tool-labels";
import {
  buildStoryPreview,
  getCulinaryItemHeroImage,
  getCulinaryItemPlaceLabel,
  getCulinaryItemTypeLabel,
  type StoryExperienceContext,
  type StoryPreview,
} from "./story-experience";

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
): CulinaryDetailModel {
  const translated = getLocalizedCulinaryCopy(item.id, locale);
  const copy = translated ?? resolveTranslation(item.content, locale).value;
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const storyById = new Map(storyContext.stories.map((story) => [story.id, story]));
  return {
    id: item.id,
    slug: item.slug,
    name: copy.name,
    description: copy.description,
    itemTypeLabel: getCulinaryItemTypeLabel(item.itemType, locale),
    placeLabel: getCulinaryItemPlaceLabel(item, locale),
    flavorLabel: describeFlavorProfile(item.flavor, locale),
    image: getCulinaryItemHeroImage(item, storyContext.images),
    fallbackInitial: [...copy.name][0] ?? "食",
    preparation: buildPreparation(item, ingredientById, locale, translated),
    stories: item.storyIds.flatMap((storyId) => {
      const story = storyById.get(storyId);
      return story ? [buildStoryPreview(story, storyContext)] : [];
    }),
  };
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
