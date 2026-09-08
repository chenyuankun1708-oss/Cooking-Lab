import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import {
  locCandidateBatchSchemaVersion,
  locPublicDomainStatement,
  locSourceRegistrySchemaVersion,
  type LocCandidateBatchV1,
  type LocCrossCheckV1,
  type LocDurationFactV1,
  type LocHighRiskReason,
  type LocIngredientFactV1,
  type LocRecipeCandidateV1,
  type LocRejectedBlockV1,
  type LocSourceDocumentV1,
  type LocSourceLocatorV1,
  type LocSourceRegistryV1,
} from "@/types/loc-recipe-source";

export const locRecipeImporterVersion = "m13-loc-importer-v1" as const;

const candidateBlockers = [
  "candidate-only-not-canonical",
  "ingredient-normalization-required",
  "operation-graph-required",
  "nutrition-provenance-required",
  "rights-decision-required",
  "independent-review-required",
] as const;

const quantityWords: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const amountSource = "(?:\\d+(?:\\s+\\d+\\/\\d+|\\/\\d+|\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";
const unitSource = "(?:cups?|c|tablespoons?|tbsp|tbs|teaspoons?|tsp|pounds?|lbs?|ounces?|oz|pints?|quarts?|gallons?|grams?|kilograms?|milliliters?|liters?)";
const quantityUnitPattern = new RegExp(`\\b(${amountSource})\\s*(${unitSource})\\.?\\s+(?:of\\s+)?`, "gi");
const durationPattern = new RegExp(`\\b(${amountSource})\\s*(minutes?|mins?|hours?|hrs?)\\b`, "gi");

const operationPatterns = [
  ["wash", /\b(?:wash|rinse)\b/i],
  ["peel", /\b(?:peel|pare)\b/i],
  ["slice", /\b(?:slice|cut)\b/i],
  ["dice", /\b(?:dice|chop)\b/i],
  ["mince", /\bmince\b/i],
  ["grind", /\b(?:grind|grate)\b/i],
  ["mix", /\b(?:mix|combine)\b/i],
  ["whisk", /\b(?:whisk|beat)\b/i],
  ["knead", /\bknead\b/i],
  ["fold", /\bfold\b/i],
  ["shape", /\b(?:shape|roll)\b/i],
  ["rest", /\b(?:rest|stand)\b/i],
  ["add", /\badd\b/i],
  ["boil", /\bboil\b/i],
  ["simmer", /\b(?:simmer|stew)\b/i],
  ["steam", /\bsteam\b/i],
  ["pan-fry", /\b(?:fry|saute|sauté)\b/i],
  ["bake", /\bbake\b/i],
  ["roast", /\broast\b/i],
  ["grill", /\b(?:grill|broil)\b/i],
  ["stir", /\bstir\b/i],
  ["drain", /\bdrain\b/i],
  ["strain", /\bstrain\b/i],
  ["blend", /\bblend\b/i],
  ["chill", /\b(?:chill|cool)\b/i],
  ["freeze", /\bfreeze\b/i],
  ["assemble", /\b(?:assemble|fill|layer)\b/i],
  ["serve", /\bserve\b/i],
] as const;

const highRiskPatterns: ReadonlyArray<[LocHighRiskReason, RegExp]> = [
  ["alcohol", /\b(?:ale|beer|brandy|champagne|cocktail|gin|liqueur|rum|sherry|whisky|whiskey|wine)\b/i],
  ["brand-or-restaurant", /\b(?:brand(?:ed)?|restaurant|hotel|café|cafe|company|proprietary)\b/i],
  ["dangerous-process", /\b(?:lye|pressure[- ]?can|water[- ]?bath can|botulism)\b/i],
  ["fermentation-or-preservation", /\b(?:bottle|canning|cure|ferment|pickle|preserv(?:e|ing)|salt[- ]?cure)\b/i],
  ["medical-or-health-claim", /\b(?:convalescent|cure for|dyspepsia|fever|invalid|medicinal|remedy|sickroom)\b/i],
  ["raw-animal-product", /\b(?:raw (?:beef|egg|fish|meat|pork|poultry)|uncooked (?:egg|fish|meat))\b/i],
  ["wild-game", /\b(?:bear|deer|game bird|opossum|partridge|pigeon|rabbit|squirrel|venison|wild duck)\b/i],
];

type RecipeBlock = {
  document: LocSourceDocumentV1;
  pageId: string;
  title: string;
  normalizedTitle: string;
  startLine: number;
  endLine: number;
  body: string;
  ingredients: LocIngredientFactV1[];
  operationTerms: string[];
  durations: LocDurationFactV1[];
  riskReasons: LocHighRiskReason[];
};

export class LocSourceSchemaError extends Error {
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "LocSourceSchemaError";
  }
}

export function parseLocSourceRegistry(value: unknown): LocSourceRegistryV1 {
  const root = recordValue(value, "$registry");
  exactKeys(root, "$registry", [
    "schemaVersion", "provider", "collectionUrl", "rightsStatement", "rightsStatementUrl", "accessedAt", "documents",
  ]);
  literalValue(root.schemaVersion, locSourceRegistrySchemaVersion, "$registry.schemaVersion");
  literalValue(root.provider, "Library of Congress", "$registry.provider");
  validateLocUrl(stringValue(root.collectionUrl, "$registry.collectionUrl"), "$registry.collectionUrl");
  literalValue(root.rightsStatement, locPublicDomainStatement, "$registry.rightsStatement");
  validateLocUrl(stringValue(root.rightsStatementUrl, "$registry.rightsStatementUrl"), "$registry.rightsStatementUrl");
  dateValue(root.accessedAt, "$registry.accessedAt");
  if (!Array.isArray(root.documents) || root.documents.length < 2) {
    fail("$registry.documents", "expected at least two source documents");
  }

  const documents = root.documents.map((entry, index) => parseSourceDocument(entry, `$registry.documents[${index}]`));
  requireUnique(documents.map((document) => document.documentId), "$registry.documents", "documentId");
  requireUnique(documents.map((document) => document.itemId), "$registry.documents", "itemId");
  requireUnique(documents.map((document) => document.itemUrl), "$registry.documents", "itemUrl");
  requireUnique(documents.map((document) => document.ocr.derivativeUrl), "$registry.documents", "OCR derivative URL");
  requireUnique(documents.map((document) => document.ocr.fileName), "$registry.documents", "OCR fileName");
  if (new Set(documents.map((document) => document.workFamilyId)).size < 2) {
    fail("$registry.documents", "expected at least two independent workFamilyIds");
  }

  return {
    schemaVersion: locSourceRegistrySchemaVersion,
    provider: "Library of Congress",
    collectionUrl: root.collectionUrl as string,
    rightsStatement: locPublicDomainStatement,
    rightsStatementUrl: root.rightsStatementUrl as string,
    accessedAt: root.accessedAt as string,
    documents,
  };
}

export function ingestLocRecipeSources(
  registryInput: unknown,
  options: { ocrDirectory: string; ocrFilesByDocumentId?: never } | { ocrDirectory?: never; ocrFilesByDocumentId: Readonly<Record<string, string>> },
): LocCandidateBatchV1 {
  const registry = parseLocSourceRegistry(registryInput);
  const ocrRoot = options.ocrDirectory ? realpathSync(options.ocrDirectory) : undefined;
  if (ocrRoot && !statSync(ocrRoot).isDirectory()) throw new Error(`OCR input is not a directory: ${ocrRoot}`);
  if (options.ocrFilesByDocumentId) {
    const expectedIds = registry.documents.map((document) => document.documentId).sort();
    const actualIds = Object.keys(options.ocrFilesByDocumentId).sort();
    if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
      throw new Error("OCR file map must exactly cover the verified LOC source registry");
    }
  }

  const blocks = registry.documents.flatMap((document) => {
    const pages = readVerifiedOcr(ocrRoot, options.ocrFilesByDocumentId?.[document.documentId], document);
    return pages.flatMap((page) => extractRecipeBlocks(document, page.pageId, page.fulltext));
  });
  const recipeLikeBlocks = blocks.filter((block) =>
    block.ingredients.length >= 2
    && block.operationTerms.length > 0
    && block.durations.length > 0
  );
  const rejectedHighRisk = recipeLikeBlocks
    .filter((block) => block.riskReasons.length > 0)
    .map(toRejectedBlock)
    .sort(compareRejectedBlocks);
  const eligibleBlocks = recipeLikeBlocks.filter((block) => block.riskReasons.length === 0);

  const groups = new Map<string, RecipeBlock[]>();
  for (const block of eligibleBlocks) {
    const group = groups.get(block.normalizedTitle) ?? [];
    group.push(block);
    groups.set(block.normalizedTitle, group);
  }

  const candidates = [...groups.entries()].flatMap(([normalizedTitle, group]) => {
    const ranked = [...group].sort(compareCandidateBlocks);
    const primary = ranked[0];
    const crossChecks = eligibleBlocks.filter((block) =>
      block.document.workFamilyId !== primary.document.workFamilyId
      && isPlausibilityCrossCheck(primary, block)
    ).sort(compareCandidateBlocks);
    if (crossChecks.length === 0) return [];
    return [toCandidate(primary, normalizedTitle, crossChecks)];
  }).sort((left, right) => left.candidateId.localeCompare(right.candidateId));

  return {
    schemaVersion: locCandidateBatchSchemaVersion,
    generatorVersion: locRecipeImporterVersion,
    sourceRegistrySchemaVersion: locSourceRegistrySchemaVersion,
    sourceDocumentCount: registry.documents.length,
    candidateCount: candidates.length,
    candidates,
    rejectedHighRisk,
  };
}

function parseSourceDocument(value: unknown, path: string): LocSourceDocumentV1 {
  const record = recordValue(value, path);
  exactKeys(record, path, [
    "documentId", "itemId", "itemUrl", "title", "creators", "publicationYear", "workFamilyId",
    "rightsStatement", "rightsStatementUrl", "ocr",
  ]);
  const documentId = identifierValue(record.documentId, `${path}.documentId`);
  const itemId = identifierValue(record.itemId, `${path}.itemId`);
  const itemUrl = stringValue(record.itemUrl, `${path}.itemUrl`);
  validateLocItemUrl(itemUrl, itemId, `${path}.itemUrl`);
  const title = nonEmptyString(record.title, `${path}.title`);
  const creators = stringArray(record.creators, `${path}.creators`);
  const publicationYear = integerValue(record.publicationYear, `${path}.publicationYear`);
  if (publicationYear < 1400 || publicationYear > new Date().getUTCFullYear()) {
    fail(`${path}.publicationYear`, "publication year is outside the supported range");
  }
  const workFamilyId = identifierValue(record.workFamilyId, `${path}.workFamilyId`);
  literalValue(record.rightsStatement, locPublicDomainStatement, `${path}.rightsStatement`);
  const rightsStatementUrl = stringValue(record.rightsStatementUrl, `${path}.rightsStatementUrl`);
  validateLocItemUrl(rightsStatementUrl, itemId, `${path}.rightsStatementUrl`);
  const ocr = recordValue(record.ocr, `${path}.ocr`);
  exactKeys(ocr, `${path}.ocr`, ["derivativeUrl", "fileName", "sha256", "format"]);
  const derivativeUrl = stringValue(ocr.derivativeUrl, `${path}.ocr.derivativeUrl`);
  validateLocDerivativeUrl(derivativeUrl, `${path}.ocr.derivativeUrl`);
  const fileName = stringValue(ocr.fileName, `${path}.ocr.fileName`);
  if (basename(fileName) !== fileName || !fileName.endsWith(".text.json")) {
    fail(`${path}.ocr.fileName`, "expected a basename ending in .text.json");
  }
  const sha256 = stringValue(ocr.sha256, `${path}.ocr.sha256`);
  if (!/^[a-f0-9]{64}$/.test(sha256)) fail(`${path}.ocr.sha256`, "expected lowercase SHA-256");
  literalValue(ocr.format, "loc-page-text-json", `${path}.ocr.format`);
  return {
    documentId,
    itemId,
    itemUrl,
    title,
    creators,
    publicationYear,
    workFamilyId,
    rightsStatement: locPublicDomainStatement,
    rightsStatementUrl,
    ocr: { derivativeUrl, fileName, sha256, format: "loc-page-text-json" },
  };
}

function readVerifiedOcr(
  ocrRoot: string | undefined,
  explicitPath: string | undefined,
  document: LocSourceDocumentV1,
): Array<{ pageId: string; fulltext: string }> {
  if (!ocrRoot && !explicitPath) throw new Error(`OCR input is missing for ${document.documentId}`);
  const requestedPath = explicitPath ? resolve(explicitPath) : resolve(ocrRoot!, document.ocr.fileName);
  const actualPath = realpathSync(requestedPath);
  if (ocrRoot) {
    const relativePath = relative(ocrRoot, actualPath);
    if (relativePath.startsWith("..") || relativePath === "" || resolve(ocrRoot, relativePath) !== actualPath) {
      throw new Error(`OCR path escapes input directory for ${document.documentId}`);
    }
  }
  if (!statSync(actualPath).isFile()) throw new Error(`OCR input is not a file for ${document.documentId}`);
  const bytes = readFileSync(actualPath);
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== document.ocr.sha256) {
    throw new Error(`OCR hash mismatch for ${document.documentId}: expected ${document.ocr.sha256}, received ${actualHash}`);
  }
  let value: unknown;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`OCR derivative is not valid JSON for ${document.documentId}`);
  }
  return parseLocPageTextDerivative(value, document.documentId);
}

export function parseLocPageTextDerivative(
  value: unknown,
  documentId = "document",
): Array<{ pageId: string; fulltext: string }> {
  const root = recordValue(value, `$ocr.${documentId}`);
  const entries = Object.entries(root);
  if (entries.length === 0) fail(`$ocr.${documentId}`, "expected at least one page");
  return entries.map(([pageId, pageValue]) => {
    if (!/^[1-9]\d*$/.test(pageId)) fail(`$ocr.${documentId}.${pageId}`, "expected a positive integer page key");
    const page = recordValue(pageValue, `$ocr.${documentId}.${pageId}`);
    const fulltext = stringValue(page.fulltext, `$ocr.${documentId}.${pageId}.fulltext`);
    return { pageId, fulltext };
  }).sort((left, right) => Number(left.pageId) - Number(right.pageId));
}

function extractRecipeBlocks(document: LocSourceDocumentV1, pageId: string, input: string): RecipeBlock[] {
  const lines = normalizeOcr(input).split("\n");
  const headings = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line, index }) => isLikelyHeading(line, lines, index));
  const blocks: RecipeBlock[] = [];
  for (let headingIndex = 0; headingIndex < headings.length; headingIndex += 1) {
    const heading = headings[headingIndex];
    const nextHeadingLine = headings[headingIndex + 1]?.index ?? lines.length;
    const endExclusive = Math.min(nextHeadingLine, heading.index + 46);
    const bodyLines = lines.slice(heading.index + 1, endExclusive);
    const body = bodyLines.join("\n").trim();
    if (!body) continue;
    const normalizedTitle = normalizeRecipeTitle(heading.line);
    if (!normalizedTitle || normalizedTitle.length < 3) continue;
    const sourceText = `${heading.line}\n${body}`;
    blocks.push({
      document,
      pageId,
      title: cleanHeading(heading.line),
      normalizedTitle,
      startLine: heading.index + 1,
      endLine: endExclusive,
      body,
      ingredients: extractIngredientFacts(bodyLines, pageId, heading.index + 2),
      operationTerms: operationPatterns.filter(([, pattern]) => pattern.test(sourceText)).map(([operation]) => operation),
      durations: extractDurationFacts(bodyLines, pageId, heading.index + 2),
      riskReasons: highRiskPatterns.filter(([, pattern]) => pattern.test(sourceText)).map(([reason]) => reason),
    });
  }
  return blocks;
}

function isLikelyHeading(line: string, lines: string[], index: number): boolean {
  if (!line || line.length < 3 || line.length > 96 || /[,:;!?]$/.test(line) || /\d/.test(line)) return false;
  const words = line.replace(/[.\-—]+$/g, "").split(/\s+/);
  if (words.length > 12 || !/[A-Za-z]/.test(line)) return false;
  if (operationPatterns.some(([, pattern]) => pattern.test(line))) return false;
  const letters = line.match(/[A-Za-z]/g) ?? [];
  const uppercase = line.match(/[A-Z]/g) ?? [];
  const uppercaseHeading = letters.length > 0 && uppercase.length / letters.length >= 0.72;
  const titleHeading = words.every((word) => /^[A-Z][A-Za-z'&-]*\.?$/.test(word) || /^(?:and|for|of|the|to|with)$/i.test(word));
  if (!uppercaseHeading && !titleHeading) return false;
  return lines.slice(index + 1, index + 5).some((nextLine) => nextLine.trim().length > 20);
}

function extractIngredientFacts(lines: string[], pageId: string, firstLine: number): LocIngredientFactV1[] {
  const facts: LocIngredientFactV1[] = [];
  lines.forEach((line, index) => {
    quantityUnitPattern.lastIndex = 0;
    const matches = [...line.matchAll(quantityUnitPattern)];
    matches.forEach((match, matchIndex) => {
      const subjectStart = (match.index ?? 0) + match[0].length;
      const subjectEnd = matches[matchIndex + 1]?.index ?? line.length;
      const ingredient = normalizeIngredientPhrase(line.slice(subjectStart, subjectEnd));
      const quantity = parseAmount(match[1]);
      if (!ingredient || quantity === null || quantity <= 0) return;
      facts.push({ quantity, unit: normalizeUnit(match[2]), ingredient, pageId, line: firstLine + index });
    });
  });
  return facts;
}

function extractDurationFacts(lines: string[], pageId: string, firstLine: number): LocDurationFactV1[] {
  const durations: LocDurationFactV1[] = [];
  lines.forEach((line, index) => {
    durationPattern.lastIndex = 0;
    for (const match of line.matchAll(durationPattern)) {
      const amount = parseAmount(match[1]);
      if (amount === null || amount <= 0) continue;
      durations.push({ minutes: /hour|hr/i.test(match[2]) ? amount * 60 : amount, pageId, line: firstLine + index });
    }
    const normalized = line.toLowerCase();
    if (/\bhalf an hour\b/.test(normalized)) durations.push({ minutes: 30, pageId, line: firstLine + index });
    if (/\b(?:three[- ]quarters|three quarters) of an hour\b/.test(normalized)) durations.push({ minutes: 45, pageId, line: firstLine + index });
    if (/\b(?:a quarter|one quarter) of an hour\b/.test(normalized)) durations.push({ minutes: 15, pageId, line: firstLine + index });
  });
  return durations;
}

function toCandidate(primary: RecipeBlock, normalizedTitle: string, crossChecks: RecipeBlock[]): LocRecipeCandidateV1 {
  const identity = `${primary.document.documentId}:${primary.pageId}:${primary.startLine}:${normalizedTitle}`;
  return {
    candidateId: `loc-candidate-${createHash("sha256").update(identity).digest("hex").slice(0, 20)}`,
    title: primary.title,
    normalizedTitle,
    status: "draft-research-only",
    exportEligible: false,
    primarySource: toLocator(primary),
    crossChecks: crossChecks.map((crossCheck) => toCrossCheck(primary, crossCheck)).sort(compareLocators),
    extractedFacts: {
      ingredients: primary.ingredients,
      operationTerms: primary.operationTerms,
      durations: primary.durations,
    },
    blockers: [...candidateBlockers],
  };
}

function toCrossCheck(primary: RecipeBlock, crossCheck: RecipeBlock): LocCrossCheckV1 {
  const primaryIngredients = ingredientTokens(primary.ingredients);
  const crossCheckIngredients = ingredientTokens(crossCheck.ingredients);
  return {
    ...toLocator(crossCheck),
    matchBasis: primary.normalizedTitle === crossCheck.normalizedTitle ? "exact-title" : "related-title-and-facts",
    titleTokenJaccard: round(jaccard(titleTokens(primary.normalizedTitle), titleTokens(crossCheck.normalizedTitle))),
    sharedIngredientTerms: intersectionValues(primaryIngredients, crossCheckIngredients),
    sharedOperationTerms: intersectionValues(new Set(primary.operationTerms), new Set(crossCheck.operationTerms)),
  };
}

function toRejectedBlock(block: RecipeBlock): LocRejectedBlockV1 {
  return {
    title: block.title,
    normalizedTitle: block.normalizedTitle,
    source: toLocator(block),
    reasonCodes: [...new Set(block.riskReasons)].sort(),
  };
}

function toLocator(block: RecipeBlock): LocSourceLocatorV1 {
  return {
    documentId: block.document.documentId,
    sourceTitle: block.title,
    itemUrl: block.document.itemUrl,
    workFamilyId: block.document.workFamilyId,
    ocrDerivativeUrl: block.document.ocr.derivativeUrl,
    ocrSha256: block.document.ocr.sha256,
    pageId: block.pageId,
    segmentId: `page-${block.pageId}-lines-${block.startLine}-${block.endLine}`,
    startLine: block.startLine,
    endLine: block.endLine,
  };
}

function isPlausibilityCrossCheck(primary: RecipeBlock, candidate: RecipeBlock): boolean {
  const titleOverlap = jaccard(titleTokens(primary.normalizedTitle), titleTokens(candidate.normalizedTitle));
  const operationsOverlap = intersectionSize(new Set(primary.operationTerms), new Set(candidate.operationTerms));
  if (operationsOverlap === 0) return false;
  if (primary.normalizedTitle === candidate.normalizedTitle || titleOverlap >= 0.6) return true;

  const primaryIngredients = ingredientTokens(primary.ingredients);
  const candidateIngredients = ingredientTokens(candidate.ingredients);
  return titleOverlap >= 0.34 && intersectionSize(primaryIngredients, candidateIngredients) >= 2;
}

function titleTokens(value: string): Set<string> {
  const ignored = new Set(["a", "and", "for", "in", "of", "style", "the", "with"]);
  return new Set(value.split(" ").filter((token) => token.length > 1 && !ignored.has(token)));
}

function ingredientTokens(ingredients: readonly LocIngredientFactV1[]): Set<string> {
  const ignored = new Set(["and", "fresh", "ground", "large", "small", "sliced", "the", "with"]);
  return new Set(ingredients.flatMap((fact) => fact.ingredient.split(/\s+/))
    .filter((token) => token.length > 2 && !ignored.has(token)));
}

function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  const union = new Set([...left, ...right]);
  return union.size === 0 ? 0 : intersectionSize(left, right) / union.size;
}

function intersectionSize(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  let count = 0;
  for (const value of left) if (right.has(value)) count += 1;
  return count;
}

function intersectionValues(left: ReadonlySet<string>, right: ReadonlySet<string>): string[] {
  return [...left].filter((value) => right.has(value)).sort();
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function compareCandidateBlocks(left: RecipeBlock, right: RecipeBlock): number {
  const score = (block: RecipeBlock) => block.ingredients.length * 4 + block.operationTerms.length * 2 + block.durations.length;
  return score(right) - score(left)
    || left.document.documentId.localeCompare(right.document.documentId)
    || Number(left.pageId) - Number(right.pageId)
    || left.startLine - right.startLine;
}

function compareLocators(left: LocSourceLocatorV1, right: LocSourceLocatorV1): number {
  return left.documentId.localeCompare(right.documentId)
    || Number(left.pageId) - Number(right.pageId)
    || left.startLine - right.startLine;
}

function compareRejectedBlocks(left: LocRejectedBlockV1, right: LocRejectedBlockV1): number {
  return left.source.documentId.localeCompare(right.source.documentId)
    || Number(left.source.pageId) - Number(right.source.pageId)
    || left.source.startLine - right.source.startLine
    || left.normalizedTitle.localeCompare(right.normalizedTitle);
}

function normalizeOcr(input: string): string {
  return input.normalize("NFKC").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function cleanHeading(value: string): string {
  return value.trim().replace(/[.\s]+$/g, "").replace(/\s+/g, " ");
}

function normalizeRecipeTitle(value: string): string {
  return cleanHeading(value)
    .toLowerCase()
    .replace(/\b(?:no|number)\.?\s*\d+\b/g, "")
    .replace(/\s*[—-]\s*\d+$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeIngredientPhrase(value: string): string {
  return value
    .toLowerCase()
    .split(/[;,.:]|\s+(?:and then|then|until|into|with)\s+/)[0]
    .replace(/^[^a-z]+|[^a-z -]+$/g, "")
    .replace(/\b(?:heaping|level|scant|rounded)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}

function parseAmount(value: string): number | null {
  const normalized = value.toLowerCase().trim();
  if (quantityWords[normalized] !== undefined) return quantityWords[normalized];
  if (/^\d+\s+\d+\/\d+$/.test(normalized)) {
    const [whole, fraction] = normalized.split(/\s+/);
    return Number(whole) + parseFraction(fraction);
  }
  if (/^\d+\/\d+$/.test(normalized)) return parseFraction(normalized);
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseFraction(value: string): number {
  const [numerator, denominator] = value.split("/").map(Number);
  return denominator > 0 ? numerator / denominator : Number.NaN;
}

function normalizeUnit(value: string): string {
  const unit = value.toLowerCase().replace(/\.$/, "");
  const aliases: Readonly<Record<string, string>> = {
    c: "cup", cups: "cup", tablespoon: "tbsp", tablespoons: "tbsp", tbs: "tbsp",
    teaspoon: "tsp", teaspoons: "tsp", pounds: "lb", lbs: "lb", ounces: "oz",
    pints: "pint", quarts: "quart", gallons: "gallon", grams: "g", kilograms: "kg",
    milliliters: "ml", liters: "l",
  };
  return aliases[unit] ?? unit;
}

function recordValue(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected object");
  return value as Record<string, unknown>;
}

function exactKeys(record: Record<string, unknown>, path: string, keys: readonly string[]): void {
  const expected = new Set(keys);
  for (const key of Object.keys(record)) if (!expected.has(key)) fail(`${path}.${key}`, "unexpected property");
  for (const key of keys) if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, "missing required property");
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== "string") fail(path, "expected string");
  return value;
}

function nonEmptyString(value: unknown, path: string): string {
  const result = stringValue(value, path);
  if (!result.trim()) fail(path, "expected non-empty string");
  return result;
}

function integerValue(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) fail(path, "expected integer");
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) fail(path, "expected string array");
  return value.map((entry, index) => nonEmptyString(entry, `${path}[${index}]`));
}

function identifierValue(value: unknown, path: string): string {
  const result = stringValue(value, path);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(result)) fail(path, "expected lowercase identifier");
  return result;
}

function literalValue(value: unknown, expected: string, path: string): void {
  if (value !== expected) fail(path, `expected ${JSON.stringify(expected)}`);
}

function dateValue(value: unknown, path: string): void {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    fail(path, "expected ISO calendar date");
  }
}

function validateLocUrl(value: string, path: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail(path, "expected absolute URL");
  }
  if (url.protocol !== "https:" || url.hostname !== "www.loc.gov") fail(path, "expected an official HTTPS www.loc.gov URL");
}

function validateLocItemUrl(value: string, itemId: string, path: string): void {
  validateLocUrl(value, path);
  const url = new URL(value);
  if (url.pathname !== `/item/${itemId}/` || url.search || url.hash) {
    fail(path, `expected canonical LOC item URL for ${itemId}`);
  }
}

function validateLocDerivativeUrl(value: string, path: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail(path, "expected absolute URL");
  }
  if (url.protocol !== "https:" || url.hostname !== "tile.loc.gov" || !url.pathname.endsWith(".text.json") || url.search || url.hash) {
    fail(path, "expected an official LOC page-text derivative URL");
  }
}

function requireUnique(values: readonly string[], path: string, label: string): void {
  if (new Set(values).size !== values.length) fail(path, `expected unique ${label} values`);
}

function fail(path: string, message: string): never {
  throw new LocSourceSchemaError(path, message);
}
