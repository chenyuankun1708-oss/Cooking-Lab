import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import type { HomeHeroItem } from "@/lib/homepage-hero";
import { formatImageAttribution } from "@/lib/recipe-images";
import { getMessages } from "@/lib/messages";
import type { SupportedLocale } from "@/types/localization";
import { DiscoverySiteHeader } from "./discovery-site-header";
import { SiteHeader } from "./site-header";

export function HomeHero({ items, locale }: { items: readonly HomeHeroItem[]; locale: SupportedLocale }) {
  const item = items[0];
  if (!item) return null;
  const messages = getMessages(locale);
  const header = (
    <Suspense key="decision-aware-home-header" fallback={<SiteHeader active="home" locale={locale} currentPath={`/${locale}`} />}>
      <DiscoverySiteHeader locale={locale} allowlist={decisionContextValueAllowlist} />
    </Suspense>
  );
  return (
    <>
      {header}
      <section className="hero-surface overflow-hidden border-b border-[var(--line)]" aria-labelledby="home-title">
        <div className="mx-auto grid min-h-[min(46rem,calc(100dvh-4rem))] max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-14 lg:py-12">
          <div className="relative z-10 max-w-xl lg:pr-4">
            <p className="editorial-kicker">{item.editorialLine}</p>
            <h1 id="home-title" className="mt-4 max-w-[10ch] text-5xl leading-[1.02] text-stone-950 sm:text-6xl xl:text-7xl">{messages.home.title}</h1>
            <p className="mt-5 max-w-[20ch] text-lg leading-8 text-stone-700">{locale === "zh-CN" ? "先看见想吃的，再用今天的时间与食材做决定。" : "See what looks good, then decide with today's time and ingredients."}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="focus-ring inline-flex min-h-11 items-center whitespace-nowrap rounded-[4px] bg-stone-950 px-5 font-bold text-white transition hover:bg-[var(--tomato)] active:translate-y-px" href="#decide">{messages.home.decide}</Link>
              <Link className="focus-ring inline-flex min-h-11 items-center whitespace-nowrap rounded-[4px] border border-stone-500 px-5 font-bold text-stone-950 transition hover:border-[var(--tomato)] hover:text-[var(--tomato)] active:translate-y-px" href={item.href}>{messages.home.cookThis}</Link>
            </div>
          </div>
          <figure className="min-w-0 lg:-mr-10 lg:pl-3 xl:-mr-16">
            <div className="hero-image-frame relative aspect-[4/3] overflow-hidden rounded-[4px] bg-stone-200 lg:aspect-[16/11]">
              <Image
                alt={locale === "en" ? `${item.name}, ready to serve` : item.image.alt}
                className="object-cover"
                fill
                preload
                sizes="(max-width: 1024px) 100vw, 58vw"
                src={item.image.src}
                style={{ objectPosition: `${(item.image.focalPoint?.x ?? 0.5) * 100}% ${(item.image.focalPoint?.y ?? 0.5) * 100}%` }}
              />
            </div>
            <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 text-xs leading-5 text-stone-500">
              <span>{item.name}</span>
              <span>{item.flavor}</span>
              <span>{item.time}</span>
              {item.image.attribution ? <span>{formatImageAttribution(item.image.attribution, locale)}</span> : null}
              {item.image.sourceUrl ? <a className="focus-ring inline-flex min-h-11 items-center underline" href={item.image.sourceUrl} rel="noreferrer" target="_blank">{messages.common.imageSource}</a> : null}
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
