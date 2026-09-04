import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./site-header";
import type { RecipeImage } from "@/types/image";

export function HomeHero({ image }: { image?: RecipeImage }) {
  return (
    <section className="relative overflow-hidden bg-[#173f35] text-white" aria-labelledby="home-title">
      {image ? (
        <Image
          alt={image.alt}
          className="object-cover"
          fill
          preload
          sizes="100vw"
          src={image.src}
          style={{ objectPosition: `${(image.focalPoint?.x ?? 0.5) * 100}% ${(image.focalPoint?.y ?? 0.5) * 100}%` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-black/46" aria-hidden="true" />
      <div className="relative flex min-h-[74svh] flex-col">
        <SiteHeader active="home" inverse />
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pb-8 pt-16 sm:px-6 sm:pb-10 lg:pb-12">
          <p className="text-sm font-semibold text-[#f4d98b]">今晚的料理，从一个念头开始</p>
          <h1 id="home-title" className="mt-4 max-w-4xl text-4xl font-bold leading-[1.14] sm:text-6xl lg:text-7xl">
            今晚，想吃点什么？
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/88 sm:text-lg sm:leading-8">
            从手边食材、时间和此刻的胃口出发，找到真正做得成、也想端上桌的料理。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="focus-ring inline-flex min-h-11 items-center rounded-md bg-[#f4d98b] px-5 font-semibold text-[#173f35] hover:bg-[#ffe8a7]" href="#decide">
              决定今晚吃什么
            </Link>
            <Link className="focus-ring inline-flex min-h-11 items-center rounded-md border border-white/70 px-5 font-semibold text-white hover:bg-white/12" href="/recipes">
              去发现更多
            </Link>
          </div>
          {image ? (
            <p className="mt-8 text-xs leading-5 text-white/72">
              {image.attribution}
              {image.sourceUrl ? <> · <a className="focus-ring underline" href={image.sourceUrl} rel="noreferrer" target="_blank">图片来源</a></> : null}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
