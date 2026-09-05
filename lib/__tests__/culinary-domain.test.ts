import { describe, expect, it } from "vitest";
import { recipeImages } from "@/data/recipe-images";
import { recipes } from "@/data/recipes";
import type { AlcoholicDrinkItem, CulinaryItem, Evidence, Source, Story } from "@/types/culinary";
import type { TranslationSet } from "@/types/localization";
import { adaptRecipeToCulinaryItem } from "../culinary-item-adapter";
import { evaluateCulinaryItemPublishingEligibility, isCulinaryItemPubliclyVisible } from "../culinary-publishing";
import { validateCulinaryItem, validateStory } from "../culinary-validation";
import { resolveTranslation } from "../localization";

const publishingContext = {
  imageIds: new Set(recipeImages.map((image) => image.id)),
  stories: [],
  sources: [],
  evidence: [],
};

describe("Culinary Knowledge domain", () => {
  it("adapts all 100 recipes without changing their canonical data", () => {
    const items = recipes.map(adaptRecipeToCulinaryItem);
    expect(items).toHaveLength(100);
    expect(items.every((item) => item.itemType === "dish")).toBe(true);
    expect(items.flatMap(validateCulinaryItem)).toEqual([]);
    expect(items.map((item) => item.id)).toEqual(recipes.map((recipe) => recipe.id));
    expect(items.map((item) => item.publication.status)).toEqual(recipes.map((recipe) => recipe.publication.status));
    expect(() => JSON.stringify(items)).not.toThrow();
  });

  it("keeps the current ten published recipes eligible through the adapter", () => {
    const publishedItems = recipes
      .filter((recipe) => recipe.publication.status === "published")
      .map(adaptRecipeToCulinaryItem);
    expect(publishedItems).toHaveLength(10);
    expect(publishedItems.every((item) => evaluateCulinaryItemPublishingEligibility(item, publishingContext).eligible)).toBe(true);
    expect(publishedItems.every((item) => isCulinaryItemPubliclyVisible(item, publishingContext))).toBe(true);
  });

  it("allows an alcoholic drink to publish without fake cooking steps", () => {
    const wine: AlcoholicDrinkItem = {
      id: "sample-dry-red-wine",
      slug: "sample-dry-red-wine",
      itemType: "alcoholic-drink",
      content: {
        defaultLocale: "en",
        entries: [{ locale: "en", status: "reviewed", value: { name: "Sample dry red wine", description: "A publishing contract fixture." } }],
      },
      taxonomy: { techniqueIds: [], formIds: ["wine"], dietaryTagIds: [], browseTagIds: [] },
      flavor: recipes[0].flavor,
      images: { availability: "available", references: { primaryImageId: "wine-fixture", imageIds: ["wine-fixture"] } },
      storyIds: [],
      evidenceIds: [],
      pairing: { mealRoleIds: ["drink"], servingContextIds: ["dinner"], cuisineIds: [], facets: [{ dimension: "temperature", value: "room" }] },
      publication: { status: "published" },
      nutrition: { applicability: "not-modeled", reason: "out-of-scope" },
      cost: { source: "not-modeled" },
      preparation: {
        kind: "no-consumer-preparation",
        reason: "ready-to-serve",
        content: { defaultLocale: "en", entries: [{ locale: "en", status: "reviewed", value: { servingNote: "Serve according to the producer guidance." } }] },
      },
    };
    const context = { ...publishingContext, imageIds: new Set(["wine-fixture"]) };
    expect(validateCulinaryItem(wine)).toEqual([]);
    expect(evaluateCulinaryItemPublishingEligibility(wine, context)).toEqual({ itemId: wine.id, eligible: true, issues: [] });
  });

  it("represents all six item types with type-appropriate preparation semantics", () => {
    const dish = adaptRecipeToCulinaryItem(recipes[0]);
    const items = [
      dish,
      { ...dish, id: "sample-dessert", slug: "sample-dessert", itemType: "dessert", preparation: { ...dish.preparation, kind: "baking" } },
      { ...dish, id: "sample-tea", slug: "sample-tea", itemType: "tea", preparation: { ...dish.preparation, kind: "brewing" } },
      { ...dish, id: "sample-coffee", slug: "sample-coffee", itemType: "coffee", preparation: { ...dish.preparation, kind: "extraction" } },
      { ...dish, id: "sample-soft-drink", slug: "sample-soft-drink", itemType: "non-alcoholic-drink", preparation: { ...dish.preparation, kind: "mixing" } },
      {
        ...dish,
        id: "sample-wine",
        slug: "sample-wine",
        itemType: "alcoholic-drink",
        preparation: {
          kind: "no-consumer-preparation",
          reason: "ready-to-serve",
          content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { servingNote: "按生产者建议饮用。" } }] },
        },
      },
    ] satisfies CulinaryItem[];

    expect(items.map((item) => item.itemType)).toEqual([
      "dish", "dessert", "tea", "coffee", "non-alcoholic-drink", "alcoholic-drink",
    ]);
    expect(items.flatMap(validateCulinaryItem)).toEqual([]);
  });

  it("rejects preparation semantics that do not belong to an item type", () => {
    const dish = adaptRecipeToCulinaryItem(recipes[0]);
    const invalid = {
      ...dish,
      preparation: {
        kind: "no-consumer-preparation",
        reason: "ready-to-serve",
        content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { servingNote: "直接食用。" } }] },
      },
    } as unknown as typeof dish;
    expect(validateCulinaryItem(invalid)).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "preparation.kind", message: expect.stringContaining("dish 不支持") }),
    ]));
  });

  it("requires evidence references for factual, traditional, disputed, and folklore claims", () => {
    const story: Story = {
      id: "sample-origin-story",
      type: "origin",
      content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { title: "来源故事", body: "仅用于 contract 测试。" } }] },
      claims: [{
        id: "sample-origin-claim",
        kind: "disputed-attribution",
        content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { statement: "存在多个相互竞争的归属说法。" } }] },
        evidenceIds: [] as unknown as [string, ...string[]],
      }],
      relatedEntities: [],
    };
    expect(validateStory(story)).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "claims.0.evidenceIds" }),
    ]));
  });

  it("publishes a referenced Story through explicit Evidence and Source records", () => {
    const item = adaptRecipeToCulinaryItem(recipes.find((recipe) => recipe.slug === "tomato-scrambled-eggs")!);
    const source: Source = {
      id: "sample-institution-source",
      type: "educational-institution",
      title: "Sample institutional source",
      publisherOrInstitution: "Example University",
      authorNames: [],
      url: "https://example.edu/source",
      accessedAt: "2026-09-05",
      rights: { status: "reference-only", notes: "Facts may be cited; prose is not copied." },
      reliability: "authoritative-secondary",
      editorialNotes: "Fixture used to verify provenance references.",
    };
    const evidence: Evidence = {
      id: "sample-tradition-evidence",
      sourceId: source.id,
      relation: "supports",
      strength: "strong",
      editorialNote: "The source directly documents the stated tradition.",
    };
    const story: Story = {
      id: "sample-tradition-story",
      type: "everyday-life-festival",
      content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { title: "饮食语境", body: "一段经过独立改写的编辑正文。" } }] },
      claims: [{
        id: "sample-tradition-claim",
        kind: "documented-tradition",
        content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { statement: "来源明确记录了这一饮食语境。" } }] },
        evidenceIds: [evidence.id],
      }],
      relatedEntities: [{ type: "culinary-item", id: item.id }],
    };
    const withStory = { ...item, storyIds: [story.id] };
    const context = { ...publishingContext, stories: [story], evidence: [evidence], sources: [source] };
    expect(evaluateCulinaryItemPublishingEligibility(withStory, context).issues).toEqual([]);
  });

  it("validates only provenance reachable from the current item", () => {
    const item = adaptRecipeToCulinaryItem(recipes[0]);
    const unrelatedDraftSource = {
      id: "unrelated-source",
      type: "book",
      title: "",
      publisherOrInstitution: "",
      authorNames: [],
      url: "http://invalid.example",
      accessedAt: "",
      rights: { status: "unknown", notes: "" },
      reliability: "contested",
      editorialNotes: "",
    } as Source;
    expect(evaluateCulinaryItemPublishingEligibility(item, { ...publishingContext, sources: [unrelatedDraftSource] }).issues).toEqual([]);
  });

  it("keeps nutrition and cost eligibility for dish and dessert content", () => {
    const item = adaptRecipeToCulinaryItem(recipes[0]);
    const incomplete = {
      ...item,
      nutrition: { applicability: "not-modeled", reason: "insufficient-data" },
      cost: { source: "not-modeled" },
    } as typeof item;
    expect(evaluateCulinaryItemPublishingEligibility(incomplete, publishingContext).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "nutrition-model" }),
      expect.objectContaining({ code: "cost-model" }),
    ]));
  });

  it("resolves requested locale and then falls back to the declared default", () => {
    const translations: TranslationSet<{ name: string }> = {
      defaultLocale: "zh-CN",
      entries: [{ locale: "zh-CN", status: "reviewed", value: { name: "番茄炒蛋" } }],
    };
    expect(resolveTranslation(translations, "zh-CN").value.name).toBe("番茄炒蛋");
    expect(resolveTranslation(translations, "en").value.name).toBe("番茄炒蛋");
  });
});
