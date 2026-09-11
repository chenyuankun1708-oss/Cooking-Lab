import type { FlavorProfile } from "./flavor";

/**
 * Recipe database extension (M13 revised scope: recipe database first).
 *
 * The extension is an optional block on GameRecipeV1. Records that carry it
 * are database entries first; game export remains a separate, stricter
 * eligibility layer. Missing fields (heat, flavor, images) are legal null /
 * empty values in database entries and never become blockers on their own.
 */
export const recipeDatabaseExtensionVersion = "cooking-lab-recipe-database-v1" as const;

/** Category tags requested for the database scope. */
export const databaseCategoryTags = ["baking", "bartending", "dessert"] as const;
export type DatabaseCategoryTag = (typeof databaseCategoryTags)[number];

/**
 * Eligibility layers for the corpus.
 *
 * - `draft`: legacy value used before the database-first revision. Treated as
 *   equivalent to `database-entry` by validators.
 * - `database-entry`: stored in the database. Structural checks only.
 * - `exportable`: legacy value for game export. Equivalent to
 *   `game-exportable`.
 * - `game-exportable`: passes the full fail-closed export gate.
 */
export const databaseEligibilityValues = [
  "draft",
  "database-entry",
  "exportable",
  "game-exportable",
] as const;
export type DatabaseEligibility = (typeof databaseEligibilityValues)[number];

export function isDatabaseEntryEligibility(eligibility: string): eligibility is "draft" | "database-entry" {
  return eligibility === "draft" || eligibility === "database-entry";
}

export function isGameExportEligibility(eligibility: string): eligibility is "exportable" | "game-exportable" {
  return eligibility === "exportable" || eligibility === "game-exportable";
}

/** Source classification for loose ingestion. Web/game publishing gates still apply on top. */
export const databaseSourceTypes = [
  "web-migrated",
  "loc-public-domain",
  "web-curated",
  "ai-assisted",
  "original",
] as const;
export type DatabaseSourceType = (typeof databaseSourceTypes)[number];

export const databaseSourceTypesRequiringNotes: readonly DatabaseSourceType[] = ["web-curated", "ai-assisted"];

/** Image availability tiers inside the database. */
export const databaseImageStatuses = ["published", "internal", "missing"] as const;
export type DatabaseImageStatus = (typeof databaseImageStatuses)[number];

export interface DatabaseImageRefV1 {
  /** Web RecipeImage id when status is `published` and the image is tracked by the Web registry. */
  imageId?: string;
  status: DatabaseImageStatus;
  /** Why the image cannot go on the Web when status is `internal`. */
  licenseNote?: string;
}

/**
 * Tags reuse the Web taxonomy machine values (data/taxonomy.ts registries and
 * the CulinaryItem meal-role / serving-context vocabularies). Baking,
 * bartending and dessert are the new database category tags; any record may
 * combine several (for example a baked dessert carries both `baking` and
 * `dessert`). Fields not applicable to a category stay empty.
 */
export interface RecipeDatabaseTagsV1 {
  categoryTags: readonly DatabaseCategoryTag[];
  /** data/taxonomy.ts cuisine registry ids. */
  cuisineIds?: readonly string[];
  /** data/taxonomy.ts technique registry ids. */
  techniqueIds?: readonly string[];
  /** data/taxonomy.ts dietary tag ids. */
  dietaryTagIds?: readonly string[];
  /** CulinaryItem mealRole ids (starter/main/side/staple/soup/dessert/drink). */
  mealRoleIds?: readonly string[];
  /** CulinaryItem servingContext ids (afternoon-tea/aperitif/after-meal/...). */
  servingContextIds?: readonly string[];
}

/** Portion-level role, making seasoning/garnish marking explicit. */
export const portionRoleValues = ["main", "seasoning", "garnish", "optional"] as const;
export type PortionRole = (typeof portionRoleValues)[number];

export interface RecipeDatabaseExtensionV1 {
  extensionVersion: typeof recipeDatabaseExtensionVersion;
  tags: RecipeDatabaseTagsV1;
  /** Reuses the Web FlavorProfile; optional because flavor may be unknown. */
  flavor?: FlavorProfile;
  /** Graded image references; empty/`missing` when no image is available. */
  images: DatabaseImageRefV1[];
  /** Ingestion classification; always required on database entries. */
  sourceType: DatabaseSourceType;
  /** Required for web-curated / ai-assisted entries: usage-limitation note. */
  sourceNotes?: string;
}
