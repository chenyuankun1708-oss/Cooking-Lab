import { HomeHeroCarousel } from "./home-hero-carousel";
import { SiteHeader } from "./site-header";
import type { HomeHeroItem } from "@/lib/homepage-hero";

export function HomeHero({ items }: { items: readonly HomeHeroItem[] }) {
  return (
    <section className="relative overflow-hidden bg-[#173f35] text-white" aria-labelledby="home-title">
      <HomeHeroCarousel items={items} header={<SiteHeader active="home" inverse />} />
    </section>
  );
}
