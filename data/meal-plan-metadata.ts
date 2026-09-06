import type { MealPlanStepMetadataRegistry } from "@/lib/meal-plan";

export const mealPlanStepMetadata = Object.freeze({
  "mango-sticky-rice": {
    1: { kind: "prepare-ahead", resourceIds: ["mixing-bowl"] },
    4: { kind: "wait", resourceIds: [] },
  },
  tiramisu: {
    5: { kind: "prepare-ahead", resourceIds: ["refrigerator"] },
  },
  "apple-crumble": {
    4: { kind: "wait", resourceIds: [] },
  },
  "hibiscus-agua-fresca": {
    3: { kind: "prepare-ahead", resourceIds: ["refrigerator"] },
  },
} as const satisfies MealPlanStepMetadataRegistry);
