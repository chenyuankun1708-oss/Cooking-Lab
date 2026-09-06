import { notFound, permanentRedirect } from "next/navigation";
import { getLocalizedPath, isSupportedLocale } from "@/lib/localization";
import type { SupportedLocale } from "@/types/localization";

export default async function LegacyLocalizedStoriesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = getLocale((await params).locale);
  const query = toSearchParams(await searchParams);
  query.set("story", "available");
  permanentRedirect(getLocalizedPath(locale, "/recipes", query));
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
