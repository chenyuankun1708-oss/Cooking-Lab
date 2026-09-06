import type {
  ClaimKind,
  CulinaryItem,
  Evidence,
  PreparationStep,
  Source,
  Story,
  StoryType,
} from "@/types/culinary";
import type { LocalContentPackageV1 } from "@/types/content-bundle";
import { localContentPackageVersion } from "@/types/content-bundle";
import type { RecipeImage } from "@/types/image";
import type { SupportedLocale, TranslationSet } from "@/types/localization";
import type { ResearchRecord, ResearchTemplateId } from "@/types/research";

export const m11ReviewedAt = "2026-09-06";

export function bilingual<T>(zh: T, en: T): TranslationSet<T> {
  return {
    defaultLocale: "zh-CN",
    entries: [
      { locale: "zh-CN", status: "reviewed", value: zh },
      { locale: "en", status: "reviewed", value: en },
    ],
  };
}

export function bilingualStep(
  order: number,
  zh: { instruction: string; rationale: string; stateCue: string },
  en: { instruction: string; rationale: string; stateCue: string },
  durationMinutes?: number,
): PreparationStep {
  return {
    order,
    content: bilingual(zh, en),
    ...(durationMinutes === undefined ? {} : { durationMinutes }),
  };
}

export function m11ReferenceSource(input: {
  id: string;
  title: string;
  publisherOrInstitution: string;
  url: string;
  type?: Source["type"];
  reliability?: Source["reliability"];
  authorNames?: string[];
  editorialNotes: string;
}): Source {
  return {
    id: input.id,
    type: input.type ?? "publisher",
    title: input.title,
    publisherOrInstitution: input.publisherOrInstitution,
    authorNames: input.authorNames ?? [],
    locators: [{ kind: "url", url: input.url, accessedAt: m11ReviewedAt }],
    rights: {
      status: "reference-only",
      notes: "Only narrow facts and preparation checks are used. Source wording, structure, imagery, video, subtitles, and transcripts are not copied or stored.",
    },
    health: { status: "active", checkedAt: m11ReviewedAt },
    reliability: input.reliability ?? "authoritative-secondary",
    editorialNotes: input.editorialNotes,
  };
}

export function m11Evidence(input: {
  id: string;
  sourceId: string;
  relation?: Evidence["relation"];
  strength?: Evidence["strength"];
  locator: string;
  editorialNote: string;
}): Evidence {
  return {
    id: input.id,
    sourceId: input.sourceId,
    relation: input.relation ?? "supports",
    strength: input.strength ?? "strong",
    locators: [{ kind: "section", value: input.locator }],
    editorialNote: input.editorialNote,
  };
}

export function m11Story(input: {
  id: string;
  itemId: string;
  type: StoryType;
  kind: ClaimKind;
  evidenceIds: [string, ...string[]];
  zh: {
    title: string;
    dek: string;
    firstHeading: string;
    firstParagraphs: [string, ...string[]];
    secondHeading: string;
    secondParagraphs: [string, ...string[]];
    claim: string;
  };
  en: {
    title: string;
    dek: string;
    firstHeading: string;
    firstParagraphs: [string, ...string[]];
    secondHeading: string;
    secondParagraphs: [string, ...string[]];
    claim: string;
  };
}): Story {
  const claimId = `${input.id}-claim`;
  return {
    id: input.id,
    type: input.type,
    content: bilingual(
      {
        title: input.zh.title,
        dek: input.zh.dek,
        sections: [
          { heading: input.zh.firstHeading, paragraphs: input.zh.firstParagraphs },
          { heading: input.zh.secondHeading, paragraphs: input.zh.secondParagraphs },
        ],
      },
      {
        title: input.en.title,
        dek: input.en.dek,
        sections: [
          { heading: input.en.firstHeading, paragraphs: input.en.firstParagraphs },
          { heading: input.en.secondHeading, paragraphs: input.en.secondParagraphs },
        ],
      },
    ),
    claims: [{
      id: claimId,
      kind: input.kind,
      content: bilingual({ statement: input.zh.claim }, { statement: input.en.claim }),
      evidenceIds: input.evidenceIds,
    }],
    relatedEntities: [{ type: "culinary-item", id: input.itemId }],
    publication: { status: "published" },
  };
}

export function m11ResearchRecord(input: {
  itemId: string;
  templateId: ResearchTemplateId;
  sourceIds: [string, string, ...string[]];
  claim: string;
  evidenceIds: [string, ...string[]];
}): ResearchRecord {
  return {
    id: `m11-research-${input.itemId}`,
    subject: { type: "culinary-item", id: input.itemId },
    templateId: input.templateId,
    question: `Which independently verifiable facts support the identity, preparation, and bounded cultural context of ${input.itemId}?`,
    sourceDecisions: input.sourceIds.map((sourceId, index) => ({
      id: `m11-${input.itemId}-source-${index + 1}`,
      disposition: "accepted" as const,
      sourceId,
      uses: ["identity", "preparation", "culture"] as ["identity", "preparation", "culture"],
      rationale: "Reference-only cross-check; Cooking Lab uses an independently structured bilingual synthesis and does not copy source expression.",
    })),
    claims: [{
      id: `m11-${input.itemId}-claim-assessment`,
      statement: input.claim,
      kind: "documented-fact",
      disposition: "include",
      evidenceIds: input.evidenceIds,
      rationale: "The public Story keeps this claim narrow and traceable to the cited evidence.",
    }],
    unresolvedQuestions: [],
    editorialDecision: "Publish as an original Cooking Lab synthesis with consumer-facing sources and no claim of authorization or endorsement.",
    reviewer: "Cooking Lab risk-based editorial pipeline",
    reviewedAt: m11ReviewedAt,
    status: "closed",
  };
}

export function m11OriginalHero(itemId: string, alt: string): RecipeImage {
  return {
    id: `${itemId}-hero`,
    src: `/images/culinary/${itemId}/hero.webp`,
    alt: `Cooking Lab 原创抽象料理插画：${alt}`,
    role: "hero",
    delivery: "local",
    width: 1500,
    height: 1000,
    aspectRatio: "3:2",
    focalPoint: { x: 0.5, y: 0.5 },
    source: "self-created",
    license: "self-created",
    attribution: "Cooking Lab original editorial illustration",
  };
}

export function defineStandaloneContentPackage(item: CulinaryItem): LocalContentPackageV1 {
  if (item.images.availability !== "available") {
    throw new Error(`Standalone package ${item.id} requires a primary image`);
  }
  const baseDecisionIds = ["cost", "identity", "nutrition", "preparation"]
    .map((kind) => `usage-${item.id}-${kind}`);
  const usageDecisionIds = [
    ...baseDecisionIds,
    `usage-${item.images.references.primaryImageId}-image`,
    ...item.storyIds.map((storyId) => `usage-${storyId}-story`),
  ].sort();
  return Object.freeze({
    version: localContentPackageVersion,
    itemId: item.id,
    slug: item.slug,
    item,
    manifestEntry: {
      itemId: item.id,
      slug: item.slug,
      itemType: item.itemType,
      reviewedLocales: ["zh-CN", "en"] satisfies SupportedLocale[],
      storyIds: [...item.storyIds].sort(),
      primaryImageId: item.images.references.primaryImageId,
      usageDecisionIds,
    },
    sourceKind: "standalone",
  });
}
