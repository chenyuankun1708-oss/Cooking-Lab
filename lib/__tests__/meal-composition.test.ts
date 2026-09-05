import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { nativeCulinaryItems } from "@/data/culinary/items";
import { ingredients } from "@/data/ingredients";
import { getPublishedCulinaryItemBySlug, getPublishedCulinaryItems, getPublishedCulinaryItemsForLocale } from "@/data/published-culinary-items";
import { getStoryExperienceContext } from "@/data/published-stories";
import { getPublishedRecipes } from "@/data/published-recipes";
import { getPublishedPairingExperience } from "@/data/published-meal-compositions";
import type { CulinaryItem } from "@/types/culinary";
import type { IngredientRepository } from "../ingredient-repository";
import { getRoleCompatibility, rankPairingCandidates, scorePairing } from "../culinary-pairing";
import { buildMealCompositionPageModel, describePairingCaution, describePairingReason } from "../meal-composition-display";
import {
  auditPairingReadiness,
  calculateMealCost,
  calculateMealNutrition,
  calculatePreparationBurden,
  composeMealsAround,
  evaluateMealConstraints,
  findNonAlcoholicDrinkAlternative,
  mealTemplates,
  scoreMealComposition,
} from "../meal-composition";
import {
  appendMealConstraintRelaxations,
  parseMealConstraintRelaxations,
} from "../meal-constraint-navigation";

const library = getPublishedCulinaryItems();
const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
const ingredientRepository: IngredientRepository = {
  getById: (id) => ingredientById.get(id),
  list: () => ingredients,
};
const context = { ingredientRepository };

function item(slug: string): CulinaryItem {
  const value = getPublishedCulinaryItemBySlug(slug);
  if (!value) throw new Error(`Missing test item: ${slug}`);
  return value;
}

describe("culinary pairing score", () => {
  it("is deterministic and uses stable candidate ordering", () => {
    const anchor = item("dongpo-pork");
    expect(scorePairing(anchor, item("hibiscus-agua-fresca"))).toEqual(scorePairing(anchor, item("hibiscus-agua-fresca")));

    const forward = rankPairingCandidates(anchor, library, { excludeAlcohol: false, minimumScore: 0 });
    const reverse = rankPairingCandidates(anchor, [...library].reverse(), { excludeAlcohol: false, minimumScore: 0 });
    expect(forward.map(({ candidate }) => candidate.id)).toEqual(reverse.map(({ candidate }) => candidate.id));
  });

  it("keeps role compatibility separate from similarity and rejects same-role mains", () => {
    expect(getRoleCompatibility("main", "drink")).toBe(1);
    expect(getRoleCompatibility("starter", "main")).toBe(1);
    expect(getRoleCompatibility("main", "main")).toBe(0);
    expect(scorePairing(item("dongpo-pork"), item("thai-basil-chicken")).eligible).toBe(false);
  });

  it("finds model-backed complement, continuity, texture, weight, cuisine, and context signals", () => {
    const richAcid = scorePairing(item("dongpo-pork"), item("hibiscus-agua-fresca"));
    expect(richAcid.reasons).toContainEqual({ kind: "flavor-complement", complementId: "acid-richness" });
    expect(richAcid.breakdown.weightBalance).toBe(1);

    const coolingSpicy = scorePairing(item("thai-basil-chicken"), item("salted-lassi"));
    expect(coolingSpicy.reasons).toContainEqual({ kind: "flavor-complement", complementId: "cooling-spicy" });

    const texture = scorePairing(item("dongpo-pork"), item("greek-village-salad"));
    expect(texture.reasons.some((reason) => reason.kind === "texture-contrast")).toBe(true);

    const continuity = scorePairing(item("tiramisu"), item("espresso"));
    expect(continuity.reasons.some((reason) => reason.kind === "flavor-continuity")).toBe(true);
    expect(continuity.reasons).toContainEqual({ kind: "cuisine-coherence", ids: ["italian"] });
    expect(continuity.reasons).toContainEqual({ kind: "serving-context", ids: ["after-meal"] });
  });

  it("allows cross-cuisine pairings without inventing a coherence penalty", () => {
    const result = scorePairing(item("dongpo-pork"), item("hibiscus-agua-fresca"));
    expect(result.eligible).toBe(true);
    expect(result.breakdown.cuisineCoherence).toBe(0.5);
    expect(result.reasons.some((reason) => reason.kind === "cuisine-coherence")).toBe(false);
  });

  it("excludes self, duplicate identities, drafts, and alcohol by default", () => {
    const anchor = item("dongpo-pork");
    const duplicate = { ...item("longjing-green-tea"), id: "duplicate-longjing" } as CulinaryItem;
    const draft = { ...item("salted-lassi"), id: "draft-lassi", slug: "draft-lassi", publication: { status: "draft" as const } } as CulinaryItem;
    const ranked = rankPairingCandidates(anchor, [anchor, item("longjing-green-tea"), duplicate, draft, item("fino-sherry")], { minimumScore: 0 });
    expect(ranked.map(({ candidate }) => candidate.slug)).toEqual(["longjing-green-tea"]);
    expect(rankPairingCandidates(anchor, [item("fino-sherry")], { excludeAlcohol: false, minimumScore: 0 })[0]?.candidate.id).toBe("fino-sherry");
    expect(scorePairing(anchor, draft).eligible).toBe(false);
    expect(scorePairing(anchor, item("longjing-green-tea"), { anchorRoleId: "drink" }).eligible).toBe(false);
  });

  it("returns structured reasons and cautions without localized prose", () => {
    const result = scorePairing(item("tiramisu"), item("vietnamese-iced-coffee"));
    expect(result.reasons.every((reason) => typeof reason === "object" && "kind" in reason)).toBe(true);
    expect(result.cautions).toContainEqual({ kind: "shared-richness" });
    expect(result.cautions).toContainEqual({ kind: "repeated-texture", ids: ["creamy"] });
    expect(JSON.stringify({ reasons: result.reasons, cautions: result.cautions, breakdown: result.breakdown })).not.toMatch(/[\u3400-\u9fff]/);
  });
});

describe("meal composition", () => {
  it("enables only templates supported by the current portfolio", () => {
    const audit = auditPairingReadiness(library);
    expect(audit.itemCount).toBe(26);
    expect(audit.roleCounts).toMatchObject({ starter: 3, main: 5, side: 1, staple: 3, soup: 2, dessert: 3, drink: 10 });
    expect(audit.drinkShare).toBeCloseTo(10 / 26, 5);
    expect(audit.availableTemplateIds).toEqual(mealTemplates.map(({ id }) => id));
    expect(audit.items.every(({ weight, temperature }) => Boolean(weight && temperature))).toBe(true);
  });

  it("keeps the anchor fixed and returns deterministic, duplicate-free complete meals", () => {
    const anchor = item("dongpo-pork");
    const first = composeMealsAround(anchor, library, context);
    const second = composeMealsAround(anchor, library, context);
    expect(first).toEqual(second);
    expect(first.primary?.items.some(({ item: candidate }) => candidate.id === anchor.id)).toBe(true);
    expect(first.primary?.completeness).toBe("complete");
    expect(new Set(first.primary?.items.map(({ item: candidate }) => candidate.id)).size).toBe(first.primary?.items.length);
    expect(first.primary?.items.filter(({ slotId }) => slotId === "main")).toHaveLength(1);
    expect(first.primary?.breakdown.roleCompleteness).toBeGreaterThan(0);
    expect(first.primary?.missingSlotIds).toEqual([]);
  });

  it("uses a partial pair rather than filler when no supported full template can be completed", () => {
    const anchor = item("greek-village-salad");
    const result = composeMealsAround(anchor, [anchor, item("longjing-green-tea")], context, { minimumPairingScore: 0 });
    expect(result.primary?.templateId).toBe("partial-pair");
    expect(result.primary?.completeness).toBe("partial");
    expect(result.primary?.items).toHaveLength(2);
  });

  it("penalizes whole-meal richness and texture repetition", () => {
    const template = mealTemplates.find(({ id }) => id === "drink-dessert")!;
    const repeated = scoreMealComposition(template, [
      { item: item("vietnamese-iced-coffee"), slotId: "drink", roleId: "drink" },
      { item: item("tiramisu"), slotId: "dessert", roleId: "dessert" },
    ], "tiramisu", context);
    const varied = scoreMealComposition(template, [
      { item: item("longjing-green-tea"), slotId: "drink", roleId: "drink" },
      { item: item("apple-crumble"), slotId: "dessert", roleId: "dessert" },
    ], "apple-crumble", context);
    expect(repeated.breakdown.repetitionPenalty).toBeGreaterThan(varied.breakdown.repetitionPenalty);
    expect(repeated.cautions).toContainEqual({ kind: "shared-richness" });
  });

  it("summarizes active, elapsed, parallelizable time and tool overlap", () => {
    const burden = calculatePreparationBurden([item("tiramisu"), item("espresso")]);
    expect(burden.activeMinutes).toBe(40);
    expect(burden.estimatedElapsedMinutes).toBe(405);
    expect(burden.parallelizableMinutes).toBeGreaterThan(0);
    expect(burden.proceduralItemCount).toBe(2);
    expect(burden.level).toBe("moderate");
  });

  it("keeps unknown and out-of-scope nutrition/cost distinct from zero", () => {
    const nutrition = calculateMealNutrition([item("dongpo-pork"), item("longjing-green-tea")], ingredientRepository);
    const cost = calculateMealCost([item("dongpo-pork"), item("fino-sherry")], ingredientRepository);
    expect(nutrition.coverage).toBe("partial");
    expect(nutrition.includedItemCount).toBe(1);
    expect(nutrition.notApplicableItemCount).toBe(1);
    expect(nutrition.value?.calories).toBeGreaterThan(0);
    expect(cost.coverage).toBe("partial");
    expect(cost.includedItemCount).toBe(1);
    expect(cost.value).toBeGreaterThan(0);
    expect(calculateMealCost([item("fino-sherry")], ingredientRepository).value).toBeUndefined();
    expect(calculateMealNutrition([item("longjing-green-tea")], ingredientRepository).value).toBeUndefined();
  });

  it("respects alcohol, total-time, and available-tool constraints", () => {
    const anchor = item("dongpo-pork");
    const defaultMeal = composeMealsAround(anchor, library, context);
    expect(defaultMeal.primary?.items.some(({ item: candidate }) => candidate.itemType === "alcoholic-drink")).toBe(false);
    const included = composeMealsAround(anchor, library, context, { excludeAlcohol: false });
    expect([included.primary, ...included.alternatives].flatMap((meal) => meal?.items ?? []).some(({ item: candidate }) => candidate.itemType === "alcoholic-drink")).toBe(true);
    const quick = composeMealsAround(anchor, library, context, { maxTotalTimeMinutes: 30 });
    expect(quick.primary).toBeUndefined();
    const unavailableTools = composeMealsAround(anchor, library, context, { availableToolIds: ["tea-pot"] });
    expect(unavailableTools.primary).toBeUndefined();
  });

  it("returns structured satisfied and exceeded outcomes with exact missing native-item tools", () => {
    const template = mealTemplates.find(({ id }) => id === "drink-dessert")!;
    const meal = scoreMealComposition(template, [
      { item: item("espresso"), slotId: "drink", roleId: "drink" },
      { item: item("tiramisu"), slotId: "dessert", roleId: "dessert" },
    ], "tiramisu", context, {
      maxTotalTimeMinutes: 405,
      availableToolIds: ["saucepan"],
    });

    expect(meal.constraintOutcomes).toContainEqual({
      constraintId: "estimated-elapsed-time",
      status: "satisfied",
      limitMinutes: 405,
      estimatedElapsedMinutes: 405,
    });
    expect(meal.constraintOutcomes).toContainEqual({
      constraintId: "available-tools",
      status: "exceeded",
      availableToolIds: ["saucepan"],
      requiredToolIds: [
        "espresso-machine",
        "heatproof-bowl",
        "portafilter",
        "refrigerator",
        "saucepan",
        "scale",
        "square-dish",
        "timer",
        "whisk",
      ],
      missingToolIds: [
        "espresso-machine",
        "heatproof-bowl",
        "portafilter",
        "refrigerator",
        "scale",
        "square-dish",
        "timer",
        "whisk",
      ],
    });
    expect(evaluateMealConstraints(meal, { maxTotalTimeMinutes: 30 })[0]).toMatchObject({
      constraintId: "estimated-elapsed-time",
      status: "exceeded",
      estimatedElapsedMinutes: 405,
    });
  });

  it("prefers a constraint-eligible partial over the highest-ranked ineligible pair", () => {
    const anchor = item("greek-village-salad");
    const drink = item("longjing-green-tea");
    if (!("toolIds" in drink.preparation)) throw new Error("Expected procedural test drink");
    const unavailable = {
      ...drink,
      id: "a-unavailable-drink",
      slug: "a-unavailable-drink",
      preparation: { ...drink.preparation, toolIds: ["espresso-machine"] },
    } as CulinaryItem;
    const eligible = {
      ...drink,
      id: "z-eligible-drink",
      slug: "z-eligible-drink",
    } as CulinaryItem;

    const result = composeMealsAround(anchor, [anchor, unavailable, eligible], context, {
      minimumPairingScore: 0,
      availableToolIds: ["gaiwan", "kettle", "knife", "mixing-bowl", "scale"],
    });

    expect(result.primary?.completeness).toBe("partial");
    expect(result.primary?.items.some(({ item: candidate }) => candidate.id === "z-eligible-drink")).toBe(true);
    expect(result.primary?.constraintOutcomes.every(({ status }) => status === "satisfied")).toBe(true);
  });

  it("allows a compliant partial to replace a constraint-violating complete meal", () => {
    const anchor = item("greek-village-salad");
    const main = item("dongpo-pork");
    const drink = item("longjing-green-tea");
    const candidateLibrary = [anchor, main, drink];
    const unconstrained = composeMealsAround(anchor, candidateLibrary, context, {
      minimumPairingScore: 0,
      minimumMealScore: 0,
    });
    expect(unconstrained.primary?.completeness).toBe("complete");

    const constrained = composeMealsAround(anchor, candidateLibrary, context, {
      minimumPairingScore: 0,
      minimumMealScore: 0,
      availableToolIds: ["gaiwan", "kettle", "knife", "mixing-bowl", "scale"],
    });
    expect(constrained.primary?.completeness).toBe("partial");
    expect(constrained.primary?.items.some(({ item: candidate }) => candidate.id === main.id)).toBe(false);
    expect(constrained.primary?.constraintOutcomes).toEqual([expect.objectContaining({
      constraintId: "available-tools",
      status: "satisfied",
    })]);
  });

  it("accepts a complete primary only at or within both declared hard constraints", () => {
    const anchor = item("dongpo-pork");
    const baseline = composeMealsAround(anchor, library, context).primary!;
    const requiredToolIds = [...new Set(baseline.items.flatMap(({ item: candidate }) =>
      "toolIds" in candidate.preparation ? candidate.preparation.toolIds : []))].sort();
    const constrained = composeMealsAround(anchor, library, context, {
      maxTotalTimeMinutes: baseline.preparation.estimatedElapsedMinutes,
      availableToolIds: requiredToolIds,
    });
    expect(constrained.primary?.completeness).toBe("complete");
    expect(constrained.primary?.constraintOutcomes).toEqual([
      expect.objectContaining({ constraintId: "estimated-elapsed-time", status: "satisfied" }),
      expect.objectContaining({ constraintId: "available-tools", status: "satisfied", missingToolIds: [] }),
    ]);
  });

  it("returns explicit constraint and quality empty states without treating completeness as an override", () => {
    const constrained = composeMealsAround(item("tiramisu"), library, context, { maxTotalTimeMinutes: 30 });
    expect(constrained.primary).toBeUndefined();
    expect(constrained.emptyReason).toEqual({
      kind: "constraints-exceeded",
      outcomes: [{
        constraintId: "estimated-elapsed-time",
        status: "exceeded",
        limitMinutes: 30,
        estimatedElapsedMinutes: 405,
      }],
    });
    expect(constrained.relaxationOptions).toEqual(["estimated-elapsed-time"]);

    const anchor = item("greek-village-salad");
    const trueEmpty = composeMealsAround(anchor, [anchor], context, { minimumPairingScore: 0 });
    expect(trueEmpty.primary).toBeUndefined();
    expect(trueEmpty).toMatchObject({
      alternatives: [],
      emptyReason: { kind: "quality-threshold" },
      relaxationOptions: [],
    });
  });

  it("offers a real non-alcoholic replacement for an alcoholic anchor", () => {
    const result = composeMealsAround(item("fino-sherry"), library, context, { excludeAlcohol: false });
    expect(result.primary).toBeDefined();
    const replacement = findNonAlcoholicDrinkAlternative(result.primary!, library);
    expect(replacement?.pairing.mealRoleIds).toContain("drink");
    expect(replacement?.itemType).not.toBe("alcoholic-drink");
    expect(scorePairing(item("fino-sherry"), item("dongpo-pork")).cautions).toContainEqual({ kind: "alcoholic-option" });
  });

  it("preserves the published library and Recipe regression baseline", () => {
    expect(getPublishedRecipes()).toHaveLength(10);
    expect(nativeCulinaryItems).toHaveLength(16);
    expect(library).toHaveLength(26);
    expect(getPublishedCulinaryItemsForLocale("zh-CN")).toHaveLength(26);
    expect(getPublishedCulinaryItemsForLocale("en")).toHaveLength(26);
  });
});

describe("pairing presentation", () => {
  it("localizes structured reasons and cautions without changing engine data", () => {
    const reason = { kind: "flavor-complement" as const, complementId: "acid-richness" as const };
    const caution = { kind: "alcoholic-option" as const };
    expect(describePairingReason(reason, "zh-CN")).toContain("酸");
    expect(describePairingReason(reason, "en")).toContain("acidity");
    expect(describePairingCaution(caution, "zh-CN")).toContain("酒精");
    expect(describePairingCaution(caution, "en")).toContain("alcohol");
  });

  it("builds complete zh-CN and en view models without exposing raw scores", () => {
    const result = composeMealsAround(item("dongpo-pork"), library, context);
    const zh = buildMealCompositionPageModel(result, getStoryExperienceContext("zh-CN"), "zh-CN");
    const en = buildMealCompositionPageModel(result, getStoryExperienceContext("en"), "en");
    expect(zh.primary?.items.find(({ isAnchor }) => isAnchor)?.name).toBe("东坡肉");
    expect(en.primary?.items.find(({ isAnchor }) => isAnchor)?.name).toBe("Dongpo Pork");
    expect(en.primary?.reasons.every((text) => !/[\u3400-\u9fff]/.test(text))).toBe(true);
    expect(JSON.stringify(en)).not.toContain('"score"');
  });

  it("keeps the published pairing experience locale-complete", () => {
    const english = getPublishedPairingExperience("dongpo-pork", "en")!;
    const visibleText = [
      english.anchor.name,
      english.anchor.description,
      ...(english.primary?.items.flatMap((entry) => [entry.name, entry.description, entry.pairingReason ?? ""]) ?? []),
      ...(english.primary?.reasons ?? []),
      ...(english.primary?.cautions ?? []),
    ].join(" ");
    expect(visibleText).not.toMatch(/[\u3400-\u9fff]/);
    expect(JSON.stringify(english)).not.toContain('"score"');
  });

  it("applies only approved whole-meal fields and requires explicit relaxation", () => {
    const recipeOnly = getPublishedPairingExperience("dongpo-pork", "en", {
      decisionContext: {
        maxCalories: 1,
        minProtein: 999,
        maxAddedSugar: 0,
        maxOil: 0,
        maxSalt: 0,
        maxCost: 0,
      },
    });
    expect(recipeOnly?.primary).toEqual(getPublishedPairingExperience("dongpo-pork", "en")?.primary);

    const constrained = getPublishedPairingExperience("tiramisu", "en", {
      decisionContext: { maxTime: 30 },
    });
    expect(constrained?.primary).toBeUndefined();
    expect(constrained?.relaxationOptions.map(({ constraintId }) => constraintId)).toEqual(["estimated-elapsed-time"]);

    const relaxed = getPublishedPairingExperience("tiramisu", "en", {
      decisionContext: { maxTime: 30 },
      relaxedConstraintIds: ["estimated-elapsed-time"],
    });
    expect(relaxed?.primary).toBeDefined();
    expect(relaxed?.appliedRelaxationIds).toEqual(["estimated-elapsed-time"]);
    expect(relaxed?.primary?.preparation.elapsedTimeLabel).toContain("Estimated");

    const irrelevantRelaxation = getPublishedPairingExperience("dongpo-pork", "en", {
      decisionContext: { maxCalories: 1 },
      relaxedConstraintIds: ["available-tools"],
    });
    expect(irrelevantRelaxation?.appliedRelaxationIds).toEqual([]);

    const stableRelaxations = getPublishedPairingExperience("tiramisu", "en", {
      decisionContext: { maxTime: 30, availableTools: ["kettle"] },
      relaxedConstraintIds: ["available-tools", "estimated-elapsed-time", "available-tools"],
    });
    expect(stableRelaxations?.appliedRelaxationIds).toEqual(["estimated-elapsed-time", "available-tools"]);
  });

  it("allowlists and stably orders explicit Pairing relaxation query values", () => {
    const parsed = parseMealConstraintRelaxations(new URLSearchParams(
      "relaxMeal=available-tools&relaxMeal=unknown&relaxMeal=estimated-elapsed-time&relaxMeal=available-tools",
    ));
    expect(parsed).toEqual(["estimated-elapsed-time", "available-tools"]);
    expect(appendMealConstraintRelaxations(new URLSearchParams("dcMaxTime=30"), parsed).toString()).toBe(
      "dcMaxTime=30&relaxMeal=estimated-elapsed-time&relaxMeal=available-tools",
    );
  });

  it("wires 52 locale-complete SSG pages and distinct detail-page entry points", async () => {
    const pairingPage = await import("../../app/[locale]/pairing/[slug]/page");
    expect(pairingPage.generateStaticParams()).toHaveLength(52);
    expect(new Set(pairingPage.generateStaticParams().map(({ locale, slug }) => `${locale}:${slug}`)).size).toBe(52);
    const metadata = await pairingPage.generateMetadata({ params: Promise.resolve({ locale: "en", slug: "dongpo-pork" }) });
    const languages = metadata.alternates?.languages as Record<string, string>;
    expect(metadata.alternates?.canonical).toBe("https://cooking-lab-pied.vercel.app/en/pairing/dongpo-pork");
    expect(languages["zh-CN"]).toBe("https://cooking-lab-pied.vercel.app/zh-CN/pairing/dongpo-pork");
    expect(languages.en).toBe("https://cooking-lab-pied.vercel.app/en/pairing/dongpo-pork");

    const routeSource = readFileSync(resolve(process.cwd(), "app/[locale]/pairing/[slug]/page.tsx"), "utf8");
    const recipeSource = readFileSync(resolve(process.cwd(), "app/[locale]/recipes/[slug]/page.tsx"), "utf8");
    const culinarySource = readFileSync(resolve(process.cwd(), "app/[locale]/culinary/[slug]/page.tsx"), "utf8");
    expect(routeSource).toContain("getPublishedCulinaryItemsForLocale(locale)");
    expect(routeSource).toContain("dynamicParams = false");
    expect(routeSource).toContain("sourceLabel={messages.common.imageSource}");
    expect(recipeSource).toContain("Build a meal around this");
    expect(culinarySource).toContain("Build a meal around this");
    expect(recipeSource).toContain("`/pairing/${recipe.slug}`");
    expect(culinarySource).toContain("`/pairing/${detail.slug}`");
  });
});
