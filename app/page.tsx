import type { Metadata } from "next";
import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeDiscovery } from "@/components/recipe-discovery";
import { SiteFooter } from "@/components/site-footer";
import { ingredients } from "@/data/ingredients";
import { recipeImages } from "@/data/recipe-images";
import { recipes } from "@/data/recipes";
import { recommendationEngine } from "@/lib/recommendation";
import { listRecipeCuisineOptions, listRecipeTechniqueOptions } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "今晚，想吃点什么？",
};

const featuredSlugs = [
  "thai-basil-chicken",
  "tomato-scrambled-eggs",
  "french-ratatouille",
  "japanese-miso-tofu-soup",
] as const;

const featuredCuisineIds = ["chinese", "japanese", "korean", "thai", "vietnamese", "italian", "french", "fusion"] as const;
const featuredTechniqueIds = ["pan-fry", "stir-fry", "steam", "stew", "roast", "blanch", "boil", "cold-mix"] as const;

export default function Home() {
  const heroImage = recipeImages.find((image) => image.id === "italian-tomato-basil-pasta-hero");
  const featuredResults = featuredSlugs.flatMap((slug) => {
    const recipe = recipes.find((item) => item.slug === slug);
    return recipe ? recommendationEngine.rank([recipe], {}) : [];
  });
  const allCuisineOptions = listRecipeCuisineOptions(recipes);
  const allTechniqueOptions = listRecipeTechniqueOptions(recipes);
  const cuisineOptions = featuredCuisineIds.flatMap((id) => allCuisineOptions.find((option) => option.id === id) ?? []);
  const techniqueOptions = featuredTechniqueIds.flatMap((id) => allTechniqueOptions.find((option) => option.id === id) ?? []);

  return (
    <main id="main-content">
      <HomeHero image={heroImage} />

      <section className="py-14 sm:py-20" aria-labelledby="tonight-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#a64631]">今晚灵感</p>
              <h2 id="tonight-title" className="mt-2 text-3xl font-bold leading-tight text-stone-950 sm:text-5xl">
                从一桌有颜色的晚饭开始
              </h2>
              <p className="mt-4 leading-7 text-stone-600">
                有快炒、有热汤，也有可以慢慢炖出香气的蔬菜。先看见想吃的，再考虑今天的条件。
              </p>
            </div>
            <Link className="focus-ring min-h-11 py-3 text-sm font-bold text-[#235849] hover:underline" href="/recipes">
              看看今晚还有什么
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredResults.map((result) => <RecipeCard key={result.recipe.id} result={result} variant="catalog" />)}
          </div>
        </div>
      </section>

      <RecipeDiscovery recipes={recipes} ingredients={ingredients} />

      <section className="py-14 sm:py-20" aria-labelledby="world-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-[#a64631]">世界餐桌</p>
              <h2 id="world-title" className="mt-2 text-3xl font-bold leading-tight text-stone-950 sm:text-5xl">
                换一种熟悉食材的做法
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-stone-600">
                从熟悉的中式家常，到东南亚的酸香和欧洲的慢炖，顺着口味走进不同地方的餐桌。
              </p>
            </div>
            <ul className="grid border-t border-stone-300 sm:grid-cols-2">
              {cuisineOptions.map((cuisine) => (
                <li key={cuisine.id} className="border-b border-stone-300 sm:odd:pr-5 sm:even:pl-5">
                  <Link
                    className="focus-ring flex min-h-20 items-center justify-between gap-4 py-4 text-lg font-bold text-stone-900 hover:text-[#a64631]"
                    href={`/recipes?cuisine=${cuisine.id}`}
                  >
                    <span>{cuisine.label}</span>
                    <span className="text-sm font-medium text-stone-500">去看看</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="techniques" className="border-y border-stone-200 bg-[#173f35] py-14 text-white sm:py-20" aria-labelledby="technique-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-[#f4d98b]">从技法学习</p>
          <div className="mt-2 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 id="technique-title" className="text-3xl font-bold leading-tight sm:text-5xl">
                同一种火候，可以打开不同料理
              </h2>
            </div>
            <p className="max-w-2xl leading-7 text-white/76">
              从炒、煎、蒸、炖到冷拌，看看同一种做法如何改变香气、口感和一顿饭的样子。
            </p>
          </div>
          <div className="mt-9 grid grid-cols-2 border-l border-t border-white/25 sm:grid-cols-4">
            {techniqueOptions.map((technique) => (
              <Link
                key={technique.id}
                className="focus-ring min-h-24 border-b border-r border-white/25 p-4 hover:bg-white/10 sm:p-5"
                href={`/recipes?technique=${technique.id}`}
              >
                <span className="block text-xl font-bold">{technique.label}</span>
                <span className="mt-2 block text-sm text-white/65">顺着这种做法探索</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
