import type { Source } from "@/types/culinary";
import type { SupportedLocale } from "@/types/localization";
import type { ResearchRecord, ResearchSourceUse } from "@/types/research";

export interface CulinaryDetailSource {
  id: string;
  title: string;
  byline: string;
  href?: string;
  uses: string[];
}

const useLabels: Readonly<Record<ResearchSourceUse, Readonly<Record<SupportedLocale, string>>>> = {
  identity: { "zh-CN": "料理身份", en: "Identity" },
  preparation: { "zh-CN": "准备方法", en: "Preparation" },
  safety: { "zh-CN": "食品安全", en: "Food safety" },
  culture: { "zh-CN": "文化语境", en: "Cultural context" },
  award: { "zh-CN": "奖项", en: "Award" },
  nutrition: { "zh-CN": "营养", en: "Nutrition" },
  simulation: { "zh-CN": "仿真", en: "Simulation" },
};

export function listConsumerResearchSources(
  subjectId: string,
  records: readonly ResearchRecord[],
  sources: readonly Source[],
  locale: SupportedLocale,
): CulinaryDetailSource[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const seen = new Set<string>();
  return records
    .filter((record) => record.status === "closed" && record.subject.type === "culinary-item" && record.subject.id === subjectId)
    .flatMap((record) => record.sourceDecisions)
    .flatMap((decision) => {
      if (decision.disposition !== "accepted" || seen.has(decision.sourceId)) return [];
      const source = sourceById.get(decision.sourceId);
      if (!source || source.health.status !== "active") return [];
      seen.add(source.id);
      const url = source.locators.find((locator) => locator.kind === "url");
      const byline = [...source.authorNames, source.publisherOrInstitution]
        .filter(Boolean)
        .join(locale === "zh-CN" ? "，" : ", ");
      return [{
        id: source.id,
        title: source.title,
        byline,
        ...(url?.kind === "url" ? { href: url.url } : {}),
        uses: decision.uses.map((use) => useLabels[use][locale]),
      }];
    });
}
