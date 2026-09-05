import type { CulinaryItem, Evidence, Source, Story } from "@/types/culinary";
import { validateCulinaryItem, validateEvidence, validateSource, validateStory, type CulinaryValidationIssue } from "./culinary-validation";

export type CulinaryPublishingIssueCode =
  | "item-schema"
  | "translation-review"
  | "primary-image"
  | "nutrition-model"
  | "cost-model"
  | "reference-integrity"
  | "story-invalid"
  | "source-invalid"
  | "evidence-invalid";

export interface CulinaryPublishingIssue {
  code: CulinaryPublishingIssueCode;
  field: string;
  message: string;
}

export interface CulinaryPublishingContext {
  imageIds: ReadonlySet<string>;
  stories: readonly Story[];
  sources: readonly Source[];
  evidence: readonly Evidence[];
}

export interface CulinaryPublishingResult {
  itemId: string;
  eligible: boolean;
  issues: CulinaryPublishingIssue[];
}

export function evaluateCulinaryItemPublishingEligibility(
  item: CulinaryItem,
  context: CulinaryPublishingContext,
): CulinaryPublishingResult {
  const issues: CulinaryPublishingIssue[] = [];
  const add = (code: CulinaryPublishingIssueCode, issue: Pick<CulinaryValidationIssue, "field" | "message">) => {
    issues.push({ code, field: issue.field, message: issue.message });
  };

  validateCulinaryItem(item).forEach((issue) => add("item-schema", issue));
  const defaultTranslation = item.content.entries.find((entry) => entry.locale === item.content.defaultLocale);
  if (defaultTranslation?.status !== "reviewed") {
    issues.push({ code: "translation-review", field: "content", message: "默认语言内容必须通过 editorial review" });
  }

  if (item.images.availability === "none") {
    issues.push({ code: "primary-image", field: "images", message: "公开 CulinaryItem 必须有 primary image" });
  } else {
    for (const imageId of item.images.references.imageIds) {
      if (!context.imageIds.has(imageId)) issues.push({ code: "reference-integrity", field: "images", message: `不存在的 image ID: ${imageId}` });
    }
  }

  if ((item.itemType === "dish" || item.itemType === "dessert") && item.nutrition.applicability !== "applicable") {
    issues.push({ code: "nutrition-model", field: "nutrition", message: "公开 dish/dessert 必须有可用 nutrition model" });
  }
  if ((item.itemType === "dish" || item.itemType === "dessert") && item.cost.source === "not-modeled") {
    issues.push({ code: "cost-model", field: "cost", message: "公开 dish/dessert 必须有可用 cost model" });
  }

  const storyById = new Map(context.stories.map((story) => [story.id, story]));
  const evidenceById = new Map(context.evidence.map((record) => [record.id, record]));
  const sourceById = new Map(context.sources.map((source) => [source.id, source]));
  const referencedEvidenceIds = new Set<string>();

  for (const storyId of item.storyIds) {
    const story = storyById.get(storyId);
    if (!story) {
      issues.push({ code: "reference-integrity", field: "storyIds", message: `不存在的 Story ID: ${storyId}` });
      continue;
    }
    validateStory(story).forEach((issue) => add("story-invalid", issue));
    for (const claim of story.claims) {
      claim.evidenceIds.forEach((evidenceId) => referencedEvidenceIds.add(evidenceId));
    }
  }

  for (const evidenceId of referencedEvidenceIds) {
    const record = evidenceById.get(evidenceId);
    if (!record) {
      issues.push({ code: "reference-integrity", field: "story.claims.evidenceIds", message: `不存在的 Evidence ID: ${evidenceId}` });
      continue;
    }
    validateEvidence(record, new Set(sourceById.keys())).forEach((issue) => add("evidence-invalid", issue));
    const source = sourceById.get(record.sourceId);
    if (source) {
      validateSource(source).forEach((issue) => add("source-invalid", issue));
      if (source.rights.status === "unknown") {
        issues.push({ code: "source-invalid", field: "rights", message: `Source ${source.id} 的 rights 尚未完成评估` });
      }
      if (source.health.status === "rights-changed") {
        issues.push({ code: "source-invalid", field: "health", message: `Source ${source.id} 的 rights 已变化，必须重新审核` });
      }
    }
  }

  return { itemId: item.id, eligible: issues.length === 0, issues };
}

export function isCulinaryItemPubliclyVisible(item: CulinaryItem, context: CulinaryPublishingContext): boolean {
  return item.publication.status === "published" && evaluateCulinaryItemPublishingEligibility(item, context).eligible;
}
