import { countries, cuisines, regions } from "@/data/taxonomy";
import { getLocalizedCulinaryCopy } from "@/data/localization/public-culinary";
import { getRecipeEditorialCopy } from "@/data/localization/public-recipes";
import { getLocalizedStoryTranslation } from "@/data/localization/public-stories";
import type { CulinaryItem, Evidence, RelatedEntityType, Source, Story } from "@/types/culinary";
import type { RecipeImage } from "@/types/image";
import type { LocalizedLabel, SupportedLocale } from "@/types/localization";
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
  storyTypeLabels: Readonly<Record<Story["type"], LocalizedLabel>>;
  relatedEntityLabels: Readonly<Partial<Record<RelatedEntityType, Readonly<Record<string, LocalizedLabel>>>>>;
  locale?: SupportedLocale;
}

const itemTypeLabels: Readonly<Record<CulinaryItem["itemType"], LocalizedLabel>> = {
  dish: { "zh-CN": "料理", en: "Dish" },
  dessert: { "zh-CN": "甜品", en: "Dessert" },
  tea: { "zh-CN": "茶", en: "Tea" },
  coffee: { "zh-CN": "咖啡", en: "Coffee" },
  "non-alcoholic-drink": { "zh-CN": "无酒精饮品", en: "Non-alcoholic drink" },
  "alcoholic-drink": { "zh-CN": "酒精饮品", en: "Alcoholic drink" },
};

const evidenceLocatorLabels: Readonly<Record<Evidence["locators"][number]["kind"], LocalizedLabel>> = {
  page: { "zh-CN": "页码", en: "Page" },
  chapter: { "zh-CN": "章节", en: "Chapter" },
  section: { "zh-CN": "段落", en: "Section" },
  paragraph: { "zh-CN": "段落", en: "Paragraph" },
  timestamp: { "zh-CN": "时间点", en: "Timestamp" },
  folio: { "zh-CN": "叶码", en: "Folio" },
  other: { "zh-CN": "位置", en: "Locator" },
};

export function buildStoryPreview(story: Story, context: StoryExperienceContext): StoryPreview {
  const locale = context.locale ?? "zh-CN";
  const copy = getLocalizedStoryTranslation(story.id, locale)?.story ?? resolveTranslation(story.content, locale).value;
  const relatedItems = findExplicitStoryItems(story, context.items);
  const leadItem = relatedItems[0];
  const image = leadItem ? getItemHeroImage(leadItem, context.images) : undefined;
  const characterCount = copy.dek.length + copy.sections.reduce(
    (total, section) => total + section.heading.length + section.paragraphs.join("").length,
    0,
  );
  return {
    id: story.id,
    href: `/${locale}/stories/${story.id}`,
    title: copy.title,
    dek: copy.dek,
    typeLabel: context.storyTypeLabels[story.type][locale],
    readingTimeLabel: locale === "zh-CN" ? `约 ${Math.max(2, Math.ceil(characterCount / 400))} 分钟` : `${Math.max(2, Math.ceil(characterCount / 850))} min read`,
    relatedItemName: leadItem ? resolveItemCopy(leadItem, locale).name : locale === "zh-CN" ? "料理故事" : "Culinary story",
    image,
    fallbackInitial: [...copy.title][0] ?? "故",
  };
}

export function buildStoryPageModel(story: Story, context: StoryExperienceContext): StoryPageModel {
  const locale = context.locale ?? "zh-CN";
  const copy = getLocalizedStoryTranslation(story.id, locale)?.story ?? resolveTranslation(story.content, locale).value;
  const explicitItems = findExplicitStoryItems(story, context.items);
  const relatedItems = rankRelatedItems(explicitItems, context.items)
    .filter((item) => !explicitItems.some((explicit) => explicit.id === item.id))
    .slice(0, 4);
  const evidenceById = new Map(context.evidence.map((record) => [record.id, record]));
  const sourceById = new Map(context.sources.map((source) => [source.id, source]));

  return {
    ...buildStoryPreview(story, context),
    sections: copy.sections.map((section) => ({ heading: section.heading, paragraphs: [...section.paragraphs] })),
    evidenceContext: getClaimAwareContext(story, locale),
    contextChips: story.relatedEntities.flatMap((entity) => {
      if (entity.type === "culinary-item") return [];
      const label = context.relatedEntityLabels[entity.type]?.[entity.id]?.[locale];
      return label ? [{ type: entity.type, label }] : [];
    }),
    culinaryItems: explicitItems.map((item) => buildCulinaryItemSummary(item, context)),
    relatedItems: relatedItems.map((item) => buildCulinaryItemSummary(item, context)),
    relatedStories: rankRelatedStories(story, explicitItems, context)
      .slice(0, 2)
      .map((candidate) => buildStoryPreview(candidate, context)),
    sources: collectConsumerSources(story, evidenceById, sourceById, locale),
  };
}

export function buildCulinaryItemSummary(item: CulinaryItem, context: StoryExperienceContext): CulinaryItemSummary {
  const locale = context.locale ?? "zh-CN";
  const copy = resolveItemCopy(item, locale);
  return {
    id: item.id,
    name: copy.name,
    description: copy.description,
    href: getCulinaryItemHref(item, context.recipeItemIds, locale),
    itemTypeLabel: getCulinaryItemTypeLabel(item.itemType, locale),
    placeLabel: getCulinaryItemPlaceLabel(item, locale),
    image: getItemHeroImage(item, context.images),
    fallbackInitial: [...copy.name][0] ?? "食",
  };
}

export function getCulinaryItemTypeLabel(itemType: CulinaryItem["itemType"], locale: SupportedLocale = "zh-CN"): string {
  return itemTypeLabels[itemType][locale];
}

export function getCulinaryItemPlaceLabel(item: CulinaryItem, locale: SupportedLocale = "zh-CN"): string | undefined {
  return getItemPlaceLabel(item, locale);
}

export function getCulinaryItemHeroImage(item: CulinaryItem, images: readonly RecipeImage[]): RecipeImage | undefined {
  return getItemHeroImage(item, images);
}

export function getClaimAwareContext(story: Story, locale: SupportedLocale = "zh-CN"): string {
  const kinds = new Set(story.claims.map((claim) => claim.kind));
  if (kinds.has("legend-folklore")) {
    return locale === "zh-CN" ? "这里记录的是被讲述的传说或民间故事，不把它当作已被证实的历史事实。" : "This records legend or folklore as it is told, not as verified historical fact.";
  }
  if (kinds.has("disputed-attribution")) {
    return locale === "zh-CN" ? "关于人物与发明归属，现有资料仍有争议。正文保留了可以确认的关联，也明确标出了不能由证据直接推出的部分。" : "Attribution to a person or inventor remains disputed. The story preserves documented links and marks what the evidence cannot establish.";
  }
  if (kinds.has("documented-tradition")) {
    return locale === "zh-CN" ? "这篇故事谈论的是被机构或文献记录的传统与实践，不由此推导唯一发源地、最早发明者或精确年代。" : "This story concerns a tradition documented by institutions or texts; it does not infer one birthplace, first inventor, or exact date.";
  }
  return locale === "zh-CN" ? "正文中的具体历史或技术主张来自可重新定位的资料；编辑性连接和阅读提示不作为新的历史断言。" : "Specific historical and technical claims come from retrievable sources; editorial transitions are not new historical assertions.";
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
  locale: SupportedLocale,
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
      (locator) => `${evidenceLocatorLabels[locator.kind][locale]}: ${locator.value}`,
    )))].join("；") || undefined;
    return [{
      title: source.title,
      byline: [source.authorNames.join(locale === "zh-CN" ? "、" : ", "), source.publisherOrInstitution, source.publication?.dateText].filter(Boolean).join(" · "),
      locatorLabel,
      href: getSourceHref(source),
    }];
  });
}

function resolveItemCopy(item: CulinaryItem, locale: SupportedLocale) {
  if (locale === "en") {
    const native = getLocalizedCulinaryCopy(item.id, locale);
    if (native) return native;
    const recipe = getRecipeEditorialCopy(item.slug, locale);
    if (recipe) return recipe;
  }
  return resolveTranslation(item.content, locale).value;
}

function getSourceHref(source: Source): string | undefined {
  const web = source.locators.find((locator) => locator.kind === "url");
  if (web?.kind === "url") return web.url;
  const doi = source.locators.find((locator) => locator.kind === "doi");
  return doi?.kind === "doi" ? `https://doi.org/${encodeURIComponent(doi.doi)}` : undefined;
}
