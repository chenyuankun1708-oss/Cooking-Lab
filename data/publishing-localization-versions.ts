import { nativeCulinaryTranslations } from "@/data/localization/public-culinary";
import { publishedRecipeTranslations } from "@/data/localization/public-recipes";
import { storyTranslations } from "@/data/localization/public-stories";
import { getIngredientLabel } from "@/data/localization/ingredients";
import { createContentVersion } from "@/lib/content-version";
import type { PublishingLocalizationVersion } from "@/lib/publishing-governance";
import type { LocalContentPackageV1 } from "@/types/content-bundle";
import type { Ingredient } from "@/types/ingredient";
import type { Story } from "@/types/culinary";

export function createPublishingLocalizationVersions(
  contentPackages: readonly LocalContentPackageV1[],
  ingredients: readonly Ingredient[],
  standaloneStories: readonly Story[] = [],
  standaloneEnglishIngredientLabels: Readonly<Record<string, string>> = {},
): PublishingLocalizationVersion[] {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const standaloneStoryById = new Map(standaloneStories.map((story) => [story.id, story]));
  return contentPackages.map((contentPackage): PublishingLocalizationVersion => {
    const path = contentPackage.sourceKind === "legacy-recipe"
      ? "adapted-recipe" as const
      : contentPackage.sourceKind === "legacy-native"
        ? "native-culinary" as const
        : "standalone-package" as const;
    const englishItemCopy = contentPackage.sourceKind === "legacy-recipe"
      ? publishedRecipeTranslations[contentPackage.slug]
      : contentPackage.sourceKind === "legacy-native"
        ? nativeCulinaryTranslations[contentPackage.itemId]
        : contentPackage.item.content.entries.find((entry) => entry.locale === "en");
    const chineseItemCopy = contentPackage.item.content.entries.find((entry) => entry.locale === "zh-CN");
    const englishStories = contentPackage.item.storyIds.map((storyId) => ({
      storyId,
      translation: contentPackage.sourceKind === "standalone"
        ? (() => {
            const story = standaloneStoryById.get(storyId);
            return story && {
              story: story.content.entries.find((entry) => entry.locale === "en"),
              claims: story.claims.map((claim) => claim.content.entries.find((entry) => entry.locale === "en")),
            };
          })()
        : storyTranslations[storyId],
    }));
    const ingredientIds = "inputs" in contentPackage.item.preparation
      ? contentPackage.item.preparation.inputs.map((input) => input.ingredientId)
      : [];
    const englishIngredientLabels = ingredientIds.map((ingredientId) => ({
      ingredientId,
      label: getIngredientLabel(
        ingredientId,
        ingredientById.get(ingredientId)?.name,
        "en",
        contentPackage.sourceKind === "standalone" ? standaloneEnglishIngredientLabels : undefined,
      ),
    }));

    return {
      itemId: contentPackage.itemId,
      path,
      localeVersions: [
        {
          locale: "zh-CN",
          status: "reviewed",
          version: createContentVersion({ item: chineseItemCopy }),
        },
        {
          locale: "en",
          status: "reviewed",
          version: createContentVersion({ item: englishItemCopy, stories: englishStories, ingredientLabels: englishIngredientLabels }),
        },
      ],
    };
  }).sort((left, right) => left.itemId.localeCompare(right.itemId));
}
