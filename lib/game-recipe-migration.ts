import type { CulinaryItem, PreparationStep } from "@/types/culinary";
import type { ContentRightsRegistry } from "@/types/content-rights";
import type {
  GameIngredientPortionV1,
  GameIngredientCatalogV1,
  GameNutritionProfileV1,
  GameOperationId,
  GameOperationNodeV1,
  GameRecipeScenarioV1,
  GameRecipeV1,
  GameSimulationProfile,
  GameTargetStateV1,
} from "@/types/game-recipe";
import type { Ingredient } from "@/types/ingredient";
import { emptyNutrition, type Nutrition } from "@/types/nutrition";
import type { PublishingGovernanceRegistry } from "@/types/publishing-governance";
import { gameOperationById } from "@/game-data/operation-catalog";
import { toGrams } from "./unit-conversion";
import { createGameRecipeArtifactVersion } from "./game-recipe-validation";

export const currentGameRecipeMigrationVersion = "m12-current-50-v1";
const nutritionAccessDate = "2026-09-07";

export function createMigrationIngredientCatalog(
  items: readonly CulinaryItem[],
  ingredients: readonly Ingredient[],
): GameIngredientCatalogV1 {
  const usedIngredientIds = new Set(items.flatMap((item) => "inputs" in item.preparation
    ? item.preparation.inputs.map((input) => input.ingredientId)
    : [`${item.id}-generic`]));
  const definitions: GameIngredientCatalogV1["ingredients"] = ingredients
    .filter((ingredient) => usedIngredientIds.has(ingredient.id))
    .map((ingredient) => ({
      ingredientId: ingredient.id,
      sourceIngredientId: ingredient.id,
      defaultState: inferIngredientState(ingredient.id),
      unitWeightsG: ingredient.approximateUnitWeight ?? {},
      nutritionPer100g: ingredient.nutritionPer100g,
      nutritionProvenanceId: ingredient.nutritionProvenanceId,
      nutritionSource: {
        kind: "migration-estimate",
        provenanceId: ingredient.nutritionProvenanceId,
        limitations: "Migrated Cooking Lab demo estimate; not eligible for commercial game export.",
      },
    }));
  for (const item of items.filter((candidate) => !("inputs" in candidate.preparation))) {
    const ingredientId = `${item.id}-generic`;
    const nutrition = item.nutrition.applicability === "applicable" && item.nutrition.source === "declared-estimate"
      ? item.nutrition.basis === "per-serving"
        ? item.nutrition.value
        : item.nutrition.value
      : emptyNutrition();
    definitions.push({
      ingredientId,
      sourceIngredientId: item.id,
      defaultState: "ready-to-serve",
      densityGPerMl: 1,
      unitWeightsG: { ml: 1 },
      nutritionPer100g: nutrition,
      nutritionProvenanceId: `pending:${ingredientId}`,
      nutritionSource: {
        kind: "migration-estimate",
        provenanceId: `pending:${ingredientId}`,
        limitations: "Placeholder migrated from serving guidance; exact product nutrition is not modeled.",
      },
    });
  }
  return {
    schemaVersion: "cooking-lab-game-ingredients-v1",
    catalogVersion: currentGameRecipeMigrationVersion,
    ingredients: definitions.sort((left, right) => left.ingredientId.localeCompare(right.ingredientId)),
  };
}

interface MigrationContext {
  ingredients: readonly Ingredient[];
  rightsRegistry: ContentRightsRegistry;
  governanceRegistry: PublishingGovernanceRegistry;
}

interface OperationMatch {
  operationType: GameOperationId;
  index: number;
}

const operationPatterns: ReadonlyArray<{ operationType: GameOperationId; pattern: RegExp }> = [
  { operationType: "wash", pattern: /淘洗|洗净|清洗/ },
  { operationType: "rinse", pattern: /冲洗|润洗|洗茶/ },
  { operationType: "peel", pattern: /去皮|削皮/ },
  { operationType: "dice", pattern: /切丁|切块|小块|方块/ },
  { operationType: "mince", pattern: /切碎|剁碎|切末|剁成|绞碎/ },
  { operationType: "slice", pattern: /切片|切段|切条|切丝|切开|改刀|斜切/ },
  { operationType: "crush", pattern: /拍裂|拍碎|压碎|碾碎/ },
  { operationType: "grind", pattern: /研磨|磨成|磨碎/ },
  { operationType: "whisk", pattern: /搅打|打发|打蛋器/ },
  { operationType: "knead", pattern: /揉面|揉成|揉匀/ },
  { operationType: "fold", pattern: /翻拌|切拌/ },
  { operationType: "shape", pattern: /整形|塑形|搓成|压成/ },
  { operationType: "marinate", pattern: /腌制|腌渍|抓匀.*腌|腌\s*\d/ },
  { operationType: "proof", pattern: /醒发|发至.*倍/ },
  { operationType: "ferment", pattern: /发酵/ },
  { operationType: "drain", pattern: /沥干|控干|滤干/ },
  { operationType: "strain", pattern: /过滤|滤出|过筛|细筛|筛入/ },
  { operationType: "blend", pattern: /搅拌机|料理机|打成泥|打碎/ },
  { operationType: "deep-fry", pattern: /油炸|炸至|下油锅炸/ },
  { operationType: "pan-fry", pattern: /煎至|煎熟|煎香|煎上色|煎\s*\d|下锅炒|入锅炒|炒至|炒香|炒熟/ },
  { operationType: "steam", pattern: /蒸至|蒸熟|上锅蒸|蒸\s*\d/ },
  { operationType: "bake", pattern: /烘烤|烤箱|烤至|入炉/ },
  { operationType: "roast", pattern: /烤制|炙烤/ },
  { operationType: "grill", pattern: /烧烤|烤架|炭火/ },
  { operationType: "boil", pattern: /煮沸|烧开|大火煮开|沸腾/ },
  { operationType: "simmer", pattern: /小火.*煮|炖煮|焖煮|煨|保持微沸/ },
  { operationType: "brew", pattern: /冲泡|注入.*热水|浸泡.*分钟/ },
  { operationType: "extract", pattern: /萃取|压出.*咖啡|浓缩咖啡/ },
  { operationType: "chill", pattern: /冷藏|冰镇|降温|冷却/ },
  { operationType: "freeze", pattern: /冷冻|冻至/ },
  { operationType: "toss", pattern: /颠锅|大火翻炒|快速翻炒/ },
  { operationType: "stir", pattern: /翻炒|搅拌|搅匀|持续搅|轻翻/ },
  { operationType: "season", pattern: /调味|加盐|加入.*糖|尝.*味|淋入.*酱|倒入.*酱/ },
  { operationType: "mix", pattern: /拌匀|混合|拌入|拌上|抓匀/ },
  { operationType: "rest", pattern: /静置|浸泡|放凉|回温/ },
  { operationType: "set-heat", pattern: /热锅|锅.*烧热|预热|加热至/ },
  { operationType: "assemble", pattern: /铺一层|分层|组合|摆放|排成|装入/ },
  { operationType: "garnish", pattern: /点缀|撒上|饰以/ },
  { operationType: "serve", pattern: /装盘|上桌|分装|倒入杯|分入杯|切块.*食用|食用前/ },
];

const waitingOperations = new Set<GameOperationId>([
  "marinate", "rest", "proof", "ferment", "boil", "simmer", "steam", "deep-fry", "bake", "roast", "grill", "brew", "extract", "chill", "freeze",
]);

export function migratePublishedItemToGameRecipe(
  item: CulinaryItem,
  context: MigrationContext,
): GameRecipeV1 {
  const ingredientById = new Map(context.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const portions = createPortions(item, ingredientById);
  const { nodes, unresolvedMappings: graphMappings } = createOperationGraph(item, portions, ingredientById);
  const unresolvedMappings = [
    ...graphMappings,
    ...(!("inputs" in item.preparation)
      ? portions.flatMap((portion) => [
          `portion:${portion.portionId}:identity`,
          `portion:${portion.portionId}:quantity`,
          `portion:${portion.portionId}:nutrition`,
        ])
      : []),
  ];
  const simulationProfile = deriveSimulationProfile(nodes);
  const existingRisk = context.governanceRegistry.riskClassifications.find((entry) => entry.itemId === item.id);
  const nutritionProfile = createNutritionProfile(item, portions, ingredientById);
  const draft: GameRecipeV1 = {
    schemaVersion: "cooking-lab-game-recipe-v1",
    artifactVersion: "",
    recipeId: item.id,
    slug: item.slug,
    sourceCulinaryItemId: item.id,
    itemType: item.itemType,
    eligibility: "draft",
    simulationProfile,
    servings: getServings(item),
    yield: getYield(item),
    ingredientPortions: portions,
    operationGraph: { nodes },
    nutritionProfile,
    scenarios: [],
    rights: {
      artifactIds: [],
      usageDecisionIds: [],
      sourceIds: [],
      evidenceIds: [],
      intendedUse: "game-commercial-ready",
    },
    governance: {
      riskLevel: existingRisk?.level ?? "low",
      riskClassificationId: "",
      reviewAttestationIds: [],
    },
    authoring: {
      method: "deterministic-migration",
      generatorVersion: currentGameRecipeMigrationVersion,
      containsGeneratedExpression: false,
      unresolvedMappings,
    },
  };
  draft.scenarios = createScenarios(draft);
  unresolvedMappings.push(...draft.scenarios.map((scenario) => `scenario:${scenario.scenarioId}:expected-outcome`));
  draft.authoring.unresolvedMappings = [...new Set(unresolvedMappings)].sort();
  draft.artifactVersion = createGameRecipeArtifactVersion(draft);
  draft.scenarios = draft.scenarios.map((scenario) => ({ ...scenario, baselineArtifactVersion: draft.artifactVersion }));
  return draft;
}

function createPortions(
  item: CulinaryItem,
  ingredientById: ReadonlyMap<string, Ingredient>,
): GameIngredientPortionV1[] {
  if (!("inputs" in item.preparation)) {
    return [{
      portionId: `${item.id}-portion-01`,
      ingredientId: `${item.id}-generic`,
      initialState: "ready-to-serve",
      sourceQuantity: { amount: 100, unit: "g", conversionRecordId: "unresolved-serving-guidance-quantity" },
      massG: 100,
      volumeMl: 100,
      optional: false,
      phase: "service",
      allowedSubstitutionIngredientIds: [],
      nutritionProvenanceId: `pending:${item.id}-generic`,
    }];
  }
  return item.preparation.inputs.map((input, index) => {
    const ingredient = ingredientById.get(input.ingredientId);
    if (!ingredient) throw new Error(`Game migration missing ingredient ${input.ingredientId} for ${item.id}`);
    return {
      portionId: `${item.id}-portion-${String(index + 1).padStart(2, "0")}`,
      ingredientId: input.ingredientId,
      initialState: inferIngredientState(input.ingredientId),
      sourceQuantity: {
        amount: input.amount,
        unit: input.unit,
        conversionRecordId: input.unit === "g" ? "canonical-grams-v1" : input.unit === "kg" ? "kilograms-to-grams-v1" : `${input.ingredientId}:${input.unit}:weight-v1`,
      },
      massG: round(toGrams(input.amount, input.unit, ingredient)),
      ...(input.unit === "ml" ? { volumeMl: round(input.amount) } : {}),
      optional: input.optional,
      phase: "main",
      allowedSubstitutionIngredientIds: [],
      nutritionProvenanceId: ingredient.nutritionProvenanceId,
    };
  });
}

function createOperationGraph(
  item: CulinaryItem,
  portions: readonly GameIngredientPortionV1[],
  ingredientById: ReadonlyMap<string, Ingredient>,
): { nodes: GameOperationNodeV1[]; unresolvedMappings: string[] } {
  const preparation = item.preparation;
  if (!("steps" in preparation)) {
    const node: GameOperationNodeV1 = {
      nodeId: `${item.id}-op-001-serve`,
      operationType: "serve",
      dependsOn: [],
      inputPortionIds: portions.map((portion) => portion.portionId),
      outputStateIds: [`${item.id}-served`],
      equipmentId: "toolIds" in preparation ? selectEquipment("serve", preparation.toolIds) : undefined,
      activeDurationMs: "estimatedMinutes" in preparation ? preparation.estimatedMinutes * 60_000 : 0,
      waitDurationMs: 0,
      parameters: {},
      targetStates: [],
      criticality: "completion",
    };
    return {
      nodes: [node],
      unresolvedMappings: [
        ...(node.equipmentId ? [] : [`operation:${node.nodeId}:equipment`]),
        ...(node.activeDurationMs > 0 ? [] : [`operation:${node.nodeId}:duration`]),
      ],
    };
  }

  const unresolvedMappings: string[] = [];
  const portionStep = new Map(portions.map((portion) => {
    const stepOrder = findIngredientStep(preparation.steps, portion.ingredientId, ingredientById);
    if (stepOrder === undefined) unresolvedMappings.push(`portion:${portion.portionId}:source-step`);
    return [portion.portionId, stepOrder] as const;
  }));
  const nodes: GameOperationNodeV1[] = [];
  let previousNodeId: string | undefined;
  let sequence = 0;
  const appendNode = (node: Omit<GameOperationNodeV1, "nodeId" | "dependsOn">) => {
    sequence += 1;
    const nodeId = `${item.id}-op-${String(sequence).padStart(3, "0")}-${node.operationType}`;
    nodes.push({ ...node, nodeId, dependsOn: previousNodeId ? [previousNodeId] : [] });
    previousNodeId = nodeId;
  };

  for (const step of [...preparation.steps].sort((left, right) => left.order - right.order)) {
    const instruction = getStepInstruction(step);
    const matches = findOperationMatches(instruction, preparation.kind);
    if (!matches.length) unresolvedMappings.push(`source-step:${step.order}:operation`);
    const stepPortions = portions.filter((portion) => portionStep.get(portion.portionId) === step.order);
    const preparatory = matches.filter((match) => ["wash", "rinse", "peel", "slice", "dice", "mince", "crush", "grind"].includes(match.operationType));
    const processing = matches.filter((match) => !preparatory.includes(match));
    const operations = [...preparatory, ...processing];
    const durationMs = Math.max(0, Math.round((step.durationMinutes ?? 0) * 60_000));
    const perOperationDuration = operations.length ? Math.round(durationMs / operations.length) : durationMs;

    preparatory.forEach((match) => appendNode(createNodeBody(
      item.id,
      preparation.toolIds,
      step,
      instruction,
      match.operationType,
      stepPortions.map((portion) => portion.portionId),
      perOperationDuration,
    )));
    for (const portion of stepPortions) {
      appendNode({
        operationType: "add",
        inputPortionIds: [portion.portionId],
        outputStateIds: [`${portion.portionId}-added`],
        equipmentId: selectEquipment("add", preparation.toolIds),
        activeDurationMs: 1_000,
        waitDurationMs: 0,
        parameters: { quantityG: portion.massG },
        targetStates: [],
        criticality: "completion",
        sourceStepOrder: step.order,
      });
    }
    processing.forEach((match) => appendNode(createNodeBody(item.id, preparation.toolIds, step, instruction, match.operationType, stepPortions.map((portion) => portion.portionId), perOperationDuration)));
  }
  if (!nodes.some((node) => node.operationType === "serve")) {
    appendNode({
      operationType: "serve",
      inputPortionIds: portions.map((portion) => portion.portionId),
      outputStateIds: [`${item.id}-served`],
      equipmentId: selectEquipment("serve", preparation.toolIds),
      activeDurationMs: 1_000,
      waitDurationMs: 0,
      parameters: {},
      targetStates: [],
      criticality: "completion",
      sourceStepOrder: preparation.steps.at(-1)?.order,
    });
  }
  for (const node of nodes) {
    const definition = gameOperationById.get(node.operationType);
    if (!definition) {
      unresolvedMappings.push(`operation:${node.nodeId}:definition`);
      continue;
    }
    if (definition.inputRequirement === "one-or-more" && !node.inputPortionIds.length) {
      unresolvedMappings.push(`operation:${node.nodeId}:inputs`);
    }
    if (definition.equipmentRequired && !node.equipmentId) {
      unresolvedMappings.push(`operation:${node.nodeId}:equipment`);
    }
    if (definition.requiredParameterGroups.some((group) => !group.some((key) => node.parameters[key] !== undefined))) {
      unresolvedMappings.push(`operation:${node.nodeId}:parameters`);
    }
    const hasRequiredDuration = definition.durationRequirement === "none"
      || (definition.durationRequirement === "active" && node.activeDurationMs > 0)
      || (definition.durationRequirement === "wait" && node.waitDurationMs > 0)
      || (definition.durationRequirement === "either" && node.activeDurationMs + node.waitDurationMs > 0);
    if (!hasRequiredDuration) unresolvedMappings.push(`operation:${node.nodeId}:duration`);
    if (definition.targetStateRequired && !node.targetStates.length) {
      unresolvedMappings.push(`operation:${node.nodeId}:targets`);
    }
    if (node.parameters.cutSizeMm !== undefined || node.parameters.uniformity !== undefined || node.parameters.strength !== undefined) {
      unresolvedMappings.push(`operation:${node.nodeId}:parameters-source`);
    }
    if (node.targetStates.length) unresolvedMappings.push(`operation:${node.nodeId}:targets-source`);
  }
  return { nodes, unresolvedMappings: [...new Set(unresolvedMappings)].sort() };
}

function createNodeBody(
  itemId: string,
  toolIds: readonly string[],
  step: PreparationStep,
  instruction: string,
  operationType: GameOperationId,
  inputPortionIds: string[],
  durationMs: number,
): Omit<GameOperationNodeV1, "nodeId" | "dependsOn"> {
  const waiting = waitingOperations.has(operationType);
  return {
    operationType,
    inputPortionIds,
    outputStateIds: [`${itemId}-step-${step.order}-${operationType}`],
    equipmentId: selectEquipment(operationType, toolIds),
    activeDurationMs: waiting ? 0 : durationMs,
    waitDurationMs: waiting ? durationMs : 0,
    parameters: inferParameters(operationType, instruction),
    targetStates: inferTargetStates(operationType),
    criticality: operationType === "serve" || operationType === "garnish" || operationType === "assemble" ? "completion" : "quality",
    sourceStepOrder: step.order,
  };
}

function findOperationMatches(instruction: string, preparationKind: string): OperationMatch[] {
  const matches = operationPatterns.flatMap(({ operationType, pattern }) => {
    const index = instruction.search(pattern);
    return index < 0 ? [] : [{ operationType, index }];
  }).sort((left, right) => left.index - right.index || left.operationType.localeCompare(right.operationType));
  const unique = matches.filter((match, index) => matches.findIndex((candidate) => candidate.operationType === match.operationType) === index);
  void preparationKind;
  return unique;
}

function selectEquipment(operationType: GameOperationId, toolIds: readonly string[]): string | undefined {
  const definition = gameOperationById.get(operationType);
  return definition?.compatibleEquipmentIds.find((toolId) => toolIds.includes(toolId));
}

function inferParameters(operationType: GameOperationId, instruction: string): GameOperationNodeV1["parameters"] {
  const temperature = instruction.match(/(\d{2,3})\s*°?C/i)?.[1];
  const heatLevel = /大火|高火/.test(instruction) ? 0.85 : /小火|低火/.test(instruction) ? 0.35 : /中火/.test(instruction) ? 0.6 : undefined;
  if (operationType === "slice") return { cutSizeMm: 8, uniformity: 0.85 };
  if (operationType === "dice") return { cutSizeMm: 12, uniformity: 0.85 };
  if (operationType === "mince") return { cutSizeMm: 3, uniformity: 0.75 };
  if (operationType === "grind") return { cutSizeMm: 2, uniformity: 0.8 };
  if (["stir", "mix", "whisk", "knead", "fold", "crush", "blend"].includes(operationType)) return { strength: 0.65 };
  if (operationType === "toss") return { strength: 0.95 };
  if (["set-heat", "boil", "simmer", "pan-fry", "deep-fry", "bake", "roast", "grill", "steam", "brew", "extract", "proof", "ferment", "chill", "freeze"].includes(operationType)) {
    return {
      ...(heatLevel === undefined || ["steam", "bake", "roast", "brew", "extract", "proof", "ferment", "chill", "freeze"].includes(operationType) ? {} : { heatLevel }),
      ...(temperature === undefined ? {} : { temperatureC: Number(temperature) }),
    };
  }
  return {};
}

function inferTargetStates(operationType: GameOperationId): GameTargetStateV1[] {
  if (["pan-fry", "deep-fry", "bake", "roast", "grill"].includes(operationType)) return [{ dimension: "browning", minimum: 0.45, maximum: 0.85, unit: "normalized" }, { dimension: "burn", maximum: 0.2, unit: "normalized" }];
  if (["boil", "simmer", "steam"].includes(operationType)) return [{ dimension: "doneness", minimum: 0.75, maximum: 1, unit: "normalized" }];
  if (["brew", "extract"].includes(operationType)) return [{ dimension: "bitterness", maximum: 0.7, unit: "normalized" }, { dimension: "aroma", minimum: 0.45, unit: "normalized" }];
  if (["slice", "dice", "mince", "grind", "shape"].includes(operationType)) return [{ dimension: "structural-integrity", minimum: 0.35, maximum: 0.95, unit: "normalized" }];
  if (["stir", "toss", "mix", "whisk", "fold", "knead"].includes(operationType)) return [{ dimension: "structural-integrity", minimum: 0.25, maximum: 0.95, unit: "normalized" }];
  if (operationType === "season") return [{ dimension: "salt", maximum: 0.8, unit: "normalized" }];
  return [];
}

function createScenarios(recipe: GameRecipeV1): GameRecipeScenarioV1[] {
  return recipe.operationGraph.nodes.flatMap((node) => {
    if (node.criticality === "completion") return [];
    const scenarios: GameRecipeScenarioV1[] = [{
      scenarioId: `${recipe.recipeId}-${node.nodeId}-omit`,
      baselineArtifactVersion: "",
      mutation: { type: "omit", targetNodeId: node.nodeId },
      expectedDeltas: expectedDeltasFor(node.operationType, "omit"),
      expectedFaultCodes: [`missing-${node.operationType}`],
      causeCodes: [`operation-omitted:${node.operationType}`],
      recoverability: ["ferment", "proof", "bake", "steam", "deep-fry"].includes(node.operationType) ? "terminal" : "partially-recoverable",
      nutritionEffect: "unchanged",
      applicableEngine: recipe.simulationProfile,
    }];
    if (node.waitDurationMs > 0) {
      scenarios.push({
        scenarioId: `${recipe.recipeId}-${node.nodeId}-short`,
        baselineArtifactVersion: "",
        mutation: { type: "duration-too-short", targetNodeId: node.nodeId, scalar: 0.5 },
        expectedDeltas: expectedDeltasFor(node.operationType, "duration-too-short"),
        expectedFaultCodes: ["underprocessed"],
        causeCodes: [`duration-short:${node.operationType}`],
        recoverability: "recoverable",
        nutritionEffect: "unchanged",
        applicableEngine: recipe.simulationProfile,
      });
    }
    if (node.parameters.heatLevel !== undefined || node.parameters.temperatureC !== undefined) {
      scenarios.push({
        scenarioId: `${recipe.recipeId}-${node.nodeId}-hot`,
        baselineArtifactVersion: "",
        mutation: { type: "heat-too-high", targetNodeId: node.nodeId, scalar: 1.25 },
        expectedDeltas: expectedDeltasFor(node.operationType, "heat-too-high"),
        expectedFaultCodes: ["overcooked-or-burnt"],
        causeCodes: [`heat-high:${node.operationType}`],
        recoverability: "partially-recoverable",
        nutritionEffect: "requires-retention-model",
        applicableEngine: recipe.simulationProfile,
      });
    }
    return scenarios;
  });
}

function expectedDeltasFor(operationType: GameOperationId, mutation: "omit" | "duration-too-short" | "heat-too-high") {
  if (mutation === "heat-too-high") return [
    { dimension: "browning" as const, direction: "increase" as const, confidence: "rule-based" as const },
    { dimension: "burn" as const, direction: "increase" as const, confidence: "rule-based" as const },
    { dimension: "wateriness" as const, direction: "decrease" as const, confidence: "rule-based" as const },
  ];
  if (["boil", "simmer", "steam", "pan-fry", "deep-fry", "bake", "roast", "grill"].includes(operationType)) return [
    { dimension: "doneness" as const, direction: "decrease" as const, confidence: "rule-based" as const },
    { dimension: "wateriness" as const, direction: "increase" as const, confidence: "rule-based" as const },
  ];
  if (["brew", "extract"].includes(operationType)) return [
    { dimension: "aroma" as const, direction: "decrease" as const, confidence: "rule-based" as const },
    { dimension: "bitterness" as const, direction: mutation === "duration-too-short" ? "decrease" as const : "unchanged" as const, confidence: "rule-based" as const },
  ];
  if (operationType === "season") return [{ dimension: "salt" as const, direction: "decrease" as const, confidence: "rule-based" as const }];
  return [{ dimension: "structural-integrity" as const, direction: "decrease" as const, confidence: "rule-based" as const }];
}

function createNutritionProfile(
  item: CulinaryItem,
  portions: readonly GameIngredientPortionV1[],
  ingredientById: ReadonlyMap<string, Ingredient>,
): GameNutritionProfileV1 {
  let total = emptyNutrition();
  const provenance = portions.map((portion) => {
    const ingredient = ingredientById.get(portion.ingredientId);
    if (ingredient) total = addNutrition(total, scaleNutrition(ingredient.nutritionPer100g, portion.massG / 100));
    return {
      ingredientId: portion.ingredientId,
      nutritionProvenanceId: portion.nutritionProvenanceId,
      provider: ingredient ? "Cooking Lab editorial estimate" : "pending",
      datasetVersion: ingredient ? "demo-estimated-v1" : "pending",
      upstreamRecordId: ingredient?.id ?? `pending:${portion.ingredientId}`,
      basis: "per-100g" as const,
      ingredientState: portion.initialState,
      conversionMethod: ingredient ? "existing unit weight to grams; ingredient-sum-v1" : "pending",
      yieldFactor: 1,
      retentionFactor: 1,
      accessedAt: nutritionAccessDate,
    };
  });
  if (!("inputs" in item.preparation) && item.nutrition.applicability === "applicable" && item.nutrition.source === "declared-estimate") {
    total = item.nutrition.basis === "per-serving" ? scaleNutrition(item.nutrition.value, getServings(item)) : item.nutrition.value;
  }
  total = roundNutrition(total);
  return {
    method: "ingredient-sum-v1",
    servings: getServings(item),
    total,
    perServing: roundNutrition(scaleNutrition(total, 1 / getServings(item))),
    provenance,
    estimated: true,
  };
}

function getServings(item: CulinaryItem): number {
  if ("yield" in item.preparation && item.preparation.yield.unit === "serving") return item.preparation.yield.amount;
  return 1;
}

function getYield(item: CulinaryItem): GameRecipeV1["yield"] {
  if ("yield" in item.preparation) return item.preparation.yield;
  return { amount: 1, unit: "serving" };
}

function findIngredientStep(
  steps: readonly PreparationStep[],
  ingredientId: string,
  ingredientById: ReadonlyMap<string, Ingredient>,
): number | undefined {
  const ingredient = ingredientById.get(ingredientId);
  const terms = [ingredient?.name, ...(ingredient?.aliases ?? []), ...ingredientId.split("-")].filter((term): term is string => Boolean(term && term.length > 1));
  const matched = steps.find((step) => terms.some((term) => getStepInstruction(step).includes(term)));
  return matched?.order;
}

function getStepInstruction(step: PreparationStep): string {
  return step.content.entries.find((entry) => entry.locale === step.content.defaultLocale)?.value.instruction
    ?? step.content.entries[0].value.instruction;
}

function inferIngredientState(ingredientId: string): GameIngredientPortionV1["initialState"] {
  if (/^(cooked|brewed|roasted|canned)-/.test(ingredientId)) return "cooked";
  if (/(water|milk|juice|sauce|vinegar|oil|espresso)$/.test(ingredientId)) return "liquid";
  if (/^(dry-|dried-)|(-flour|-rice|-noodles|-tea-leaf|-powder|-sugar|-salt)$/.test(ingredientId)) return "dry";
  return "raw";
}

function deriveSimulationProfile(nodes: readonly GameOperationNodeV1[]): GameSimulationProfile {
  if (nodes.every((node) => ["assemble", "garnish", "serve"].includes(node.operationType))) return "data-only";
  const goal1Ops = new Set<GameOperationId>(["slice", "dice", "mince", "add", "set-heat", "pan-fry", "stir", "toss", "season", "serve"]);
  return nodes.every((node) => goal1Ops.has(node.operationType)) ? "cat-kitchen-goal1-v1" : "requires-cat-kitchen-v2";
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
