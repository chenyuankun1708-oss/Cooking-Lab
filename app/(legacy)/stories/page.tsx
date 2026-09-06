import { permanentRedirect } from "next/navigation";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";

export default async function LegacyStoryCatalog({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  const query = toURLSearchParams(await searchParams);
  query.set("story", "available");
  permanentRedirect(getLocalizedPath("zh-CN", "/recipes", query));
}
