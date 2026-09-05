import type { SupportedLocale } from "@/types/localization";

const usable = (value: number, complete: boolean) => complete && Number.isFinite(value) && value >= 0;
const about = (locale: SupportedLocale) => locale === "zh-CN" ? "约 " : "about ";
const incomplete = (locale: SupportedLocale) => locale === "zh-CN" ? "估算不完整" : "Estimate incomplete";

export const formatCalories = (value: number, complete = true, locale: SupportedLocale = "zh-CN") => usable(value, complete) ? `${about(locale)}${Math.round(value)} kcal` : incomplete(locale);
export const formatProtein = (value: number, complete = true, locale: SupportedLocale = "zh-CN") => usable(value, complete) ? `${about(locale)}${value.toFixed(1)} g` : incomplete(locale);
export const formatMacro = (value: number, complete = true, locale: SupportedLocale = "zh-CN") => usable(value, complete) ? `${about(locale)}${value.toFixed(1)} g` : incomplete(locale);
export const formatSodium = (value: number, complete = true, locale: SupportedLocale = "zh-CN") => usable(value, complete) ? `${about(locale)}${Math.round(value)} mg` : incomplete(locale);
export const formatCost = (value: number, complete = true, locale: SupportedLocale = "zh-CN") => usable(value, complete) ? `${locale === "zh-CN" ? "预计 " : "est. "}¥${value.toFixed(1)}` : incomplete(locale);
export const formatTime = (minutes: number, locale: SupportedLocale = "zh-CN") => usable(minutes, true) ? `${minutes} ${locale === "zh-CN" ? "分钟" : "min"}` : locale === "zh-CN" ? "时间未知" : "Time unavailable";
export const formatMass = (grams: number, locale: SupportedLocale = "zh-CN") => usable(grams, true) ? `${Number.isInteger(grams) ? grams : grams.toFixed(1)} ${locale === "zh-CN" ? "克" : "g"}` : locale === "zh-CN" ? "用量未知" : "Amount unavailable";
export const formatGrams = (grams: number, locale: SupportedLocale = "zh-CN") => usable(grams, true) ? `${grams.toFixed(1)} g` : locale === "zh-CN" ? "用量未知" : "Amount unavailable";
