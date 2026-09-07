import { createContentVersion } from "@/lib/content-version";
import {
  createGameArtifactSetVersion,
  createGameRecipeArtifactVersion,
  deriveGameEquivalenceClassKeys,
  deriveMinimumGamePublishingRisk,
} from "@/lib/game-recipe-validation";
import { gameOperationCatalog } from "@/game-data/operation-catalog";
import { emptyNutrition, type Nutrition } from "@/types/nutrition";
import type { CulinaryItemType, Evidence, Source } from "@/types/culinary";
import type { ContentArtifact, RightsAssessment, UsageDecision } from "@/types/content-rights";
import type {
  GameIngredientCatalogV1,
  GameIngredientPortionV1,
  GameNutritionDatasetSubsetV1,
  GameOperationId,
  GameOperationNodeV1,
  GameRecipeScenarioV1,
  GameRecipeV1,
  GameRightsRegistryV1,
  GameTargetStateV1,
} from "@/types/game-recipe";
import type { PublishingRiskClassification } from "@/types/publishing-governance";
import type { ResearchRecord } from "@/types/research";

export const m13CorpusGeneratorVersion = "m13-formula-corpus-v1";
export const m13PolicyVersion = "m12-game-publishing-v1";
export const m13ReviewAttestationIds = [
  "m13-500-review-rights-license",
  "m13-500-review-provenance",
  "m13-500-review-factual-culinary",
  "m13-500-review-editorial",
  "m13-500-review-visual-image-na",
] as const;
export const m13SamplingBatchId = "m13-500-sampling-qa-1";

const accessedAt = "2026-09-08";
const reviewDueAt = "2027-09-08";

type PortionSpec = { ingredientId: string; massG: number; phase: string; optional?: boolean };
type RecipeFamily = "grain-bowl" | "dessert" | "tea" | "coffee" | "fruit-drink";

const dishBases = ["usda-white-rice", "usda-brown-rice", "usda-pasta-dry", "usda-rice-noodle-dry"] as const;
const dishPrimaries = ["usda-tofu", "usda-black-bean", "usda-chickpea", "usda-mushroom", "usda-lentil-dry"] as const;
const dishVegetables = [
  "usda-tomato", "usda-broccoli", "usda-cauliflower", "usda-red-pepper", "usda-spinach",
  "usda-potato", "usda-sweet-potato", "usda-zucchini", "usda-eggplant", "usda-cabbage",
  "usda-bok-choy", "usda-asparagus", "usda-carrot",
] as const;
const fruits = [
  "usda-mango", "usda-pineapple", "usda-apple", "usda-banana", "usda-orange",
  "usda-watermelon", "usda-strawberry", "usda-blueberry", "usda-pear", "usda-raspberry",
] as const;
const dessertFormats = [
  "almond-oat-bake", "walnut-oat-bake", "almond-yogurt-cup", "walnut-yogurt-cup",
  "almond-coconut-pudding", "walnut-coconut-pudding", "almond-fruit-crumble",
  "walnut-fruit-crumble", "honey-cinnamon-bake", "vanilla-yogurt-chill",
] as const;
const teaBases = ["usda-black-tea-brewed", "usda-green-tea-brewed"] as const;
const teaAdditions = [
  "usda-lemon-juice", "usda-orange", "usda-apple", "usda-mango", "usda-pineapple",
  "usda-strawberry", "usda-ginger", "usda-cinnamon", "usda-honey", "usda-basil",
] as const;
const milkTeaAdditions = ["usda-ginger", "usda-cinnamon", "usda-honey", "usda-basil", "usda-vanilla"] as const;
const coffeeBases = ["usda-coffee-brewed", "usda-espresso"] as const;
const coffeeAdditions = [
  "usda-whole-milk", "usda-cocoa", "usda-cinnamon", "usda-vanilla", "usda-honey",
  "usda-sugar", "usda-coconut-milk", "usda-butter", "usda-salt", "usda-lemon-juice",
] as const;
const coffeeModes = ["hot", "cold"] as const;
const drinkAccents = ["usda-lemon-juice", "usda-ginger", "usda-basil"] as const;
const drinkModes = ["infused", "blended"] as const;

export interface GeneratedM13Corpus {
  recipes: GameRecipeV1[];
  ingredients: GameIngredientCatalogV1;
  rightsRegistry: GameRightsRegistryV1;
}

export function createM13DraftCorpus(
  subset: GameNutritionDatasetSubsetV1,
  migrationIngredients: GameIngredientCatalogV1,
): GeneratedM13Corpus {
  const ingredients = createGameIngredientCatalogFromUsdaSubset(subset, migrationIngredients);
  const ingredientById = new Map(ingredients.ingredients.map((ingredient) => [ingredient.ingredientId, ingredient]));
  const recipes: GameRecipeV1[] = [];
  let sequence = 0;

  for (const base of dishBases) for (const primary of dishPrimaries) for (const vegetable of dishVegetables) {
    sequence += 1;
    recipes.push(createRecipe({
      sequence,
      recipeId: `game-bowl-${shortId(base)}-${shortId(primary)}-${shortId(vegetable)}`,
      itemType: "dish",
      family: "grain-bowl",
      servings: 4,
      portions: dishPortions(base, primary, vegetable),
      nodes: dishNodes,
      ingredientById,
    }));
  }
  for (const fruit of fruits) for (const format of dessertFormats) {
    sequence += 1;
    recipes.push(createRecipe({
      sequence,
      recipeId: `game-dessert-${shortId(fruit)}-${format}`,
      itemType: "dessert",
      family: "dessert",
      servings: 4,
      portions: dessertPortions(fruit, format),
      nodes: (recipeId, portions) => dessertNodes(recipeId, portions, format),
      ingredientById,
    }));
  }
  for (const tea of teaBases) for (const addition of teaAdditions) for (const mode of ["hot", "cold"] as const) {
    sequence += 1;
    recipes.push(createRecipe({
      sequence,
      recipeId: `game-tea-${shortId(tea)}-${shortId(addition)}-${mode}`,
      itemType: "tea",
      family: "tea",
      servings: 2,
      yieldUnit: "g",
      portions: beveragePortions(tea, addition),
      nodes: (recipeId, portions) => beverageNodes(recipeId, portions, mode === "cold" ? "chill" : "rest", mode === "hot"),
      ingredientById,
    }));
  }
  for (const tea of teaBases) for (const addition of milkTeaAdditions) {
    sequence += 1;
    recipes.push(createRecipe({
      sequence,
      recipeId: `game-tea-${shortId(tea)}-${shortId(addition)}-milk`,
      itemType: "tea",
      family: "tea",
      servings: 2,
      yieldUnit: "g",
      portions: beveragePortions(tea, addition, "usda-whole-milk"),
      nodes: (recipeId, portions) => beverageNodes(recipeId, portions, "mix", false),
      ingredientById,
    }));
  }
  for (const coffee of coffeeBases) for (const addition of coffeeAdditions) for (const mode of coffeeModes) {
    sequence += 1;
    recipes.push(createRecipe({
      sequence,
      recipeId: `game-coffee-${shortId(coffee)}-${shortId(addition)}-${mode}`,
      itemType: "coffee",
      family: "coffee",
      servings: 2,
      yieldUnit: "g",
      portions: beveragePortions(coffee, addition),
      nodes: (recipeId, portions) => beverageNodes(recipeId, portions, mode === "cold" ? "chill" : "mix", mode === "hot"),
      ingredientById,
    }));
  }
  for (const fruit of fruits) for (const accent of drinkAccents) for (const mode of drinkModes) {
    sequence += 1;
    recipes.push(createRecipe({
      sequence,
      recipeId: `game-drink-${shortId(fruit)}-${shortId(accent)}-${mode}`,
      itemType: "non-alcoholic-drink",
      family: "fruit-drink",
      servings: 4,
      yieldUnit: "g",
      portions: fruitDrinkPortions(fruit, accent),
      nodes: (recipeId, portions) => beverageNodes(recipeId, portions, mode === "blended" ? "blend" : "rest", false),
      ingredientById,
    }));
  }
  if (recipes.length !== 510) throw new Error(`M13 corpus size drifted: ${recipes.length}`);
  const rightsRegistry = createRightsRegistry(recipes, ingredients, subset);
  return { recipes, ingredients, rightsRegistry };
}

export function createGameIngredientCatalogFromUsdaSubset(
  subset: GameNutritionDatasetSubsetV1,
  migrationIngredients: GameIngredientCatalogV1,
): GameIngredientCatalogV1 {
  const usdaIngredients: GameIngredientCatalogV1["ingredients"] = subset.records.map((record) => {
    const state = inferIngredientState(record.ingredientId);
    const density = inferDensity(record.ingredientId);
    return {
      ingredientId: record.ingredientId,
      defaultState: state,
      ...(density ? { densityGPerMl: density } : {}),
      unitWeightsG: density ? { ml: density } : {},
      nutritionPer100g: record.nutritionPer100g,
      nutritionProvenanceId: `usda-fdc:${record.fdcId}:${record.datasetVersion}`,
      nutritionSource: {
        kind: "dataset",
        datasetId: "usda-fooddata-central",
        datasetVersion: record.datasetVersion,
        fdcId: record.fdcId,
        sourceDescription: record.sourceDescription,
        accessedAt: record.accessedAt,
      },
    };
  });
  return {
    schemaVersion: "cooking-lab-game-ingredients-v1",
    catalogVersion: createContentVersion({ migration: migrationIngredients.catalogVersion, usda: subset.records }),
    ingredients: [...migrationIngredients.ingredients, ...usdaIngredients].sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
  };
}

function createRecipe(input: {
  sequence: number;
  recipeId: string;
  itemType: CulinaryItemType;
  family: RecipeFamily;
  servings: number;
  yieldUnit?: "serving" | "piece" | "ml" | "g";
  yieldAmount?: number;
  portions: PortionSpec[];
  nodes: (recipeId: string, portions: readonly GameIngredientPortionV1[]) => GameOperationNodeV1[];
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>;
}): GameRecipeV1 {
  const artifactIds = requiredKinds.map((kind) => `game-artifact-${input.recipeId}-${kind}`);
  const portions = input.portions.map((portion, index): GameIngredientPortionV1 => {
    const ingredient = requiredIngredient(input.ingredientById, portion.ingredientId);
    const density = ingredient.densityGPerMl;
    return {
      portionId: `${input.recipeId}-portion-${String(index + 1).padStart(2, "0")}`,
      ingredientId: portion.ingredientId,
      initialState: ingredient.defaultState,
      massG: portion.massG,
      ...(density ? { volumeMl: round(portion.massG / density) } : {}),
      optional: portion.optional ?? false,
      phase: portion.phase,
      nutritionProvenanceId: ingredient.nutritionProvenanceId,
    };
  });
  const nodes = input.nodes(input.recipeId, portions);
  const draft: GameRecipeV1 = {
    schemaVersion: "cooking-lab-game-recipe-v1",
    artifactVersion: "",
    recipeId: input.recipeId,
    slug: input.recipeId,
    itemType: input.itemType,
    eligibility: "draft",
    simulationProfile: nodes.every((node) => ["slice", "dice", "mince", "add", "set-heat", "pan-fry", "stir", "toss", "season", "serve"].includes(node.operationType))
      ? "cat-kitchen-goal1-v1"
      : "requires-cat-kitchen-v2",
    servings: input.servings,
    yield: {
      amount: input.yieldAmount ?? (input.yieldUnit === "g" ? round(portions.reduce((sum, portion) => sum + portion.massG, 0)) : input.servings),
      unit: input.yieldUnit ?? "serving",
    },
    ingredientPortions: portions,
    operationGraph: { nodes },
    nutritionProfile: createNutritionProfile(portions, input.servings, input.ingredientById),
    scenarios: [],
    rights: {
      artifactIds,
      usageDecisionIds: artifactIds.map((id) => id.replace("game-artifact-", "game-usage-")),
      sourceIds: sourceIdsFor(input.itemType),
      evidenceIds: evidenceIdsFor(input.itemType),
      intendedUse: "game-commercial-ready",
    },
    governance: {
      riskLevel: "low",
      riskClassificationId: `game-risk-${input.recipeId}`,
      reviewAttestationIds: [],
    },
    authoring: {
      method: "deterministic-source-normalization",
      generatorVersion: m13CorpusGeneratorVersion,
      containsGeneratedExpression: false,
      unresolvedMappings: [],
    },
  };
  draft.scenarios = createScenarios(draft, input.sequence);
  draft.artifactVersion = createGameRecipeArtifactVersion(draft);
  draft.scenarios = draft.scenarios.map((scenario) => ({ ...scenario, baselineArtifactVersion: draft.artifactVersion }));
  return draft;
}

const requiredKinds = ["identity", "preparation", "nutrition", "simulation"] as const;

function dishPortions(base: string, primary: string, vegetable: string): PortionSpec[] {
  return [
    { ingredientId: base, massG: 240, phase: "base" },
    { ingredientId: "usda-water", massG: baseCookingWater(base), phase: "base-cooking-water" },
    { ingredientId: primary, massG: primary === "usda-lentil-dry" ? 180 : 300, phase: "primary" },
    ...(primary === "usda-lentil-dry" ? [{ ingredientId: "usda-water", massG: 540, phase: "primary-cooking-water" }] : []),
    { ingredientId: vegetable, massG: 320, phase: "vegetable" },
    ...(["usda-potato", "usda-sweet-potato"].includes(vegetable) ? [{ ingredientId: "usda-water", massG: 640, phase: "vegetable-cooking-water" }] : []),
    { ingredientId: "usda-onion", massG: 100, phase: "aromatic" },
    { ingredientId: "usda-garlic", massG: 12, phase: "aromatic" },
    { ingredientId: "usda-canola-oil", massG: 20, phase: "cooking" },
    { ingredientId: "usda-soy-sauce", massG: 20, phase: "seasoning" },
    { ingredientId: "usda-vinegar", massG: 12, phase: "seasoning" },
    { ingredientId: "usda-salt", massG: 3, phase: "seasoning" },
  ];
}

function baseCookingWater(ingredientId: string): number {
  if (ingredientId === "usda-brown-rice") return 480;
  if (ingredientId === "usda-white-rice") return 360;
  if (ingredientId === "usda-pasta-dry") return 1_200;
  return 900;
}

function baseCookDuration(ingredientId: string): number {
  if (ingredientId === "usda-brown-rice") return 35 * 60_000;
  if (ingredientId === "usda-white-rice") return 18 * 60_000;
  if (ingredientId === "usda-pasta-dry") return 10 * 60_000;
  return 6 * 60_000;
}

function substitutionFor(ingredientId: string): string | undefined {
  const substitutions: Readonly<Record<string, string>> = {
    "usda-white-rice": "usda-brown-rice",
    "usda-brown-rice": "usda-white-rice",
    "usda-pasta-dry": "usda-rice-noodle-dry",
    "usda-rice-noodle-dry": "usda-pasta-dry",
    "usda-canola-oil": "usda-olive-oil",
    "usda-olive-oil": "usda-canola-oil",
    "usda-almond": "usda-walnut",
    "usda-walnut": "usda-almond",
    "usda-black-bean": "usda-chickpea",
    "usda-chickpea": "usda-black-bean",
    "usda-whole-milk": "usda-coconut-milk",
    "usda-coconut-milk": "usda-whole-milk",
    "usda-black-tea-brewed": "usda-green-tea-brewed",
    "usda-green-tea-brewed": "usda-black-tea-brewed",
    "usda-coffee-brewed": "usda-espresso",
    "usda-espresso": "usda-coffee-brewed",
    "usda-mango": "usda-pineapple",
    "usda-pineapple": "usda-mango",
    "usda-apple": "usda-pear",
    "usda-pear": "usda-apple",
    "usda-banana": "usda-strawberry",
    "usda-strawberry": "usda-banana",
    "usda-orange": "usda-watermelon",
    "usda-watermelon": "usda-orange",
    "usda-blueberry": "usda-raspberry",
    "usda-raspberry": "usda-blueberry",
  };
  return substitutions[ingredientId];
}

function dishNodes(recipeId: string, portions: readonly GameIngredientPortionV1[]): GameOperationNodeV1[] {
  const portion = (phase: string) => {
    const match = portions.find((entry) => entry.phase === phase);
    if (!match) throw new Error(`Missing ${phase} portion for ${recipeId}`);
    return match;
  };
  const base = portion("base");
  const baseWater = portion("base-cooking-water");
  const primary = portion("primary");
  const primaryWater = portions.find((entry) => entry.phase === "primary-cooking-water");
  const vegetable = portion("vegetable");
  const vegetableWater = portions.find((entry) => entry.phase === "vegetable-cooking-water");
  const onion = portion("aromatic");
  const garlic = portions.find((entry) => entry.phase === "aromatic" && entry.ingredientId === "usda-garlic");
  if (!garlic) throw new Error(`Missing garlic portion for ${recipeId}`);
  const oil = portion("cooking");
  const soy = portions.find((entry) => entry.ingredientId === "usda-soy-sauce");
  const vinegar = portions.find((entry) => entry.ingredientId === "usda-vinegar");
  const salt = portions.find((entry) => entry.ingredientId === "usda-salt");
  if (!soy || !vinegar || !salt) throw new Error(`Missing seasoning portion for ${recipeId}`);
  let order = 0;
  const vegetableCut: GameOperationId = ["usda-spinach", "usda-bok-choy", "usda-cabbage"].includes(vegetable.ingredientId) ? "slice" : "dice";
  const prepVegetable = node(recipeId, ++order, vegetableCut, [], [vegetable.portionId, onion.portionId], 240_000, 0, { cutSizeMm: vegetableCut === "slice" ? 18 : 12, uniformity: 0.85 }, cutTarget(), "quality");
  const prepGarlic = node(recipeId, ++order, "mince", [], [garlic.portionId], 60_000, 0, { cutSizeMm: 3, uniformity: 0.75 }, cutTarget(), "quality");
  const baseCook = node(recipeId, ++order, ["usda-white-rice", "usda-brown-rice"].includes(base.ingredientId) ? "simmer" : "boil", [], [base.portionId, baseWater.portionId], 60_000, baseCookDuration(base.ingredientId), { heatLevel: 0.7, temperatureC: 98 }, donenessTarget(), "quality");
  const baseDrain = ["usda-pasta-dry", "usda-rice-noodle-dry"].includes(base.ingredientId)
    ? node(recipeId, ++order, "drain", [baseCook.nodeId], [base.portionId, baseWater.portionId], 60_000, 0, {}, [{ dimension: "wateriness", maximum: 0.35, unit: "normalized" }], "quality")
    : undefined;
  const primaryPrep = primaryWater
    ? node(recipeId, ++order, "boil", [], [primary.portionId, primaryWater.portionId], 60_000, 1_200_000, { heatLevel: 0.65, temperatureC: 96 }, donenessTarget(), "quality")
    : undefined;
  const primaryDrain = primaryPrep && primaryWater
    ? node(recipeId, ++order, "drain", [primaryPrep.nodeId], [primary.portionId, primaryWater.portionId], 60_000, 0, {}, [{ dimension: "wateriness", maximum: 0.4, unit: "normalized" }], "quality")
    : undefined;
  const vegetablePrep = vegetableWater
    ? node(recipeId, ++order, "boil", [prepVegetable.nodeId], [vegetable.portionId, vegetableWater.portionId], 60_000, 600_000, { heatLevel: 0.65, temperatureC: 96 }, donenessTarget(), "quality")
    : undefined;
  const vegetableDrain = vegetablePrep && vegetableWater
    ? node(recipeId, ++order, "drain", [vegetablePrep.nodeId], [vegetable.portionId, vegetableWater.portionId], 60_000, 0, {}, [{ dimension: "wateriness", maximum: 0.4, unit: "normalized" }], "quality")
    : undefined;
  const pan = node(
    recipeId, ++order, "pan-fry", [prepVegetable.nodeId, prepGarlic.nodeId, ...(primaryDrain ? [primaryDrain.nodeId] : primaryPrep ? [primaryPrep.nodeId] : []), ...(vegetableDrain ? [vegetableDrain.nodeId] : vegetablePrep ? [vegetablePrep.nodeId] : [])],
    [primary.portionId, vegetable.portionId, onion.portionId, garlic.portionId, oil.portionId],
    180_000, 480_000, { heatLevel: 0.65, capacityG: 900 }, browningTarget(), "quality",
  );
  const season = node(recipeId, ++order, "season", [pan.nodeId], [soy.portionId, vinegar.portionId, salt.portionId], 60_000, 0, { quantityG: 35 }, [{ dimension: "salt", maximum: 0.8, unit: "normalized" }], "quality");
  const assemble = node(recipeId, ++order, "assemble", [(baseDrain ?? baseCook).nodeId, season.nodeId], portions.filter((entry) => !entry.phase.endsWith("cooking-water")).map((entry) => entry.portionId), 90_000, 0, {}, [], "completion");
  const serve = node(recipeId, ++order, "serve", [assemble.nodeId], portions.filter((entry) => !entry.phase.endsWith("cooking-water")).map((entry) => entry.portionId), 30_000, 0, {}, [], "completion");
  return [prepVegetable, prepGarlic, baseCook, ...(baseDrain ? [baseDrain] : []), ...(primaryPrep ? [primaryPrep] : []), ...(primaryDrain ? [primaryDrain] : []), ...(vegetablePrep ? [vegetablePrep] : []), ...(vegetableDrain ? [vegetableDrain] : []), pan, season, assemble, serve];
}

function dessertPortions(fruit: string, format: typeof dessertFormats[number]): PortionSpec[] {
  const nut = format.includes("walnut") ? "usda-walnut" : "usda-almond";
  if (format === "vanilla-yogurt-chill") return [
    { ingredientId: fruit, massG: 360, phase: "fruit" },
    { ingredientId: "usda-yogurt", massG: 400, phase: "base" },
    { ingredientId: "usda-vanilla", massG: 4, phase: "flavor" },
    { ingredientId: "usda-honey", massG: 24, phase: "sweetener" },
  ];
  if (format.includes("yogurt")) return [
    { ingredientId: fruit, massG: 360, phase: "fruit" },
    { ingredientId: "usda-yogurt", massG: 360, phase: "base" },
    { ingredientId: nut, massG: 40, phase: "finish" },
    { ingredientId: "usda-honey", massG: 30, phase: "sweetener" },
  ];
  if (format.includes("coconut-pudding")) return [
    { ingredientId: fruit, massG: 300, phase: "fruit" },
    { ingredientId: "usda-coconut-milk", massG: 400, phase: "base" },
    { ingredientId: "usda-cornstarch", massG: 36, phase: "thickener" },
    { ingredientId: nut, massG: 35, phase: "finish" },
    { ingredientId: "usda-sugar", massG: 40, phase: "sweetener" },
  ];
  if (format.includes("fruit-crumble")) return [
    { ingredientId: fruit, massG: 420, phase: "fruit" },
    { ingredientId: "usda-oats", massG: 60, phase: "dry" },
    { ingredientId: "usda-wheat-flour", massG: 100, phase: "dry" },
    { ingredientId: nut, massG: 50, phase: "dry" },
    { ingredientId: "usda-butter", massG: 60, phase: "fat" },
    { ingredientId: "usda-sugar", massG: 48, phase: "sweetener" },
    { ingredientId: "usda-cinnamon", massG: 2, phase: "seasoning" },
  ];
  if (format === "honey-cinnamon-bake") return [
    { ingredientId: fruit, massG: 440, phase: "fruit" },
    { ingredientId: "usda-oats", massG: 150, phase: "dry" },
    { ingredientId: "usda-almond", massG: 35, phase: "dry" },
    { ingredientId: "usda-butter", massG: 35, phase: "fat" },
    { ingredientId: "usda-honey", massG: 52, phase: "sweetener" },
    { ingredientId: "usda-cinnamon", massG: 3, phase: "seasoning" },
  ];
  return [
    { ingredientId: fruit, massG: 400, phase: "fruit" },
    { ingredientId: "usda-oats", massG: 120, phase: "dry" },
    { ingredientId: "usda-wheat-flour", massG: 60, phase: "dry" },
    { ingredientId: nut, massG: 45, phase: "dry" },
    { ingredientId: "usda-butter", massG: 45, phase: "fat" },
    { ingredientId: "usda-sugar", massG: 40, phase: "sweetener" },
    { ingredientId: "usda-cinnamon", massG: 2, phase: "seasoning" },
  ];
}

function dessertNodes(
  recipeId: string,
  portions: readonly GameIngredientPortionV1[],
  format: typeof dessertFormats[number],
): GameOperationNodeV1[] {
  const prep = node(recipeId, 1, "dice", [], [portions[0].portionId], 180_000, 0, { cutSizeMm: 15, uniformity: 0.8 }, cutTarget(), "quality");
  if (format.includes("yogurt")) {
    const mix = node(recipeId, 2, "fold", [prep.nodeId], portions.map((portion) => portion.portionId), 120_000, 0, { strength: 0.35 }, structureTarget(), "quality");
    const chill = node(recipeId, 3, "chill", [mix.nodeId], portions.map((portion) => portion.portionId), 30_000, 1_800_000, { temperatureC: 5 }, [{ dimension: "aroma", minimum: 0.35, unit: "normalized" }], "quality");
    return [prep, mix, chill, node(recipeId, 4, "serve", [chill.nodeId], portions.map((portion) => portion.portionId), 30_000, 0, {}, [], "completion")];
  }
  if (format.includes("coconut-pudding")) {
    const mix = node(recipeId, 2, "whisk", [prep.nodeId], portions.map((portion) => portion.portionId), 180_000, 0, { strength: 0.6 }, structureTarget(), "quality");
    const simmer = node(recipeId, 3, "simmer", [mix.nodeId], portions.map((portion) => portion.portionId), 60_000, 480_000, { heatLevel: 0.4, temperatureC: 88 }, donenessTarget(), "quality");
    const chill = node(recipeId, 4, "chill", [simmer.nodeId], portions.map((portion) => portion.portionId), 30_000, 3_600_000, { temperatureC: 5 }, structureTarget(), "quality");
    return [prep, mix, simmer, chill, node(recipeId, 5, "serve", [chill.nodeId], portions.map((portion) => portion.portionId), 30_000, 0, {}, [], "completion")];
  }
  const mix = node(recipeId, 2, "mix", [prep.nodeId], portions.map((portion) => portion.portionId), 180_000, 0, { strength: 0.55 }, structureTarget(), "quality");
  const bake = node(recipeId, 3, "bake", [mix.nodeId], portions.map((portion) => portion.portionId), 60_000, 1_800_000, { temperatureC: 180 }, browningTarget(), "quality");
  return [prep, mix, bake, node(recipeId, 4, "serve", [bake.nodeId], portions.map((portion) => portion.portionId), 30_000, 0, {}, [], "completion")];
}

function beveragePortions(base: string, addition: string, extra?: string): PortionSpec[] {
  const additionMass = /cinnamon|vanilla|ginger|basil/.test(addition) ? 3 : /honey|sugar|cocoa/.test(addition) ? 24 : /almond/.test(addition) ? 30 : 120;
  return [
    { ingredientId: base, massG: base === "usda-espresso" ? 120 : 480, phase: "base" },
    { ingredientId: addition, massG: additionMass, phase: "flavor" },
    ...(extra ? [{ ingredientId: extra, massG: 120, phase: "finish" }] : []),
  ];
}

function fruitDrinkPortions(fruit: string, accent: string): PortionSpec[] {
  return [
    { ingredientId: fruit, massG: 320, phase: "fruit" },
    { ingredientId: accent, massG: /ginger|basil/.test(accent) ? 10 : 45, phase: "accent" },
    { ingredientId: "usda-water", massG: 700, phase: "base" },
    { ingredientId: "usda-honey", massG: 24, phase: "sweetener" },
  ];
}

function beverageNodes(
  recipeId: string,
  portions: readonly GameIngredientPortionV1[],
  process: "mix" | "chill" | "blend" | "rest",
  serveHot: boolean,
): GameOperationNodeV1[] {
  const needsCut = portions.some((portion) => !/water|milk|coffee|espresso|tea|juice|honey|sugar|cocoa|cinnamon|vanilla/.test(portion.ingredientId));
  const prep = needsCut
    ? node(recipeId, 1, "dice", [], portions.filter((portion) => !/water|milk|coffee|espresso|tea|juice|honey|sugar|cocoa|cinnamon|vanilla/.test(portion.ingredientId)).map((portion) => portion.portionId), 120_000, 0, { cutSizeMm: 10, uniformity: 0.8 }, cutTarget(), "quality")
    : undefined;
  const warm = serveHot
    ? node(recipeId, 2, "set-heat", prep ? [prep.nodeId] : [], portions.map((portion) => portion.portionId), 30_000, 180_000, { heatLevel: 0.35, temperatureC: 65 }, [{ dimension: "aroma", minimum: 0.3, unit: "normalized" }], "quality")
    : undefined;
  const processNode = node(
    recipeId, 3, process, warm ? [warm.nodeId] : prep ? [prep.nodeId] : [], portions.map((portion) => portion.portionId),
    process === "rest" || process === "chill" ? 30_000 : 120_000,
    process === "rest" ? 300_000 : process === "chill" ? 1_800_000 : 0,
    process === "mix" ? { strength: 0.45 } : process === "blend" ? { strength: 0.75 } : process === "chill" ? { temperatureC: 5 } : {},
    process === "blend" || process === "mix" ? structureTarget() : [{ dimension: "aroma", minimum: 0.35, unit: "normalized" }],
    "quality",
  );
  const serve = node(recipeId, 4, "serve", [processNode.nodeId], portions.map((portion) => portion.portionId), 30_000, 0, {}, [], "completion");
  return [...(prep ? [prep] : []), ...(warm ? [warm] : []), processNode, serve];
}

function node(
  recipeId: string,
  order: number,
  operationType: GameOperationId,
  dependsOn: string[],
  inputPortionIds: string[],
  activeDurationMs: number,
  waitDurationMs: number,
  parameters: GameOperationNodeV1["parameters"],
  targetStates: GameTargetStateV1[],
  criticality: GameOperationNodeV1["criticality"],
): GameOperationNodeV1 {
  return {
    nodeId: `${recipeId}-op-${String(order).padStart(3, "0")}-${operationType}`,
    operationType,
    dependsOn,
    inputPortionIds,
    outputStateIds: [`${recipeId}-state-${String(order).padStart(3, "0")}`],
    equipmentId: equipmentFor(operationType),
    activeDurationMs,
    waitDurationMs,
    parameters,
    targetStates,
    criticality,
  };
}

function createNutritionProfile(
  portions: readonly GameIngredientPortionV1[],
  servings: number,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
): GameRecipeV1["nutritionProfile"] {
  let total = emptyNutrition();
  for (const portion of portions) {
    total = addNutrition(total, scaleNutrition(requiredIngredient(ingredientById, portion.ingredientId).nutritionPer100g, portion.massG / 100));
  }
  total = roundNutrition(total);
  const uniqueIngredientIds = [...new Set(portions.map((portion) => portion.ingredientId))];
  return {
    method: "ingredient-sum-v1",
    servings,
    total,
    perServing: roundNutrition(scaleNutrition(total, 1 / servings)),
    provenance: uniqueIngredientIds.map((ingredientId) => {
      const ingredient = requiredIngredient(ingredientById, ingredientId);
      if (ingredient.nutritionSource.kind !== "dataset") throw new Error(`M13 requires USDA data for ${ingredientId}`);
      return {
        ingredientId,
        nutritionProvenanceId: ingredient.nutritionProvenanceId,
        provider: "USDA FoodData Central",
        datasetVersion: ingredient.nutritionSource.datasetVersion,
        upstreamRecordId: ingredient.nutritionSource.fdcId,
        basis: "per-100g",
        ingredientState: ingredient.defaultState,
        conversionMethod: "massG / 100 × versioned USDA per-100g record; ingredient-sum-v1; rounded to 6 decimals",
        yieldFactor: 1,
        retentionFactor: 1,
        accessedAt: ingredient.nutritionSource.accessedAt,
      };
    }),
    estimated: true,
  };
}

function createScenarios(recipe: GameRecipeV1, sequence: number): GameRecipeScenarioV1[] {
  const scenarios = recipe.operationGraph.nodes
    .filter((node) => node.criticality !== "completion")
    .map((node): GameRecipeScenarioV1 => {
      const mutation = mutationForNode(node);
      return {
        scenarioId: `${recipe.recipeId}-scenario-${node.nodeId.split("-op-")[1]}`,
        baselineArtifactVersion: "",
        mutation,
        expectedDeltas: deltasFor(node.operationType, mutation.type),
        expectedFaultCodes: [faultFor(mutation.type)],
        causeCodes: [`${mutation.type}:${node.operationType}`],
        recoverability: ["bake", "boil", "simmer"].includes(node.operationType) ? "partially-recoverable" : "recoverable",
        nutritionEffect: mutation.type.startsWith("quantity-") ? "recalculate-from-quantities" : mutation.type.startsWith("heat-") ? "requires-retention-model" : "unchanged",
        applicableEngine: recipe.simulationProfile,
      };
    });
  const qualityNode = recipe.operationGraph.nodes.find((node) => node.criticality === "quality");
  const fallbackPortion = recipe.ingredientPortions[sequence % recipe.ingredientPortions.length];
  if (qualityNode) {
    const supplementalTypes = ["reorder", "duplicate", "quantity-too-high", "wrong-equipment", "missing-state-transition", "allowed-substitution"] as const;
    const type = supplementalTypes[sequence % supplementalTypes.length];
    const substitutionPortion = recipe.ingredientPortions.find((entry) => substitutionFor(entry.ingredientId));
    const portion = type === "allowed-substitution" ? substitutionPortion ?? fallbackPortion : fallbackPortion;
    const reorderDestination = recipe.operationGraph.nodes.find((node) => node.nodeId !== qualityNode.nodeId);
    scenarios.push({
      scenarioId: `${recipe.recipeId}-scenario-supplemental`,
      baselineArtifactVersion: "",
      mutation: {
        type,
        targetNodeId: qualityNode.nodeId,
        ...(type === "reorder" && reorderDestination ? { destinationBeforeNodeId: reorderDestination.nodeId } : {}),
        ...(type === "quantity-too-high" || type === "allowed-substitution" ? { targetPortionId: portion.portionId } : {}),
        ...(type === "quantity-too-high" ? { scalar: 1.5 } : {}),
        ...(type === "wrong-equipment" ? { replacementEquipmentId: "incompatible-tool" } : {}),
        ...(type === "allowed-substitution" ? { replacementIngredientId: substitutionFor(portion.ingredientId) ?? portion.ingredientId } : {}),
      },
      expectedDeltas: [{ dimension: "structural-integrity", direction: type === "allowed-substitution" ? "unchanged" : "decrease", confidence: "rule-based" }],
      expectedFaultCodes: type === "allowed-substitution" ? [] : [faultFor(type)],
      causeCodes: [`supplemental:${type}`],
      recoverability: type === "allowed-substitution" ? "recoverable" : "partially-recoverable",
      nutritionEffect: type === "quantity-too-high" || type === "allowed-substitution" ? "recalculate-from-quantities" : "unchanged",
      applicableEngine: recipe.simulationProfile,
    });
  }
  return scenarios;
}

function mutationForNode(node: GameOperationNodeV1): GameRecipeScenarioV1["mutation"] {
  if (["slice", "dice", "mince"].includes(node.operationType)) return { type: "cut-size-too-large", targetNodeId: node.nodeId, scalar: 1.8 };
  if (["boil", "simmer", "chill", "rest"].includes(node.operationType)) return { type: "duration-too-short", targetNodeId: node.nodeId, scalar: 0.5 };
  if (["pan-fry"].includes(node.operationType)) return { type: "overcrowding", targetNodeId: node.nodeId, scalar: 1.5 };
  if (["bake"].includes(node.operationType)) return { type: "heat-too-high", targetNodeId: node.nodeId, scalar: 1.2 };
  if (node.operationType === "season") return { type: "season-too-early", targetNodeId: node.nodeId };
  return { type: "omit", targetNodeId: node.nodeId };
}

function deltasFor(operation: GameOperationId, mutation: GameRecipeScenarioV1["mutation"]["type"]): GameRecipeScenarioV1["expectedDeltas"] {
  if (mutation === "heat-too-high") return [
    { dimension: "browning", direction: "increase", confidence: "rule-based" },
    { dimension: "burn", direction: "increase", confidence: "rule-based" },
    { dimension: "wateriness", direction: "decrease", confidence: "rule-based" },
  ];
  if (mutation === "duration-too-short" && ["boil", "simmer"].includes(operation)) return [
    { dimension: "doneness", direction: "decrease", confidence: "rule-based" },
    { dimension: "wateriness", direction: "increase", confidence: "rule-based" },
  ];
  if (mutation === "duration-too-short" && operation === "chill") return [
    { dimension: "structural-integrity", direction: "decrease", confidence: "rule-based" },
  ];
  if (mutation === "duration-too-short") return [{ dimension: "aroma", direction: "decrease", confidence: "rule-based" }];
  if (mutation === "overcrowding") return [
    { dimension: "browning", direction: "decrease", confidence: "rule-based" },
    { dimension: "wateriness", direction: "increase", confidence: "rule-based" },
  ];
  if (mutation === "season-too-early") return [
    { dimension: "salt", direction: "unchanged", confidence: "rule-based" },
    { dimension: "aroma", direction: "decrease", confidence: "rule-based" },
  ];
  if (["slice", "dice", "mince"].includes(operation)) return [{ dimension: "structural-integrity", direction: "decrease", confidence: "rule-based" }];
  if (["mix", "fold", "whisk", "blend"].includes(operation)) return [{ dimension: "structural-integrity", direction: "decrease", confidence: "rule-based" }];
  return [{ dimension: "aroma", direction: "decrease", confidence: "rule-based" }];
}

function createRightsRegistry(
  recipes: readonly GameRecipeV1[],
  ingredients: GameIngredientCatalogV1,
  nutritionDataset: GameNutritionDatasetSubsetV1,
): GameRightsRegistryV1 {
  const sources = gameSources();
  const evidence = gameEvidence();
  const sourceAssessments = sources.map(sourceAssessment);
  const artifacts: ContentArtifact[] = [];
  const assessments: RightsAssessment[] = [...sourceAssessments];
  const decisions: UsageDecision[] = [];
  const researchRecords: ResearchRecord[] = [];
  for (const recipe of recipes) {
    for (const kind of requiredKinds) {
      const artifactId = `game-artifact-${recipe.recipeId}-${kind}`;
      const assessmentId = `game-rights-${recipe.recipeId}-${kind}`;
      const decisionId = `game-usage-${recipe.recipeId}-${kind}`;
      const sourceIds = kind === "nutrition" ? ["usda-fdc-downloads"] : recipe.rights.sourceIds;
      const evidenceIds = kind === "nutrition" ? ["evidence-usda-fdc-subset"] : recipe.rights.evidenceIds;
      artifacts.push({
        id: artifactId,
        version: recipe.artifactVersion,
        subject: { type: "game-recipe", id: recipe.recipeId },
        kind,
        derivation: kind === "nutrition" ? "factual-synthesis" : "original",
        sourceIds,
        evidenceIds,
        rightsAssessmentId: assessmentId,
        usageDecisionId: decisionId,
        attributionRequirementIds: [],
      });
      assessments.push(firstPartyArtifactAssessment(artifactId, assessmentId));
      decisions.push({
        id: decisionId,
        artifactId,
        assessmentIds: [assessmentId, ...sourceIds.map((sourceId) => `game-rights-source-${sourceId}`)] as [string, ...string[]],
        intendedUse: "game-commercial-ready",
        decision: "allow",
        conditions: ["Publish only the deterministic structured data; do not copy source prose or visual assets."],
        decidedAt: accessedAt,
        reviewer: "Cooking Lab game rights policy engine",
      });
    }
    researchRecords.push({
      id: `game-research-${recipe.recipeId}`,
      subject: { type: "game-recipe", id: recipe.recipeId },
      templateId: ["tea", "coffee"].includes(recipe.itemType) ? recipe.itemType as "tea" | "coffee" : recipe.itemType === "non-alcoholic-drink" ? "drink" : "dish-dessert",
      question: "Can this structured first-party formula be exported for a commercial game without copying protected expression?",
      sourceDecisions: recipe.rights.sourceIds.map((sourceId) => ({
        id: `game-research-${recipe.recipeId}-${sourceId}`,
        disposition: "accepted",
        sourceId,
        uses: sourceId === "usda-fdc-downloads"
          ? ["identity", "nutrition"]
          : sourceId === "fda-produce-handling"
            ? ["safety"]
            : ["identity"],
        rationale: sourceId === "usda-fdc-downloads"
          ? "Uses record-level CC0 nutrient facts from the committed versioned subset."
          : "Uses narrow factual guidance only; no source wording, image, layout or recipe expression is copied.",
      })),
      claims: [
        {
          id: `game-claim-${recipe.recipeId}-nutrition`,
          statement: "Ingredient identity and per-100g nutrition are derived from the committed USDA FoodData Central subset.",
          kind: "documented-fact",
          disposition: "include",
          evidenceIds: ["evidence-usda-fdc-subset"],
          rationale: "The recipe stores each FDC record ID, dataset release and deterministic mass-based calculation path.",
        },
        {
          id: `game-claim-${recipe.recipeId}-preparation-pending`,
          statement: "The exact ingredient ratios, operation graph and mutation outcomes are culinarily plausible.",
          kind: "documented-fact",
          disposition: "defer",
          evidenceIds: [],
          rationale: "Family-specific preparation evidence and independent culinary review are still required before export.",
        },
      ],
      unresolvedQuestions: ["Which rights-cleared family-specific sources support the exact preparation parameters and mutation causality?"],
      editorialDecision: "Draft only until family-specific evidence, independent review and sampling QA are complete.",
      reviewer: "Cooking Lab deterministic provenance pipeline",
      reviewedAt: accessedAt,
      status: "in-progress",
    });
  }
  const registry: GameRightsRegistryV1 = {
    schemaVersion: "cooking-lab-game-rights-v1",
    policyVersion: m13PolicyVersion,
    artifacts,
    assessments,
    attributions: [],
    decisions,
    sources,
    evidence,
    evidenceOrigins: evidence.map((entry) => ({ evidenceId: entry.id, origin: "source-record" as const })),
    sourceRoles: [
      { sourceId: "usda-fdc-downloads", role: "nutrition" },
      { sourceId: "fda-produce-handling", role: "safety" },
      { sourceId: "fda-caffeine-guidance", role: "safety" },
    ],
    researchRecords,
    governance: {
      policyVersion: m13PolicyVersion,
      attestations: [],
      riskClassifications: [],
      samplingBatches: [],
    },
  };
  registry.governance.riskClassifications = recipes.map((recipe): PublishingRiskClassification => {
    const minimumRisk = deriveMinimumGamePublishingRisk(recipe, registry);
    return {
      id: `game-risk-${recipe.recipeId}`,
      itemId: recipe.recipeId,
      artifactSetVersion: createGameArtifactSetVersion([recipe], registry, {
        operations: gameOperationCatalog,
        ingredients,
        nutritionDataset,
      }),
      level: minimumRisk.level,
      reasonCodes: minimumRisk.reasonCodes as PublishingRiskClassification["reasonCodes"],
      equivalenceClassKeys: deriveGameEquivalenceClassKeys(recipe, registry) as PublishingRiskClassification["equivalenceClassKeys"],
      policyVersion: m13PolicyVersion,
      classifiedAt: accessedAt,
    };
  });
  return registry;
}

function gameSources(): Source[] {
  return [
    {
      id: "usda-fdc-downloads",
      type: "government",
      title: "FoodData Central Download Datasets",
      publisherOrInstitution: "USDA Agricultural Research Service",
      authorNames: ["USDA Agricultural Research Service"],
      publication: { dateText: "Foundation Foods 2026-04 and SR Legacy 2018-04" },
      locators: [{ kind: "url", url: "https://fdc.nal.usda.gov/download-datasets", accessedAt }],
      rights: {
        status: "open-license",
        licenseId: "CC0-1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
        attribution: "USDA FoodData Central",
        adaptationStatus: "adapted",
        shareAlikeRequired: false,
        notes: "Only the committed record-level subset is normalized; no full database is redistributed.",
      },
      health: { status: "active", checkedAt: accessedAt },
      reliability: "primary",
      editorialNotes: "Official source for versioned nutrient records and food identities.",
    },
    {
      id: "fda-produce-handling",
      type: "government",
      title: "Selecting and Serving Produce Safely",
      publisherOrInstitution: "U.S. Food and Drug Administration",
      authorNames: ["U.S. Food and Drug Administration"],
      locators: [{ kind: "url", url: "https://www.fda.gov/consumers/consumer-updates/selecting-and-serving-produce-safely", accessedAt }],
      rights: { status: "reference-only", notes: "Narrow food-handling facts only; no wording, arrangement or media reused." },
      health: { status: "active", checkedAt: accessedAt },
      reliability: "primary",
      editorialNotes: "Independent factual cross-check for produce handling in deterministic formulas.",
    },
    {
      id: "fda-caffeine-guidance",
      type: "government",
      title: "Spilling the Beans: How Much Caffeine is Too Much?",
      publisherOrInstitution: "U.S. Food and Drug Administration",
      authorNames: ["U.S. Food and Drug Administration"],
      locators: [{ kind: "url", url: "https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much", accessedAt }],
      rights: { status: "reference-only", notes: "Narrow beverage identity and caffeine context only; no wording, arrangement or media reused." },
      health: { status: "active", checkedAt: accessedAt },
      reliability: "primary",
      editorialNotes: "Independent cross-check for coffee and tea identity; corpus makes no health claim.",
    },
  ];
}

function gameEvidence(): Evidence[] {
  return [
    {
      id: "evidence-usda-fdc-subset",
      sourceId: "usda-fdc-downloads",
      relation: "supports",
      strength: "primary",
      locators: [{ kind: "section", value: "Foundation Foods 2026-04 and SR Legacy 2018-04 downloadable JSON records identified by fdcId" }],
      editorialNote: "Supports ingredient identity and per-100g nutrition values in the committed 81-record subset.",
    },
    {
      id: "evidence-fda-produce-handling",
      sourceId: "fda-produce-handling",
      relation: "supports",
      strength: "primary",
      locators: [{ kind: "section", value: "Preparation" }],
      editorialNote: "Supports narrow handling assumptions; does not supply recipe expression.",
    },
    {
      id: "evidence-fda-caffeine-context",
      sourceId: "fda-caffeine-guidance",
      relation: "context",
      strength: "primary",
      locators: [{ kind: "section", value: "Caffeine sources and individual variability" }],
      editorialNote: "Context only; no health or safe-intake claim is encoded in the recipes.",
    },
  ];
}

function firstPartyArtifactAssessment(artifactId: string, assessmentId: string): RightsAssessment {
  return {
    id: assessmentId,
    subject: { type: "artifact", id: artifactId },
    jurisdictionBaseline: ["CN", "US", "EU", "UK"],
    basis: { kind: "first-party", owner: "Cooking Lab" },
    authorityVersion: m13PolicyVersion,
    accessedAt,
    applicableTerritories: ["CN", "US", "EU", "UK"],
    permissions: allowedPermissions("First-party deterministic structured game data"),
    attributionRequirementIds: [],
    risks: clearedRisks("No protected third-party expression, image, brand identity or personal data is included."),
    uncertainty: "",
    assessedAt: accessedAt,
    reviewer: "Cooking Lab game rights policy engine",
    reviewDueAt,
  };
}

function sourceAssessment(source: Source): RightsAssessment {
  const isFdc = source.id === "usda-fdc-downloads";
  return {
    id: `game-rights-source-${source.id}`,
    subject: { type: "source", id: source.id },
    jurisdictionBaseline: ["CN", "US", "EU", "UK"],
    basis: isFdc
      ? { kind: "open-license", licenseId: "CC0-1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" }
      : { kind: "reference-only", boundary: "Facts and safety context only; no protected expression or media copied." },
    authorityVersion: isFdc ? "USDA FoodData Central data policy accessed 2026-09-08" : "17 USC 105 noted; conservative global use remains factual reference-only",
    accessedAt,
    applicableTerritories: ["CN", "US", "EU", "UK"],
    permissions: allowedPermissions(isFdc ? "Record-level CC0 nutrition subset" : "Use narrow facts as input to independent first-party structured formulas"),
    attributionRequirementIds: [],
    risks: clearedRisks(isFdc ? "CC0 record-level extraction; no systematic third-party database extraction." : "No source wording, arrangement, image or recipe expression is reused."),
    uncertainty: "",
    assessedAt: accessedAt,
    reviewer: "Cooking Lab game rights policy engine",
    reviewDueAt,
  };
}

function allowedPermissions(scope: string): RightsAssessment["permissions"] {
  return {
    store: { status: "allowed", scope },
    transform: { status: "allowed", scope },
    publish: { status: "allowed", scope },
    commercialize: { status: "allowed", scope },
  };
}

function clearedRisks(notes: string): RightsAssessment["risks"] {
  return {
    copyright: { status: "cleared", notes },
    database: { status: "cleared", notes },
    contract: { status: "cleared", notes },
    trademark: { status: "not-applicable", notes: "No brand or logo is exported." },
    "publicity-privacy": { status: "not-applicable", notes: "No person or personal data is present." },
  };
}

function sourceIdsFor(itemType: CulinaryItemType): string[] {
  return ["usda-fdc-downloads", ["tea", "coffee"].includes(itemType) ? "fda-caffeine-guidance" : "fda-produce-handling"];
}

function evidenceIdsFor(itemType: CulinaryItemType): string[] {
  return ["evidence-usda-fdc-subset", ["tea", "coffee"].includes(itemType) ? "evidence-fda-caffeine-context" : "evidence-fda-produce-handling"];
}

function inferIngredientState(ingredientId: string): GameIngredientCatalogV1["ingredients"][number]["defaultState"] {
  if (/black-bean|chickpea/.test(ingredientId)) return "prepared";
  if (["usda-butter", "usda-tofu", "usda-yogurt"].includes(ingredientId)) return "prepared";
  if (liquidIngredientIds.has(ingredientId)) return "liquid";
  if (/rice|oats|flour|lentil|sugar|salt|cocoa|cinnamon|baking-powder|cornstarch|pasta|noodle/.test(ingredientId)) return "dry";
  return "raw";
}

function inferDensity(ingredientId: string): number | undefined {
  if (/olive-oil|canola-oil/.test(ingredientId)) return 0.91;
  if (liquidIngredientIds.has(ingredientId)) return 1;
  return undefined;
}

const liquidIngredientIds = new Set([
  "usda-water",
  "usda-whole-milk",
  "usda-coconut-milk",
  "usda-olive-oil",
  "usda-canola-oil",
  "usda-coffee-brewed",
  "usda-espresso",
  "usda-black-tea-brewed",
  "usda-green-tea-brewed",
  "usda-vinegar",
  "usda-lemon-juice",
]);

function equipmentFor(operation: GameOperationId): string {
  if (["boil", "simmer"].includes(operation)) return "heavy-pot";
  if (operation === "pan-fry") return "frying-pan";
  if (operation === "bake") return "oven";
  if (operation === "chill") return "refrigerator";
  if (operation === "rest") return "mixing-bowl";
  if (operation === "blend") return "blender";
  if (["slice", "dice", "mince"].includes(operation)) return "knife";
  return "mixing-bowl";
}

function cutTarget(): GameTargetStateV1[] {
  return [{ dimension: "structural-integrity", minimum: 0.4, maximum: 0.95, unit: "normalized" }];
}

function structureTarget(): GameTargetStateV1[] {
  return [{ dimension: "structural-integrity", minimum: 0.35, maximum: 0.9, unit: "normalized" }];
}

function donenessTarget(): GameTargetStateV1[] {
  return [{ dimension: "doneness", minimum: 0.75, maximum: 1, unit: "normalized" }];
}

function browningTarget(): GameTargetStateV1[] {
  return [
    { dimension: "browning", minimum: 0.35, maximum: 0.85, unit: "normalized" },
    { dimension: "burn", maximum: 0.2, unit: "normalized" },
  ];
}

function faultFor(mutation: GameRecipeScenarioV1["mutation"]["type"]): string {
  return mutation === "allowed-substitution" ? "none" : `fault-${mutation}`;
}

function requiredIngredient(
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
  ingredientId: string,
): GameIngredientCatalogV1["ingredients"][number] {
  const ingredient = ingredientById.get(ingredientId);
  if (!ingredient) throw new Error(`Missing game ingredient ${ingredientId}`);
  return ingredient;
}

function shortId(ingredientId: string): string {
  return ingredientId.replace(/^usda-/, "").replace(/-brewed$/, "");
}

function scaleNutrition(nutrition: Nutrition, factor: number): Nutrition {
  return Object.fromEntries(Object.entries(nutrition).map(([key, value]) => [key, value * factor])) as unknown as Nutrition;
}

function addNutrition(left: Nutrition, right: Nutrition): Nutrition {
  return Object.fromEntries(Object.keys(left).map((key) => [key, left[key as keyof Nutrition] + right[key as keyof Nutrition]])) as unknown as Nutrition;
}

function roundNutrition(nutrition: Nutrition): Nutrition {
  return Object.fromEntries(Object.entries(nutrition).map(([key, value]) => [key, round(value)])) as unknown as Nutrition;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
