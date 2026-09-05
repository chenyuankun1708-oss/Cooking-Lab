import { countries, cuisines, regions } from "@/data/taxonomy";
import type { CulinaryItem, Evidence, RelatedEntityType, Source, Story } from "@/types/culinary";
import type { RecipeImage } from "@/types/image";
import type { SupportedLocale } from "@/types/localization";
import { resolveTranslation } from "./localization";
import { getCulinaryItemHref } from "./culinary-routes";

export interface CulinaryItemSummary {
  id: string;
  name: string;
  description: string;
  href: string;
  itemTypeLabel: string;
  placeLabel?: string;
  image?: RecipeImage;
  fallbackInitial: string;
}

export interface StoryPreview {
  id: string;
  href: string;
  title: string;
  dek: string;
  typeLabel: string;
  readingTimeLabel: string;
  relatedItemName: string;
  image?: RecipeImage;
  fallbackInitial: string;
}

export interface ConsumerSource {
  title: string;
  byline: string;
  locatorLabel?: string;
  href?: string;
}

export interface StoryContextChip {
  type: Exclude<RelatedEntityType, "culinary-item">;
  label: string;
}

export interface StoryPageModel extends StoryPreview {
  sections: Array<{ heading: string; paragraphs: string[] }>;
  evidenceContext: string;
  contextChips: StoryContextChip[];
  culinaryItems: CulinaryItemSummary[];
  relatedItems: CulinaryItemSummary[];
  relatedStories: StoryPreview[];
  sources: ConsumerSource[];
}

export interface StoryExperienceContext {
  items: readonly CulinaryItem[];
  stories: readonly Story[];
  evidence: readonly Evidence[];
  sources: readonly Source[];
  images: readonly RecipeImage[];
  recipeItemIds: ReadonlySet<string>;
  storyTypeLabels: Readonly<Record<Story["type"], string>>;
  relatedEntityLabels: Readonly<Partial<Record<RelatedEntityType, Readonly<Record<string, string>>>>>;
  locale?: SupportedLocale;
}

const itemTypeLabels: Readonly<Record<CulinaryItem["itemType"], string>> = {
  dish: "料理",
  dessert: "甜品",
  tea: "茶",
  coffee: "咖啡",
  "non-alcoholic-drink": "无酒精饮品",
  "alcoholic-drink": "酒精饮品",
};

const evidenceLocatorLabels: Readonly<Record<Evidence["locators"][number]["kind"], string>> = {
  page: "页码",
  chapter: "章节",
  section: "段落",
  paragraph: "段落",
  timestamp: "时间点",
  folio: "叶码",
  other: "位置",
};

export function buildStoryPreview(story: Story, context: StoryExperienceContext): StoryPreview {
  const locale = context.locale ?? "zh-CN";
  const copy = resolveTranslation(story.content, locale).value;
  const relatedItems = findExplicitStoryItems(story, context.items);
  const leadItem = relatedItems[0];
  const image = leadItem ? getItemHeroImage(leadItem, context.images) : undefined;
  const characterCount = copy.dek.length + copy.sections.reduce(
    (total, section) => total + section.heading.length + section.paragraphs.join("").length,
    0,
  );
  return {
    id: story.id,
    href: `/stories/${story.id}`,
    title: copy.title,
    dek: copy.dek,
    typeLabel: context.storyTypeLabels[story.type],
    readingTimeLabel: `约 ${Math.max(2, Math.ceil(characterCount / 400))} 分钟`,
    relatedItemName: leadItem ? resolveTranslation(leadItem.content, locale).value.name : "料理故事",
    image,
    fallbackInitial: [...copy.title][0] ?? "故",
  };
}

export function buildStoryPageModel(story: Story, context: StoryExperienceContext): StoryPageModel {
  const locale = context.locale ?? "zh-CN";
  const copy = resolveTranslation(story.content, locale).value;
  const explicitItems = findExplicitStoryItems(story, context.items);
  const relatedItems = rankRelatedItems(explicitItems, context.items)
    .filter((item) => !explicitItems.some((explicit) => explicit.id === item.id))
    .slice(0, 4);
  const evidenceById = new Map(context.evidence.map((record) => [record.id, record]));
  const sourceById = new Map(context.sources.map((source) => [source.id, source]));

  return {
    ...buildStoryPreview(story, context),
    sections: copy.sections.map((section) => ({ heading: section.heading, paragraphs: [...section.paragraphs] })),
    evidenceContext: getClaimAwareContext(story),
    contextChips: story.relatedEntities.flatMap((entity) => {
      if (entity.type === "culinary-item") return [];
      const label = context.relatedEntityLabels[entity.type]?.[entity.id];
      return label ? [{ type: entity.type, label }] : [];
    }),
    culinaryItems: explicitItems.map((item) => buildCulinaryItemSummary(item, context)),
    relatedItems: relatedItems.map((item) => buildCulinaryItemSummary(item, context)),
    relatedStories: rankRelatedStories(story, explicitItems, context)
      .slice(0, 2)
      .map((candidate) => buildStoryPreview(candidate, context)),
    sources: collectConsumerSources(story, evidenceById, sourceById),
  };
}

export function buildCulinaryItemSummary(item: CulinaryItem, context: StoryExperienceContext): CulinaryItemSummary {
  const locale = context.locale ?? "zh-CN";
  const copy = resolveTranslation(item.content, locale).value;
  return {
    id: item.id,
    name: copy.name,
    description: copy.description,
    href: getCulinaryItemHref(item, context.recipeItemIds),
    itemTypeLabel: getCulinaryItemTypeLabel(item.itemType),
    placeLabel: getCulinaryItemPlaceLabel(item, locale),
    image: getItemHeroImage(item, context.images),
    fallbackInitial: [...copy.name][0] ?? "食",
  };
}

export function getCulinaryItemTypeLabel(itemType: CulinaryItem["itemType"]): string {
  return itemTypeLabels[itemType];
}

export function getCulinaryItemPlaceLabel(item: CulinaryItem, locale: SupportedLocale = "zh-CN"): string | undefined {
  return getItemPlaceLabel(item, locale);
}

export function getCulinaryItemHeroImage(item: CulinaryItem, images: readonly RecipeImage[]): RecipeImage | undefined {
  return getItemHeroImage(item, images);
}

export function getClaimAwareContext(story: Story): string {
  const kinds = new Set(story.claims.map((claim) => claim.kind));
  if (kinds.has("legend-folklore")) {
    return "这里记录的是被讲述的传说或民间故事，不把它当作已被证实的历史事实。";
  }
  if (kinds.has("disputed-attribution")) {
    return "关于人物与发明归属，现有资料仍有争议。正文保留了可以确认的关联，也明确标出了不能由证据直接推出的部分。";
  }
  if (kinds.has("documented-tradition")) {
    return "这篇故事谈论的是被机构或文献记录的传统与实践，不由此推导唯一发源地、最早发明者或精确年代。";
  }
  return "正文中的具体历史或技术主张来自可重新定位的资料；编辑性连接和阅读提示不作为新的历史断言。";
}

function findExplicitStoryItems(story: Story, items: readonly CulinaryItem[]): CulinaryItem[] {
  const explicitIds = new Set(story.relatedEntities.filter((entity) => entity.type === "culinary-item").map((entity) => entity.id));
  return items.filter((item) => explicitIds.has(item.id) || item.storyIds.includes(story.id));
}

function rankRelatedItems(anchors: readonly CulinaryItem[], items: readonly CulinaryItem[]): CulinaryItem[] {
  return items
    .map((item) => ({ item, score: Math.max(0, ...anchors.map((anchor) => scoreItemRelation(anchor, item))) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .map(({ item }) => item);
}

function rankRelatedStories(story: Story, anchors: readonly CulinaryItem[], context: StoryExperienceContext): Story[] {
  const entityKeys = new Set(story.relatedEntities.filter((entity) => entity.type !== "culinary-item").map((entity) => `${entity.type}:${entity.id}`));
  return context.stories
    .filter((candidate) => candidate.id !== story.id)
    .map((candidate) => {
      const candidateItems = findExplicitStoryItems(candidate, context.items);
      const itemScore = Math.max(0, ...anchors.flatMap((anchor) => candidateItems.map((item) => scoreItemRelation(anchor, item))));
      const sharedEntityScore = candidate.relatedEntities.some((entity) => entityKeys.has(`${entity.type}:${entity.id}`)) ? 5 : 0;
      const typeScore = candidate.type === story.type ? 1 : 0;
      return { candidate, score: itemScore + sharedEntityScore + typeScore };
    })
    .filter(({ score }) => score >= 5)
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .map(({ candidate }) => candidate);
}

function scoreItemRelation(left: CulinaryItem, right: CulinaryItem): number {
  if (left.id === right.id) return 100;
  let score = 0;
  if (left.taxonomy.origin?.regionId && left.taxonomy.origin.regionId === right.taxonomy.origin?.regionId) score += 5;
  if (left.taxonomy.origin?.countryId && left.taxonomy.origin.countryId === right.taxonomy.origin?.countryId) score += 2;
  if (left.taxonomy.cuisine?.cuisineId && left.taxonomy.cuisine.cuisineId === right.taxonomy.cuisine?.cuisineId) score += 3;
  if (left.itemType === right.itemType) score += 0.5;
  const techniqueIds = new Set(left.taxonomy.techniqueIds);
  score += right.taxonomy.techniqueIds.filter((id) => techniqueIds.has(id)).length * 2;
  const ingredientIds = new Set(getIngredientIds(left));
  score += Math.min(2, getIngredientIds(right).filter((id) => ingredientIds.has(id)).length * 0.5);
  return score;
}

function getIngredientIds(item: CulinaryItem): string[] {
  return "inputs" in item.preparation ? item.preparation.inputs.map((input) => input.ingredientId) : [];
}

function getItemHeroImage(item: CulinaryItem, images: readonly RecipeImage[]): RecipeImage | undefined {
  if (item.images.availability === "none") return undefined;
  const { primaryImageId } = item.images.references;
  const image = images.find((candidate) => candidate.id === primaryImageId);
  return image?.role === "hero" ? image : undefined;
}

function getItemPlaceLabel(item: CulinaryItem, locale: SupportedLocale): string | undefined {
  const countryId = item.taxonomy.origin?.countryId;
  const regionId = item.taxonomy.origin?.regionId;
  const cuisineId = item.taxonomy.cuisine?.cuisineId;
  const labels = [
    regionId ? regions[regionId]?.label[locale] : undefined,
    countryId ? countries[countryId]?.label[locale] : undefined,
    cuisineId ? cuisines[cuisineId]?.label[locale] : undefined,
  ].filter((label): label is string => Boolean(label));
  return [...new Set(labels)].join(" · ") || undefined;
}

function collectConsumerSources(
  story: Story,
  evidenceById: ReadonlyMap<string, Evidence>,
  sourceById: ReadonlyMap<string, Source>,
): ConsumerSource[] {
  const evidenceBySource = new Map<string, Evidence[]>();
  for (const evidenceId of new Set(story.claims.flatMap((claim) => claim.evidenceIds))) {
    const evidence = evidenceById.get(evidenceId);
    if (!evidence) continue;
    evidenceBySource.set(evidence.sourceId, [...(evidenceBySource.get(evidence.sourceId) ?? []), evidence]);
  }
  return [...evidenceBySource].flatMap(([sourceId, records]) => {
    const source = sourceById.get(sourceId);
    if (!source) return [];
    const locatorLabel = [...new Set(records.flatMap((record) => record.locators.map(
      (locator) => `${evidenceLocatorLabels[locator.kind]}：${locator.value}`,
    )))].join("；") || undefined;
    return [{
      title: source.title,
      byline: [source.authorNames.join("、"), source.publisherOrInstitution, source.publication?.dateText].filter(Boolean).join(" · "),
      locatorLabel,
      href: getSourceHref(source),
    }];
  });
}

function getSourceHref(source: Source): string | undefined {
  const web = source.locators.find((locator) => locator.kind === "url");
  if (web?.kind === "url") return web.url;
  const doi = source.locators.find((locator) => locator.kind === "doi");
  return doi?.kind === "doi" ? `https://doi.org/${encodeURIComponent(doi.doi)}` : undefined;
}
