import {
  createGameCrossCheckAssertionHash,
  createGameSourceFactBundleVersion,
  createGameSourceFactHash,
} from "./game-source-fact-validation";
import {
  gameSourceFactBundleSchemaVersion,
  type GameFactLocatorV1,
  type GameSourceFactBundleV1,
  type RationalQuantityV1,
} from "@/types/game-source-facts";
import type {
  LocCrossCheckV1,
  LocRecipeCandidateV1,
  LocSourceLocatorV1,
  LocSourceRegistryV1,
} from "@/types/loc-recipe-source";
import { createLocSourceRegistrySliceVersion } from "./loc-source-registry-version";

export const locSourceFactCompilerVersion = "m13-loc-source-facts-v1" as const;

export function createLocSourceFactBundle(
  candidate: LocRecipeCandidateV1,
  input: { sourceRegistry: LocSourceRegistryV1; sourceCacheVersion: string; compilerVersion?: string },
): GameSourceFactBundleV1 {
  const ingredientFacts = candidate.extractedFacts.ingredients.map((fact, index) => {
    const locator = toFactLocator(candidate.primarySource, fact.line, fact.line);
    const quantity: RationalQuantityV1 = {
      numerator: fact.quantityNumerator,
      denominator: fact.quantityDenominator,
      rawToken: fact.rawQuantityToken,
      unitToken: fact.unit,
    };
    const value = {
      factId: `${candidate.candidateId}-ingredient-${String(index + 1).padStart(2, "0")}`,
      locator,
      phrase: fact.ingredient,
      quantity,
      sourceLineSha256: fact.lineSha256,
      factSha256: "",
    };
    return {
      ...value,
      factSha256: createGameSourceFactHash({
        locator: value.locator,
        phrase: value.phrase,
        stateToken: null,
        quantity: value.quantity,
        sourceLineSha256: value.sourceLineSha256,
      }),
    };
  });

  const methodFacts = candidate.extractedFacts.methodFacts.map((fact) => {
    const locator = toFactLocator(candidate.primarySource, fact.line, fact.line);
    const durationMinutes = fact.durationRational ? {
      numerator: fact.durationRational.numerator,
      denominator: fact.durationRational.denominator,
      rawToken: fact.durationRational.rawToken,
      unitToken: "minute",
    } : undefined;
    const value = {
      factId: `${candidate.candidateId}-${fact.factId}`,
      locator,
      order: fact.order,
      operationToken: fact.operation,
      ingredientFactIds: [] as string[],
      ...(durationMinutes ? { durationMinutes } : {}),
      ...(fact.qualitativeHeatToken ? { qualitativeHeatToken: fact.qualitativeHeatToken } : {}),
      ...(fact.equipmentToken ? { equipmentToken: fact.equipmentToken } : {}),
      sourceLineSha256: fact.lineSha256,
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
        qualitativeHeatToken: value.qualitativeHeatToken ?? null,
        equipmentToken: value.equipmentToken ?? null,
        parameterValues: null,
        sourceLineSha256: value.sourceLineSha256,
      }),
    };
  });

  const draft: GameSourceFactBundleV1 = {
    schemaVersion: gameSourceFactBundleSchemaVersion,
    bundleId: `source-facts-${candidate.candidateId}`,
    bundleVersion: "",
    sourceRegistryVersion: createLocSourceRegistrySliceVersion(input.sourceRegistry, [
      candidate.primarySource.documentId,
      ...candidate.crossChecks.map((source) => source.documentId),
    ]),
    sourceCacheVersion: input.sourceCacheVersion,
    compilerVersion: input.compilerVersion ?? locSourceFactCompilerVersion,
    candidateId: candidate.candidateId,
    title: candidate.title,
    primarySource: toFactLocator(candidate.primarySource),
    crossCheckSources: candidate.crossChecks.map((source) => toFactLocator(source)),
    crossCheckAssertions: candidate.crossChecks.map((source) => ({
      ...crossCheckAssertion(source),
    })),
    ingredientFacts,
    methodFacts,
    riskFlags: [
      ...candidate.extractionQuality.flags,
      "method-ingredient-binding-required",
    ].sort(),
    status: "draft",
  };
  return { ...draft, bundleVersion: createGameSourceFactBundleVersion(draft) };
}

function crossCheckAssertion(source: LocCrossCheckV1): GameSourceFactBundleV1["crossCheckAssertions"][number] {
  const value = {
    sourceDocumentId: source.documentId,
    pageId: source.pageId,
    startLine: source.startLine,
    endLine: source.endLine,
    matchBasis: source.matchBasis,
    normalizedTitle: source.normalizedTitle,
    ingredientTerms: [...source.ingredientTerms].sort(),
    operationTerms: [...source.operationTerms].sort(),
    sourceLineSha256s: [...source.sourceLineSha256s].sort(),
    sharedIngredientTerms: [...source.sharedIngredientTerms].sort(),
    sharedOperationTerms: [...source.sharedOperationTerms].sort(),
    factSha256: "",
  };
  return {
    ...value,
    factSha256: createGameCrossCheckAssertionHash(value),
  };
}

function toFactLocator(source: LocSourceLocatorV1 | LocCrossCheckV1, startLine = source.startLine, endLine = source.endLine): GameFactLocatorV1 {
  return {
    sourceDocumentId: source.documentId,
    workFamilyId: source.workFamilyId,
    itemUrl: source.itemUrl,
    derivativeSha256: source.ocrSha256,
    pageId: source.pageId,
    startLine,
    endLine,
  };
}
