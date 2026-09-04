import type { SupportedLocale } from "@/types/taxonomy";

export const cookingTimeBands = Object.freeze([
  { id: "quick", maxMinutes: 20, label: { "zh-CN": "轻松快手", en: "Quick and easy" } },
  { id: "everyday", maxMinutes: 40, label: { "zh-CN": "日常料理", en: "Everyday cooking" } },
  { id: "slow", maxMinutes: 60, label: { "zh-CN": "慢慢做", en: "Take your time" } },
  { id: "worth-waiting", maxMinutes: Infinity, label: { "zh-CN": "值得等待", en: "Worth the wait" } },
] as const);

export type CookingTimeBandId = typeof cookingTimeBands[number]["id"];

export function getCookingTimeBand(totalMinutes: number, locale: SupportedLocale = "zh-CN") {
  const band = cookingTimeBands.find((item) => totalMinutes <= item.maxMinutes) ?? cookingTimeBands[cookingTimeBands.length - 1];
  return { id: band.id, label: band.label[locale] };
}

export function formatHumanCookingTime(totalMinutes: number, locale: SupportedLocale = "zh-CN"): string {
  const band = getCookingTimeBand(totalMinutes, locale);
  return locale === "zh-CN" ? `${band.label} · 约 ${totalMinutes} 分钟` : `${band.label} · about ${totalMinutes} min`;
}
