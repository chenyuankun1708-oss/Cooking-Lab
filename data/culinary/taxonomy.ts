import type { TaxonomyNode } from "@/types/taxonomy";

const createRegistry = <const T extends readonly TaxonomyNode[]>(items: T) =>
  Object.freeze(Object.fromEntries(items.map((item) => [item.id, Object.freeze(item)]))) as Readonly<Record<T[number]["id"], T[number]>>;

export const culinaryForms = createRegistry([
  { id: "braised-pork", label: { "zh-CN": "红烧猪肉", en: "Braised pork" } },
  { id: "hot-and-sour-soup", label: { "zh-CN": "酸辣汤", en: "Hot and sour soup" } },
  { id: "salad", label: { "zh-CN": "沙拉", en: "Salad" } },
  { id: "sticky-rice-dessert", label: { "zh-CN": "糯米甜品", en: "Sticky rice dessert" } },
  { id: "layered-dessert", label: { "zh-CN": "分层甜品", en: "Layered dessert" } },
  { id: "fruit-crumble", label: { "zh-CN": "水果酥粒甜品", en: "Fruit crumble" } },
  { id: "green-tea", label: { "zh-CN": "绿茶", en: "Green tea" } },
  { id: "spiced-milk-tea", label: { "zh-CN": "香料奶茶", en: "Spiced milk tea" } },
  { id: "mint-tea", label: { "zh-CN": "薄荷茶", en: "Mint tea" } },
  { id: "smoked-black-tea", label: { "zh-CN": "烟熏红茶", en: "Smoked black tea" } },
  { id: "espresso", label: { "zh-CN": "意式浓缩", en: "Espresso" } },
  { id: "iced-milk-coffee", label: { "zh-CN": "冰奶咖啡", en: "Iced milk coffee" } },
  { id: "agua-fresca", label: { "zh-CN": "鲜味水饮", en: "Agua fresca" } },
  { id: "yogurt-drink", label: { "zh-CN": "酸奶饮品", en: "Yogurt drink" } },
  { id: "fortified-wine", label: { "zh-CN": "加强葡萄酒", en: "Fortified wine" } },
  { id: "sake", label: { "zh-CN": "清酒", en: "Sake" } },
  { id: "custard-dessert", label: { "zh-CN": "奶蛋甜品", en: "Custard dessert" } },
  { id: "sago-dessert", label: { "zh-CN": "西米甜品", en: "Sago dessert" } },
  { id: "pastry", label: { "zh-CN": "酥点", en: "Pastry" } },
  { id: "sweet-soup", label: { "zh-CN": "糖水", en: "Sweet soup" } },
  { id: "powdered-green-tea", label: { "zh-CN": "粉末绿茶", en: "Powdered green tea" } },
  { id: "oolong-tea", label: { "zh-CN": "乌龙茶", en: "Oolong tea" } },
  { id: "black-tea-profile", label: { "zh-CN": "红茶产品档案", en: "Black tea profile" } },
  { id: "pour-over-coffee", label: { "zh-CN": "手冲咖啡", en: "Pour-over coffee" } },
  { id: "milk-espresso", label: { "zh-CN": "奶咖", en: "Milk espresso" } },
  { id: "coffee-profile", label: { "zh-CN": "咖啡产品档案", en: "Coffee profile" } },
  { id: "carbonated-tea-drink", label: { "zh-CN": "茶味碳酸饮品", en: "Carbonated tea drink" } },
  { id: "lemon-cola", label: { "zh-CN": "柠檬可乐", en: "Lemon cola" } },
  { id: "citrus-tea", label: { "zh-CN": "柑橘茶饮", en: "Citrus tea" } },
  { id: "iced-black-tea", label: { "zh-CN": "冰红茶饮", en: "Iced black tea" } },
  { id: "tea-coffee-blend", label: { "zh-CN": "茶咖混合饮", en: "Tea-coffee blend" } },
  { id: "wine-profile", label: { "zh-CN": "葡萄酒产品档案", en: "Wine profile" } },
] as const);

export const servingContexts = createRegistry([
  { id: "breakfast", label: { "zh-CN": "早餐", en: "Breakfast" } },
  { id: "lunch", label: { "zh-CN": "午餐", en: "Lunch" } },
  { id: "dinner", label: { "zh-CN": "晚餐", en: "Dinner" } },
  { id: "afternoon-tea", label: { "zh-CN": "午后茶点", en: "Afternoon tea" } },
  { id: "after-meal", label: { "zh-CN": "餐后", en: "After a meal" } },
  { id: "social-gathering", label: { "zh-CN": "聚会", en: "Social gathering" } },
  { id: "aperitif", label: { "zh-CN": "餐前", en: "Aperitif" } },
] as const);
