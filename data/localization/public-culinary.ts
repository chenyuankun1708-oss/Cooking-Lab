import type { CulinaryItemCopy, PreparationStepCopy } from "@/types/culinary";
import type { SupportedLocale, TranslationSet } from "@/types/localization";
import { resolveReviewedTranslation } from "@/lib/localization";

interface CulinaryEditorialCopy extends CulinaryItemCopy {
  inputNotes?: Readonly<Record<string, string>>;
  steps?: PreparationStepCopy[];
  guidance?: string;
}

const en = (value: CulinaryEditorialCopy): TranslationSet<CulinaryEditorialCopy> => ({
  defaultLocale: "en",
  entries: [{ locale: "en", status: "reviewed", value }],
});

export const nativeCulinaryTranslations: Readonly<Record<string, TranslationSet<CulinaryEditorialCopy>>> = Object.freeze({
  "dongpo-pork": en({
    name: "Dongpo Pork",
    description: "Pork belly braised slowly until the fat is yielding, the lean meat still holds its shape, and the glossy sauce is rich without becoming too salty.",
    steps: [
      { instruction: "Start the whole pork belly in cold water. Once boiling, skim well and cook for 5 minutes. Remove, dry thoroughly, and cut into 4 cm cubes.", rationale: "Blanching clears blood proteins; drying limits splatter during browning.", stateCue: "The surface feels firm and the cut sides show no obvious blood." },
      { instruction: "In a dry frying pan, brown the skin and fatty sides of each cube to pale gold. Pour off excess rendered fat.", rationale: "Rendering some fat reduces heaviness and adds browned aroma.", stateCue: "The skin has tiny blisters and golden edges without blackening." },
      { instruction: "Melt the sugar over low heat in a heavy pot until amber. Add hot water, Shaoxing wine, soy sauce, ginger, scallions, and salt, then add the pork.", rationale: "Amber caramel adds color without bitterness; hot liquid reduces crystallization.", stateCue: "The liquid is evenly red-brown with no burnt smell." },
      { instruction: "Cover and keep at the faintest simmer for 85 minutes, turning twice. Add a little hot water if the liquid drops too quickly.", rationale: "Gentle heat softens connective tissue without breaking up the lean meat.", stateCue: "A chopstick enters the skin easily while each cube stays intact." },
      { instruction: "Uncover and reduce over medium heat for 8 to 10 minutes, spooning sauce over the pork. Rest off heat for 5 minutes when the sauce lightly coats a spoon.", rationale: "Late reduction concentrates the sauce without early oversalting; resting settles the glaze.", stateCue: "The sauce is glossy and slow-flowing, and the cubes lift without falling apart." },
    ],
  }),
  "tomyum-kung": en({
    name: "Tom Yum Kung",
    description: "Lemongrass, galangal, and makrut lime leaf build a bright broth; lime is added last so the shrimp stay tender and the acidity remains vivid.",
    steps: [
      { instruction: "Bruise and cut the lemongrass, thinly slice the galangal, tear the lime leaves, and lightly crush the chilies without mincing them.", rationale: "Breaking the surface releases aroma while larger pieces keep the heat manageable.", stateCue: "The aromatics smell clearly citrusy, gingery, and green." },
      { instruction: "Bring the water to a boil, add the aromatics, then simmer gently for 8 minutes.", rationale: "Extracting the aromatics first prevents the shrimp from overcooking while the broth develops.", stateCue: "Small bubbles continue and the aromatics remain intact." },
      { instruction: "Add mushrooms for 3 minutes, then add shrimp and fish sauce. Simmer about 2 minutes and turn off the heat as the shrimp curl into a C shape.", rationale: "Shrimp keep cooking in residual heat; a tight O shape usually signals overcooking.", stateCue: "The shrimp are opaque with just-white centers and the mushrooms remain springy." },
      { instruction: "Off heat, add lime juice in stages and adjust the sour-salty balance. Add cilantro in the bowls if using.", rationale: "Lime stays brighter and avoids cooked bitterness when added off heat.", stateCue: "Bright acidity arrives first, followed by savory heat." },
    ],
  }),
  "greek-village-salad": en({
    name: "Greek Village Salad",
    description: "Large, crisp pieces of tomato, cucumber, pepper, and olives, finished with feta and olive oil for savory richness.",
    steps: [
      { instruction: "Cut the tomatoes into large pieces, slice the cucumber thickly, cut the pepper into strips, and thinly slice the onion. Place everything in a wide bowl.", rationale: "Larger cuts shed less water and preserve each vegetable's texture.", stateCue: "The cut surfaces remain intact with little pooled juice." },
      { instruction: "Add the vinegar, salt, and half the olive oil. Turn gently twice and rest for 3 minutes.", rationale: "This draws out just enough tomato juice before the feta is added.", stateCue: "A little clear juice gathers while the vegetables remain crisp." },
      { instruction: "Set large pieces of feta and the olives on top, add oregano, and finish with the remaining oil. Serve immediately.", rationale: "Adding feta last preserves its shape and milky flavor.", stateCue: "The feta edges remain intact and the dressing only lightly coats the surface." },
    ],
  }),
  "mango-sticky-rice": en({
    name: "Mango Sticky Rice",
    description: "Steamed glutinous rice absorbs warm coconut milk, balanced by ripe mango and a small pinch of salt.",
    steps: [
      { instruction: "Rinse the glutinous rice until the water is fairly clear, soak in plenty of water for 4 hours, then drain thoroughly.", rationale: "A full soak is essential for even steaming and is included in total time.", stateCue: "The grains are swollen and can be pinched through without crumbling." },
      { instruction: "Spread the rice in a lined steamer and steam over boiling water for 25 minutes, loosening it once halfway through.", rationale: "Steam preserves both distinct grains and their characteristic stickiness.", stateCue: "The grains are translucent with no white core and clump without becoming wet." },
      { instruction: "While the rice steams, warm coconut milk, sugar, and salt over low heat until dissolved. Do not boil.", rationale: "Warm coconut milk absorbs readily; salt keeps the sweetness in balance.", stateCue: "The coconut milk is smooth with no separation." },
      { instruction: "Mix the hot rice with two-thirds of the coconut milk, cover, and rest for 20 minutes, turning once.", rationale: "Resting draws coconut milk into the grains instead of leaving a loose sauce.", stateCue: "The rice is glossy and plump with no obvious liquid underneath." },
      { instruction: "Peel and slice the mango. Plate it beside the rice and spoon over the remaining coconut milk.", rationale: "Preparing mango last limits oxidation and preserves the contrast in temperature and texture.", stateCue: "The mango is ripe yet holds its slices; the rice is supple, not hard." },
    ],
  }),
  tiramisu: en({
    name: "Tiramisu",
    description: "Coffee-soaked ladyfingers layered with mascarpone cream and chilled until soft and sliceable, with cocoa bitterness at the finish.",
    inputNotes: { egg: "yolks only" },
    steps: [
      { instruction: "Whisk egg yolks and sugar in a heatproof bowl over barely simmering water until the center reaches 71°C. Remove and whisk until thick and warm.", rationale: "Heating reduces raw-egg risk; keeping the bowl above the water prevents edge curdling.", stateCue: "The mixture is pale and a whisk trail disappears slowly." },
      { instruction: "Fold in mascarpone in three additions, mixing smooth each time without overworking it.", rationale: "Gradual mixing prevents lumps; overmixing can split the high-fat cheese.", stateCue: "The cream is smooth and holds a clear spatula trail." },
      { instruction: "Pour cooled espresso into a shallow dish. Dip each ladyfinger for 1 second per side and arrange a tight layer.", rationale: "A quick dip preserves enough structure to avoid a soggy layer after chilling.", stateCue: "The surface darkens but the biscuits lift intact without dripping." },
      { instruction: "Spread over half the cream, repeat the coffee biscuit and cream layers, smooth the top, and cover.", rationale: "Even layers distribute coffee and cream consistently in each slice.", stateCue: "The top is level with no loose liquid at the edges." },
      { instruction: "Chill for at least 6 hours. Dust with cocoa just before serving and wipe the knife between cuts.", rationale: "Chilling is required for structure and is included in total time; late cocoa dusting prevents damp clumps.", stateCue: "Layers are distinct and the cream is soft without flowing." },
    ],
  }),
  "apple-crumble": en({
    name: "Apple Crumble",
    description: "Tender apple pieces under a loose golden crumble, balancing warm cinnamon with tart-sweet fruit juices.",
    steps: [
      { instruction: "Heat the oven to 190°C. Core and cut the apples into 2 cm pieces; toss with half the sugar, cinnamon, salt, and lemon juice.", rationale: "Even pieces soften together, while acid and salt give sweetness more dimension.", stateCue: "The apples have a thin coating with little liquid in the bowl." },
      { instruction: "Mix flour, oats, and remaining sugar. Rub in cold butter until irregular coarse crumbs form.", rationale: "Pea-size butter pieces create a crisp, crumbly top rather than a hard sheet.", stateCue: "The mixture holds when pinched and falls apart when touched." },
      { instruction: "Spread the apples in a baking dish and scatter over the topping without pressing. Bake for 35 to 40 minutes.", rationale: "A loose layer lets hot air move through for even crisping.", stateCue: "The top is golden, juices bubble at the edge, and a knife enters the fruit easily." },
      { instruction: "Rest for 10 minutes before serving so the very hot juices settle.", rationale: "A short rest lets pectin and sugar thicken while the dessert stays warm.", stateCue: "Juice coats the apples and the crumble still has distinct pieces." },
    ],
  }),
  "longjing-green-tea": en({
    name: "Longjing Green Tea",
    description: "Lower-temperature water lets the flat young leaves open into a clear infusion with tender chestnut aroma and gentle sweetness.",
    steps: [
      { instruction: "Boil the water, then let it cool to about 80°C. Warm the cup with a little hot water and discard it.", rationale: "Cooler water limits harsh bitterness; warming the vessel steadies extraction.", stateCue: "The water is no longer rolling and the cup feels warm." },
      { instruction: "Add the Longjing leaves and pour in 300 ml water down the side of the cup rather than directly onto them.", rationale: "Gentle pouring wets the leaves evenly and makes their opening easier to observe.", stateCue: "Leaves begin to sink or float and the water turns pale yellow-green." },
      { instruction: "After about 2 minutes, decant completely. Shorten the next infusion if the tea tastes noticeably bitter.", rationale: "Separating liquor from leaves stops extraction and preserves freshness.", stateCue: "The tea is clear, lightly floral or chestnut-like, with brief bitterness and a clean finish." },
    ],
  }),
  "masala-chai": en({
    name: "Masala Chai",
    description: "Black tea, ginger, and whole spices simmered with water and milk for warmth, restrained sweetness, and a clear tea backbone.",
    steps: [
      { instruction: "Bruise the ginger, cardamom, and cloves. Bring them to a boil with cinnamon and water, then simmer for 5 minutes.", rationale: "Extracting spices in water releases aroma without forming a skin on milk.", stateCue: "Steam carries clear ginger, cardamom, and cinnamon aroma." },
      { instruction: "Add tea leaves for 2 minutes, then milk and sugar. Heat over medium until fine bubbles form at the edge, then lower the heat immediately.", rationale: "Water establishes the tea base; milk needs thorough heating, not a vigorous boil-over.", stateCue: "The liquid is evenly caramel-colored with rising fine bubbles." },
      { instruction: "Simmer 3 minutes, taste, then rest off heat for 1 minute before fine-straining into cups.", rationale: "Resting settles spices; brewing too long lets astringency dominate.", stateCue: "Tea and milk arrive first, followed by warm spice without a dry finish." },
    ],
  }),
  "moroccan-mint-tea": en({
    name: "Moroccan Mint Tea",
    description: "Gunpowder green tea gives structure while abundant fresh mint brings cooling aroma; sweetness can vary without hiding the tea.",
    steps: [
      { instruction: "Put the tea in a pot, add about 100 ml boiling water, swirl for 20 seconds, and discard this rinse.", rationale: "A quick rinse removes fine dust and begins opening the rolled leaves.", stateCue: "The rinse is slightly cloudy and the leaves are damp but not fully open." },
      { instruction: "Add mint, sugar, and the remaining boiling water. Cover for 4 minutes, taste a small cup, and adjust sugar if needed.", rationale: "Prolonged hard boiling dulls mint's cooling aroma.", stateCue: "The tea is golden, clearly minty, and not overwhelmed by sweetness." },
      { instruction: "Pour out one cup and return it to the pot twice, then pour into small glasses from a moderate height.", rationale: "Returning the tea mixes it without crushing mint and helps create a light foam.", stateCue: "Each cup has even color and sweetness with fine bubbles on top." },
    ],
  }),
  "lapsang-souchong": en({
    name: "Lapsang Souchong",
    description: "A distinctly smoky black tea brewed briefly enough to preserve wood, fruit, and sweetness rather than turning harsh.",
    steps: [
      { instruction: "Bring water to the boil. Warm the teapot, discard the water, and add the leaves.", rationale: "Black tea suits hotter water, and a warm vessel prevents a sharp temperature drop.", stateCue: "The pot is evenly warm and the dry leaves smell smoky without being acrid." },
      { instruction: "Add 300 ml boiling water, cover, and steep for 2 minutes 30 seconds.", rationale: "A short baseline can be adjusted to the tea and avoids stacking smoke with excess bitterness.", stateCue: "The infusion is bright red-amber with wood and fruit beyond the smoke." },
      { instruction: "Decant completely. If the cup feels drying, shorten the next infusion by 20 to 30 seconds.", rationale: "Complete decanting stops extraction; time is easier to control than dilution.", stateCue: "The tea has body without drying the tongue and leaves a little sweetness." },
    ],
  }),
  espresso: en({
    name: "Espresso",
    description: "A small coffee extracted quickly under pressure, aiming for distinct sweetness, acidity, and bitterness with concentrated texture but no burnt astringency.",
    steps: [
      { instruction: "Fully heat the machine and portafilter. Weigh 18 g freshly ground coffee, distribute evenly, and tamp level.", rationale: "An even bed matters more than tamping force and reduces fast channels.", stateCue: "The bed is level with no loose cracks at the edge." },
      { instruction: "Lock in and start extraction immediately, timing at the same moment. Use about 36 g in the cup as a first target.", rationale: "A fixed dose and yield create a repeatable baseline; adjust grind by taste rather than chasing one time.", stateCue: "Coffee flows continuously from deep brown to lighter tones without spraying." },
      { instruction: "Stir and taste while hot. Grind finer for sharp, fast shots and coarser for bitter, dripping shots.", rationale: "Stirring integrates the extraction; grind is the primary control for flow and flavor.", stateCue: "The cup is concentrated, sweet, sour, and bitter are distinct, and the finish is not drying." },
    ],
  }),
  "vietnamese-iced-coffee": en({
    name: "Vietnamese Iced Coffee",
    description: "Dark-roasted coffee drips through a phin onto sweetened condensed milk, then meets ice while keeping both roast bitterness and dairy sweetness vivid.",
    steps: [
      { instruction: "Put condensed milk in a heatproof glass. Add coffee to the phin, shake level, and set the press on top without packing it down.", rationale: "An even bed with open pathways drips steadily; over-compression can stall it.", stateCue: "The bed is level and the press sits in place but can still turn slightly." },
      { instruction: "Wet the grounds with about 20 ml water at 92 to 96°C and wait 30 seconds.", rationale: "Blooming releases gas so the remaining water flows more evenly.", stateCue: "All grounds darken and swell slightly with no dry islands." },
      { instruction: "Add the remaining hot water, cover, and let it drip through in 5 to 7 minutes. Grind finer if too fast or coarser if too slow.", rationale: "Drip time directly shows whether grind and resistance are aligned.", stateCue: "The flow slows from steady to intermittent and the coffee is concentrated but clear." },
      { instruction: "Stir the hot coffee into the condensed milk, pour over a glass full of ice, stir once more, and drink.", rationale: "Dissolving while hot prevents settling; plenty of ice cools quickly without excessive dilution.", stateCue: "The color is even, most ice remains, and roast bitterness balances dairy sweetness." },
    ],
  }),
  "hibiscus-agua-fresca": en({
    name: "Hibiscus Agua Fresca",
    description: "Dried hibiscus infuses a jewel-red tartness, chilled and balanced with lime and a modest amount of sugar.",
    steps: [
      { instruction: "Bring 500 ml water to the boil, turn off the heat, add dried hibiscus, and steep for 10 minutes.", rationale: "Off-heat steeping extracts color and acidity with less coarse astringency.", stateCue: "The liquid is deep ruby and smells cleanly tart and fruity." },
      { instruction: "Fine-strain, dissolve the sugar while warm, then add the remaining cold water.", rationale: "Warm liquid dissolves sugar quickly and dilution makes final strength easier to control.", stateCue: "No sugar remains at the bottom and the color is even and clear." },
      { instruction: "Refrigerate for 60 minutes until fully cold. Add lime juice just before serving and adjust to taste.", rationale: "Cold changes perceived acidity; late lime keeps its fresh aroma.", stateCue: "The drink is cold and tart without a puckering finish." },
      { instruction: "Add ice to each glass and pour in the hibiscus drink; do not leave heavily melting ice in the pitcher.", rationale: "Adding ice by the glass avoids diluting the whole batch.", stateCue: "The color stays vivid and the drink remains flavorful as the ice melts." },
    ],
  }),
  "salted-lassi": en({
    name: "Salted Lassi",
    description: "Plain yogurt, cold water, and salt blended to a light foam, with cumin for warm aroma in a refreshing, unsweetened drink.",
    steps: [
      { instruction: "Blend yogurt, cold water, salt, and half the cumin on low for 15 seconds.", rationale: "Low speed combines yogurt and water with fewer large bubbles and less splashing.", stateCue: "The liquid is even with no visible yogurt lumps." },
      { instruction: "Add ice and blend on high for 20 to 30 seconds until fine foam forms, then taste the salt and acidity.", rationale: "A short high-speed blend aerates without melting and diluting all the ice.", stateCue: "The drink pours smoothly under a layer of fine rather than large bubbles." },
      { instruction: "Pour immediately into chilled glasses and finish with the remaining cumin.", rationale: "Serving at once preserves both foam and chill.", stateCue: "The drink has not separated and cumin supports rather than hides the yogurt tang." },
    ],
  }),
  "fino-sherry": en({
    name: "Fino Sherry",
    description: "A pale, dry fortified wine style whose light body and nutty, yeasty aromas are shaped by biological ageing under flor.",
    guidance: "Store according to the producer's label. Chill to about 7 to 10°C before serving in clean small glasses. Reseal and refrigerate after opening and use promptly. This page makes no health claims or recommendation to increase consumption.",
  }),
  "junmai-sake": en({
    name: "Junmai Sake",
    description: "A sake category made from rice, koji, and water, with fermented grain aromas, gentle umami, and different serving possibilities across temperatures.",
    guidance: "Follow the producer's temperature guidance first. When none is given, begin slightly chilled in a small cup and notice how aromas change as it warms. Reseal and refrigerate after opening. Cultural context is not presented as a health benefit or encouragement to drink more.",
  }),
});

export function getLocalizedCulinaryCopy(id: string, locale: SupportedLocale): CulinaryEditorialCopy | undefined {
  if (locale === "zh-CN") return undefined;
  const translations = nativeCulinaryTranslations[id];
  return translations ? resolveReviewedTranslation(translations, locale)?.value : undefined;
}

export function hasCompleteNativeCulinaryTranslation(
  id: string,
  locale: SupportedLocale,
  expectedSteps: number,
  usesGuidance: boolean,
  inputNoteIds: readonly string[] = [],
): boolean {
  if (locale === "zh-CN") return true;
  const copy = getLocalizedCulinaryCopy(id, locale);
  if (!copy) return false;
  const hasInputNotes = inputNoteIds.every((ingredientId) => Boolean(copy.inputNotes?.[ingredientId]));
  return hasInputNotes && (usesGuidance ? Boolean(copy.guidance) : copy.steps?.length === expectedSteps);
}
