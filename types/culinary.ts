import type { FlavorProfile, TextureId } from "./flavor";
import type { Unit } from "./ingredient";
import type { Nutrition } from "./nutrition";
import type { TranslationSet } from "./localization";
import type { EditorialPublication } from "./publication";
import type { RecipeCuisineTaxonomy, RecipeOrigin } from "./taxonomy";

export const culinaryItemTypes = [
  "dish",
  "dessert",
  "tea",
  "coffee",
  "non-alcoholic-drink",
  "alcoholic-drink",
] as const;
export type CulinaryItemType = (typeof culinaryItemTypes)[number];

export interface CulinaryItemCopy {
  name: string;
  description: string;
}

export interface CulinaryTaxonomy {
  origin?: RecipeOrigin;
  cuisine?: RecipeCuisineTaxonomy;
  techniqueIds: string[];
  formIds: string[];
  dietaryTagIds: string[];
  browseTagIds: string[];
}

export interface CulinaryImageReferences {
  primaryImageId: string;
  imageIds: string[];
}

export type CulinaryImages =
  | { availability: "none" }
  | { availability: "available"; references: CulinaryImageReferences };

export interface CulinaryIngredientAmount {
  ingredientId: string;
  amount: number;
  unit: Unit;
  optional: boolean;
  note?: string;
}

export interface PreparationStepCopy {
  instruction: string;
  rationale?: string;
  stateCue?: string;
}

export interface PreparationStep {
  order: number;
  content: TranslationSet<PreparationStepCopy>;
  durationMinutes?: number;
}

export interface PreparationTime {
  prepMinutes: number;
  processMinutes: number;
  totalMinutes: number;
}

export interface PreparationYield {
  amount: number;
  unit: "serving" | "piece" | "ml" | "g";
}

export type ProceduralPreparationKind = "cooking" | "baking" | "brewing" | "extraction" | "mixing" | "assembly";

export interface ProceduralPreparation {
  kind: ProceduralPreparationKind;
  time: PreparationTime;
  yield: PreparationYield;
  inputs: CulinaryIngredientAmount[];
  toolIds: string[];
  steps: [PreparationStep, ...PreparationStep[]];
}

export interface ServingGuidanceCopy {
  guidance: string;
}

export interface ServingGuidancePreparation {
  kind: "serving-guidance";
  estimatedMinutes: number;
  toolIds: string[];
  content: TranslationSet<ServingGuidanceCopy>;
}

export interface NoConsumerPreparationCopy {
  servingNote: string;
}

export interface NoConsumerPreparation {
  kind: "no-consumer-preparation";
  reason: "ready-to-serve" | "producer-prepared" | "reference-only";
  content: TranslationSet<NoConsumerPreparationCopy>;
}

export type DishPreparation = ProceduralPreparation & { kind: "cooking" | "baking" | "assembly" };
export type DessertPreparation = ProceduralPreparation & { kind: "cooking" | "baking" | "assembly" };
export type TeaPreparation = (ProceduralPreparation & { kind: "brewing" }) | ServingGuidancePreparation | NoConsumerPreparation;
export type CoffeePreparation =
  | (ProceduralPreparation & { kind: "brewing" | "extraction" | "mixing" })
  | ServingGuidancePreparation
  | NoConsumerPreparation;
export type NonAlcoholicDrinkPreparation =
  | (ProceduralPreparation & { kind: "brewing" | "extraction" | "mixing" | "assembly" })
  | ServingGuidancePreparation
  | NoConsumerPreparation;
export type AlcoholicDrinkPreparation =
  | (ProceduralPreparation & { kind: "mixing" })
  | ServingGuidancePreparation
  | NoConsumerPreparation;

export type CulinaryNutrition =
  | { applicability: "applicable"; source: "ingredient-derived" }
  | { applicability: "applicable"; source: "declared-estimate"; basis: "per-serving" | "per-100g" | "per-100ml"; value: Nutrition }
  | { applicability: "not-modeled"; reason: "insufficient-data" | "out-of-scope" };

export type CulinaryCost =
  | { source: "ingredient-derived"; currency: "CNY" }
  | { source: "not-modeled" };

export const mealRoleIds = ["starter", "main", "side", "staple", "soup", "dessert", "drink"] as const;
export type MealRoleId = (typeof mealRoleIds)[number];
export type PairingWeight = "light" | "medium" | "rich";
export type ServingTemperature = "cold" | "cool" | "room" | "warm" | "hot";

export type PairingFacet =
  | { dimension: "weight"; value: PairingWeight }
  | { dimension: "temperature"; value: ServingTemperature }
  | { dimension: "texture"; value: TextureId };

export interface PairingSignals {
  mealRoleIds: MealRoleId[];
  servingContextIds: string[];
  cuisineIds: string[];
  facets: PairingFacet[];
}

export const storyTypes = [
  "origin",
  "historical-development",
  "legend-folklore",
  "place-food-culture",
  "ingredient-agriculture-trade",
  "people",
  "technique",
  "restaurant-school-movement",
  "award-recognition",
  "everyday-life-festival",
] as const;
export type StoryType = (typeof storyTypes)[number];

export const claimKinds = [
  "documented-fact",
  "documented-tradition",
  "disputed-attribution",
  "legend-folklore",
] as const;
export type ClaimKind = (typeof claimKinds)[number];

export interface StorySectionCopy {
  heading: string;
  paragraphs: [string, ...string[]];
}

export interface StoryCopy {
  title: string;
  dek: string;
  sections: [StorySectionCopy, ...StorySectionCopy[]];
}

export interface StoryClaimCopy {
  statement: string;
}

export interface StoryClaim {
  id: string;
  kind: ClaimKind;
  content: TranslationSet<StoryClaimCopy>;
  evidenceIds: [string, ...string[]];
}

export type RelatedEntityType = "culinary-item" | "person" | "place" | "ingredient" | "technique";

export interface RelatedEntityReference {
  type: RelatedEntityType;
  id: string;
}

export interface Story {
  id: string;
  type: StoryType;
  content: TranslationSet<StoryCopy>;
  claims: StoryClaim[];
  relatedEntities: RelatedEntityReference[];
  publication: EditorialPublication;
}

export const sourceTypes = [
  "book",
  "journal",
  "archive",
  "museum",
  "library",
  "government",
  "official-cultural-institution",
  "educational-institution",
  "open-educational-resource",
  "open-media",
  "professional-organization",
  "publisher",
  "reputable-media",
  "producer-documentation",
  "patent",
] as const;
export type SourceType = (typeof sourceTypes)[number];

export type SourceRights =
  | { status: "public-domain"; basis: string }
  | {
      status: "open-license";
      licenseId: string;
      licenseUrl: string;
      attribution: string;
      adaptationStatus: "unmodified" | "adapted" | "not-reusing";
      shareAlikeRequired: boolean;
      notes: string;
    }
  | { status: "permission-granted"; notes: string }
  | { status: "reference-only"; notes: string }
  | { status: "unknown"; notes: string };

export const sourceHealthStatuses = ["active", "unreachable", "moved", "superseded", "rights-changed"] as const;
export type SourceHealthStatus = (typeof sourceHealthStatuses)[number];

export interface SourceHealth {
  status: SourceHealthStatus;
  checkedAt: string;
  notes?: string;
}

export type SourceLocator =
  | { kind: "url"; url: string; accessedAt: string }
  | { kind: "doi"; doi: string }
  | { kind: "isbn"; isbn: string }
  | { kind: "archive"; identifier: string; collection: string; holdingInstitution: string }
  | { kind: "physical-citation"; citation: string; holdingInstitution?: string };

export interface SourcePublicationMetadata {
  dateText?: string;
  edition?: string;
  volume?: string;
  issue?: string;
}

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  publisherOrInstitution: string;
  authorNames: string[];
  publication?: SourcePublicationMetadata;
  locators: [SourceLocator, ...SourceLocator[]];
  rights: SourceRights;
  health: SourceHealth;
  reliability: "primary" | "authoritative-secondary" | "general-secondary" | "contested";
  editorialNotes: string;
}

export type EvidenceLocator = {
  kind: "page" | "chapter" | "section" | "paragraph" | "timestamp" | "folio" | "other";
  value: string;
};

export interface Evidence {
  id: string;
  sourceId: string;
  relation: "supports" | "contradicts" | "context";
  strength: "primary" | "strong" | "limited" | "contested";
  locators: EvidenceLocator[];
  editorialNote: string;
}

export interface CulinaryItemBase<TType extends CulinaryItemType> {
  id: string;
  slug: string;
  itemType: TType;
  content: TranslationSet<CulinaryItemCopy>;
  taxonomy: CulinaryTaxonomy;
  flavor: FlavorProfile;
  images: CulinaryImages;
  storyIds: string[];
  pairing: PairingSignals;
  publication: EditorialPublication;
  nutrition: CulinaryNutrition;
  cost: CulinaryCost;
}

export interface DishItem extends CulinaryItemBase<"dish"> {
  preparation: DishPreparation;
}

export interface DessertItem extends CulinaryItemBase<"dessert"> {
  preparation: DessertPreparation;
}

export interface TeaItem extends CulinaryItemBase<"tea"> {
  preparation: TeaPreparation;
}

export interface CoffeeItem extends CulinaryItemBase<"coffee"> {
  preparation: CoffeePreparation;
}

export interface NonAlcoholicDrinkItem extends CulinaryItemBase<"non-alcoholic-drink"> {
  preparation: NonAlcoholicDrinkPreparation;
}

export interface AlcoholicDrinkItem extends CulinaryItemBase<"alcoholic-drink"> {
  preparation: AlcoholicDrinkPreparation;
}

export type CulinaryItem =
  | DishItem
  | DessertItem
  | TeaItem
  | CoffeeItem
  | NonAlcoholicDrinkItem
  | AlcoholicDrinkItem;
