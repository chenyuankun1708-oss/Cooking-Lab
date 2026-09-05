import type { CulinaryItem } from "@/types/culinary";
import { validateImageAssets } from "./image-validation";
import {
  evaluateCulinaryItemPublishingEligibility,
  isCulinaryItemPubliclyVisible,
  type CulinaryPublishingContext,
} from "./culinary-publishing";

export interface CulinaryLibraryIssue {
  itemId: string;
  field: "id" | "slug" | "publication";
  message: string;
}

export function validateCulinaryLibraryIdentity(items: readonly CulinaryItem[]): CulinaryLibraryIssue[] {
  const issues: CulinaryLibraryIssue[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) issues.push({ itemId: item.id, field: "id", message: "CulinaryItem ID 重复" });
    if (slugs.has(item.slug)) issues.push({ itemId: item.id, field: "slug", message: "CulinaryItem slug 重复" });
    ids.add(item.id);
    slugs.add(item.slug);
  }
  return issues;
}

export function getPubliclyVisibleCulinaryItems(
  items: readonly CulinaryItem[],
  context: CulinaryPublishingContext,
): CulinaryItem[] {
  const identityIssues = validateCulinaryLibraryIdentity(items);
  if (identityIssues.length) throw new Error(formatIdentityIssues(identityIssues));
  return items.filter((item) => isCulinaryItemPubliclyVisible(item, context));
}

export function assertPublishedCulinaryItemsEligible(
  items: readonly CulinaryItem[],
  context: CulinaryPublishingContext,
): void {
  const identityIssues = validateCulinaryLibraryIdentity(items);
  const imageIssues = validateImageAssets(context.images);
  const failures = items
    .filter((item) => item.publication.status === "published")
    .map((item) => evaluateCulinaryItemPublishingEligibility(item, context))
    .filter((result) => !result.eligible);

  if (!identityIssues.length && !imageIssues.length && !failures.length) return;
  const identityDetail = identityIssues.length ? formatIdentityIssues(identityIssues) : "";
  const imageDetail = imageIssues.map((issue) => `${issue.imageId}: ${issue.message}`).join("; ");
  const publishingDetail = failures
    .map((result) => `${result.itemId}: ${result.issues.map((issue) => `${issue.code} (${issue.field})`).join(", ")}`)
    .join("; ");
  throw new Error(`Published CulinaryItems failed eligibility: ${[identityDetail, imageDetail, publishingDetail].filter(Boolean).join("; ")}`);
}

function formatIdentityIssues(issues: readonly CulinaryLibraryIssue[]): string {
  return issues.map((issue) => `${issue.itemId}: ${issue.message}`).join("; ");
}
