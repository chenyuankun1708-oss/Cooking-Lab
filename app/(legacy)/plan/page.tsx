import { permanentRedirect } from "next/navigation";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";

export default async function LegacyPlanPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  permanentRedirect(getLocalizedPath("zh-CN", "/plan", toURLSearchParams(await searchParams)));
}
