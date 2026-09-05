export interface HomeHeroEditorialItem {
  slug: string;
  editorialLine: string;
}

export const homeHeroEditorialItems = [
  { slug: "tomato-scrambled-eggs", editorialLine: "酸甜鲜香，十几分钟就能端上桌。" },
  { slug: "japanese-miso-tofu-soup", editorialLine: "暖暖一碗，豆腐柔滑，味噌香气刚刚好。" },
  { slug: "korean-bibimbap-home", editorialLine: "把肉、蔬菜和热饭拌在一起，颜色和滋味都很足。" },
  { slug: "french-ratatouille", editorialLine: "让番茄和时蔬慢慢炖软，留给晚上多一点香气。" },
  { slug: "lebanese-hummus-plate", editorialLine: "绵密豆香配一点酸意，清爽地打开一顿饭。" },
] as const satisfies readonly HomeHeroEditorialItem[];

export const homeHeroRecipeSlugs = homeHeroEditorialItems.map(({ slug }) => slug);

export const homepageFeaturedRecipeSlugs = [
  "thai-basil-chicken",
  "tomato-scrambled-eggs",
  "french-ratatouille",
  "japanese-miso-tofu-soup",
] as const;
