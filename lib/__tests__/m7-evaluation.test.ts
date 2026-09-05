import { describe, expect, it } from "vitest";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { getLocalizedRecipes } from "@/data/localization/public-recipes";
import { getPublishedPairingExperience } from "@/data/published-meal-compositions";
import { getPublishedRecipeBySlug, getPublishedRecipes } from "@/data/published-recipes";
import { parseDecisionContext } from "../decision-context";
import {
  appendQueryToHref,
  buildDecisionReturnHref,
  parseDecisionRouteState,
  serializeDecisionRouteQuery,
} from "../decision-context-navigation";
import { replacePathLocale } from "../localization";
import {
  appendMealConstraintRelaxations,
  parseMealConstraintRelaxations,
} from "../meal-constraint-navigation";
import { discoverRecipes } from "../recommendation";

const publishedRecipes = getPublishedRecipes();
const completeToolSet = [
  "knife",
  "cutting-board",
  "mixing-bowl",
  "frying-pan",
  "kettle",
  "gaiwan",
  "scale",
];

function recipeSlugs(locale: "zh-CN" | "en", query: URLSearchParams): string[] {
  const context = parseDecisionContext(query, decisionContextValueAllowlist);
  return discoverRecipes(getLocalizedRecipes(publishedRecipes, locale), context)
    .map(({ recipe }) => recipe.slug);
}

describe("M7 canonical evaluation", () => {
  it("keeps the time estimate through Recipe and into a compliant Meal", () => {
    const state = parseDecisionRouteState(
      new URLSearchParams("dcMaxTime=bad&dcMaxTime=30&dcSource=discovery"),
      decisionContextValueAllowlist,
    );
    const query = serializeDecisionRouteQuery(state.context, decisionContextValueAllowlist, { source: state.source });

    expect(query.toString()).toBe("dcMaxTime=30&dcSource=discovery");
    expect(recipeSlugs("en", query)).toContain("tomato-scrambled-eggs");
    expect(appendQueryToHref("/en/pairing/tomato-scrambled-eggs", query)).toBe(
      "/en/pairing/tomato-scrambled-eggs?dcMaxTime=30&dcSource=discovery",
    );

    const meal = getPublishedPairingExperience("tomato-scrambled-eggs", "en", {
      decisionContext: state.context,
    });
    expect(meal?.primary).toMatchObject({
      templateId: "main-drink",
      completenessLabel: "Complete composition",
      preparation: { elapsedTimeLabel: "Estimated coordinated time: about 22 min" },
    });
    expect(meal?.emptyReason).toBeUndefined();
  });

  it("treats a non-empty tool declaration as the complete available set", () => {
    const raw = new URLSearchParams();
    [...completeToolSet].reverse().forEach((tool) => raw.append("dcTool", tool));
    raw.append("dcTool", "kettle");
    raw.set("dcSource", "discovery");
    const state = parseDecisionRouteState(raw, decisionContextValueAllowlist);
    const query = serializeDecisionRouteQuery(state.context, decisionContextValueAllowlist, { source: state.source });

    expect(query.toString()).toBe(
      "dcTool=cutting-board&dcTool=frying-pan&dcTool=gaiwan&dcTool=kettle&dcTool=knife&dcTool=mixing-bowl&dcTool=scale&dcSource=discovery",
    );
    expect(recipeSlugs("en", query)).toContain("tomato-scrambled-eggs");
    const meal = getPublishedPairingExperience("tomato-scrambled-eggs", "en", {
      decisionContext: state.context,
    });
    expect(meal?.primary?.items.map(({ id }) => id)).toEqual([
      "tomato-scrambled-eggs",
      "longjing-green-tea",
    ]);
    expect(meal?.primary?.completenessLabel).toBe("Complete composition");
    expect(meal?.relaxationOptions).toEqual([]);
  });

  it("returns a complete Meal only when both active whole-meal constraints pass", () => {
    const context = { maxTime: 30, availableTools: completeToolSet };
    const query = serializeDecisionRouteQuery(context, decisionContextValueAllowlist, { source: "discovery" });

    expect(recipeSlugs("en", query)).toContain("tomato-scrambled-eggs");
    const meal = getPublishedPairingExperience("tomato-scrambled-eggs", "en", { decisionContext: context });
    expect(meal?.primary).toMatchObject({
      templateId: "main-drink",
      completenessLabel: "Complete composition",
      preparation: { elapsedTimeLabel: "Estimated coordinated time: about 21 min" },
    });
    expect(meal?.primary?.items.map(({ id }) => id)).toEqual([
      "tomato-scrambled-eggs",
      "longjing-green-tea",
    ]);
    expect(meal?.emptyReason).toBeUndefined();
  });

  it("returns a valid partial Meal instead of filling an ineligible template", () => {
    expect(getPublishedRecipeBySlug("greek-village-salad")).toBeUndefined();
    const context = { maxTime: 30 };
    const meal = getPublishedPairingExperience("greek-village-salad", "en", { decisionContext: context });

    expect(meal?.primary).toMatchObject({
      templateId: "partial-pair",
      completenessLabel: "The current library supports a partial composition",
      preparation: { elapsedTimeLabel: "Estimated coordinated time: about 30 min" },
    });
    expect(meal?.primary?.items.map(({ id }) => id)).toEqual([
      "greek-village-salad",
      "tomato-scrambled-eggs",
    ]);
    expect(meal?.alternatives).toEqual([]);
    expect(meal?.emptyReason).toBeUndefined();
    expect(meal?.relaxationOptions).toEqual([]);
  });

  it("returns an explicit empty result and relaxes only after a user choice", () => {
    expect(getPublishedRecipeBySlug("tiramisu")).toBeUndefined();
    const context = { maxTime: 30 };
    const constrained = getPublishedPairingExperience("tiramisu", "en", { decisionContext: context });

    expect(constrained?.primary).toBeUndefined();
    expect(constrained?.emptyReason).toEqual({
      kind: "constraints-exceeded",
      details: ["The nearest current candidate is estimated at 405 min, above your 30 min limit."],
    });
    expect(constrained?.relaxationOptions).toEqual([{
      constraintId: "estimated-elapsed-time",
      label: "Remove the estimated meal-time condition",
    }]);

    const originalQuery = serializeDecisionRouteQuery(context, decisionContextValueAllowlist, { source: "discovery" });
    const relaxedQuery = appendMealConstraintRelaxations(originalQuery, ["estimated-elapsed-time"]);
    expect(relaxedQuery.toString()).toBe(
      "dcMaxTime=30&dcSource=discovery&relaxMeal=estimated-elapsed-time",
    );
    const relaxedIds = parseMealConstraintRelaxations(relaxedQuery);
    const relaxed = getPublishedPairingExperience("tiramisu", "en", {
      decisionContext: context,
      relaxedConstraintIds: relaxedIds,
    });
    expect(relaxed?.primary).toBeDefined();
    expect(relaxed?.appliedRelaxationIds).toEqual(["estimated-elapsed-time"]);
    expect(relaxed?.primary?.preparation.elapsedTimeLabel).toMatch(/^Estimated coordinated time:/);
  });

  it("preserves identity and normalized context across locale and back recovery", () => {
    const context = {
      maxTime: 30,
      maxCalories: 600,
      availableTools: completeToolSet,
    };
    const query = serializeDecisionRouteQuery(context, decisionContextValueAllowlist, { source: "discovery" });
    const state = parseDecisionRouteState(query, decisionContextValueAllowlist);

    expect(replacePathLocale("/en/pairing/tomato-scrambled-eggs", "zh-CN", query)).toBe(
      `/zh-CN/pairing/tomato-scrambled-eggs?${query}`,
    );
    expect(buildDecisionReturnHref("zh-CN", state, decisionContextValueAllowlist)).toBe(
      "/zh-CN?dcTool=cutting-board&dcTool=frying-pan&dcTool=gaiwan&dcTool=kettle&dcTool=knife&dcTool=mixing-bowl&dcTool=scale&dcMaxTime=30&dcMaxCalories=600#decide",
    );
    expect(recipeSlugs("zh-CN", query)).toEqual(recipeSlugs("en", query));

    const english = getPublishedPairingExperience("tomato-scrambled-eggs", "en", { decisionContext: context });
    const chinese = getPublishedPairingExperience("tomato-scrambled-eggs", "zh-CN", { decisionContext: context });
    expect(chinese?.primary?.items.map(({ id }) => id)).toEqual(english?.primary?.items.map(({ id }) => id));
    expect(chinese?.primary?.templateId).toBe(english?.primary?.templateId);
    expect(chinese?.primary?.preparation.elapsedTimeLabel).toContain("预计");
    expect(english?.primary?.preparation.elapsedTimeLabel).toContain("Estimated");
    const englishVisibleText = [
      english?.anchor.name,
      english?.anchor.description,
      english?.primary?.templateLabel,
      english?.primary?.completenessLabel,
      ...(english?.primary?.items.flatMap(({ name, description, slotLabel, pairingReason }) =>
        [name, description, slotLabel, pairingReason]) ?? []),
      ...(english?.primary?.reasons ?? []),
      ...(english?.primary?.cautions ?? []),
      english?.primary?.preparation.levelLabel,
      english?.primary?.preparation.activeTimeLabel,
      english?.primary?.preparation.elapsedTimeLabel,
    ].filter(Boolean).join(" ");
    expect(englishVisibleText).not.toMatch(/[\u3400-\u9fff]/);
  });
});
