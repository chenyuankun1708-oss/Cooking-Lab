"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RecipeCard } from "./recipe-card";
import { getCuisineLabel, getTagLabel, getTechniqueLabel, getToolLabel } from "@/lib/display-labels";
import { getIngredientLabel } from "@/data/localization/ingredients";
import { cookingTimeBands } from "@/lib/cooking-time";
import { getFlavorPreferenceLabel, listFlavorPreferenceOptions } from "@/lib/flavor";
import {
  discoverRecipes,
  hasActiveCriteria,
  resetRecommendationCriteria,
} from "@/lib/recommendation";
import { buildRelaxationSuggestions } from "@/lib/recommendation-display";
import { getLocalizedPath } from "@/lib/localization";
import {
  parseDecisionContext,
  serializeDecisionContext,
  type DecisionContextValueAllowlist,
} from "@/lib/decision-context";
import { serializeDecisionRouteQuery } from "@/lib/decision-context-navigation";
import { getRecipeTagIds, listRecipeCuisineOptions, listRecipeTechniqueOptions } from "@/lib/taxonomy";
import type { Ingredient } from "@/types/ingredient";
import type { FlavorPreferenceId } from "@/types/flavor";
import type { Recipe } from "@/types/recipe";
import type { RecommendationCriteria } from "@/types/recommendation";
import type { SupportedLocale } from "@/types/localization";

const cookingGoals = ["high-protein", "vegetable-rich", "one-pot", "quick", "high-fiber", "no-added-sugar"];
type ListKey = "availableIngredients" | "availableTools" | "preferredTags" | "preferredMethods";
type NumberKey = "maxTime" | "maxCalories" | "minProtein" | "maxOil" | "maxSalt" | "maxAddedSugar" | "maxCost";

export function RecipeDiscovery({
  recipes,
  ingredients,
  locale,
  decisionContextAllowlist,
}: {
  recipes: readonly Recipe[];
  ingredients: Ingredient[];
  locale: SupportedLocale;
  decisionContextAllowlist: DecisionContextValueAllowlist;
}) {
  const copy = discoveryCopy[locale];
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [criteria, setCriteria] = useState<RecommendationCriteria>(() =>
    parseDecisionContext(new URLSearchParams(searchParams.toString()), decisionContextAllowlist));
  const [ingredientQuery, setIngredientQuery] = useState("");
  const results = useMemo(() => discoverRecipes(recipes, criteria), [recipes, criteria]);
  const tools = useMemo(() => [...new Set(recipes.flatMap((recipe) => recipe.tools))].sort(), [recipes]);
  const cuisines = useMemo(() => listRecipeCuisineOptions(recipes, locale), [recipes, locale]);
  const methods = useMemo(() => listRecipeTechniqueOptions(recipes, locale), [recipes, locale]);
  const flavorOptions = useMemo(() => listFlavorPreferenceOptions(locale), [locale]);
  const shownIngredients = ingredients.filter((item) =>
    `${item.name} ${getIngredientLabel(item.id, item.name, locale)} ${item.aliases.join(" ")} ${item.id}`.toLocaleLowerCase(locale)
      .includes(ingredientQuery.trim().toLocaleLowerCase(locale)));
  const active = hasActiveCriteria(criteria);
  const activeSummary = summary(criteria, ingredients, locale);
  const suggestions = buildRelaxationSuggestions(criteria, locale);
  const visibleResults = results.slice(0, active ? 12 : 6);
  const contextQuery = useMemo(
    () => serializeDecisionContext(criteria, decisionContextAllowlist),
    [criteria, decisionContextAllowlist],
  );
  const recipeQuery = useMemo(
    () => serializeDecisionRouteQuery(criteria, decisionContextAllowlist, active ? { source: "discovery" } : {}),
    [active, criteria, decisionContextAllowlist],
  );

  useEffect(() => {
    const normalizedQuery = contextQuery.toString();
    if (normalizedQuery === searchParams.toString()) return;
    router.replace(normalizedQuery ? `${pathname}?${normalizedQuery}` : pathname, { scroll: false });
  }, [contextQuery, pathname, router, searchParams]);

  const reset = () => {
    setCriteria(resetRecommendationCriteria());
    setIngredientQuery("");
  };
  const toggle = (key: ListKey, value: string) => setCriteria((current) => {
    const values = current[key] ?? [];
    return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
  });
  const toggleFlavor = (value: FlavorPreferenceId) => setCriteria((current) => {
    const values = current.flavorPreferences ?? [];
    return { ...current, flavorPreferences: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
  });
  const setNumber = (key: NumberKey, value: string) =>
    setCriteria((current) => ({ ...current, [key]: value ? Number(value) : undefined }));

  return (
    <section id="decide" className="border-y border-stone-200 bg-[var(--surface-paper)] py-12 sm:py-16" aria-labelledby="decision-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#a64631]">{copy.eyebrow}</p>
          <h2 id="decision-title" className="mt-2 text-3xl font-bold leading-tight text-stone-950 sm:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-4 leading-7 text-stone-600">
            {copy.intro}
          </p>
        </div>

        <div className="mt-9 border-y border-stone-300">
          <div className="grid gap-0 lg:grid-cols-3 lg:divide-x lg:divide-stone-200">
            <fieldset className="py-6 lg:pr-7">
              <legend className="text-lg font-bold text-stone-950">{copy.time}</legend>
              <div className="mt-4 flex flex-wrap gap-2" aria-label={copy.maxTime}>
                {cookingTimeBands.slice(0, 3).map((band) => (
                  <ChoiceButton
                    key={band.id}
                    active={criteria.maxTime === band.maxMinutes}
                    label={`${band.label[locale]} · ${locale === "zh-CN" ? `${band.maxMinutes} 分钟内` : `within ${band.maxMinutes} min`}`}
                    onClick={() => setCriteria((current) => ({
                      ...current,
                      maxTime: current.maxTime === band.maxMinutes ? undefined : band.maxMinutes,
                    }))}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="border-t border-stone-200 py-6 lg:border-t-0 lg:px-7">
              <legend className="text-lg font-bold text-stone-950">{copy.flavor}</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {flavorOptions.map((option) => (
                  <Toggle
                    key={option.id}
                    checked={criteria.flavorPreferences?.includes(option.id) ?? false}
                    label={option.label}
                    onChange={() => toggleFlavor(option.id)}
                  />
                ))}
              </div>
            </fieldset>

            <div className="border-t border-stone-200 py-6 lg:border-t-0 lg:pl-7">
              <details>
                <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 text-lg font-bold text-stone-950">
                  <span>{copy.ingredients}</span>
                  <span className="text-sm font-semibold text-[#235849]">
                    {criteria.availableIngredients?.length ? copy.selected(criteria.availableIngredients.length) : copy.chooseIngredients}
                  </span>
                </summary>
                <label className="mt-4 block">
                  <span className="sr-only">{copy.searchIngredients}</span>
                  <input
                    className="min-h-11 w-full rounded-md border border-stone-300 bg-[#fbfaf6] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
                    onChange={(event) => setIngredientQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder(ingredients.length)}
                    type="search"
                    value={ingredientQuery}
                  />
                </label>
                <div className="mt-3 max-h-52 overflow-y-auto border-t border-stone-200 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {shownIngredients.map((item) => (
                      <Toggle
                        key={item.id}
                        checked={criteria.availableIngredients?.includes(item.id) ?? false}
                        label={getIngredientLabel(item.id, item.name, locale)}
                        onChange={() => toggle("availableIngredients", item.id)}
                      />
                    ))}
                  </div>
                  {shownIngredients.length === 0 ? <p className="py-4 text-sm text-stone-500">{copy.noIngredient}</p> : null}
                </div>
              </details>
            </div>
          </div>

          <div className="border-t border-stone-200 py-4">
            <details>
              <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-900">
                <span>{copy.more}</span>
                <span className="text-sm font-semibold text-[#235849]">{copy.moreHint}</span>
              </summary>
              <div className="grid gap-7 pb-4 pt-5 md:grid-cols-2">
                <fieldset>
                  <legend className="font-semibold">{copy.tools}</legend>
                  <p className="mt-1 text-xs leading-5 text-stone-500">{copy.toolsHint}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tools.map((tool) => (
                      <Toggle
                        key={tool}
                        checked={criteria.availableTools?.includes(tool) ?? false}
                        label={getToolLabel(tool, locale)}
                        onChange={() => toggle("availableTools", tool)}
                      />
                    ))}
                  </div>
                </fieldset>
                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <Select label={copy.budget} onChange={(value) => setNumber("maxCost", value)} options={[10, 20, 30, 50]} suffix={locale === "zh-CN" ? "元" : "CNY"} value={criteria.maxCost} anyLabel={copy.any} />
                  <label className="text-sm">
                    <span className="mb-1 block text-stone-600">{copy.preferredCuisine}</span>
                    <select
                      className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
                      onChange={(event) => setCriteria((current) => ({ ...current, preferredCuisine: event.target.value || undefined }))}
                      value={criteria.preferredCuisine ?? ""}
                    >
                      <option value="">{copy.noPreference}</option>
                      {cuisines.map((cuisine) => <option key={cuisine.id} value={cuisine.id}>{cuisine.label}</option>)}
                    </select>
                  </label>
                  <fieldset className="sm:col-span-2">
                    <legend className="text-sm text-stone-600">{copy.preferredTechnique}</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {methods.map((method) => (
                        <Toggle
                          key={method.id}
                          checked={criteria.preferredMethods?.includes(method.id) ?? false}
                          label={method.label}
                          onChange={() => toggle("preferredMethods", method.id)}
                        />
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="sm:col-span-2">
                    <legend className="text-sm text-stone-600">{copy.goals}</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cookingGoals
                        .filter((tag) => recipes.some((recipe) => getRecipeTagIds(recipe).includes(tag)))
                        .map((tag) => (
                          <Toggle
                            key={tag}
                            checked={criteria.preferredTags?.includes(tag) ?? false}
                            label={getTagLabel(tag, locale)}
                            onChange={() => toggle("preferredTags", tag)}
                          />
                        ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </details>
          </div>

          <div className="border-t border-stone-200 py-4">
            <details>
              <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-900">
                <span>{copy.nutrition}</span>
                <span className="text-sm font-semibold text-[#235849]">{copy.optionalDetails}</span>
              </summary>
              <div className="grid gap-4 pb-4 pt-5 sm:grid-cols-2 lg:grid-cols-5">
                <Select label={copy.calories} onChange={(value) => setNumber("maxCalories", value)} options={[400, 500, 600, 800]} suffix="kcal" value={criteria.maxCalories} anyLabel={copy.any} />
                <Select label={copy.protein} onChange={(value) => setNumber("minProtein", value)} options={[20, 30, 40]} suffix="g" value={criteria.minProtein} anyLabel={copy.any} />
                <Select label={copy.oil} onChange={(value) => setNumber("maxOil", value)} options={[3, 5, 8]} suffix="g" value={criteria.maxOil} anyLabel={copy.any} />
                <Select label={copy.salt} onChange={(value) => setNumber("maxSalt", value)} options={[0.5, 1, 1.5]} suffix="g" value={criteria.maxSalt} anyLabel={copy.any} />
                <Select label={copy.sugar} onChange={(value) => setNumber("maxAddedSugar", value)} options={[0, 5, 10]} suffix="g" value={criteria.maxAddedSugar} anyLabel={copy.any} />
              </div>
            </details>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#a64631]">{active ? copy.ranked : copy.start}</p>
            <h3 className="mt-1 text-2xl font-bold text-stone-950 sm:text-3xl">{copy.resultsTitle}</h3>
            <p className="mt-2 text-sm text-stone-500" aria-live="polite">{copy.resultCount(results.length)}</p>
          </div>
          <button
            className="focus-ring min-h-11 px-2 text-sm font-bold text-[#235849] hover:underline disabled:cursor-not-allowed disabled:text-stone-400"
            disabled={!active}
            onClick={reset}
            type="button"
          >
            {copy.reset}
          </button>
        </div>

        {activeSummary.length ? (
          <p className="mt-4 border-l-2 border-[#235849] pl-3 text-sm leading-6 text-stone-600">
            <span className="font-semibold text-stone-900">{copy.selectedSummary}</span>{activeSummary.join(" · ")}
          </p>
        ) : null}

        {visibleResults.length ? (
          <>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleResults.map((result) => <RecipeCard key={result.recipe.id} result={result} locale={locale} query={recipeQuery} />)}
            </div>
            {results.length > visibleResults.length ? (
              <p className="mt-7 text-center text-sm text-stone-600">
                {copy.moreResults}<Link className="focus-ring ml-1 font-bold text-[#235849] hover:underline" href={getLocalizedPath(locale, "/recipes", contextQuery)}>{copy.discoverMore}</Link>
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-7 border border-dashed border-stone-400 bg-[#fbfaf6] px-6 py-14 text-center">
            <h3 className="text-2xl font-bold text-stone-950">{copy.empty}</h3>
            <p className="mx-auto mt-3 max-w-lg leading-7 text-stone-600">{copy.try}: {suggestions.join(locale === "zh-CN" ? "、" : ", ")}.</p>
            <button className="focus-ring mt-6 min-h-11 rounded-md bg-[#235849] px-5 font-semibold text-white hover:bg-[#173f35]" onClick={reset} type="button">
              {copy.resetShort}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Select({
  label,
  value,
  options,
  suffix,
  onChange,
  anyLabel,
}: {
  label: string;
  value?: number;
  options: number[];
  suffix: string;
  onChange: (value: string) => void;
  anyLabel: string;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-stone-600">{label}</span>
      <select
        className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ""}
      >
        <option value="">{anyLabel}</option>
        {options.map((option) => <option key={option} value={option}>{option} {suffix}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3 py-2 text-sm font-medium transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#b94e35] ${
      checked ? "border-[#235849] bg-[#235849] text-white" : "border-stone-300 bg-white text-stone-700 hover:border-[#235849]"
    }`}>
      <input checked={checked} className="sr-only" onChange={onChange} type="checkbox" />
      {label}
    </label>
  );
}

function ChoiceButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      aria-pressed={active}
      className={`focus-ring min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
        active ? "border-[#a64631] bg-[#a64631] text-white" : "border-stone-300 bg-white text-stone-700 hover:border-[#a64631]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function summary(criteria: RecommendationCriteria, ingredients: Ingredient[], locale: SupportedLocale): string[] {
  const ingredientNames = new Map(ingredients.map((item) => [item.id, getIngredientLabel(item.id, item.name, locale)]));
  const prefix = (zh: string, en: string) => locale === "zh-CN" ? zh : en;
  return [
    ...(criteria.availableIngredients ?? []).map((id) => `${prefix("已有", "Have ")}${ingredientNames.get(id) ?? id}`),
    ...(criteria.availableTools ?? []).map((id) => `${prefix("可用", "Have ")}${getToolLabel(id, locale)}`),
    ...(criteria.preferredTags ?? []).map((id) => `${prefix("偏好", "Prefer ")}${getTagLabel(id, locale)}`),
    ...(criteria.preferredMethods ?? []).map((method) => `${prefix("偏好", "Prefer ")}${getTechniqueLabel(method, locale)}`),
    ...(criteria.flavorPreferences ?? []).map((id) => `${prefix("想吃", "Craving ")}${getFlavorPreferenceLabel(id, locale)}`),
    criteria.maxTime !== undefined ? `${cookingTimeBands.find((band) => band.maxMinutes === criteria.maxTime)?.label[locale] ?? prefix("约", "About")} · ${criteria.maxTime} ${prefix("分钟内", "min max")}` : undefined,
    criteria.maxCalories !== undefined ? `≤ ${criteria.maxCalories} kcal${prefix("/份", "/serving")}` : undefined,
    criteria.minProtein !== undefined ? `≥ ${criteria.minProtein} g ${prefix("蛋白质/份", "protein/serving")}` : undefined,
    criteria.maxOil !== undefined ? `≤ ${criteria.maxOil} g ${prefix("油/份", "oil/serving")}` : undefined,
    criteria.maxSalt !== undefined ? `≤ ${criteria.maxSalt} g ${prefix("盐/份", "salt/serving")}` : undefined,
    criteria.maxAddedSugar !== undefined ? `≤ ${criteria.maxAddedSugar} g ${prefix("添加糖/份", "added sugar/serving")}` : undefined,
    criteria.maxCost !== undefined ? `≤ ¥${criteria.maxCost}${prefix("/份", "/serving")}` : undefined,
    criteria.preferredCuisine ? `${prefix("偏好", "Prefer ")}${getCuisineLabel(criteria.preferredCuisine, locale)}` : undefined,
  ].filter((value): value is string => Boolean(value));
}

const discoveryCopy = {
  "zh-CN": {
    eyebrow: "今晚的决定", title: "今天想吃什么味道？", intro: "先从时间、口味和手边食材开始。想得更具体时，再补充厨具、菜系或营养范围。",
    time: "有多少时间？", maxTime: "最长料理时间", flavor: "想吃什么味道？", ingredients: "手边有什么？", selected: (n: number) => `已选 ${n} 种`,
    chooseIngredients: "选择食材", searchIngredients: "搜索食材", searchPlaceholder: (n: number) => `搜索 ${n} 种食材`, noIngredient: "没有找到该食材",
    more: "还想怎么选？", moreHint: "厨具、预算、菜系与做法", tools: "手边可以用的厨具", toolsHint: "选中后，只留下这些厨具能完成的料理。",
    budget: "每份预算", preferredCuisine: "偏好菜系", noPreference: "无偏好", preferredTechnique: "偏好技法", goals: "今天想吃得怎样？",
    nutrition: "营养与用量", optionalDetails: "需要时再看", calories: "热量上限/份", protein: "最低蛋白质/份", oil: "用油上限/份", salt: "盐上限/份", sugar: "添加糖上限/份", any: "不限",
    ranked: "为你排在前面", start: "先从这些料理开始", resultsTitle: "这些更适合今晚", resultCount: (n: number) => `目前有 ${n} 道可以继续看看`, reset: "重新想想",
    selectedSummary: "你刚才选了：", moreResults: "先看看最合适的几道。", discoverMore: "再去发现更多", empty: "暂时没找到正合适的", try: "不妨试试", resetShort: "重选一下",
  },
  en: {
    eyebrow: "Decide tonight", title: "What flavors sound good today?", intro: "Start with time, flavor, and ingredients on hand. Add tools, cuisine, or nutrition ranges only when they help.",
    time: "How much time?", maxTime: "Maximum cooking time", flavor: "What are you craving?", ingredients: "What do you have?", selected: (n: number) => `${n} selected`,
    chooseIngredients: "Choose ingredients", searchIngredients: "Search ingredients", searchPlaceholder: (n: number) => `Search ${n} ingredients`, noIngredient: "No matching ingredient",
    more: "Narrow it down further", moreHint: "Tools, budget, cuisine, and technique", tools: "Available tools", toolsHint: "When selected, results only include recipes these tools can complete.",
    budget: "Budget per serving", preferredCuisine: "Preferred cuisine", noPreference: "No preference", preferredTechnique: "Preferred techniques", goals: "What kind of meal today?",
    nutrition: "Nutrition and amounts", optionalDetails: "Only when useful", calories: "Calories/serving max", protein: "Protein/serving min", oil: "Oil/serving max", salt: "Salt/serving max", sugar: "Added sugar/serving max", any: "Any",
    ranked: "Ranked for you", start: "Start with these", resultsTitle: "A better fit for tonight", resultCount: (n: number) => `${n} recipes to explore`, reset: "Start over",
    selectedSummary: "Your choices: ", moreResults: "Start with the strongest matches.", discoverMore: "Discover more", empty: "Nothing fits just yet", try: "Try this", resetShort: "Reset choices",
  },
} as const;
