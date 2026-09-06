import type { TranslationSet } from "@/types/localization";
import type { RecipeEditorialCopy } from "./public-recipes";

const en = (value: RecipeEditorialCopy): TranslationSet<RecipeEditorialCopy> => ({
  defaultLocale: "en",
  entries: [{ locale: "en", status: "reviewed", value }],
});

export const m9PublicRecipeTranslationsBatchB: Readonly<
  Record<string, TranslationSet<RecipeEditorialCopy>>
> = Object.freeze({
  "indonesian-chili-eggplant": en({
    name: "Balado-Inspired Eggplant",
    description:
      "A home-style version that pan-fries eggplant until tender, then briefly simmers it in a tomato, chili, and garlic sauce inspired by balado flavors.",
    steps: [
      {
        instruction:
          "Cut the eggplant into thick batons, toss with half the salt, and rest for 5 minutes. Pat the surfaces dry, then chop the tomatoes, chilies, and garlic separately.",
        why:
          "Brief salting and drying reduce surface steam. Keep the batons fairly thick so they do not fall apart when returned to the pan.",
      },
      {
        instruction:
          "Add half the oil to the pan and cook the eggplant in batches over medium heat until the cut sides are pale brown and the centers begin to soften. Transfer to a plate.",
        why:
          "Working in batches keeps the pan hot and helps the eggplant hold its shape. If the oil is not hot enough, the eggplant will absorb it without browning.",
      },
      {
        instruction:
          "Add the remaining oil. Cook the garlic and chilies just until fragrant, then add the tomatoes and simmer over medium-low heat until the flesh collapses and the juices thicken.",
        why:
          "Building the sauce before returning the eggplant reduces repeated stirring. Add the tomatoes before the garlic turns dark brown and bitter.",
      },
      {
        instruction:
          "Return the eggplant and fold it gently through the sauce. Cook over low heat until the sauce clings and the eggplant is fully tender, then adjust with the remaining salt and remove from the heat.",
        why:
          "A short final simmer seasons the eggplant without breaking it apart. Add a small splash of hot water if the bottom becomes dry before the eggplant is tender.",
      },
    ],
    principles: ["Pan-fry the eggplant before saucing", "Build the sauce before returning the eggplant", "Fold gently to preserve the pieces"],
  }),
  "malaysian-turmeric-chicken": en({
    name: "Home-Style Turmeric Chicken",
    description:
      "A home-style chicken stir-fry with turmeric, ginger, and garlic, designed around a thin spice coating and complete cooking.",
    steps: [
      {
        instruction:
          "Cut the chicken thighs into evenly sized pieces and pat them dry. Toss with the turmeric and salt, then mince the ginger and garlic and slice the onion.",
        why:
          "A dry surface and thin spice coating promote browning. Thick clumps of turmeric can scorch and taste bitter.",
      },
      {
        instruction:
          "Preheat the pan thoroughly, add the oil, and spread the chicken out. Leave the first side in contact with the pan until browned, then begin stir-frying.",
        why:
          "Sustained contact with the hot pan develops browning. If the chicken releases a lot of liquid, let that moisture evaporate instead of adding more oil.",
      },
      {
        instruction:
          "When most of the chicken has changed color, add the onion and cook until its edges turn translucent. Add the ginger and garlic and toss briefly.",
        why:
          "The onion needs more time than the ginger and garlic. Adding the aromatics later keeps them from burning before the chicken is done.",
      },
      {
        instruction:
          "Continue stir-frying over medium heat until the center of the thickest chicken piece is no longer pink and the turmeric smells fragrant without any burnt odor. Remove from the heat immediately.",
        why:
          "The thickest piece is the most reliable doneness check. Reduce the heat if the spices darken too quickly.",
      },
    ],
    principles: ["Use a thin, even spice coating", "Brown the chicken before adding aromatics", "Check the thickest piece for doneness"],
  }),
  "singapore-chicken-rice-home": en({
    name: "One-Pot Home-Style Chicken Rice",
    description:
      "A simplified home version that cooks chicken thighs and ginger-scallion rice together, not a replacement for traditional separately prepared chicken rice.",
    steps: [
      {
        instruction:
          "Rinse and drain the rice. Slash the thickest parts of the chicken thighs and season them evenly with salt. Slice the ginger, cut the scallions into lengths, and chill the sliced cucumber.",
        why:
          "More even chicken thickness helps the meat and rice finish together. Keeping the cucumber cold preserves its crisp contrast at serving time.",
      },
      {
        instruction:
          "Put the rice and your usual amount of cooking water in the rice cooker. Stir in the ginger, scallions, and oil, then arrange the chicken thighs in a single layer on top.",
        why:
          "Chicken on the upper layer receives steady steam without directly interfering with the cooker's temperature sensing at the bottom.",
      },
      {
        instruction:
          "Run the standard rice program. When it finishes, keep the lid closed and let the cooker stand for another 8 minutes.",
        why:
          "The full program and covered rest work together to finish the chicken center and balance moisture in the rice. Opening the lid early releases needed steam.",
      },
      {
        instruction:
          "Open the lid and check that the center of the thickest chicken piece is no longer pink and its juices run clear. Remove and slice the chicken, fluff the rice, and serve with the cucumber.",
        why:
          "Confirm the chicken is fully cooked before serving. If the center is still underdone, heat the chicken separately rather than repeatedly steaming the entire pot of rice.",
      },
    ],
    principles: ["Use even thickness for one-pot cooking", "Keep the covered rest after the rice cycle", "Check the thickest part of the chicken"],
  }),
  "indian-masoor-dal": en({
    name: "Masoor Dal",
    description: "Red lentils, tomatoes, and warm spices simmered into a gently thickened soup.",
    steps: [
      {
        instruction:
          "Rinse the red lentils repeatedly until the water is mostly clear, checking for and removing any debris. Dice the onion and tomatoes and mince the ginger and garlic.",
        why:
          "Rinsing removes surface dust. Small vegetable pieces soften into the soup while the lentils cook.",
      },
      {
        instruction:
          "Heat the oil over medium-low and cook the onion until the edges turn translucent. Add the ginger, garlic, cumin, and turmeric and stir until fragrant.",
        why:
          "Brief contact with warm oil releases the spices' aroma. Reduce the heat immediately if the garlic or spices begin to turn dark brown.",
      },
      {
        instruction:
          "Add the tomatoes and cook until their flesh collapses. Add the lentils and about 900 ml water, bring to a boil, then reduce to a gentle simmer.",
        why:
          "Softening the tomatoes first builds the base. Once the lentils are in the pot, gentle bubbling lowers the risk of sticking.",
      },
      {
        instruction:
          "Stir from the bottom occasionally and cook until the lentils are completely soft and the soup thickens naturally. Season for the final consistency, adding hot water if it becomes too thick.",
        why:
          "Red lentil starch continues to thicken the soup, so flow and texture are more reliable endpoint cues than a fixed time alone.",
      },
    ],
    principles: ["Bloom spices gently in oil", "Maintain a gentle simmer to prevent sticking", "Judge doneness by softness and consistency"],
  }),
  "indian-chana-masala-home": en({
    name: "Home-Style Chana Masala",
    description:
      "A home-style stew of cooked chickpeas, tomatoes, and warm spices that starts with already cooked beans to keep the total time realistic.",
    steps: [
      {
        instruction:
          "Drain the cooked chickpeas. Finely chop the onion, mince the ginger and garlic, cut the tomatoes into small pieces, and measure the spices before heating the pan.",
        why:
          "Starting with clearly cooked chickpeas keeps the recipe within its stated time. Measuring the spices first prevents delays while the pan is hot.",
      },
      {
        instruction:
          "Heat the oil over medium-low and cook the onion until golden at the edges. Add the ginger, garlic, cumin, turmeric, and garam masala and stir briefly.",
        why:
          "Softening the onion first develops sweetness. The spices need only a short heating, so lower the heat if their color deepens quickly.",
      },
      {
        instruction:
          "Add the tomatoes and a small splash of water. Cook until the tomatoes collapse and the mixture no longer looks separated, then add the chickpeas.",
        why:
          "A cohesive, thick tomato base coats the chickpeas evenly. Add a little hot water if the bottom dries before the tomatoes soften.",
      },
      {
        instruction:
          "Simmer over low heat until the sauce clings to the chickpeas. Lightly crush a small portion of the beans to thicken the sauce, then adjust the salt.",
        why:
          "Crushing only a few chickpeas thickens the dish while preserving texture. Season after reduction to reduce the risk of oversalting.",
      },
    ],
    principles: ["Start with clearly cooked chickpeas", "Build a cohesive tomato-spice base", "Season after the sauce has reduced"],
  }),
  "lebanese-mujadara": en({
    name: "Home-Style Mujadara",
    description: "A simplified home version of lentils and rice topped with deeply golden onions.",
    steps: [
      {
        instruction:
          "Rinse the lentils and simmer them until the outsides are tender but the centers remain slightly firm. While they cook, slice the onions into evenly thin pieces.",
        why:
          "Partially cooking the lentils lets them finish with the rice. Even onion slices are less likely to burn in patches.",
      },
      {
        instruction:
          "Heat the oil in a second pot and cook the onions over medium heat, stirring often, until most are deep golden rather than dark brown. Remove and reserve half.",
        why:
          "Slow moisture loss creates sweetness. Blackened edges taste bitter, so lower the heat once the onions reach deep gold.",
      },
      {
        instruction:
          "Add the rice, partially cooked lentils, cumin, salt, and enough hot water to the onions left in the pot. Bring to a boil, then cover and reduce to low heat.",
        why:
          "Hot water prevents a sharp temperature drop. Excess liquid will make the rice and lentils soft and pasty.",
      },
      {
        instruction:
          "Cook until both the rice and lentils are tender and no free water remains at the bottom. Turn off the heat, rest covered for 8 minutes, fluff gently, and top with the reserved onions.",
        why:
          "The covered rest redistributes moisture through the rice. If water remains, continue over low heat instead of stirring the grains into a paste.",
      },
    ],
    principles: ["Partially cook lentils before combining with rice", "Stop the onions at deep gold", "Rest off the heat to balance moisture"],
  }),
  "spanish-potato-omelet": en({
    name: "Home-Style Spanish Potato Omelet",
    description: "A thick potato, onion, and egg omelet adapted for a modest amount of oil in a home kitchen.",
    steps: [
      {
        instruction:
          "Slice the potatoes into evenly thin rounds, slice the onion, and beat the eggs with the salt.",
        why:
          "Even potato slices soften at the same rate. Preparing the eggs now prevents the cooked potatoes from cooling while you work.",
      },
      {
        instruction:
          "Add the oil to a frying pan and cook the potatoes and onion, covered, over low heat. Turn gently from time to time until a chopstick passes through the potatoes easily but the slices still hold together.",
        why:
          "Low heat and trapped steam help a modest amount of oil soften the potatoes. High heat can brown the outsides while leaving the centers firm.",
      },
      {
        instruction:
          "Drain off excess oil, combine the potatoes and onion with the eggs, and rest for 2 minutes. Pour into a lightly oiled pan and cook over low heat until the edges are set.",
        why:
          "The short rest lets egg reach the spaces between potato slices. Moving the omelet before the edges set can make it break apart.",
      },
      {
        instruction:
          "Cover the pan with a large plate, invert it steadily, and slide the omelet back into the pan. Cook the second side until no liquid egg remains in the center, then remove and rest.",
        why:
          "A plate gives the thick omelet stable support. Use a clean plate after handling raw egg to avoid cross-contamination.",
      },
    ],
    principles: ["Soften potatoes over low heat", "Let egg settle between the potato layers", "Use a plate for a controlled turn"],
  }),
  "spanish-chickpea-spinach": en({
    name: "Spanish-Style Chickpeas with Spinach",
    description: "Cooked chickpeas and spinach in a warm tomato, garlic, and paprika sauce.",
    steps: [
      {
        instruction:
          "Drain the cooked chickpeas, wash and thoroughly dry the spinach, chop the tomatoes, and thinly slice the garlic.",
        why:
          "Cooked chickpeas can go straight into the pan. Removing surface water from both the beans and spinach keeps the finished sauce from becoming thin.",
      },
      {
        instruction:
          "Heat the oil over medium-low and cook the garlic until its edges are pale gold. Immediately add the paprika and tomatoes.",
        why:
          "Garlic and paprika both turn bitter when scorched. Add the tomatoes at once if either begins to darken quickly.",
      },
      {
        instruction:
          "Cook until the tomatoes collapse and the juices thicken, then add the chickpeas and simmer over low heat until they are evenly coated.",
        why:
          "Concentrating the tomato base before adding the beans builds a coating sauce without prolonged cooking.",
      },
      {
        instruction:
          "Add the spinach in batches and turn it through the chickpeas just until wilted. Season and remove from the heat when a thin sauce remains but no water pools at the bottom.",
        why:
          "Adding spinach last preserves more color and texture. Working in batches keeps the pan hot and limits excess liquid.",
      },
    ],
    principles: ["Keep garlic and paprika from scorching", "Concentrate the tomato base first", "Add spinach in batches at the end"],
  }),
  "french-lentil-soup": en({
    name: "French-Style Lentil Soup",
    description: "Lentils, tomatoes, and evenly diced vegetables simmered into a simple home-style soup.",
    steps: [
      {
        instruction:
          "Rinse the lentils and check for debris. Dice the carrot, onion, and tomatoes into similarly sized pieces and mince the garlic.",
        why:
          "Even vegetable pieces soften alongside the lentils. Rinsing removes surface dust from the dry lentils.",
      },
      {
        instruction:
          "Heat the oil over medium and cook the onion and carrot until their edges soften. Add the garlic and cook only until fragrant.",
        why:
          "Softening the vegetables first develops a sweeter base. Move on before the garlic turns dark brown and bitter.",
      },
      {
        instruction:
          "Add the tomatoes, lentils, oregano, and about 1 liter water. Bring to a boil, then reduce the heat so the surface bubbles gently.",
        why:
          "A gentle simmer hydrates the lentils evenly. Vigorous boiling increases the chance of sticking at the bottom.",
      },
      {
        instruction:
          "Stir from the bottom occasionally and cook until the lentils are tender but still hold their shape. Season at the end and add hot water if the soup becomes too thick.",
        why:
          "Lentil age and variety affect cooking time, so texture and soup consistency are better endpoint cues than the clock alone.",
      },
    ],
    principles: ["Soften the vegetables before simmering", "Maintain gentle bubbling", "Judge doneness by lentil texture"],
  }),
  "greek-lemon-oregano-chicken": en({
    name: "Greek-Inspired Lemon Oregano Chicken Skewers",
    description:
      "Home-style grill-pan chicken skewers flavored with lemon, oregano, and garlic, inspired by a common Greek flavor combination.",
    steps: [
      {
        instruction:
          "Cut the chicken thighs into even 3 cm pieces. Pat dry and coat with oil, salt, garlic, and oregano, keeping the lemon for the end.",
        why:
          "Even pieces finish cooking together. Adding a large amount of lemon juice now would wet the surface and interfere with browning.",
      },
      {
        instruction:
          "Thread the chicken snugly but without compressing it, leaving a small gap between pieces. Preheat the grill pan until a drop of water evaporates immediately.",
        why:
          "Small gaps let heat reach the sides and keep the pieces from squeezing moisture onto each other.",
      },
      {
        instruction:
          "Add the skewers and leave them in place until the contact side has clear brown marks. Turn to brown each side, then reduce to medium-low until the thickest piece is no longer pink.",
        why:
          "Stable contact builds browned flavor on each side. Lower heat then finishes the center without burning the surface.",
      },
      {
        instruction:
          "Rest the skewers off the heat for 3 minutes, squeeze over the lemon juice, and turn them lightly through the juices on the plate.",
        why:
          "Resting balances heat and juices through the meat. Adding lemon at the end preserves its bright aroma.",
      },
    ],
    principles: ["Cut the pieces evenly", "Brown each side before lowering the heat", "Add lemon after cooking"],
  }),
  "mexican-black-bean-tacos": en({
    name: "Home-Style Black Bean Tacos",
    description:
      "A modern home-style combination of black beans, tomatoes, and crisp vegetables in corn tortillas, without claiming a single traditional regional recipe.",
    steps: [
      {
        instruction:
          "Drain the cooked black beans thoroughly. Dice the tomatoes and onion, finely shred the cabbage, chop the cilantro, and cut the lime into wedges.",
        why:
          "Clearly cooked beans keep the recipe within its stated time. Thorough draining prevents a wet filling from softening the tortillas too quickly.",
      },
      {
        instruction:
          "Add the beans, tomatoes, onion, and cumin to a pot. Cook over medium-low heat until the tomatoes collapse and no liquid pools at the bottom.",
        why:
          "A moist filling that does not run keeps the tortillas intact. Add only a small splash of hot water if the mixture dries before the tomatoes soften.",
      },
      {
        instruction:
          "Lightly crush about one quarter of the beans with a spatula, add the salt, and stir until the filling is cohesive enough to mound.",
        why:
          "Crushing a small portion thickens the filling naturally while preserving most of the beans' texture.",
      },
      {
        instruction:
          "Warm the corn tortillas one at a time until flexible and lightly fragrant. Fill immediately with the beans, cabbage, and cilantro, then squeeze over lime just before eating.",
        why:
          "Warm tortillas bend without cracking. Adding the crisp vegetables and acid at the end preserves their texture and bright flavor.",
      },
    ],
    principles: ["Start with clearly cooked black beans", "Reduce the filling until it does not run", "Assemble the warm and crisp components at serving time"],
  }),
  "huevos-rancheros-home": en({
    name: "Home-Style Huevos Rancheros",
    description: "A home-style breakfast of thick tomato and black bean sauce, fried eggs, and warm corn tortillas.",
    steps: [
      {
        instruction:
          "Drain the cooked black beans and chop the tomatoes, onion, and chili. Crack each egg into a separate small bowl and remove any shell fragments.",
        why:
          "Cooked beans can go straight into the pan. Cracking eggs into bowls makes shell removal easier and reduces mistakes over a hot pan.",
      },
      {
        instruction:
          "Heat a little oil and cook the onion and chili until softened. Add the tomatoes and beans and simmer over medium-low heat until the sauce is thick.",
        why:
          "Building and reducing the sauce first controls its moisture. A thin sauce will quickly make the tortillas soggy.",
      },
      {
        instruction:
          "Move the sauce to one side of the pan, add the remaining oil, and fry the eggs until the whites are fully set. Continue cooking the yolks to your preference.",
        why:
          "Separating the components keeps the sauce from drying out. Fully set whites provide a clear doneness cue.",
      },
      {
        instruction:
          "Warm the corn tortillas one at a time until flexible. Spoon over the thick bean sauce, add the fried eggs, and serve immediately.",
        why:
          "Last-minute assembly preserves the tortillas' texture and the eggs' heat. Keep utensils that touched raw egg away from the finished plate.",
      },
    ],
    principles: ["Reduce the sauce before frying the eggs", "Cook eggs and sauce in separate zones", "Assemble only after warming the tortillas"],
  }),
});
