"use client";

import Image from "next/image";
import { useState } from "react";
import type { RecipeImage as RecipeImageAsset } from "@/types/image";
import type { SupportedLocale } from "@/types/localization";
import { formatImageAttributionParts } from "@/lib/recipe-images";

const imageSizes = {
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  hero: "(max-width: 1024px) 100vw, 64rem",
} as const;

interface RecipeImageProps {
  image?: RecipeImageAsset;
  fallbackInitial: string;
  fallbackLabel: string;
  variant: keyof typeof imageSizes;
  lcp?: boolean;
  showAttribution?: boolean;
  alt?: string;
  sourceLabel?: string;
  locale?: SupportedLocale;
}

export function RecipeImage({
  image,
  fallbackInitial,
  fallbackLabel,
  variant,
  lcp = false,
  showAttribution = true,
  alt,
  sourceLabel = "来源",
  locale = "zh-CN",
}: RecipeImageProps) {
  const [failed, setFailed] = useState(false);
  const frameClass = variant === "card" ? "aspect-[4/3]" : "aspect-[3/2]";

  if (!image || failed) {
    return (
      <div
        aria-hidden="true"
        className={`${frameClass} flex w-full items-center justify-center overflow-hidden rounded-[4px] border border-stone-300 bg-stone-200 text-center text-stone-700`}
        data-image-state="fallback"
      >
        <div className="px-4">
          <span className="block text-4xl font-semibold text-[var(--tomato)]">{fallbackInitial}</span>
          <span className="mt-2 block text-xs font-semibold text-stone-600">{fallbackLabel}</span>
        </div>
      </div>
    );
  }

  const focalPoint = image.focalPoint ?? { x: 0.5, y: 0.5 };
  const attribution = image.attribution ? formatImageAttributionParts(image.attribution, locale) : undefined;
  return (
    <figure>
      <div className={`${frameClass} relative w-full overflow-hidden rounded-[4px] bg-stone-100`}>
        <Image
          alt={alt ?? image.alt}
          fetchPriority={lcp ? "high" : undefined}
          fill
          loading={lcp ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          sizes={imageSizes[variant]}
          src={image.src}
          style={{ objectFit: "cover", objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%` }}
        />
      </div>
      {showAttribution && variant === "hero" && (image.attribution || image.sourceUrl || image.licenseUrl) ? (
        <figcaption className="mt-2 flex flex-col items-end text-right text-xs leading-5 text-stone-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-2">
          {attribution ? <span className="max-w-full">{attribution.credit}</span> : null}
          <span className="inline-flex items-center gap-3 whitespace-nowrap">
            {image.sourceUrl ? <a className="inline-flex min-h-11 items-center underline underline-offset-2" href={image.sourceUrl} rel="noreferrer" target="_blank">{sourceLabel}</a> : null}
            {image.licenseUrl ? <a className="inline-flex min-h-11 items-center underline underline-offset-2" href={image.licenseUrl} rel="noreferrer" target="_blank">{attribution?.license ?? image.license}</a> : null}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}
