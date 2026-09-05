import type { Metadata } from "next";
import type { SupportedLocale } from "@/types/localization";
import { getLocalizedPath } from "./localization";
import { SITE_URL } from "./site";

export function buildLocaleAlternates(locale: SupportedLocale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: new URL(getLocalizedPath(locale, path), SITE_URL).toString(),
    languages: {
      "zh-CN": new URL(getLocalizedPath("zh-CN", path), SITE_URL).toString(),
      en: new URL(getLocalizedPath("en", path), SITE_URL).toString(),
    },
  };
}
