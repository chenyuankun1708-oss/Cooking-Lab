import type { CulinaryItem } from "@/types/culinary";
import type { SupportedLocale } from "@/types/localization";
import { getLocalizedPath } from "./localization";

export function getCulinaryItemHref(item: Pick<CulinaryItem, "id" | "slug">, recipeItemIds: ReadonlySet<string>, locale?: SupportedLocale): string {
  void recipeItemIds;
  const path = `/recipes/${item.slug}`;
  return locale ? getLocalizedPath(locale, path) : path;
}

export function isCanonicalCulinaryPath(
  item: Pick<CulinaryItem, "id" | "slug">,
  pathname: string,
  recipeItemIds: ReadonlySet<string>,
): boolean {
  return pathname === getCulinaryItemHref(item, recipeItemIds);
}
