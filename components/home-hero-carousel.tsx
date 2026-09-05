"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import {
  getNextHomeHeroIndex,
  getPreviousHomeHeroIndex,
  HOME_HERO_ROTATION_INTERVAL_MS,
  HOME_HERO_TRANSITION_MS,
  normalizeHomeHeroIndex,
  shouldAutoRotateHomeHero,
} from "@/lib/homepage-hero-rotation";
import type { HomeHeroItem } from "@/lib/homepage-hero";

export function HomeHeroCarousel({ items, header }: { items: readonly HomeHeroItem[]; header: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [renderedIndices, setRenderedIndices] = useState(() => items.length > 1 ? [0, 1] : [0]);
  const [timerRevision, setTimerRevision] = useState(0);
  const [pointerPaused, setPointerPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const loadedIndices = useRef(new Set<number>());
  const activeItem = items[activeIndex] ?? items[0];
  const paused = pointerPaused || focusPaused;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches);
    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setVisible(document.visibilityState !== "hidden");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const activateIndex = useCallback((requestedIndex: number) => {
    const nextIndex = normalizeHomeHeroIndex(requestedIndex, items.length);
    const followingIndex = getNextHomeHeroIndex(nextIndex, items.length);
    setRenderedIndices((indices) => {
      const missing = [nextIndex, followingIndex].filter((index) => !indices.includes(index));
      return missing.length ? [...indices, ...missing] : indices;
    });
    setPendingIndex(null);
    setActiveIndex(nextIndex);
  }, [items.length]);

  const requestIndex = useCallback((requestedIndex: number, manual = false) => {
    const nextIndex = normalizeHomeHeroIndex(requestedIndex, items.length);
    if (manual) setTimerRevision((revision) => revision + 1);
    if (nextIndex === activeIndex) {
      setPendingIndex(null);
      return;
    }
    setRenderedIndices((indices) => indices.includes(nextIndex) ? indices : [...indices, nextIndex]);
    if (loadedIndices.current.has(nextIndex)) {
      activateIndex(nextIndex);
      return;
    }
    setPendingIndex(nextIndex);
  }, [activateIndex, activeIndex, items.length]);

  useEffect(() => {
    if (!shouldAutoRotateHomeHero({ itemCount: items.length, reducedMotion, paused, visible })) return;
    const timer = window.setTimeout(() => {
      requestIndex(getNextHomeHeroIndex(activeIndex, items.length));
    }, HOME_HERO_ROTATION_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, items.length, paused, reducedMotion, requestIndex, timerRevision, visible]);

  const handleImageLoad = (index: number) => {
    loadedIndices.current.add(index);
    if (pendingIndex === index) {
      activateIndex(index);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false);
  };

  if (!activeItem) return null;

  return (
    <div
      className="relative flex min-h-[74svh] flex-col"
      data-home-hero-active={activeItem.slug}
      data-home-hero-index={activeIndex}
      onBlurCapture={handleBlur}
      onFocusCapture={() => setFocusPaused(true)}
      onMouseEnter={() => setPointerPaused(true)}
      onMouseLeave={() => setPointerPaused(false)}
      onPointerDown={() => setTimerRevision((revision) => revision + 1)}
    >
      <div className="absolute inset-0 bg-[#173f35]">
        {items.map((item, index) => renderedIndices.includes(index) ? (
          <Image
            key={item.image.id}
            alt={index === activeIndex ? item.image.alt : ""}
            aria-hidden={index === activeIndex ? undefined : true}
            className={`object-cover transition-opacity ease-out motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
            data-hero-image={item.slug}
            fill
            loading={index === 0 ? undefined : "lazy"}
            onLoad={(event) => {
              if (event.currentTarget.naturalWidth > 0) handleImageLoad(index);
            }}
            preload={index === 0}
            sizes="100vw"
            src={item.image.src}
            style={{
              objectPosition: `${(item.image.focalPoint?.x ?? 0.5) * 100}% ${(item.image.focalPoint?.y ?? 0.5) * 100}%`,
              transitionDuration: `${HOME_HERO_TRANSITION_MS}ms`,
            }}
          />
        ) : null)}
      </div>
      <div className="absolute inset-0 bg-black/38" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/36 to-black/18" aria-hidden="true" />

      {header}

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pb-5 pt-8 sm:px-6 sm:pb-8 lg:pb-10">
        <div className="max-w-4xl">
          <p className="h-12 max-w-2xl overflow-hidden text-sm font-semibold leading-6 text-[#f4d98b] sm:h-8 sm:text-base">
            {activeItem.editorialLine}
          </p>
          <h1 id="home-title" className="mt-1 text-4xl font-bold leading-[1.14] sm:text-6xl lg:text-7xl">
            今晚，想吃点什么？
          </h1>
          <div className="mt-3 min-h-16 sm:mt-4 sm:min-h-20">
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{activeItem.name}</h2>
            <p className="mt-2 text-sm font-semibold text-white/82 sm:text-base">
              {activeItem.flavor} <span aria-hidden="true">·</span> {activeItem.time}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 sm:mt-5">
            <Link className="focus-ring inline-flex min-h-11 items-center rounded-md bg-[#f4d98b] px-5 font-semibold text-[#173f35] hover:bg-[#ffe8a7]" href="#decide">
              决定今晚吃什么
            </Link>
            <Link className="focus-ring inline-flex min-h-11 items-center rounded-md border border-white/70 px-5 font-semibold text-white hover:bg-white/12" href={activeItem.href}>
              今晚做这个
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1" aria-label="切换今晚的料理" role="group">
          <button
            aria-label="上一道料理"
            className="focus-ring inline-flex size-11 items-center justify-center rounded-md border border-white/55 text-xl font-bold text-white hover:bg-white/12"
            onClick={() => requestIndex(getPreviousHomeHeroIndex(activeIndex, items.length), true)}
            title="上一道料理"
            type="button"
          >
            <span aria-hidden="true">←</span>
          </button>
          {items.map((item, index) => (
            <button
              key={item.slug}
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`查看第 ${index + 1} 道料理：${item.name}`}
              className="focus-ring inline-flex size-11 items-center justify-center rounded-md hover:bg-white/12"
              onClick={() => requestIndex(index, true)}
              type="button"
            >
              <span className={`block h-2 rounded-full bg-white transition-[width,opacity] motion-reduce:transition-none ${index === activeIndex ? "w-5 opacity-100" : "w-2 opacity-55"}`} aria-hidden="true" />
            </button>
          ))}
          <button
            aria-label="下一道料理"
            className="focus-ring inline-flex size-11 items-center justify-center rounded-md border border-white/55 text-xl font-bold text-white hover:bg-white/12"
            onClick={() => requestIndex(getNextHomeHeroIndex(activeIndex, items.length), true)}
            title="下一道料理"
            type="button"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <p className="mt-3 h-10 overflow-hidden text-xs leading-5 text-white/72 sm:h-5">
          {activeItem.image.attribution}
          {activeItem.image.sourceUrl ? <> · <a className="focus-ring underline" href={activeItem.image.sourceUrl} rel="noreferrer" target="_blank">图片来源</a></> : null}
          {activeItem.image.licenseUrl ? <> · <a className="focus-ring underline" href={activeItem.image.licenseUrl} rel="noreferrer" target="_blank">{activeItem.image.license}</a></> : null}
        </p>
      </div>
    </div>
  );
}
