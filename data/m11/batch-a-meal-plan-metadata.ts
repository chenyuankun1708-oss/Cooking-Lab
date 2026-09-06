import type { MealPlanStepMetadataRegistry } from "@/lib/meal-plan";

// Batch A durations are authored for the plan engine rather than inferred from prose.
// Every procedural step is explicit so a content edit cannot silently change the timeline.
export const m11BatchAMealPlanStepMetadata = Object.freeze({
  "lemon-chicken-breast": {
    1: { kind: "active", durationMinutes: 5 }, 2: { kind: "active", durationMinutes: 5 },
    3: { kind: "active", durationMinutes: 7 }, 4: { kind: "active", durationMinutes: 8 },
  },
  "broccoli-chicken": {
    1: { kind: "active", durationMinutes: 10 }, 2: { kind: "active", durationMinutes: 3 },
    3: { kind: "active", durationMinutes: 5 }, 4: { kind: "active", durationMinutes: 7 },
  },
  "mushroom-tofu-rice": {
    1: { kind: "active", durationMinutes: 6 }, 2: { kind: "active", durationMinutes: 8 },
    3: { kind: "active", durationMinutes: 6 }, 4: { kind: "active", durationMinutes: 8 },
  },
  "pan-seared-chicken-thigh": {
    1: { kind: "active", durationMinutes: 4 }, 2: { kind: "active", durationMinutes: 6 },
    3: { kind: "active", durationMinutes: 6 }, 4: { kind: "active", durationMinutes: 6 },
  },
  "pepper-beef-stir-fry": {
    1: { kind: "active", durationMinutes: 8 }, 2: { kind: "active", durationMinutes: 4 },
    3: { kind: "active", durationMinutes: 4 }, 4: { kind: "active", durationMinutes: 7 },
  },
  "tomato-beef-stew": {
    1: { kind: "active", durationMinutes: 12 }, 2: { kind: "active", durationMinutes: 12 },
    3: { kind: "active", durationMinutes: 10 },
    4: { kind: "wait", durationMinutes: 75, resourceIds: ["heavy-pot"] },
  },
  "potato-beef-stew": {
    1: { kind: "active", durationMinutes: 12 }, 2: { kind: "active", durationMinutes: 15 },
    3: { kind: "wait", durationMinutes: 55, resourceIds: ["heavy-pot"] },
    4: { kind: "wait", durationMinutes: 30, resourceIds: ["heavy-pot"] },
  },
  "shrimp-scrambled-eggs": {
    1: { kind: "active", durationMinutes: 4 }, 2: { kind: "active", durationMinutes: 3 },
    3: { kind: "active", durationMinutes: 4 }, 4: { kind: "active", durationMinutes: 4 },
  },
  "steamed-salmon": {
    1: { kind: "active", durationMinutes: 4 },
    2: { kind: "wait", durationMinutes: 10, resourceIds: ["steamer", "heatproof-plate"] },
    3: { kind: "active", durationMinutes: 2 }, 4: { kind: "active", durationMinutes: 2 },
  },
  "roasted-salmon": {
    1: { kind: "active", durationMinutes: 6 }, 2: { kind: "active", durationMinutes: 2 },
    3: { kind: "wait", durationMinutes: 10, resourceIds: ["oven", "baking-tray"] },
    4: { kind: "wait", durationMinutes: 2, resourceIds: [] },
  },
  "steamed-egg": {
    1: { kind: "active", durationMinutes: 4 }, 2: { kind: "active", durationMinutes: 2 },
    3: { kind: "wait", durationMinutes: 12, resourceIds: ["steamer", "heatproof-bowl"] },
    4: { kind: "active", durationMinutes: 2 },
  },
  "pan-fried-tofu": {
    1: { kind: "active", durationMinutes: 8 }, 2: { kind: "active", durationMinutes: 5 },
    3: { kind: "active", durationMinutes: 6 }, 4: { kind: "active", durationMinutes: 3 },
  },
  "cold-shredded-chicken": {
    1: { kind: "active", durationMinutes: 10 },
    2: { kind: "wait", durationMinutes: 12, resourceIds: ["saucepan"] },
    3: { kind: "prepare-ahead", durationMinutes: 30, resourceIds: ["refrigerator"] },
    4: { kind: "active", durationMinutes: 5 },
  },
  "roasted-vegetables": {
    1: { kind: "active", durationMinutes: 10 }, 2: { kind: "active", durationMinutes: 4 },
    3: { kind: "wait", durationMinutes: 25, resourceIds: ["oven", "baking-tray"] },
    4: { kind: "wait", durationMinutes: 2, resourceIds: [] },
  },
  "tomato-egg-soup": {
    1: { kind: "active", durationMinutes: 5 }, 2: { kind: "active", durationMinutes: 5 },
    3: { kind: "active", durationMinutes: 7 }, 4: { kind: "active", durationMinutes: 3 },
  },
  "rice-cooker-chicken-rice": {
    1: { kind: "active", durationMinutes: 10 }, 2: { kind: "active", durationMinutes: 4 },
    3: { kind: "wait", durationMinutes: 33, resourceIds: ["rice-cooker"] },
    4: { kind: "active", durationMinutes: 3 },
  },
  "japanese-beef-potato-simmer": {
    1: { kind: "active", durationMinutes: 10 }, 2: { kind: "active", durationMinutes: 5 },
    3: { kind: "wait", durationMinutes: 18, resourceIds: ["saucepan"] },
    4: { kind: "wait", durationMinutes: 12, resourceIds: ["saucepan"] },
  },
  "korean-kimchi-fried-rice": {
    1: { kind: "active", durationMinutes: 8 }, 2: { kind: "active", durationMinutes: 3 },
    3: { kind: "active", durationMinutes: 5 }, 4: { kind: "active", durationMinutes: 2 },
  },
  "vietnamese-lemongrass-chicken": {
    1: { kind: "active", durationMinutes: 15 },
    2: { kind: "prepare-ahead", durationMinutes: 15, resourceIds: [] },
    3: { kind: "active", durationMinutes: 5 }, 4: { kind: "active", durationMinutes: 7 },
  },
  "mexican-chicken-fajitas": {
    1: { kind: "active", durationMinutes: 13 }, 2: { kind: "active", durationMinutes: 5 },
    3: { kind: "active", durationMinutes: 5 }, 4: { kind: "active", durationMinutes: 4 },
  },
  "double-skin-milk": {
    1: { kind: "active", durationMinutes: 8 }, 2: { kind: "active", durationMinutes: 7 },
    3: { kind: "wait", durationMinutes: 20, resourceIds: ["steamer"] },
    4: { kind: "prepare-ahead", durationMinutes: 15, resourceIds: ["refrigerator"] },
  },
  "mango-pomelo-sago": {
    1: { kind: "active", durationMinutes: 20 }, 2: { kind: "active", durationMinutes: 10 },
    3: { kind: "prepare-ahead", durationMinutes: 25, resourceIds: ["refrigerator"] },
  },
  "hong-kong-egg-tart": {
    1: { kind: "active", durationMinutes: 30 }, 2: { kind: "active", durationMinutes: 10 },
    3: { kind: "wait", durationMinutes: 25, resourceIds: ["oven", "tart-tin"] },
  },
  "black-sesame-soup": {
    1: { kind: "active", durationMinutes: 5 }, 2: { kind: "active", durationMinutes: 10 },
    3: { kind: "active", durationMinutes: 15 },
  },
  "matcha-usucha": {
    1: { kind: "active", durationMinutes: 3 }, 2: { kind: "active", durationMinutes: 3 },
  },
  "tieguanyin-gongfu": {
    1: { kind: "active", durationMinutes: 3 }, 2: { kind: "active", durationMinutes: 8 },
  },
  "v60-pour-over": {
    1: { kind: "active", durationMinutes: 3 }, 2: { kind: "active", durationMinutes: 5 },
  },
  "flat-white": {
    1: { kind: "active", durationMinutes: 4 }, 2: { kind: "active", durationMinutes: 4 },
  },
  "cha-chaan-teng-lemon-coke": {
    1: { kind: "active", durationMinutes: 4 }, 2: { kind: "active", durationMinutes: 3 },
  },
  "kumquat-lemon-tea": {
    1: { kind: "active", durationMinutes: 5 }, 2: { kind: "active", durationMinutes: 12 },
    3: { kind: "active", durationMinutes: 3 },
  },
  "hong-kong-iced-lemon-tea": {
    1: { kind: "active", durationMinutes: 6 }, 2: { kind: "active", durationMinutes: 10 },
  },
  yuenyeung: {
    1: { kind: "active", durationMinutes: 8 }, 2: { kind: "active", durationMinutes: 7 },
  },
} as const satisfies MealPlanStepMetadataRegistry);
