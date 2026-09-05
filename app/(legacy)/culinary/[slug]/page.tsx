import { permanentRedirect } from "next/navigation";
import { getLocalizedPath, toURLSearchParams, type RouteSearchParams } from "@/lib/localization";

export default async function LegacyCulinaryDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(getLocalizedPath("zh-CN", `/culinary/${(await params).slug}`, toURLSearchParams(await searchParams)));
}
