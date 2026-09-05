import { permanentRedirect } from "next/navigation";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";

export default async function LegacyRecipeDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(getLocalizedPath("zh-CN", `/recipes/${(await params).slug}`, toURLSearchParams(await searchParams)));
}
