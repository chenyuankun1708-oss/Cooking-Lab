import { supportedLocales, type SupportedLocale, type TranslationEntry, type TranslationSet } from "@/types/localization";

export const DEFAULT_LOCALE: SupportedLocale = "zh-CN";

export type RouteSearchParams = Record<string, string | string[] | undefined>;

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function getLocalizedPath(locale: SupportedLocale, path = "/", query?: URLSearchParams | string): string {
  const normalizedPath = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  const queryString = typeof query === "string" ? query.replace(/^\?/, "") : query?.toString();
  return `/${locale}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

export function toURLSearchParams(raw: RouteSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) params.append(key, entry);
  }
  return params;
}

export function replacePathLocale(pathname: string, locale: SupportedLocale, query?: URLSearchParams | string): string {
  const segments = pathname.split("/").filter(Boolean);
  const pathSegments = isSupportedLocale(segments[0] ?? "") ? segments.slice(1) : segments;
  return getLocalizedPath(locale, `/${pathSegments.join("/")}`, query);
}

export function getAlternateLocale(locale: SupportedLocale): SupportedLocale {
  return locale === "zh-CN" ? "en" : "zh-CN";
}

export function resolveReviewedTranslation<T>(
  translations: TranslationSet<T>,
  requestedLocale: SupportedLocale,
): TranslationEntry<T> | undefined {
  return translations.entries.find((entry) => entry.locale === requestedLocale && entry.status === "reviewed");
}

export function resolveTranslation<T>(
  translations: TranslationSet<T>,
  requestedLocale: SupportedLocale,
): TranslationEntry<T> {
  return translations.entries.find((entry) => entry.locale === requestedLocale)
    ?? translations.entries.find((entry) => entry.locale === translations.defaultLocale)
    ?? translations.entries[0];
}
