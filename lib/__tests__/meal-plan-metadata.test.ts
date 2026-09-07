import { describe, expect, it } from "vitest";
import { mealPlanStepMetadata } from "@/data/meal-plan-metadata";
import { m11BatchAMealPlanStepMetadata } from "@/data/m11/batch-a-meal-plan-metadata";
import { getPublishedCulinaryItems } from "@/data/published-culinary-items";
import { buildMealPlan, type MealPlanStepMetadataRegistry } from "@/lib/meal-plan";

const reviewedNonActiveSteps = [
  "apple-crumble:3", "apple-crumble:4",
  "cantonese-ginger-scallion-fish:2", "cantonese-ginger-scallion-fish:3",
  "cantonese-mushroom-steamed-chicken:1", "cantonese-mushroom-steamed-chicken:3", "cantonese-mushroom-steamed-chicken:4",
  "chaoshan-fish-congee:2", "chaoshan-fish-congee:3",
  "dongpo-pork:4",
  "filipino-chicken-adobo-home:3",
  "french-lentil-soup:4",
  "french-ratatouille:4",
  "greek-lemon-oregano-chicken:4",
  "greek-village-salad:2", "greek-village-salad:3",
  "hibiscus-agua-fresca:1", "hibiscus-agua-fresca:3", "hibiscus-agua-fresca:4",
  "home-mapo-tofu:4",
  "huevos-rancheros-home:4",
  "indian-chana-masala-home:4",
  "indian-masoor-dal:4",
  "indonesian-chili-eggplant:4",
  "italian-tomato-basil-pasta:2",
  "japanese-miso-salmon:1",
  "japanese-miso-tofu-soup:2", "japanese-miso-tofu-soup:3",
  "japanese-oyakodon:3",
  "korean-bibimbap-home:6",
  "korean-tofu-stew-home:3",
  "lapsang-souchong:2", "lapsang-souchong:3",
  "lebanese-hummus-plate:4",
  "lebanese-mujadara:4",
  "longjing-green-tea:3",
  "mango-sticky-rice:1", "mango-sticky-rice:2", "mango-sticky-rice:4", "mango-sticky-rice:5",
  "masala-chai:1", "masala-chai:3",
  "mexican-black-bean-tacos:4",
  "moroccan-mint-tea:2", "moroccan-mint-tea:3",
  "salted-lassi:3",
  "sichuan-smashed-cucumber:2", "sichuan-smashed-cucumber:4",
  "singapore-chicken-rice-home:3", "singapore-chicken-rice-home:4",
  "spanish-potato-omelet:2",
  "thai-green-papaya-salad:4",
  "tiramisu:5",
  "tomyum-kung:2", "tomyum-kung:4",
  "vietnamese-beef-noodle-soup-home:4",
  "vietnamese-iced-coffee:3", "vietnamese-iced-coffee:4",
  "yunnan-mushroom-chicken-stew:3", "yunnan-mushroom-chicken-stew:4",
] as const;

const m11BatchAAuditedSteps = Object.entries(m11BatchAMealPlanStepMetadata)
  .flatMap(([itemId, steps]) => Object.keys(steps).map((order) => `${itemId}:${order}`));
const auditedStepMetadata = [...reviewedNonActiveSteps, ...m11BatchAAuditedSteps];

describe("published meal-plan task metadata", () => {
  it("keeps all audited step metadata explicit and connected to published steps", () => {
    const registry: MealPlanStepMetadataRegistry = mealPlanStepMetadata;
    const publishedItems = getPublishedCulinaryItems();
    const proceduralById = new Map(publishedItems
      .filter((item) => "steps" in item.preparation)
      .map((item) => [item.id, item]));
    const actual = Object.entries(mealPlanStepMetadata)
      .flatMap(([itemId, steps]) => Object.keys(steps).map((order) => `${itemId}:${order}`))
      .sort();

    expect(actual).toEqual([...auditedStepMetadata].sort());
    for (const stepId of auditedStepMetadata) {
      const separator = stepId.lastIndexOf(":");
      const itemId = stepId.slice(0, separator);
      const order = Number(stepId.slice(separator + 1));
      const item = proceduralById.get(itemId);
      expect(item, `${itemId} must remain a published procedural item`).toBeDefined();
      if (!item || !("steps" in item.preparation)) continue;
      expect(item.preparation.steps.some((step) => step.order === order), `${stepId} must identify a real step`).toBe(true);
    }
    for (const stepId of reviewedNonActiveSteps) {
      const separator = stepId.lastIndexOf(":");
      const itemId = stepId.slice(0, separator);
      const order = Number(stepId.slice(separator + 1));
      expect(registry[itemId]?.[order]?.kind).not.toBe("active");
    }
  });

  it("labels every published preparation with canonical passive elapsed time", () => {
    const itemsWithPassiveElapsedTime = getPublishedCulinaryItems().filter((item) => (
      "steps" in item.preparation && item.preparation.time.totalMinutes > item.preparation.time.activeMinutes
    ));

    for (const item of itemsWithPassiveElapsedTime) {
      const kinds = Object.values(mealPlanStepMetadata[item.id as keyof typeof mealPlanStepMetadata] ?? {}).map((entry) => entry.kind);
      expect(kinds, `${item.id} needs authored passive or advance-prep metadata`).toEqual(
        expect.arrayContaining([expect.stringMatching(/^(wait|prepare-ahead)$/)]),
      );
    }
  });

  it("applies authored task kinds and preserves automatic service tasks for finished items", () => {
    const registry: MealPlanStepMetadataRegistry = mealPlanStepMetadata;
    const publishedItems = getPublishedCulinaryItems();

    for (const stepId of auditedStepMetadata) {
      const separator = stepId.lastIndexOf(":");
      const itemId = stepId.slice(0, separator);
      const order = Number(stepId.slice(separator + 1));
      const item = publishedItems.find((entry) => entry.id === itemId)!;
      const plan = buildMealPlan([item], [{ itemId, servings: 1 }], { stepMetadata: mealPlanStepMetadata });
      expect(plan.timeline.find((task) => task.id === `${itemId}:step:${order}`)?.kind).toBe(
        registry[itemId]?.[order]?.kind,
      );
    }
    for (const item of publishedItems.filter((entry) => !("steps" in entry.preparation))) {
      const plan = buildMealPlan([item], [{ itemId: item.id, servings: 1 }], { stepMetadata: mealPlanStepMetadata });
      expect(plan.timeline.find((task) => task.id === `${item.id}:serve`)?.kind).toBe("serve");
    }
  });
});
