import type { CulinaryItem, Evidence, ProceduralPreparation, Source, Story } from "@/types/culinary";
import type { Ingredient } from "@/types/ingredient";
import type { RecipeImage } from "@/types/image";
import { calculateCost } from "./cost";
import { validateCulinaryItem, validateEvidence, validateSource, validateStory, type CulinaryValidationIssue } from "./culinary-validation";
import { validateCulinaryImageReferences, validateImageAssets } from "./image-validation";
import type { IngredientRepository } from "./ingredient-repository";
import { calculateNutrition } from "./nutrition";

export type CulinaryPublishingIssueCode =
  | "item-schema"
  | "translation-review"
  | "primary-image"
  | "nutrition-model"
  | "cost-model"
  | "reference-integrity"
  | "preparation-completeness"
  | "story-invalid"
  | "source-invalid"
  | "evidence-invalid";

export interface CulinaryPublishingIssue {
  code: CulinaryPublishingIssueCode;
  field: string;
  message: string;
}

export interface CulinaryPublishingContext {
  ingredients: readonly Ingredient[];
  images: readonly RecipeImage[];
  localAssetExists: (src: string) => boolean;
  stories: readonly Story[];
  sources: readonly Source[];
  evidence: readonly Evidence[];
}

export interface CulinaryPublishingResult {
  itemId: string;
  eligible: boolean;
  issues: CulinaryPublishingIssue[];
}

export function evaluateCulinaryItemPublishingEligibility(
  item: CulinaryItem,
  context: CulinaryPublishingContext,
): CulinaryPublishingResult {
  const issues: CulinaryPublishingIssue[] = [];
  const add = (code: CulinaryPublishingIssueCode, issue: Pick<CulinaryValidationIssue, "field" | "message">) => {
    issues.push({ code, field: issue.field, message: issue.message });
  };

  validateCulinaryItem(item).forEach((issue) => add("item-schema", issue));
  const ingredientRepository = createRepository(context.ingredients);
  const defaultTranslation = item.content.entries.find((entry) => entry.locale === item.content.defaultLocale);
  if (defaultTranslation?.status !== "reviewed") {
    issues.push({ code: "translation-review", field: "content", message: "默认语言内容必须通过 editorial review" });
  }

  if (item.images.availability === "none") {
    issues.push({ code: "primary-image", field: "images", message: "公开 CulinaryItem 必须有 primary image" });
  } else {
    const references = item.images.references;
    const referencedImages = context.images.filter((image) => references.imageIds.includes(image.id));
    validateCulinaryImageReferences([item], context.images).forEach((issue) => {
      issues.push({ code: "reference-integrity", field: issue.field, message: issue.message });
    });
    referencedImages.flatMap((image) => validateImageAssets([image])).forEach((issue) => {
      issues.push({ code: "primary-image", field: `images.${issue.field}`, message: issue.message });
    });
    const primary = context.images.find((image) => image.id === references.primaryImageId);
    if (primary?.delivery === "local" && !context.localAssetExists(primary.src)) {
      issues.push({ code: "primary-image", field: "images.primaryImageId", message: "本地 primary image 文件不存在" });
    }
  }

  if (!item.taxonomy.origin || !item.taxonomy.cuisine || !item.taxonomy.formIds.length) {
    issues.push({ code: "item-schema", field: "taxonomy", message: "公开 CulinaryItem 必须声明 origin、cuisine 与至少一个 form" });
  }
  if (!item.pairing.mealRoleIds.length || !item.pairing.servingContextIds.length) {
    issues.push({ code: "item-schema", field: "pairing", message: "公开 CulinaryItem 必须声明 meal role 与 serving context" });
  }

  const preparation = item.preparation;
  if (isProceduralPreparation(preparation)) {
    for (const input of preparation.inputs) {
      if (!ingredientRepository.getById(input.ingredientId)) {
        issues.push({ code: "reference-integrity", field: "preparation.inputs", message: `不存在的 ingredient ID: ${input.ingredientId}` });
      }
    }
    const minimumSteps = item.itemType === "dish" || item.itemType === "dessert" ? 3 : 2;
    if (preparation.steps.length < minimumSteps) {
      issues.push({ code: "preparation-completeness", field: "preparation.steps", message: `${item.itemType} 至少需要 ${minimumSteps} 个可执行步骤` });
    }
    if (!preparation.steps.some((step) => step.content.entries.some((entry) => entry.value.rationale?.trim()))) {
      issues.push({ code: "preparation-completeness", field: "preparation.steps", message: "公开 procedural preparation 必须包含有用的 rationale" });
    }
    if (preparation.steps.some((step) => step.content.entries.find((entry) => entry.locale === step.content.defaultLocale)?.status !== "reviewed")) {
      issues.push({ code: "translation-review", field: "preparation.steps", message: "默认语言步骤必须通过 editorial review" });
    }
  } else {
    const defaultPreparationTranslation = preparation.content.entries.find((entry) => entry.locale === preparation.content.defaultLocale);
    if (defaultPreparationTranslation?.status !== "reviewed") {
      issues.push({ code: "translation-review", field: "preparation.content", message: "默认语言 serving content 必须通过 editorial review" });
    }
  }

  if ((item.itemType === "dish" || item.itemType === "dessert") && item.nutrition.applicability !== "applicable") {
    issues.push({ code: "nutrition-model", field: "nutrition", message: "公开 dish/dessert 必须有可用 nutrition model" });
  }
  if ((item.itemType === "dish" || item.itemType === "dessert") && item.cost.source === "not-modeled") {
    issues.push({ code: "cost-model", field: "cost", message: "公开 dish/dessert 必须有可用 cost model" });
  }
  if (item.nutrition.applicability === "applicable" && item.nutrition.source === "ingredient-derived") {
    if (!isProcedural(item) || !calculateNutrition(item.preparation.inputs, ingredientRepository).complete) {
      issues.push({ code: "nutrition-model", field: "nutrition", message: "Ingredient-derived nutrition 需要完整、可换算的 preparation inputs" });
    }
  }
  if (item.cost.source === "ingredient-derived") {
    if (!isProcedural(item) || !calculateCost(item.preparation.inputs, ingredientRepository).complete) {
      issues.push({ code: "cost-model", field: "cost", message: "Ingredient-derived cost 需要完整、可换算的 preparation inputs" });
    }
  }

  const storyById = new Map(context.stories.map((story) => [story.id, story]));
  const evidenceById = new Map(context.evidence.map((record) => [record.id, record]));
  const sourceById = new Map(context.sources.map((source) => [source.id, source]));
  const referencedEvidenceIds = new Set<string>();

  for (const storyId of item.storyIds) {
    const story = storyById.get(storyId);
    if (!story) {
      issues.push({ code: "reference-integrity", field: "storyIds", message: `不存在的 Story ID: ${storyId}` });
      continue;
    }
    validateStory(story).forEach((issue) => add("story-invalid", issue));
    for (const claim of story.claims) {
      claim.evidenceIds.forEach((evidenceId) => referencedEvidenceIds.add(evidenceId));
    }
  }

  for (const evidenceId of referencedEvidenceIds) {
    const record = evidenceById.get(evidenceId);
    if (!record) {
      issues.push({ code: "reference-integrity", field: "story.claims.evidenceIds", message: `不存在的 Evidence ID: ${evidenceId}` });
      continue;
    }
    validateEvidence(record, new Set(sourceById.keys())).forEach((issue) => add("evidence-invalid", issue));
    const source = sourceById.get(record.sourceId);
    if (source) {
      validateSource(source).forEach((issue) => add("source-invalid", issue));
      if (source.rights.status === "unknown") {
        issues.push({ code: "source-invalid", field: "rights", message: `Source ${source.id} 的 rights 尚未完成评估` });
      }
      if (source.health.status === "rights-changed") {
        issues.push({ code: "source-invalid", field: "health", message: `Source ${source.id} 的 rights 已变化，必须重新审核` });
      }
    }
  }

  return { itemId: item.id, eligible: issues.length === 0, issues };
}

export function isCulinaryItemPubliclyVisible(item: CulinaryItem, context: CulinaryPublishingContext): boolean {
  return item.publication.status === "published" && evaluateCulinaryItemPublishingEligibility(item, context).eligible;
}

function isProcedural(item: CulinaryItem): item is CulinaryItem & { preparation: Extract<CulinaryItem["preparation"], { kind: "cooking" | "baking" | "brewing" | "extraction" | "mixing" | "assembly" }> } {
  return isProceduralPreparation(item.preparation);
}

function isProceduralPreparation(
  preparation: CulinaryItem["preparation"],
): preparation is ProceduralPreparation {
  return new Set(["cooking", "baking", "brewing", "extraction", "mixing", "assembly"]).has(preparation.kind);
}

function createRepository(ingredients: readonly Ingredient[]): IngredientRepository {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return {
    getById: (id) => ingredientById.get(id),
    list: () => ingredients,
  };
}
