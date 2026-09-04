import { describe, expect, it } from "vitest";
import { flavorPreferences } from "@/data/flavor";
import { recipeFlavorProfiles } from "@/data/recipe-flavors";
import type { FlavorProfile } from "@/types/flavor";
import { describeFlavorProfile, scoreFlavorPreferences } from "../flavor";
import { validateFlavorProfile, validateFlavorVocabulary } from "../flavor-validation";

describe("Flavor Profile", () => {
  it("keeps vocabulary and preference IDs unique", () => {
    expect(validateFlavorVocabulary()).toEqual([]);
    expect(new Set(flavorPreferences.map((item) => item.id)).size).toBe(flavorPreferences.length);
  });

  it("accepts conservative profiles and rejects invalid intensity, IDs, duplicates, and incompatible characters", () => {
    expect(validateFlavorProfile(recipeFlavorProfiles["tomato-scrambled-eggs"])).toEqual([]);
    const invalid = {
      tastes: { salty: 2.5, unknown: 2 },
      aromaIds: ["garlicky", "garlicky", "unknown"],
      characterIds: ["light", "hearty"],
    } as unknown as FlavorProfile;
    expect(validateFlavorProfile(invalid).map((issue) => issue.message)).toEqual(expect.arrayContaining([
      "taste intensity 必须是 0–4 的整数",
      "未知 taste ID: unknown",
      "aromaIds 不能重复",
      "aromaIds 存在未知 ID: unknown",
      "不兼容的 flavor character: light / hearty",
    ]));
  });

  it("scores intensity distance and structured overlap deterministically", () => {
    const spicy = recipeFlavorProfiles["thai-basil-chicken"];
    const gentle = recipeFlavorProfiles["steamed-egg"];
    const spicyScore = scoreFlavorPreferences(spicy, ["fresh-spicy"]);
    const gentleScore = scoreFlavorPreferences(gentle, ["fresh-spicy"]);
    expect(spicyScore.score).toBeGreaterThan(gentleScore.score);
    expect(scoreFlavorPreferences(spicy, ["fresh-spicy"])).toEqual(spicyScore);
    expect(spicyScore.description).toMatch(/辣味|鲜味|椒香/);
  });

  it("keeps profiles and scoring results JSON serializable", () => {
    const result = scoreFlavorPreferences(recipeFlavorProfiles["greek-salad"], ["tangy-refreshing"]);
    expect(() => JSON.stringify({ profile: recipeFlavorProfiles["greek-salad"], result })).not.toThrow();
    expect(describeFlavorProfile(recipeFlavorProfiles["greek-salad"])).toContain("酸香");
  });
});
