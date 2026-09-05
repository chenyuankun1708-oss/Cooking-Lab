import { permanentRedirect } from "next/navigation";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";

export default async function LegacyRecipeCatalog({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  permanentRedirect(getLocalizedPath("zh-CN", "/recipes", toURLSearchParams(await searchParams)));
}
