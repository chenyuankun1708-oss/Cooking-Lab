import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createContentRightsRegistry, isCommercialImageLicense, m10AuditedCulinaryItemIds } from "@/data/content-rights";
import { culinaryEvidence } from "@/data/culinary/evidence";
import { culinaryImages } from "@/data/culinary/images";
import { culinaryStories } from "@/data/culinary/stories";
import { ingredients } from "@/data/ingredients";
import {
  contentRightsAuditReport,
  contentRightsRegistry,
  contentRightsSources,
  getPublishedCulinaryItems,
} from "@/data/published-culinary-items";
import { recipeImages } from "@/data/recipe-images";
import { m9RecipeResearchRecords } from "@/data/research/m9-recipe-research";
import type { CulinaryItem, Evidence, Source } from "@/types/culinary";
import type { ContentRightsRegistry, RightsAssessment } from "@/types/content-rights";
import type { RecipeImage } from "@/types/image";
import type { ContentRightsContext } from "../content-rights";
import { buildConsumerRightsDisclosure } from "../content-rights-consumer";
import { evaluateContentRightsRegistry, getContentRightsEvaluationDate } from "../content-rights";
import { generateMetadata as generateRightsMetadata } from "@/app/[locale]/content-rights/page";

const items = getPublishedCulinaryItems();
const images = [...recipeImages, ...culinaryImages];
const context = {
  items,
  images,
  ingredients,
  stories: culinaryStories,
  evidence: culinaryEvidence,
  sources: contentRightsSources,
  researchRecords: m9RecipeResearchRecords,
  now: "2026-09-06",
} as const;

describe("M10 Production content-rights gate", () => {
  it("audits exactly 50 published items and allows every current commercial usage decision", () => {
    const result = evaluateContentRightsRegistry(contentRightsRegistry, context);
    expect(items).toHaveLength(50);
    expect([...m10AuditedCulinaryItemIds].sort()).toEqual(items.map((item) => item.id).sort());
    expect(result.ready, result.issues.map((issue) => `${issue.code}:${issue.subjectId}`).join(", ")).toBe(true);
    expect(result.auditedItemIds).toHaveLength(50);
    expect(contentRightsRegistry.decisions.every((decision) => decision.decision !== "block")).toBe(true);
    expect(contentRightsAuditReport).toContain("Status: PASS");
    expect(contentRightsAuditReport).toContain("Published items audited: 50");
  });

  it("evaluates store, transform, publish, and commercialize separately", () => {
    const artifact = contentRightsRegistry.artifacts[0];
    const assessment = contentRightsRegistry.assessments.find((entry) => entry.id === artifact.rightsAssessmentId)!;
    for (const action of ["store", "transform", "publish", "commercialize"] as const) {
      const registry = cloneRegistry();
      const candidate = registry.assessments.find((entry) => entry.id === assessment.id)!;
      candidate.permissions[action] = { status: "prohibited", scope: "test" };
      expect(issueCodes(registry)).toContain("permission-blocked");
      candidate.permissions[action] = { status: "review-required", scope: "test" };
      expect(issueCodes(registry)).toContain("permission-review-required");
      candidate.permissions[action] = { status: "allowed", scope: "test" };
      expect(issueCodes(registry)).not.toContain("permission-blocked");
      expect(issueCodes(registry)).not.toContain("permission-review-required");
    }
  });

  it("uses the real evaluation date and blocks expired reviews", () => {
    expect(getContentRightsEvaluationDate(new Date("2027-04-01T12:00:00Z"))).toBe("2027-04-01");
    expect(issueCodes(cloneRegistry(), { ...context, now: "2027-04-01" })).toContain("assessment-expired");
    const incomplete = cloneRegistry();
    incomplete.assessments[0].reviewDueAt = undefined;
    incomplete.assessments[0].reviewer = "";
    incomplete.artifacts[0].version = "";
    incomplete.decisions[0].decidedAt = "";
    expect(issueCodes(incomplete)).toContain("review-incomplete");

    const incompleteBasis = cloneRegistry();
    incompleteBasis.assessments[0].basis = { kind: "first-party", owner: "" };
    incompleteBasis.assessments[0].permissions.publish.scope = "";
    expect(issueCodes(incompleteBasis)).toContain("risk-review-incomplete");
  });

  it("allows independently written factual synthesis from reference-only sources but blocks copied expression", () => {
    const registry = cloneRegistry();
    const artifact = registry.artifacts.find((entry) => entry.derivation === "factual-synthesis" && entry.sourceIds.length > 0)!;
    expect(issueCodes(registry)).not.toContain("reference-only-expression-reuse");
    artifact.derivation = "licensed-copy";
    expect(issueCodes(registry)).toContain("reference-only-expression-reuse");
    const decision = registry.decisions.find((entry) => entry.id === artifact.usageDecisionId)!;
    decision.assessmentIds = [artifact.rightsAssessmentId];
    expect(issueCodes(registry)).toContain("reference-only-expression-reuse");
    expect(issueCodes(registry)).toContain("missing-reference");

    const missingSources = cloneRegistry();
    const synthesis = missingSources.artifacts.find((entry) => entry.derivation === "factual-synthesis" && entry.subject.type === "culinary-item")!;
    synthesis.sourceIds = [];
    expect(issueCodes(missingSources)).toContain("review-incomplete");
  });

  it("enforces CC BY attribution and CC BY-SA asset isolation", () => {
    const byRegistry = cloneRegistry();
    const byAttribution = byRegistry.attributions.find((entry) => entry.licenseId === "cc-by")!;
    byRegistry.attributions = byRegistry.attributions.filter((entry) => entry.id !== byAttribution.id);
    expect(issueCodes(byRegistry)).toContain("missing-reference");

    const saRegistry = cloneRegistry();
    const saAttribution = saRegistry.attributions.find((entry) => entry.licenseId === "cc-by-sa")!;
    delete saAttribution.isolationBoundary;
    expect(issueCodes(saRegistry)).toContain("share-alike-not-isolated");

    const falseSaRegistry = cloneRegistry();
    const falseSaAttribution = falseSaRegistry.attributions.find((entry) => entry.licenseId === "cc-by-sa")!;
    falseSaAttribution.shareAlikeRequired = false;
    delete falseSaAttribution.isolationBoundary;
    expect(issueCodes(falseSaRegistry)).toContain("obligation-missing");

    const mislabeledSaRegistry = cloneRegistry();
    const mislabeledSaAttribution = mislabeledSaRegistry.attributions.find((entry) => entry.licenseId === "cc-by-sa")!;
    mislabeledSaAttribution.licenseId = "cc-by";
    mislabeledSaAttribution.licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
    mislabeledSaAttribution.shareAlikeRequired = false;
    delete mislabeledSaAttribution.isolationBoundary;
    expect(issueCodes(mislabeledSaRegistry)).toContain("obligation-missing");

    const assessmentOnlyRegistry = cloneRegistry();
    const imageArtifact = assessmentOnlyRegistry.artifacts.find((entry) => entry.subject.type === "image" && entry.attributionRequirementIds.length > 0)!;
    imageArtifact.attributionRequirementIds = [];
    const item = items.find((entry) => entry.images.availability === "available" && entry.images.references.primaryImageId === imageArtifact.subject.id)!;
    const disclosure = buildConsumerRightsDisclosure(item.id, imageArtifact.subject.id, item.storyIds, assessmentOnlyRegistry, "en");
    expect(disclosure.attributions).toHaveLength(1);
    expect(disclosure.attributions[0].modificationNotice).not.toMatch(/[\u3400-\u9fff]/u);

    const fullyRemoved = cloneRegistry();
    const requiredArtifact = fullyRemoved.artifacts.find((entry) => entry.subject.type === "image" && entry.attributionRequirementIds.length > 0)!;
    const requiredAssessment = fullyRemoved.assessments.find((entry) => entry.id === requiredArtifact.rightsAssessmentId)!;
    const removedIds = new Set([...requiredArtifact.attributionRequirementIds, ...requiredAssessment.attributionRequirementIds]);
    requiredArtifact.attributionRequirementIds = [];
    requiredAssessment.attributionRequirementIds = [];
    fullyRemoved.attributions = fullyRemoved.attributions.filter((entry) => !removedIds.has(entry.id));
    expect(issueCodes(fullyRemoved)).toContain("obligation-missing");

    const wrongDecision = cloneRegistry();
    const licensedImage = wrongDecision.artifacts.find((entry) => entry.subject.type === "image" && entry.attributionRequirementIds.length > 0)!;
    const licensedDecision = wrongDecision.decisions.find((entry) => entry.id === licensedImage.usageDecisionId)!;
    licensedDecision.decision = "allow";
    licensedDecision.assessmentIds = licensedDecision.assessmentIds.filter((id) => id !== licensedImage.rightsAssessmentId) as [string, ...string[]];
    expect(issueCodes(wrongDecision)).toEqual(expect.arrayContaining(["missing-reference", "obligation-missing"]));

    const unsafeLicenseLink = cloneRegistry();
    unsafeLicenseLink.attributions[0].licenseUrl = "http://example.com/license";
    expect(issueCodes(unsafeLicenseLink)).toContain("attribution-invalid");

    const genericOpenLicense = cloneRegistry();
    const genericArtifact = genericOpenLicense.artifacts.find((entry) => entry.subject.type === "culinary-item" && entry.sourceIds.length === 0)!;
    const genericAssessment = genericOpenLicense.assessments.find((entry) => entry.id === genericArtifact.rightsAssessmentId)!;
    const genericDecision = genericOpenLicense.decisions.find((entry) => entry.id === genericArtifact.usageDecisionId)!;
    genericArtifact.derivation = "licensed-copy";
    genericAssessment.basis = { kind: "open-license", licenseId: "cc-by", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" };
    for (const action of ["store", "transform", "publish", "commercialize"] as const) genericAssessment.permissions[action] = { status: "allowed", scope: "test" };
    genericDecision.decision = "allow";
    genericDecision.conditions = [];
    expect(issueCodes(genericOpenLicense)).toContain("obligation-missing");
  });

  it("blocks NC and ND licenses from commercial publication", () => {
    expect(isCommercialImageLicense("cc-by-nc")).toBe(false);
    expect(isCommercialImageLicense("cc-by-nd")).toBe(false);
    for (const license of ["cc-by-nc", "cc-by-nd"] as const) {
      const target = images[0];
      const changedImages: RecipeImage[] = images.map((image) => image.id === target.id ? { ...image, license } : image);
      const registry = createContentRightsRegistry({ ...context, auditedItemIds: m10AuditedCulinaryItemIds, images: changedImages });
      const result = evaluateContentRightsRegistry(registry, { ...context, images: changedImages });
      expect(result.issues.some((issue) => issue.code === "permission-blocked" && issue.subjectId === `${target.id}-image`)).toBe(true);
    }
  });

  it("blocks systematic database extraction and substantial reuse without a compatible grant", () => {
    const registry = cloneRegistry();
    registry.datasets[0].reuse.extraction = "systematic-scrape";
    expect(issueCodes(registry)).toContain("database-extraction-prohibited");
    registry.datasets[0].reuse.extraction = "versioned-download";
    const assessment = registry.assessments.find((entry) => entry.id === registry.datasets[0].rightsAssessmentId)!;
    assessment.basis = { kind: "terms", provider: "Example", termsUrl: "https://example.com/terms" };
    expect(issueCodes(registry)).toContain("database-extraction-prohibited");
    assessment.basis = { kind: "public-domain", basis: "test" };
    assessment.permissions.commercialize = { status: "prohibited", scope: "test" };
    expect(issueCodes(registry)).toContain("permission-blocked");

    const incompleteMetadata = cloneRegistry();
    Object.assign(incompleteMetadata.datasets[0], { provider: "", title: "", version: "", sourceUrl: "http://example.com/data" });
    expect(issueCodes(incompleteMetadata)).toContain("dataset-provenance-incomplete");
  });

  it("requires exact artifact, nutrition, and cost assessment relationships", () => {
    const wrongAssessment = cloneRegistry();
    const artifact = wrongAssessment.artifacts[0];
    const assessment = wrongAssessment.assessments.find((entry) => entry.id === artifact.rightsAssessmentId)!;
    assessment.subject = { type: "artifact", id: "another-artifact" };
    expect(issueCodes(wrongAssessment)).toContain("missing-reference");

    const wrongNutrition = cloneRegistry();
    const usedId = items.flatMap((item) => "inputs" in item.preparation ? item.preparation.inputs.map((input) => input.ingredientId) : [])[0];
    const nutrition = wrongNutrition.nutrition.find((entry) => entry.ingredientId === usedId)!;
    nutrition.ingredientId = "another-ingredient";
    expect(issueCodes(wrongNutrition)).toContain("nutrition-provenance-missing");

    const missingCostAssessment = cloneRegistry();
    const costAssessmentId = missingCostAssessment.costs[0].rightsAssessmentId;
    missingCostAssessment.assessments = missingCostAssessment.assessments.filter((entry) => entry.id !== costAssessmentId);
    expect(issueCodes(missingCostAssessment)).toContain("cost-provenance-missing");

    const incompleteCost = cloneRegistry();
    Object.assign(incompleteCost.costs[0], { geography: "", currency: "", effectiveDate: "invalid", methodology: "" });
    expect(issueCodes(incompleteCost)).toContain("cost-provenance-missing");

    const missingDataset = cloneRegistry();
    const ingredient = ingredients.find((entry) => items.some((item) => "inputs" in item.preparation && item.preparation.inputs.some((input) => input.ingredientId === entry.id)))!;
    const changedIngredients = ingredients.map((entry) => entry.id === ingredient.id ? { ...entry, nutritionProvenanceId: `fake-dataset:${ingredient.id}` } : entry);
    missingDataset.nutrition = missingDataset.nutrition.map((entry) => entry.ingredientId === ingredient.id ? {
      ingredientId: ingredient.id,
      kind: "dataset",
      datasetId: "fake-dataset",
      upstreamRecordId: "123",
      basis: "per-100g",
      conversionMethod: "none",
      accessedAt: "2026-09-06",
      reviewer: "reviewer",
    } : entry);
    expect(issueCodes(missingDataset, { ...context, ingredients: changedIngredients })).toContain("nutrition-provenance-missing");

    const placeholderDataset = cloneRegistry();
    const futureDataset = placeholderDataset.datasets[0];
    const datasetIngredients = ingredients.map((entry) => entry.id === ingredient.id ? { ...entry, nutritionProvenanceId: `${futureDataset.id}:${ingredient.id}` } : entry);
    placeholderDataset.nutrition = placeholderDataset.nutrition.map((entry) => entry.ingredientId === ingredient.id ? {
      ingredientId: ingredient.id,
      kind: "dataset",
      datasetId: futureDataset.id,
      upstreamRecordId: "123",
      basis: "per-100g",
      conversionMethod: "Normalized from provider per-100g values.",
      accessedAt: "2026-09-06",
      reviewer: "test reviewer",
    } : entry);
    expect(issueCodes(placeholderDataset, { ...context, ingredients: datasetIngredients })).toContain("dataset-provenance-incomplete");
    futureDataset.version = "FoodData Central 2026-08";
    futureDataset.releaseDate = "2026-08-01";
    expect(issueCodes(placeholderDataset, { ...context, ingredients: datasetIngredients })).not.toContain("dataset-provenance-incomplete");
  });

  it("validates all three restaurant identities and blocks a false official identity", () => {
    const baseItem = items[0];
    const reconstructionItem = items.find((item) => item.id === "japanese-oyakodon")!;
    const reconstructionArtifact = contentRightsRegistry.artifacts.find((artifact) => artifact.subject.type === "culinary-item" && artifact.subject.id === reconstructionItem.id && artifact.kind === "identity")!;
    const sourceIds = reconstructionArtifact.sourceIds as [string, string];

    const official = cloneRegistry();
    official.restaurants = [{ culinaryItemId: baseItem.id, kind: "official-authorized-recipe", restaurantName: "Example", permissionReferenceId: "permission-example", commercialUse: true, translationAllowed: true, adaptationAllowed: true, endorsementLanguageApproved: false }];
    const permission = permissionAssessment("permission-example");
    official.assessments = [...official.assessments, permission];
    for (const artifact of official.artifacts.filter((entry) => entry.subject.type === "culinary-item" && entry.subject.id === baseItem.id && ["identity", "preparation"].includes(entry.kind))) {
      const decision = official.decisions.find((entry) => entry.id === artifact.usageDecisionId)!;
      decision.assessmentIds = [...decision.assessmentIds, permission.id] as [string, ...string[]];
    }
    expect(issueCodes(official)).not.toContain("restaurant-identity-invalid");

    const reconstruction = cloneRegistry();
    reconstruction.restaurants = [{ culinaryItemId: reconstructionItem.id, kind: "cooking-lab-reconstruction", restaurantName: "Example", sourceIds, independentlyWritten: true, culinaryReview: "passed", nonEndorsementDisclosure: true }];
    expect(issueCodes(reconstruction)).not.toContain("restaurant-identity-invalid");

    const profile = cloneRegistry();
    profile.restaurants = [{ culinaryItemId: reconstructionItem.id, kind: "dish-profile-only", restaurantName: "Example", sourceIds, includesPreparation: false, nonEndorsementDisclosure: true }];
    const profileItems = items.map((item) => item.id === reconstructionItem.id ? ({ ...item, preparation: { kind: "no-consumer-preparation", reason: "reference-only", content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { servingNote: "Profile only" } }] } } } as CulinaryItem) : item);
    expect(issueCodes(profile, { ...context, items: profileItems })).not.toContain("restaurant-identity-invalid");

    const unalignedProfile = cloneRegistry();
    unalignedProfile.restaurants = [{ culinaryItemId: baseItem.id, kind: "dish-profile-only", restaurantName: "Example", sourceIds: [sourceIds[0]], includesPreparation: false, nonEndorsementDisclosure: true }];
    const unalignedItems = items.map((item) => item.id === baseItem.id ? ({ ...item, preparation: { kind: "no-consumer-preparation", reason: "reference-only", content: { defaultLocale: "zh-CN", entries: [{ locale: "zh-CN", status: "reviewed", value: { servingNote: "Profile only" } }] } } } as CulinaryItem) : item);
    expect(issueCodes(unalignedProfile, { ...context, items: unalignedItems })).toContain("restaurant-identity-invalid");

    const falseOfficial = cloneRegistry();
    falseOfficial.restaurants = official.restaurants;
    expect(issueCodes(falseOfficial)).toContain("restaurant-identity-invalid");
  });

  it("requires product profiles to align registered sources, artifacts, assessments, and decisions", () => {
    const valid = registryWithValidProductProfile();
    expect(issueCodes(valid)).not.toContain("product-profile-invalid");
    const productItem = items.find((item) => item.id === valid.productProfiles[0].culinaryItemId)!;
    const disclosure = buildConsumerRightsDisclosure(productItem.id, undefined, productItem.storyIds, valid, "en");
    expect(disclosure.sourceIds).toEqual(expect.arrayContaining(valid.productProfiles[0].sourceIds));

    const unregisteredSource = registryWithValidProductProfile();
    unregisteredSource.productProfiles[0].sourceIds = ["bogus-product-source"];
    unregisteredSource.assessments = [...unregisteredSource.assessments, {
      ...structuredClone(unregisteredSource.assessments[0]),
      id: "source-rights-bogus-product-source",
      subject: { type: "source", id: "bogus-product-source" },
    }];
    expect(issueCodes(unregisteredSource)).toContain("product-profile-invalid");

    const emptyArtifactSources = registryWithValidProductProfile();
    const artifact = emptyArtifactSources.artifacts.find((entry) => entry.subject.type === "product-profile")!;
    artifact.sourceIds = [];
    expect(issueCodes(emptyArtifactSources)).toContain("product-profile-invalid");

    const unlinkedDecision = registryWithValidProductProfile();
    const profileArtifact = unlinkedDecision.artifacts.find((entry) => entry.subject.type === "product-profile")!;
    const decision = unlinkedDecision.decisions.find((entry) => entry.id === profileArtifact.usageDecisionId)!;
    decision.assessmentIds = [profileArtifact.rightsAssessmentId];
    expect(issueCodes(unlinkedDecision)).toContain("product-profile-invalid");

    const borrowedAssessment = registryWithValidProductProfile();
    borrowedAssessment.productProfiles[0].rightsAssessmentId = borrowedAssessment.assessments[0].id;
    expect(issueCodes(borrowedAssessment)).toContain("product-profile-invalid");
  });

  it("accepts timestamped reference-only video metadata and blocks downloads, transcripts, screenshots, and automation", () => {
    const source = contentRightsSources[0];
    const sourceAssessmentId = `source-rights-${source.id}`;
    const registry = cloneRegistry();
    registry.externalMedia = [{
      id: "video-reference",
      sourceId: source.id,
      platform: "youtube",
      url: "https://www.youtube.com/watch?v=example",
      use: "reference-only",
      timestamp: "00:02:10",
      downloaded: false,
      transcriptStored: false,
      screenshotStored: false,
      automatedCollection: false,
      privacyReview: "not-required",
      rightsAssessmentId: sourceAssessmentId,
    }];
    expect(issueCodes(registry)).not.toContain("external-media-copy-prohibited");
    Object.assign(registry.externalMedia[0], { downloaded: true, transcriptStored: true });
    expect(issueCodes(registry)).toContain("external-media-copy-prohibited");

    const embed = cloneRegistry();
    embed.externalMedia = [{ ...registry.externalMedia[0], id: "video-embed", use: "official-embed", downloaded: false, transcriptStored: false, privacyReview: "passed" }];
    expect(issueCodes(embed)).toContain("permission-blocked");

    const mediaOnlyRegistry = cloneRegistry();
    const mediaOnlySource: Source = {
      ...structuredClone(source),
      id: "media-only-source",
      rights: { status: "unknown", notes: "test unknown rights" },
    };
    const mediaOnlyAssessment: RightsAssessment = {
      ...structuredClone(mediaOnlyRegistry.assessments.find((entry) => entry.id === sourceAssessmentId)!),
      id: "source-rights-media-only-source",
      subject: { type: "source", id: mediaOnlySource.id },
    };
    mediaOnlyRegistry.assessments = [...mediaOnlyRegistry.assessments, mediaOnlyAssessment];
    mediaOnlyRegistry.externalMedia = [{
      ...registry.externalMedia[0],
      id: "media-only-reference",
      sourceId: mediaOnlySource.id,
      rightsAssessmentId: mediaOnlyAssessment.id,
    }];
    const mediaOnlyContext = { ...context, sources: [...contentRightsSources, mediaOnlySource] };
    expect(issueCodes(mediaOnlyRegistry, mediaOnlyContext)).toContain("source-rights-unknown");

    mediaOnlySource.rights = { status: "reference-only", notes: "facts and citation only" };
    mediaOnlySource.health = { ...mediaOnlySource.health, status: "rights-changed" };
    expect(issueCodes(mediaOnlyRegistry, mediaOnlyContext)).toContain("source-rights-changed");
  });

  it("cannot bypass Story rights by removing the reverse item.storyIds link", () => {
    const storyId = culinaryStories[0].id;
    const unlinkedItems = items.map((item) => ({ ...item, storyIds: item.storyIds.filter((id) => id !== storyId) })) as CulinaryItem[];
    const regenerated = createContentRightsRegistry({ ...context, items: unlinkedItems, auditedItemIds: m10AuditedCulinaryItemIds });
    expect(regenerated.artifacts.some((artifact) => artifact.subject.type === "story" && artifact.subject.id === storyId)).toBe(true);
    regenerated.artifacts = regenerated.artifacts.filter((artifact) => artifact.subject.type !== "story" || artifact.subject.id !== storyId);
    expect(issueCodes(regenerated, { ...context, items: unlinkedItems })).toContain("missing-artifact");
  });

  it("requires every artifact Evidence to close through its Source rights assessment and UsageDecision", () => {
    const registry = cloneRegistry();
    const artifact = registry.artifacts.find((entry) => entry.subject.type === "culinary-item" && entry.kind === "identity")!;
    const rogueSource: Source = {
      ...structuredClone(contentRightsSources[0]),
      id: "evidence-source-with-unknown-rights",
      locators: [{ kind: "url", url: "https://evidence-only.example.test/reference", accessedAt: "2026-09-06" }],
      rights: { status: "unknown", notes: "Mutation fixture must remain blocked." },
    };
    const rogueEvidence: Evidence = {
      id: "evidence-with-unclosed-source",
      sourceId: rogueSource.id,
      relation: "supports",
      strength: "strong",
      locators: [{ kind: "section", value: "Test" }],
      editorialNote: "Mutation fixture for the Evidence-to-Source rights chain.",
    };
    artifact.evidenceIds = [rogueEvidence.id];
    const changedContext = {
      ...context,
      evidence: [...context.evidence, rogueEvidence],
      sources: [...context.sources, rogueSource],
    };

    const codes = issueCodes(registry, changedContext);
    expect(codes).toContain("missing-reference");
    expect(codes).toContain("source-rights-unknown");
  });

  it("blocks generated artifacts without dated terms, cleared inputs, review attestations, and similarity review", () => {
    const registry = cloneRegistry();
    const artifact = registry.artifacts[0];
    artifact.derivation = "generated";
    expect(issueCodes(registry)).toContain("ai-review-incomplete");
    registry.ai = [{
      id: "ai-test",
      artifactId: artifact.id,
      provider: "",
      model: "",
      modelVersion: "",
      generatedAt: "2026-09-06",
      termsUrl: "",
      termsEffectiveDate: "",
      promptTemplateVersion: "",
      inputArtifactIds: [],
      inputRightsReviewed: false,
      reviewAttestationIds: [] as unknown as [string, ...string[]],
      similarityReview: "required",
      trademarkReview: "required",
    }];
    Object.assign(registry.ai[0], { humanReview: "passed" });
    const codes = issueCodes(registry);
    expect(codes).toContain("ai-review-incomplete");
    expect(codes).toContain("ai-input-rights-unknown");
  });

  it("covers every used ingredient with explicit nutrition and cost provenance", () => {
    const usedIngredientIds = new Set(items.flatMap((item) => "inputs" in item.preparation ? item.preparation.inputs.map((input) => input.ingredientId) : []));
    const nutritionIds = new Set(contentRightsRegistry.nutrition.map((entry) => entry.ingredientId));
    const costIds = new Set(contentRightsRegistry.costs.map((entry) => entry.id));
    expect(usedIngredientIds.size).toBe(89);
    for (const ingredientId of usedIngredientIds) {
      const ingredient = ingredients.find((entry) => entry.id === ingredientId)!;
      expect(nutritionIds.has(ingredientId), ingredientId).toBe(true);
      expect(costIds.has(ingredient.costProvenanceId), ingredientId).toBe(true);
    }
    expect(contentRightsRegistry.nutrition.every((entry) => entry.kind === "editorial-estimate" && entry.limitations.includes("Demonstration"))).toBe(true);
    expect(contentRightsRegistry.datasets[0].version).toBe("not-yet-imported");
  });

  it("publishes bilingual disclosure, safe links, stable #sources, and unchanged canonical routes", async () => {
    const item = items.find((entry) => entry.id === "japanese-oyakodon")!;
    const disclosureZh = buildConsumerRightsDisclosure(item.id, item.images.availability === "available" ? item.images.references.primaryImageId : undefined, item.storyIds, contentRightsRegistry, "zh-CN");
    const disclosureEn = buildConsumerRightsDisclosure(item.id, item.images.availability === "available" ? item.images.references.primaryImageId : undefined, item.storyIds, contentRightsRegistry, "en");
    expect(disclosureZh.identityLabel).toContain("事实综合");
    expect(disclosureEn.identityLabel).toContain("factual synthesis");
    expect(contentRightsSources.every((source) => source.locators.every((locator) => locator.kind !== "url" || locator.url.startsWith("https://")))).toBe(true);

    const detailSource = readFileSync(resolve(process.cwd(), "components/native-culinary-detail-page.tsx"), "utf8");
    const legacySource = readFileSync(resolve(process.cwd(), "app/(legacy)/content-rights/page.tsx"), "utf8");
    expect(detailSource).toContain('id="sources"');
    expect(legacySource).toContain('permanentRedirect("/zh-CN/content-rights")');
    const metadata = await generateRightsMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(metadata.alternates?.canonical).toBe("https://cooking-lab-pied.vercel.app/en/content-rights");
  });
});

function cloneRegistry(): ContentRightsRegistry {
  return structuredClone(contentRightsRegistry);
}

function issueCodes(registry: ContentRightsRegistry, customContext: ContentRightsContext = context) {
  return evaluateContentRightsRegistry(registry, customContext).issues.map((issue) => issue.code);
}

function permissionAssessment(permissionReferenceId: string): RightsAssessment {
  const base = structuredClone(contentRightsRegistry.assessments[0]);
  return {
    ...base,
    id: `rights-${permissionReferenceId}`,
    subject: { type: "artifact", id: `permission-artifact-${permissionReferenceId}` },
    basis: { kind: "permission", permissionReferenceId },
  };
}

function registryWithValidProductProfile(): ContentRightsRegistry {
  const registry = cloneRegistry();
  const item = items[0];
  const sourceItem = items.find((entry) => entry.id === "japanese-oyakodon")!;
  const identityArtifact = registry.artifacts.find((entry) => entry.subject.type === "culinary-item" && entry.subject.id === sourceItem.id && entry.kind === "identity")!;
  const sourceIds = [...identityArtifact.sourceIds] as [string, ...string[]];
  const artifactId = "test-product-profile-artifact";
  const assessmentId = `rights-${artifactId}`;
  const decisionId = `usage-${artifactId}`;
  registry.artifacts = [...registry.artifacts, {
    id: artifactId,
    version: "clv1-test-product-profile",
    subject: { type: "product-profile", id: "test-product-profile" },
    kind: "product-profile",
    derivation: "factual-synthesis",
    sourceIds,
    evidenceIds: [],
    rightsAssessmentId: assessmentId,
    usageDecisionId: decisionId,
    attributionRequirementIds: [],
  }];
  registry.assessments = [...registry.assessments, {
    ...structuredClone(registry.assessments[0]),
    id: assessmentId,
    subject: { type: "artifact", id: artifactId },
  }];
  registry.decisions = [...registry.decisions, {
    id: decisionId,
    artifactId,
    assessmentIds: [assessmentId, ...sourceIds.map((sourceId) => registry.assessments.find((entry) => entry.subject.type === "source" && entry.subject.id === sourceId)!.id)],
    intendedUse: "production-commercial-ready",
    decision: "allow",
    conditions: ["Independent product facts only."],
    decidedAt: "2026-09-06",
    reviewer: "test reviewer",
  }];
  registry.productProfiles = [{
    id: "test-product-profile",
    culinaryItemId: item.id,
    brandName: "Example brand",
    producerName: "Example producer",
    region: "Example region",
    vintageBatchOrModel: "2026 test batch",
    verifiedAt: "2026-09-06",
    sourceIds,
    independentEditorialCopy: true,
    usesUnlicensedBrandArtwork: false,
    impliesEndorsement: false,
    affiliateSales: false,
    rightsAssessmentId: assessmentId,
  }];
  return registry;
}
