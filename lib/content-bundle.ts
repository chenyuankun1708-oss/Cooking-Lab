import type { CulinaryItem } from "@/types/culinary";
import type {
  ContentBundleManifestEntryV1,
  ContentBundleManifestIssue,
  ContentBundleManifestV1,
} from "@/types/content-bundle";
import { contentBundleManifestVersion } from "@/types/content-bundle";
import type { ContentRightsRegistry } from "@/types/content-rights";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export type ContentBundleLocaleReview = (item: CulinaryItem, locale: SupportedLocale) => boolean;

export function createContentBundleManifest(
  items: readonly CulinaryItem[],
  registry: ContentRightsRegistry,
  isLocaleReviewed: ContentBundleLocaleReview = (item, locale) =>
    item.content.entries.some((entry) => entry.locale === locale && entry.status === "reviewed"),
): ContentBundleManifestV1 {
  const decisionsByArtifactId = new Map(
    registry.decisions.map((decision) => [decision.artifactId, decision]),
  );

  const entries = items.map((item): ContentBundleManifestEntryV1 => {
    const primaryImageId = item.images.availability === "available"
      ? item.images.references.primaryImageId
      : "";
    const usageDecisionIds = registry.artifacts
      .filter((artifact) => isArtifactInItemBundle(artifact.subject, item.id, item.storyIds, primaryImageId))
      .map((artifact) => decisionsByArtifactId.get(artifact.id))
      .filter((decision) => decision !== undefined)
      .map((decision) => decision.id)
      .sort();

    return {
      itemId: item.id,
      slug: item.slug,
      itemType: item.itemType,
      reviewedLocales: supportedLocales.filter((locale) => isLocaleReviewed(item, locale)),
      storyIds: [...item.storyIds].sort(),
      primaryImageId,
      usageDecisionIds,
    };
  }).sort((left, right) => left.slug.localeCompare(right.slug));

  return { version: contentBundleManifestVersion, entries };
}

export function validateContentBundleManifest(
  manifest: ContentBundleManifestV1,
  publishedItems: readonly CulinaryItem[],
  registry: ContentRightsRegistry,
  isLocaleReviewed?: ContentBundleLocaleReview,
): ContentBundleManifestIssue[] {
  const issues: ContentBundleManifestIssue[] = [];
  const itemById = new Map(publishedItems.map((item) => [item.id, item]));
  const decisionById = new Map(registry.decisions.map((decision) => [decision.id, decision]));
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const sortedSlugs = manifest.entries.map((entry) => entry.slug).sort();

  manifest.entries.forEach((entry, index) => {
    const report = (code: ContentBundleManifestIssue["code"], message: string) => {
      issues.push({ code, itemId: entry.itemId, message });
    };

    if (seenIds.has(entry.itemId)) report("duplicate-item-id", "Manifest item ID must be unique");
    if (seenSlugs.has(entry.slug)) report("duplicate-slug", "Manifest slug must be unique");
    seenIds.add(entry.itemId);
    seenSlugs.add(entry.slug);

    if (entry.slug !== sortedSlugs[index]) report("entries-not-sorted", "Manifest entries must be sorted by slug");
    const publishedItem = itemById.get(entry.itemId);
    if (!publishedItem) report("unpublished-item-present", "Manifest contains an item outside the published boundary");
    else {
      const expectedImageId = publishedItem.images.availability === "available" ? publishedItem.images.references.primaryImageId : "";
      if (
        entry.slug !== publishedItem.slug
        || entry.itemType !== publishedItem.itemType
        || entry.primaryImageId !== expectedImageId
        || entry.storyIds.join(",") !== [...publishedItem.storyIds].sort().join(",")
      ) report("published-item-mismatch", "Manifest identity, Story, or Hero metadata is stale");
    }
    for (const locale of supportedLocales) {
      if (!entry.reviewedLocales.includes(locale)) report("missing-reviewed-locale", `Missing reviewed locale ${locale}`);
      else if (publishedItem && isLocaleReviewed && !isLocaleReviewed(publishedItem, locale)) report("missing-reviewed-locale", `Published item is not reviewed for ${locale}`);
    }
    if (!entry.primaryImageId.trim()) report("missing-primary-image", "Published content bundle requires a primary Hero image");
    if (!entry.usageDecisionIds.length) report("missing-usage-decision", "Published content bundle requires rights usage decisions");
    const expectedDecisionIds = registry.artifacts
      .filter((artifact) => isArtifactInItemBundle(artifact.subject, entry.itemId, entry.storyIds, entry.primaryImageId))
      .map((artifact) => artifact.usageDecisionId)
      .sort();
    if (entry.usageDecisionIds.join(",") !== expectedDecisionIds.join(",")) {
      report("usage-decision-mismatch", "Manifest usage decisions are stale");
    }
    for (const decisionId of expectedDecisionIds) {
      if (!entry.usageDecisionIds.includes(decisionId)) report("missing-usage-decision", `Bundle omits usage decision ${decisionId}`);
    }
    for (const decisionId of entry.usageDecisionIds) {
      const decision = decisionById.get(decisionId);
      if (!decision) report("missing-usage-decision", `Missing usage decision ${decisionId}`);
      else if (decision.decision === "block") report("blocked-usage-decision", `Usage decision ${decisionId} blocks publication`);
    }
  });

  for (const item of publishedItems) {
    if (!seenIds.has(item.id)) {
      issues.push({
        code: "published-item-missing",
        itemId: item.id,
        message: "Published item is missing from the content bundle manifest",
      });
    }
  }

  return issues.sort((left, right) =>
    `${left.itemId}:${left.code}`.localeCompare(`${right.itemId}:${right.code}`),
  );
}

function isArtifactInItemBundle(
  subject: ContentRightsRegistry["artifacts"][number]["subject"],
  itemId: string,
  storyIds: readonly string[],
  primaryImageId: string,
): boolean {
  if (subject.type === "culinary-item") return subject.id === itemId;
  if (subject.type === "story") return storyIds.includes(subject.id);
  if (subject.type === "image") return subject.id === primaryImageId;
  return false;
}

export function assertContentBundleManifestReady(
  manifest: ContentBundleManifestV1,
  publishedItems: readonly CulinaryItem[],
  registry: ContentRightsRegistry,
  isLocaleReviewed?: ContentBundleLocaleReview,
): void {
  const issues = validateContentBundleManifest(manifest, publishedItems, registry, isLocaleReviewed);
  if (!issues.length) return;
  throw new Error(`Content bundle manifest blocked: ${issues.map((issue) => `${issue.code}:${issue.itemId}`).join("; ")}`);
}
