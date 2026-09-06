import { describe, expect, it } from "vitest";
import { getPublishedCulinaryItemsForLocale } from "@/data/published-culinary-items";
import { getStoryExperienceContext } from "@/data/published-stories";
import { culinaryItemTypes, type CulinaryItem } from "@/types/culinary";
import {
  exploreCulinaryCatalog,
  parseCulinaryCatalogFilters,
  serializeCulinaryCatalogFilters,
} from "../culinary-exploration";

const items = getPublishedCulinaryItemsForLocale("en");
const context = getStoryExperienceContext("en");

describe("unified culinary exploration", () => {
  it("lists every currently published item across all six culinary types", () => {
    const catalog = exploreCulinaryCatalog(items, {}, context, "en");
    expect(catalog).toHaveLength(50);
    expect(new Set(catalog.map(({ item }) => item.itemType))).toEqual(new Set(culinaryItemTypes));
    expect(catalog.every(({ href }) => href.startsWith("/en/recipes/"))).toBe(true);
  });

  it("filters story-bearing items through explicit item and Story relationships", () => {
    const results = exploreCulinaryCatalog(items, { story: "available" }, context, "en");
    expect(results).toHaveLength(6);
    expect(results.every(({ hasStory }) => hasStory)).toBe(true);
  });

  it("keeps ready-to-serve items in time browsing without inventing zero minutes", () => {
    const readyItem = {
      ...items[0],
      id: "ready-to-serve-fixture",
      slug: "ready-to-serve-fixture",
      itemType: "tea" as const,
      preparation: {
        kind: "no-consumer-preparation" as const,
        reason: "ready-to-serve" as const,
        content: { defaultLocale: "en" as const, entries: [{ locale: "en" as const, status: "reviewed" as const, value: { servingNote: "Serve as supplied." } }] },
      },
    } satisfies CulinaryItem;
    const results = exploreCulinaryCatalog([...items, readyItem], { maxTime: 20 }, { ...context, items: [...items, readyItem] }, "en");
    const ready = results.filter(({ item }) => item.preparation.kind === "no-consumer-preparation");
    expect(ready.length).toBeGreaterThan(0);
    expect(ready.every(({ totalMinutes, preparationLabel }) => totalMinutes === undefined && preparationLabel === "No consumer preparation")).toBe(true);
  });

  it("normalizes and serializes type, place, flavor, technique, time, and story filters", () => {
    const params = new URLSearchParams("q=tea&type=tea&cuisine=chinese&origin=country:china&technique=brewing&time=30&pace=quick&flavor=light&story=available");
    const filters = parseCulinaryCatalogFilters(params, items);
    expect(filters).toMatchObject({ query: "tea", itemType: "tea", countryId: "china", story: "available" });
    expect(serializeCulinaryCatalogFilters(filters).get("type")).toBe("tea");
    expect(serializeCulinaryCatalogFilters(filters).get("story")).toBe("available");
  });
});
