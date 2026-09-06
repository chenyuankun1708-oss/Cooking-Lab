import { describe, expect, it } from "vitest";
import {
  contentRightsRegistry,
  getPublishedCulinaryItems,
  publishedContentBundleManifest,
} from "@/data/published-culinary-items";
import { validateContentBundleManifest } from "@/lib/content-bundle";

describe("M11 published content bundle manifest", () => {
  it("covers every current published item with stable identity, locales, Hero and rights decisions", () => {
    const items = getPublishedCulinaryItems();
    expect(publishedContentBundleManifest.version).toBe(1);
    expect(publishedContentBundleManifest.entries).toHaveLength(50);
    expect(publishedContentBundleManifest.entries.map((entry) => entry.slug)).toEqual(
      [...publishedContentBundleManifest.entries.map((entry) => entry.slug)].sort(),
    );
    expect(validateContentBundleManifest(publishedContentBundleManifest, items, contentRightsRegistry)).toEqual([]);
  });

  it("rejects stale, duplicate, untranslated, image-less or rights-incomplete entries", () => {
    const items = getPublishedCulinaryItems();
    const [first, second, ...rest] = publishedContentBundleManifest.entries;
    const invalid = {
      ...publishedContentBundleManifest,
      entries: [
        { ...second, slug: "zz-out-of-order" },
        {
          ...first,
          slug: "zz-out-of-order",
          itemId: "not-published",
          reviewedLocales: ["en" as const],
          primaryImageId: "",
          usageDecisionIds: ["missing-decision"],
        },
        ...rest.slice(1),
      ],
    };
    const codes = validateContentBundleManifest(invalid, items, contentRightsRegistry).map((issue) => issue.code);

    expect(codes).toEqual(expect.arrayContaining([
      "duplicate-slug",
      "entries-not-sorted",
      "published-item-mismatch",
      "unpublished-item-present",
      "published-item-missing",
      "missing-reviewed-locale",
      "missing-primary-image",
      "missing-usage-decision",
      "usage-decision-mismatch",
    ]));
  });

  it("rejects a committed manifest when a live content decision changes", () => {
    const items = getPublishedCulinaryItems();
    const [first, ...rest] = publishedContentBundleManifest.entries;
    const stale = {
      ...publishedContentBundleManifest,
      entries: [{ ...first, usageDecisionIds: first.usageDecisionIds.slice(1) }, ...rest],
    };

    expect(validateContentBundleManifest(stale, items, contentRightsRegistry)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "usage-decision-mismatch", itemId: first.itemId })]),
    );
  });
});
