import type { RecipeImage } from "@/types/image";
import type { SupportedLocale } from "@/types/localization";
import type { Recipe } from "@/types/recipe";

export interface RecipeImageFallback {
  initial: string;
  label: string;
}

export function getRecipeHeroImage(recipe: Recipe, images: readonly RecipeImage[]): RecipeImage | undefined {
  if (!recipe.heroImageId) return undefined;
  const image = images.find((item) => item.id === recipe.heroImageId);
  return image?.role === "hero" ? image : undefined;
}

export function getRecipeImageFallback(recipe: Recipe): RecipeImageFallback {
  const label = recipe.name.trim();
  return {
    initial: [...label][0] ?? "食",
    label: label || "Cooking Lab",
  };
}

export function formatImageAttribution(attribution: string, locale: SupportedLocale): string {
  if (locale === "zh-CN") return attribution;
  return attribution.replaceAll("，", ", ").replaceAll("裁切处理", "cropped");
}

export function formatImageAttributionParts(
  attribution: string,
  locale: SupportedLocale,
): { credit: string; license?: string } {
  const formatted = formatImageAttribution(attribution, locale);
  const separator = locale === "zh-CN" ? "，" : ", ";
  const parts = formatted.split(separator);
  const license = parts.at(-1);
  if (!license?.startsWith("CC")) return { credit: formatted };
  return { credit: parts.slice(0, -1).join(separator), license };
}
