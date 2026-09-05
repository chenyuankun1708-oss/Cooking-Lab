import { aromaVocabulary, flavorCharacterVocabulary, tasteVocabulary, textureVocabulary } from "@/data/flavor";
import { getTaxonomyLabel } from "@/data/taxonomy";
import type { Ingredient } from "@/types/ingredient";
import type { SupportedLocale } from "@/types/localization";
import type { Recipe } from "@/types/recipe";
import { getIngredientLabel } from "@/data/localization/ingredients";
import type { IngredientSimilarityFamily, RecipeSimilarityResult, RecipeSimilaritySignalKind } from "./recipe-similarity";

const ingredientFamilyLabels: Readonly<Record<IngredientSimilarityFamily, Record<SupportedLocale, string>>> = Object.freeze({
  chicken: { "zh-CN": "鸡肉料理", en: "chicken dishes" },
  pork: { "zh-CN": "猪肉料理", en: "pork dishes" },
  fish: { "zh-CN": "鱼料理", en: "fish dishes" },
  legume: { "zh-CN": "豆类料理", en: "legume dishes" },
  rice: { "zh-CN": "米饭料理", en: "rice dishes" },
  noodle: { "zh-CN": "面食", en: "noodle dishes" },
});

export function describeRecipeSimilarity(
  target: Recipe,
  result: RecipeSimilarityResult,
  ingredients: readonly Ingredient[],
  locale: SupportedLocale = "zh-CN",
): string {
  const parts: string[] = [];
  const exactIngredients = signalIds(result, "ingredient");
  const ingredientNames = new Map(ingredients.map((ingredient) => [ingredient.id, getIngredientLabel(ingredient.id, ingredient.name.replace(/（.*?）/g, ""), locale)]));

  if (exactIngredients.length) {
    const name = ingredientNames.get(exactIngredients[0]) ?? exactIngredients[0];
    parts.push(locale === "zh-CN" ? `同样以${name}为主` : `also centered on ${name}`);
  } else {
    const family = signalIds(result, "ingredient-family")[0] as IngredientSimilarityFamily | undefined;
    if (family) parts.push(locale === "zh-CN" ? `同样是${ingredientFamilyLabels[family][locale]}` : `another ${ingredientFamilyLabels[family][locale]}`);
  }

  const flavor = describeSharedFlavor(result, exactIngredients, locale);
  if (flavor) parts.push(flavor);

  if (parts.length < 2) {
    const techniqueId = signalIds(result, "technique")[0];
    if (techniqueId) {
      const label = getTaxonomyLabel("techniques", techniqueId, locale) ?? techniqueId;
      parts.push(locale === "zh-CN" ? `都以${label}作为主要做法` : `shares a ${label.toLowerCase()} technique`);
    }
  }

  if (parts.length < 2) {
    const cuisineId = signalIds(result, "cuisine")[0];
    if (cuisineId) {
      const label = getTaxonomyLabel("cuisines", cuisineId, locale) ?? getTaxonomyLabel("regions", cuisineId, locale);
      if (label) parts.push(locale === "zh-CN" ? `都沿着${label}的味道展开` : `draws on ${label} flavors`);
    }
  }

  return joinNatural(parts.slice(0, 2), locale) || (locale === "zh-CN" ? `${target.name}之后，换一种食材继续探索相近的味道。` : `After ${target.name}, explore a related flavor through different ingredients.`);
}

function describeSharedFlavor(result: RecipeSimilarityResult, exactIngredients: readonly string[], locale: SupportedLocale): string | undefined {
  const tastes = signalIds(result, "taste");
  const aromas = signalIds(result, "aroma");
  const textures = signalIds(result, "texture");
  const characters = signalIds(result, "character");

  if (textures.includes("brothy") && characters.includes("warming")) return locale === "zh-CN" ? "同样汤润暖乎乎" : "similarly brothy and warming";
  if (characters.includes("refreshing") && tastes.includes("sour")) return locale === "zh-CN" ? "同样酸香清爽" : "similarly bright, tart, and refreshing";
  if (characters.includes("rice-friendly") && tastes.includes("spicy")) return locale === "zh-CN" ? "同样鲜辣、很下饭" : "similarly savory, spicy, and good with rice";
  if (characters.includes("appetizing") && tastes.includes("spicy")) return locale === "zh-CN" ? "同样鲜辣开胃" : "similarly savory, spicy, and appetizing";
  if (aromas.includes("fermented") && tastes.includes("umami")) return locale === "zh-CN" ? "都有鲜味与发酵香" : "shares umami and fermented aromas";
  if (aromas.includes("tomato-rich") && !exactIngredients.includes("tomato")) return locale === "zh-CN" ? "都有番茄收浓后的酸甜鲜香" : "shares the sweet-tart depth of reduced tomato";
  if (exactIngredients.includes("tomato") && characters.includes("comforting")) return locale === "zh-CN" ? "都带着家常舒服的酸甜鲜味" : "shares a comforting sweet-tart tomato character";

  const labels = [
    ...tastes.slice(0, 2).map((id) => tasteVocabulary[id as keyof typeof tasteVocabulary]?.label[locale]),
    ...aromas.slice(0, 1).map((id) => aromaVocabulary[id as keyof typeof aromaVocabulary]?.label[locale]),
    ...textures.slice(0, 1).map((id) => textureVocabulary[id as keyof typeof textureVocabulary]?.label[locale]),
    ...characters.slice(0, 1).map((id) => flavorCharacterVocabulary[id as keyof typeof flavorCharacterVocabulary]?.label[locale]),
  ].filter((label): label is string => Boolean(label));
  return labels.length ? locale === "zh-CN" ? `味道都带着${labels.slice(0, 2).join("和")}` : `shares ${labels.slice(0, 2).join(" and ").toLowerCase()} notes` : undefined;
}

function signalIds(result: RecipeSimilarityResult, kind: RecipeSimilaritySignalKind): string[] {
  return result.signals.find((signal) => signal.kind === kind)?.ids ?? [];
}

function joinNatural(parts: readonly string[], locale: SupportedLocale): string {
  if (!parts.length) return "";
  if (parts.length === 1) return `${parts[0]}${locale === "zh-CN" ? "。" : "."}`;
  return locale === "zh-CN" ? `${parts[0]}，${parts[1]}。` : `${parts[0]}, ${parts[1]}.`;
}
