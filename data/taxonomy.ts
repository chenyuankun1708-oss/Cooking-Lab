import type { SupportedLocale, TaxonomyNode } from "@/types/taxonomy";

type Registry = Readonly<Record<string, TaxonomyNode>>;

const createRegistry = <const T extends readonly TaxonomyNode[]>(items: T): Registry =>
  Object.freeze(Object.fromEntries(items.map((item) => [item.id, item])));

export const countries = createRegistry([
  { id: "china", label: { "zh-CN": "中国", en: "China" } },
  { id: "france", label: { "zh-CN": "法国", en: "France" } },
  { id: "greece", label: { "zh-CN": "希腊", en: "Greece" } },
  { id: "india", label: { "zh-CN": "印度", en: "India" } },
  { id: "indonesia", label: { "zh-CN": "印度尼西亚", en: "Indonesia" } },
  { id: "italy", label: { "zh-CN": "意大利", en: "Italy" } },
  { id: "japan", label: { "zh-CN": "日本", en: "Japan" } },
  { id: "lebanon", label: { "zh-CN": "黎巴嫩", en: "Lebanon" } },
  { id: "malaysia", label: { "zh-CN": "马来西亚", en: "Malaysia" } },
  { id: "mexico", label: { "zh-CN": "墨西哥", en: "Mexico" } },
  { id: "peru", label: { "zh-CN": "秘鲁", en: "Peru" } },
  { id: "philippines", label: { "zh-CN": "菲律宾", en: "Philippines" } },
  { id: "portugal", label: { "zh-CN": "葡萄牙", en: "Portugal" } },
  { id: "singapore", label: { "zh-CN": "新加坡", en: "Singapore" } },
  { id: "south-korea", label: { "zh-CN": "韩国", en: "South Korea" } },
  { id: "spain", label: { "zh-CN": "西班牙", en: "Spain" } },
  { id: "thailand", label: { "zh-CN": "泰国", en: "Thailand" } },
  { id: "united-states", label: { "zh-CN": "美国", en: "United States" } },
  { id: "vietnam", label: { "zh-CN": "越南", en: "Vietnam" } },
] as const);

export const regions = createRegistry([
  { id: "guangdong", parentId: "china", label: { "zh-CN": "广东", en: "Guangdong" } },
  { id: "chaoshan", parentId: "china", label: { "zh-CN": "潮汕", en: "Chaoshan" } },
  { id: "northeast-china", parentId: "china", label: { "zh-CN": "中国东北", en: "Northeast China" } },
  { id: "northwest-china", parentId: "china", label: { "zh-CN": "中国西北", en: "Northwest China" } },
  { id: "sichuan", parentId: "china", label: { "zh-CN": "四川", en: "Sichuan" } },
  { id: "hunan", parentId: "china", label: { "zh-CN": "湖南", en: "Hunan" } },
  { id: "yunnan", parentId: "china", label: { "zh-CN": "云南", en: "Yunnan" } },
  { id: "valencia", parentId: "spain", label: { "zh-CN": "瓦伦西亚", en: "Valencia" } },
  { id: "northern-thailand", parentId: "thailand", label: { "zh-CN": "泰国北部", en: "Northern Thailand" } },
] as const);

export const cuisines = createRegistry([
  { id: "chinese", label: { "zh-CN": "中式", en: "Chinese" } },
  { id: "western", label: { "zh-CN": "西式", en: "Western" } },
  { id: "fusion", label: { "zh-CN": "融合", en: "Fusion" } },
  { id: "cantonese", label: { "zh-CN": "粤菜", en: "Cantonese" } },
  { id: "chaoshan", label: { "zh-CN": "潮汕菜", en: "Chaoshan" } },
  { id: "french", label: { "zh-CN": "法国料理", en: "French" } },
  { id: "greek", label: { "zh-CN": "希腊料理", en: "Greek" } },
  { id: "hunan", label: { "zh-CN": "湘菜", en: "Hunan" } },
  { id: "indian", label: { "zh-CN": "印度料理", en: "Indian" } },
  { id: "indonesian", label: { "zh-CN": "印度尼西亚料理", en: "Indonesian" } },
  { id: "italian", label: { "zh-CN": "意大利料理", en: "Italian" } },
  { id: "japanese", label: { "zh-CN": "日本料理", en: "Japanese" } },
  { id: "korean", label: { "zh-CN": "韩国料理", en: "Korean" } },
  { id: "lebanese", label: { "zh-CN": "黎巴嫩料理", en: "Lebanese" } },
  { id: "malaysian", label: { "zh-CN": "马来西亚料理", en: "Malaysian" } },
  { id: "mexican", label: { "zh-CN": "墨西哥料理", en: "Mexican" } },
  { id: "northeastern-chinese", label: { "zh-CN": "东北菜", en: "Northeastern Chinese" } },
  { id: "northwestern-chinese", label: { "zh-CN": "西北风味", en: "Northwestern Chinese" } },
  { id: "peruvian", label: { "zh-CN": "秘鲁料理", en: "Peruvian" } },
  { id: "filipino", label: { "zh-CN": "菲律宾料理", en: "Filipino" } },
  { id: "portuguese", label: { "zh-CN": "葡萄牙料理", en: "Portuguese" } },
  { id: "sichuan", label: { "zh-CN": "川菜", en: "Sichuan" } },
  { id: "singaporean", label: { "zh-CN": "新加坡料理", en: "Singaporean" } },
  { id: "spanish", label: { "zh-CN": "西班牙料理", en: "Spanish" } },
  { id: "thai", label: { "zh-CN": "泰式", en: "Thai" } },
  { id: "vietnamese", label: { "zh-CN": "越南料理", en: "Vietnamese" } },
  { id: "yunnan", label: { "zh-CN": "云南菜", en: "Yunnan" } },
  { id: "american", label: { "zh-CN": "美国料理", en: "American" } },
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
  { id: "sear", label: { "zh-CN": "高温煎封", en: "Sear" } },
  { id: "bake", label: { "zh-CN": "烘烤", en: "Bake" } },
  { id: "blanch", label: { "zh-CN": "焯烫", en: "Blanch" } },
  { id: "poach", label: { "zh-CN": "汆煮", en: "Poach" } },
  { id: "grill", label: { "zh-CN": "烤煎", en: "Grill" } },
  { id: "cold-mix", label: { "zh-CN": "冷拌", en: "Cold mix" } },
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
