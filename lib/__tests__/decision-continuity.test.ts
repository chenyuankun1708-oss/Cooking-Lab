import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { decisionContextValueAllowlist } from "@/data/decision-context";
import { getLocalizedRecipes } from "@/data/localization/public-recipes";
import { getPublishedRecipes } from "@/data/published-recipes";
import { describeDecisionContext } from "../decision-context-display";
import {
  appendQueryToHref,
  buildDecisionReturnHref,
  parseDecisionRouteState,
  serializeDecisionRouteQuery,
} from "../decision-context-navigation";
import { replacePathLocale } from "../localization";
import { parseRecipeCatalogFilters } from "../recipe-exploration";

const recipes = getLocalizedRecipes(getPublishedRecipes(), "en");

describe("Decision Context journey continuity", () => {
  it("keeps normalized context stable from Discovery through Recipe and Pairing", () => {
    const discoveryQuery = serializeDecisionRouteQuery({
      availableIngredients: ["tomato", "egg"],
      availableTools: ["mixing-bowl", "frying-pan"],
      maxTime: 45,
      maxCalories: 600,
      flavorPreferences: ["warming", "light"],
    }, decisionContextValueAllowlist, { source: "discovery" });

    expect(discoveryQuery.toString()).toBe(
      "dcIngredient=egg&dcIngredient=tomato&dcTool=frying-pan&dcTool=mixing-bowl&dcMaxTime=45&dcMaxCalories=600&dcFlavor=light&dcFlavor=warming&dcSource=discovery",
    );
    const recipeState = parseDecisionRouteState(discoveryQuery, decisionContextValueAllowlist);
    const pairingQuery = serializeDecisionRouteQuery(recipeState.context, decisionContextValueAllowlist, { source: recipeState.source });
    expect(pairingQuery.toString()).toBe(discoveryQuery.toString());
    expect(appendQueryToHref("/en/recipes/tomato-scrambled-eggs", pairingQuery))
      .toBe(`/en/recipes/tomato-scrambled-eggs?${discoveryQuery}`);
  });

  it("rebuilds only an allowlisted catalog return route and never accepts a free-form URL", () => {
    const incoming = new URLSearchParams([
      ["dcMaxTime", "45"],
      ["dcSource", "https://evil.example/steal"],
      ["dcSource", "catalog"],
      ["q", "  tofu  "],
      ["cuisine", "chinese"],
      ["technique", "unknown-technique"],
      ["returnTo", "https://evil.example/steal"],
    ]);
    const state = parseDecisionRouteState(incoming, decisionContextValueAllowlist);
    const filters = parseRecipeCatalogFilters(incoming, recipes);

    expect(state).toEqual({ context: { maxTime: 45 }, source: "catalog" });
    expect(filters).toEqual({ query: "tofu", cuisineId: "chinese" });
    expect(buildDecisionReturnHref("en", state, decisionContextValueAllowlist, filters))
      .toBe("/en/recipes?dcMaxTime=45&q=tofu&cuisine=chinese");
  });

  it("restores Discovery directly and preserves machine values across locale switching", () => {
    const state = { context: { maxTime: 30, preferredCuisine: "chinese" }, source: "discovery" as const };
    const query = serializeDecisionRouteQuery(state.context, decisionContextValueAllowlist, { source: state.source });
    expect(buildDecisionReturnHref("zh-CN", state, decisionContextValueAllowlist))
      .toBe("/zh-CN?dcMaxTime=30&dcCuisine=chinese#decide");
    expect(replacePathLocale("/zh-CN/recipes/tomato-scrambled-eggs", "en", query))
      .toBe(`/en/recipes/tomato-scrambled-eggs?${query}`);
  });

  it("keeps context-free visits valid", () => {
    expect(parseDecisionRouteState(new URLSearchParams(), decisionContextValueAllowlist)).toEqual({ context: {} });
    expect(serializeDecisionRouteQuery({}, decisionContextValueAllowlist).toString()).toBe("");
    expect(appendQueryToHref("/en/recipes/tofu", new URLSearchParams())).toBe("/en/recipes/tofu");
  });

  it("labels whole-meal, Recipe-only, and carried scopes without promoting nutrition", () => {
    const entries = describeDecisionContext({
      maxTime: 45,
      availableTools: ["frying-pan"],
      maxCalories: 600,
      availableIngredients: ["egg"],
    }, "en");
    expect(entries.map(({ field, scope }) => [field, scope])).toEqual([
      ["maxTime", "meal"],
      ["availableTools", "meal"],
      ["maxCalories", "recipe"],
      ["availableIngredients", "carried"],
    ]);
    expect(entries.find(({ field }) => field === "maxTime")?.text).toMatch(/estimated/i);
    expect(entries.find(({ field }) => field === "maxCalories")?.scopeLabel).toBe("Current recipe only");
  });

  it("keeps route metadata query-free and static params bounded to content identities", () => {
    const files = [
      "app/[locale]/recipes/[slug]/page.tsx",
      "app/[locale]/pairing/[slug]/page.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source, file).toContain("export const dynamicParams = false");
      expect(source, file).toContain("generateStaticParams");
      expect(source, file).toContain("buildLocaleAlternates(locale, path)");
      expect(source, file).not.toMatch(/buildLocaleAlternates\([^\n]*searchParams/);
    }
  });

  it("updates Discovery URLs with replace and preserves normalized queries in journey links", () => {
    const source = readFileSync(resolve(process.cwd(), "components/recipe-discovery.tsx"), "utf8");
    expect(source).toContain("router.replace(");
    expect(source).toContain("parseDecisionContext(");
    expect(source).toContain("serializeDecisionRouteQuery(");
    expect(source).toContain("query={recipeQuery}");
  });
});
