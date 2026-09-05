import type { RelatedEntityType, StoryType } from "@/types/culinary";

export const storyTypeLabels: Readonly<Record<StoryType, string>> = {
  origin: "起源线索",
  "historical-development": "历史演进",
  "legend-folklore": "传说与民俗",
  "place-food-culture": "地方饮食",
  "ingredient-agriculture-trade": "食材与流动",
  people: "人物与菜名",
  technique: "制作知识",
  "restaurant-school-movement": "餐厅与流派",
  "award-recognition": "记录与认定",
  "everyday-life-festival": "日常与节日",
};

export const storyEntityLabels: Readonly<Partial<Record<RelatedEntityType, Readonly<Record<string, string>>>>> = {
  person: { "su-shi": "苏轼" },
  place: { "thailand-central-plains": "泰国中部平原" },
  technique: {
    "pressure-extraction": "压力萃取",
    "tea-processing": "制茶与饮茶",
    "koji-fermentation": "米曲酿造",
    "biological-ageing": "生物熟成",
  },
};

export const homepageStoryIds = [
  "dongpo-pork-name-and-attribution",
  "tomyum-kung-documented-practice",
  "espresso-developed-through-stages",
] as const;
