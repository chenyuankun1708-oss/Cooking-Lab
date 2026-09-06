import type { CulinaryItemType } from "@/types/culinary";

export const m11PortfolioTarget: Readonly<Record<CulinaryItemType, number>> = Object.freeze({
  dish: 57,
  dessert: 15,
  tea: 16,
  coffee: 12,
  "non-alcoholic-drink": 14,
  "alcoholic-drink": 6,
});

export const m11BatchAItemIds = Object.freeze([
  "lemon-chicken-breast", "broccoli-chicken", "mushroom-tofu-rice", "pan-seared-chicken-thigh",
  "pepper-beef-stir-fry", "tomato-beef-stew", "potato-beef-stew", "shrimp-scrambled-eggs",
  "steamed-salmon", "roasted-salmon", "steamed-egg", "pan-fried-tofu",
  "cold-shredded-chicken", "roasted-vegetables", "tomato-egg-soup", "rice-cooker-chicken-rice",
  "japanese-beef-potato-simmer", "korean-kimchi-fried-rice", "vietnamese-lemongrass-chicken", "mexican-chicken-fajitas",
  "double-skin-milk", "mango-pomelo-sago", "hong-kong-egg-tart", "black-sesame-soup",
  "matcha-usucha", "tieguanyin-gongfu", "darjeeling-first-flush-profile",
  "v60-pour-over", "flat-white", "ethiopia-yirgacheffe-washed-profile",
  "cha-chaan-teng-lemon-coke", "kumquat-lemon-tea", "hong-kong-iced-lemon-tea", "yuenyeung",
  "rioja-reserva-profile",
] as const);

export const m11BatchBItemIds = Object.freeze([
  "coconut-tapioca-pudding", "japanese-purin", "basque-cheesecake", "lemon-posset",
  "gulab-jamun", "pastel-de-nata", "tres-leches-cake", "pear-almond-tart",
  "sencha-standard-brew", "taiwan-high-mountain-oolong", "jasmine-green-tea", "genmaicha",
  "cold-brew-tea", "assam-second-flush-profile", "uji-gyokuro-profile", "wuyi-rock-tea-profile",
  "ceylon-uva-black-tea-profile", "moka-pot", "aeropress-standard", "french-press",
  "cold-brew-coffee", "kenya-aa-washed-profile", "colombia-huila-washed-profile", "panama-geisha-washed-profile",
  "hong-kong-red-bean-ice", "salted-lime-soda", "thai-iced-tea", "vietnamese-lime-soda",
  "indian-nimbu-pani", "barley-water", "tamarind-agua-fresca", "sparkling-plum-drink",
  "chianti-classico-riserva-profile", "mosel-riesling-kabinett-profile", "barossa-shiraz-profile",
] as const);

export const m11RequiredItemIds = Object.freeze([
  "cha-chaan-teng-lemon-coke",
  "double-skin-milk",
  "mango-pomelo-sago",
  "kumquat-lemon-tea",
] as const);

export const m11ProductProfileItemIds = Object.freeze([
  "darjeeling-first-flush-profile", "assam-second-flush-profile", "uji-gyokuro-profile", "wuyi-rock-tea-profile",
  "ethiopia-yirgacheffe-washed-profile", "kenya-aa-washed-profile", "colombia-huila-washed-profile", "panama-geisha-washed-profile",
  "rioja-reserva-profile", "chianti-classico-riserva-profile", "mosel-riesling-kabinett-profile", "barossa-shiraz-profile",
] as const);

export const m11RestaurantReconstructionItemIds = Object.freeze([
  "lemon-chicken-breast", "broccoli-chicken", "pepper-beef-stir-fry", "shrimp-scrambled-eggs",
  "pan-fried-tofu", "cold-shredded-chicken", "vietnamese-lemongrass-chicken", "mexican-chicken-fajitas",
] as const);
