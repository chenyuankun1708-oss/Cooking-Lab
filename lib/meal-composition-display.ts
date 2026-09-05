import { aromaVocabulary, tasteVocabulary, textureVocabulary } from "@/data/flavor";
import type { MealComposition, MealCompositionResult, PairingCaution, PairingReason } from "@/types/pairing";
import type { SupportedLocale } from "@/types/localization";
import { formatCalories, formatCost, formatMacro, formatSodium, formatTime } from "./formatters";
import { buildCulinaryItemSummary, type CulinaryItemSummary, type StoryExperienceContext } from "./story-experience";
import { getToolLabel } from "./tool-labels";

export interface MealCompositionDisplayItem extends CulinaryItemSummary {
  slotLabel: string;
  isAnchor: boolean;
  pairingReason?: string;
}

export interface MealCompositionDisplay {
  templateId: MealComposition["templateId"];
  templateLabel: string;
  completenessLabel: string;
  items: MealCompositionDisplayItem[];
  reasons: string[];
  cautions: string[];
  preparation: {
    levelLabel: string;
    activeTimeLabel: string;
    elapsedTimeLabel: string;
    parallelLabel?: string;
    toolOverlapLabel?: string;
  };
  nutrition: {
    coverageLabel: string;
    metrics: Array<{ label: string; value: string }>;
  };
  cost: {
    coverageLabel: string;
    valueLabel?: string;
  };
}

export interface MealCompositionPageModel {
  anchor: CulinaryItemSummary;
  primary?: MealCompositionDisplay;
  alternatives: MealCompositionDisplay[];
}

const copy = {
  "zh-CN": {
    templates: { "main-drink": "主餐与饮品", "starter-main-drink": "前菜、主餐与饮品", "main-drink-dessert": "主餐、饮品与甜品", "drink-dessert": "饮品与甜品", "partial-pair": "当前最合适的两项搭配" },
    slots: { starter: "前菜", main: "主餐", drink: "饮品", dessert: "甜品" },
    anchor: "你选定的料理",
    complete: "组成完整", partial: "当前内容库只支持部分组合",
    simple: "准备较轻松", moderate: "需要协调几项准备", involved: "准备负担较高",
    active: (value: string) => `主动操作约 ${value}`,
    elapsed: (value: string) => `协调制作约 ${value}`,
    parallel: (value: string) => `其中约 ${value} 可与必要等待并行`,
    tools: (ids: string) => `共用工具：${ids}`,
    nutritionComplete: "全部项目均有估算", nutritionPartial: "部分项目有估算", nutritionUnavailable: "暂无可汇总估算",
    costComplete: "全部项目均有成本估算", costPartial: "部分项目有成本估算", costUnavailable: "暂无可汇总成本",
    labels: { calories: "能量", protein: "蛋白质", fat: "脂肪", carbs: "碳水", fiber: "膳食纤维", sodium: "钠" },
  },
  en: {
    templates: { "main-drink": "Main and drink", "starter-main-drink": "Starter, main, and drink", "main-drink-dessert": "Main, drink, and dessert", "drink-dessert": "Drink and dessert", "partial-pair": "Best available two-item pairing" },
    slots: { starter: "Starter", main: "Main", drink: "Drink", dessert: "Dessert" },
    anchor: "Your anchor",
    complete: "Complete composition", partial: "The current library supports a partial composition",
    simple: "Light preparation", moderate: "A few preparations to coordinate", involved: "More involved preparation",
    active: (value: string) => `About ${value} active`,
    elapsed: (value: string) => `About ${value} elapsed when coordinated`,
    parallel: (value: string) => `About ${value} can overlap necessary waiting`,
    tools: (ids: string) => `Shared tools: ${ids}`,
    nutritionComplete: "All items included in the estimate", nutritionPartial: "Partial estimate", nutritionUnavailable: "No comparable estimate available",
    costComplete: "All items included in the cost estimate", costPartial: "Partial cost estimate", costUnavailable: "No comparable cost estimate available",
    labels: { calories: "Energy", protein: "Protein", fat: "Fat", carbs: "Carbs", fiber: "Fiber", sodium: "Sodium" },
  },
} as const;

export function buildMealCompositionPageModel(
  result: MealCompositionResult,
  context: StoryExperienceContext,
  locale: SupportedLocale,
): MealCompositionPageModel {
  return {
    anchor: buildCulinaryItemSummary(result.anchor, context),
    primary: result.primary ? buildMealDisplay(result.primary, context, locale) : undefined,
    alternatives: result.alternatives.map((meal) => buildMealDisplay(meal, context, locale)),
  };
}

export function describePairingReason(reason: PairingReason, locale: SupportedLocale): string {
  if (reason.kind === "flavor-complement") {
    const messages = {
      "acid-richness": { "zh-CN": "明亮酸味或清爽感，为浓郁料理提供轻快对比。", en: "Bright acidity or freshness gives richer food a lighter counterpoint." },
      "cooling-spicy": { "zh-CN": "清凉或绵滑的部分，能接住辛辣感而不盖住香气。", en: "A cool or creamy element meets the heat without muting its aroma." },
      "sweet-bitter": { "zh-CN": "甜味与微苦、烘烤香彼此牵制，让收尾不只剩甜。", en: "Sweetness meets bitterness and roast, keeping the finish from feeling one-note." },
      "fresh-umami": { "zh-CN": "清鲜脆爽与鲜味形成对照，让整餐更有起伏。", en: "A fresh, crisp element gives savory depth a clearer contrast." },
    } as const;
    return messages[reason.complementId][locale];
  }
  if (reason.kind === "flavor-continuity") {
    const labels = reason.ids.map((id) => getFlavorLabel(id, reason.dimension, locale)).join(locale === "zh-CN" ? "、" : ", ");
    return locale === "zh-CN" ? `共享的${labels}让两项之间有连续线索。` : `Shared ${labels.toLowerCase()} creates continuity between the items.`;
  }
  if (reason.kind === "weight-balance") return locale === "zh-CN" ? "轻重有别，能避免整餐持续堆叠同一种负担。" : "Different weights keep the meal from building in one heavy direction.";
  if (reason.kind === "texture-contrast") return locale === "zh-CN" ? "口感形成对比，让相邻两项更容易分辨。" : "Contrasting textures keep each part of the meal distinct.";
  if (reason.kind === "temperature-relationship") return locale === "zh-CN" ? "冷热关系为整餐增加了清楚的节奏。" : "The temperature relationship gives the meal a clearer rhythm.";
  if (reason.kind === "cuisine-coherence") return locale === "zh-CN" ? "菜系或地域线索相连，组合显得自然。" : "A shared cuisine or place signal gives the pairing natural coherence.";
  if (reason.kind === "serving-context") return locale === "zh-CN" ? "两项适合在相近的用餐场景出现。" : "Both items fit a similar serving occasion.";
  return locale === "zh-CN" ? "它们承担不同餐桌角色，放在一起不会互相替代。" : "The items fill distinct roles rather than duplicating one another.";
}

export function describePairingCaution(caution: PairingCaution, locale: SupportedLocale): string {
  if (caution.kind === "shared-richness") return locale === "zh-CN" ? "两项都偏浓郁，份量可以更克制。" : "Both items are rich, so smaller portions may suit the composition better.";
  if (caution.kind === "repeated-texture") return locale === "zh-CN" ? "口感有一定重复，整餐层次会更集中。" : "Some texture repeats, so the meal will feel more concentrated.";
  if (caution.kind === "serving-context-mismatch") return locale === "zh-CN" ? "它们没有明显共享的日常用餐场景，需要按实际餐次判断。" : "They do not share a clear everyday serving context, so occasion matters.";
  if (caution.kind === "limited-flavor-connection") return locale === "zh-CN" ? "风味连接较弱，主要依靠餐桌角色形成组合。" : "The flavor connection is limited; the pairing relies more on meal roles.";
  return locale === "zh-CN" ? "这是中性的酒精饮品选项；完整一餐不依赖酒精，也不包含健康或饮用量建议。" : "This is a neutral alcoholic option. The meal does not require alcohol and makes no health or consumption claim.";
}

function buildMealDisplay(meal: MealComposition, context: StoryExperienceContext, locale: SupportedLocale): MealCompositionDisplay {
  const c = copy[locale];
  const anchorPairings = new Map(meal.pairings.flatMap((pairing) => {
    if (pairing.anchor.id === meal.anchorId) return [[pairing.candidate.id, pairing] as const];
    if (pairing.candidate.id === meal.anchorId) return [[pairing.anchor.id, pairing] as const];
    return [];
  }));
  const nutritionMetrics = meal.nutrition.value ? [
    { label: c.labels.calories, value: formatCalories(meal.nutrition.value.calories, true, locale) },
    { label: c.labels.protein, value: formatMacro(meal.nutrition.value.protein, true, locale) },
    { label: c.labels.fat, value: formatMacro(meal.nutrition.value.fat, true, locale) },
    { label: c.labels.carbs, value: formatMacro(meal.nutrition.value.carbs, true, locale) },
    { label: c.labels.fiber, value: formatMacro(meal.nutrition.value.fiber, true, locale) },
    { label: c.labels.sodium, value: formatSodium(meal.nutrition.value.sodium, true, locale) },
  ] : [];
  return {
    templateId: meal.templateId,
    templateLabel: c.templates[meal.templateId],
    completenessLabel: meal.completeness === "complete" ? c.complete : c.partial,
    items: meal.items.map(({ item, slotId }) => {
      const pairing = anchorPairings.get(item.id);
      return {
        ...buildCulinaryItemSummary(item, context),
        slotLabel: item.id === meal.anchorId ? c.anchor : c.slots[slotId],
        isAnchor: item.id === meal.anchorId,
        pairingReason: pairing?.reasons[0] ? describePairingReason(pairing.reasons[0], locale) : undefined,
      };
    }),
    reasons: meal.reasons.slice(0, 4).map((reason) => describePairingReason(reason, locale)),
    cautions: meal.cautions.map((caution) => describePairingCaution(caution, locale)),
    preparation: {
      levelLabel: c[meal.preparation.level],
      activeTimeLabel: c.active(formatTime(meal.preparation.activeMinutes, locale)),
      elapsedTimeLabel: c.elapsed(formatTime(meal.preparation.estimatedElapsedMinutes, locale)),
      parallelLabel: meal.preparation.parallelizableMinutes ? c.parallel(formatTime(meal.preparation.parallelizableMinutes, locale)) : undefined,
      toolOverlapLabel: meal.preparation.overlappingToolIds.length
        ? c.tools(meal.preparation.overlappingToolIds.map((id) => getToolLabel(id, locale)).join(locale === "zh-CN" ? "、" : ", "))
        : undefined,
    },
    nutrition: {
      coverageLabel: meal.nutrition.coverage === "complete" ? c.nutritionComplete : meal.nutrition.coverage === "partial" ? c.nutritionPartial : c.nutritionUnavailable,
      metrics: nutritionMetrics,
    },
    cost: {
      coverageLabel: meal.cost.coverage === "complete" ? c.costComplete : meal.cost.coverage === "partial" ? c.costPartial : c.costUnavailable,
      valueLabel: meal.cost.value === undefined ? undefined : formatCost(meal.cost.value, true, locale),
    },
  };
}

function getFlavorLabel(id: string, dimension: "taste" | "aroma", locale: SupportedLocale): string {
  const node = dimension === "taste"
    ? tasteVocabulary[id as keyof typeof tasteVocabulary]
    : aromaVocabulary[id as keyof typeof aromaVocabulary] ?? textureVocabulary[id as keyof typeof textureVocabulary];
  return node?.label[locale] ?? id;
}
