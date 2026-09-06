import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedCulinaryItemForLocaleBySlug, getPublishedNativeCulinaryItemStaticParams } from "@/data/published-culinary-items";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import { supportedLocales, type SupportedLocale } from "@/types/localization";

export const dynamicParams = false;

export function generateStaticParams() {
  return supportedLocales.flatMap((locale) => getPublishedNativeCulinaryItemStaticParams().map(({ slug }) => ({ locale, slug })));
}

export default async function LegacyLocalizedCulinaryPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: value, slug } = await params;
  const locale = getLocale(value);
  if (!getPublishedCulinaryItemForLocaleBySlug(slug, locale)) notFound();
  permanentRedirect(getLocalizedPath(locale, `/recipes/${slug}`, toSearchParams(await searchParams)));
}

function getLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) notFound();
  return value;
}

function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) params.append(key, entry);
  }
  return params;
}
