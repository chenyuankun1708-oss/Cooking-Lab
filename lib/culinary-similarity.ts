import type { CulinaryItem } from "@/types/culinary";

export interface CulinarySimilarityResult {
  item: CulinaryItem;
  score: number;
  signals: Array<"same-type" | "same-cuisine" | "shared-taste" | "shared-aroma" | "shared-texture" | "shared-technique">;
}

export function rankSimilarCulinaryItems(
  anchor: CulinaryItem,
  library: readonly CulinaryItem[],
  limit = 4,
): CulinarySimilarityResult[] {
  return library
    .filter((candidate) => candidate.id !== anchor.id && candidate.publication.status === "published")
    .map((item) => scoreSimilarity(anchor, item))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.slug.localeCompare(b.item.slug))
    .slice(0, limit);
}

function scoreSimilarity(anchor: CulinaryItem, item: CulinaryItem): CulinarySimilarityResult {
  const signals: CulinarySimilarityResult["signals"] = [];
  let score = 0;
  if (anchor.itemType === item.itemType) { score += 3; signals.push("same-type"); }
  if (anchor.taxonomy.cuisine?.cuisineId && anchor.taxonomy.cuisine.cuisineId === item.taxonomy.cuisine?.cuisineId) { score += 4; signals.push("same-cuisine"); }
  if (overlap(Object.keys(anchor.flavor.tastes), Object.keys(item.flavor.tastes))) { score += 3; signals.push("shared-taste"); }
  if (overlap(anchor.flavor.aromaIds ?? [], item.flavor.aromaIds ?? [])) { score += 2; signals.push("shared-aroma"); }
  if (overlap(anchor.flavor.textureIds ?? [], item.flavor.textureIds ?? [])) { score += 2; signals.push("shared-texture"); }
  if (overlap(anchor.taxonomy.techniqueIds, item.taxonomy.techniqueIds)) { score += 2; signals.push("shared-technique"); }
  return { item, score, signals };
}

function overlap(a: readonly string[], b: readonly string[]): boolean {
  const right = new Set(b);
  return a.some((value) => right.has(value));
}
