import { permanentRedirect } from "next/navigation";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";

export default async function LegacyHomePage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  permanentRedirect(getLocalizedPath("zh-CN", "/", toURLSearchParams(await searchParams)));
}
