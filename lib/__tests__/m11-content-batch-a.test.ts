import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publishedLocalContentPackages } from "@/data/content-packages";
import { createContentRightsRegistry } from "@/data/content-rights";
import { ingredients } from "@/data/ingredients";
import {
  m11BatchAContentPackages,
  m11BatchAEvidence,
  m11BatchAImages,
  m11BatchAItems,
  m11BatchAResearchRecords,
  m11BatchASources,
  m11BatchAStories,
} from "@/data/m11/batch-a";
import { m11BatchAItemIds, m11PortfolioTarget, m11RequiredItemIds } from "@/data/m11/portfolio";
import { evaluateContentRightsRegistry } from "@/lib/content-rights";
import { evaluateCulinaryItemPublishingEligibility } from "@/lib/culinary-publishing";
import { validateResearchRegistry } from "@/lib/research-validation";
import type { CulinaryItemType } from "@/types/culinary";

const publishingContext = {
  ingredients,
  images: m11BatchAImages,
  localAssetExists: (src: string) => existsSync(resolve(process.cwd(), "public", src.replace(/^\//, ""))),
  stories: m11BatchAStories,
  sources: m11BatchASources,
  evidence: m11BatchAEvidence,
};

const rightsRegistry = createContentRightsRegistry({
  items: m11BatchAItems,
  auditedItemIds: m11BatchAItemIds,
  images: m11BatchAImages,
  ingredients,
  stories: m11BatchAStories,
  evidence: m11BatchAEvidence,
  sources: m11BatchASources,
  researchRecords: m11BatchAResearchRecords,
});

describe("M11 content Batch A candidate boundary", () => {
  it("matches its exact 35-item portfolio slice while remaining outside Production", () => {
    expect(m11BatchAItems).toHaveLength(35);
    expect(m11BatchAContentPackages).toHaveLength(35);
    expect(m11BatchAItems.map((item) => item.id).sort()).toEqual([...m11BatchAItemIds].sort());
    expect(m11RequiredItemIds.every((id) => m11BatchAItemIds.includes(id))).toBe(true);
    expect(publishedLocalContentPackages.some((contentPackage) => (
      (m11BatchAItemIds as readonly string[]).includes(contentPackage.itemId)
    ))).toBe(false);

    const counts = Object.fromEntries(Object.keys(m11PortfolioTarget).map((type) => [type, 0])) as Record<CulinaryItemType, number>;
    for (const item of m11BatchAItems) counts[item.itemType] += 1;
    expect(counts).toEqual({
      dish: 20,
      dessert: 4,
      tea: 3,
      coffee: 3,
      "non-alcoholic-drink": 4,
      "alcoholic-drink": 1,
    });
  });

  it("passes schema, asset, preparation, nutrition, cost, Story and source gates", () => {
    const issues = m11BatchAItems.flatMap((item) => (
      evaluateCulinaryItemPublishingEligibility(item, publishingContext).issues
    ));
    expect(issues, issues.map((issue) => `${issue.code}:${issue.field}:${issue.message}`).join("\n")).toEqual([]);
  });

  it("passes closed multi-source research and the M10 commercial-rights gate", () => {
    expect(validateResearchRegistry({
      sources: m11BatchASources,
      evidence: m11BatchAEvidence,
      records: m11BatchAResearchRecords,
    })).toEqual([]);
    const result = evaluateContentRightsRegistry(rightsRegistry, {
      items: m11BatchAItems,
      images: m11BatchAImages,
      ingredients,
      stories: m11BatchAStories,
      evidence: m11BatchAEvidence,
      sources: m11BatchASources,
      researchRecords: m11BatchAResearchRecords,
      now: "2026-09-06",
    });
    expect(result.ready, result.issues.map((issue) => `${issue.code}:${issue.subjectId}`).join("\n")).toBe(true);
    expect(result.auditedItemIds).toHaveLength(35);
    expect(rightsRegistry.decisions.every((decision) => decision.decision !== "block")).toBe(true);
  });
});
