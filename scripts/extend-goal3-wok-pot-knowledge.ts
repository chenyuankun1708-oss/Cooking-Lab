import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { sha256 } from "@/lib/game-data-canonical";
import { parseCulinaryKnowledgeSource } from "@/lib/culinary-knowledge-runtime-schema";
import { stableJson } from "@/lib/stable-json";
import type {
  CulinaryKnowledgeGovernanceV1,
  CulinaryKnowledgeSourceV1,
} from "@/types/culinary-knowledge";

const sourcePath = resolve("game-data/culinary-knowledge/goal17-source.json");
const goal3ReferencePath = "game-data/culinary-knowledge/reference/cat-kitchen-goal3-wok-pot-fixture.json";
const reviewedBase = "137ee1513b3935efd887b4a89bff56f09c31d8ed";
const source = JSON.parse(readFileSync(sourcePath, "utf8")) as CulinaryKnowledgeSourceV1;

source.snapshotId = "culinary-knowledge-wok-pot-v1";
source.sourceRevision = reviewedBase;
source.sourceAuditSha = reviewedBase;
source.physicalContentVersion = "goal3-wok-pot-calibration-v1";
source.sourceFiles = source.sourceFiles.filter((entry) => entry.role !== "cat-kitchen-goal3-fixture");
source.sourceFiles.push({
  path: goal3ReferencePath,
  sha256: sha256(readFileSync(resolve(goal3ReferencePath))),
  role: "cat-kitchen-goal3-fixture",
});
source.sourceFiles.sort((left, right) => left.path.localeCompare(right.path));

const knowledgeGovernance = governance("cooking-lab-factual-source");
const calibrationGovernance = governance("cat-kitchen-calibration");

upsert(source.ingredientStates, {
  id: "hydrated",
  description: "Hydrated starch or noodle state produced by controlled liquid cooking.",
  governance: knowledgeGovernance,
});
upsert(source.ingredientStates, {
  id: "pot_extracted",
  description: "Pot-cooked state with flavor compounds extracted into a liquid medium.",
  governance: knowledgeGovernance,
});

const ingredient = (
  id: string,
  role: CulinaryKnowledgeSourceV1["ingredientKnowledge"][number]["role"],
  colorId: string,
  platingComponentId: string,
  nutrition: [number, number, number, number, number],
  physical: [number, number, number, number, number, number, number],
  states: string[] = ["raw"],
): CulinaryKnowledgeSourceV1["ingredientKnowledge"][number] => ({
  id,
  role,
  colorId,
  ingredientStateIds: [...states].sort(),
  platingComponentId,
  nutritionPer100g: {
    energyKcal: nutrition[0],
    proteinG: nutrition[1],
    fatG: nutrition[2],
    carbohydrateG: nutrition[3],
    fiberG: nutrition[4],
  },
  retention: { energy: 0.95, protein: 0.95, fat: 0.95, carbohydrate: 0.95, fiber: 1 },
  physicalModel: {
    waterFraction: physical[0],
    proteinFraction: physical[1],
    fatFraction: physical[2],
    sugarFraction: physical[3],
    baseSweetness: physical[4],
    baseAcidity: physical[5],
    baseBitterness: 0,
    basePungency: physical[6],
    baseUmami: role === "protein" || role === "liquid" ? 0.45 : 0.12,
    thermalResponse: 1,
    evaporationRate: 0.85,
    browningPotential: role === "protein" || role === "starch" ? 0.6 : 0.25,
    aromaPotential: role === "aromatic" ? 0.9 : 0.35,
  },
  governance: knowledgeGovernance,
});

for (const record of [
  ingredient("beef_stock", "liquid", "brown", "sauce_dark", [12, 2.2, 0.4, 0.5, 0], [0.97, 0.02, 0.004, 0.002, 0.01, 0.01, 0], ["liquid"]),
  ingredient("galangal", "aromatic", "tan", "aromatic_fleck", [71, 1, 0.3, 15, 2], [0.79, 0.01, 0.003, 0.03, 0.08, 0.06, 0.3]),
  ingredient("lemongrass", "aromatic", "green", "vegetable_strip", [99, 1.8, 0.5, 25.3, 0], [0.71, 0.018, 0.005, 0.04, 0.05, 0.08, 0.1]),
  ingredient("lime_leaf", "aromatic", "green", "leaf_cluster", [70, 6, 1, 10, 5], [0.69, 0.06, 0.01, 0.02, 0.03, 0.35, 0.08]),
  ingredient("rice_noodle", "starch", "white", "grain_cluster", [109, 1.8, 0.2, 25, 0.8], [0.12, 0.018, 0.002, 0.01, 0.05, 0, 0], ["hydrated", "raw"]),
  ingredient("shrimp", "protein", "pink", "protein_piece", [99, 24, 0.3, 0.2, 0], [0.72, 0.24, 0.003, 0, 0.01, 0, 0]),
  ingredient("star_anise", "aromatic", "brown", "aromatic_fleck", [337, 18, 16, 50, 15], [0.1, 0.18, 0.16, 0.08, 0.08, 0.02, 0.05]),
  ingredient("thai_basil", "aromatic", "green", "leaf_cluster", [23, 3.2, 0.6, 2.7, 1.6], [0.82, 0.032, 0.006, 0.01, 0.03, 0.02, 0.05]),
  ingredient("water", "liquid", "clear", "sauce_dark", [0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0], ["liquid"]),
]) upsert(source.ingredientKnowledge, record);

const seasoning = (
  id: string,
  saltiness: number,
  acidity: number,
  umami: number,
  aroma: number,
): CulinaryKnowledgeSourceV1["seasonings"][number] => ({
  id,
  acidityPerG: acidity,
  aromaPerG: aroma,
  bitternessPerG: 0,
  heatSensitivity: 0.55,
  pungencyPerG: 0,
  saltinessPerG: saltiness,
  sweetnessPerG: 0.02,
  umamiPerG: umami,
  governance: calibrationGovernance,
});
upsert(source.seasonings, seasoning("fish_sauce", 0.45, 0, 0.62, 0.32));
upsert(source.seasonings, seasoning("lime_juice", 0, 0.9, 0, 0.48));

const transform = (
  id: string,
  operationId: string,
  inputStateIds: string[],
  outputStateIds: string[],
): CulinaryKnowledgeSourceV1["transformationRules"][number] => ({
  id,
  operationId,
  inputStateIds: [...inputStateIds].sort(),
  outputStateIds: [...outputStateIds].sort(),
  engineCapabilityIds: ["dish_engine_v2_pot"],
  governance: knowledgeGovernance,
});
for (const record of [
  transform("add_liquid_to_pot", "add_liquid", ["liquid"], ["liquid"]),
  transform("add_solid_to_pot", "add_solid", ["raw"], ["pot_extracted"]),
  transform("hydrate_noodle_in_pot", "simmer", ["raw"], ["hydrated"]),
  transform("prepare_before_pot", "prepare", ["raw"], ["cut"]),
  transform("season_in_pot", "season", ["liquid"], ["liquid"]),
  transform("skim_broth", "skim", ["liquid"], ["liquid"]),
]) upsert(source.transformationRules, record);

const relation = (
  id: string,
  left: string,
  right: string,
  polarity: "complement" | "clash",
  strength: number,
): CulinaryKnowledgeSourceV1["flavorRelations"][number] => ({
  id,
  ingredientIds: [left, right].sort(),
  polarity,
  semanticCategory: "physical",
  strength,
  evidenceCode: `flavor.${polarity}.${id}`,
  governance: calibrationGovernance,
});
for (const record of [
  relation("beef_rice_noodle_physical", "beef", "rice_noodle", "complement", 0.72),
  relation("beef_star_anise_physical", "beef", "star_anise", "complement", 0.82),
  relation("chicken_thai_basil_physical", "chicken", "thai_basil", "complement", 0.85),
  relation("galangal_shrimp_physical", "galangal", "shrimp", "complement", 0.78),
  relation("lemongrass_lime_leaf_physical", "lemongrass", "lime_leaf", "complement", 0.84),
  relation("lemongrass_shrimp_physical", "lemongrass", "shrimp", "complement", 0.82),
]) upsert(source.flavorRelations, record);

const archetype = (
  id: string,
  archetypeId: string,
  ingredients: string[],
  sequence: string[],
  engineCapabilityId: string,
  taste: [number, number, number, number],
  aroma: number,
  texture: number,
): CulinaryKnowledgeSourceV1["dishArchetypes"][number] => ({
  id,
  archetype: archetypeId,
  cuisineId: "cat_kitchen_calibration",
  ingredientIds: [...ingredients].sort(),
  sequence,
  platingComponentIds: ["aromatic_fleck", "leaf_cluster", "protein_piece"].sort(),
  engineCapabilityIds: [engineCapabilityId],
  commentaryEvidenceIds: ["dish.harmony.score", "dish.identity.similarity"],
  taste: { acidity: taste[0], pungency: taste[1], sweetness: taste[2], umami: taste[3] },
  aroma,
  texture,
  governance: calibrationGovernance,
});
for (const record of [
  archetype("beef_pho", "clear_noodle_soup", ["beef", "onion", "rice_noodle", "star_anise"], ["onion", "star_anise", "beef", "rice_noodle"], "dish_engine_v2_pot", [0.12, 0.05, 0.12, 0.72], 0.72, 0.72),
  archetype("thai_basil_chicken", "aromatic_wok", ["chicken", "chili", "thai_basil"], ["chicken", "chili", "thai_basil"], "dish_engine_v2_wok", [0.08, 0.65, 0.08, 0.7], 0.9, 0.68),
  archetype("tom_yum_goong", "bright_aromatic_soup", ["chili", "galangal", "lemongrass", "lime_leaf", "mushroom", "shrimp"], ["lemongrass", "galangal", "lime_leaf", "mushroom", "shrimp", "chili"], "dish_engine_v2_pot", [0.72, 0.62, 0.12, 0.68], 0.92, 0.62),
]) upsert(source.dishArchetypes, record);

upsert(source.engineCapabilities, {
  id: "dish_engine_v2_pot",
  supports: ["commentary_v1", "dish_profile_v1", "physical_truth_wrap", "plating_plan_v1", "pot"],
  governance: calibrationGovernance,
});

for (const collection of [
  source.ingredientStates,
  source.ingredientKnowledge,
  source.seasonings,
  source.transformationRules,
  source.flavorRelations,
  source.dishArchetypes,
  source.cuisines,
  source.platingComponents,
  source.engineCapabilities,
  source.commentaryEvidence,
]) collection.sort((left, right) => left.id.localeCompare(right.id));

parseCulinaryKnowledgeSource(source);
writeFileSync(sourcePath, stableJson(source));
console.log(JSON.stringify({ source: sourcePath, snapshotId: source.snapshotId }));

function governance(kind: CulinaryKnowledgeGovernanceV1["provenance"]["kind"]): CulinaryKnowledgeGovernanceV1 {
  return {
    recordStatus: "reviewed",
    reviewStatus: "reviewed",
    rightsStatus: "approved",
    compatibilityStatus: "compatible",
    reviewer: "cooking-lab-goal17-culinary-knowledge-review",
    rightsReviewer: "cooking-lab-goal17-rights-review",
    provenance: {
      kind,
      sourceRevision: reviewedBase,
      sourceFiles: [goal3ReferencePath, "game-data/source/rights-registry.json"].sort(),
      notes: "Reviewed Cat Kitchen Goal 3 Wok/Pot interpretation knowledge; gameplay formulas and thresholds remain game-owned.",
    },
  };
}

function upsert<T extends { id: string }>(rows: T[], value: T): void {
  const index = rows.findIndex((entry) => entry.id === value.id);
  if (index >= 0) rows[index] = value;
  else rows.push(value);
}
