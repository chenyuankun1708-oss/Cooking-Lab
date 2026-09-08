import { createHash } from "node:crypto";
import { stableJson } from "./stable-json";
import {
  gameNormalizationRegistrySchemaVersion,
  gameSourceFactBundleSchemaVersion,
  type GameFactLocatorV1,
  type GameNormalizationRegistryV1,
  type GameSourceFactBundleV1,
  type RationalQuantityV1,
} from "@/types/game-source-facts";

export interface GameSourceFactIssue {
  code: "invalid-schema" | "invalid-source" | "missing-reference" | "duplicate-id" | "ambiguous-fact" | "stale-version";
  field: string;
  message: string;
}

export function createGameSourceFactBundleVersion(bundle: GameSourceFactBundleV1): string {
  const payload = { ...bundle } as Partial<GameSourceFactBundleV1>;
  delete payload.bundleVersion;
  return `clsfv1-${sha256(stableJson(payload)).slice(0, 24)}`;
}

export function createGameSourceFactHash(value: unknown): string {
  return sha256(stableJson(value));
}

export function evaluateGameSourceFactBundle(
  bundle: GameSourceFactBundleV1,
  registry: GameNormalizationRegistryV1,
): GameSourceFactIssue[] {
  const issues: GameSourceFactIssue[] = [];
  const report = (code: GameSourceFactIssue["code"], field: string, message: string) => issues.push({ code, field, message });
  validateRegistry(registry, report);
  if (bundle.schemaVersion !== gameSourceFactBundleSchemaVersion) report("invalid-schema", "schemaVersion", "Unsupported source fact bundle schema");
  if (!identifier(bundle.bundleId) || !identifier(bundle.candidateId) || !bundle.title.trim()) report("invalid-schema", "identity", "Bundle requires stable IDs and a title");
  if (!/^clv1-[a-f0-9]{16}$/.test(bundle.sourceRegistryVersion)
    || !sha256Value(bundle.sourceCacheVersion)
    || !bundle.compilerVersion.trim()) {
    report("invalid-source", "sourceRegistryVersion", "Bundle requires content-addressed source registry, cache and compiler versions");
  }
  if (bundle.bundleVersion !== createGameSourceFactBundleVersion(bundle)) report("stale-version", "bundleVersion", "Bundle version does not match its current facts");
  validateLocator(bundle.primarySource, "primarySource", report);
  if (!bundle.crossCheckSources.length) report("missing-reference", "crossCheckSources", "At least one independent recipe cross-check is required");
  for (const [index, locator] of bundle.crossCheckSources.entries()) {
    validateLocator(locator, `crossCheckSources.${index}`, report);
    if (locator.workFamilyId === bundle.primarySource.workFamilyId) report("invalid-source", `crossCheckSources.${index}.workFamilyId`, "Cross-check must use a different work family");
  }
  const crossCheckKeys = uniqueValues(bundle.crossCheckSources.map(crossCheckKey), "crossCheckSources", report);
  const assertionKeys = uniqueValues(bundle.crossCheckAssertions.map(crossCheckKey), "crossCheckAssertions", report);
  if (!sameStringSet(crossCheckKeys, assertionKeys)) {
    report("missing-reference", "crossCheckAssertions", "Cross-check assertions must exactly cover the declared cross-check sources");
  }
  for (const [index, assertion] of bundle.crossCheckAssertions.entries()) {
    const field = `crossCheckAssertions.${index}`;
    if (!crossCheckKeys.has(crossCheckKey(assertion))) report("missing-reference", `${field}.sourceDocumentId`, "Cross-check assertion must reference a declared source segment");
    if (new Set(assertion.sharedIngredientTerms).size !== assertion.sharedIngredientTerms.length || assertion.sharedIngredientTerms.some((term) => !term.trim())) {
      report("ambiguous-fact", `${field}.sharedIngredientTerms`, "Shared ingredient terms must be unique and non-empty");
    }
    if (new Set(assertion.sharedOperationTerms).size !== assertion.sharedOperationTerms.length || assertion.sharedOperationTerms.some((term) => !term.trim())) {
      report("ambiguous-fact", `${field}.sharedOperationTerms`, "Shared operation terms must be unique and non-empty");
    }
  }

  const ingredientIds = uniqueIds(bundle.ingredientFacts.map((fact) => fact.factId), "ingredientFacts", report);
  uniqueIds(bundle.methodFacts.map((fact) => fact.factId), "methodFacts", report);
  if (!bundle.ingredientFacts.length) report("missing-reference", "ingredientFacts", "At least one quantified ingredient fact is required");
  if (!bundle.methodFacts.length) report("missing-reference", "methodFacts", "At least one ordered method fact is required");
  for (const [index, fact] of bundle.ingredientFacts.entries()) {
    const field = `ingredientFacts.${index}`;
    validateLocator(fact.locator, `${field}.locator`, report);
    validatePrimaryFactLocator(fact.locator, bundle.primarySource, `${field}.locator`, report);
    validateRational(fact.quantity, `${field}.quantity`, report);
    if (!fact.phrase.trim() || !sha256Value(fact.factSha256)) report("invalid-schema", field, "Ingredient fact requires a phrase and SHA-256");
    if (!sha256Value(fact.sourceLineSha256)) report("invalid-source", `${field}.sourceLineSha256`, "Ingredient fact requires a source-line SHA-256");
    const expectedHash = createGameSourceFactHash({ locator: fact.locator, phrase: fact.phrase, stateToken: fact.stateToken ?? null, quantity: fact.quantity, sourceLineSha256: fact.sourceLineSha256 });
    if (fact.factSha256 !== expectedHash) report("stale-version", `${field}.factSha256`, "Ingredient fact hash does not match its structured source fact");
  }
  const ordered = [...bundle.methodFacts].sort((left, right) => left.order - right.order);
  if (ordered.some((fact, index) => fact.order !== index + 1)) report("ambiguous-fact", "methodFacts.order", "Method facts must use a contiguous one-based order");
  for (const [index, fact] of bundle.methodFacts.entries()) {
    const field = `methodFacts.${index}`;
    validateLocator(fact.locator, `${field}.locator`, report);
    validatePrimaryFactLocator(fact.locator, bundle.primarySource, `${field}.locator`, report);
    if (!fact.operationToken.trim() || !sha256Value(fact.factSha256)) report("invalid-schema", field, "Method fact requires an operation token and SHA-256");
    for (const factId of fact.ingredientFactIds) if (!ingredientIds.has(factId)) report("missing-reference", `${field}.ingredientFactIds`, `Missing ingredient fact ${factId}`);
    if (fact.durationMinutes) validateRational(fact.durationMinutes, `${field}.durationMinutes`, report);
    if (!sha256Value(fact.sourceLineSha256)) report("invalid-source", `${field}.sourceLineSha256`, "Method fact requires a source-line SHA-256");
    const expectedHash = createGameSourceFactHash({
      locator: fact.locator,
      order: fact.order,
      operationToken: fact.operationToken,
      ingredientFactIds: fact.ingredientFactIds,
      durationMinutes: fact.durationMinutes ?? null,
      temperatureC: fact.temperatureC ?? null,
      qualitativeHeatToken: fact.qualitativeHeatToken ?? null,
      equipmentToken: fact.equipmentToken ?? null,
      sourceLineSha256: fact.sourceLineSha256,
    });
    if (fact.factSha256 !== expectedHash) report("stale-version", `${field}.factSha256`, "Method fact hash does not match its structured source fact");
  }
  if (bundle.status === "normalization-ready") {
    if (bundle.riskFlags.length) report("ambiguous-fact", "riskFlags", "Normalization-ready bundles cannot retain risk flags");
    if (!bundle.crossCheckAssertions.some((assertion) => assertion.matchBasis === "exact-title" && assertion.sharedIngredientTerms.length >= 2 && assertion.sharedOperationTerms.length >= 1)) {
      report("ambiguous-fact", "crossCheckAssertions", "Normalization-ready bundles require an exact-title cross-check with at least two shared ingredient terms and one shared operation");
    }
    const aliases = new Set(registry.ingredientAliases.map((entry) => `${entry.phrase}\0${entry.stateToken ?? ""}`));
    for (const fact of bundle.ingredientFacts) {
      if (!aliases.has(`${fact.phrase}\0${fact.stateToken ?? ""}`)) report("missing-reference", `ingredientFacts.${fact.factId}`, "Ingredient fact has no exact alias resolution");
    }
    const operationTokens = new Set(registry.operationRules.map((entry) => entry.operationToken));
    const equipmentTokens = new Set(registry.equipmentRules.map((entry) => entry.equipmentToken));
    const heatTokens = new Set(registry.heatDescriptors.map((entry) => entry.sourceToken));
    for (const fact of bundle.methodFacts) {
      if (!fact.ingredientFactIds.length) report("ambiguous-fact", `methodFacts.${fact.factId}.ingredientFactIds`, "Normalization-ready method facts require explicit ingredient inputs");
      if (!operationTokens.has(fact.operationToken)) report("missing-reference", `methodFacts.${fact.factId}.operationToken`, "Method operation has no normalization rule");
      if (fact.equipmentToken && !equipmentTokens.has(fact.equipmentToken)) report("missing-reference", `methodFacts.${fact.factId}.equipmentToken`, "Equipment token has no normalization rule");
      if (fact.qualitativeHeatToken && !heatTokens.has(fact.qualitativeHeatToken)) report("missing-reference", `methodFacts.${fact.factId}.qualitativeHeatToken`, "Heat token has no qualitative descriptor");
    }
  }
  return issues.sort((left, right) => `${left.field}:${left.code}`.localeCompare(`${right.field}:${right.code}`));
}

function validatePrimaryFactLocator(
  locator: GameFactLocatorV1,
  primary: GameFactLocatorV1,
  field: string,
  report: (code: GameSourceFactIssue["code"], field: string, message: string) => void,
): void {
  if (locator.sourceDocumentId !== primary.sourceDocumentId
    || locator.workFamilyId !== primary.workFamilyId
    || locator.itemUrl !== primary.itemUrl
    || locator.derivativeSha256 !== primary.derivativeSha256
    || locator.pageId !== primary.pageId
    || locator.startLine < primary.startLine
    || locator.endLine > primary.endLine) {
    report("invalid-source", field, "Fact locator must remain inside the declared primary recipe source block");
  }
}

function validateRegistry(
  registry: GameNormalizationRegistryV1,
  report: (code: GameSourceFactIssue["code"], field: string, message: string) => void,
): void {
  if (registry.schemaVersion !== gameNormalizationRegistrySchemaVersion || !registry.policyVersion.trim()) report("invalid-schema", "normalizationRegistry", "Unsupported normalization registry");
  const collections: Array<[string, string[]]> = [
    ["ingredientAliases", registry.ingredientAliases.map((entry) => entry.resolutionId)],
    ["operationRules", registry.operationRules.map((entry) => entry.ruleId)],
    ["equipmentRules", registry.equipmentRules.map((entry) => entry.ruleId)],
    ["heatDescriptors", registry.heatDescriptors.map((entry) => entry.descriptorId)],
    ["targetStateRules", registry.targetStateRules.map((entry) => entry.ruleId)],
    ["mutationRules", registry.mutationRules.map((entry) => entry.ruleId)],
  ];
  for (const [field, ids] of collections) uniqueIds(ids, field, report);
  for (const [index, rule] of registry.targetStateRules.entries()) {
    if (rule.minimum === undefined && rule.maximum === undefined) report("invalid-schema", `targetStateRules.${index}`, "Target rule needs a bound");
    if (rule.minimum !== undefined && rule.maximum !== undefined && rule.minimum > rule.maximum) report("invalid-schema", `targetStateRules.${index}`, "Target rule minimum exceeds maximum");
    if (!rule.provenanceEvidenceIds.length) report("missing-reference", `targetStateRules.${index}.provenanceEvidenceIds`, "Target rules require provenance Evidence IDs");
  }
  for (const [index, rule] of registry.mutationRules.entries()) {
    if (!rule.version.trim() || !rule.provenanceEvidenceIds.length) report("missing-reference", `mutationRules.${index}`, "Mutation rules require a version and provenance Evidence IDs");
    if (!rule.expectedDeltas.length) report("invalid-schema", `mutationRules.${index}.expectedDeltas`, "Mutation rules require at least one directional outcome");
    if (new Set(rule.expectedDeltas.map((delta) => delta.dimension)).size !== rule.expectedDeltas.length) {
      report("duplicate-id", `mutationRules.${index}.expectedDeltas`, "Mutation rule outcome dimensions must be unique");
    }
    if (!rule.expectedFaultCodes.length || !rule.causeCodes.length) {
      report("invalid-schema", `mutationRules.${index}`, "Mutation rules require explicit fault and cause codes");
    }
  }
}

function sameStringSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

function crossCheckKey(value: { sourceDocumentId: string; pageId: string; startLine: number; endLine: number }): string {
  return `${value.sourceDocumentId}:${value.pageId}:${value.startLine}:${value.endLine}`;
}

function uniqueValues(
  values: readonly string[],
  field: string,
  report: (code: GameSourceFactIssue["code"], field: string, message: string) => void,
): Set<string> {
  const result = new Set<string>();
  for (const value of values) {
    if (result.has(value)) report("duplicate-id", field, `Duplicate value ${value}`);
    result.add(value);
  }
  return result;
}

function validateLocator(
  locator: GameFactLocatorV1,
  field: string,
  report: (code: GameSourceFactIssue["code"], field: string, message: string) => void,
): void {
  let url: URL | undefined;
  try { url = new URL(locator.itemUrl); } catch { /* reported below */ }
  if (!locator.sourceDocumentId.trim() || !locator.workFamilyId.trim() || !url || url.protocol !== "https:" || url.hostname !== "www.loc.gov" || !sha256Value(locator.derivativeSha256)) {
    report("invalid-source", field, "Locator must identify an official LOC item, work family and derivative hash");
  }
  if (!/^\d+$/.test(locator.pageId) || locator.startLine < 1 || locator.endLine < locator.startLine) report("invalid-source", field, "Locator requires a page and valid line range");
}

function validateRational(
  value: RationalQuantityV1,
  field: string,
  report: (code: GameSourceFactIssue["code"], field: string, message: string) => void,
): void {
  if (!Number.isInteger(value.numerator) || !Number.isInteger(value.denominator) || value.numerator <= 0 || value.denominator <= 0 || !value.rawToken.trim() || !value.unitToken.trim()) {
    report("ambiguous-fact", field, "Quantity must retain a positive rational value, raw token and source unit");
  } else if (greatestCommonDivisor(value.numerator, value.denominator) !== 1) {
    report("ambiguous-fact", field, "Quantity rational must be reduced to canonical form");
  }
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a || 1;
}

function uniqueIds(
  ids: readonly string[],
  field: string,
  report: (code: GameSourceFactIssue["code"], field: string, message: string) => void,
): Set<string> {
  const values = new Set<string>();
  for (const id of ids) {
    if (!identifier(id)) report("invalid-schema", field, "IDs must be non-empty lowercase identifiers");
    if (values.has(id)) report("duplicate-id", field, `Duplicate ID ${id}`);
    values.add(id);
  }
  return values;
}

function identifier(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function sha256Value(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
