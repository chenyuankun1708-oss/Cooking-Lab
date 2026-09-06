import type { MealPlanStepMetadataRegistry } from "@/lib/meal-plan";

// These authored overrides describe attention at the current step granularity. Use wait or
// prepare-ahead only when the step is predominantly hands-off; mixed steps with simultaneous
// chopping, stirring, or other active work keep the engine's active default.
export const mealPlanStepMetadata = Object.freeze({
  "cantonese-mushroom-steamed-chicken": {
    1: { kind: "prepare-ahead", resourceIds: [] },
    3: { kind: "wait", resourceIds: ["steamer", "heatproof-plate"] },
    4: { kind: "wait", resourceIds: [] },
  },
  "cantonese-ginger-scallion-fish": {
    2: { kind: "wait", resourceIds: ["steamer"] },
    3: { kind: "wait", resourceIds: ["steamer", "heatproof-plate"] },
  },
  "home-mapo-tofu": {
    4: { kind: "wait", resourceIds: ["frying-pan"] },
  },
  "sichuan-smashed-cucumber": {
    2: { kind: "wait", resourceIds: [] },
    4: { kind: "serve", resourceIds: [] },
  },
  "yunnan-mushroom-chicken-stew": {
    3: { kind: "wait", resourceIds: ["saucepan"] },
    4: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "chaoshan-fish-congee": {
    2: { kind: "wait", resourceIds: ["saucepan"] },
    3: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "french-ratatouille": {
    4: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "french-lentil-soup": {
    4: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "italian-tomato-basil-pasta": {
    2: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "spanish-potato-omelet": {
    2: { kind: "wait", resourceIds: ["frying-pan"] },
  },
  "greek-lemon-oregano-chicken": {
    4: { kind: "wait", resourceIds: [] },
  },
  "japanese-oyakodon": {
    3: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "japanese-miso-salmon": {
    1: { kind: "prepare-ahead", resourceIds: [] },
  },
  "japanese-miso-tofu-soup": {
    2: { kind: "wait", resourceIds: ["saucepan"] },
    3: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "korean-bibimbap-home": {
    6: { kind: "serve", resourceIds: [] },
  },
  "korean-tofu-stew-home": {
    3: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "thai-green-papaya-salad": {
    4: { kind: "serve", resourceIds: [] },
  },
  "vietnamese-beef-noodle-soup-home": {
    4: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "singapore-chicken-rice-home": {
    3: { kind: "wait", resourceIds: ["rice-cooker"] },
    4: { kind: "serve", resourceIds: [] },
  },
  "indonesian-chili-eggplant": {
    4: { kind: "wait", resourceIds: ["frying-pan"] },
  },
  "filipino-chicken-adobo-home": {
    3: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "mexican-black-bean-tacos": {
    4: { kind: "serve", resourceIds: [] },
  },
  "huevos-rancheros-home": {
    4: { kind: "serve", resourceIds: [] },
  },
  "indian-chana-masala-home": {
    4: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "indian-masoor-dal": {
    4: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "lebanese-hummus-plate": {
    4: { kind: "serve", resourceIds: [] },
  },
  "lebanese-mujadara": {
    4: { kind: "wait", resourceIds: ["saucepan"] },
  },
  "dongpo-pork": {
    4: { kind: "wait", resourceIds: ["heavy-pot"] },
  },
  "tomyum-kung": {
    2: { kind: "wait", resourceIds: ["soup-pot"] },
    4: { kind: "serve", resourceIds: [] },
  },
  "greek-village-salad": {
    2: { kind: "wait", resourceIds: ["mixing-bowl"] },
    3: { kind: "serve", resourceIds: [] },
  },
  "mango-sticky-rice": {
    1: { kind: "prepare-ahead", resourceIds: ["mixing-bowl"] },
    2: { kind: "wait", resourceIds: ["steamer"] },
    4: { kind: "wait", resourceIds: [] },
    5: { kind: "serve", resourceIds: [] },
  },
  tiramisu: {
    5: { kind: "prepare-ahead", resourceIds: ["refrigerator"] },
  },
  "apple-crumble": {
    3: { kind: "wait", resourceIds: ["oven", "baking-dish"] },
    4: { kind: "wait", resourceIds: [] },
  },
  "longjing-green-tea": {
    3: { kind: "wait", resourceIds: ["gaiwan"] },
  },
  "masala-chai": {
    1: { kind: "wait", resourceIds: ["small-saucepan"] },
    3: { kind: "wait", resourceIds: ["small-saucepan"] },
  },
  "moroccan-mint-tea": {
    2: { kind: "wait", resourceIds: ["teapot"] },
    3: { kind: "serve", resourceIds: [] },
  },
  "lapsang-souchong": {
    2: { kind: "wait", resourceIds: ["teapot"] },
    3: { kind: "serve", resourceIds: [] },
  },
  "vietnamese-iced-coffee": {
    3: { kind: "wait", resourceIds: ["phin-filter"] },
    4: { kind: "serve", resourceIds: [] },
  },
  "hibiscus-agua-fresca": {
    1: { kind: "wait", resourceIds: ["saucepan"] },
    3: { kind: "prepare-ahead", resourceIds: ["refrigerator"] },
    4: { kind: "serve", resourceIds: [] },
  },
  "salted-lassi": {
    3: { kind: "serve", resourceIds: [] },
  },
} as const satisfies MealPlanStepMetadataRegistry);
