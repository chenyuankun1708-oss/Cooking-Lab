import {
  aromaVocabulary,
  flavorCharacterVocabulary,
  flavorPreferences,
  tasteVocabulary,
  textureVocabulary,
} from "@/data/flavor";
import type {
  FlavorPreferenceDefinition,
  FlavorPreferenceId,
  FlavorProfile,
  TasteIntensity,
} from "@/types/flavor";
import type { SupportedLocale } from "@/types/taxonomy";

export interface FlavorPreferenceScore {
  score: number;
  matchedPreferenceIds: FlavorPreferenceId[];
  description: string;
}

const preferenceById = new Map(flavorPreferences.map((item) => [item.id, item]));

export function getFlavorPreferenceLabel(id: FlavorPreferenceId, locale: SupportedLocale = "zh-CN"): string {
  return preferenceById.get(id)?.label[locale] ?? id;
}

export function listFlavorPreferenceOptions(locale: SupportedLocale = "zh-CN") {
  return flavorPreferences.map(({ id, label }) => ({ id, label: label[locale] }));
}

export function describeFlavorProfile(profile: FlavorProfile, locale: SupportedLocale = "zh-CN", limit = 3): string {
  const tastes = Object.entries(profile.tastes)
    .filter((entry): entry is [keyof FlavorProfile["tastes"], TasteIntensity] => Boolean(entry[1] && entry[1] >= 2))
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => tasteVocabulary[id]?.label[locale]);
  const supporting = [
    ...(profile.aromaIds ?? []).map((id) => aromaVocabulary[id].label[locale]),
    ...(profile.textureIds ?? []).map((id) => textureVocabulary[id].label[locale]),
    ...(profile.characterIds ?? []).map((id) => flavorCharacterVocabulary[id].label[locale]),
  ];
  return [...new Set([...tastes, ...supporting])].filter(Boolean).slice(0, limit).join(" · ");
}

export function getFlavorProfileLabels(profile: FlavorProfile, locale: SupportedLocale = "zh-CN") {
  return {
    tastes: Object.entries(profile.tastes).map(([id, intensity]) => ({
      id,
      label: tasteVocabulary[id as keyof typeof tasteVocabulary]?.label[locale] ?? id,
      intensity,
    })),
    aromas: (profile.aromaIds ?? []).map((id) => aromaVocabulary[id].label[locale]),
    textures: (profile.textureIds ?? []).map((id) => textureVocabulary[id].label[locale]),
    characters: (profile.characterIds ?? []).map((id) => flavorCharacterVocabulary[id].label[locale]),
  };
}

export function scoreFlavorPreferences(
  profile: FlavorProfile,
  preferenceIds: readonly FlavorPreferenceId[],
  locale: SupportedLocale = "zh-CN",
): FlavorPreferenceScore {
  const definitions = preferenceIds.map((id) => preferenceById.get(id)).filter((item): item is FlavorPreferenceDefinition => Boolean(item));
  if (!definitions.length) return { score: 0, matchedPreferenceIds: [], description: "" };

  const scored = definitions.map((definition) => ({ definition, score: scorePreference(profile, definition) }));
  const score = scored.reduce((sum, item) => sum + item.score, 0) / scored.length;
  const matchedPreferenceIds = scored.filter((item) => item.score >= 0.6).map((item) => item.definition.id);
  return {
    score,
    matchedPreferenceIds,
    description: describeFlavorProfile(profile, locale, 2),
  };
}

function scorePreference(profile: FlavorProfile, preference: FlavorPreferenceDefinition): number {
  const signals: Array<{ score: number; weight: number }> = [];
  for (const [tasteId, target] of Object.entries(preference.tasteTargets ?? {})) {
    if (!target) continue;
    const actual = profile.tastes[tasteId as keyof FlavorProfile["tastes"]] ?? 0;
    signals.push({ score: Math.max(0, 1 - Math.abs(actual - target.ideal) / target.tolerance), weight: 1 });
  }
  addGroupSignal(signals, profile.aromaIds, preference.aromaIds, 1.25);
  addGroupSignal(signals, profile.textureIds, preference.textureIds, 1);
  addGroupSignal(signals, profile.characterIds, preference.characterIds, 1.5);
  const weight = signals.reduce((sum, item) => sum + item.weight, 0);
  return weight ? signals.reduce((sum, item) => sum + item.score * item.weight, 0) / weight : 0;
}

function addGroupSignal<T extends string>(
  signals: Array<{ score: number; weight: number }>,
  actual: readonly T[] | undefined,
  preferred: readonly T[] | undefined,
  weight: number,
) {
  if (!preferred?.length) return;
  const actualSet = new Set(actual ?? []);
  signals.push({ score: preferred.some((id) => actualSet.has(id)) ? 1 : 0, weight });
}
