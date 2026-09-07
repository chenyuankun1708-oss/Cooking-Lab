import type {
  GameIngredientCatalogV1,
  GameOperationDefinitionV1,
  GameOperationNodeV1,
  GameRecipeV1,
} from "@/types/game-recipe";

export const catKitchenGoal1AdapterContractVersion = "cat-kitchen-goal1-compiler-v1" as const;

export type CatKitchenGoal1Action = "CUT" | "ADD" | "SET_HEAT" | "WAIT" | "STIR" | "SEASON" | "PLATE";

export interface CatKitchenGoal1Command {
  timestampMs: number;
  action: CatKitchenGoal1Action;
  targetId: string;
  definitionId: string;
  amount: number;
  value: number;
  strength: number;
}

export interface CatKitchenGoal1Compilation {
  adapterContractVersion: typeof catKitchenGoal1AdapterContractVersion;
  recipeId: string;
  recipeArtifactVersion: string;
  commands: CatKitchenGoal1Command[];
}

export class CatKitchenGoal1CompileError extends Error {
  constructor(recipeId: string, nodeId: string, message: string) {
    super(`${recipeId}:${nodeId}: ${message}`);
    this.name = "CatKitchenGoal1CompileError";
  }
}

/**
 * Compiles only the frozen Goal 1 command surface. Any missing mapping, state,
 * parameter, or ingredient calibration fails closed; callers must not silently
 * reinterpret that recipe as Goal 1 compatible.
 */
export function compileCatKitchenGoal1Recipe(
  recipe: GameRecipeV1,
  ingredients: GameIngredientCatalogV1,
  operations: readonly GameOperationDefinitionV1[],
): CatKitchenGoal1Compilation {
  if (recipe.simulationProfile !== "cat-kitchen-goal1-v1") {
    throw new CatKitchenGoal1CompileError(recipe.recipeId, "simulationProfile", "recipe does not target the Goal 1 engine");
  }

  const portions = new Map(recipe.ingredientPortions.map((portion) => [portion.portionId, portion]));
  const ingredientById = new Map(ingredients.ingredients.map((ingredient) => [ingredient.ingredientId, ingredient]));
  const operationById = new Map(operations.map((operation) => [operation.id, operation]));
  const orderedNodes = topologicalNodes(recipe);
  const completionByNode = new Map<string, number>();
  const commands: CatKitchenGoal1Command[] = [];

  for (const node of orderedNodes) {
    const definition = operationById.get(node.operationType);
    if (!definition) throw compileError(recipe, node, "operation is absent from the versioned catalog");
    if (definition.compatibility === "requires-engine-v2") {
      throw compileError(recipe, node, "operation requires Cat Kitchen engine v2");
    }
    const startedAt = Math.max(0, ...node.dependsOn.map((dependency) => completionByNode.get(dependency) ?? 0));
    if (definition.compatibility === "macro-supported") {
      commands.push(...compileMacro(recipe, node, definition, startedAt, portions, ingredientById));
    } else {
      if (!definition.legacyCommand) throw compileError(recipe, node, "operation has no Goal 1 command mapping");
      commands.push(...compileDirect(recipe, node, definition.legacyCommand, startedAt, portions, ingredientById));
    }
    completionByNode.set(node.nodeId, startedAt + node.activeDurationMs + node.waitDurationMs);
  }

  return {
    adapterContractVersion: catKitchenGoal1AdapterContractVersion,
    recipeId: recipe.recipeId,
    recipeArtifactVersion: recipe.artifactVersion,
    commands: commands
      .map((command, index) => ({ command, index }))
      .sort((left, right) => left.command.timestampMs - right.command.timestampMs || left.index - right.index)
      .map(({ command }) => command),
  };
}

function compileDirect(
  recipe: GameRecipeV1,
  node: GameOperationNodeV1,
  action: CatKitchenGoal1Action,
  timestampMs: number,
  portions: ReadonlyMap<string, GameRecipeV1["ingredientPortions"][number]>,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
): CatKitchenGoal1Command[] {
  switch (action) {
    case "CUT": {
      const portion = requireSinglePortion(recipe, node, portions, ingredientById);
      const cutSize = requireRange(recipe, node, "cutSizeMm", node.parameters.cutSizeMm, 1, 100);
      const uniformity = requireRange(recipe, node, "uniformity", node.parameters.uniformity, 0, 1);
      requireRange(recipe, node, "massG", portion.massG, Number.EPSILON, 5_000);
      return [command(timestampMs, action, portion.portionId, portion.ingredientId, portion.massG, cutSize, uniformity)];
    }
    case "ADD": {
      const portion = requireSinglePortion(recipe, node, portions, ingredientById);
      const amount = requireRange(recipe, node, "quantityG", node.parameters.quantityG, Number.EPSILON, 5_000);
      if (Math.abs(amount - portion.massG) > 0.001) throw compileError(recipe, node, "ADD quantityG must equal the canonical portion mass");
      return [command(timestampMs, action, portion.portionId, portion.ingredientId, amount)];
    }
    case "SET_HEAT":
      return [command(timestampMs, action, "", "", 0, requireRange(recipe, node, "heatLevel", node.parameters.heatLevel, 0, 1))];
    case "WAIT": {
      const end = timestampMs + node.activeDurationMs + node.waitDurationMs;
      if (end <= timestampMs) throw compileError(recipe, node, "WAIT requires a positive duration");
      return [command(end, action)];
    }
    case "STIR":
      return [command(timestampMs, action, "", "", 0, 0, requireRange(recipe, node, "strength", node.parameters.strength, 0, 1))];
    case "SEASON": {
      if (!node.inputPortionIds.length) throw compileError(recipe, node, "SEASON requires at least one seasoning portion");
      return node.inputPortionIds.map((portionId) => {
        const portion = requirePortion(recipe, node, portionId, portions, ingredientById);
        const amount = requireRange(recipe, node, "seasoning mass", portion.massG, Number.EPSILON, 1_000);
        return command(timestampMs, action, "", portion.ingredientId, amount);
      });
    }
    case "PLATE":
      return [command(timestampMs, action)];
  }
}

function compileMacro(
  recipe: GameRecipeV1,
  node: GameOperationNodeV1,
  definition: GameOperationDefinitionV1,
  timestampMs: number,
  portions: ReadonlyMap<string, GameRecipeV1["ingredientPortions"][number]>,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
): CatKitchenGoal1Command[] {
  if (definition.id !== "pan-fry") throw compileError(recipe, node, "macro has no deterministic Goal 1 expansion");
  if (!node.inputPortionIds.length) throw compileError(recipe, node, "pan-fry requires at least one input portion");
  const heatLevel = requireRange(recipe, node, "heatLevel", node.parameters.heatLevel, 0, 1);
  const duration = node.activeDurationMs + node.waitDurationMs;
  if (!Number.isInteger(duration) || duration <= 0) throw compileError(recipe, node, "pan-fry requires a positive integer duration");
  const inputs = node.inputPortionIds.map((portionId) => requirePortion(recipe, node, portionId, portions, ingredientById));
  const totalMass = inputs.reduce((sum, portion) => sum + portion.massG, 0);
  const capacity = requireRange(recipe, node, "capacityG", node.parameters.capacityG, 1, 10_000);
  if (totalMass > capacity) throw compileError(recipe, node, "pan-fry inputs exceed declared capacity");
  return [
    command(timestampMs, "SET_HEAT", "", "", 0, heatLevel),
    ...inputs.map((portion) => command(timestampMs, "ADD", portion.portionId, portion.ingredientId, portion.massG)),
    command(timestampMs + duration, "WAIT"),
  ];
}

function requireSinglePortion(
  recipe: GameRecipeV1,
  node: GameOperationNodeV1,
  portions: ReadonlyMap<string, GameRecipeV1["ingredientPortions"][number]>,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
) {
  if (node.inputPortionIds.length !== 1) throw compileError(recipe, node, "operation requires exactly one input portion");
  return requirePortion(recipe, node, node.inputPortionIds[0], portions, ingredientById);
}

function requirePortion(
  recipe: GameRecipeV1,
  node: GameOperationNodeV1,
  portionId: string,
  portions: ReadonlyMap<string, GameRecipeV1["ingredientPortions"][number]>,
  ingredientById: ReadonlyMap<string, GameIngredientCatalogV1["ingredients"][number]>,
) {
  const portion = portions.get(portionId);
  if (!portion) throw compileError(recipe, node, `unknown portion ${portionId}`);
  const ingredient = ingredientById.get(portion.ingredientId);
  if (!ingredient) throw compileError(recipe, node, `unknown ingredient ${portion.ingredientId}`);
  if (!ingredient.simulationProfile) throw compileError(recipe, node, `ingredient ${portion.ingredientId} lacks Goal 1 simulation calibration`);
  return portion;
}

function requireRange(
  recipe: GameRecipeV1,
  node: GameOperationNodeV1,
  name: string,
  value: number | undefined,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw compileError(recipe, node, `${name} must be within [${minimum}, ${maximum}]`);
  }
  return value;
}

function topologicalNodes(recipe: GameRecipeV1): GameOperationNodeV1[] {
  const nodes = new Map(recipe.operationGraph.nodes.map((node) => [node.nodeId, node]));
  const result: GameOperationNodeV1[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: GameOperationNodeV1) => {
    if (visiting.has(node.nodeId)) throw compileError(recipe, node, "operation graph contains a cycle");
    if (visited.has(node.nodeId)) return;
    visiting.add(node.nodeId);
    for (const dependencyId of node.dependsOn) {
      const dependency = nodes.get(dependencyId);
      if (!dependency) throw compileError(recipe, node, `unknown dependency ${dependencyId}`);
      visit(dependency);
    }
    visiting.delete(node.nodeId);
    visited.add(node.nodeId);
    result.push(node);
  };
  recipe.operationGraph.nodes.forEach(visit);
  return result;
}

function command(
  timestampMs: number,
  action: CatKitchenGoal1Action,
  targetId = "",
  definitionId = "",
  amount = 0,
  value = 0,
  strength = 1,
): CatKitchenGoal1Command {
  return { timestampMs, action, targetId, definitionId, amount, value, strength };
}

function compileError(recipe: GameRecipeV1, node: GameOperationNodeV1, message: string) {
  return new CatKitchenGoal1CompileError(recipe.recipeId, node.nodeId, message);
}
