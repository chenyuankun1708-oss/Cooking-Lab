import type { CulinaryItem } from "@/types/culinary";
import type { Ingredient, Unit } from "@/types/ingredient";
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

const preparationLabels: Readonly<Record<CulinaryItem["preparation"]["kind"], string>> = {
  cooking: "烹饪",
  baking: "烘焙",
  brewing: "冲泡",
  extraction: "萃取",
  mixing: "调制",
  assembly: "组合",
  "serving-guidance": "服务建议",
  "no-consumer-preparation": "开启即用",
};

const unitLabels: Readonly<Record<Unit | "serving" | "ml" | "piece" | "g", string>> = {
  g: "克",
  kg: "千克",
  ml: "毫升",
  piece: "个",
  tbsp: "大勺",
  tsp: "小勺",
  serving: "份",
};

export function buildCulinaryDetailModel(
  item: CulinaryItem,
  ingredients: readonly Ingredient[],
  storyContext: StoryExperienceContext,
): CulinaryDetailModel {
  const copy = resolveTranslation(item.content, "zh-CN").value;
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const storyById = new Map(storyContext.stories.map((story) => [story.id, story]));
  return {
    id: item.id,
    slug: item.slug,
    name: copy.name,
    description: copy.description,
    itemTypeLabel: getCulinaryItemTypeLabel(item.itemType),
    placeLabel: getCulinaryItemPlaceLabel(item),
    flavorLabel: describeFlavorProfile(item.flavor),
    image: getCulinaryItemHeroImage(item, storyContext.images),
    fallbackInitial: [...copy.name][0] ?? "食",
    preparation: buildPreparation(item, ingredientById),
    stories: item.storyIds.flatMap((storyId) => {
      const story = storyById.get(storyId);
      return story ? [buildStoryPreview(story, storyContext)] : [];
    }),
  };
}

function buildPreparation(item: CulinaryItem, ingredientById: ReadonlyMap<string, Ingredient>): CulinaryDetailPreparation {
  const preparation = item.preparation;
  if ("inputs" in preparation) {
    return {
      kind: "procedural",
      label: preparationLabels[preparation.kind],
      totalTimeLabel: `${preparation.time.totalMinutes} 分钟`,
      yieldLabel: `${preparation.yield.amount} ${unitLabels[preparation.yield.unit]}`,
      tools: preparation.toolIds.map(getToolLabel),
      inputs: preparation.inputs.map((input) => ({
        id: input.ingredientId,
        name: ingredientById.get(input.ingredientId)?.name ?? input.ingredientId,
        amount: `${input.amount} ${unitLabels[input.unit]}`,
        optional: input.optional,
        note: input.note,
      })),
      steps: preparation.steps.map((step) => {
        const copy = resolveTranslation(step.content, "zh-CN").value;
        return {
          order: step.order,
          instruction: copy.instruction,
          rationale: copy.rationale,
          stateCue: copy.stateCue,
          durationLabel: step.durationMinutes === undefined ? undefined : `${step.durationMinutes} 分钟`,
        };
      }),
    };
  }
  if (preparation.kind === "serving-guidance") {
    return {
      kind: "guidance",
      label: preparationLabels[preparation.kind],
      estimatedTimeLabel: `${preparation.estimatedMinutes} 分钟`,
      tools: preparation.toolIds.map(getToolLabel),
      guidance: resolveTranslation(preparation.content, "zh-CN").value.guidance,
    };
  }
  return {
    kind: "ready",
    label: preparationLabels[preparation.kind],
    guidance: resolveTranslation(preparation.content, "zh-CN").value.servingNote,
  };
}
