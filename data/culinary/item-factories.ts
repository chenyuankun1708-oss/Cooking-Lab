import type {
  CulinaryIngredientAmount,
  CulinaryItemBase,
  CulinaryItemCopy,
  CulinaryItemType,
  PreparationStep,
} from "@/types/culinary";
import type { Unit } from "@/types/ingredient";
import type { TranslationSet } from "@/types/localization";
import { emptyNutrition, type Nutrition } from "@/types/nutrition";

export function reviewed<T>(value: T): TranslationSet<T> {
  return {
    defaultLocale: "zh-CN",
    entries: [{ locale: "zh-CN", status: "reviewed", value }],
  };
}

export function itemBase<TType extends CulinaryItemType>(input: {
  id: string;
  itemType: TType;
  name: string;
  description: string;
  imageId: string;
  taxonomy: CulinaryItemBase<TType>["taxonomy"];
  flavor: CulinaryItemBase<TType>["flavor"];
  storyIds?: string[];
  pairing: CulinaryItemBase<TType>["pairing"];
  nutrition: CulinaryItemBase<TType>["nutrition"];
  cost: CulinaryItemBase<TType>["cost"];
}): CulinaryItemBase<TType> {
  return {
    id: input.id,
    slug: input.id,
    itemType: input.itemType,
    content: reviewed<CulinaryItemCopy>({ name: input.name, description: input.description }),
    taxonomy: input.taxonomy,
    flavor: input.flavor,
    images: { availability: "available", references: { primaryImageId: input.imageId, imageIds: [input.imageId] } },
    storyIds: input.storyIds ?? [],
    pairing: input.pairing,
    publication: { status: "published" },
    nutrition: input.nutrition,
    cost: input.cost,
  };
}

export function input(
  ingredientId: string,
  amount: number,
  unit: Unit = "g",
  options: { optional?: boolean; note?: string } = {},
): CulinaryIngredientAmount {
  return {
    ingredientId,
    amount,
    unit,
    optional: options.optional ?? false,
    ...(options.note ? { note: options.note } : {}),
  };
}

export function step(
  order: number,
  instruction: string,
  rationale: string,
  stateCue: string,
  durationMinutes?: number,
): PreparationStep {
  return {
    order,
    content: reviewed({ instruction, rationale, stateCue }),
    ...(durationMinutes === undefined ? {} : { durationMinutes }),
  };
}

export function declaredNutrition(
  value: Partial<Nutrition>,
  basis: "per-serving" | "per-100g" | "per-100ml" = "per-serving",
) {
  return {
    applicability: "applicable" as const,
    source: "declared-estimate" as const,
    basis,
    value: { ...emptyNutrition(), ...value },
  };
}
