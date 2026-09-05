export interface HomeHeroEditorialItem {
  slug: string;
  editorialLine: { "zh-CN": string; en: string };
}

export const homeHeroEditorialItems = [
  { slug: "tomato-scrambled-eggs", editorialLine: { "zh-CN": "酸甜鲜香，十几分钟就能端上桌。", en: "Sweet, tart, and savory, ready for the table in fifteen minutes." } },
  { slug: "japanese-miso-tofu-soup", editorialLine: { "zh-CN": "暖暖一碗，豆腐柔滑，味噌香气刚刚好。", en: "A warming bowl with silky tofu and miso added at just the right moment." } },
  { slug: "korean-bibimbap-home", editorialLine: { "zh-CN": "把肉、蔬菜和热饭拌在一起，颜色和滋味都很足。", en: "Beef, vegetables, and hot rice brought together at the table." } },
  { slug: "french-ratatouille", editorialLine: { "zh-CN": "让番茄和时蔬慢慢炖软，留给晚上多一点香气。", en: "Let tomatoes and summer vegetables soften slowly into the evening." } },
  { slug: "lebanese-hummus-plate", editorialLine: { "zh-CN": "绵密豆香配一点酸意，清爽地打开一顿饭。", en: "Creamy chickpeas and bright lemon make an inviting start to a meal." } },
] as const satisfies readonly HomeHeroEditorialItem[];

export const homeHeroRecipeSlugs = homeHeroEditorialItems.map(({ slug }) => slug);

export const homepageFeaturedRecipeSlugs = [
  "thai-basil-chicken",
  "tomato-scrambled-eggs",
  "french-ratatouille",
  "japanese-miso-tofu-soup",
] as const;
