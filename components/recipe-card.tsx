import Link from "next/link";
import { RecipeImage } from "@/components/recipe-image";
import { recipeImages } from "@/data/recipe-images";
import { formatCalories, formatCost, formatGrams, formatProtein, formatTime } from "@/lib/formatters";
import {
  getRecipeCuisineLabel,
  getRecipeOriginLabel,
  getRecipePrimaryTechniqueLabel,
} from "@/lib/taxonomy";
import { getRecipeHeroImage, getRecipeImageFallback } from "@/lib/recipe-images";
import type { RecommendationResult } from "@/types/recommendation";

export function RecipeCard({
  result,
  variant = "recommendation",
}: {
  result: RecommendationResult;
  variant?: "recommendation" | "catalog";
}) {
  const { recipe, metrics } = result;
  const image = getRecipeHeroImage(recipe, recipeImages);
  const fallback = getRecipeImageFallback(recipe);
  const origin = getRecipeOriginLabel(recipe);
  const cuisineAndTechnique = [origin ?? getRecipeCuisineLabel(recipe), getRecipePrimaryTechniqueLabel(recipe)].join(" · ");
  const hasSpecificMatch = result.matchedConditions.length > 0 || Object.keys(result.scoreBreakdown).length > 0;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_30px_rgba(41,37,31,0.09)] focus-within:ring-2 focus-within:ring-[#b94e35]">
      <Link aria-label={`查看 ${recipe.name}`} className="block focus:outline-none" href={`/recipes/${recipe.slug}`}>
        <RecipeImage image={image} fallbackInitial={fallback.initial} fallbackLabel={fallback.label} variant="card" />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold text-[#a64631]">{cuisineAndTechnique}</p>
        <h3 className="mt-2 text-xl font-bold leading-snug text-stone-950">
          <Link className="focus:outline-none group-hover:underline" href={`/recipes/${recipe.slug}`}>
            {recipe.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{recipe.description}</p>

        {variant === "recommendation" ? (
          <div className="mt-4 border-l-2 border-[#e5bd53] pl-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-stone-900">为什么适合你</p>
              {hasSpecificMatch ? <span className="text-xs text-stone-500">匹配度 {result.score}%</span> : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-stone-600">{result.explanation}</p>
          </div>
        ) : null}

        <dl className="mt-5 grid grid-cols-3 border-y border-stone-200 py-3 text-left">
          <Metric label="时间" value={formatTime(recipe.cooking.totalTime)} />
          <Metric label="热量/份" value={formatCalories(metrics.caloriesPerServing, metrics.nutritionComplete)} />
          <Metric label="蛋白质/份" value={formatProtein(metrics.proteinPerServing, metrics.nutritionComplete)} />
        </dl>
        <p className="mt-3 text-xs leading-5 text-stone-500">
          每份预计 {formatCost(metrics.costPerServing, metrics.costComplete).replace("预计 ", "")} · 用油 {formatGrams(metrics.oilPerServing)}
        </p>
        <Link className="focus-ring mt-auto inline-flex min-h-11 items-end pt-5 text-sm font-bold text-[#235849] hover:underline" href={`/recipes/${recipe.slug}`}>
          查看做法与原理
        </Link>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-stone-200 px-2 first:pl-0 last:border-r-0 last:pr-0">
      <dt className="text-[11px] leading-4 text-stone-500">{label}</dt>
      <dd className="mt-1 break-words text-xs font-semibold leading-5 text-stone-800">{value}</dd>
    </div>
  );
}
