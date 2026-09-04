import type { SupportedLocale, TaxonomyNode } from "@/types/taxonomy";

type Registry = Readonly<Record<string, TaxonomyNode>>;

const createRegistry = <const T extends readonly TaxonomyNode[]>(items: T): Registry =>
  Object.freeze(Object.fromEntries(items.map((item) => [item.id, item])));

export const countries = createRegistry([
  { id: "china", label: { "zh-CN": "中国", en: "China" } },
  { id: "spain", label: { "zh-CN": "西班牙", en: "Spain" } },
  { id: "thailand", label: { "zh-CN": "泰国", en: "Thailand" } },
] as const);

export const regions = createRegistry([
  { id: "guangdong", parentId: "china", label: { "zh-CN": "广东", en: "Guangdong" } },
  { id: "valencia", parentId: "spain", label: { "zh-CN": "瓦伦西亚", en: "Valencia" } },
  { id: "northern-thailand", parentId: "thailand", label: { "zh-CN": "泰国北部", en: "Northern Thailand" } },
] as const);

export const cuisines = createRegistry([
  { id: "chinese", label: { "zh-CN": "中式", en: "Chinese" } },
  { id: "western", label: { "zh-CN": "西式", en: "Western" } },
  { id: "fusion", label: { "zh-CN": "融合", en: "Fusion" } },
  { id: "cantonese", label: { "zh-CN": "粤菜", en: "Cantonese" } },
  { id: "spanish", label: { "zh-CN": "西班牙料理", en: "Spanish" } },
  { id: "thai", label: { "zh-CN": "泰式", en: "Thai" } },
] as const);

export const subCuisines = createRegistry([
  { id: "guangfu", parentId: "cantonese", label: { "zh-CN": "广府菜", en: "Guangfu" } },
  { id: "valencian", parentId: "spanish", label: { "zh-CN": "瓦伦西亚风味", en: "Valencian" } },
  { id: "northern-thai", parentId: "thai", label: { "zh-CN": "泰北风味", en: "Northern Thai" } },
] as const);

export const techniques = createRegistry([
  { id: "pan-fry", label: { "zh-CN": "煎", en: "Pan fry" } },
  { id: "stir-fry", label: { "zh-CN": "炒", en: "Stir fry" } },
  { id: "steam", label: { "zh-CN": "蒸", en: "Steam" } },
  { id: "boil", label: { "zh-CN": "煮", en: "Boil" } },
  { id: "simmer", label: { "zh-CN": "小火炖煮", en: "Simmer" } },
  { id: "stew", label: { "zh-CN": "炖", en: "Stew" } },
  { id: "braise", label: { "zh-CN": "焖", en: "Braise" } },
  { id: "roast", label: { "zh-CN": "烤", en: "Roast" } },
  { id: "dress", label: { "zh-CN": "凉拌", en: "Dress" } },
  { id: "rice-cook", label: { "zh-CN": "煮饭焖熟", en: "Rice cook" } },
] as const);

export const dishTypes = createRegistry([
  { id: "main-dish", label: { "zh-CN": "主菜", en: "Main dish" } },
  { id: "staple", label: { "zh-CN": "主食", en: "Staple" } },
  { id: "soup", label: { "zh-CN": "汤", en: "Soup" } },
  { id: "cold-dish", label: { "zh-CN": "凉菜", en: "Cold dish" } },
  { id: "side-dish", label: { "zh-CN": "配菜", en: "Side dish" } },
] as const);

export const mealOccasions = createRegistry([
  { id: "breakfast", label: { "zh-CN": "早餐", en: "Breakfast" } },
  { id: "lunch", label: { "zh-CN": "午餐", en: "Lunch" } },
  { id: "dinner", label: { "zh-CN": "晚餐", en: "Dinner" } },
] as const);

export const tasteProfiles = createRegistry([
  { id: "savory", label: { "zh-CN": "咸鲜", en: "Savory" } },
  { id: "umami", label: { "zh-CN": "鲜味", en: "Umami" } },
  { id: "tangy", label: { "zh-CN": "微酸", en: "Tangy" } },
  { id: "sweet", label: { "zh-CN": "自然甜味", en: "Naturally sweet" } },
] as const);

export const flavorCharacteristics = createRegistry([
  { id: "fresh", label: { "zh-CN": "清新", en: "Fresh" } },
  { id: "light", label: { "zh-CN": "清爽", en: "Light" } },
  { id: "comforting", label: { "zh-CN": "安慰感", en: "Comforting" } },
  { id: "saucy", label: { "zh-CN": "带汁", en: "Saucy" } },
  { id: "hearty", label: { "zh-CN": "扎实饱腹", en: "Hearty" } },
  { id: "brothy", label: { "zh-CN": "汤汁感", en: "Brothy" } },
  { id: "crisp", label: { "zh-CN": "脆爽", en: "Crisp" } },
  { id: "tender", label: { "zh-CN": "嫩", en: "Tender" } },
] as const);

export const dietaryTags = createRegistry([
  { id: "vegan", label: { "zh-CN": "纯素", en: "Vegan" } },
  { id: "vegetarian", label: { "zh-CN": "蛋奶素", en: "Vegetarian" } },
] as const);

export const browseTags = createRegistry([
  { id: "quick", label: { "zh-CN": "快手", en: "Quick" } },
  { id: "one-pot", label: { "zh-CN": "一锅完成", en: "One pot" } },
  { id: "vegetable-rich", label: { "zh-CN": "蔬菜丰富", en: "Vegetable rich" } },
] as const);

export const taxonomyCollections = Object.freeze({
  countries,
  regions,
  cuisines,
  subCuisines,
  techniques,
  dishTypes,
  mealOccasions,
  tasteProfiles,
  flavorCharacteristics,
  dietaryTags,
  browseTags,
});

export type TaxonomyCollectionName = keyof typeof taxonomyCollections;

export function getTaxonomyNode(collection: TaxonomyCollectionName, id: string): TaxonomyNode | undefined {
  return taxonomyCollections[collection][id];
}

export function getTaxonomyLabel(
  collection: TaxonomyCollectionName,
  id: string | undefined,
  locale: SupportedLocale = "zh-CN",
): string | undefined {
  if (!id) return undefined;
  return getTaxonomyNode(collection, id)?.label[locale] ?? id;
}
