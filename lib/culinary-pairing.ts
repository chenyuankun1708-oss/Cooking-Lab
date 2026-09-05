import type {
  CulinaryItem,
  MealRoleId,
  PairingWeight,
  ServingTemperature,
} from "@/types/culinary";
import type {
  FlavorComplementId,
  PairingCaution,
  PairingReason,
  PairingScoreBreakdown,
  PairingScoreResult,
} from "@/types/pairing";

export const pairingScoreWeights = Object.freeze({
  roleCompatibility: 0.1,
  flavorComplement: 0.24,
  flavorContinuity: 0.12,
  weightBalance: 0.16,
  textureContrast: 0.12,
  temperatureRelationship: 0.06,
  cuisineCoherence: 0.1,
  servingContext: 0.1,
});

export const defaultPairingThreshold = 0.44;

export interface PairingContext {
  servingContextId?: string;
  anchorRoleId?: MealRoleId;
  candidateRoleId?: MealRoleId;
}

export interface RankPairingOptions extends PairingContext {
  allowedCandidateRoleIds?: readonly MealRoleId[];
  excludeAlcohol?: boolean;
  minimumScore?: number;
  limit?: number;
}

const roleCompatibility: Readonly<Record<string, number>> = Object.freeze({
  "drink:main": 1,
  "drink:staple": 1,
  "dessert:drink": 1,
  "main:starter": 1,
  "main:side": 1,
  "drink:soup": 0.9,
  "main:soup": 0.85,
  "drink:starter": 0.75,
  "drink:side": 0.75,
  "dessert:main": 0.65,
  "dessert:staple": 0.65,
  "dessert:soup": 0.45,
});

const textureContrasts = new Set([
  "creamy:crisp",
  "crisp:soft",
  "crisp:tender",
  "brothy:crisp",
  "chewy:creamy",
  "juicy:crisp",
  "saucy:crisp",
]);

export function scorePairing(
  anchor: CulinaryItem,
  candidate: CulinaryItem,
  context: PairingContext = {},
): PairingScoreResult {
  const roles = selectCompatibleRoles(anchor, candidate, context);
  const complementIds = findFlavorComplements(anchor, candidate);
  const continuity = calculateFlavorContinuity(anchor, candidate);
  const weight = calculateWeightBalance(anchor, candidate);
  const texture = calculateTextureContrast(anchor, candidate);
  const temperature = calculateTemperatureRelationship(anchor, candidate);
  const cuisine = calculateCuisineCoherence(anchor, candidate);
  const serving = calculateServingContext(anchor, candidate, context.servingContextId);
  const breakdown: PairingScoreBreakdown = {
    roleCompatibility: roles?.score ?? 0,
    flavorComplement: complementIds.length ? Math.min(1, 0.72 + (complementIds.length - 1) * 0.14) : 0,
    flavorContinuity: continuity.score,
    weightBalance: weight.score,
    textureContrast: texture.score,
    temperatureRelationship: temperature.score,
    cuisineCoherence: cuisine.score,
    servingContext: serving.score,
  };
  const eligible = anchor.publication.status === "published"
    && candidate.publication.status === "published"
    && anchor.id !== candidate.id
    && anchor.slug !== candidate.slug
    && Boolean(roles);
  const score = eligible ? roundScore(sumWeightedScore(breakdown)) : 0;
  const reasons: PairingReason[] = [];
  const cautions: PairingCaution[] = [];

  complementIds.forEach((complementId) => reasons.push({ kind: "flavor-complement", complementId }));
  if (continuity.tasteIds.length) reasons.push({ kind: "flavor-continuity", dimension: "taste", ids: continuity.tasteIds });
  if (continuity.aromaIds.length) reasons.push({ kind: "flavor-continuity", dimension: "aroma", ids: continuity.aromaIds });
  if (weight.reasonValues) reasons.push({ kind: "weight-balance", values: weight.reasonValues });
  if (texture.reasonIds) reasons.push({ kind: "texture-contrast", ids: texture.reasonIds });
  if (temperature.reasonValues) reasons.push({ kind: "temperature-relationship", values: temperature.reasonValues });
  if (cuisine.ids.length) reasons.push({ kind: "cuisine-coherence", ids: cuisine.ids });
  if (serving.ids.length) reasons.push({ kind: "serving-context", ids: serving.ids });
  if (roles) reasons.push({ kind: "meal-role-fit", roles: roles.roles });

  if (weight.sharedRichness) cautions.push({ kind: "shared-richness" });
  if (texture.repeatedIds.length) cautions.push({ kind: "repeated-texture", ids: texture.repeatedIds });
  if (!serving.ids.length) cautions.push({ kind: "serving-context-mismatch" });
  if (!complementIds.length && continuity.score < 0.25) cautions.push({ kind: "limited-flavor-connection" });
  if (anchor.itemType === "alcoholic-drink" || candidate.itemType === "alcoholic-drink") cautions.push({ kind: "alcoholic-option" });

  return {
    anchor,
    candidate,
    score,
    eligible,
    ...(roles ? { roles: roles.roles } : {}),
    breakdown,
    reasons,
    cautions,
  };
}

export function rankPairingCandidates(
  anchor: CulinaryItem,
  candidates: readonly CulinaryItem[],
  options: RankPairingOptions = {},
): PairingScoreResult[] {
  const excludeAlcohol = options.excludeAlcohol ?? true;
  const minimumScore = options.minimumScore ?? defaultPairingThreshold;
  const limit = options.limit ?? 8;
  const allowedRoles = new Set(options.allowedCandidateRoleIds ?? []);
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  return candidates
    .filter((candidate) => {
      if (candidate.publication.status !== "published") return false;
      if (candidate.id === anchor.id || candidate.slug === anchor.slug) return false;
      if (seenIds.has(candidate.id) || seenSlugs.has(candidate.slug)) return false;
      seenIds.add(candidate.id);
      seenSlugs.add(candidate.slug);
      if (excludeAlcohol && candidate.itemType === "alcoholic-drink") return false;
      return !allowedRoles.size || candidate.pairing.mealRoleIds.some((role) => allowedRoles.has(role));
    })
    .map((candidate) => scorePairing(anchor, candidate, options))
    .filter((result) => result.eligible && result.score >= minimumScore)
    .sort((left, right) => right.score - left.score || compareText(left.candidate.id, right.candidate.id))
    .slice(0, Math.max(0, limit));
}

function selectCompatibleRoles(anchor: CulinaryItem, candidate: CulinaryItem, context: PairingContext) {
  if (context.anchorRoleId && !anchor.pairing.mealRoleIds.includes(context.anchorRoleId)) return undefined;
  if (context.candidateRoleId && !candidate.pairing.mealRoleIds.includes(context.candidateRoleId)) return undefined;
  const anchorRoles = context.anchorRoleId ? [context.anchorRoleId] : anchor.pairing.mealRoleIds;
  const candidateRoles = context.candidateRoleId ? [context.candidateRoleId] : candidate.pairing.mealRoleIds;
  return anchorRoles
    .flatMap((anchorRole) => candidateRoles.map((candidateRole) => ({
      roles: [anchorRole, candidateRole] as [MealRoleId, MealRoleId],
      score: getRoleCompatibility(anchorRole, candidateRole),
    })))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || compareText(left.roles.join(":"), right.roles.join(":")))[0];
}

export function getRoleCompatibility(left: MealRoleId, right: MealRoleId): number {
  if (left === right) return 0;
  return roleCompatibility[[left, right].sort().join(":")] ?? 0;
}

function findFlavorComplements(left: CulinaryItem, right: CulinaryItem): FlavorComplementId[] {
  const complements: FlavorComplementId[] = [];
  if (isRich(left) && isBright(right) || isRich(right) && isBright(left)) complements.push("acid-richness");
  if (isSpicy(left) && isCooling(right) || isSpicy(right) && isCooling(left)) complements.push("cooling-spicy");
  if (isSweet(left) && isBitterRoasted(right) || isSweet(right) && isBitterRoasted(left)) complements.push("sweet-bitter");
  if (isUmamiRich(left) && isFreshCounterpoint(right) || isUmamiRich(right) && isFreshCounterpoint(left)) complements.push("fresh-umami");
  return complements;
}

function calculateFlavorContinuity(left: CulinaryItem, right: CulinaryItem) {
  const tasteIds = ["salty", "sweet", "sour", "bitter", "umami", "spicy"]
    .filter((id) => (left.flavor.tastes[id as keyof typeof left.flavor.tastes] ?? 0) >= 2 && (right.flavor.tastes[id as keyof typeof right.flavor.tastes] ?? 0) >= 2);
  const aromaIds = intersection(left.flavor.aromaIds ?? [], right.flavor.aromaIds ?? []);
  return { tasteIds, aromaIds, score: Math.min(1, tasteIds.length * 0.28 + aromaIds.length * 0.24) };
}

function calculateWeightBalance(left: CulinaryItem, right: CulinaryItem) {
  const leftWeight = getFacet<PairingWeight>(left, "weight");
  const rightWeight = getFacet<PairingWeight>(right, "weight");
  if (!leftWeight || !rightWeight) return { score: 0.5, repeatedIds: [] as string[] };
  if (leftWeight === "rich" && rightWeight === "rich") return { score: 0.22, sharedRichness: true, repeatedIds: [] as string[] };
  const key = [leftWeight, rightWeight].sort().join(":");
  const score = key === "light:rich" ? 1 : key === "medium:rich" ? 0.78 : key === "light:medium" ? 0.72 : 0.58;
  return { score, reasonValues: leftWeight === rightWeight ? undefined : [leftWeight, rightWeight], repeatedIds: [] as string[] };
}

function calculateTextureContrast(left: CulinaryItem, right: CulinaryItem) {
  const leftTextures = getTextures(left);
  const rightTextures = getTextures(right);
  const repeatedIds = intersection(leftTextures, rightTextures);
  const contrast = leftTextures.flatMap((a) => rightTextures.map((b) => [a, b].sort().join(":")))
    .find((key) => textureContrasts.has(key));
  if (contrast) return { score: 1, reasonIds: contrast.split(":"), repeatedIds };
  if (!leftTextures.length || !rightTextures.length) return { score: 0.5, repeatedIds };
  if (repeatedIds.length) return { score: 0.28, repeatedIds };
  return { score: 0.68, reasonIds: [leftTextures[0], rightTextures[0]], repeatedIds };
}

function calculateTemperatureRelationship(left: CulinaryItem, right: CulinaryItem) {
  const leftTemperature = getFacet<ServingTemperature>(left, "temperature");
  const rightTemperature = getFacet<ServingTemperature>(right, "temperature");
  if (!leftTemperature || !rightTemperature) return { score: 0.5 };
  const rank: Record<ServingTemperature, number> = { cold: 0, cool: 1, room: 2, warm: 3, hot: 4 };
  const distance = Math.abs(rank[leftTemperature] - rank[rightTemperature]);
  const score = distance >= 3 ? 1 : distance === 2 ? 0.8 : distance === 1 ? 0.68 : 0.58;
  return { score, reasonValues: distance >= 2 ? [leftTemperature, rightTemperature] : undefined };
}

function calculateCuisineCoherence(left: CulinaryItem, right: CulinaryItem) {
  const ids = intersection(left.pairing.cuisineIds, right.pairing.cuisineIds);
  if (ids.length) return { score: 1, ids };
  const sameCountry = left.taxonomy.origin?.countryId && left.taxonomy.origin.countryId === right.taxonomy.origin?.countryId;
  return { score: sameCountry ? 0.75 : 0.5, ids: sameCountry ? [left.taxonomy.origin!.countryId] : [] };
}

function calculateServingContext(left: CulinaryItem, right: CulinaryItem, requested?: string) {
  const ids = intersection(left.pairing.servingContextIds, right.pairing.servingContextIds);
  if (!requested) return { score: ids.length ? 1 : 0.45, ids };
  const bothMatch = left.pairing.servingContextIds.includes(requested) && right.pairing.servingContextIds.includes(requested);
  const candidateMatches = right.pairing.servingContextIds.includes(requested);
  return { score: bothMatch ? 1 : candidateMatches ? 0.72 : 0.2, ids: bothMatch ? [requested] : [] };
}

function isRich(item: CulinaryItem): boolean {
  return getFacet<PairingWeight>(item, "weight") === "rich" || item.flavor.characterIds?.includes("hearty") === true;
}

function isBright(item: CulinaryItem): boolean {
  return (item.flavor.tastes.sour ?? 0) >= 2 ||
    (!isRich(item) && item.flavor.characterIds?.some((id) => id === "refreshing" || id === "light") === true);
}

function isSpicy(item: CulinaryItem): boolean {
  return (item.flavor.tastes.spicy ?? 0) >= 2;
}

function isCooling(item: CulinaryItem): boolean {
  const temperature = getFacet<ServingTemperature>(item, "temperature");
  return (temperature === "cold" || temperature === "cool") &&
    (getTextures(item).includes("creamy") || item.flavor.characterIds?.includes("refreshing") === true);
}

function isSweet(item: CulinaryItem): boolean {
  return (item.flavor.tastes.sweet ?? 0) >= 2;
}

function isBitterRoasted(item: CulinaryItem): boolean {
  return (item.flavor.tastes.bitter ?? 0) >= 2 || item.flavor.aromaIds?.some((id) => id === "roasted" || id === "toasty") === true;
}

function isUmamiRich(item: CulinaryItem): boolean {
  return (item.flavor.tastes.umami ?? 0) >= 2;
}

function isFreshCounterpoint(item: CulinaryItem): boolean {
  return item.flavor.characterIds?.some((id) => id === "refreshing" || id === "light" || id === "clean-tasting") === true ||
    getTextures(item).includes("crisp") || item.flavor.aromaIds?.some((id) => id === "herbal" || id === "citrusy") === true;
}

function getTextures(item: CulinaryItem): string[] {
  const facetTextures = item.pairing.facets.filter((facet) => facet.dimension === "texture").map((facet) => facet.value);
  return [...new Set([...facetTextures, ...(item.flavor.textureIds ?? [])])];
}

function getFacet<T extends string>(item: CulinaryItem, dimension: "weight" | "temperature"): T | undefined {
  return item.pairing.facets.find((facet) => facet.dimension === dimension)?.value as T | undefined;
}

function sumWeightedScore(breakdown: PairingScoreBreakdown): number {
  return (Object.keys(pairingScoreWeights) as Array<keyof typeof pairingScoreWeights>)
    .reduce((sum, key) => sum + breakdown[key] * pairingScoreWeights[key], 0);
}

function intersection<T extends string>(left: readonly T[], right: readonly T[]): T[] {
  const rightValues = new Set(right);
  return [...new Set(left)].filter((value) => rightValues.has(value));
}

function roundScore(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
