import { describe, expect, it } from "vitest";
import { culinaryEvidence } from "@/data/culinary/evidence";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { culinarySources } from "@/data/culinary/sources";
import { culinaryStories } from "@/data/culinary/stories";
import {
  getPublishedCulinaryItems,
  getPublishedNativeCulinaryItemStaticParams,
} from "@/data/published-culinary-items";
import { getPublishedRecipes } from "@/data/published-recipes";
import {
  getPublishedStories,
  getPublishedStoryPageModel,
  getPublishedStoryStaticParams,
  getStoryExperienceContext,
} from "@/data/published-stories";
import type { Story } from "@/types/culinary";
import { getCulinaryItemHref, isCanonicalCulinaryPath } from "../culinary-routes";
import { buildStoryPageModel } from "../story-experience";
import { evaluateStoryPublishingEligibility, getPubliclyVisibleStories } from "../story-publishing";

const publishedItems = getPublishedCulinaryItems();
const publishingContext = {
  items: publishedItems,
  evidence: culinaryEvidence,
  sources: culinarySources,
};

describe("Story exploration experience", () => {
  it("publishes all six reviewed Stories and generates one static route per Story", () => {
    expect(getPublishedStories()).toHaveLength(6);
    expect(getPublishedStoryStaticParams()).toEqual(
      getPublishedStories().map((story) => ({ slug: story.id })),
    );
  });

  it("builds JSON-serializable consumer models with readable sections", () => {
    const models = getPublishedStories().map((story) => getPublishedStoryPageModel(story.id));
    expect(models.every(Boolean)).toBe(true);
    expect(models.every((model) => model!.sections.length >= 2)).toBe(true);
    expect(models.every((model) => model!.culinaryItems.length >= 1)).toBe(true);
    expect(models.every((model) => model!.sources.length >= 1)).toBe(true);
    expect(() => JSON.stringify(models)).not.toThrow();
  });

  it("keeps disputed attribution and documented tradition explicit in reader-facing language", () => {
    const dongpo = getPublishedStoryPageModel("dongpo-pork-name-and-attribution")!;
    const tomyum = getPublishedStoryPageModel("tomyum-kung-documented-practice")!;
    const dongpoCopy = [dongpo.dek, ...dongpo.sections.flatMap((section) => section.paragraphs)].join(" ");
    const tomyumCopy = [tomyum.dek, ...tomyum.sections.flatMap((section) => section.paragraphs)].join(" ");

    expect(dongpo.evidenceContext).toContain("争议");
    expect(dongpoCopy).not.toContain("苏东坡发明了东坡肉");
    expect(dongpoCopy).toContain("不能反向证明");
    expect(tomyum.evidenceContext).toContain("被机构或文献记录的传统");
    expect(tomyumCopy).toContain("不会自动证明唯一发源地");
  });

  it("projects usable source details without exposing editorial provenance internals", () => {
    const espresso = getPublishedStoryPageModel("espresso-developed-through-stages")!;
    expect(espresso.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: "The Long History of the Espresso Machine",
        byline: expect.stringContaining("Smithsonian Magazine"),
        locatorLabel: expect.stringContaining("Machine development chronology"),
        href: expect.stringMatching(/^https:\/\//),
      }),
    ]));
    expect(Object.keys(espresso.sources[0]).sort()).toEqual(["byline", "href", "locatorLabel", "title"]);
    expect(JSON.stringify(espresso.sources)).not.toMatch(
      /editorialNote|editorialNotes|reliability|rights|health|strength|sourceId|evidenceId/,
    );
  });

  it("returns deterministic, published-only related content and hides weak Story links", () => {
    const first = getPublishedStoryPageModel("dongpo-pork-name-and-attribution")!;
    const second = getPublishedStoryPageModel("dongpo-pork-name-and-attribution")!;
    const publishedIds = new Set(publishedItems.map((item) => item.id));
    const publishedStoryIds = new Set(getPublishedStories().map((story) => story.id));

    expect(first.relatedItems).toEqual(second.relatedItems);
    expect(first.relatedItems.every((item) => publishedIds.has(item.id))).toBe(true);
    expect(first.relatedStories).toEqual(second.relatedStories);
    expect(first.relatedStories.every((story) => publishedStoryIds.has(story.id))).toBe(true);
    expect(first.relatedStories.map((story) => story.id)).toContain("longjing-within-living-tea-practice");
    expect(getPublishedStoryPageModel("espresso-developed-through-stages")!.relatedStories).toEqual([]);
  });

  it("ranks a genuinely shared Story relation deterministically", () => {
    const context = getStoryExperienceContext();
    const anchor = culinaryStories[0];
    const related: Story = {
      ...culinaryStories[1],
      id: "another-dongpo-context",
      type: anchor.type,
      content: {
        defaultLocale: "zh-CN",
        entries: [{
          locale: "zh-CN",
          status: "reviewed",
          value: {
            title: "另一条东坡语境",
            dek: "同一道料理的另一条经审核线索。",
            sections: [{ heading: "同一料理", paragraphs: ["这是一段测试用编辑正文。"] }],
          },
        }],
      },
      relatedEntities: [{ type: "culinary-item", id: "dongpo-pork" }, { type: "person", id: "su-shi" }],
    };
    const syntheticContext = { ...context, stories: [anchor, related] };

    expect(buildStoryPageModel(anchor, syntheticContext).relatedStories.map((story) => story.id)).toEqual([
      related.id,
    ]);
    expect(buildStoryPageModel(anchor, syntheticContext).relatedStories.map((story) => story.id)).toEqual([
      related.id,
    ]);
  });

  it("excludes drafts and rejects duplicate Story IDs", () => {
    const draft: Story = {
      ...culinaryStories[0],
      id: "draft-story",
      publication: { status: "draft" },
    };
    expect(getPubliclyVisibleStories([...culinaryStories, draft], publishingContext)).toHaveLength(6);
    expect(() => getPubliclyVisibleStories([...culinaryStories, culinaryStories[0]], publishingContext)).toThrow(
      "Story ID 重复",
    );
  });

  it("rejects broken CulinaryItem, Evidence, and Source references", () => {
    const story = culinaryStories[0];
    const brokenItem: Story = {
      ...story,
      relatedEntities: [{ type: "culinary-item", id: "missing-item" }],
    };
    const brokenEvidence: Story = {
      ...story,
      claims: [{ ...story.claims[0], evidenceIds: ["missing-evidence"] }],
    };
    const withoutSource = {
      ...publishingContext,
      sources: culinarySources.filter((source) => source.id !== "wu-dongpo-pork-study"),
    };

    expect(evaluateStoryPublishingEligibility(brokenItem, publishingContext).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "relatedEntities", message: expect.stringContaining("missing-item") }),
    ]));
    expect(evaluateStoryPublishingEligibility(brokenEvidence, publishingContext).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "claims.evidenceIds", message: expect.stringContaining("missing-evidence") }),
    ]));
    expect(evaluateStoryPublishingEligibility(story, withoutSource).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "sourceId", message: expect.stringContaining("不存在的 Source") }),
    ]));
  });

  it("keeps Recipe and native CulinaryItem routes canonical and non-duplicated", () => {
    const recipeIds = new Set(getPublishedRecipes().map((recipe) => recipe.id));
    const recipeItem = publishedItems.find((item) => recipeIds.has(item.id))!;
    const nativeItem = nativeCulinaryItems[0];

    expect(getCulinaryItemHref(recipeItem, recipeIds)).toBe(`/recipes/${recipeItem.slug}`);
    expect(isCanonicalCulinaryPath(recipeItem, `/recipes/${recipeItem.slug}`, recipeIds)).toBe(true);
    expect(isCanonicalCulinaryPath(recipeItem, `/culinary/${recipeItem.slug}`, recipeIds)).toBe(false);
    expect(getCulinaryItemHref(nativeItem, recipeIds)).toBe(`/culinary/${nativeItem.slug}`);
    expect(isCanonicalCulinaryPath(nativeItem, `/culinary/${nativeItem.slug}`, recipeIds)).toBe(true);
    expect(getPublishedNativeCulinaryItemStaticParams()).toHaveLength(16);
    expect(getPublishedRecipes()).toHaveLength(10);
    expect(publishedItems).toHaveLength(26);
  });
});
