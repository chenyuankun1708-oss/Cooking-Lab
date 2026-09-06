import Link from "next/link";
import { RecipeImage } from "@/components/recipe-image";
import { recipeImages } from "@/data/recipe-images";
import { formatHumanCookingTime } from "@/lib/cooking-time";
import { describeFlavorProfile } from "@/lib/flavor";
import { formatCalories, formatProtein } from "@/lib/formatters";
import { getRecipeCuisineLabel, getRecipeOriginLabel, getRecipePrimaryTechniqueLabel } from "@/lib/taxonomy";
import { getRecipeHeroImage, getRecipeImageFallback } from "@/lib/recipe-images";
import type { RecommendationResult } from "@/types/recommendation";
import type { SupportedLocale } from "@/types/localization";
import { getLocalizedPath } from "@/lib/localization";
import { buildRecommendationExplanation } from "@/lib/recommendation-display";

export function RecipeCard({
  result,
  variant = "recommendation",
  locale,
  query,
}: {
  result: RecommendationResult;
  variant?: "recommendation" | "catalog";
  locale: SupportedLocale;
  query?: URLSearchParams | string;
}) {
  const { recipe, metrics } = result;
  const image = getRecipeHeroImage(recipe, recipeImages);
  const fallback = getRecipeImageFallback(recipe);
  const origin = getRecipeOriginLabel(recipe, locale);
  const cuisineAndTechnique = [origin ?? getRecipeCuisineLabel(recipe, locale), getRecipePrimaryTechniqueLabel(recipe, locale)].join(" · ");
  const flavor = describeFlavorProfile(recipe.flavor, locale, 2);
  const hasSpecificMatch = Object.keys(result.scoreBreakdown).length > 0;

  return (
    <article className="editorial-card group h-full min-w-0 pt-4">
      <Link
        aria-label={locale === "zh-CN" ? `查看 ${recipe.name}，${flavor}，${formatHumanCookingTime(recipe.cooking.totalTime, locale)}` : `View ${recipe.name}, ${flavor}, ${formatHumanCookingTime(recipe.cooking.totalTime, locale)}`}
        className="focus-ring flex h-full flex-col focus:outline-none"
        href={getLocalizedPath(locale, `/recipes/${recipe.slug}`, query)}
      >
        <RecipeImage image={image} fallbackInitial={fallback.initial} fallbackLabel={recipe.name} alt={recipe.name} variant="card" />
        <div className="flex flex-1 flex-col pb-6 pt-4">
          <p className="text-xs font-semibold text-[var(--tomato)]">{cuisineAndTechnique}</p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-stone-950 group-hover:underline">{recipe.name}</h3>
          {flavor ? <p className="mt-2 text-sm font-semibold text-stone-800">{flavor}</p> : null}
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{recipe.description}</p>

          {variant === "recommendation" && hasSpecificMatch ? (
            <p className="mt-4 border-l-2 border-[var(--tomato)] pl-3 text-sm leading-6 text-stone-600">
              {buildRecommendationExplanation(result, locale)}
            </p>
          ) : null}

          <div className="mt-auto pt-5">
            <p className="font-bold text-stone-900">{formatHumanCookingTime(recipe.cooking.totalTime, locale)}</p>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              {locale === "zh-CN" ? "每份" : "Per serving"} {formatCalories(metrics.caloriesPerServing, metrics.nutritionComplete, locale)} · {formatProtein(metrics.proteinPerServing, metrics.nutritionComplete, locale)} {locale === "zh-CN" ? "蛋白质" : "protein"}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
