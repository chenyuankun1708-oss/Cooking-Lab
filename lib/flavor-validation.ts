import {
  aromaVocabulary,
  flavorCharacterVocabulary,
  flavorPreferences,
  tasteVocabulary,
  textureVocabulary,
} from "@/data/flavor";
import type { FlavorProfile } from "@/types/flavor";

export interface FlavorValidationIssue {
  field: string;
  message: string;
}

const incompatibleCharacterPairs = [
  ["light", "hearty"],
] as const;

export function validateFlavorProfile(profile: FlavorProfile): FlavorValidationIssue[] {
  const issues: FlavorValidationIssue[] = [];
  for (const [id, intensity] of Object.entries(profile.tastes)) {
    if (!(id in tasteVocabulary)) issues.push({ field: `tastes.${id}`, message: `未知 taste ID: ${id}` });
    if (!Number.isInteger(intensity) || intensity < 0 || intensity > 4) {
      issues.push({ field: `tastes.${id}`, message: "taste intensity 必须是 0–4 的整数" });
    }
  }
  validateIds("aromaIds", profile.aromaIds, aromaVocabulary, issues);
  validateIds("textureIds", profile.textureIds, textureVocabulary, issues);
  validateIds("characterIds", profile.characterIds, flavorCharacterVocabulary, issues);
  const characters = new Set(profile.characterIds ?? []);
  for (const [left, right] of incompatibleCharacterPairs) {
    if (characters.has(left) && characters.has(right)) {
      issues.push({ field: "characterIds", message: `不兼容的 flavor character: ${left} / ${right}` });
    }
  }
  try {
    JSON.stringify(profile);
  } catch {
    issues.push({ field: "flavor", message: "Flavor Profile 必须可 JSON 序列化" });
  }
  return issues;
}

export function validateFlavorVocabulary(): FlavorValidationIssue[] {
  const issues: FlavorValidationIssue[] = [];
  const collections = [tasteVocabulary, aromaVocabulary, textureVocabulary, flavorCharacterVocabulary];
  for (const collection of collections) {
    const ids = Object.keys(collection);
    if (new Set(ids).size !== ids.length) issues.push({ field: "vocabulary", message: "Flavor vocabulary ID 重复" });
    for (const [id, item] of Object.entries(collection)) {
      if (item.id !== id) issues.push({ field: "vocabulary", message: `Flavor vocabulary key 与 ID 不一致: ${id}` });
      if (!item.label["zh-CN"].trim() || !item.label.en.trim()) issues.push({ field: "vocabulary", message: `Flavor vocabulary label 不能为空: ${id}` });
    }
  }
  const preferenceIds = flavorPreferences.map((item) => item.id);
  if (new Set(preferenceIds).size !== preferenceIds.length) issues.push({ field: "preferences", message: "Flavor preference ID 重复" });
  return issues;
}

function validateIds(
  field: string,
  ids: readonly string[] | undefined,
  registry: Readonly<Record<string, unknown>>,
  issues: FlavorValidationIssue[],
) {
  if (!ids) return;
  if (new Set(ids).size !== ids.length) issues.push({ field, message: `${field} 不能重复` });
  for (const id of ids) if (!(id in registry)) issues.push({ field, message: `${field} 存在未知 ID: ${id}` });
}
