import type { SupportedLocale, TranslationEntry, TranslationSet } from "@/types/localization";

export function resolveTranslation<T>(
  translations: TranslationSet<T>,
  requestedLocale: SupportedLocale,
): TranslationEntry<T> {
  return translations.entries.find((entry) => entry.locale === requestedLocale)
    ?? translations.entries.find((entry) => entry.locale === translations.defaultLocale)
    ?? translations.entries[0];
}
