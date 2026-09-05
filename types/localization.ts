export const supportedLocales = ["zh-CN", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export type Locale = SupportedLocale;

export interface LocalizedLabel {
  "zh-CN": string;
  en: string;
}

export type TranslationReviewStatus = "draft" | "reviewed";

export interface TranslationEntry<T> {
  locale: SupportedLocale;
  status: TranslationReviewStatus;
  value: T;
}

export interface TranslationSet<T> {
  defaultLocale: SupportedLocale;
  entries: [TranslationEntry<T>, ...TranslationEntry<T>[]];
}
