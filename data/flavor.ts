import type {
  AromaId,
  FlavorCharacterId,
  FlavorPreferenceDefinition,
  FlavorVocabularyNode,
  TasteId,
  TextureId,
} from "@/types/flavor";

function registry<TId extends string>(items: readonly FlavorVocabularyNode<TId>[]) {
  return Object.freeze(Object.fromEntries(items.map((item) => [item.id, Object.freeze(item)]))) as Readonly<Record<TId, FlavorVocabularyNode<TId>>>;
}

export const tasteVocabulary = registry<TasteId>([
  { id: "salty", category: "taste", label: { "zh-CN": "咸香", en: "Salty" }, description: { "zh-CN": "盐与咸味调料带来的味觉强度", en: "Perceived saltiness from salt and seasoning" } },
  { id: "sweet", category: "taste", label: { "zh-CN": "清甜", en: "Sweet" }, description: { "zh-CN": "食材天然甜味或添加糖带来的甜感", en: "Sweetness from ingredients or added sugar" } },
  { id: "sour", category: "taste", label: { "zh-CN": "酸香", en: "Sour" }, description: { "zh-CN": "醋、柑橘、番茄等带来的酸味", en: "Acidity from vinegar, citrus, tomato, and similar ingredients" } },
  { id: "bitter", category: "taste", label: { "zh-CN": "微苦", en: "Bitter" }, description: { "zh-CN": "可被感知且具有区分度的苦味", en: "A noticeable, distinguishing bitter note" } },
  { id: "umami", category: "taste", label: { "zh-CN": "鲜味", en: "Umami" }, description: { "zh-CN": "肉类、菌菇、发酵调料等带来的鲜味", en: "Savoriness from meat, mushrooms, fermented seasoning, and similar ingredients" } },
  { id: "spicy", category: "taste", label: { "zh-CN": "辣味", en: "Spicy" }, description: { "zh-CN": "辣椒与辛辣调料带来的刺激感", en: "Heat from chili and pungent seasoning" } },
]);

export const aromaVocabulary = registry<AromaId>([
  { id: "garlicky", category: "aroma", label: { "zh-CN": "蒜香", en: "Garlicky" }, description: { "zh-CN": "以蒜的香气为明显线索", en: "Noticeably led by garlic" } },
  { id: "herbal", category: "aroma", label: { "zh-CN": "香草香", en: "Herbal" }, description: { "zh-CN": "新鲜或干燥香草带来的香气", en: "Aroma from fresh or dried herbs" } },
  { id: "peppery", category: "aroma", label: { "zh-CN": "椒香", en: "Peppery" }, description: { "zh-CN": "胡椒或鲜椒带来的香气", en: "Aromatic pepper or chili notes" } },
  { id: "smoky", category: "aroma", label: { "zh-CN": "烟熏香", en: "Smoky" }, description: { "zh-CN": "烟熏食材或做法形成的明确烟熏气息", en: "A clear smoky note from ingredients or technique" } },
  { id: "roasted", category: "aroma", label: { "zh-CN": "焦香", en: "Roasted" }, description: { "zh-CN": "煎、烤或褐变形成的焦香", en: "Browning aroma from searing or roasting" } },
  { id: "toasty", category: "aroma", label: { "zh-CN": "烘香", en: "Toasty" }, description: { "zh-CN": "谷物、面饼或坚果般的烘烤香气", en: "Toasty grain, bread, or nut-like aroma" } },
  { id: "tomato-rich", category: "aroma", label: { "zh-CN": "番茄浓香", en: "Tomato-rich" }, description: { "zh-CN": "熟番茄收浓后的明显香气", en: "Concentrated cooked-tomato aroma" } },
  { id: "gingery", category: "aroma", label: { "zh-CN": "姜香", en: "Gingery" }, description: { "zh-CN": "姜作为主要芳香线索", en: "Ginger as a leading aromatic note" } },
  { id: "citrusy", category: "aroma", label: { "zh-CN": "柑橘香", en: "Citrusy" }, description: { "zh-CN": "柠檬、青柠等带来的明亮香气", en: "Bright aroma from lemon, lime, or similar citrus" } },
  { id: "fermented", category: "aroma", label: { "zh-CN": "发酵香", en: "Fermented" }, description: { "zh-CN": "味噌、泡菜、豆瓣酱等发酵调料的香气", en: "Aroma from miso, kimchi, bean paste, and similar ferments" } },
  { id: "spiced", category: "aroma", label: { "zh-CN": "辛香", en: "Spiced" }, description: { "zh-CN": "孜然、姜黄、综合香料等形成的复合香气", en: "Layered aroma from cumin, turmeric, spice blends, and similar seasonings" } },
  { id: "fruity", category: "aroma", label: { "zh-CN": "果香", en: "Fruity" }, description: { "zh-CN": "水果、果皮或发酵形成的清晰果香", en: "A clear fruit note from fruit, peel, or fermentation" } },
  { id: "floral", category: "aroma", label: { "zh-CN": "花香", en: "Floral" }, description: { "zh-CN": "茶、香料或花朵带来的轻柔花香", en: "A gentle floral note from tea, spices, or flowers" } },
]);

export const textureVocabulary = registry<TextureId>([
  { id: "crisp", category: "texture", label: { "zh-CN": "脆爽", en: "Crisp" }, description: { "zh-CN": "蔬菜或表层保留清晰脆感", en: "A clearly crisp vegetable or surface texture" } },
  { id: "tender", category: "texture", label: { "zh-CN": "软嫩", en: "Tender" }, description: { "zh-CN": "蛋白质或蔬菜易咬且不过熟", en: "Easy-biting texture without overcooking" } },
  { id: "juicy", category: "texture", label: { "zh-CN": "多汁", en: "Juicy" }, description: { "zh-CN": "肉类或食材内部保留明显汁水", en: "Noticeable moisture retained inside the food" } },
  { id: "silky", category: "texture", label: { "zh-CN": "细滑", en: "Silky" }, description: { "zh-CN": "蛋羹、豆腐或酱体的细滑口感", en: "A smooth custard, tofu, or sauce texture" } },
  { id: "creamy", category: "texture", label: { "zh-CN": "绵密", en: "Creamy" }, description: { "zh-CN": "泥、糊或乳化酱的绵密口感", en: "A dense, creamy puree or emulsified texture" } },
  { id: "chewy", category: "texture", label: { "zh-CN": "有嚼劲", en: "Chewy" }, description: { "zh-CN": "面、粉或谷物保留适度咀嚼感", en: "Pleasant resistance in noodles, grains, or similar foods" } },
  { id: "soft", category: "texture", label: { "zh-CN": "软糯", en: "Soft" }, description: { "zh-CN": "炖煮食材或主食形成柔软口感", en: "Soft texture from cooked vegetables, legumes, or grains" } },
  { id: "brothy", category: "texture", label: { "zh-CN": "汤润", en: "Brothy" }, description: { "zh-CN": "以清汤或汤汁入口感为主", en: "A broth-led eating texture" } },
  { id: "saucy", category: "texture", label: { "zh-CN": "裹汁", en: "Saucy" }, description: { "zh-CN": "酱汁明显包裹食材或主食", en: "Food clearly coated in sauce" } },
]);

export const flavorCharacterVocabulary = registry<FlavorCharacterId>([
  { id: "light", category: "character", label: { "zh-CN": "轻盈", en: "Light" }, description: { "zh-CN": "整体味道和入口负担较轻", en: "A lighter overall eating experience" } },
  { id: "refreshing", category: "character", label: { "zh-CN": "清爽", en: "Refreshing" }, description: { "zh-CN": "酸香、脆感或新鲜香草形成清爽感", en: "Refreshing from acidity, crispness, or fresh herbs" } },
  { id: "comforting", category: "character", label: { "zh-CN": "家常舒服", en: "Comforting" }, description: { "zh-CN": "温和、熟悉且适合日常的一餐", en: "Familiar, gentle, everyday comfort" } },
  { id: "warming", category: "character", label: { "zh-CN": "暖乎乎", en: "Warming" }, description: { "zh-CN": "热汤、炖煮或辛香带来的温暖感", en: "Warmth from broth, braising, or spices" } },
  { id: "hearty", category: "character", label: { "zh-CN": "满足", en: "Hearty" }, description: { "zh-CN": "饱满、扎实，适合作为完整一餐", en: "Substantial enough to feel like a full meal" } },
  { id: "appetizing", category: "character", label: { "zh-CN": "开胃", en: "Appetizing" }, description: { "zh-CN": "酸、辣或香气使食欲更容易被带起", en: "Acidity, heat, or aroma that feels appetite-opening" } },
  { id: "rice-friendly", category: "character", label: { "zh-CN": "下饭", en: "Rice-friendly" }, description: { "zh-CN": "味道和汁水适合搭配米饭", en: "Flavor and sauce that pair especially well with rice" } },
  { id: "clean-tasting", category: "character", label: { "zh-CN": "清鲜", en: "Clean-tasting" }, description: { "zh-CN": "调味克制，突出食材本味和鲜味", en: "Restrained seasoning that keeps ingredients clear" } },
]);

export const flavorPreferences: readonly FlavorPreferenceDefinition[] = Object.freeze([
  { id: "light", label: { "zh-CN": "清淡", en: "Light" }, tasteTargets: { salty: { ideal: 1, tolerance: 2 }, spicy: { ideal: 0, tolerance: 1 } }, characterIds: ["light", "clean-tasting"] },
  { id: "fresh-spicy", label: { "zh-CN": "鲜辣", en: "Fresh and spicy" }, tasteTargets: { spicy: { ideal: 3, tolerance: 2 }, umami: { ideal: 2, tolerance: 3 } }, aromaIds: ["peppery", "fermented"], characterIds: ["appetizing", "rice-friendly"] },
  { id: "tangy-refreshing", label: { "zh-CN": "酸爽", en: "Tangy and refreshing" }, tasteTargets: { sour: { ideal: 3, tolerance: 2 } }, characterIds: ["refreshing", "appetizing"] },
  { id: "rich", label: { "zh-CN": "浓郁", en: "Rich" }, tasteTargets: { umami: { ideal: 3, tolerance: 2 } }, aromaIds: ["tomato-rich", "fermented", "spiced"], characterIds: ["hearty", "rice-friendly"] },
  { id: "roasted", label: { "zh-CN": "焦香", en: "Roasted" }, aromaIds: ["roasted", "toasty", "smoky"] },
  { id: "warming", label: { "zh-CN": "暖乎乎", en: "Warming" }, aromaIds: ["gingery", "spiced"], characterIds: ["warming", "comforting"] },
]);
