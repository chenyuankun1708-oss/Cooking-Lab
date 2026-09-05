"use client";

import { useSearchParams } from "next/navigation";
import { SiteHeader } from "./site-header";
import { parseDecisionContext, serializeDecisionContext, type DecisionContextValueAllowlist } from "@/lib/decision-context";
import type { SupportedLocale } from "@/types/localization";

export function DiscoverySiteHeader({
  locale,
  allowlist,
}: {
  locale: SupportedLocale;
  allowlist: DecisionContextValueAllowlist;
}) {
  const searchParams = useSearchParams();
  const context = parseDecisionContext(new URLSearchParams(searchParams.toString()), allowlist);
  const query = serializeDecisionContext(context, allowlist).toString();
  return <SiteHeader active="home" inverse locale={locale} currentPath={`/${locale}`} query={query} />;
}
