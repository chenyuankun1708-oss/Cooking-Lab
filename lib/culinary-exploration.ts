import { countries, cuisines, regions, techniques } from "@/data/taxonomy";
import type { CulinaryItem, CulinaryItemType } from "@/types/culinary";
import { culinaryItemTypes } from "@/types/culinary";
import { flavorPreferenceIds, type FlavorPreferenceId } from "@/types/flavor";
import type { SupportedLocale } from "@/types/localization";
import { cookingTimeBands, getCookingTimeBand, type CookingTimeBandId } from "./cooking-time";
import { describeFlavorProfile, scoreFlavorPreferences } from "./flavor";
import {
  buildCulinaryItemSummary,
  getCulinaryItemTypeLabel,
  listStoriesForCulinaryItem,
  type StoryExperienceContext,
} from "./story-experience";

export interface CulinaryCatalogFilters {
  query?: string;
  itemType?: CulinaryItemType;
  cuisineId?: string;
  countryId?: string;
  regionId?: string;
  techniqueId?: string;
  maxTime?: number;
  timeBandId?: CookingTimeBandId;
  flavorPreferenceId?: FlavorPreferenceId;
  story?: "available";
}

export interface CulinaryCatalogEntry {
  item: CulinaryItem;
  id: string;
  name: string;
  description: string;
  href: string;
  image: ReturnType<typeof buildCulinaryItemSummary>["image"];
  fallbackInitial: string;
  itemTypeLabel: string;
  placeLabel?: string;
  techniqueLabel?: string;
  flavorLabel: string;
  preparationLabel: string;
  totalMinutes?: number;
  hasStory: boolean;
}

export interface CulinaryCatalogOption {
  id: string;
  label: string;
  count: number;
}

const queryOrder = ["q", "type", "cuisine", "origin", "technique", "time", "pace", "flavor", "story"] as const;

export function parseCulinaryCatalogFilters(
  params: URLSearchParams,
  items: readonly CulinaryItem[],
): CulinaryCatalogFilters {
  const itemTypes = new Set(items.map((item) => item.itemType));
  const cuisinesInUse = new Set(items.flatMap((item) => item.taxonomy.cuisine?.cuisineId ?? []));
  const countriesInUse = new Set(items.flatMap((item) => item.taxonomy.origin?.countryId ?? []));
  const regionsInUse = new Set(items.flatMap((item) => item.taxonomy.origin?.regionId ?? []));
  const techniquesInUse = new Set(items.flatMap((item) => item.taxonomy.techniqueIds));
  const query = first(params.getAll("q"))?.trim().slice(0, 120) || undefined;
  const itemTypeValue = allowedFirst(params.getAll("type"), itemTypes);
  const cuisineId = allowedFirst(params.getAll("cuisine"), cuisinesInUse);
  const techniqueId = allowedFirst(params.getAll("technique"), techniquesInUse);
  const origin = first(params.getAll("origin"));
  const maxTimeValue = Number(first(params.getAll("time")));
  const maxTime = [20, 30, 45, 60].includes(maxTimeValue) ? maxTimeValue : undefined;
  const timeBandValue = first(params.getAll("pace"));
  const flavorValue = first(params.getAll("flavor"));

  return {
    ...(query ? { query } : {}),
    ...(culinaryItemTypes.includes(itemTypeValue as CulinaryItemType) ? { itemType: itemTypeValue as CulinaryItemType } : {}),
    ...(cuisineId ? { cuisineId } : {}),
    ...(origin?.startsWith("country:") && countriesInUse.has(origin.slice("country:".length))
      ? { countryId: origin.slice("country:".length) }
      : {}),
    ...(origin?.startsWith("region:") && regionsInUse.has(origin.slice("region:".length))
      ? { regionId: origin.slice("region:".length) }
      : {}),
    ...(techniqueId ? { techniqueId } : {}),
    ...(maxTime !== undefined ? { maxTime } : {}),
    ...(cookingTimeBands.some((band) => band.id === timeBandValue) ? { timeBandId: timeBandValue as CookingTimeBandId } : {}),
    ...(flavorPreferenceIds.includes(flavorValue as FlavorPreferenceId) ? { flavorPreferenceId: flavorValue as FlavorPreferenceId } : {}),
    ...(first(params.getAll("story")) === "available" ? { story: "available" } : {}),
  };
}

export function serializeCulinaryCatalogFilters(filters: CulinaryCatalogFilters): URLSearchParams {
  const values: Record<(typeof queryOrder)[number], string | undefined> = {
    q: filters.query?.trim().slice(0, 120) || undefined,
    type: filters.itemType,
    cuisine: filters.cuisineId,
    origin: filters.countryId ? `country:${filters.countryId}` : filters.regionId ? `region:${filters.regionId}` : undefined,
    technique: filters.techniqueId,
    time: filters.maxTime?.toString(),
    pace: filters.timeBandId,
    flavor: filters.flavorPreferenceId,
    story: filters.story,
  };
  const params = new URLSearchParams();
  for (const key of queryOrder) {
    if (values[key]) params.set(key, values[key]);
  }
  return params;
}

export function exploreCulinaryCatalog(
  items: readonly CulinaryItem[],
  filters: CulinaryCatalogFilters,
  context: StoryExperienceContext,
  locale: SupportedLocale,
): CulinaryCatalogEntry[] {
  const query = filters.query?.trim().toLocaleLowerCase(locale);
  return items.flatMap((item) => {
    const summary = buildCulinaryItemSummary(item, context);
    const stories = listStoriesForCulinaryItem(item, context.stories);
    const totalMinutes = getPreparationMinutes(item);
    if (query && !`${summary.name} ${summary.description}`.toLocaleLowerCase(locale).includes(query)) return [];
    if (filters.itemType && item.itemType !== filters.itemType) return [];
    if (filters.cuisineId && item.taxonomy.cuisine?.cuisineId !== filters.cuisineId) return [];
    if (filters.countryId && item.taxonomy.origin?.countryId !== filters.countryId) return [];
    if (filters.regionId && item.taxonomy.origin?.regionId !== filters.regionId) return [];
    if (filters.techniqueId && !item.taxonomy.techniqueIds.includes(filters.techniqueId)) return [];
    if (filters.maxTime !== undefined && totalMinutes !== undefined && totalMinutes > filters.maxTime) return [];
    if (filters.timeBandId && totalMinutes !== undefined && getCookingTimeBand(totalMinutes).id !== filters.timeBandId) return [];
    if (filters.flavorPreferenceId && scoreFlavorPreferences(item.flavor, [filters.flavorPreferenceId]).score < 0.6) return [];
    if (filters.story === "available" && stories.length === 0) return [];

    return [{
      item,
      id: item.id,
      name: summary.name,
      description: summary.description,
      href: summary.href,
      image: summary.image,
      fallbackInitial: summary.fallbackInitial,
      itemTypeLabel: summary.itemTypeLabel,
      placeLabel: summary.placeLabel,
      techniqueLabel: item.taxonomy.techniqueIds[0]
        ? techniques[item.taxonomy.techniqueIds[0]]?.label[locale] ?? item.taxonomy.techniqueIds[0]
        : undefined,
      flavorLabel: describeFlavorProfile(item.flavor, locale, 2),
      preparationLabel: getPreparationLabel(item, locale),
      totalMinutes,
      hasStory: stories.length > 0,
    }];
  });
}

export function listCulinaryTypeOptions(items: readonly CulinaryItem[], locale: SupportedLocale): CulinaryCatalogOption[] {
  return countOptions(items.map((item) => item.itemType), (id) => getCulinaryItemTypeLabel(id as CulinaryItemType, locale));
}

export function listCulinaryCuisineOptions(items: readonly CulinaryItem[], locale: SupportedLocale): CulinaryCatalogOption[] {
  return countOptions(items.flatMap((item) => item.taxonomy.cuisine?.cuisineId ?? []), (id) => cuisines[id]?.label[locale] ?? id);
}

export function listCulinaryCountryOptions(items: readonly CulinaryItem[], locale: SupportedLocale): CulinaryCatalogOption[] {
  return countOptions(items.flatMap((item) => item.taxonomy.origin?.countryId ?? []), (id) => countries[id]?.label[locale] ?? id);
}

export function listCulinaryRegionOptions(items: readonly CulinaryItem[], locale: SupportedLocale): CulinaryCatalogOption[] {
  return countOptions(items.flatMap((item) => item.taxonomy.origin?.regionId ?? []), (id) => regions[id]?.label[locale] ?? id);
}

export function listCulinaryTechniqueOptions(items: readonly CulinaryItem[], locale: SupportedLocale): CulinaryCatalogOption[] {
  return countOptions(items.flatMap((item) => item.taxonomy.techniqueIds), (id) => techniques[id]?.label[locale] ?? id);
}

function getPreparationMinutes(item: CulinaryItem): number | undefined {
  if ("time" in item.preparation) return item.preparation.time.totalMinutes;
  if (item.preparation.kind === "serving-guidance") return item.preparation.estimatedMinutes;
  return undefined;
}

function getPreparationLabel(item: CulinaryItem, locale: SupportedLocale): string {
  if (item.preparation.kind === "no-consumer-preparation") {
    return locale === "zh-CN" ? "无需消费者制作" : "No consumer preparation";
  }
  if (item.preparation.kind === "serving-guidance") {
    return locale === "zh-CN" ? `服务建议 ${item.preparation.estimatedMinutes} 分钟` : `${item.preparation.estimatedMinutes} min serving guidance`;
  }
  return locale === "zh-CN" ? `${item.preparation.time.totalMinutes} 分钟` : `${item.preparation.time.totalMinutes} min`;
}

function countOptions(ids: readonly string[], labelFor: (id: string) => string): CulinaryCatalogOption[] {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => ({ id, label: labelFor(id), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function first(values: readonly string[]): string | undefined {
  return values[0];
}

function allowedFirst(values: readonly string[], allowed: ReadonlySet<string>): string | undefined {
  return values.find((value) => allowed.has(value));
}
