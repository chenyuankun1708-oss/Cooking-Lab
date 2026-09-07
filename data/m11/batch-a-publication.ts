import type { CulinaryItem, Story } from "@/types/culinary";
import type { LocalContentPackageV1 } from "@/types/content-bundle";
import {
  m11BatchAContentPackages,
  m11BatchAItems,
  m11BatchAStories,
} from "./batch-a";

// The authored Batch A sources stay draft. This explicit projection is the only
// publication boundary and is integrated only alongside current attestations,
// risk classification, sampling evidence, rights decisions, and the committed
// manifest. That keeps staging state separate from Production state.
export const m11BatchAPublishedItems: readonly CulinaryItem[] = Object.freeze(
  m11BatchAItems.map((item) => ({
    ...item,
    publication: { status: "published" as const },
  })),
);

export const m11BatchAPublishedStories: readonly Story[] = Object.freeze(
  m11BatchAStories.map((story) => ({
    ...story,
    publication: { status: "published" as const },
  })),
);

const publishedItemById = new Map(m11BatchAPublishedItems.map((item) => [item.id, item]));

export const m11BatchAPublishedContentPackages: readonly LocalContentPackageV1[] = Object.freeze(
  m11BatchAContentPackages.map((contentPackage) => {
    const item = publishedItemById.get(contentPackage.itemId);
    if (!item) throw new Error(`Missing Batch A publication item ${contentPackage.itemId}`);
    return Object.freeze({ ...contentPackage, item });
  }),
);
