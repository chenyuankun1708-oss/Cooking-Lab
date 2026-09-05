import type { CulinaryItem } from "@/types/culinary";

export function getCulinaryItemHref(item: Pick<CulinaryItem, "id" | "slug">, recipeItemIds: ReadonlySet<string>): string {
  return recipeItemIds.has(item.id) ? `/recipes/${item.slug}` : `/culinary/${item.slug}`;
}

export function isCanonicalCulinaryPath(
  item: Pick<CulinaryItem, "id" | "slug">,
  pathname: string,
  recipeItemIds: ReadonlySet<string>,
): boolean {
  return pathname === getCulinaryItemHref(item, recipeItemIds);
}
