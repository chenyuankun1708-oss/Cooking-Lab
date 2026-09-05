import type { SupportedLocale, TranslationSet } from "@/types/localization";
import type { Recipe } from "@/types/recipe";
import { resolveReviewedTranslation } from "@/lib/localization";

export interface RecipeEditorialCopy {
  name: string;
  description: string;
  steps: Array<{ instruction: string; why: string }>;
  principles: string[];
}

const en = (value: RecipeEditorialCopy): TranslationSet<RecipeEditorialCopy> => ({
  defaultLocale: "en",
  entries: [{ locale: "en", status: "reviewed", value }],
});

export const publishedRecipeTranslations: Readonly<Record<string, TranslationSet<RecipeEditorialCopy>>> = Object.freeze({
  "tomato-scrambled-eggs": en({
    name: "Tomato and Scrambled Eggs",
    description: "Cook the eggs and tomatoes in stages for tender curds and a naturally sweet-tart sauce.",
    steps: [
      { instruction: "Core the tomatoes and cut them into 2 cm pieces. Crack the eggs into a bowl, add a little salt, and beat until the whites and yolks are fully combined.", why: "Even tomato pieces release their juices at a similar rate; thoroughly mixed eggs set without patches of firm white." },
      { instruction: "Heat the pan, add the oil, then reduce to medium. Add the eggs and push them into large curds when the edges are set but the center still looks glossy. Transfer immediately.", why: "The eggs keep cooking off the heat. Removing them while still moist prevents them from drying out when they return to the pan." },
      { instruction: "Add the tomatoes and remaining salt to the same pan. Stir-fry over medium heat until the edges soften and red juices bubble steadily, then lower the heat.", why: "Salt helps the tomatoes release enough liquid to coat the eggs without adding water." },
      { instruction: "Return the eggs and fold gently for 20 to 30 seconds. Turn off the heat as soon as the curds are coated and no liquid egg remains.", why: "A brief final heating brings the flavors together without toughening the eggs in the tomato juices." },
    ],
    principles: ["Cook eggs and tomatoes in separate stages", "Use the tomatoes' own juices as the sauce"],
  }),
  "home-mapo-tofu": en({
    name: "Home-Style Mapo Tofu",
    description: "A weeknight version that keeps the core structure of chili bean paste, tofu, and minced pork at a gentler heat.",
    steps: [
      { instruction: "Cut the tofu into 2 cm cubes and soak it in lightly salted hot water for 5 minutes. Meanwhile, finely mince the pork, garlic, and scallions separately.", why: "Warm salted water firms the tofu surface so it is less likely to break; the soaking time is included in prep time." },
      { instruction: "Drain the tofu. Heat the pan, add the oil, and spread in the pork. Cook over medium heat until the moisture has evaporated, the meat separates into small pieces, and no pink remains.", why: "Cooking off the pork's moisture keeps it from diluting the chili bean paste and confirms the meat is done." },
      { instruction: "Reduce to low heat, add the chili bean paste and garlic, and stir until the oil turns red and fragrant. Add a splash of water if the pan becomes dry.", why: "Both the paste and garlic can turn bitter if scorched, so lower heat and the condition of the pan matter more than a fixed time." },
      { instruction: "Add about 150 ml water and the tofu. Gently shake the pan to settle the cubes, then braise at a quiet simmer for 5 to 6 minutes, nudging only lightly with a spatula.", why: "Gentle simmering seasons the tofu while protecting its shape." },
      { instruction: "When the liquid has reduced from watery to a light coating, taste and add the remaining salt only if needed. Scatter over the scallions and turn off the heat.", why: "Chili bean paste is already salty; seasoning after reduction lowers the risk of oversalting." },
    ],
    principles: ["Bloom the chili bean paste gently", "Handle tofu with minimal movement"],
  }),
  "sichuan-smashed-cucumber": en({
    name: "Sichuan Smashed Cucumber",
    description: "Craggy cucumber pieces dressed with garlic, vinegar, and a restrained amount of fresh chili.",
    steps: [
      { instruction: "Wash and dry the cucumber. Smack it with the flat of a cleaver until the skin splits but the flesh remains connected, then cut into bite-size pieces.", why: "The irregular surfaces hold dressing better while the large pieces remain crisp." },
      { instruction: "Toss with salt and rest for 5 minutes. Pour off the small amount of water in the bowl and gently blot the surface.", why: "A short salting removes surface moisture without softening the cucumber, so the dressing stays vivid." },
      { instruction: "Mince the garlic, slice the chili, and mix both with vinegar and soy sauce in an empty bowl. It should taste clearly tart and savory without being overly salty.", why: "Mixing the water-based seasonings first prevents concentrated pockets of salt or acid." },
      { instruction: "Just before serving, toss the cucumber quickly with the dressing. Add the oil last, toss a few more times, and serve once the broken surfaces are evenly coated.", why: "Last-minute dressing preserves crunch; adding oil after the vinegar and soy sauce helps aroma cling without blocking their contact with the cucumber." },
    ],
    principles: ["Create rough surfaces for the dressing", "Control free water to keep flavors concentrated"],
  }),
  "japanese-miso-tofu-soup": en({
    name: "Miso Tofu Soup",
    description: "Gently simmered tofu and mushrooms, with miso stirred in after the heat is turned off.",
    steps: [
      { instruction: "Cut the tofu into 2 cm cubes, slice the mushrooms, and finely slice the scallions. Set the miso aside in a small bowl.", why: "Even tofu cubes warm at the same rate; reserving the miso keeps you from breaking the tofu while dissolving it in the pot." },
      { instruction: "Add about 750 ml water and the mushrooms to a pot. Heat over medium until small bubbles gather steadily at the edge, then simmer gently until the mushrooms soften and smell savory.", why: "Small bubbles rather than a rolling boil extract flavor while keeping the liquid gentle enough for the tofu." },
      { instruction: "Add the tofu and keep the surface barely moving for 3 to 4 minutes. Turn off the heat when the centers are hot and the corners remain intact.", why: "Tofu needs gentle circulation, not vigorous boiling, to heat through without breaking." },
      { instruction: "Ladle some hot broth into the miso bowl and stir smooth, then return it to the pot. Taste, add scallions, and do not boil again.", why: "Tempering prevents lumps; adding miso off heat preserves its fermented aroma and keeps the broth from turning coarse." },
    ],
    principles: ["Keep the broth below a hard boil", "Add miso off the heat"],
  }),
  "korean-bibimbap-home": en({
    name: "Home-Style Bibimbap",
    description: "Beef, vegetables, egg, and gochujang arranged over rice, then mixed at the table.",
    steps: [
      { instruction: "Rinse the rice and start it in a rice cooker with your usual amount of water. While it cooks, slice the beef thinly across the grain, julienne the carrot, and slice the mushrooms.", why: "Starting the rice first lets prep and cooking overlap; slicing across the grain makes the beef easier to chew." },
      { instruction: "Wash and drain the spinach. With a little oil and salt, cook the carrot until bright but still crisp, then cook the mushrooms until most of their moisture has evaporated. Transfer each separately.", why: "Cooking vegetables in batches lets each reach the right texture without one turning watery while another overcooks." },
      { instruction: "Add the spinach to the same pan and stir-fry just until wilted but still vivid green. Transfer immediately, adding no more oil if the pan is already coated.", why: "Spinach changes quickly; removing it as soon as it wilts preserves color and tenderness." },
      { instruction: "Reheat the pan, spread in the beef, and leave it until the underside lightly browns before stirring. Add the remaining salt and cook until the thickest slice is no longer red inside.", why: "Sustained contact builds browned flavor, while checking the thickest slice is more reliable than surface color." },
      { instruction: "Add the remaining oil and fry the eggs over medium-low heat until the whites are fully set and lightly crisp at the edges. Cook the yolks to your preference.", why: "A fully set white is a clear safety and doneness cue while leaving room for different yolk preferences." },
      { instruction: "Divide the hot rice between bowls. Arrange the beef, vegetables, and eggs in sections and add the gochujang. Mix thoroughly from the bottom just before eating.", why: "Mixing at the table preserves each component's color and texture until the sauce is ready to coat the rice." },
    ],
    principles: ["Cook components in batches", "Season by mixing at the table"],
  }),
  "french-ratatouille": en({
    name: "Provençal Ratatouille",
    description: "Tomatoes, eggplant, and zucchini softened in stages into a deeply flavored vegetable stew.",
    steps: [
      { instruction: "Cut the tomatoes, eggplant, and zucchini into 2 cm pieces and slice the onion. Toss the eggplant with a little salt, rest for 10 minutes, then pat dry.", why: "Similar sizes cook evenly; the timed salting draws off surface moisture before the eggplant enters the pot." },
      { instruction: "Heat the oil over medium and cook the onion until translucent at the edges. Add the garlic for about 30 seconds, moving on as soon as it smells fragrant but has not browned.", why: "The onion needs time to develop sweetness; adding garlic later keeps it from scorching during the longer simmer." },
      { instruction: "Add the eggplant and zucchini and cook over medium heat until they shrink slightly and some cut surfaces turn pale golden.", why: "Early contact with hot oil releases moisture and concentrates the vegetables' flavor." },
      { instruction: "Add the tomatoes, lower the heat, and simmer uncovered for 20 to 25 minutes. Stir gently from the bottom until the vegetables are tender but still hold their shape.", why: "Uncovered simmering releases excess steam; gentle stirring prevents sticking without crushing softened vegetables." },
      { instruction: "When the juices lightly coat the vegetables, taste and adjust with the remaining salt. Turn off the heat and fold in the basil.", why: "The consistency is a better endpoint than a rigid clock; basil stays brighter when added off heat." },
    ],
    principles: ["Build flavor in stages", "Stew in the vegetables' own juices"],
  }),
  "italian-tomato-basil-pasta": en({
    name: "Tomato Basil Pasta",
    description: "A simple Italian-style sauce built from fresh tomatoes, garlic, and basil.",
    steps: [
      { instruction: "Bring a pot of water to the boil. While it heats, chop the tomatoes, thinly slice the garlic, and keep the basil leaves separate from the tender stems.", why: "Using the heating time for prep keeps the workflow moving; handling basil last protects its aroma." },
      { instruction: "Salt the boiling water lightly and add the pasta. Cook about 1 minute less than the package suggests. When only a fine white core remains, reserve 150 ml pasta water and drain.", why: "The pasta finishes in the sauce, so leaving it slightly firm prevents softness; starchy water helps the sauce cling." },
      { instruction: "Meanwhile, warm the oil in a frying pan over medium-low heat. Add the garlic and, as soon as the edges turn pale gold and smell fragrant, add the tomatoes and remaining salt.", why: "Garlic only needs to release its aroma; deep browning would make it bitter as the tomatoes cook." },
      { instruction: "Cook the tomatoes over medium heat, pressing them gently, until most have collapsed and the juices look glossy while a few pieces remain.", why: "Reading the tomatoes and liquid accounts for different water content while keeping the sauce fresh and textured." },
      { instruction: "Add the pasta and about 60 ml pasta water. Toss briskly until no liquid pools in the pan and a thin sauce coats every strand. Turn off the heat and add the basil.", why: "Movement emulsifies starch, oil, and tomato juices; adding basil off heat preserves its volatile aroma." },
    ],
    principles: ["Emulsify with pasta water", "Add basil off the heat"],
  }),
  "thai-basil-chicken": en({
    name: "Thai Basil Chicken",
    description: "Chicken, fresh chili, and basil cooked quickly over high heat.",
    steps: [
      { instruction: "Cut the chicken thighs into 1.5 cm pieces and pat dry. Mince the garlic, slice the chilies, pick the basil leaves, and mix the soy sauce and salt with 1 tablespoon water.", why: "Even pieces cook quickly; a dry surface browns better, and a premixed sauce avoids pauses over high heat." },
      { instruction: "Heat the pan thoroughly, add the oil, and spread the chicken in one layer. Leave it until the underside is lightly browned and the edges turn opaque, then stir-fry.", why: "Steady contact with the hot pan builds browned aroma and avoids releasing moisture through constant movement." },
      { instruction: "When most of the chicken has changed color, add the garlic and chilies. Stir until fragrant and check that the center of the thickest piece is no longer pink.", why: "Adding aromatics later keeps them from burning before the chicken is done; the thickest piece is the best doneness check." },
      { instruction: "Pour the sauce around the edge of the pan and toss until almost no liquid remains. Add the basil and turn off the heat as soon as the leaves wilt and smell fragrant.", why: "A quick reduction coats the chicken; residual heat is enough for basil, whose fresh aroma fades with prolonged cooking." },
    ],
    principles: ["Stir-fry over high heat", "Add fresh herbs last"],
  }),
  "vietnamese-beef-noodle-soup-home": en({
    name: "Home-Style Vietnamese Beef Noodle Soup",
    description: "A streamlined clear broth built with ginger, onion, herbs, and thinly sliced beef.",
    steps: [
      { instruction: "Add the rice noodles to boiling water and cook until flexible enough to bend naturally without turning mushy. Drain and divide among three bowls.", why: "Cooking the noodles first lets you reuse the pot. Texture, rather than a fixed minute count, works across different noodle widths." },
      { instruction: "While the water heats, slice the beef 2 mm thick across the grain. Thickly slice the onion, bruise the ginger, chop the scallions and cilantro, and cut the lime into wedges.", why: "Thin beef cooks in hot broth; preparing garnishes now keeps the finished soup from cooling while you chop." },
      { instruction: "Discard the noodle water and dry the pot. Toast the onion and ginger over medium heat until the cut surfaces lightly brown and smell fragrant, then add about 1.2 liters fresh water.", why: "Dry-toasting adds depth to the streamlined broth; fresh water prevents noodle starch from clouding it." },
      { instruction: "Bring to the boil, lower to a gentle simmer, and cook for about 15 minutes. Remove the onion and ginger, then add salt. The broth should taste light with clear ginger and onion aroma.", why: "A hard boil clouds the broth; gentle simmering extracts aroma, and seasoning after reduction matches the final volume." },
      { instruction: "Return the broth to a strong boil and add the beef in batches, loosening the slices. When the thickest slice is no longer raw red, pour beef and broth over the noodles. Finish with scallions, cilantro, and lime.", why: "Small batches restore the broth's heat quickly; checking the thickest slice avoids relying only on appearance, and lime stays bright when added at the table." },
    ],
    principles: ["Cook noodles separately from the broth", "Poach thin beef in very hot broth"],
  }),
  "lebanese-hummus-plate": en({
    name: "Lebanese-Style Hummus",
    description: "Cooked chickpeas, sesame paste, and lemon blended into a smooth mezze plate.",
    steps: [
      { instruction: "Drain the cooked chickpeas thoroughly, reserving a few for serving. Juice the lemon and chop the garlic.", why: "Using cooked chickpeas keeps the recipe within its stated time; draining them prevents an overly loose start." },
      { instruction: "Blend the sesame paste, lemon juice, garlic, and salt with about 30 ml cold water until smooth and slightly paler.", why: "Hydrating and acidifying the sesame paste first makes a finer, more stable base for the chickpeas." },
      { instruction: "Add the chickpeas and blend for 1 to 2 minutes, scraping down the sides. If the blades spin freely or the hummus clumps, add water 1 tablespoon at a time until smooth and slowly flowing.", why: "Gradual water additions account for variable moisture in cooked chickpeas and avoid an irreversible thin texture." },
      { instruction: "Taste and spoon onto a plate, making shallow swirls with the back of a spoon. Add the oil, cumin, and reserved chickpeas; the surface should hold the spoon marks.", why: "Visible spoon marks are a useful consistency cue, while oil and cumin release aroma just before eating." },
    ],
    principles: ["Drain cooked chickpeas thoroughly", "Add liquid gradually while blending"],
  }),
});

export function getLocalizedRecipe(recipe: Recipe, locale: SupportedLocale): Recipe | undefined {
  if (locale === "zh-CN") return recipe;
  const translations = publishedRecipeTranslations[recipe.slug];
  const copy = translations ? resolveReviewedTranslation(translations, locale)?.value : undefined;
  if (!copy || copy.steps.length !== recipe.steps.length) return undefined;
  return {
    ...recipe,
    name: copy.name,
    description: copy.description,
    steps: recipe.steps.map((step, index) => ({ ...step, ...copy.steps[index] })),
    principles: [...copy.principles],
    culture: undefined,
  };
}

export function getLocalizedRecipes(recipes: readonly Recipe[], locale: SupportedLocale): Recipe[] {
  return recipes.flatMap((recipe) => getLocalizedRecipe(recipe, locale) ?? []);
}

export function hasCompleteRecipeTranslation(recipe: Recipe, locale: SupportedLocale): boolean {
  if (locale === "zh-CN") return true;
  const translations = publishedRecipeTranslations[recipe.slug];
  const copy = translations ? resolveReviewedTranslation(translations, locale)?.value : undefined;
  return Boolean(copy && copy.steps.length === recipe.steps.length && copy.principles.length > 0);
}

export function getRecipeEditorialCopy(slug: string, locale: SupportedLocale): RecipeEditorialCopy | undefined {
  if (locale === "zh-CN") return undefined;
  const translations = publishedRecipeTranslations[slug];
  return translations ? resolveReviewedTranslation(translations, locale)?.value : undefined;
}
