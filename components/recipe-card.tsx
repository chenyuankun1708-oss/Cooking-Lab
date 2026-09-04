import Link from "next/link";
import { RecipeImage } from "@/components/recipe-image";
import { recipeImages } from "@/data/recipe-images";
import { formatHumanCookingTime } from "@/lib/cooking-time";
import { describeFlavorProfile } from "@/lib/flavor";
import { formatCalories, formatProtein } from "@/lib/formatters";
import { getRecipeCuisineLabel, getRecipeOriginLabel, getRecipePrimaryTechniqueLabel } from "@/lib/taxonomy";
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
  const flavor = describeFlavorProfile(recipe.flavor, "zh-CN", 2);
  const hasSpecificMatch = Object.keys(result.scoreBreakdown).length > 0;

  return (
    <article className="group h-full min-w-0 overflow-hidden rounded-lg border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_30px_rgba(41,37,31,0.09)]">
      <Link
        aria-label={`查看 ${recipe.name}，${flavor}，${formatHumanCookingTime(recipe.cooking.totalTime)}`}
        className="focus-ring flex h-full flex-col rounded-lg focus:outline-none"
        href={`/recipes/${recipe.slug}`}
      >
        <RecipeImage image={image} fallbackInitial={fallback.initial} fallbackLabel={fallback.label} variant="card" />
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="text-xs font-semibold text-[#a64631]">{cuisineAndTechnique}</p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-stone-950 group-hover:underline">{recipe.name}</h3>
          {flavor ? <p className="mt-2 text-sm font-semibold text-[#235849]">{flavor}</p> : null}
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{recipe.description}</p>

          {variant === "recommendation" && hasSpecificMatch ? (
            <p className="mt-4 border-l-2 border-[#e5bd53] pl-3 text-sm leading-6 text-stone-600">
              {result.explanation}
            </p>
          ) : null}

          <div className="mt-auto pt-5">
            <p className="font-bold text-stone-900">{formatHumanCookingTime(recipe.cooking.totalTime)}</p>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              每份约 {formatCalories(metrics.caloriesPerServing, metrics.nutritionComplete)} · {formatProtein(metrics.proteinPerServing, metrics.nutritionComplete)} 蛋白质
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
