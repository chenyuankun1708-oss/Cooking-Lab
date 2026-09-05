import { Suspense } from "react";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { DiscoverySiteHeader } from "./discovery-site-header";
import { HomeHeroCarousel } from "./home-hero-carousel";
import { SiteHeader } from "./site-header";
import type { HomeHeroItem } from "@/lib/homepage-hero";
import type { SupportedLocale } from "@/types/localization";

export function HomeHero({ items, locale }: { items: readonly HomeHeroItem[]; locale: SupportedLocale }) {
  const header = (
    <Suspense key="decision-aware-home-header" fallback={<SiteHeader active="home" inverse locale={locale} currentPath={`/${locale}`} />}>
      <DiscoverySiteHeader locale={locale} allowlist={decisionContextValueAllowlist} />
    </Suspense>
  );
  return (
    <section className="relative overflow-hidden bg-[#173f35] text-white" aria-labelledby="home-title">
      <HomeHeroCarousel items={items} locale={locale} header={header} />
    </section>
  );
}
