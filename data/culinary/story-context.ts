import type { RelatedEntityType, StoryType } from "@/types/culinary";
import type { LocalizedLabel } from "@/types/localization";

export const storyTypeLabels: Readonly<Record<StoryType, LocalizedLabel>> = {
  origin: { "zh-CN": "起源线索", en: "Origin evidence" },
  "historical-development": { "zh-CN": "历史演进", en: "Historical development" },
  "legend-folklore": { "zh-CN": "传说与民俗", en: "Legend and folklore" },
  "place-food-culture": { "zh-CN": "地方饮食", en: "Place and food culture" },
  "ingredient-agriculture-trade": { "zh-CN": "食材与流动", en: "Ingredients and exchange" },
  people: { "zh-CN": "人物与菜名", en: "People and names" },
  technique: { "zh-CN": "制作知识", en: "Making knowledge" },
  "restaurant-school-movement": { "zh-CN": "餐厅与流派", en: "Restaurants and movements" },
  "award-recognition": { "zh-CN": "记录与认定", en: "Recognition" },
  "everyday-life-festival": { "zh-CN": "日常与节日", en: "Everyday life and festivals" },
};

export const storyEntityLabels: Readonly<Partial<Record<RelatedEntityType, Readonly<Record<string, LocalizedLabel>>>>> = {
  person: { "su-shi": { "zh-CN": "苏轼", en: "Su Shi" } },
  place: { "thailand-central-plains": { "zh-CN": "泰国中部平原", en: "Thailand's Central Plains" } },
  technique: {
    "pressure-extraction": { "zh-CN": "压力萃取", en: "Pressure extraction" },
    "tea-processing": { "zh-CN": "制茶与饮茶", en: "Tea making and drinking" },
    "koji-fermentation": { "zh-CN": "米曲酿造", en: "Koji fermentation" },
    "biological-ageing": { "zh-CN": "生物熟成", en: "Biological ageing" },
  },
};

export const homepageStoryIds = [
  "dongpo-pork-name-and-attribution",
  "tomyum-kung-documented-practice",
  "espresso-developed-through-stages",
] as const;
