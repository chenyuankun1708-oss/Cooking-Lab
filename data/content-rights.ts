import type { CulinaryItem, Evidence, Source, Story } from "@/types/culinary";
import type {
  AttributionRequirement,
  AiGenerationRecord,
  AiInputArtifact,
  ContentArtifact,
  ContentDerivation,
  ContentRightsRegistry,
  RightsAssessment,
  RightsPermission,
  UsageDecision,
} from "@/types/content-rights";
import type { Ingredient } from "@/types/ingredient";
import type { RecipeImage, RecipeImageLicense } from "@/types/image";
import type { ResearchRecord } from "@/types/research";
import { createContentVersion } from "@/lib/content-version";

const assessedAt = "2026-09-06";
const reviewDueAt = "2027-03-06";
const reviewer = "Cooking Lab editorial rights review";
const jurisdictionBaseline = ["CN", "US", "EU", "UK"] as const;

export interface CreateContentRightsRegistryInput {
  items: readonly CulinaryItem[];
  auditedItemIds: readonly string[];
  images: readonly RecipeImage[];
  ingredients: readonly Ingredient[];
  stories: readonly Story[];
  evidence: readonly Evidence[];
  sources: readonly Source[];
  researchRecords: readonly ResearchRecord[];
  aiInputs?: readonly AiInputArtifact[];
  ai?: readonly AiGenerationRecord[];
  aiAssessments?: readonly RightsAssessment[];
  textArtifactDerivations: readonly {
    artifactId: string;
    derivation: ContentDerivation;
  }[];
}

export function createContentRightsRegistry(input: CreateContentRightsRegistryInput): ContentRightsRegistry {
  if (!Array.isArray(input.textArtifactDerivations)) {
    throw new Error("textArtifactDerivations is required; content origin cannot be inferred safely");
  }
  const auditedItemIds = new Set(input.auditedItemIds);
  const publishedItems = input.items.filter((item) => item.publication.status === "published" && auditedItemIds.has(item.id));
  const itemIds = new Set(publishedItems.map((item) => item.id));
  const storyIds = new Set(publishedItems.flatMap((item) => item.storyIds));
  const imageIds = new Set(publishedItems.flatMap((item) => item.images.availability === "available" ? [item.images.references.primaryImageId] : []));
  const researchBySubject = new Map<string, ResearchRecord[]>();
  for (const record of input.researchRecords.filter((entry) => entry.status === "closed" && itemIds.has(entry.subject.id))) {
    researchBySubject.set(record.subject.id, [...(researchBySubject.get(record.subject.id) ?? []), record]);
  }
  const evidenceById = new Map(input.evidence.map((entry) => [entry.id, entry]));
  const textDerivationByArtifactId = new Map<string, ContentDerivation>();
  for (const declaration of input.textArtifactDerivations) {
    if (textDerivationByArtifactId.has(declaration.artifactId)) {
      throw new Error(`Duplicate text artifact derivation declaration: ${declaration.artifactId}`);
    }
    textDerivationByArtifactId.set(declaration.artifactId, declaration.derivation);
  }
  const consumedTextDerivationIds = new Set<string>();
  const declaredTextDerivation = (artifactId: string): ContentDerivation => {
    const derivation = textDerivationByArtifactId.get(artifactId);
    if (!derivation) throw new Error(`Missing text artifact derivation declaration: ${artifactId}`);
    consumedTextDerivationIds.add(artifactId);
    return derivation;
  };
  const aiRecordByArtifactId = new Map((input.ai ?? []).map((record) => [record.artifactId, record]));
  const aiInputById = new Map((input.aiInputs ?? []).map((artifact) => [artifact.id, artifact]));

  const artifacts: ContentArtifact[] = [];
  const assessments: RightsAssessment[] = [];
  const decisions: UsageDecision[] = [];
  const attributions: AttributionRequirement[] = [];

  for (const item of publishedItems) {
    const records = researchBySubject.get(item.id) ?? [];
    const sourceIds = unique(records.flatMap((record) => record.sourceDecisions.flatMap((decision) => decision.disposition === "accepted" ? [decision.sourceId] : [])));
    for (const kind of ["identity", "preparation"] as const) {
      addFirstPartyArtifact({
        id: `${item.id}-${kind}`,
        version: createContentVersion({ kind, item, sourceIds }),
        subject: { type: "culinary-item", id: item.id },
        kind,
        derivation: declaredTextDerivation(`${item.id}-${kind}`),
        sourceIds,
        evidenceIds: [],
      }, artifacts, assessments, decisions);
    }
    for (const kind of ["nutrition", "cost"] as const) {
      addFirstPartyArtifact({
        id: `${item.id}-${kind}`,
        version: createContentVersion({ kind, item }),
        subject: { type: "culinary-item", id: item.id },
        kind,
        derivation: "original",
        sourceIds: [],
        evidenceIds: [],
      }, artifacts, assessments, decisions);
    }
  }

  for (const story of input.stories.filter((entry) => entry.publication.status === "published" && storyIds.has(entry.id))) {
    const evidenceIds = unique(story.claims.flatMap((claim) => claim.evidenceIds));
    const sourceIds = unique(evidenceIds.flatMap((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      return evidence ? [evidence.sourceId] : [];
    }));
    addFirstPartyArtifact({
      id: `${story.id}-story`,
      version: createContentVersion({ kind: "story", story, sourceIds, evidenceIds }),
      subject: { type: "story", id: story.id },
      kind: "story",
      derivation: declaredTextDerivation(`${story.id}-story`),
      sourceIds,
      evidenceIds,
    }, artifacts, assessments, decisions);
  }

  for (const image of input.images.filter((entry) => imageIds.has(entry.id))) {
    addImageArtifact(image, artifacts, assessments, decisions, attributions);
  }

  const unusedTextDerivationIds = [...textDerivationByArtifactId.keys()].filter((artifactId) => !consumedTextDerivationIds.has(artifactId));
  if (unusedTextDerivationIds.length) {
    throw new Error(`Text artifact derivation declarations do not resolve: ${unusedTextDerivationIds.join(", ")}`);
  }

  const usedSourceIds = new Set(artifacts.flatMap((artifact) => artifact.sourceIds));
  for (const source of input.sources.filter((entry) => usedSourceIds.has(entry.id))) {
    assessments.push(buildSourceAssessment(source));
  }
  for (const decision of decisions) {
    const artifact = artifacts.find((entry) => entry.id === decision.artifactId);
    if (!artifact) continue;
    const sourceAssessments = artifact.sourceIds.map((sourceId) => `source-rights-${sourceId}`);
    const aiRecord = aiRecordByArtifactId.get(artifact.id);
    const aiAssessmentIds = aiRecord
      ? unique([
          ...aiRecord.termsAssessmentIds,
          ...aiRecord.inputArtifactIds.flatMap((inputId) => aiInputById.get(inputId)?.rightsAssessmentIds ?? []),
        ])
      : [];
    decision.assessmentIds = [artifact.rightsAssessmentId, ...sourceAssessments, ...aiAssessmentIds];
    if (artifact.derivation === "generated" && !aiRecord) {
      decision.decision = "block";
      decision.conditions = [
        ...decision.conditions,
        "Generated expression has no complete, current AI provenance and service-terms chain.",
      ];
    }
  }

  const costAssessmentId = "rights-cooking-lab-cn-price-estimate-2026-09";
  assessments.push(firstPartyAssessment(costAssessmentId, { type: "dataset", id: "cooking-lab-cn-price-estimate-2026-09" }));
  assessments.push(approvedFutureDatasets.usdaFoodDataCentral.rightsAssessment);
  assessments.push(...(input.aiAssessments ?? []));

  const nutrition = input.ingredients.map((ingredient) => ({
    ingredientId: ingredient.id,
    kind: "editorial-estimate" as const,
    provenanceId: ingredient.nutritionProvenanceId,
    basis: "per-100g" as const,
    method: "Cooking Lab editorial reference estimate normalized to 100 g; not imported from an external database.",
    limitations: "Demonstration estimate only. Brand, variety, water content, preparation, and edible yield can materially change values.",
    reviewedAt: assessedAt,
    reviewer,
  }));

  return {
    artifacts,
    assessments,
    attributions,
    decisions,
    datasets: [{
      id: "usda-fooddata-central-future-import",
      provider: "USDA Agricultural Research Service",
      title: "FoodData Central",
      version: "not-yet-imported",
      sourceUrl: "https://fdc.nal.usda.gov/api-guide.html",
      licenseId: "cc0-public-domain",
      rightsAssessmentId: "rights-usda-fooddata-central-future-import",
      access: { method: "versioned-download", buildTimeNetworkAccess: false, apiKeyRequired: false },
      reuse: { scope: "substantial-dataset", extraction: "versioned-download", redistribution: "attribution" },
    }],
    nutrition,
    costs: [{
      id: "cooking-lab-cn-price-estimate-2026-09",
      method: "first-party-estimate",
      geography: "Mainland China reference market",
      currency: "CNY",
      effectiveDate: "2026-09-01",
      methodology: "Static Cooking Lab editorial estimates per 100 g; no retailer database or systematic extraction is used.",
      rightsAssessmentId: costAssessmentId,
    }],
    aiInputs: input.aiInputs ?? [],
    ai: input.ai ?? [],
    externalMedia: [],
    restaurants: [],
    productProfiles: [],
  } satisfies ContentRightsRegistry;
}

export const m10AuditedCulinaryItemIds = Object.freeze([
  "tomato-scrambled-eggs",
  "cantonese-mushroom-steamed-chicken",
  "cantonese-ginger-scallion-fish",
  "home-mapo-tofu",
  "sichuan-smashed-cucumber",
  "hunan-chili-pork",
  "yunnan-mushroom-chicken-stew",
  "northwest-cumin-lamb",
  "chaoshan-fish-congee",
  "french-ratatouille",
  "french-lentil-soup",
  "italian-tomato-basil-pasta",
  "spanish-potato-omelet",
  "spanish-chickpea-spinach",
  "greek-lemon-oregano-chicken",
  "japanese-oyakodon",
  "japanese-miso-salmon",
  "japanese-miso-tofu-soup",
  "korean-bibimbap-home",
  "korean-glass-noodle-stir-fry",
  "korean-tofu-stew-home",
  "thai-basil-chicken",
  "thai-green-papaya-salad",
  "vietnamese-beef-noodle-soup-home",
  "malaysian-turmeric-chicken",
  "singapore-chicken-rice-home",
  "indonesian-chili-eggplant",
  "filipino-chicken-adobo-home",
  "mexican-black-bean-tacos",
  "huevos-rancheros-home",
  "indian-chana-masala-home",
  "indian-masoor-dal",
  "lebanese-hummus-plate",
  "lebanese-mujadara",
  "dongpo-pork",
  "tomyum-kung",
  "greek-village-salad",
  "mango-sticky-rice",
  "tiramisu",
  "apple-crumble",
  "longjing-green-tea",
  "masala-chai",
  "moroccan-mint-tea",
  "lapsang-souchong",
  "espresso",
  "vietnamese-iced-coffee",
  "hibiscus-agua-fresca",
  "salted-lassi",
  "fino-sherry",
  "junmai-sake",
] as const);

export function createM10TextArtifactDerivations(
  items: readonly CulinaryItem[],
  stories: readonly Story[],
  researchRecords: readonly ResearchRecord[],
): CreateContentRightsRegistryInput["textArtifactDerivations"] {
  const m10ItemIds = new Set<string>(m10AuditedCulinaryItemIds);
  const publishedItems = items.filter((item) => item.publication.status === "published");
  const unsupportedItemIds = publishedItems.map((item) => item.id).filter((itemId) => !m10ItemIds.has(itemId));
  if (unsupportedItemIds.length) {
    throw new Error(`M10 non-AI authoring baseline cannot declare later content: ${unsupportedItemIds.join(", ")}`);
  }
  const linkedStoryIds = new Set(publishedItems.flatMap((item) => item.storyIds));
  const sourcedItemIds = new Set(researchRecords
    .filter((record) => record.status === "closed" && record.sourceDecisions.some((decision) => decision.disposition === "accepted"))
    .map((record) => record.subject.id));
  return [
    ...publishedItems.flatMap((item) => ([
      { artifactId: `${item.id}-identity`, derivation: sourcedItemIds.has(item.id) ? "factual-synthesis" as const : "original" as const },
      { artifactId: `${item.id}-preparation`, derivation: sourcedItemIds.has(item.id) ? "factual-synthesis" as const : "original" as const },
    ])),
    ...stories
      .filter((story) => story.publication.status === "published" && linkedStoryIds.has(story.id))
      .map((story) => ({ artifactId: `${story.id}-story`, derivation: "factual-synthesis" as const })),
  ];
}

function addFirstPartyArtifact(
  input: Pick<ContentArtifact, "id" | "version" | "subject" | "kind" | "derivation" | "sourceIds" | "evidenceIds">,
  artifacts: ContentArtifact[],
  assessments: RightsAssessment[],
  decisions: UsageDecision[],
) {
  const rightsAssessmentId = `rights-${input.id}`;
  const usageDecisionId = `usage-${input.id}`;
  artifacts.push({
    ...input,
    rightsAssessmentId,
    usageDecisionId,
    attributionRequirementIds: [],
  });
  assessments.push(firstPartyAssessment(rightsAssessmentId, { type: "artifact", id: input.id }));
  decisions.push({
    id: usageDecisionId,
    artifactId: input.id,
    assessmentIds: [rightsAssessmentId],
    intendedUse: "production-commercial-ready",
    decision: "allow",
    conditions: input.sourceIds.length ? ["Only independently written factual synthesis is authorized; source expression remains reference-only."] : [],
    decidedAt: assessedAt,
    reviewer,
  });
}

function addImageArtifact(
  image: RecipeImage,
  artifacts: ContentArtifact[],
  assessments: RightsAssessment[],
  decisions: UsageDecision[],
  attributions: AttributionRequirement[],
) {
  const artifactId = `${image.id}-image`;
  const rightsAssessmentId = `rights-${artifactId}`;
  const usageDecisionId = `usage-${artifactId}`;
  const attributionId = `attribution-${image.id}`;
  const needsAttribution = ["cc-by", "cc-by-sa", "unsplash-license", "pexels-license", "pixabay-content-license", "other-permitted"].includes(image.license);
  const needsProvenanceDisclosure = image.source !== "self-created" && Boolean(image.sourceUrl);
  const shareAlike = image.license === "cc-by-sa";
  const prohibited = ["cc-by-nc", "cc-by-nd", "cc-by-nc-sa", "cc-by-nc-nd", "unknown", "prohibited"].includes(image.license);
  const attributionRequirementIds = needsAttribution ? [attributionId] : [];
  artifacts.push({
    id: artifactId,
    version: createContentVersion({ kind: "image", image }),
    subject: { type: "image", id: image.id },
    kind: "image",
    derivation: image.source === "ai-generated" ? "generated" : image.source === "self-created" ? "original" : "adaptation",
    sourceIds: [],
    evidenceIds: [],
    rightsAssessmentId,
    usageDecisionId,
    attributionRequirementIds,
  });
  assessments.push({
    id: rightsAssessmentId,
    subject: { type: "artifact", id: artifactId },
    jurisdictionBaseline,
    basis: imageBasis(image),
    authorityVersion: image.license,
    accessedAt: assessedAt,
    applicableTerritories: jurisdictionBaseline,
    permissions: allPermissions(prohibited ? "prohibited" : needsAttribution ? "allowed-with-obligations" : "allowed", `Local publication under ${image.license}`),
    attributionRequirementIds,
    risks: imageRiskReviews(image),
    uncertainty: "",
    assessedAt,
    reviewer,
    reviewDueAt,
  });
  decisions.push({
    id: usageDecisionId,
    artifactId,
    assessmentIds: [rightsAssessmentId],
    intendedUse: "production-commercial-ready",
    decision: prohibited ? "block" : needsAttribution ? "allow-with-obligations" : "allow",
    conditions: [
      ...(needsAttribution ? ["Render creator, source, license, and modification notice on the culinary item page."] : []),
      ...(shareAlike ? ["Keep the adapted image in its own asset-file boundary under CC BY-SA; no proprietary content database is relicensed."] : []),
    ],
    decidedAt: assessedAt,
    reviewer,
  });
  if (needsAttribution || needsProvenanceDisclosure) {
    attributions.push({
      id: attributionId,
      artifactId,
      disclosureKind: needsAttribution ? "license-required" : "provenance-only",
      creator: image.author ?? "Unknown creator",
      workTitle: image.alt,
      sourceUrl: image.sourceUrl ?? "",
      licenseId: image.license,
      ...(image.licenseUrl ? { licenseUrl: image.licenseUrl } : {}),
      notice: image.attribution ?? `${image.author ?? "Creator"}; ${image.license}`,
      modificationNotice: "Cropped and converted to WebP for layout and delivery; no endorsement is implied.",
      placement: "item",
      shareAlikeRequired: shareAlike,
      ...(shareAlike ? { isolationBoundary: "asset-file" as const } : {}),
    });
  }
}

function buildSourceAssessment(source: Source): RightsAssessment {
  const id = `source-rights-${source.id}`;
  const basis = source.rights.status === "public-domain"
    ? { kind: "public-domain" as const, basis: source.rights.basis }
    : source.rights.status === "open-license"
      ? { kind: "open-license" as const, licenseId: source.rights.licenseId, licenseUrl: source.rights.licenseUrl }
      : source.rights.status === "permission-granted"
        ? { kind: "permission" as const, permissionReferenceId: `non-sensitive-permission-${source.id}` }
        : source.rights.status === "reference-only"
          ? { kind: "reference-only" as const, boundary: "Citation metadata and facts only; no source prose, structure, image, subtitle, transcript, or video asset is reused." }
          : { kind: "reference-only" as const, boundary: "Unknown rights are not authorized for reuse." };
  const referenceOnly = basis.kind === "reference-only";
  return {
    id,
    subject: { type: "source", id: source.id },
    jurisdictionBaseline,
    basis,
    authorityVersion: source.rights.status === "open-license" ? source.rights.licenseId : source.rights.status,
    accessedAt: source.locators.find((locator) => locator.kind === "url")?.accessedAt ?? assessedAt,
    applicableTerritories: jurisdictionBaseline,
    permissions: referenceOnly ? {
      store: { status: "allowed", scope: "Store citation metadata and bounded Evidence locators only" },
      transform: { status: "allowed-with-obligations", scope: "Extract facts into independently written synthesis only" },
      publish: { status: "prohibited", scope: "Do not publish source expression or assets" },
      commercialize: { status: "prohibited", scope: "Do not commercialize source expression or assets" },
    } : allPermissions("allowed-with-obligations", "Use within the source grant and recorded attribution conditions"),
    attributionRequirementIds: [],
    risks: riskReviews("Source is retained as a retrievable citation; its expression is not copied."),
    uncertainty: source.rights.status === "unknown" ? "Source rights are unknown." : "",
    assessedAt,
    reviewer,
    reviewDueAt,
  };
}

function firstPartyAssessment(id: string, subject: RightsAssessment["subject"]): RightsAssessment {
  return {
    id,
    subject,
    jurisdictionBaseline,
    basis: { kind: "first-party", owner: "Cooking Lab" },
    authorityVersion: "Cooking Lab Content Rights Policy v1.0",
    accessedAt: assessedAt,
    applicableTerritories: jurisdictionBaseline,
    permissions: allPermissions("allowed", "Cooking Lab original editorial expression and first-party data method"),
    attributionRequirementIds: [],
    risks: riskReviews("No third-party expressive material, database extraction, endorsement, or personal data is included."),
    uncertainty: "",
    assessedAt,
    reviewer,
    reviewDueAt,
  };
}

function imageBasis(image: RecipeImage): RightsAssessment["basis"] {
  if (image.source === "self-created") return { kind: "first-party", owner: "Cooking Lab" };
  if (["public-domain", "cc0"].includes(image.license)) return { kind: "public-domain", basis: image.license };
  return {
    kind: "open-license",
    licenseId: image.license,
    licenseUrl: image.licenseUrl ?? image.sourceUrl ?? "https://creativecommons.org/share-your-work/cclicenses/",
  };
}

function imageRiskReviews(image: RecipeImage): RightsAssessment["risks"] {
  const composition = imageCompositionReviews[image.id] ?? {
    trademark: `Registered composition reviewed for ${image.id}: ${image.alt}. No brand, restaurant identity, or endorsement is relied on; re-review is required if the crop or intended use changes.`,
    publicityPrivacy: `Registered composition reviewed for ${image.id}. The food or drink is the editorial subject; no identifiable person or private information is relied on.`,
  };
  const licenseNote = `The exact source file and ${image.license} basis are recorded for this asset; the local file is limited to the registered crop and WebP conversion.`;
  return {
    copyright: { status: "cleared", notes: licenseNote },
    database: { status: "not-applicable", notes: "This assessment covers one selected image file, not systematic extraction from a photo database." },
    contract: { status: "cleared", notes: "Use remains within the recorded file-level license and attribution obligations." },
    trademark: { status: "cleared", notes: composition.trademark },
    "publicity-privacy": { status: "cleared", notes: composition.publicityPrivacy },
  };
}

const imageCompositionReviews: Record<string, { trademark: string; publicityPrivacy: string }> = {
  "fino-sherry-hero": {
    trademark: "Replacement image shows a glass-fronted sherry barrel and flor only; no bottle, packaging, logo, restaurant identity, or endorsement cue is visible.",
    publicityPrivacy: "Replacement image contains no person or private information.",
  },
  "junmai-sake-hero": {
    trademark: "Replacement image shows unbranded ceramic, glass, and wooden serving ware; no label, packaging, logo, restaurant identity, or endorsement cue is visible.",
    publicityPrivacy: "Replacement image contains no person or private information.",
  },
  "espresso-hero": {
    trademark: "Replacement image shows a plain white espresso cup and saucer; no commercial packet, packaging, logo, restaurant identity, or endorsement cue is visible.",
    publicityPrivacy: "Replacement image contains no person or private information.",
  },
  "lapsang-souchong-hero": {
    trademark: "The jar carries a generic botanical contents label rather than a brand or product mark; it is used only to identify loose tea leaves.",
    publicityPrivacy: "The image contains no person or private information.",
  },
  "mango-sticky-rice-hero": {
    trademark: "The serving scene contains no visible brand, packaging, restaurant mark, or endorsement claim.",
    publicityPrivacy: "Background diners are cropped, blurred, and not identifiable; the plated dessert remains the clear editorial subject.",
  },
};

function allPermissions(status: RightsPermission["status"], scope: string): RightsAssessment["permissions"] {
  return {
    store: { status, scope },
    transform: { status, scope },
    publish: { status, scope },
    commercialize: { status, scope },
  };
}

function riskReviews(notes: string): RightsAssessment["risks"] {
  return {
    copyright: { status: "cleared", notes },
    database: { status: "not-applicable", notes: "No protected database extraction is used for this artifact." },
    contract: { status: "cleared", notes: "Use remains within the recorded license or reference-only boundary." },
    trademark: { status: "cleared", notes },
    "publicity-privacy": { status: "not-applicable", notes: "No identified person or private information is used." },
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

const approvedFutureDatasets: {
  usdaFoodDataCentral: { id: string; rightsAssessment: RightsAssessment };
} = {
  usdaFoodDataCentral: {
    id: "usda-fooddata-central-future-import",
    rightsAssessment: {
      id: "rights-usda-fooddata-central-future-import",
      subject: { type: "dataset" as const, id: "usda-fooddata-central-future-import" },
      jurisdictionBaseline,
      basis: { kind: "public-domain" as const, basis: "USDA FoodData Central data are public domain under CC0; provider requests citation." },
      authorityVersion: "FoodData Central API Guide reviewed 2026-09-06",
      accessedAt: assessedAt,
      applicableTerritories: jurisdictionBaseline,
      permissions: allPermissions("allowed-with-obligations", "Versioned local download with provider/dataset/record citation; no build-time API call"),
      attributionRequirementIds: [],
      risks: riskReviews("Official US government dataset; record-level identifiers and release metadata are required when values are imported."),
      uncertainty: "",
      assessedAt,
      reviewer,
      reviewDueAt,
    },
  },
};

export function isCommercialImageLicense(license: RecipeImageLicense): boolean {
  return !["cc-by-nc", "cc-by-nd", "cc-by-nc-sa", "cc-by-nc-nd", "unknown", "prohibited"].includes(license);
}
