import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publishedLocalContentPackages } from "@/data/content-packages";
import { m11BatchAPublicationCandidateManifest } from "@/data/content-bundle-manifest";
import { createContentRightsRegistry } from "@/data/content-rights";
import { ingredients } from "@/data/ingredients";
import {
  m11BatchAContentPackages,
  m11BatchAAiGenerationRecords,
  m11BatchAAiInputs,
  m11BatchAAiServiceAssessments,
  m11BatchAEvidence,
  m11BatchAGeneratedArtifactIds,
  m11BatchATextArtifactDerivations,
  m11BatchAImages,
  m11BatchAItems,
  m11BatchAProductProfiles,
  m11BatchAResearchRecords,
  m11BatchARestaurantIdentities,
  m11BatchASources,
  m11BatchAStories,
} from "@/data/m11/batch-a";
import { m11BatchAMealPlanStepMetadata } from "@/data/m11/batch-a-meal-plan-metadata";
import { m11BatchAImageAlts } from "@/data/m11/batch-a-image-alts";
import {
  m11BatchAPublishedContentPackages,
  m11BatchAPublishedItems,
  m11BatchAPublishedStories,
} from "@/data/m11/batch-a-publication";
import { m11BatchAItemIds, m11PortfolioTarget, m11RequiredItemIds, m11RestaurantReconstructionItemIds } from "@/data/m11/portfolio";
import { evaluateContentRightsRegistry } from "@/lib/content-rights";
import { validateContentBundleManifest } from "@/lib/content-bundle";
import { evaluateCulinaryItemPublishingEligibility } from "@/lib/culinary-publishing";
import { deriveMinimumPublishingRisk } from "@/lib/publishing-governance";
import { validateResearchRegistry } from "@/lib/research-validation";
import { getToolLabel } from "@/lib/tool-labels";
import { getCulinaryItemHeroImage } from "@/lib/story-experience";
import type { CulinaryItemType } from "@/types/culinary";

const publishingContext = {
  ingredients,
  images: m11BatchAImages,
  localAssetExists: (src: string) => existsSync(resolve(process.cwd(), "public", src.replace(/^\//, ""))),
  stories: m11BatchAStories,
  sources: m11BatchASources,
  evidence: m11BatchAEvidence,
};

// M10 derives audit scope from publication status. Candidate packages intentionally remain
// draft until independent attestations and sampling exist, so this preflight uses an isolated
// publication projection without changing the staged source data or public package index.
const rightsPreflightItems = m11BatchAPublishedItems;
const rightsPreflightStories = m11BatchAPublishedStories;

const rightsRegistryInput = {
  items: rightsPreflightItems,
  auditedItemIds: m11BatchAItemIds,
  images: m11BatchAImages,
  ingredients,
  stories: rightsPreflightStories,
  evidence: m11BatchAEvidence,
  sources: m11BatchASources,
  researchRecords: m11BatchAResearchRecords,
  restaurantRequirements: m11RestaurantReconstructionItemIds.map((culinaryItemId) => ({
    culinaryItemId,
    kind: "cooking-lab-reconstruction" as const,
  })),
  restaurants: m11BatchARestaurantIdentities,
  productProfiles: m11BatchAProductProfiles,
  aiInputs: m11BatchAAiInputs,
  ai: m11BatchAAiGenerationRecords,
  aiAssessments: m11BatchAAiServiceAssessments,
  textArtifactDerivations: m11BatchATextArtifactDerivations,
  preciseSourceUseItemIds: m11BatchAItemIds,
} as const;
const rightsRegistry = createContentRightsRegistry(rightsRegistryInput);

describe("M11 content Batch A candidate boundary", () => {
  it("keeps authored candidates staged and publishes the exact 35-item projection atomically", () => {
    expect(m11BatchAItems).toHaveLength(35);
    expect(m11BatchAContentPackages).toHaveLength(35);
    expect(m11BatchAItems.map((item) => item.id).sort()).toEqual([...m11BatchAItemIds].sort());
    expect(m11RequiredItemIds.every((id) => m11BatchAItemIds.includes(id))).toBe(true);
    expect(m11BatchAItems.every((item) => item.publication.status === "draft")).toBe(true);
    expect(m11BatchAStories.every((story) => story.publication.status === "draft")).toBe(true);
    expect(m11BatchAPublishedItems.every((item) => item.publication.status === "published")).toBe(true);
    expect(m11BatchAPublishedStories.every((story) => story.publication.status === "published")).toBe(true);
    expect(m11BatchAPublishedContentPackages.map((contentPackage) => contentPackage.itemId).sort()).toEqual(
      [...m11BatchAItemIds].sort(),
    );
    expect(publishedLocalContentPackages.filter((contentPackage) => (
      (m11BatchAItemIds as readonly string[]).includes(contentPackage.itemId)
    ))).toHaveLength(0);

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

  it("passes closed multi-source research but fails closed on unrecoverable AI provenance", () => {
    expect(validateResearchRegistry({
      sources: m11BatchASources,
      evidence: m11BatchAEvidence,
      records: m11BatchAResearchRecords,
    })).toEqual([]);
    const result = evaluateContentRightsRegistry(rightsRegistry, {
      items: rightsPreflightItems,
      images: m11BatchAImages,
      ingredients,
      stories: rightsPreflightStories,
      evidence: m11BatchAEvidence,
      sources: m11BatchASources,
      researchRecords: m11BatchAResearchRecords,
      minimumPreparationSourceItemIds: m11BatchAItemIds,
      now: "2026-09-06",
    });
    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "ai-review-incomplete",
      "permission-blocked",
    ]));
    expect(result.auditedItemIds).toHaveLength(35);
    expect(rightsRegistry.decisions.filter((decision) => decision.decision === "block")).toHaveLength(
      m11BatchAGeneratedArtifactIds.length,
    );
    expect(m11BatchAGeneratedArtifactIds).toHaveLength(105);
    expect(rightsRegistry.aiInputs).toEqual([]);
    expect(rightsRegistry.ai).toEqual([]);
    expect(rightsRegistry.artifacts.filter((artifact) => artifact.kind === "image").every((artifact) => (
      artifact.derivation !== "generated"
      && !m11BatchAGeneratedArtifactIds.includes(artifact.id)
    ))).toBe(true);
    expect(rightsRegistry.restaurants).toHaveLength(5);
    expect(rightsRegistry.productProfiles).toHaveLength(0);

    for (const profile of m11BatchAProductProfiles) {
      const contentPackage = m11BatchAContentPackages.find((entry) => entry.itemId === profile.culinaryItemId)!;
      expect(contentPackage.manifestEntry.usageDecisionIds).toContain(`usage-${profile.id}-product-profile`);
    }

    for (const itemId of m11BatchARestaurantIdentities.map((entry) => entry.culinaryItemId)) {
      const item = rightsPreflightItems.find((entry) => entry.id === itemId)!;
      expect(deriveMinimumPublishingRisk(item, rightsRegistry).level, itemId).toBe("medium");
    }

    expect(m11BatchAProductProfiles).toEqual([]);
  });

  it("cannot silently relabel a generated artifact by omitting its authoring declaration", () => {
    const [removed, ...remaining] = m11BatchATextArtifactDerivations;
    expect(() => createContentRightsRegistry({
      ...rightsRegistryInput,
      textArtifactDerivations: remaining,
    })).toThrow(`Missing text artifact derivation declaration: ${removed.artifactId}`);
  });

  it("uses only non-video research evidence", () => {
    expect(rightsRegistry.externalMedia).toEqual([]);
    expect(m11BatchASources.every((source) => source.health.status === "active" && source.health.checkedAt === "2026-09-07")).toBe(true);
    expect(m11BatchASources.every((source) => source.locators.every((locator) => (
      locator.kind !== "url" || !/(?:youtube\.com|youtu\.be|bilibili\.com)/i.test(locator.url)
    )))).toBe(true);
    expect(m11BatchASources.every((source) => source.locators.every((locator) => (
      locator.kind !== "url" || !/(?:discoverhongkong\.com\/eng\/explore\/dining\.html|ncausa\.org\/About-Coffee\/How-to-Brew-Coffee|riojawine\.com\/en\/$)/i.test(locator.url)
    )))).toBe(true);
    expect(m11BatchAEvidence.every((record) => record.locators.every((locator) => locator.kind !== "timestamp"))).toBe(true);
  });

  it("does not use placeholder regional categories as specific product profiles", () => {
    for (const itemId of [
      "darjeeling-first-flush-profile",
      "ethiopia-yirgacheffe-washed-profile",
      "rioja-reserva-profile",
    ]) {
      const contentPackage = m11BatchAContentPackages.find((entry) => entry.itemId === itemId)!;
      expect(contentPackage.manifestEntry.usageDecisionIds.some((id) => id.includes("product-profile"))).toBe(false);
    }
  });

  it("uses two culinary sources for repaired preparations and keeps safety sources narrowly scoped", () => {
    const repairedItemIds = [
      "pan-seared-chicken-thigh",
      "steamed-salmon",
      "roasted-salmon",
      "steamed-egg",
      "rice-cooker-chicken-rice",
    ];

    for (const itemId of repairedItemIds) {
      const record = m11BatchAResearchRecords.find((entry) => entry.subject.id === itemId)!;
      const acceptedDecisions = record.sourceDecisions.filter((decision) => decision.disposition === "accepted");
      const culinaryDecisions = acceptedDecisions.filter((decision) => (
        decision.uses.includes("identity") && decision.uses.includes("preparation")
      ));
      const safetyDecisions = acceptedDecisions.filter((decision) => decision.uses.includes("safety"));

      expect(culinaryDecisions, itemId).toHaveLength(2);
      expect(safetyDecisions.length, itemId).toBeGreaterThanOrEqual(2);
      expect(safetyDecisions.every((decision) => decision.uses.length === 1), itemId).toBe(true);
      expect(culinaryDecisions.every((decision) => !decision.uses.includes("safety")), itemId).toBe(true);
    }
  });

  it("uses every accepted Tieguanyin source in claim-level Evidence", () => {
    const record = m11BatchAResearchRecords.find((entry) => entry.subject.id === "tieguanyin-gongfu")!;
    const acceptedSourceIds = record.sourceDecisions
      .filter((decision) => decision.disposition === "accepted")
      .map((decision) => decision.sourceId)
      .sort();
    const evidencedSourceIds = m11BatchAEvidence
      .filter((entry) => record.claims[0].evidenceIds.includes(entry.id))
      .map((entry) => entry.sourceId)
      .sort();

    expect(evidencedSourceIds).toEqual(acceptedSourceIds);
  });

  it("keeps Batch A outside Production until current split attestations and sampling exist", async () => {
    const {
      publishingGovernanceAuditReport,
      publishingGovernanceRegistry,
    } = await import("@/data/published-culinary-items");
    const batchClassifications = publishingGovernanceRegistry.riskClassifications.filter((entry) =>
      (m11BatchAItemIds as readonly string[]).includes(entry.itemId),
    );
    expect(batchClassifications).toHaveLength(0);
    expect(publishedLocalContentPackages).toHaveLength(50);
    expect(publishingGovernanceAuditReport).toContain("Status: PASS");
    expect(publishingGovernanceAuditReport).toContain("Published items audited: 50");
  });

  it("keeps the committed 85-item candidate manifest current with only explicit AI blocks", async () => {
    const production = await import("@/data/published-culinary-items");
    const combinedItems = [...production.getPublishedCulinaryItems(), ...rightsPreflightItems];
    const combinedRegistry = {
      ...production.contentRightsRegistry,
      artifacts: [...production.contentRightsRegistry.artifacts, ...rightsRegistry.artifacts],
      decisions: [...production.contentRightsRegistry.decisions, ...rightsRegistry.decisions],
      productProfiles: [...production.contentRightsRegistry.productProfiles, ...rightsRegistry.productProfiles],
    };
    const issues = validateContentBundleManifest(
      m11BatchAPublicationCandidateManifest,
      combinedItems,
      combinedRegistry,
    );

    expect(m11BatchAPublicationCandidateManifest.entries).toHaveLength(85);
    expect(new Set(issues.map((issue) => issue.code))).toEqual(new Set(["blocked-usage-decision"]));
    expect(issues).toHaveLength(m11BatchAGeneratedArtifactIds.length);
  });

  it("publishes item-specific culinary stories rather than governance boilerplate", () => {
    const bannedBoilerplate = [
      "可核验的内容边界",
      "来源支持的范围",
      "verifiable editorial boundary",
      "What the sources support",
    ];

    for (const story of m11BatchAStories) {
      const text = JSON.stringify(story.content);
      for (const phrase of bannedBoilerplate) expect(text, story.id).not.toContain(phrase);
      expect(story.content.entries.find((entry) => entry.locale === "zh-CN")?.value.sections).toHaveLength(2);
      expect(story.content.entries.find((entry) => entry.locale === "en")?.value.sections).toHaveLength(2);
    }

    for (const itemId of ["flat-white", "yuenyeung"]) {
      expect(m11BatchAStories.find((story) => story.relatedEntities.some((entity) => entity.id === itemId))?.claims[0].kind).toBe("disputed-attribution");
      expect(m11BatchAResearchRecords.find((record) => record.subject.id === itemId)?.claims[0].kind).toBe("disputed-attribution");
    }
  });

  it("keeps disputed geography, product-profile claims, and signature techniques honest", () => {
    const byId = new Map(m11BatchAItems.map((item) => [item.id, item]));
    const doubleSkinMilk = byId.get("double-skin-milk")!;
    expect("steps" in doubleSkinMilk.preparation ? doubleSkinMilk.preparation.steps : []).toHaveLength(5);
    expect(JSON.stringify(doubleSkinMilk.preparation)).toContain("第一层奶皮");
    expect(JSON.stringify(doubleSkinMilk.preparation)).toContain("first milk skin");

    for (const itemId of ["mango-pomelo-sago", "hong-kong-egg-tart", "cha-chaan-teng-lemon-coke", "hong-kong-iced-lemon-tea", "yuenyeung"]) {
      expect(byId.get(itemId)?.taxonomy.origin?.regionId, itemId).not.toBe("guangdong");
    }
    expect(byId.get("flat-white")?.taxonomy.origin).toEqual({ areaId: "trans-tasman" });
    expect(byId.get("cha-chaan-teng-lemon-coke")?.taxonomy.formIds).toContain("lemon-cola");

    for (const itemId of ["darjeeling-first-flush-profile", "ethiopia-yirgacheffe-washed-profile", "rioja-reserva-profile"]) {
      const item = byId.get(itemId)!;
      expect(item.flavor.tastes, itemId).toEqual({});
      expect(item.flavor.aromaIds, itemId).toEqual([]);
      expect(item.flavor.textureIds, itemId).toEqual([]);
      expect(item.flavor.characterIds, itemId).toEqual([]);
    }
    expect(byId.get("rioja-reserva-profile")?.taxonomy.dietaryTagIds).not.toContain("vegan");

    const openCantoneseSources = m11BatchASources.filter((source) => source.publisherOrInstitution === "Open Cantonese");
    expect(openCantoneseSources.length).toBeGreaterThan(0);
    expect(openCantoneseSources.every((source) => source.type === "open-educational-resource" && source.reliability === "general-secondary")).toBe(true);
  });

  it("keeps reviewed doneness checks executable and original Hero descriptions faithful", () => {
    const byId = new Map(m11BatchAItems.map((item) => [item.id, item]));
    const lemonChicken = byId.get("lemon-chicken-breast")!;
    const steamedSalmon = byId.get("steamed-salmon")!;
    const steamedEgg = byId.get("steamed-egg")!;

    expect(JSON.stringify(lemonChicken.preparation)).toContain("Return it to medium-low heat");
    expect(JSON.stringify(steamedSalmon.preparation)).toContain("1-minute increments");
    expect(JSON.stringify(steamedEgg.preparation)).toContain("1-minute increments");

    expect(Object.keys(m11BatchAImageAlts).sort()).toEqual([...m11BatchAItemIds].sort());
    for (const image of m11BatchAImages) {
      const itemId = image.id.replace(/-hero$/, "");
      expect(image.alt, itemId).toBe(m11BatchAImageAlts[itemId]["zh-CN"]);
      expect(image.localizedAlt, itemId).toEqual(m11BatchAImageAlts[itemId]);
      const item = m11BatchAItems.find((entry) => entry.id === itemId)!;
      expect(getCulinaryItemHeroImage(item, m11BatchAImages, "zh-CN")?.alt, itemId).toBe(m11BatchAImageAlts[itemId]["zh-CN"]);
      expect(getCulinaryItemHeroImage(item, m11BatchAImages, "en")?.alt, itemId).toBe(m11BatchAImageAlts[itemId].en);
    }
    expect(m11BatchAImageAlts["mushroom-tofu-rice"].en).toContain("small mound of rice");
    expect(m11BatchAImageAlts["black-sesame-soup"]["zh-CN"]).toContain("黑芝麻粒");
    expect(m11BatchAImageAlts["tieguanyin-gongfu"]["zh-CN"]).toContain("抽象冲泡场景");
    expect(m11BatchAImageAlts["flat-white"]["zh-CN"]).toContain("矮宽陶瓷杯");
    expect(m11BatchAImageAlts["rioja-reserva-profile"]["zh-CN"]).toContain("装有深红色葡萄酒");
  });

  it("localizes the specialized tools introduced by Batch A", () => {
    const toolIds = ["v60-dripper", "paper-filter", "milk-pitcher", "pour-over-dripper", "coffee-filter", "bottle-opener"];
    for (const toolId of toolIds) {
      expect(getToolLabel(toolId, "zh-CN"), toolId).not.toBe(toolId.replaceAll("-", " "));
    }
  });

  it("authors every procedural plan duration without inferring task kind from prose", () => {
    const proceduralItems = m11BatchAItems.filter((item) => "steps" in item.preparation);
    expect(Object.keys(m11BatchAMealPlanStepMetadata).sort()).toEqual(proceduralItems.map((item) => item.id).sort());

    for (const item of proceduralItems) {
      if (!("steps" in item.preparation)) continue;
      const metadata = m11BatchAMealPlanStepMetadata[item.id as keyof typeof m11BatchAMealPlanStepMetadata];
      const orders = item.preparation.steps.map((step) => step.order);
      expect(Object.keys(metadata).map(Number).sort((a, b) => a - b), item.id).toEqual(orders);
      const entries = Object.values(metadata);
      expect(entries.reduce((total, entry) => total + entry.durationMinutes, 0), `${item.id} total`).toBe(item.preparation.time.totalMinutes);
      expect(entries.filter((entry) => entry.kind === "active").reduce((total, entry) => total + entry.durationMinutes, 0), `${item.id} active`).toBe(item.preparation.time.activeMinutes);
      if (item.preparation.time.totalMinutes > item.preparation.time.activeMinutes) {
        expect(entries.some((entry) => entry.kind === "wait" || entry.kind === "prepare-ahead"), item.id).toBe(true);
      }
    }
  });
});
