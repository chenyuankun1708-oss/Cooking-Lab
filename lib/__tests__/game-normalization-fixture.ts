import { createHash } from "node:crypto";
import {
  createGameSourceFactBundleVersion,
  createGameSourceFactHash,
} from "@/lib/game-source-fact-validation";
import {
  gameNormalizationRegistrySchemaVersion,
  gameSourceFactBundleSchemaVersion,
  type GameNormalizationRegistryV1,
  type GameSourceFactBundleV1,
  type RationalQuantityV1,
} from "@/types/game-source-facts";
import type { GameRecipeV1 } from "@/types/game-recipe";

export function attachTestNormalizationTrace(recipe: GameRecipeV1): {
  normalizationRegistry: GameNormalizationRegistryV1;
  sourceFactBundles: GameSourceFactBundleV1[];
} {
  const ingredientFacts = recipe.ingredientPortions.map((portion, index) => {
    const locator = locatorFor(index + 10);
    const quantity = rational(portion.sourceQuantity.amount, portion.sourceQuantity.unit);
    const value = {
      factId: `fixture-ingredient-${String(index + 1).padStart(2, "0")}`,
      locator,
      phrase: portion.ingredientId,
      stateToken: portion.initialState,
      quantity,
      sourceLineSha256: sha256(`ingredient:${portion.portionId}`),
      factSha256: "",
    };
    return {
      ...value,
      factSha256: createGameSourceFactHash({
        locator: value.locator,
        phrase: value.phrase,
        stateToken: value.stateToken,
        quantity: value.quantity,
        sourceLineSha256: value.sourceLineSha256,
      }),
    };
  });
  const ingredientFactIdByPortion = new Map(recipe.ingredientPortions.map((portion, index) => [portion.portionId, ingredientFacts[index].factId]));
  const methodFacts = recipe.operationGraph.nodes.map((node, index) => {
    const locator = locatorFor(index + 100);
    const durationMs = node.activeDurationMs + node.waitDurationMs;
    const value = {
      factId: `fixture-method-${String(index + 1).padStart(2, "0")}`,
      locator,
      order: index + 1,
      operationToken: node.operationType,
      ingredientFactIds: node.inputPortionIds.map((id) => ingredientFactIdByPortion.get(id)!).filter(Boolean),
      ...(durationMs > 0 ? { durationMinutes: rational(durationMs, "millisecond", 60_000, "minute") } : {}),
      ...(node.equipmentId ? { equipmentToken: node.equipmentId } : {}),
      sourceLineSha256: sha256(`method:${node.nodeId}`),
      factSha256: "",
    };
    return {
      ...value,
      factSha256: createGameSourceFactHash({
        locator: value.locator,
        order: value.order,
        operationToken: value.operationToken,
        ingredientFactIds: value.ingredientFactIds,
        durationMinutes: value.durationMinutes ?? null,
        qualitativeHeatToken: null,
        equipmentToken: value.equipmentToken ?? null,
        sourceLineSha256: value.sourceLineSha256,
      }),
    };
  });
  const draft: GameSourceFactBundleV1 = {
    schemaVersion: gameSourceFactBundleSchemaVersion,
    bundleId: `fixture-source-facts-${recipe.recipeId}`,
    bundleVersion: "",
    candidateId: `fixture-candidate-${recipe.recipeId}`,
    title: recipe.recipeId,
    primarySource: locatorFor(1),
    crossCheckSources: [{ ...locatorFor(2), sourceDocumentId: "fixture-book-b", workFamilyId: "fixture-family-b", itemUrl: "https://www.loc.gov/item/200/" }],
    ingredientFacts,
    methodFacts,
    riskFlags: [],
    status: "normalization-ready",
  };
  const bundle = { ...draft, bundleVersion: createGameSourceFactBundleVersion(draft) };
  const normalizationRegistry: GameNormalizationRegistryV1 = {
    schemaVersion: gameNormalizationRegistrySchemaVersion,
    policyVersion: "fixture-normalization-v1",
    ingredientAliases: recipe.ingredientPortions.map((portion, index) => ({
      resolutionId: `fixture-ingredient-resolution-${String(index + 1).padStart(2, "0")}`,
      phrase: portion.ingredientId,
      stateToken: portion.initialState,
      ingredientId: portion.ingredientId,
      ingredientState: portion.initialState,
    })),
    operationRules: recipe.operationGraph.nodes.map((node, index) => ({
      ruleId: `fixture-operation-rule-${String(index + 1).padStart(2, "0")}`,
      operationToken: node.operationType,
      operationId: node.operationType,
    })),
    equipmentRules: [...new Set(recipe.operationGraph.nodes.flatMap((node) => node.equipmentId ? [node.equipmentId] : []))]
      .map((equipmentId, index) => ({
        ruleId: `fixture-equipment-rule-${String(index + 1).padStart(2, "0")}`,
        equipmentToken: equipmentId,
        equipmentId,
      })),
    heatDescriptors: [],
    targetStateRules: recipe.operationGraph.nodes.flatMap((node, nodeIndex) => node.targetStates.map((target, targetIndex) => ({
      ruleId: `fixture-target-rule-${String(nodeIndex + 1).padStart(2, "0")}-${String(targetIndex + 1).padStart(2, "0")}`,
      operationId: node.operationType,
      dimension: target.dimension,
      ...(target.minimum !== undefined ? { minimum: target.minimum } : {}),
      ...(target.maximum !== undefined ? { maximum: target.maximum } : {}),
    }))),
    mutationRules: recipe.scenarios.map((scenario, index) => {
      const node = recipe.operationGraph.nodes.find((entry) => entry.nodeId === scenario.mutation.targetNodeId) ?? recipe.operationGraph.nodes[0];
      const delta = scenario.expectedDeltas[0];
      return {
        ruleId: `fixture-mutation-rule-${String(index + 1).padStart(2, "0")}`,
        version: "fixture-v1",
        operationId: node.operationType,
        mutationType: scenario.mutation.type,
        direction: delta?.direction ?? "unchanged",
        targetDimension: delta?.dimension ?? "structural-integrity",
        provenanceSourceIds: ["fixture-source"],
      };
    }),
  };
  recipe.authoring.normalizationTrace = {
    sourceFactBundleId: bundle.bundleId,
    sourceFactBundleVersion: bundle.bundleVersion,
    normalizationPolicyVersion: normalizationRegistry.policyVersion,
    ingredientResolutionIds: normalizationRegistry.ingredientAliases.map((entry) => entry.resolutionId),
    operationRuleIds: normalizationRegistry.operationRules.map((entry) => entry.ruleId),
    equipmentRuleIds: normalizationRegistry.equipmentRules.map((entry) => entry.ruleId),
    heatDescriptorIds: [],
    targetStateRuleIds: normalizationRegistry.targetStateRules.map((entry) => entry.ruleId),
    mutationRuleIds: normalizationRegistry.mutationRules.map((entry) => entry.ruleId),
  };
  return { normalizationRegistry, sourceFactBundles: [bundle] };
}

function locatorFor(line: number) {
  return {
    sourceDocumentId: "fixture-book-a",
    workFamilyId: "fixture-family-a",
    itemUrl: "https://www.loc.gov/item/100/",
    derivativeSha256: sha256("fixture-derivative"),
    pageId: "1",
    startLine: line,
    endLine: line,
  };
}

function rational(value: number, rawUnit: string, denominator = 1, unitToken = rawUnit): RationalQuantityV1 {
  const scaled = Math.round(value);
  const divisor = gcd(scaled, denominator);
  return {
    numerator: scaled / divisor,
    denominator: denominator / divisor,
    rawToken: `${value} ${rawUnit}`,
    unitToken,
  };
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a || 1;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
