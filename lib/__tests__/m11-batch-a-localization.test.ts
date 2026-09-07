import { describe, expect, it } from "vitest";
import { hasReviewedEnglishIngredientLabel } from "@/data/localization/ingredients";
import {
  m11BatchAContentPackages,
  m11BatchAItems,
  m11BatchAStories,
} from "@/data/m11/batch-a";
import { m11BatchAEnglishIngredientLabels } from "@/data/m11/batch-a-ingredient-labels";
import { createPublishingLocalizationVersions } from "@/data/publishing-localization-versions";
import { ingredients } from "@/data/ingredients";

describe("M11 Batch A standalone localization", () => {
  it("provides reviewed English labels without mutating the legacy translation path", () => {
    const ingredientIds = new Set(m11BatchAItems.flatMap((item) =>
      "inputs" in item.preparation ? item.preparation.inputs.map((input) => input.ingredientId) : [],
    ));
    for (const ingredientId of ingredientIds) {
      expect(
        hasReviewedEnglishIngredientLabel(ingredientId, m11BatchAEnglishIngredientLabels),
        ingredientId,
      ).toBe(true);
    }

    expect(hasReviewedEnglishIngredientLabel("chicken-breast")).toBe(false);
    expect(hasReviewedEnglishIngredientLabel("chicken-breast", m11BatchAEnglishIngredientLabels)).toBe(true);
  });

  it("fingerprints complete bilingual standalone copy and ingredient labels", () => {
    const versions = createPublishingLocalizationVersions(
      m11BatchAContentPackages,
      ingredients,
      m11BatchAStories,
      m11BatchAEnglishIngredientLabels,
    );

    expect(versions).toHaveLength(35);
    expect(versions.every((entry) =>
      entry.path === "standalone-package"
      && entry.localeVersions.map(({ locale }) => locale).sort().join(",") === "en,zh-CN",
    )).toBe(true);
  });
});
