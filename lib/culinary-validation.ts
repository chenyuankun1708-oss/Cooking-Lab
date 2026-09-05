import { validateFlavorProfile } from "./flavor-validation";
import { isNonNegativeFinite, isPositiveFinite, isSlug } from "./validation-utils";
import { culinaryForms, servingContexts } from "@/data/culinary/taxonomy";
import { textureVocabulary } from "@/data/flavor";
import {
  browseTags,
  countries,
  cuisines,
  dietaryTags,
  dishTypes as recipeDishTypes,
  regions,
  subCuisines,
  techniques,
} from "@/data/taxonomy";
import {
  claimKinds,
  culinaryItemTypes,
  mealRoleIds,
  sourceHealthStatuses,
  sourceTypes,
  storyTypes,
  type CulinaryItem,
  type Evidence,
  type ProceduralPreparation,
  type Source,
  type Story,
} from "@/types/culinary";
import { publicationStatuses } from "@/types/publication";
import { supportedLocales, type TranslationSet } from "@/types/localization";
import type { Unit } from "@/types/ingredient";
import { emptyNutrition } from "@/types/nutrition";

export interface CulinaryValidationIssue {
  entityId: string;
  field: string;
  message: string;
}

const proceduralKinds = new Set(["cooking", "baking", "brewing", "extraction", "mixing", "assembly"]);
const units = new Set<Unit>(["g", "kg", "ml", "piece", "tbsp", "tsp"]);
const pairingWeights = new Set(["light", "medium", "rich"]);
const servingTemperatures = new Set(["cold", "cool", "room", "warm", "hot"]);
const allowedPreparationKinds: Readonly<Record<CulinaryItem["itemType"], ReadonlySet<string>>> = {
  dish: new Set(["cooking", "baking", "assembly"]),
  dessert: new Set(["cooking", "baking", "assembly"]),
  tea: new Set(["brewing", "serving-guidance", "no-consumer-preparation"]),
  coffee: new Set(["brewing", "extraction", "mixing", "serving-guidance", "no-consumer-preparation"]),
  "non-alcoholic-drink": new Set(["brewing", "extraction", "mixing", "assembly", "serving-guidance", "no-consumer-preparation"]),
  "alcoholic-drink": new Set(["mixing", "serving-guidance", "no-consumer-preparation"]),
};

export function validateCulinaryItem(item: CulinaryItem): CulinaryValidationIssue[] {
  const issues: CulinaryValidationIssue[] = [];
  const report = (field: string, message: string) => issues.push({ entityId: item.id || "<unknown>", field, message });

  if (!isSlug(item.id)) report("id", "CulinaryItem ID 必须使用 kebab-case");
  if (!isSlug(item.slug)) report("slug", "CulinaryItem slug 必须使用 kebab-case");
  if (!culinaryItemTypes.includes(item.itemType)) report("itemType", "未知 CulinaryItem type");
  validateTranslations(item.content, "content", report, (value) => Boolean(value.name.trim() && value.description.trim()));
  if (!publicationStatuses.includes(item.publication.status)) report("publication.status", "未知 publication status");
  if (!allowedPreparationKinds[item.itemType]?.has(item.preparation.kind)) {
    report("preparation.kind", `${item.itemType} 不支持 ${item.preparation.kind} preparation`);
  }

  for (const issue of validateFlavorProfile(item.flavor)) report(`flavor.${issue.field}`, issue.message);
  validateCulinaryTaxonomy(item, report);
  validateUniqueIds(item.taxonomy.techniqueIds, "taxonomy.techniqueIds", report);
  validateUniqueIds(item.taxonomy.formIds, "taxonomy.formIds", report);
  validateUniqueIds(item.storyIds, "storyIds", report);
  validateUniqueIds(item.pairing.mealRoleIds, "pairing.mealRoleIds", report);
  if (item.pairing.mealRoleIds.some((id) => !mealRoleIds.includes(id))) report("pairing.mealRoleIds", "存在未知 meal role ID");
  validateUniqueIds(item.pairing.servingContextIds, "pairing.servingContextIds", report);
  if (item.pairing.servingContextIds.some((id) => !(id in servingContexts))) report("pairing.servingContextIds", "存在未知 serving context ID");
  validateUniqueIds(item.pairing.cuisineIds, "pairing.cuisineIds", report);
  if (item.pairing.cuisineIds.some((id) => !(id in cuisines))) report("pairing.cuisineIds", "存在未知 pairing cuisine ID");
  item.pairing.facets.forEach((facet, index) => {
    if (facet.dimension === "weight" && !pairingWeights.has(facet.value)) report(`pairing.facets.${index}.value`, "未知 pairing weight");
    if (facet.dimension === "temperature" && !servingTemperatures.has(facet.value)) report(`pairing.facets.${index}.value`, "未知 serving temperature");
    if (facet.dimension === "texture" && !(facet.value in textureVocabulary)) report(`pairing.facets.${index}.value`, "未知 pairing texture ID");
  });

  if (item.images.availability === "available") {
    const { primaryImageId, imageIds } = item.images.references;
    if (!primaryImageId.trim() || !imageIds.includes(primaryImageId)) report("images", "Primary image 必须存在于 imageIds");
    validateUniqueIds(imageIds, "images.imageIds", report);
  }

  if (isProceduralPreparation(item.preparation)) {
    const { prepMinutes, processMinutes, totalMinutes } = item.preparation.time;
    if (![prepMinutes, processMinutes, totalMinutes].every(isNonNegativeFinite)) report("preparation.time", "Preparation time 必须是非负有限数");
    if (totalMinutes !== prepMinutes + processMinutes) report("preparation.time.totalMinutes", "总时间必须等于准备与过程时间之和");
    if (!isPositiveFinite(item.preparation.yield.amount)) report("preparation.yield.amount", "产出数量必须是正有限数");
    if (!item.preparation.inputs.length) report("preparation.inputs", "Procedural preparation 必须声明 inputs");
    validateUniqueIds(item.preparation.inputs.map(({ ingredientId }) => ingredientId), "preparation.inputs", report);
    item.preparation.inputs.forEach((input, index) => {
      if (!isPositiveFinite(input.amount)) report(`preparation.inputs.${index}.amount`, "Input amount 必须是正有限数");
      if (!units.has(input.unit)) report(`preparation.inputs.${index}.unit`, "Input unit 不在当前 schema 中");
      if (typeof input.optional !== "boolean") report(`preparation.inputs.${index}.optional`, "Input optional 必须是布尔值");
      if (input.note !== undefined && !input.note.trim()) report(`preparation.inputs.${index}.note`, "Input note 不能是空字符串");
    });
    validateUniqueIds(item.preparation.toolIds, "preparation.toolIds", report);
    item.preparation.steps.forEach((step, index) => {
      if (step.order !== index + 1) report(`preparation.steps.${index}.order`, "步骤序号必须连续");
      validateTranslations(step.content, `preparation.steps.${index}.content`, report, (value) => Boolean(value.instruction.trim()));
      if (step.durationMinutes !== undefined && !isNonNegativeFinite(step.durationMinutes)) {
        report(`preparation.steps.${index}.durationMinutes`, "步骤时间必须是非负有限数");
      }
    });
  } else if (item.preparation.kind === "serving-guidance") {
    if (!isNonNegativeFinite(item.preparation.estimatedMinutes)) report("preparation.estimatedMinutes", "Serving time 必须是非负有限数");
    validateUniqueIds(item.preparation.toolIds, "preparation.toolIds", report);
    validateTranslations(item.preparation.content, "preparation.content", report, (value) => Boolean(value.guidance.trim()));
  } else if (item.preparation.kind === "no-consumer-preparation") {
    validateTranslations(item.preparation.content, "preparation.content", report, (value) => Boolean(value.servingNote.trim()));
  }

  if (item.nutrition.applicability === "applicable" && item.nutrition.source === "declared-estimate") {
    for (const field of Object.keys(emptyNutrition()) as Array<keyof ReturnType<typeof emptyNutrition>>) {
      if (!isNonNegativeFinite(item.nutrition.value[field])) report(`nutrition.value.${field}`, "Nutrition estimate 必须是非负有限数");
    }
  }

  try {
    JSON.stringify(item);
  } catch {
    report("item", "CulinaryItem 必须可 JSON 序列化");
  }
  return issues;
}

function validateCulinaryTaxonomy(
  item: CulinaryItem,
  report: (field: string, message: string) => void,
) {
  const { taxonomy } = item;
  if (taxonomy.origin) {
    if (!(taxonomy.origin.countryId in countries)) report("taxonomy.origin.countryId", "国家 ID 不在 taxonomy registry 中");
    if (taxonomy.origin.regionId) {
      const region = regions[taxonomy.origin.regionId];
      if (!region) report("taxonomy.origin.regionId", "地域 ID 不在 taxonomy registry 中");
      else if (region.parentId !== taxonomy.origin.countryId) report("taxonomy.origin.regionId", "地域与所属国家不匹配");
    }
  }
  if (taxonomy.cuisine) {
    if (!(taxonomy.cuisine.cuisineId in cuisines)) report("taxonomy.cuisine.cuisineId", "菜系 ID 不在 taxonomy registry 中");
    if (taxonomy.cuisine.subCuisineId) {
      const subCuisine = subCuisines[taxonomy.cuisine.subCuisineId];
      if (!subCuisine) report("taxonomy.cuisine.subCuisineId", "子菜系 ID 不在 taxonomy registry 中");
      else if (subCuisine.parentId !== taxonomy.cuisine.cuisineId) report("taxonomy.cuisine.subCuisineId", "子菜系与父级菜系不匹配");
    }
  }
  if (taxonomy.techniqueIds.some((id) => !(id in techniques))) report("taxonomy.techniqueIds", "存在未知 technique ID");
  if (taxonomy.formIds.some((id) => !(id in culinaryForms) && !(id in recipeDishTypes))) report("taxonomy.formIds", "存在未知 culinary form ID");
  if (taxonomy.dietaryTagIds.some((id) => !(id in dietaryTags))) report("taxonomy.dietaryTagIds", "存在未知 dietary tag ID");
  if (taxonomy.browseTagIds.some((id) => !(id in browseTags))) report("taxonomy.browseTagIds", "存在未知 browse tag ID");
}

export function validateStory(story: Story): CulinaryValidationIssue[] {
  const issues: CulinaryValidationIssue[] = [];
  const report = (field: string, message: string) => issues.push({ entityId: story.id || "<unknown>", field, message });
  if (!isSlug(story.id)) report("id", "Story ID 必须使用 kebab-case");
  if (!storyTypes.includes(story.type)) report("type", "未知 Story type");
  if (!publicationStatuses.includes(story.publication.status)) report("publication.status", "未知 publication status");
  validateTranslations(story.content, "content", report, (value) => Boolean(
    value.title.trim()
    && value.dek.trim()
    && value.sections.length
    && value.sections.every((section) => section.heading.trim() && section.paragraphs.length && section.paragraphs.every((paragraph) => paragraph.trim())),
  ));
  const claimIds = story.claims.map((claim) => claim.id);
  validateUniqueIds(claimIds, "claims", report);
  story.claims.forEach((claim, index) => {
    if (!isSlug(claim.id)) report(`claims.${index}.id`, "Claim ID 必须使用 kebab-case");
    if (!claimKinds.includes(claim.kind)) report(`claims.${index}.kind`, "未知 claim kind");
    if (!claim.evidenceIds.length) report(`claims.${index}.evidenceIds`, "文化主张必须引用 evidence");
    validateUniqueIds(claim.evidenceIds, `claims.${index}.evidenceIds`, report);
    validateTranslations(claim.content, `claims.${index}.content`, report, (value) => Boolean(value.statement.trim()));
  });
  const relatedEntityKeys = story.relatedEntities.map((entity) => `${entity.type}:${entity.id}`);
  if (new Set(relatedEntityKeys).size !== relatedEntityKeys.length) report("relatedEntities", "Related entity 不能重复");
  story.relatedEntities.forEach((entity, index) => {
    if (!isSlug(entity.id)) report(`relatedEntities.${index}.id`, "Related entity ID 必须使用 kebab-case");
  });
  return issues;
}

export function validateSource(source: Source): CulinaryValidationIssue[] {
  const issues: CulinaryValidationIssue[] = [];
  const report = (field: string, message: string) => issues.push({ entityId: source.id || "<unknown>", field, message });
  if (!isSlug(source.id)) report("id", "Source ID 必须使用 kebab-case");
  if (!sourceTypes.includes(source.type)) report("type", "未知 source type");
  if (!source.title.trim()) report("title", "Source title 不能为空");
  if (!source.publisherOrInstitution.trim()) report("publisherOrInstitution", "Source publisher/institution 不能为空");
  if (source.authorNames.some((name) => !name.trim())) report("authorNames", "Source author name 不能为空");
  if (!source.locators.length) report("locators", "Source 必须至少有一个可重新定位的 locator");
  source.locators.forEach((locator, index) => validateSourceLocator(locator, `locators.${index}`, report));
  if (source.publication) {
    for (const [field, value] of Object.entries(source.publication)) {
      if (value !== undefined && !value.trim()) report(`publication.${field}`, "Publication metadata 不能是空字符串");
    }
  }
  if (!source.editorialNotes.trim()) report("editorialNotes", "Source 必须记录 editorial assessment");
  if (!new Set(["primary", "authoritative-secondary", "general-secondary", "contested"]).has(source.reliability)) {
    report("reliability", "未知 source reliability assessment");
  }
  if (source.rights.status === "public-domain" && !source.rights.basis.trim()) report("rights.basis", "Public domain 必须记录依据");
  if (source.rights.status === "open-license" && (!source.rights.licenseId.trim() || !isSafeHttpsUrl(source.rights.licenseUrl))) {
    report("rights", "Open license 必须记录 license ID 与 HTTPS URL");
  }
  if (source.rights.status === "open-license") {
    if (!source.rights.attribution.trim()) report("rights.attribution", "Open license 必须记录 attribution 文本");
    if (!new Set(["unmodified", "adapted", "not-reusing"]).has(source.rights.adaptationStatus)) {
      report("rights.adaptationStatus", "未知 open-license adaptation status");
    }
  }
  if ("notes" in source.rights && !source.rights.notes.trim()) report("rights.notes", "Rights notes 不能为空");
  if (!sourceHealthStatuses.includes(source.health.status)) report("health.status", "未知 source health status");
  if (!isIsoDate(source.health.checkedAt)) report("health.checkedAt", "Source health checkedAt 必须是有效 YYYY-MM-DD");
  if (source.health.status !== "active" && !source.health.notes?.trim()) {
    report("health.notes", "非 active Source health 必须说明状态变化");
  }
  return issues;
}

export function validateEvidence(evidence: Evidence, sourceIds: ReadonlySet<string>): CulinaryValidationIssue[] {
  const issues: CulinaryValidationIssue[] = [];
  const report = (field: string, message: string) => issues.push({ entityId: evidence.id || "<unknown>", field, message });
  if (!isSlug(evidence.id)) report("id", "Evidence ID 必须使用 kebab-case");
  if (!sourceIds.has(evidence.sourceId)) report("sourceId", "Evidence 引用了不存在的 Source");
  if (!new Set(["supports", "contradicts", "context"]).has(evidence.relation)) report("relation", "未知 evidence relation");
  if (!new Set(["primary", "strong", "limited", "contested"]).has(evidence.strength)) report("strength", "未知 evidence strength");
  evidence.locators.forEach((locator, index) => {
    if (!new Set(["page", "chapter", "section", "paragraph", "timestamp", "folio", "other"]).has(locator.kind)) {
      report(`locators.${index}.kind`, "未知 evidence locator kind");
    }
    if (!locator.value.trim()) report(`locators.${index}.value`, "Evidence locator value 不能为空");
  });
  if (!evidence.editorialNote.trim()) report("editorialNote", "Evidence 必须记录 editorial assessment");
  return issues;
}

function validateTranslations<T>(
  translations: TranslationSet<T>,
  field: string,
  report: (field: string, message: string) => void,
  isValueValid: (value: T) => boolean,
) {
  const locales = translations.entries.map((entry) => entry.locale);
  if (new Set(locales).size !== locales.length) report(field, "Translation locale 不能重复");
  if (!supportedLocales.includes(translations.defaultLocale)) report(`${field}.defaultLocale`, "不支持的 default locale");
  if (!locales.includes(translations.defaultLocale)) report(field, "Translation set 必须包含 default locale");
  translations.entries.forEach((entry, index) => {
    if (!supportedLocales.includes(entry.locale)) report(`${field}.entries.${index}.locale`, "不支持的 locale");
    if (!isValueValid(entry.value)) report(`${field}.entries.${index}.value`, "Localized content 不能为空");
  });
}

function validateUniqueIds(values: readonly string[], field: string, report: (field: string, message: string) => void) {
  if (new Set(values).size !== values.length) report(field, "ID 列表不能重复");
  if (values.some((value) => !isSlug(value))) report(field, "ID 必须使用 kebab-case");
}

export function validateSourceLocator(
  locator: Source["locators"][number],
  field: string,
  report: (field: string, message: string) => void,
) {
  if (locator.kind === "url") {
    if (!isSafeHttpsUrl(locator.url)) report(`${field}.url`, "Web locator 必须是无凭据的 HTTPS URL");
    if (!isIsoDate(locator.accessedAt)) report(`${field}.accessedAt`, "Web locator accessedAt 必须是有效 YYYY-MM-DD");
    return;
  }
  if (locator.kind === "doi") {
    if (!/^10\.\d{4,9}\/\S+$/i.test(locator.doi.trim())) report(`${field}.doi`, "DOI 格式无效");
    return;
  }
  if (locator.kind === "isbn") {
    if (!/^(?:\d{9}[\dX]|\d{13})$/i.test(locator.isbn.replace(/[\s-]/g, ""))) report(`${field}.isbn`, "ISBN 格式无效");
    return;
  }
  if (locator.kind === "archive") {
    if (!locator.identifier.trim() || !locator.collection.trim() || !locator.holdingInstitution.trim()) {
      report(field, "Archive locator 必须包含 identifier、collection 与 holding institution");
    }
    return;
  }
  if (!locator.citation.trim()) report(`${field}.citation`, "Physical citation 不能为空");
  if (locator.holdingInstitution !== undefined && !locator.holdingInstitution.trim()) {
    report(`${field}.holdingInstitution`, "Holding institution 不能是空字符串");
  }
}

export function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isProceduralPreparation(
  preparation: CulinaryItem["preparation"],
): preparation is ProceduralPreparation {
  return proceduralKinds.has(preparation.kind);
}
