import Link from "next/link";
import { RecipeImage } from "@/components/recipe-image";
import { recipeImages } from "@/data/recipe-images";
import { getToolLabel } from "@/lib/display-labels";
import { formatCalories, formatCost, formatGrams, formatPercent, formatProtein, formatTime } from "@/lib/formatters";
import { getRecipeCuisineLabel, getRecipeLegacyCategoryLabel, getRecipeOriginLabel, getRecipePrimaryTechniqueLabel } from "@/lib/taxonomy";
import { getRecipeHeroImage, getRecipeImageFallback } from "@/lib/recipe-images";
import type { RecommendationResult } from "@/types/recommendation";

export function RecipeCard({ result, variant = "recommendation" }: { result: RecommendationResult; variant?: "recommendation" | "catalog" }) {
  const { recipe, metrics } = result;
  const geographyLine = getRecipeOriginLabel(recipe);
  const image = getRecipeHeroImage(recipe, recipeImages);
  const fallback = getRecipeImageFallback(recipe);
  return (
    <article className="flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-emerald-700">
      <Link aria-label={`查看 ${recipe.name}`} className="mb-4 block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={`/recipes/${recipe.slug}`}>
        <RecipeImage image={image} fallbackInitial={fallback.initial} fallbackLabel={getRecipeCuisineLabel(recipe)} variant="card" />
      </Link>
      <div className="mb-4 flex items-center justify-between gap-3">
        {variant === "recommendation" ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{result.score}% 匹配</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">{getRecipePrimaryTechniqueLabel(recipe)}</span>}
        <span className="text-xs text-stone-500">{[geographyLine, getRecipeCuisineLabel(recipe), getRecipeLegacyCategoryLabel(recipe)].filter(Boolean).join(" · ")}</span>
      </div>
      <h2 className="text-xl font-semibold text-stone-900">
        <Link
          aria-label={`${recipe.name}详情`}
          className="rounded focus:outline-none"
          href={`/recipes/${recipe.slug}`}
        >
          {recipe.name}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{recipe.description}</p>
      <dl className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
        <Metric label="时间" value={formatTime(recipe.cooking.totalTime)} />
        <Metric label="热量/份" value={formatCalories(metrics.caloriesPerServing, metrics.nutritionComplete)} />
        <Metric label="蛋白质/份" value={formatProtein(metrics.proteinPerServing, metrics.nutritionComplete)} />
        <Metric label="用油/份" value={formatGrams(metrics.oilPerServing)} />
        <Metric label="成本/份" value={formatCost(metrics.costPerServing, metrics.costComplete)} />
        <Metric label="技法" value={getRecipePrimaryTechniqueLabel(recipe)} />
      </dl>
      <p className="mt-4 text-xs leading-5 text-stone-500"><span className="font-semibold text-stone-700">厨具：</span>{recipe.tools.map(getToolLabel).join("、")}</p>
      {variant === "recommendation" && <div className="mt-4 space-y-3">
        <p className="text-sm leading-6 text-stone-700"><span className="font-semibold">推荐说明：</span>{result.explanation}</p>
        {result.scoreBreakdown.ingredientFit && <div className="rounded-xl bg-stone-50 p-3 text-sm"><p className="font-semibold text-stone-800">食材匹配 {formatPercent(result.ingredientMatch.fit)} · 已有 {result.ingredientMatch.availableRequired}/{result.ingredientMatch.totalRequired}</p>{result.missingIngredients.length > 0 && <p className="mt-1 text-stone-600">还缺：{result.missingIngredients.map(({ name }) => name).join("、")}</p>}</div>}
        <div className="flex flex-wrap gap-2" aria-label="匹配理由">
          {(result.matchedConditions.length ? result.matchedConditions : ["满足当前全部严格限制"]).slice(0, 4).map((reason) => <span key={reason} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-900">✓ {reason}</span>)}
          {result.unmatchedConditions.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">△ {reason}</span>)}
        </div>
      </div>}
      <Link
        aria-label={`查看 ${recipe.name} 的做法与原理`}
        className="mt-auto pt-5 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
        href={`/recipes/${recipe.slug}`}
      >
        查看做法与原理 →
      </Link>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-stone-50 px-2 py-2"><dt className="text-[11px] text-stone-500">{label}</dt><dd className="mt-0.5 text-sm font-medium text-stone-800">{value}</dd></div>;
}
