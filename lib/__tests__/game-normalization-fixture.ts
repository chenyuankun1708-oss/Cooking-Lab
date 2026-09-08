import { createHash } from "node:crypto";
import {
  createGameCrossCheckAssertionHash,
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
import type { GameRecipeV1, GameRightsRegistryV1 } from "@/types/game-recipe";
import { locPublicDomainStatement, type LocSourceRegistryV1 } from "@/types/loc-recipe-source";
import { createLocSourceRegistrySliceVersion } from "@/lib/loc-source-registry-version";
import {
  createLocSourceCacheVersion,
  locSourceCacheSchemaVersion,
  type LocSourceCacheManifestV1,
} from "@/lib/loc-source-cache";

export function attachTestNormalizationTrace(recipe: GameRecipeV1, rightsRegistry?: GameRightsRegistryV1): {
  normalizationRegistry: GameNormalizationRegistryV1;
  sourceFactBundles: GameSourceFactBundleV1[];
  locSourceRegistry: LocSourceRegistryV1;
  locSourceCacheManifest: LocSourceCacheManifestV1;
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
  recipe.operationGraph.nodes.forEach((node, index) => { node.sourceStepOrder = index + 1; });
  const methodFacts = recipe.operationGraph.nodes.map((node, index) => {
    const locator = locatorFor(index + 100);
    const durationMs = node.activeDurationMs || node.waitDurationMs;
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
        temperatureC: null,
        qualitativeHeatToken: null,
        equipmentToken: value.equipmentToken ?? null,
        parameterValues: null,
        sourceLineSha256: value.sourceLineSha256,
      }),
    };
  });
  const locSourceRegistry: LocSourceRegistryV1 = {
    schemaVersion: "cooking-lab-loc-source-registry-v1",
    provider: "Library of Congress",
    collectionUrl: "https://www.loc.gov/collections/selected-digitized-books/",
    rightsStatement: locPublicDomainStatement,
    rightsStatementUrl: "https://www.loc.gov/collections/selected-digitized-books/about-this-collection/rights-and-access/",
    accessedAt: "2026-09-08",
    documents: [
      fixtureLocDocument("a", "100", "fixture-family-a"),
      fixtureLocDocument("b", "200", "fixture-family-b"),
    ],
  };
  const draft: GameSourceFactBundleV1 = {
    schemaVersion: gameSourceFactBundleSchemaVersion,
    bundleId: `fixture-source-facts-${recipe.recipeId}`,
    bundleVersion: "",
    sourceRegistryVersion: createLocSourceRegistrySliceVersion(locSourceRegistry, ["fixture-book-a", "fixture-book-b"]),
    sourceCacheVersion: sha256("fixture-cache"),
    compilerVersion: "fixture-compiler-v1",
    candidateId: `fixture-candidate-${recipe.recipeId}`,
    title: recipe.recipeId,
    primarySource: { ...locatorFor(1), endLine: 999 },
    crossCheckSources: [{ ...locatorFor(2), sourceDocumentId: "fixture-book-b", workFamilyId: "fixture-family-b", itemUrl: "https://www.loc.gov/item/200/" }],
    crossCheckAssertions: [{
      sourceDocumentId: "fixture-book-b",
      pageId: "1",
      startLine: 2,
      endLine: 2,
      matchBasis: "exact-title",
      normalizedTitle: recipe.recipeId.replaceAll("-", " "),
      ingredientTerms: recipe.ingredientPortions.map((portion) => portion.ingredientId),
      operationTerms: [recipe.operationGraph.nodes[0].operationType],
      sourceLineSha256s: [sha256("fixture-cross-check-line")],
      sharedIngredientTerms: recipe.ingredientPortions.map((portion) => portion.ingredientId),
      sharedOperationTerms: [recipe.operationGraph.nodes[0].operationType],
      factSha256: "",
    }],
    ingredientFacts,
    methodFacts,
    riskFlags: [],
    status: "normalization-ready",
  };
  draft.crossCheckAssertions[0].factSha256 = createGameCrossCheckAssertionHash(draft.crossCheckAssertions[0]);
  const bundle = { ...draft, bundleVersion: createGameSourceFactBundleVersion(draft) };
  recipe.operationGraph.nodes.forEach((node, index) => {
    const parameter = node.parameters.temperatureC !== undefined ? "temperatureC"
      : node.parameters.heatLevel !== undefined ? "heatLevel"
        : undefined;
    if (parameter) {
      node.heatControl = {
        kind: "independently-calibrated",
        parameter,
        value: node.parameters[parameter]!,
        sourceFactId: methodFacts[index].factId,
        calibrationEvidenceId: recipe.rights.evidenceIds[0],
      };
    }
  });
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
      provenanceEvidenceIds: [recipe.rights.evidenceIds[0]],
    }))),
    mutationRules: recipe.scenarios.map((scenario, index) => {
      const node = recipe.operationGraph.nodes.find((entry) => entry.nodeId === scenario.mutation.targetNodeId) ?? recipe.operationGraph.nodes[0];
      return {
        ruleId: `fixture-mutation-rule-${String(index + 1).padStart(2, "0")}`,
        version: "fixture-v1",
        operationId: node.operationType,
        mutationSelector: structuredClone(scenario.mutation),
        expectedDeltas: scenario.expectedDeltas.map(({ dimension, direction }) => ({ dimension, direction })),
        expectedFaultCodes: [...scenario.expectedFaultCodes],
        causeCodes: [...scenario.causeCodes],
        recoverability: scenario.recoverability,
        nutritionEffect: scenario.nutritionEffect,
        applicableEngine: scenario.applicableEngine,
        provenanceEvidenceIds: [recipe.rights.evidenceIds[0]],
      };
    }),
  };
  recipe.authoring.normalizationTrace = {
    sourceFactBundleId: bundle.bundleId,
    sourceFactBundleVersion: bundle.bundleVersion,
    sourceRegistryVersion: bundle.sourceRegistryVersion,
    sourceCacheVersion: bundle.sourceCacheVersion,
    sourceCompilerVersion: bundle.compilerVersion,
    normalizationPolicyVersion: normalizationRegistry.policyVersion,
    ingredientBindings: recipe.ingredientPortions.map((portion, index) => ({
      ingredientFactId: ingredientFacts[index].factId,
      portionId: portion.portionId,
      resolutionId: normalizationRegistry.ingredientAliases[index].resolutionId,
      conversionRecordId: portion.sourceQuantity.conversionRecordId,
    })),
    methodBindings: recipe.operationGraph.nodes.map((node, index) => ({
      methodFactId: methodFacts[index].factId,
      nodeId: node.nodeId,
      operationRuleId: normalizationRegistry.operationRules[index].ruleId,
      ...(node.equipmentId ? {
        equipmentRuleId: normalizationRegistry.equipmentRules.find((rule) => rule.equipmentId === node.equipmentId)!.ruleId,
      } : {}),
      durationBindings: [
        ...(node.activeDurationMs > 0 ? [{
          target: "activeDurationMs" as const,
          basis: "source-exact" as const,
        }] : []),
        ...(node.waitDurationMs > 0 ? [{
          target: "waitDurationMs" as const,
          basis: node.activeDurationMs > 0 ? "independently-calibrated" as const : "source-exact" as const,
          ...(node.activeDurationMs > 0 ? { provenanceEvidenceId: recipe.rights.evidenceIds[0] } : {}),
        }] : []),
      ],
      parameterBindings: (Object.keys(node.parameters) as Array<keyof typeof node.parameters>)
        .filter((parameter) => parameter !== "temperatureC" && parameter !== "heatLevel")
        .map((parameter) => ({
          parameter,
          basis: "independently-calibrated" as const,
          provenanceEvidenceId: recipe.rights.evidenceIds[0],
        })),
      targetStateRuleIds: normalizationRegistry.targetStateRules
        .filter((rule) => rule.ruleId.startsWith(`fixture-target-rule-${String(index + 1).padStart(2, "0")}-`))
        .map((rule) => rule.ruleId),
    })),
    scenarioBindings: recipe.scenarios.map((scenario, index) => ({
      scenarioId: scenario.scenarioId,
      mutationRuleId: normalizationRegistry.mutationRules[index].ruleId,
      applicabilityFactIds: [
        ...(scenario.mutation.targetNodeId
          ? [methodFacts[recipe.operationGraph.nodes.findIndex((node) => node.nodeId === scenario.mutation.targetNodeId)].factId]
          : []),
        ...(scenario.mutation.destinationBeforeNodeId
          ? [methodFacts[recipe.operationGraph.nodes.findIndex((node) => node.nodeId === scenario.mutation.destinationBeforeNodeId)].factId]
          : []),
        ...(scenario.mutation.targetPortionId
          ? [ingredientFacts[recipe.ingredientPortions.findIndex((portion) => portion.portionId === scenario.mutation.targetPortionId)].factId]
          : []),
      ],
    })),
  };
  if (rightsRegistry) {
    recipe.rights.sourceIds.slice(0, 2).forEach((sourceId, index) => {
      const source = rightsRegistry.sources.find((entry) => entry.id === sourceId);
      if (source) source.locators.push({ kind: "url", url: `https://www.loc.gov/item/${index === 0 ? "100" : "200"}/`, accessedAt: "2026-09-08" });
    });
  }
  const cacheManifestDraft = {
    schemaVersion: locSourceCacheSchemaVersion,
    sourceAccessedAt: locSourceRegistry.accessedAt,
    documents: locSourceRegistry.documents.map((document) => ({
      documentId: document.documentId,
      itemJsonPath: `${document.documentId}/item.json`,
      itemJsonSha256: sha256(`item:${document.documentId}`),
      derivativePath: `${document.documentId}/source.text.json`,
      derivativeSha256: document.ocr.sha256,
      pageCount: 1,
    })),
  };
  const locSourceCacheManifest: LocSourceCacheManifestV1 = {
    ...cacheManifestDraft,
    cacheVersion: createLocSourceCacheVersion(cacheManifestDraft),
  };
  bundle.sourceCacheVersion = locSourceCacheManifest.cacheVersion;
  bundle.bundleVersion = createGameSourceFactBundleVersion(bundle);
  recipe.authoring.normalizationTrace.sourceCacheVersion = bundle.sourceCacheVersion;
  recipe.authoring.normalizationTrace.sourceFactBundleVersion = bundle.bundleVersion;
  return { normalizationRegistry, sourceFactBundles: [bundle], locSourceRegistry, locSourceCacheManifest };
}

function fixtureLocDocument(suffix: "a" | "b", itemId: string, workFamilyId: string) {
  return {
    documentId: `fixture-book-${suffix}`,
    itemId,
    itemUrl: `https://www.loc.gov/item/${itemId}/`,
    title: `Fixture book ${suffix}`,
    creators: [`Fixture creator ${suffix}`],
    publicationYear: 1900,
    workFamilyId,
    rightsStatement: locPublicDomainStatement,
    rightsStatementUrl: `https://www.loc.gov/item/${itemId}/`,
    ocr: {
      derivativeUrl: `https://tile.loc.gov/storage-services/public/fixture-${suffix}.text.json`,
      fileName: `fixture-${suffix}.text.json`,
      sha256: sha256("fixture-derivative"),
      format: "loc-page-text-json" as const,
    },
  };
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
