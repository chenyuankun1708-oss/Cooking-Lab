import { describe, expect, it } from "vitest";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { rankSimilarCulinaryItems } from "@/lib/culinary-similarity";

describe("culinary similarity", () => {
  it("is deterministic, excludes the anchor, and spans native culinary types", () => {
    const anchor = nativeCulinaryItems.find((item) => item.id === "longjing-green-tea")!;
    const first = rankSimilarCulinaryItems(anchor, nativeCulinaryItems);
    const second = rankSimilarCulinaryItems(anchor, [...nativeCulinaryItems].reverse());
    expect(first.map(({ item }) => item.id)).toEqual(second.map(({ item }) => item.id));
    expect(first).toHaveLength(4);
    expect(first.every(({ item }) => item.id !== anchor.id)).toBe(true);
    expect(first[0].signals).toContain("same-type");
  });
});
