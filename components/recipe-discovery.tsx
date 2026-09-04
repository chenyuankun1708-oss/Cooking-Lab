"use client";

import { useMemo, useState } from "react";
import { RecipeCard } from "./recipe-card";
import { getCuisineLabel, getTagLabel, getTechniqueLabel, getToolLabel } from "@/lib/display-labels";
import { buildRelaxationSuggestions, discoverRecipes, hasActiveCriteria, resetRecommendationCriteria } from "@/lib/recommendation";
import { getRecipeTagIds, listRecipeCuisineOptions, listRecipeTechniqueOptions } from "@/lib/taxonomy";
import type { Ingredient } from "@/types/ingredient";
import type { Recipe } from "@/types/recipe";
import type { RecommendationCriteria } from "@/types/recommendation";

const valuableTags = ["high-protein", "quick", "vegetable-rich", "one-pot", "no-added-sugar", "high-fiber"];
type ListKey = "availableIngredients" | "availableTools" | "preferredTags" | "preferredMethods";
type NumberKey = "maxTime" | "maxCalories" | "minProtein" | "maxOil" | "maxSalt" | "maxAddedSugar" | "maxCost";

export function RecipeDiscovery({ recipes, ingredients }: { recipes: Recipe[]; ingredients: Ingredient[] }) {
  const [criteria, setCriteria] = useState<RecommendationCriteria>(() => resetRecommendationCriteria());
  const [ingredientQuery, setIngredientQuery] = useState("");
  const results = useMemo(() => discoverRecipes(recipes, criteria), [recipes, criteria]);
  const tools = useMemo(() => [...new Set(recipes.flatMap((recipe) => recipe.tools))].sort(), [recipes]);
  const cuisines = useMemo(() => listRecipeCuisineOptions(recipes), [recipes]);
  const methods = useMemo(() => listRecipeTechniqueOptions(recipes), [recipes]);
  const shownIngredients = ingredients.filter((item) => `${item.name} ${item.aliases.join(" ")} ${item.id}`.toLowerCase().includes(ingredientQuery.trim().toLowerCase()));
  const reset = () => { setCriteria(resetRecommendationCriteria()); setIngredientQuery(""); };
  const toggle = (key: ListKey, value: string) => setCriteria((current) => {
    const values = current[key] ?? [];
    return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
  });
  const setNumber = (key: NumberKey, value: string) => setCriteria((current) => ({ ...current, [key]: value ? Number(value) : undefined }));
  const activeSummary = summary(criteria, ingredients);
  const suggestions = buildRelaxationSuggestions(criteria);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(17rem,21rem)_1fr]">
        <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-4" aria-labelledby="filter-title">
          <div className="flex items-center justify-between gap-3"><h2 id="filter-title" className="text-xl font-bold">我的料理条件</h2><button type="button" onClick={reset} disabled={!hasActiveCriteria(criteria)} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:text-stone-500">全部重置</button></div>
          <p className="mt-2 text-sm leading-6 text-stone-600">严格限制会排除不符合的料理；偏好只影响剩余料理的推荐顺序。</p>
          <div className="mt-5 space-y-6">
            <fieldset><legend className="font-semibold">严格限制</legend><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="最长时间" value={criteria.maxTime} options={[15, 30, 45, 60]} suffix="分钟" onChange={(v) => setNumber("maxTime", v)} />
              <Select label="热量上限/份" value={criteria.maxCalories} options={[400, 500, 600, 800]} suffix="kcal" onChange={(v) => setNumber("maxCalories", v)} />
              <Select label="最低蛋白质/份" value={criteria.minProtein} options={[20, 30, 40]} suffix="g" onChange={(v) => setNumber("minProtein", v)} />
              <Select label="用油上限/份" value={criteria.maxOil} options={[3, 5, 8]} suffix="g" onChange={(v) => setNumber("maxOil", v)} />
              <Select label="盐上限/份" value={criteria.maxSalt} options={[0.5, 1, 1.5]} suffix="g" onChange={(v) => setNumber("maxSalt", v)} />
              <Select label="添加糖上限/份" value={criteria.maxAddedSugar} options={[0, 5, 10]} suffix="g" onChange={(v) => setNumber("maxAddedSugar", v)} />
              <Select label="预算上限/份" value={criteria.maxCost} options={[10, 20, 30, 50]} suffix="元" onChange={(v) => setNumber("maxCost", v)} />
            </div></fieldset>

            <fieldset><legend className="font-semibold">我可使用的厨具</legend><p className="mt-1 text-xs leading-5 text-stone-500">选择实际可使用的完整厨具集合；缺少必要厨具的料理不会进入结果。</p><div className="mt-3 flex flex-wrap gap-2">{tools.map((tool) => <Toggle key={tool} label={getToolLabel(tool)} checked={criteria.availableTools?.includes(tool) ?? false} onChange={() => toggle("availableTools", tool)} />)}</div></fieldset>

            <fieldset><legend className="font-semibold">我已有的食材</legend><p className="mt-1 text-xs leading-5 text-stone-500">食材不是硬限制；系统会优先推荐核心食材缺得更少的料理。</p><label className="mt-3 block text-sm"><span className="sr-only">搜索食材</span><input type="search" value={ingredientQuery} onChange={(event) => setIngredientQuery(event.target.value)} placeholder="搜索 30 种食材" className="min-h-11 w-full rounded-xl border border-stone-300 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" /></label><div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-stone-200 p-2"><div className="flex flex-wrap gap-2">{shownIngredients.map((item) => <Toggle key={item.id} label={item.name} checked={criteria.availableIngredients?.includes(item.id) ?? false} onChange={() => toggle("availableIngredients", item.id)} />)}</div>{shownIngredients.length === 0 && <p className="p-2 text-sm text-stone-500">没有找到该食材</p>}</div></fieldset>

            <fieldset><legend className="font-semibold">料理偏好</legend><div className="mt-3 space-y-4"><label className="block text-sm"><span className="mb-1 block text-stone-600">偏好菜系</span><select value={criteria.preferredCuisine ?? ""} onChange={(event) => setCriteria((current) => ({ ...current, preferredCuisine: event.target.value || undefined }))} className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><option value="">无偏好</option>{cuisines.map((cuisine) => <option key={cuisine.id} value={cuisine.id}>{cuisine.label}</option>)}</select></label><div><p className="text-sm text-stone-600">偏好技法</p><div className="mt-2 flex flex-wrap gap-2">{methods.map((method) => <Toggle key={method.id} label={method.label} checked={criteria.preferredMethods?.includes(method.id) ?? false} onChange={() => toggle("preferredMethods", method.id)} />)}</div></div><div><p className="text-sm text-stone-600">偏好标签</p><div className="mt-2 flex flex-wrap gap-2">{valuableTags.filter((tag) => { const count = recipes.filter((recipe) => getRecipeTagIds(recipe).includes(tag)).length; return count > 0 && count < recipes.length; }).map((tag) => <Toggle key={tag} label={getTagLabel(tag)} checked={criteria.preferredTags?.includes(tag) ?? false} onChange={() => toggle("preferredTags", tag)} />)}</div></div></div></fieldset>
          </div>
        </aside>
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-emerald-700">即时决策结果</p><h2 className="mt-1 text-3xl font-bold" aria-live="polite">找到 {results.length} 道可推荐料理</h2></div><p className="text-sm text-stone-500">营养与价格均为 demo 估算</p></div>
          {activeSummary.length > 0 && <div className="mt-5 rounded-2xl bg-emerald-950 p-4 text-sm text-white"><span className="font-semibold">已启用 {activeSummary.length} 个条件：</span><span className="ml-2 leading-7 text-emerald-100">{activeSummary.join(" · ")}</span></div>}
          {results.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{results.map((result) => <RecipeCard key={result.recipe.id} result={result} />)}</div> : <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><h3 className="text-2xl font-bold">当前没有满足全部严格限制的料理</h3><p className="mx-auto mt-3 max-w-lg leading-7 text-stone-600">当前限制可能彼此冲突，可以尝试：{suggestions.join("、")}。</p><button type="button" onClick={reset} className="mt-6 min-h-11 rounded-xl bg-emerald-700 px-5 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">重置全部条件</button></div>}
        </div>
      </div>
    </section>
  );
}

function Select({ label, value, options, suffix, onChange }: { label: string; value?: number; options: number[]; suffix: string; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block text-stone-600">{label}</span><select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><option value="">不限</option>{options.map((option) => <option key={option} value={option}>{option} {suffix}</option>)}</select></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className={`cursor-pointer rounded-full border px-3 py-2 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-700 ${checked ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-emerald-600"}`}><input className="sr-only" type="checkbox" checked={checked} onChange={onChange} /><span aria-hidden="true">{checked ? "✓ " : "+ "}</span>{label}</label>;
}

function summary(criteria: RecommendationCriteria, ingredients: Ingredient[]): string[] {
  const ingredientNames = new Map(ingredients.map((item) => [item.id, item.name]));
  return [
    ...(criteria.availableIngredients ?? []).map((id) => `已有${ingredientNames.get(id) ?? id}`),
    ...(criteria.availableTools ?? []).map((id) => `可用${getToolLabel(id)}`),
    ...(criteria.preferredTags ?? []).map((id) => `偏好${getTagLabel(id)}`),
    ...(criteria.preferredMethods ?? []).map((method) => `偏好${getTechniqueLabel(method)}`),
    criteria.maxTime !== undefined ? `≤ ${criteria.maxTime} 分钟` : undefined,
    criteria.maxCalories !== undefined ? `≤ ${criteria.maxCalories} kcal/份` : undefined,
    criteria.minProtein !== undefined ? `≥ ${criteria.minProtein} g 蛋白质/份` : undefined,
    criteria.maxOil !== undefined ? `≤ ${criteria.maxOil} g 油/份` : undefined,
    criteria.maxSalt !== undefined ? `≤ ${criteria.maxSalt} g 盐/份` : undefined,
    criteria.maxAddedSugar !== undefined ? `≤ ${criteria.maxAddedSugar} g 添加糖/份` : undefined,
    criteria.maxCost !== undefined ? `≤ ¥${criteria.maxCost}/份` : undefined,
    criteria.preferredCuisine ? `偏好${getCuisineLabel(criteria.preferredCuisine)}` : undefined,
  ].filter((value): value is string => Boolean(value));
}
