import type { Source } from "@/types/culinary";
import type { ContentRightsRegistry } from "@/types/content-rights";
import type { SupportedLocale } from "@/types/localization";
import { formatImageAttribution } from "./recipe-images";

export interface ConsumerAttribution {
  id: string;
  disclosureKind: "license-required" | "provenance-only";
  notice: string;
  sourceUrl: string;
  licenseId: string;
  licenseUrl?: string;
  modificationNotice?: string;
}

export interface ConsumerRightsDisclosure {
  identity: "cooking-lab-original" | "factual-synthesis" | "official-authorized-recipe" | "cooking-lab-reconstruction" | "dish-profile-only";
  identityLabel: string;
  identityDescription: string;
  sourceIds: string[];
  attributions: ConsumerAttribution[];
}

export function buildConsumerRightsDisclosure(
  culinaryItemId: string,
  imageId: string | undefined,
  storyIds: readonly string[],
  registry: ContentRightsRegistry,
  locale: SupportedLocale,
): ConsumerRightsDisclosure {
  const restaurant = registry.restaurants.find((entry) => entry.culinaryItemId === culinaryItemId);
  const itemArtifacts = registry.artifacts.filter((artifact) => artifact.subject.type === "culinary-item" && artifact.subject.id === culinaryItemId);
  const factualSynthesis = itemArtifacts.some((artifact) => artifact.derivation === "factual-synthesis");
  const identity = restaurant?.kind ?? (factualSynthesis ? "factual-synthesis" : "cooking-lab-original");
  const copy = identityCopy[identity][locale];
  const relatedStoryIds = new Set(storyIds);
  const storyArtifacts = registry.artifacts
    .filter((artifact) => artifact.subject.type === "story" && relatedStoryIds.has(artifact.subject.id))
  const relatedProductProfileIds = new Set(registry.productProfiles.filter((profile) => profile.culinaryItemId === culinaryItemId).map((profile) => profile.id));
  const productProfileArtifacts = registry.artifacts
    .filter((artifact) => artifact.subject.type === "product-profile" && relatedProductProfileIds.has(artifact.subject.id));
  const sourceIds = [...new Set([
    ...itemArtifacts.flatMap((artifact) => artifact.sourceIds),
    ...storyArtifacts.flatMap((artifact) => artifact.sourceIds),
    ...productProfileArtifacts.flatMap((artifact) => artifact.sourceIds),
  ])];
  const imageArtifact = imageId
    ? registry.artifacts.find((artifact) => artifact.subject.type === "image" && artifact.subject.id === imageId)
    : undefined;
  const attributions = registry.attributions
    .filter((attribution) => attribution.artifactId === imageArtifact?.id)
    .map((attribution) => ({
      id: attribution.id,
      disclosureKind: attribution.disclosureKind,
      notice: formatImageAttribution(attribution.notice, locale),
      sourceUrl: attribution.sourceUrl,
      licenseId: attribution.licenseId,
      ...(attribution.licenseUrl ? { licenseUrl: attribution.licenseUrl } : {}),
      ...(attribution.modificationNotice ? {
        modificationNotice: locale === "zh-CN"
          ? "为页面构图裁切并转换为 WebP；不暗示作者、品牌或机构背书。"
          : "Cropped for layout and converted to WebP; no creator, brand, or institutional endorsement is implied.",
      } : {}),
    }));
  return { identity, identityLabel: copy.label, identityDescription: copy.description, sourceIds, attributions };
}

export function listConsumerRightsSources(
  disclosure: ConsumerRightsDisclosure,
  sources: readonly Source[],
  locale: SupportedLocale,
) {
  const wanted = new Set(disclosure.sourceIds);
  return sources.filter((source) => wanted.has(source.id) && source.health.status === "active").map((source) => {
    const locator = source.locators.find((entry) => entry.kind === "url");
    return {
      id: source.id,
      title: source.title,
      byline: [...source.authorNames, source.publisherOrInstitution].filter(Boolean).join(locale === "zh-CN" ? "，" : ", "),
      ...(locator?.kind === "url" ? { href: locator.url } : {}),
      uses: [locale === "zh-CN" ? "事实核对（不复用来源表达）" : "Factual cross-check only; source expression is not reused"],
    };
  });
}

const identityCopy = {
  "cooking-lab-original": {
    "zh-CN": { label: "Cooking Lab 原创编辑", description: "料理文字与结构由 Cooking Lab 独立编写；未复制第三方菜谱、叙事或媒体素材。" },
    en: { label: "Cooking Lab original editorial", description: "Cooking Lab independently wrote the culinary copy and structure; no third-party recipe, narrative, or media expression is copied." },
  },
  "factual-synthesis": {
    "zh-CN": { label: "Cooking Lab 原创事实综合", description: "页面依据多个可追溯来源核对事实，并以独立结构和文字重新编写；来源仅作事实参考。" },
    en: { label: "Cooking Lab factual synthesis", description: "The page cross-checks facts against traceable sources and uses independently written structure and prose; sources are reference-only." },
  },
  "official-authorized-recipe": {
    "zh-CN": { label: "官方授权配方", description: "该配方的商业展示、翻译与改编范围由书面许可限定；页面按许可要求披露。" },
    en: { label: "Official authorized recipe", description: "Written permission defines the commercial display, translation, and adaptation scope; this page follows those obligations." },
  },
  "cooking-lab-reconstruction": {
    "zh-CN": { label: "Cooking Lab 独立重构", description: "基于多个事实来源独立编写并完成料理复核；不是餐厅官方配方，也不暗示合作。" },
    en: { label: "Cooking Lab independent reconstruction", description: "Independently written from multiple factual sources and culinarily reviewed; it is not an official restaurant recipe and implies no partnership." },
  },
  "dish-profile-only": {
    "zh-CN": { label: "料理资料页", description: "证据只支持料理介绍，不提供推测步骤，也不暗示餐厅合作。" },
    en: { label: "Dish profile only", description: "Evidence supports a dish profile only; no inferred method or restaurant partnership is presented." },
  },
} as const;
