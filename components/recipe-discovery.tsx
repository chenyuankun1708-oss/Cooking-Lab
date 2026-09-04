"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RecipeCard } from "./recipe-card";
import { getCuisineLabel, getTagLabel, getTechniqueLabel, getToolLabel } from "@/lib/display-labels";
import { cookingTimeBands } from "@/lib/cooking-time";
import { getFlavorPreferenceLabel, listFlavorPreferenceOptions } from "@/lib/flavor";
import {
  buildRelaxationSuggestions,
  discoverRecipes,
  hasActiveCriteria,
  resetRecommendationCriteria,
} from "@/lib/recommendation";
import { getRecipeTagIds, listRecipeCuisineOptions, listRecipeTechniqueOptions } from "@/lib/taxonomy";
import type { Ingredient } from "@/types/ingredient";
import type { FlavorPreferenceId } from "@/types/flavor";
import type { Recipe } from "@/types/recipe";
import type { RecommendationCriteria } from "@/types/recommendation";

const cookingGoals = ["high-protein", "vegetable-rich", "one-pot", "quick", "high-fiber", "no-added-sugar"];
type ListKey = "availableIngredients" | "availableTools" | "preferredTags" | "preferredMethods";
type NumberKey = "maxTime" | "maxCalories" | "minProtein" | "maxOil" | "maxSalt" | "maxAddedSugar" | "maxCost";

export function RecipeDiscovery({ recipes, ingredients }: { recipes: readonly Recipe[]; ingredients: Ingredient[] }) {
  const [criteria, setCriteria] = useState<RecommendationCriteria>(() => resetRecommendationCriteria());
  const [ingredientQuery, setIngredientQuery] = useState("");
  const results = useMemo(() => discoverRecipes(recipes, criteria), [recipes, criteria]);
  const tools = useMemo(() => [...new Set(recipes.flatMap((recipe) => recipe.tools))].sort(), [recipes]);
  const cuisines = useMemo(() => listRecipeCuisineOptions(recipes), [recipes]);
  const methods = useMemo(() => listRecipeTechniqueOptions(recipes), [recipes]);
  const flavorOptions = useMemo(() => listFlavorPreferenceOptions(), []);
  const shownIngredients = ingredients.filter((item) =>
    `${item.name} ${item.aliases.join(" ")} ${item.id}`.toLocaleLowerCase("zh-CN")
      .includes(ingredientQuery.trim().toLocaleLowerCase("zh-CN")));
  const active = hasActiveCriteria(criteria);
  const activeSummary = summary(criteria, ingredients);
  const suggestions = buildRelaxationSuggestions(criteria);
  const visibleResults = results.slice(0, active ? 12 : 6);

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
    <section id="decide" className="border-y border-stone-200 bg-white py-14 sm:py-20" aria-labelledby="decision-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#a64631]">今晚的决定</p>
          <h2 id="decision-title" className="mt-2 text-3xl font-bold leading-tight text-stone-950 sm:text-5xl">
            今天想吃什么味道？
          </h2>
          <p className="mt-4 leading-7 text-stone-600">
            先从时间、口味和手边食材开始。想得更具体时，再补充厨具、菜系或营养范围。
          </p>
        </div>

        <div className="mt-9 border-y border-stone-300">
          <div className="grid gap-0 lg:grid-cols-3 lg:divide-x lg:divide-stone-200">
            <fieldset className="py-6 lg:pr-7">
              <legend className="text-lg font-bold text-stone-950">有多少时间？</legend>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="最长料理时间">
                {cookingTimeBands.slice(0, 3).map((band) => (
                  <ChoiceButton
                    key={band.id}
                    active={criteria.maxTime === band.maxMinutes}
                    label={`${band.label["zh-CN"]} · ${band.maxMinutes} 分钟内`}
                    onClick={() => setCriteria((current) => ({
                      ...current,
                      maxTime: current.maxTime === band.maxMinutes ? undefined : band.maxMinutes,
                    }))}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="border-t border-stone-200 py-6 lg:border-t-0 lg:px-7">
              <legend className="text-lg font-bold text-stone-950">想吃什么味道？</legend>
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
                  <span>手边有什么？</span>
                  <span className="text-sm font-semibold text-[#235849]">
                    {criteria.availableIngredients?.length ? `已选 ${criteria.availableIngredients.length} 种` : "选择食材"}
                  </span>
                </summary>
                <label className="mt-4 block">
                  <span className="sr-only">搜索食材</span>
                  <input
                    className="min-h-11 w-full rounded-md border border-stone-300 bg-[#fbfaf6] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
                    onChange={(event) => setIngredientQuery(event.target.value)}
                    placeholder={`搜索 ${ingredients.length} 种食材`}
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
                        label={item.name}
                        onChange={() => toggle("availableIngredients", item.id)}
                      />
                    ))}
                  </div>
                  {shownIngredients.length === 0 ? <p className="py-4 text-sm text-stone-500">没有找到该食材</p> : null}
                </div>
              </details>
            </div>
          </div>

          <div className="border-t border-stone-200 py-4">
            <details>
              <summary className="focus-ring flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bold text-stone-900">
                <span>还想怎么选？</span>
                <span className="text-sm font-semibold text-[#235849]">厨具、预算、菜系与做法</span>
              </summary>
              <div className="grid gap-7 pb-4 pt-5 md:grid-cols-2">
                <fieldset>
                  <legend className="font-semibold">手边可以用的厨具</legend>
                  <p className="mt-1 text-xs leading-5 text-stone-500">选中后，只留下这些厨具能完成的料理。</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tools.map((tool) => (
                      <Toggle
                        key={tool}
                        checked={criteria.availableTools?.includes(tool) ?? false}
                        label={getToolLabel(tool)}
                        onChange={() => toggle("availableTools", tool)}
                      />
                    ))}
                  </div>
                </fieldset>
                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <Select label="每份预算" onChange={(value) => setNumber("maxCost", value)} options={[10, 20, 30, 50]} suffix="元" value={criteria.maxCost} />
                  <label className="text-sm">
                    <span className="mb-1 block text-stone-600">偏好菜系</span>
                    <select
                      className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
                      onChange={(event) => setCriteria((current) => ({ ...current, preferredCuisine: event.target.value || undefined }))}
                      value={criteria.preferredCuisine ?? ""}
                    >
                      <option value="">无偏好</option>
                      {cuisines.map((cuisine) => <option key={cuisine.id} value={cuisine.id}>{cuisine.label}</option>)}
                    </select>
                  </label>
                  <fieldset className="sm:col-span-2">
                    <legend className="text-sm text-stone-600">偏好技法</legend>
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
                    <legend className="text-sm text-stone-600">今天想吃得怎样？</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cookingGoals
                        .filter((tag) => recipes.some((recipe) => getRecipeTagIds(recipe).includes(tag)))
                        .map((tag) => (
                          <Toggle
                            key={tag}
                            checked={criteria.preferredTags?.includes(tag) ?? false}
                            label={getTagLabel(tag)}
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
                <span>营养与用量</span>
                <span className="text-sm font-semibold text-[#235849]">需要时再看</span>
              </summary>
              <div className="grid gap-4 pb-4 pt-5 sm:grid-cols-2 lg:grid-cols-5">
                <Select label="热量上限/份" onChange={(value) => setNumber("maxCalories", value)} options={[400, 500, 600, 800]} suffix="kcal" value={criteria.maxCalories} />
                <Select label="最低蛋白质/份" onChange={(value) => setNumber("minProtein", value)} options={[20, 30, 40]} suffix="g" value={criteria.minProtein} />
                <Select label="用油上限/份" onChange={(value) => setNumber("maxOil", value)} options={[3, 5, 8]} suffix="g" value={criteria.maxOil} />
                <Select label="盐上限/份" onChange={(value) => setNumber("maxSalt", value)} options={[0.5, 1, 1.5]} suffix="g" value={criteria.maxSalt} />
                <Select label="添加糖上限/份" onChange={(value) => setNumber("maxAddedSugar", value)} options={[0, 5, 10]} suffix="g" value={criteria.maxAddedSugar} />
              </div>
            </details>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#a64631]">{active ? "为你排在前面" : "先从这些料理开始"}</p>
            <h3 className="mt-1 text-2xl font-bold text-stone-950 sm:text-3xl">这些更适合今晚</h3>
            <p className="mt-2 text-sm text-stone-500" aria-live="polite">目前有 {results.length} 道可以继续看看</p>
          </div>
          <button
            className="focus-ring min-h-11 px-2 text-sm font-bold text-[#235849] hover:underline disabled:cursor-not-allowed disabled:text-stone-400"
            disabled={!active}
            onClick={reset}
            type="button"
          >
            重新想想
          </button>
        </div>

        {activeSummary.length ? (
          <p className="mt-4 border-l-2 border-[#235849] pl-3 text-sm leading-6 text-stone-600">
            <span className="font-semibold text-stone-900">你刚才选了：</span>{activeSummary.join(" · ")}
          </p>
        ) : null}

        {visibleResults.length ? (
          <>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleResults.map((result) => <RecipeCard key={result.recipe.id} result={result} />)}
            </div>
            {results.length > visibleResults.length ? (
              <p className="mt-7 text-center text-sm text-stone-600">
                先看看最合适的几道。<Link className="focus-ring ml-1 font-bold text-[#235849] hover:underline" href="/recipes">再去发现更多</Link>
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-7 border border-dashed border-stone-400 bg-[#fbfaf6] px-6 py-14 text-center">
            <h3 className="text-2xl font-bold text-stone-950">暂时没找到正合适的</h3>
            <p className="mx-auto mt-3 max-w-lg leading-7 text-stone-600">不妨试试：{suggestions.join("、")}。</p>
            <button className="focus-ring mt-6 min-h-11 rounded-md bg-[#235849] px-5 font-semibold text-white hover:bg-[#173f35]" onClick={reset} type="button">
              重选一下
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
}: {
  label: string;
  value?: number;
  options: number[];
  suffix: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-stone-600">{label}</span>
      <select
        className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b94e35]"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ""}
      >
        <option value="">不限</option>
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

function summary(criteria: RecommendationCriteria, ingredients: Ingredient[]): string[] {
  const ingredientNames = new Map(ingredients.map((item) => [item.id, item.name]));
  return [
    ...(criteria.availableIngredients ?? []).map((id) => `已有${ingredientNames.get(id) ?? id}`),
    ...(criteria.availableTools ?? []).map((id) => `可用${getToolLabel(id)}`),
    ...(criteria.preferredTags ?? []).map((id) => `偏好${getTagLabel(id)}`),
    ...(criteria.preferredMethods ?? []).map((method) => `偏好${getTechniqueLabel(method)}`),
    ...(criteria.flavorPreferences ?? []).map((id) => `想吃${getFlavorPreferenceLabel(id)}`),
    criteria.maxTime !== undefined ? `${cookingTimeBands.find((band) => band.maxMinutes === criteria.maxTime)?.label["zh-CN"] ?? "约"}，${criteria.maxTime} 分钟内` : undefined,
    criteria.maxCalories !== undefined ? `≤ ${criteria.maxCalories} kcal/份` : undefined,
    criteria.minProtein !== undefined ? `≥ ${criteria.minProtein} g 蛋白质/份` : undefined,
    criteria.maxOil !== undefined ? `≤ ${criteria.maxOil} g 油/份` : undefined,
    criteria.maxSalt !== undefined ? `≤ ${criteria.maxSalt} g 盐/份` : undefined,
    criteria.maxAddedSugar !== undefined ? `≤ ${criteria.maxAddedSugar} g 添加糖/份` : undefined,
    criteria.maxCost !== undefined ? `≤ ¥${criteria.maxCost}/份` : undefined,
    criteria.preferredCuisine ? `偏好${getCuisineLabel(criteria.preferredCuisine)}` : undefined,
  ].filter((value): value is string => Boolean(value));
}
