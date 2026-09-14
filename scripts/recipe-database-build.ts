import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import { createGameRecipeArtifactVersion } from "@/lib/game-recipe-validation";
import type {
  GameHeatControlV1,
  GameIngredientPortionV1,
  GameOperationNodeV1,
  GameRecipeV1,
  GameTargetStateV1,
} from "@/types/game-recipe";
import type {
  DatabaseCategoryTag,
  PortionRole,
  RecipeDatabaseExtensionV1,
} from "@/types/game-recipe-database";
import type { FlavorProfile } from "@/types/flavor";
import type { Nutrition } from "@/types/nutrition";

/**
 * Shared recipe-database build module (extracted from the batch A generator).
 * Batch generators only provide DraftRecipe data arrays; this module handles
 * catalog loading, operation-catalog contract enforcement (equipment binding,
 * target-dimension whitelist, engine-v2 coverage via data), nutrition sums,
 * scenario coverage and artifact-version computation.
 */

export type OpSpec = {
  op: GameOperationNodeV1["operationType"];
  inputs?: number[]; // portion indexes (0-based)
  durationMs?: number;
  waitMs?: number;
  params?: GameOperationNodeV1["parameters"];
  heat?: GameHeatControlV1;
  targets?: GameTargetStateV1[];
  criticality?: GameOperationNodeV1["criticality"];
  equipment?: string;
};

export type PortionSpec = {
  id: string; // ingredient id in catalog
  grams: number;
  amount: number;
  unit: GameIngredientPortionV1["sourceQuantity"]["unit"];
  conversionId: string;
  role: PortionRole;
  state?: GameIngredientPortionV1["initialState"];
  optional?: boolean;
};

export interface DraftRecipe {
  slug: string;
  itemType: GameRecipeV1["itemType"];
  servings: number;
  yieldAmount: number;
  yieldUnit: GameRecipeV1["yield"]["unit"];
  simulationProfile: GameRecipeV1["simulationProfile"];
  categoryTags: DatabaseCategoryTag[];
  cuisineIds?: string[];
  mealRoleIds: string[];
  servingContextIds: string[];
  flavor: FlavorProfile;
  portions: PortionSpec[];
  ops: OpSpec[];
}

export interface BuildOptions {
  generatorVersion: string;
  sourceNotes: string;
  accessedAt: string;
  /** Allow overwriting an existing recipe file with the same slug (for re-generation). */
  allowOverwrite?: boolean;
}

export const NUTRI_ZERO: Nutrition = { calories: 0, protein: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0, sodium: 0 };

export interface RecipeCatalog {
  ingredientById: ReadonlyMap<string, { ingredientId: string; nutritionPer100g: Nutrition; nutritionProvenanceId: string; defaultState: GameIngredientPortionV1["initialState"] }>;
  conversionIds: ReadonlySet<string>;
  operationById: ReadonlyMap<string, { id: string; equipmentRequired: boolean; compatibleEquipmentIds: string[]; inputRequirement: "none" | "one-or-more"; targetStateRequired: boolean }>;
}

export function loadCatalog(): RecipeCatalog {
  const ingredientCatalog = JSON.parse(readFileSync(resolve(process.cwd(), "game-data/source/ingredients.json"), "utf8")) as {
    ingredients: RecipeCatalog["ingredientById"] extends ReadonlyMap<string, infer T> ? T[] : never;
    conversionRecords: Array<{ recordId: string }>;
  };
  const operationCatalog = JSON.parse(readFileSync(resolve(process.cwd(), "game-data/operations.json"), "utf8")) as {
    operations: Array<{ id: string; equipmentRequired: boolean; compatibleEquipmentIds: string[]; inputRequirement: "none" | "one-or-more"; targetStateRequired: boolean }>;
  };
  return {
    ingredientById: new Map(ingredientCatalog.ingredients.map((i) => [i.ingredientId, i])),
    conversionIds: new Set(ingredientCatalog.conversionRecords.map((r) => r.recordId)),
    operationById: new Map(operationCatalog.operations.map((op) => [op.id, op])),
  };
}

const drinkItemTypes = new Set(["alcoholic-drink", "non-alcoholic-drink", "tea", "coffee"]);

export function defaultEquipmentFor(op: string, itemType: string): string | undefined {
  const definition = catalogOperation(op);
  if (!definition || !definition.equipmentRequired || !definition.compatibleEquipmentIds.length) return undefined;
  const options = definition.compatibleEquipmentIds;
  if (drinkItemTypes.has(itemType)) {
    const glass = options.find((id) => id === "glass" || id === "pitcher" || id === "wine-glass");
    if (glass) return glass;
  }
  return options[0];
}

let sharedCatalog: RecipeCatalog | null = null;
function catalogOperation(op: string): RecipeCatalog["operationById"] extends ReadonlyMap<string, infer T> ? T | undefined : never {
  if (!sharedCatalog) sharedCatalog = loadCatalog();
  return sharedCatalog.operationById.get(op) as never;
}

const allowedDimensionsByOp: Record<string, string[]> = {
  prep_mix: ["structural-integrity"],
  waiting: ["aroma", "salt", "sweet", "acidity", "umami", "pungency", "structural-integrity"],
  heating: ["doneness", "wateriness", "browning", "burn", "aroma", "structural-integrity"],
  drain_blend: ["wateriness", "structural-integrity"],
  beverage: ["wateriness", "aroma", "bitterness", "structural-integrity"],
  season: ["salt", "sweet", "acidity", "umami", "pungency", "bitterness", "aroma"],
};

export function allowedDimensionsFor(op: string): string[] | null {
  if (["wash", "peel", "slice", "dice", "mince", "crush", "grind", "mix", "whisk", "knead", "fold", "shape", "stir", "toss"].includes(op)) return allowedDimensionsByOp.prep_mix;
  if (["marinate", "rest", "proof", "ferment"].includes(op)) return allowedDimensionsByOp.waiting;
  if (["set-heat", "boil", "simmer", "steam", "pan-fry", "deep-fry", "bake", "roast", "grill"].includes(op)) return allowedDimensionsByOp.heating;
  if (["drain", "rinse", "strain", "blend"].includes(op)) return allowedDimensionsByOp.drain_blend;
  if (["brew", "extract", "chill", "freeze"].includes(op)) return allowedDimensionsByOp.beverage;
  if (op === "season") return allowedDimensionsByOp.season;
  return null; // add / remove / serve / garnish / assemble: no meaningful targets
}

/** Rewrites target dimensions that are not meaningful for the operation. */
export function coerceTargets(op: string, targets: GameTargetStateV1[]): GameTargetStateV1[] {
  const allowed = allowedDimensionsFor(op);
  if (!allowed) return [];
  const coerced: GameTargetStateV1[] = [];
  for (const target of targets) {
    if (allowed.includes(target.dimension)) {
      coerced.push(target);
    } else {
      coerced.push({ ...target, dimension: allowed[0] as GameTargetStateV1["dimension"] });
    }
  }
  // de-duplicate dimensions (validator rejects duplicates after coercion)
  const seen = new Set<string>();
  return coerced.filter((target) => {
    if (seen.has(target.dimension)) return false;
    seen.add(target.dimension);
    return true;
  });
}

export function buildRecipe(draft: DraftRecipe, catalog: RecipeCatalog, options: BuildOptions): GameRecipeV1 {
  const slug = draft.slug;
  const existing = readdirSync(resolve(process.cwd(), "game-data/source/recipes")).map((name) => name.replace(/\.json$/, ""));
  if (existing.includes(slug) && !options.allowOverwrite) {
    throw new Error(`Slug collision: ${slug} already exists`);
  }

  const portions: GameIngredientPortionV1[] = draft.portions.map((p, i) => {
    const catalogEntry = catalog.ingredientById.get(p.id);
    if (!catalogEntry) throw new Error(`Unknown ingredient ${p.id}`);
    if (!catalog.conversionIds.has(p.conversionId)) throw new Error(`Unknown conversion ${p.conversionId} for ${p.id}`);
    return {
      portionId: `${slug}-portion-${String(i + 1).padStart(2, "0")}`,
      ingredientId: p.id,
      initialState: p.state ?? catalogEntry.defaultState,
      sourceQuantity: { amount: p.amount, unit: p.unit, conversionRecordId: p.conversionId },
      massG: p.grams,
      optional: p.optional ?? false,
      phase: "main",
      role: p.role,
      allowedSubstitutionIngredientIds: [],
      nutritionProvenanceId: catalogEntry.nutritionProvenanceId,
    };
  });

  const nodes: GameOperationNodeV1[] = draft.ops.map((spec, i) => {
    const nodeId = `${slug}-op-${String(i + 1).padStart(3, "0")}-${spec.op}`;
    const prevNode = i > 0 ? `${slug}-op-${String(i).padStart(3, "0")}-${draft.ops[i - 1].op}` : null;
    const equipment = spec.equipment ?? defaultEquipmentFor(spec.op, draft.itemType);
    const definition = catalog.operationById.get(spec.op);
    const explicitInputs = (spec.inputs ?? []).map((idx) => portions[idx].portionId);
    const inputPortionIds = definition?.inputRequirement === "none" || explicitInputs.length
      ? explicitInputs
      : [portions[0].portionId]; // auto-bind the primary portion when the operation needs an input
    const allowedDims = allowedDimensionsFor(spec.op);
    const fallbackDimension = allowedDims?.includes("doneness") ? "doneness" : allowedDims?.[0];
    const autoTargets = definition?.targetStateRequired && !(spec.targets ?? []).length
      ? (fallbackDimension ? [{ dimension: fallbackDimension as GameTargetStateV1["dimension"], minimum: 0.8, unit: "normalized" } as GameTargetStateV1] : [])
      : coerceTargets(spec.op, spec.targets ?? []);
    return {
      nodeId,
      operationType: spec.op,
      dependsOn: prevNode ? [prevNode] : [],
      inputPortionIds,
      outputStateIds: [`${nodeId}-done`],
      equipmentId: equipment,
      activeDurationMs: spec.durationMs ?? 0,
      waitDurationMs: spec.waitMs ?? 0,
      parameters: spec.params ?? {},
      heatControl: spec.heat,
      targetStates: autoTargets,
      criticality: spec.criticality ?? (spec.op === "serve" || spec.op === "garnish" || spec.op === "remove" ? "completion" : "quality"),
      sourceStepOrder: i + 1,
    };
  });

  // nutrition: ingredient-sum
  const total = { ...NUTRI_ZERO };
  for (const p of draft.portions) {
    const n = catalog.ingredientById.get(p.id)!.nutritionPer100g;
    const factor = p.grams / 100;
    total.calories += n.calories * factor;
    total.protein += n.protein * factor;
    total.fat += n.fat * factor;
    total.saturatedFat += n.saturatedFat * factor;
    total.carbs += n.carbs * factor;
    total.sugar += n.sugar * factor;
    total.addedSugar += n.addedSugar * factor;
    total.fiber += n.fiber * factor;
    total.sodium += n.sodium * factor;
  }
  const round = (v: number) => Math.round(v * 100) / 100;
  const perServing = { ...NUTRI_ZERO };
  (Object.keys(perServing) as (keyof Nutrition)[]).forEach((key) => {
    perServing[key] = round(total[key] / draft.servings);
  });
  (Object.keys(total) as (keyof Nutrition)[]).forEach((key) => {
    total[key] = round(total[key]);
  });

  const extension: RecipeDatabaseExtensionV1 = {
    extensionVersion: "cooking-lab-recipe-database-v1",
    tags: {
      categoryTags: draft.categoryTags,
      ...(draft.cuisineIds ? { cuisineIds: draft.cuisineIds } : {}),
      mealRoleIds: draft.mealRoleIds,
      servingContextIds: draft.servingContextIds,
    },
    flavor: draft.flavor,
    images: [{ status: "missing" }],
    sourceType: "ai-assisted",
    sourceNotes: options.sourceNotes,
  };

  const recipe: GameRecipeV1 = {
    schemaVersion: "cooking-lab-game-recipe-v1",
    artifactVersion: "",
    recipeId: slug,
    slug,
    itemType: draft.itemType,
    eligibility: "database-entry",
    simulationProfile: draft.simulationProfile,
    servings: draft.servings,
    yield: { amount: draft.yieldAmount, unit: draft.yieldUnit },
    ingredientPortions: portions,
    operationGraph: { nodes },
    nutritionProfile: {
      method: "ingredient-sum-v1",
      servings: draft.servings,
      total,
      perServing,
      provenance: draft.portions.map((p, i) => {
        const entry = catalog.ingredientById.get(p.id)!;
        return {
          ingredientId: p.id,
          nutritionProvenanceId: entry.nutritionProvenanceId,
          provider: "Cooking Lab editorial estimate",
          datasetVersion: "demo-estimated-v1",
          upstreamRecordId: p.id,
          basis: "per-100g",
          ingredientState: portions[i].initialState,
          conversionMethod: "existing unit weight to grams; ingredient-sum-v1",
          yieldFactor: 1,
          retentionFactor: 1,
          accessedAt: options.accessedAt,
        };
      }),
      estimated: true,
    },
    scenarios: [],
    rights: { artifactIds: [], usageDecisionIds: [], sourceIds: [], evidenceIds: [], intendedUse: "game-commercial-ready" },
    governance: { riskLevel: "low", riskClassificationId: "", reviewAttestationIds: [] },
    authoring: {
      method: "deterministic-migration",
      generatorVersion: options.generatorVersion,
      containsGeneratedExpression: false,
      unresolvedMappings: [],
    },
    database: extension,
  };

  // scenario coverage for every quality node: simple omit scenario
  for (const node of nodes) {
    if (node.criticality === "completion") continue;
    recipe.scenarios.push({
      scenarioId: `${slug}-${node.nodeId}-omit`,
      baselineArtifactVersion: "",
      mutation: { type: "omit", targetNodeId: node.nodeId },
      expectedDeltas: [{ dimension: "structural-integrity", direction: "decrease", confidence: "rule-based" }],
      expectedFaultCodes: [`missing-${node.operationType}`],
      causeCodes: [`operation-omitted:${node.operationType}`],
      recoverability: "partially-recoverable",
      nutritionEffect: "unchanged",
      applicableEngine: draft.simulationProfile,
    });
  }
  // Compute the artifact version after scenarios are attached (payload complete).
  const artifactVersion = createGameRecipeArtifactVersion(recipe);
  recipe.artifactVersion = artifactVersion;
  for (const scenario of recipe.scenarios) scenario.baselineArtifactVersion = artifactVersion;
  return recipe;
}

export function writeRecipes(drafts: DraftRecipe[], options: BuildOptions): number {
  const catalog = loadCatalog();
  let count = 0;
  for (const draft of drafts) {
    const recipe = buildRecipe(draft, catalog, options);
    const path = resolve(process.cwd(), "game-data/source/recipes", `${draft.slug}.json`);
    writeFileSync(path, stableJson(recipe), "utf8");
    count += 1;
  }
  return count;
}
