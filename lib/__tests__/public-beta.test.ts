import { describe, expect, it } from "vitest";
import { recipes } from "@/data/recipes";
import { createRecipeDetailViewModel } from "../recipe-detail";
import { BETA_DISCLAIMER, BETA_FEEDBACK_URL, REPOSITORY_URL } from "../site";

describe("public beta release contract", () => {
  it("renders all recipe detail view models without unsafe display values", () => {
    const serialized = JSON.stringify(recipes.map((recipe) => createRecipeDetailViewModel(recipe)));
    expect(recipes).toHaveLength(30);
    expect(serialized).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("keeps the feedback route on the public repository", () => {
    expect(BETA_FEEDBACK_URL).toBe(`${REPOSITORY_URL}/issues/new?template=beta-feedback.md&labels=beta-feedback`);
    expect(BETA_FEEDBACK_URL).toMatch(/^https:\/\/github\.com\//);
  });

  it("states that beta values are estimates and not medical advice", () => {
    expect(BETA_DISCLAIMER).toContain("演示估算");
    expect(BETA_DISCLAIMER).toContain("不构成医学或个体化饮食建议");
  });
});
