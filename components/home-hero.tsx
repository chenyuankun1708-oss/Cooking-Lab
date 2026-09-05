import { HomeHeroCarousel } from "./home-hero-carousel";
import { SiteHeader } from "./site-header";
import type { HomeHeroItem } from "@/lib/homepage-hero";
import type { SupportedLocale } from "@/types/localization";

export function HomeHero({ items, locale }: { items: readonly HomeHeroItem[]; locale: SupportedLocale }) {
  return (
    <section className="relative overflow-hidden bg-[#173f35] text-white" aria-labelledby="home-title">
      <HomeHeroCarousel items={items} locale={locale} header={<SiteHeader active="home" inverse locale={locale} currentPath={`/${locale}`} />} />
    </section>
  );
}
