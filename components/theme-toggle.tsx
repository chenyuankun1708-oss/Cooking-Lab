"use client";

import { useEffect, useState } from "react";
import type { SupportedLocale } from "@/types/localization";

type Theme = "light" | "dark";
const key = "cooking-lab:theme";

export function ThemeToggle({ locale, inverse = false }: { locale: SupportedLocale; inverse?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    let cancelled = false;
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    queueMicrotask(() => { if (!cancelled) setTheme(current); });
    return () => { cancelled = true; };
  }, []);
  const next = theme === "light" ? "dark" : "light";
  const label = locale === "zh-CN"
    ? `切换到${next === "dark" ? "深色" : "浅色"}模式`
    : `Switch to ${next} mode`;
  return (
    <button
      aria-label={label}
      className={`focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-[4px] border px-2 text-sm font-bold ${inverse ? "border-white/55 text-white" : "border-stone-300 text-stone-800"}`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try { window.localStorage.setItem(key, next); } catch { /* Theme still applies for this visit. */ }
        setTheme(next);
      }}
      title={label}
      type="button"
    >
      <span aria-hidden="true">{locale === "zh-CN" ? (theme === "dark" ? "浅" : "暗") : (theme === "dark" ? "Light" : "Dark")}</span>
    </button>
  );
}
