import { formatHumanCookingTime } from "./cooking-time";
import { describeFlavorProfile } from "./flavor";
import { getRecipeHeroImage } from "./recipe-images";
import type { HomeHeroEditorialItem } from "@/data/homepage";
import type { RecipeImage } from "@/types/image";
import type { Recipe } from "@/types/recipe";
import type { SupportedLocale } from "@/types/localization";
import { getLocalizedPath } from "./localization";

export interface HomeHeroItem {
  slug: string;
  name: string;
  editorialLine: string;
  flavor: string;
  time: string;
  href: string;
  image: RecipeImage;
}

export function buildHomeHeroItems(
  config: readonly HomeHeroEditorialItem[],
  publishedRecipes: readonly Recipe[],
  images: readonly RecipeImage[],
  locale: SupportedLocale = "zh-CN",
): HomeHeroItem[] {
  const recipeBySlug = new Map(publishedRecipes.map((recipe) => [recipe.slug, recipe]));
  const seenSlugs = new Set<string>();

  return config.map(({ slug, editorialLine }) => {
    if (seenSlugs.has(slug)) throw new Error(`Home hero recipe must be unique: ${slug}`);
    seenSlugs.add(slug);

    const recipe = recipeBySlug.get(slug);
    if (!recipe || recipe.publication.status !== "published") {
      throw new Error(`Home hero recipe must be published: ${slug}`);
    }

    const image = getRecipeHeroImage(recipe, images);
    if (!image) throw new Error(`Home hero recipe must have a valid hero image: ${slug}`);

    return {
      slug,
      name: recipe.name,
      editorialLine: editorialLine[locale],
      flavor: describeFlavorProfile(recipe.flavor, locale, 3),
      time: formatHumanCookingTime(recipe.cooking.totalTime, locale),
      href: getLocalizedPath(locale, `/recipes/${recipe.slug}`),
      image,
    };
  });
}
