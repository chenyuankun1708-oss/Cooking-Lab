import type { CulinaryItem, CulinaryItemType } from "@/types/culinary";
import type { SupportedLocale } from "@/types/localization";

export const contentBundleManifestVersion = 1 as const;
export const localContentPackageVersion = 1 as const;

export interface LocalContentPackageV1 {
  version: typeof localContentPackageVersion;
  itemId: string;
  slug: string;
  item: CulinaryItem;
  manifestEntry: ContentBundleManifestEntryV1;
  sourceKind: "legacy-recipe" | "legacy-native" | "standalone";
}

export interface ContentBundleManifestEntryV1 {
  itemId: string;
  slug: string;
  itemType: CulinaryItemType;
  reviewedLocales: readonly SupportedLocale[];
  storyIds: readonly string[];
  primaryImageId: string;
  usageDecisionIds: readonly string[];
}

export interface ContentBundleManifestV1 {
  version: typeof contentBundleManifestVersion;
  entries: readonly ContentBundleManifestEntryV1[];
}

export type ContentBundleManifestIssueCode =
  | "duplicate-item-id"
  | "duplicate-slug"
  | "entries-not-sorted"
  | "published-item-mismatch"
  | "published-item-missing"
  | "unpublished-item-present"
  | "missing-reviewed-locale"
  | "missing-primary-image"
  | "missing-usage-decision"
  | "usage-decision-mismatch"
  | "blocked-usage-decision";

export interface ContentBundleManifestIssue {
  code: ContentBundleManifestIssueCode;
  itemId: string;
  message: string;
}
