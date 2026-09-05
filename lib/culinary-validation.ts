import { validateFlavorProfile } from "./flavor-validation";
import { isNonNegativeFinite, isPositiveFinite, isSlug } from "./validation-utils";
import {
  claimKinds,
  culinaryItemTypes,
  mealRoleIds,
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

export interface CulinaryValidationIssue {
  entityId: string;
  field: string;
  message: string;
}

const proceduralKinds = new Set(["cooking", "baking", "brewing", "extraction", "mixing", "assembly"]);
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
  validateUniqueIds(item.taxonomy.techniqueIds, "taxonomy.techniqueIds", report);
  validateUniqueIds(item.taxonomy.formIds, "taxonomy.formIds", report);
  validateUniqueIds(item.storyIds, "storyIds", report);
  validateUniqueIds(item.pairing.mealRoleIds, "pairing.mealRoleIds", report);
  if (item.pairing.mealRoleIds.some((id) => !mealRoleIds.includes(id))) report("pairing.mealRoleIds", "存在未知 meal role ID");

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
    item.preparation.steps.forEach((step, index) => {
      if (step.order !== index + 1) report(`preparation.steps.${index}.order`, "步骤序号必须连续");
      validateTranslations(step.content, `preparation.steps.${index}.content`, report, (value) => Boolean(value.instruction.trim()));
      if (step.durationMinutes !== undefined && !isNonNegativeFinite(step.durationMinutes)) {
        report(`preparation.steps.${index}.durationMinutes`, "步骤时间必须是非负有限数");
      }
    });
  } else if (item.preparation.kind === "serving-guidance") {
    if (!isNonNegativeFinite(item.preparation.estimatedMinutes)) report("preparation.estimatedMinutes", "Serving time 必须是非负有限数");
    validateTranslations(item.preparation.content, "preparation.content", report, (value) => Boolean(value.guidance.trim()));
  } else if (item.preparation.kind === "no-consumer-preparation") {
    validateTranslations(item.preparation.content, "preparation.content", report, (value) => Boolean(value.servingNote.trim()));
  }

  try {
    JSON.stringify(item);
  } catch {
    report("item", "CulinaryItem 必须可 JSON 序列化");
  }
  return issues;
}

export function validateStory(story: Story): CulinaryValidationIssue[] {
  const issues: CulinaryValidationIssue[] = [];
  const report = (field: string, message: string) => issues.push({ entityId: story.id || "<unknown>", field, message });
  if (!isSlug(story.id)) report("id", "Story ID 必须使用 kebab-case");
  if (!storyTypes.includes(story.type)) report("type", "未知 Story type");
  validateTranslations(story.content, "content", report, (value) => Boolean(value.title.trim() && value.body.trim()));
  const claimIds = story.claims.map((claim) => claim.id);
  validateUniqueIds(claimIds, "claims", report);
  story.claims.forEach((claim, index) => {
    if (!isSlug(claim.id)) report(`claims.${index}.id`, "Claim ID 必须使用 kebab-case");
    if (!claimKinds.includes(claim.kind)) report(`claims.${index}.kind`, "未知 claim kind");
    if (!claim.evidenceIds.length) report(`claims.${index}.evidenceIds`, "文化主张必须引用 evidence");
    validateUniqueIds(claim.evidenceIds, `claims.${index}.evidenceIds`, report);
    validateTranslations(claim.content, `claims.${index}.content`, report, (value) => Boolean(value.statement.trim()));
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
  if ("notes" in source.rights && !source.rights.notes.trim()) report("rights.notes", "Rights notes 不能为空");
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

function validateSourceLocator(
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

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isProceduralPreparation(
  preparation: CulinaryItem["preparation"],
): preparation is ProceduralPreparation {
  return proceduralKinds.has(preparation.kind);
}
