import type { RecipeEditorialCopy } from "./public-recipes";
import type { TranslationSet } from "@/types/localization";

const en = (value: RecipeEditorialCopy): TranslationSet<RecipeEditorialCopy> => ({
  defaultLocale: "en",
  entries: [{ locale: "en", status: "reviewed", value }],
});

export const m9PublicRecipeTranslationsBatchA: Readonly<
  Record<string, TranslationSet<RecipeEditorialCopy>>
> = Object.freeze({
  "cantonese-ginger-scallion-fish": en({
    name: "Ginger and Scallion Steamed Fish",
    description: "White fish steamed gently, then finished with scallion, ginger, soy sauce, and warm oil.",
    steps: [
      { instruction: "Check the fillets for pin bones, pat them dry, and cut them into two pieces of similar thickness. Season evenly and cover with half the ginger.", why: "Similar thickness helps both pieces finish together. A dry surface keeps excess water from diluting the fish and seasoning." },
      { instruction: "Bring enough water in a steamer to a steady flow of steam. Add the fish plate and maintain stable medium heat without repeatedly lifting the lid.", why: "Starting over full steam is more reliable than timing from a cold pot. Opening the lid repeatedly causes large temperature drops." },
      { instruction: "Remove the fish as soon as the thickest part turns opaque and separates naturally when nudged with chopsticks.", why: "Easy flaking is a clear doneness cue. Continued steaming tightens the proteins and pushes out moisture." },
      { instruction: "Pour away excess liquid, add the remaining ginger and scallion, and drizzle over the soy sauce. Warm the oil until it flows freely, then spoon it evenly over the aromatics.", why: "Removing the cooking liquid keeps the finish clean. Warm oil releases aroma without needing to smoke." },
    ],
    principles: ["Maintain steady steam", "Judge doneness at the thickest point", "Release the aromatics at the end"],
  }),
  "cantonese-mushroom-steamed-chicken": en({
    name: "Steamed Chicken with Mushrooms",
    description: "A Cantonese home-style plate of chicken, mushrooms, ginger, and scallion cooked over steady steam.",
    steps: [
      { instruction: "Cut the chicken thighs into similar pieces and slice the mushrooms thickly. Toss the chicken with ginger, soy sauce, and salt, then rest for 10 minutes.", why: "Even pieces cook together. The short rest seasons the surface and is already included in the preparation time." },
      { instruction: "Arrange the chicken in one layer on a heatproof plate, placing the mushrooms between the pieces instead of building a tall pile.", why: "A single layer exposes the food evenly to steam. A thick pile leaves the pieces in the center heating too slowly." },
      { instruction: "Set the plate over a fully steaming pot and cook over medium heat until the center of the thickest chicken piece reaches 74°C / 165°F.", why: "A probe temperature is more reliable than meat color or clear juices. Stable steam avoids temperature swings." },
      { instruction: "Turn off the heat and rest for 2 minutes. Add the scallion and turn the chicken gently through the juices on the plate.", why: "The short rest evens out the internal temperature. Adding scallion last preserves its fresh aroma." },
    ],
    principles: ["Steam in one even layer", "Check the thickest chicken piece", "Finish with the cooking juices"],
  }),
  "hunan-chili-pork": en({
    name: "Hunan-Style Pork with Fresh Chilies",
    description: "Thin pork and fresh chilies stir-fried in stages to keep the pan hot and the chilies lively.",
    steps: [
      { instruction: "Slice the pork thinly across the grain. Cut and thoroughly dry the chilies, slice the garlic, and keep the soy sauce and salt within reach.", why: "Thin cross-grain slices cook quickly. Dry chilies produce less steam, and prepared seasoning prevents a pause over high heat." },
      { instruction: "Heat the pan well, add the oil, and spread in the pork. Leave it in contact with the pan until the edges brown, then stir-fry.", why: "Initial contact develops browned flavor. An overcrowded pan cools quickly and makes the pork release water." },
      { instruction: "When most pork has changed color, add the garlic and stir until fragrant but not deeply browned. Check that the thickest slice is no longer pink inside.", why: "Adding garlic later prevents burning. The thickest slice gives a more reliable doneness check than the surface alone." },
      { instruction: "Add the chilies and stir-fry until brighter and slightly softened at the edges. Pour the soy sauce around the pan, add salt, and remove from the heat when the liquid has evaporated.", why: "Late-added chilies stay crisp. Liquid seasoning at the end limits cooling and unwanted steaming." },
    ],
    principles: ["Keep the pan hot in stages", "Add garlic and chilies according to heat tolerance", "Evaporate the final seasoning quickly"],
  }),
  "yunnan-mushroom-chicken-stew": en({
    name: "Mushroom and Chicken Stew",
    description: "A home-style chicken stew with common cultivated mushrooms, with a clear emphasis on complete cooking and safe sourcing.",
    steps: [
      { instruction: "Cut the chicken thighs into similar pieces. Use only clearly identified edible cultivated mushrooms, brush them clean, and slice them thickly. Discard anything spoiled or uncertain.", why: "Even chicken pieces cook together. Misidentified wild mushrooms can be dangerous, so this recipe is not for foraged or uncertain mushrooms." },
      { instruction: "Cover the chicken with cold water in a pot and heat gradually. Skim the foam as it gathers, then add the ginger.", why: "Gradual heating helps impurities gather for a clearer broth. Add hot water if needed so the temperature does not fall sharply." },
      { instruction: "Add the mushrooms, bring back to the boil, then maintain a continuous gentle simmer until the thickest chicken piece reaches 74°C / 165°F.", why: "A gentle simmer transfers heat without breaking up the food. A probe temperature is more reliable than meat color." },
      { instruction: "Continue until the mushrooms are completely tender with no raw firmness. Season for the final broth volume, add scallion, and remove from the heat.", why: "Mushrooms need complete cooking and cannot be judged by color alone. Seasoning at the final concentration reduces oversalting." },
    ],
    principles: ["Use clearly identified edible mushrooms", "Cook both chicken and mushrooms completely", "Season for the final broth volume"],
  }),
  "northwest-cumin-lamb": en({
    name: "Cumin Lamb",
    description: "Thin lamb, onion, chili, and crushed cumin cooked quickly over high heat.",
    steps: [
      { instruction: "Slice the lamb thinly across the grain and pat it dry. Slice the onion and chili, then lightly crush the cumin.", why: "Cross-grain slices shorten the fibers and cook quickly. Crushed cumin releases aroma more readily in the pan." },
      { instruction: "Heat the pan well, add the oil, and sear the lamb in two batches. Let each batch brown underneath before stir-frying.", why: "Small batches preserve pan heat and limit released water. Browning adds roasted aroma, while the center still needs to cook through." },
      { instruction: "Return all the lamb to the pan, add the onion and chili, and stir-fry until the onion softens at the edges but stays crisp.", why: "Adding vegetables later protects their texture. If liquid gathers, let it evaporate before seasoning." },
      { instruction: "Add the cumin and salt, toss until the cumin smells fragrant, and remove from the heat immediately.", why: "Late seasoning limits scorching and preserves the volatile aroma of cumin." },
    ],
    principles: ["Slice thinly across the grain", "Cook in batches to preserve heat", "Add cumin near the end"],
  }),
  "chaoshan-fish-congee": en({
    name: "Home-Style Fish Congee",
    description: "A light congee with distinct rice grains and thin fish slices, inspired by southern Chinese fish porridge traditions.",
    steps: [
      { instruction: "Rinse the rice and add it to the pot with water. Check the fish for pin bones, slice it thinly across the grain, keep it chilled, and finely shred the ginger.", why: "Cold fish holds its quality while waiting. Even thin slices cook at the same rate during the final step." },
      { instruction: "Bring the rice and water to the boil, then lower to a gentle simmer. Stir occasionally from the bottom to prevent sticking.", why: "Gentle bubbling lets the grains absorb water without breaking down too quickly. Aggressive stirring makes the congee excessively pasty." },
      { instruction: "When the rice is tender but still distinct and the liquid has lightly thickened, add the ginger and salt and restore a steady simmer.", why: "The rice and liquid provide a better endpoint than the clock. Restoring heat shortens the fish's cooking time." },
      { instruction: "Add the fish in separate slices and nudge gently. Remove from the heat as soon as the thickest slice turns opaque and flakes naturally, then add scallion.", why: "Hot congee cooks thin fish quickly. Extended boiling tightens the fish and makes the congee too thick." },
    ],
    principles: ["Keep the rice grains distinct", "Keep the fish chilled until needed", "Cook thin fish briefly in the hot congee"],
  }),
  "japanese-oyakodon": en({
    name: "Oyakodon",
    description: "Chicken, onion, and softly set egg simmered in a light sauce and served over hot rice.",
    steps: [
      { instruction: "Cook the rice and keep it warm. Cut the chicken into 2 cm pieces, thinly slice the onion, and beat the eggs only enough to leave visible streaks of white.", why: "Having the rice ready lets the topping be served at once. Lightly mixed eggs keep more texture after setting." },
      { instruction: "Add the onion, soy sauce, and about 100 ml water to a small pan. Simmer over medium heat until the onion turns translucent.", why: "Cooking the onion first builds sweetness. Add a little hot water if the liquid reduces before the onion softens." },
      { instruction: "Add the chicken, lower the heat, and cover until the center of the thickest piece reaches 74°C / 165°F and a shallow layer of sauce remains.", why: "Gentle moist heat limits moisture loss. Confirm the chicken with a probe before adding egg so the egg does not overcook while the meat remains unsafe." },
      { instruction: "Pour in the egg in two additions, adding the second when the first has begun to set. Turn off the heat as the top stops flowing and slide everything over the rice.", why: "Two additions create varied texture. Residual heat continues cooking the egg, so an early stop keeps it tender." },
    ],
    principles: ["Confirm the chicken before adding egg", "Set the egg in two additions", "Keep a little sauce for the rice"],
  }),
  "japanese-miso-salmon": en({
    name: "Home-Style Miso Salmon",
    description: "A pan-cooked salmon fillet with a thin miso and ginger coating that is managed carefully to prevent scorching.",
    steps: [
      { instruction: "Check the salmon for pin bones and pat it dry. Mix the miso with ginger, spread a thin layer over the fish, and refrigerate for 10 minutes.", why: "A dry surface browns better. A thin coating adds flavor without leaving thick solids that burn quickly." },
      { instruction: "Scrape away any obvious piles of miso. Add oil to the pan and preheat over medium heat without letting it smoke.", why: "Removing excess paste reduces early scorching from sugars and proteins." },
      { instruction: "Place the flatter side of the salmon against the pan and leave it until the edge turns pale and the underside is golden, then turn it once.", why: "Minimal movement keeps the surface intact. Lower the heat immediately if the miso darkens too quickly." },
      { instruction: "Reduce to low heat and cook until the thickest part has just turned opaque and flakes easily. Rest off the heat for 2 minutes.", why: "Low heat finishes the center without burning the coating. Resting evens out the heat without drying the fish." },
    ],
    principles: ["Keep the miso coating thin", "Brown first and finish over low heat", "Judge doneness by easy flaking"],
  }),
  "korean-tofu-stew-home": en({
    name: "Home-Style Korean Tofu Stew",
    description: "A simplified gochujang broth with tofu, mushrooms, napa cabbage, egg, garlic, and scallion.",
    steps: [
      { instruction: "Cut the tofu into large pieces, slice the mushrooms, separate the cabbage stems from the leaves, and mince the garlic. Crack the egg into a small bowl.", why: "Large tofu pieces withstand simmering. Separating the cabbage controls texture, while cracking the egg separately makes shell fragments easier to catch." },
      { instruction: "Combine the gochujang, garlic, and about 650 ml water in a pot. Stir smooth before bringing it to the boil over medium heat.", why: "Dispersing the paste first prevents salty clumps. Check the bottom for any concentrated paste before heating." },
      { instruction: "Add the cabbage stems, mushrooms, and tofu. Lower to a gentle simmer and cook until the mushrooms are completely tender.", why: "Gentle bubbling transfers heat without breaking the tofu. Mushrooms need more than a surface color change to be done." },
      { instruction: "Add the cabbage leaves and scallion and cook just until wilted. Add the egg and keep the stew at a gentle simmer until the white is fully set, then taste and add salt only if needed.", why: "Late-added leaves keep more color and texture. A fully set white is a clear endpoint, and the salty gochujang means seasoning should wait until the final volume." },
    ],
    principles: ["Disperse the gochujang completely", "Add ingredients by cooking time", "Set the egg white fully", "Season only at the final volume"],
  }),
  "korean-glass-noodle-stir-fry": en({
    name: "Home-Style Japchae",
    description: "Glass noodles and vegetables cooked in separate stages, then brought together briefly with soy sauce.",
    steps: [
      { instruction: "Cook the noodles according to the package until flexible with some resilience. Cool immediately, drain thoroughly, and cut the vegetables into thin, even pieces.", why: "Cooling stops carryover cooking and reduces breaking or clumping when the noodles return to the pan." },
      { instruction: "Heat a little oil and cook the onion and carrot until softened at the edges. Add the mushrooms and cook until most released moisture has evaporated, then transfer.", why: "Cooking by moisture and timing preserves pan heat and prevents the vegetables from steaming each other." },
      { instruction: "Add the spinach to the same pan and stir-fry just until wilted but still vivid, then combine it with the other vegetables.", why: "Spinach changes quickly, so a separate short cooking stage stops it before excessive moisture loss." },
      { instruction: "Return the noodles to the pan, add soy sauce and salt, and toss briefly before adding all the vegetables. Remove from the heat when the noodles are evenly colored and no liquid remains.", why: "A short final heating coats the noodles without making them soft and sticky." },
    ],
    principles: ["Stop noodle carryover cooking", "Cook vegetables in separate stages", "Reheat the noodles only briefly"],
  }),
  "thai-green-papaya-salad": en({
    name: "Home-Style Green Papaya Salad",
    description: "A home-style salad of crisp green papaya, tomatoes, lime, fish sauce, chili, and roasted peanuts.",
    steps: [
      { instruction: "Peel and seed the green papaya, cut it and the carrot into even fine shreds, cut the tomatoes into small chunks, and roughly crush the peanuts.", why: "Even shreds absorb seasoning together. Keeping the tomatoes in chunks limits premature juice loss." },
      { instruction: "Finely chop the garlic and chili and mix them thoroughly with lime juice, fish sauce, and salt. The dressing should taste clearly tart and hot without being overly salty.", why: "Mixing first prevents concentrated hot spots. Fish sauce is already salty, so use salt only for a small final correction." },
      { instruction: "Just before serving, place the papaya, carrot, and tomatoes in a large bowl. Add the dressing and turn from the bottom with tongs until the shreds look evenly glossy.", why: "Last-minute dressing limits released water. Avoid crushing the shreds so they remain crisp." },
      { instruction: "Rest for 2 minutes, toss again, and taste. Drain a little liquid if a large pool has formed, then plate and scatter over the peanuts.", why: "A short rest lets the dressing reach the cut surfaces. Adding the peanuts last preserves their toasted aroma and crunch." },
    ],
    principles: ["Cut evenly for consistent seasoning", "Balance fish sauce before adding salt", "Add peanuts last for crunch"],
  }),
  "filipino-chicken-adobo-home": en({
    name: "Home-Style Filipino Chicken Adobo",
    description: "Chicken thighs braised with vinegar, soy sauce, garlic, and black pepper, then reduced to a light glaze.",
    steps: [
      { instruction: "Pat the chicken dry and cut it into similar pieces. Crush the garlic and measure the vinegar, soy sauce, and about 120 ml water.", why: "Dry, even pieces brown and finish together. Measured liquid is ready to cool the pan immediately after searing." },
      { instruction: "Heat the oil and brown the chicken in one uncrowded layer over medium heat, working in batches if needed.", why: "Browning builds flavor. An overcrowded pot makes the chicken release water instead of searing." },
      { instruction: "Add the garlic, black pepper, vinegar, soy sauce, and water. Bring to the boil, then cover and simmer until the center of the thickest piece reaches 74°C / 165°F.", why: "Gentle moist heat cooks and seasons the chicken. Confirm the safety endpoint with a probe and avoid prolonged hard boiling after adding vinegar." },
      { instruction: "Uncover and reduce over medium heat, turning gently, until the sauce lightly coats the chicken. Taste and add salt only if necessary.", why: "Open reduction concentrates the sauce. Soy sauce is already salty, so the final concentration must be tasted first." },
    ],
    principles: ["Brown before braising", "Check the thickest chicken piece", "Adjust salt only after reduction"],
  }),
});
