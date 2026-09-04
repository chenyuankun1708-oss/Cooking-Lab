import type { LocalizedLabel } from "./taxonomy";

export const tasteIds = ["salty", "sweet", "sour", "bitter", "umami", "spicy"] as const;
export const aromaIds = [
  "garlicky",
  "herbal",
  "peppery",
  "smoky",
  "roasted",
  "toasty",
  "tomato-rich",
  "gingery",
  "citrusy",
  "fermented",
  "spiced",
] as const;
export const textureIds = ["crisp", "tender", "juicy", "silky", "creamy", "chewy", "soft", "brothy", "saucy"] as const;
export const flavorCharacterIds = [
  "light",
  "refreshing",
  "comforting",
  "warming",
  "hearty",
  "appetizing",
  "rice-friendly",
  "clean-tasting",
] as const;
export const flavorPreferenceIds = ["light", "fresh-spicy", "tangy-refreshing", "rich", "roasted", "warming"] as const;

export type TasteId = typeof tasteIds[number];
export type AromaId = typeof aromaIds[number];
export type TextureId = typeof textureIds[number];
export type FlavorCharacterId = typeof flavorCharacterIds[number];
export type FlavorPreferenceId = typeof flavorPreferenceIds[number];
export type TasteIntensity = 0 | 1 | 2 | 3 | 4;

export interface FlavorProfile {
  tastes: Partial<Record<TasteId, TasteIntensity>>;
  aromaIds?: AromaId[];
  textureIds?: TextureId[];
  characterIds?: FlavorCharacterId[];
}

export interface FlavorVocabularyNode<TId extends string> {
  id: TId;
  category: "taste" | "aroma" | "texture" | "character";
  label: LocalizedLabel;
  description: LocalizedLabel;
}

export interface TasteTarget {
  ideal: TasteIntensity;
  tolerance: 1 | 2 | 3 | 4;
}

export interface FlavorPreferenceDefinition {
  id: FlavorPreferenceId;
  label: LocalizedLabel;
  tasteTargets?: Partial<Record<TasteId, TasteTarget>>;
  aromaIds?: AromaId[];
  textureIds?: TextureId[];
  characterIds?: FlavorCharacterId[];
}
