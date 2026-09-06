import { describe, expect, it } from "vitest";
import {
  m9RecipeResearchRecords,
  m9RecipeResearchRegistry,
  m9RecipeResearchSources,
} from "@/data/research/m9-recipe-research";
import { validateResearchRegistry } from "../research-validation";

const expectedSlugs = [
  "cantonese-ginger-scallion-fish",
  "cantonese-mushroom-steamed-chicken",
  "hunan-chili-pork",
  "yunnan-mushroom-chicken-stew",
  "northwest-cumin-lamb",
  "chaoshan-fish-congee",
  "japanese-oyakodon",
  "japanese-miso-salmon",
  "korean-tofu-stew-home",
  "korean-glass-noodle-stir-fry",
  "filipino-chicken-adobo-home",
  "indonesian-chili-eggplant",
  "malaysian-turmeric-chicken",
  "singapore-chicken-rice-home",
  "thai-green-papaya-salad",
  "indian-masoor-dal",
  "indian-chana-masala-home",
  "lebanese-mujadara",
  "spanish-potato-omelet",
  "spanish-chickpea-spinach",
  "french-lentil-soup",
  "greek-lemon-oregano-chicken",
  "mexican-black-bean-tacos",
  "huevos-rancheros-home",
] as const;

describe("M9 recipe research registry", () => {
  it("closes exactly one culinary-item research record for every planned slug", () => {
    expect(m9RecipeResearchRecords).toHaveLength(24);
    expect(m9RecipeResearchRecords.map(({ subject }) => subject)).toEqual(
      expectedSlugs.map((id) => ({ type: "culinary-item", id })),
    );
    expect(m9RecipeResearchRecords.every(({ status }) => status === "closed")).toBe(true);
  });

  it("passes the shared registry validator", () => {
    expect(validateResearchRegistry(m9RecipeResearchRegistry)).toEqual([]);
  });

  it("accepts at least two independent sources with explicit uses per record", () => {
    const sourceById = new Map(m9RecipeResearchSources.map((source) => [source.id, source]));
    for (const record of m9RecipeResearchRecords) {
      const accepted = record.sourceDecisions.filter((decision) => decision.disposition === "accepted");
      expect(new Set(accepted.map(({ sourceId }) => sourceId)).size).toBeGreaterThanOrEqual(2);
      expect(new Set(accepted.map(({ sourceId }) => sourceById.get(sourceId)?.publisherOrInstitution)).size).toBeGreaterThanOrEqual(2);
      expect(accepted.every(({ uses }) => uses.length > 0)).toBe(true);
      expect(accepted.flatMap(({ uses }) => uses)).not.toContain("award");
    }
  });

  it("keeps sources directly retrievable and reference-only", () => {
    expect(m9RecipeResearchSources.length).toBeGreaterThanOrEqual(2);
    for (const source of m9RecipeResearchSources) {
      expect(source.locators[0]).toMatchObject({ kind: "url", accessedAt: "2026-09-06" });
      if (source.locators[0].kind === "url") expect(source.locators[0].url).toMatch(/^https:\/\//);
      expect(source.rights.status).toBe("reference-only");
    }
  });

  it("records the two unsupported regional identities as household adaptations", () => {
    const decisions = new Map(m9RecipeResearchRecords.map(({ subject, editorialDecision }) => [subject.id, editorialDecision]));
    expect(decisions.get("yunnan-mushroom-chicken-stew")).toContain("remove the Yunnan claim");
    expect(decisions.get("chaoshan-fish-congee")).toContain("Publish only as household fish congee");
  });
});
