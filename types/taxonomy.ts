import type { LocalizedLabel } from "./localization";

export type { LocalizedLabel, SupportedLocale } from "./localization";

export interface TaxonomyNode {
  id: string;
  label: LocalizedLabel;
  parentId?: string;
}

export interface RecipeOrigin {
  countryId: string;
  regionId?: string;
}

export interface RecipeCuisineTaxonomy {
  cuisineId: string;
  subCuisineId?: string;
}

export interface RecipeMealType {
  dishTypeId: string;
  mealOccasionIds?: string[];
}

export interface RecipeCulturalContext {
  summary?: string;
  originNote?: string;
  traditionalContext?: string;
  modernContext?: string;
  sources?: RecipeReference[];
}

export interface RecipeReference {
  title: string;
  url?: string;
  publisher?: string;
  accessedAt?: string;
}

export interface RecipeTaxonomy {
  origin?: RecipeOrigin;
  cuisine: RecipeCuisineTaxonomy;
  techniques: string[];
  mealType: RecipeMealType;
  dietaryTagIds?: string[];
  browseTagIds?: string[];
}
