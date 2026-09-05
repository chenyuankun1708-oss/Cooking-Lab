import { permanentRedirect } from "next/navigation";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";

export default async function LegacyStoryCatalog({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  permanentRedirect(getLocalizedPath("zh-CN", "/stories", toURLSearchParams(await searchParams)));
}
