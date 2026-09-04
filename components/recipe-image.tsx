"use client";

import Image from "next/image";
import { useState } from "react";
import type { RecipeImage as RecipeImageAsset } from "@/types/image";

const imageSizes = {
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  hero: "(max-width: 1024px) 100vw, 64rem",
} as const;

interface RecipeImageProps {
  image?: RecipeImageAsset;
  fallbackInitial: string;
  fallbackLabel: string;
  variant: keyof typeof imageSizes;
  preload?: boolean;
}

export function RecipeImage({ image, fallbackInitial, fallbackLabel, variant, preload = false }: RecipeImageProps) {
  const [failed, setFailed] = useState(false);
  const frameClass = variant === "card" ? "aspect-[4/3]" : "aspect-[3/2]";

  if (!image || failed) {
    return (
      <div
        aria-hidden="true"
        className={`${frameClass} flex w-full items-center justify-center overflow-hidden rounded-md border border-stone-200 bg-[#efe9db] text-center text-stone-700`}
        data-image-state="fallback"
      >
        <div className="px-4">
          <span className="block text-4xl font-semibold text-[#a64631]">{fallbackInitial}</span>
          <span className="mt-2 block text-xs font-semibold text-stone-600">{fallbackLabel}</span>
        </div>
      </div>
    );
  }

  const focalPoint = image.focalPoint ?? { x: 0.5, y: 0.5 };
  return (
    <figure>
      <div className={`${frameClass} relative w-full overflow-hidden rounded-md bg-stone-100`}>
        <Image
          alt={image.alt}
          fill
          loading={preload ? undefined : "lazy"}
          onError={() => setFailed(true)}
          preload={preload}
          sizes={imageSizes[variant]}
          src={image.src}
          style={{ objectFit: "cover", objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%` }}
        />
      </div>
      {variant === "hero" && (image.attribution || image.sourceUrl || image.licenseUrl) ? (
        <figcaption className="mt-2 flex flex-wrap justify-end gap-x-2 text-right text-xs leading-5 text-stone-500">
          {image.attribution ? <span>{image.attribution}</span> : null}
          {image.sourceUrl ? <a className="underline underline-offset-2" href={image.sourceUrl} rel="noreferrer" target="_blank">来源</a> : null}
          {image.licenseUrl ? <a className="underline underline-offset-2" href={image.licenseUrl} rel="noreferrer" target="_blank">{image.license}</a> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
