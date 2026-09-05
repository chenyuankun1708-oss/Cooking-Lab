import type { CulinaryItem, Evidence, Source, Story } from "@/types/culinary";
import { validateEvidence, validateSource, validateStory } from "./culinary-validation";

export type StoryPublishingIssueCode = "story-schema" | "translation-review" | "reference-integrity" | "source-invalid";

export interface StoryPublishingIssue {
  code: StoryPublishingIssueCode;
  field: string;
  message: string;
}

export interface StoryPublishingContext {
  items: readonly CulinaryItem[];
  evidence: readonly Evidence[];
  sources: readonly Source[];
}

export interface StoryPublishingResult {
  storyId: string;
  eligible: boolean;
  issues: StoryPublishingIssue[];
}

export function evaluateStoryPublishingEligibility(story: Story, context: StoryPublishingContext): StoryPublishingResult {
  const issues: StoryPublishingIssue[] = validateStory(story).map((issue) => ({
    code: "story-schema",
    field: issue.field,
    message: issue.message,
  }));
  const defaultCopy = story.content.entries.find((entry) => entry.locale === story.content.defaultLocale);
  if (defaultCopy?.status !== "reviewed") {
    issues.push({ code: "translation-review", field: "content", message: "Story 默认语言必须通过 editorial review" });
  }

  const itemIds = new Set(context.items.map((item) => item.id));
  const linkedItemIds = story.relatedEntities.filter((entity) => entity.type === "culinary-item").map((entity) => entity.id);
  if (!linkedItemIds.length) {
    issues.push({ code: "reference-integrity", field: "relatedEntities", message: "公开 Story 必须关联至少一个 CulinaryItem" });
  }
  for (const itemId of linkedItemIds) {
    if (!itemIds.has(itemId)) {
      issues.push({ code: "reference-integrity", field: "relatedEntities", message: `Story 引用了不可见的 CulinaryItem: ${itemId}` });
    }
  }

  const evidenceById = new Map(context.evidence.map((record) => [record.id, record]));
  const sourceById = new Map(context.sources.map((source) => [source.id, source]));
  const usedEvidenceIds = new Set(story.claims.flatMap((claim) => claim.evidenceIds));

  for (const evidenceId of usedEvidenceIds) {
    const evidence = evidenceById.get(evidenceId);
    if (!evidence) {
      issues.push({ code: "reference-integrity", field: "claims.evidenceIds", message: `Story 引用了不存在的 Evidence: ${evidenceId}` });
      continue;
    }
    for (const issue of validateEvidence(evidence, new Set(sourceById.keys()))) {
      issues.push({ code: "reference-integrity", field: issue.field, message: issue.message });
    }
    const source = sourceById.get(evidence.sourceId);
    if (!source) continue;
    for (const issue of validateSource(source)) {
      issues.push({ code: "source-invalid", field: issue.field, message: issue.message });
    }
    if (source.rights.status === "unknown" || source.health.status === "rights-changed") {
      issues.push({ code: "source-invalid", field: "source", message: `Source ${source.id} 尚未满足公开条件` });
    }
  }

  return { storyId: story.id, eligible: issues.length === 0, issues };
}

export function getPubliclyVisibleStories(stories: readonly Story[], context: StoryPublishingContext): Story[] {
  assertUniqueStoryIds(stories);
  return stories.filter((story) => story.publication.status === "published" && evaluateStoryPublishingEligibility(story, context).eligible);
}

export function assertPublishedStoriesEligible(stories: readonly Story[], context: StoryPublishingContext): void {
  assertUniqueStoryIds(stories);
  const failures = stories
    .filter((story) => story.publication.status === "published")
    .map((story) => evaluateStoryPublishingEligibility(story, context))
    .filter((result) => !result.eligible);
  if (!failures.length) return;
  throw new Error(failures.map((result) => `${result.storyId}: ${result.issues.map((issue) => `${issue.code} (${issue.field})`).join(", ")}`).join("; "));
}

function assertUniqueStoryIds(stories: readonly Story[]): void {
  const ids = stories.map((story) => story.id);
  if (new Set(ids).size !== ids.length) throw new Error("Story ID 重复");
}
