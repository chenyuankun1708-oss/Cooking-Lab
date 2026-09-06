import { nativeCulinaryTranslations } from "@/data/localization/public-culinary";
import { publishedRecipeTranslations } from "@/data/localization/public-recipes";
import { storyTranslations } from "@/data/localization/public-stories";
import { createContentVersion } from "@/lib/content-version";
import type { PublishingLocalizationVersion } from "@/lib/publishing-governance";
import type { LocalContentPackageV1 } from "@/types/content-bundle";

export function createPublishingLocalizationVersions(
  contentPackages: readonly LocalContentPackageV1[],
): PublishingLocalizationVersion[] {
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
      translation: storyTranslations[storyId],
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
          version: createContentVersion({ item: englishItemCopy, stories: englishStories }),
        },
      ],
    };
  }).sort((left, right) => left.itemId.localeCompare(right.itemId));
}
