import { aromaVocabulary, flavorCharacterVocabulary, tasteVocabulary, textureVocabulary } from "@/data/flavor";
import { getTaxonomyLabel } from "@/data/taxonomy";
import type { Ingredient } from "@/types/ingredient";
import type { Recipe } from "@/types/recipe";
import type { IngredientSimilarityFamily, RecipeSimilarityResult, RecipeSimilaritySignalKind } from "./recipe-similarity";

const ingredientFamilyLabels: Readonly<Record<IngredientSimilarityFamily, string>> = Object.freeze({
  chicken: "鸡肉料理",
  pork: "猪肉料理",
  fish: "鱼料理",
  legume: "豆类料理",
  rice: "米饭料理",
  noodle: "面食",
});

export function describeRecipeSimilarity(
  target: Recipe,
  result: RecipeSimilarityResult,
  ingredients: readonly Ingredient[],
): string {
  const parts: string[] = [];
  const exactIngredients = signalIds(result, "ingredient");
  const ingredientNames = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name.replace(/（.*?）/g, "")]));

  if (exactIngredients.length) {
    parts.push(`同样以${ingredientNames.get(exactIngredients[0]) ?? exactIngredients[0]}为主`);
  } else {
    const family = signalIds(result, "ingredient-family")[0] as IngredientSimilarityFamily | undefined;
    if (family) parts.push(`同样是${ingredientFamilyLabels[family]}`);
  }

  const flavor = describeSharedFlavor(result, exactIngredients);
  if (flavor) parts.push(flavor);

  if (parts.length < 2) {
    const techniqueId = signalIds(result, "technique")[0];
    if (techniqueId) {
      parts.push(`都以${getTaxonomyLabel("techniques", techniqueId) ?? techniqueId}作为主要做法`);
    }
  }

  if (parts.length < 2) {
    const cuisineId = signalIds(result, "cuisine")[0];
    if (cuisineId) {
      const label = getTaxonomyLabel("cuisines", cuisineId) ?? getTaxonomyLabel("regions", cuisineId);
      if (label) parts.push(`都沿着${label}的味道展开`);
    }
  }

  return joinNatural(parts.slice(0, 2)) || `${target.name}之后，换一种食材继续探索相近的味道。`;
}

function describeSharedFlavor(result: RecipeSimilarityResult, exactIngredients: readonly string[]): string | undefined {
  const tastes = signalIds(result, "taste");
  const aromas = signalIds(result, "aroma");
  const textures = signalIds(result, "texture");
  const characters = signalIds(result, "character");

  if (textures.includes("brothy") && characters.includes("warming")) return "同样汤润暖乎乎";
  if (characters.includes("refreshing") && tastes.includes("sour")) return "同样酸香清爽";
  if (characters.includes("rice-friendly") && tastes.includes("spicy")) return "同样鲜辣、很下饭";
  if (characters.includes("appetizing") && tastes.includes("spicy")) return "同样鲜辣开胃";
  if (aromas.includes("fermented") && tastes.includes("umami")) return "都有鲜味与发酵香";
  if (aromas.includes("tomato-rich") && !exactIngredients.includes("tomato")) return "都有番茄收浓后的酸甜鲜香";
  if (exactIngredients.includes("tomato") && characters.includes("comforting")) return "都带着家常舒服的酸甜鲜味";

  const labels = [
    ...tastes.slice(0, 2).map((id) => tasteVocabulary[id as keyof typeof tasteVocabulary]?.label["zh-CN"]),
    ...aromas.slice(0, 1).map((id) => aromaVocabulary[id as keyof typeof aromaVocabulary]?.label["zh-CN"]),
    ...textures.slice(0, 1).map((id) => textureVocabulary[id as keyof typeof textureVocabulary]?.label["zh-CN"]),
    ...characters.slice(0, 1).map((id) => flavorCharacterVocabulary[id as keyof typeof flavorCharacterVocabulary]?.label["zh-CN"]),
  ].filter((label): label is string => Boolean(label));
  return labels.length ? `味道都带着${labels.slice(0, 2).join("和")}` : undefined;
}

function signalIds(result: RecipeSimilarityResult, kind: RecipeSimilaritySignalKind): string[] {
  return result.signals.find((signal) => signal.kind === kind)?.ids ?? [];
}

function joinNatural(parts: readonly string[]): string {
  if (!parts.length) return "";
  if (parts.length === 1) return `${parts[0]}。`;
  return `${parts[0]}，${parts[1]}。`;
}
