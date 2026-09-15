import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { sha256 } from "@/lib/game-data-canonical";
import { stableJson } from "@/lib/stable-json";
import type {
  CulinaryKnowledgeGovernanceV1,
  CulinaryKnowledgeProvenanceKind,
  CulinaryKnowledgeSourceFileV1,
  CulinaryKnowledgeSourceV1,
} from "@/types/culinary-knowledge";
import { culinaryKnowledgeSourceSchemaId } from "@/types/culinary-knowledge";

const AUDITED_BASE = "9e9f01c8f7b45815c0fdeac2d80bd9b8a6198397";
const REFERENCE_PATH = "game-data/culinary-knowledge/reference/cat-kitchen-goal16-fixture.json";
const SOURCE_PATH = "game-data/culinary-knowledge/goal17-source.json";
const DEFAULT_INPUT = REFERENCE_PATH;
const COLLECTIONS = [
  "ingredient_states", "ingredient_knowledge", "seasonings", "transformation_rules",
  "flavor_relations", "dish_archetypes", "cuisines", "plating_components",
  "engine_capabilities", "commentary_evidence",
] as const;

type JsonRecord = Record<string, unknown>;

const inputPath = process.argv[2] ?? DEFAULT_INPUT;
const input = JSON.parse(readFileSync(resolve(inputPath), "utf8")) as JsonRecord;
restoreGoal16PhysicalCalibration(input);
const reference = {
  schema_id: "cat_kitchen.goal16_culinary_calibration_reference.v1",
  schema_version: 1,
  physical_content_version: input.physical_content_version,
  ...Object.fromEntries(COLLECTIONS.map((key) => [key, rows(input, key).map(stripGovernance)])),
};
writeStable(REFERENCE_PATH, reference);

const sourceFiles: CulinaryKnowledgeSourceFileV1[] = [
  sourceFile(REFERENCE_PATH, "cat-kitchen-goal16-fixture"),
  sourceFile("game-data/nutrition/usda-fooddata-central-subset.json", "nutrition-dataset"),
  sourceFile("game-data/operations.json", "operation-catalog"),
  sourceFile("game-data/source/ingredients.json", "ingredient-catalog"),
  sourceFile("game-data/source/rights-registry.json", "rights-registry"),
].sort((left, right) => left.path.localeCompare(right.path));

const factualFiles = [
  "game-data/culinary-knowledge/reference/cat-kitchen-goal16-fixture.json",
  "game-data/nutrition/usda-fooddata-central-subset.json",
  "game-data/operations.json",
  "game-data/source/ingredients.json",
  "game-data/source/rights-registry.json",
].sort();
const calibrationFiles = [
  "game-data/culinary-knowledge/reference/cat-kitchen-goal16-fixture.json",
  "game-data/source/rights-registry.json",
].sort();

const source: CulinaryKnowledgeSourceV1 = {
  schemaId: culinaryKnowledgeSourceSchemaId,
  schemaVersion: 1,
  sourceKind: "goal17-calibration",
  snapshotId: "culinary-knowledge-v1",
  sourceRevision: AUDITED_BASE,
  sourceAuditSha: AUDITED_BASE,
  physicalContentVersion: "goal16-calibration-v1",
  owner: "Cooking Lab",
  recordStatus: "reviewed",
  reviewStatus: "reviewed",
  rightsStatus: "approved",
  compatibilityStatus: "compatible",
  sourceFiles,
  ingredientStates: rows(input, "ingredient_states").map((row) => ({
    id: text(row.id), description: text(row.description), governance: governance("cooking-lab-factual-source", factualFiles),
  })),
  ingredientKnowledge: rows(input, "ingredient_knowledge").map((row) => ({
    id: text(row.id), role: text(row.role) as CulinaryKnowledgeSourceV1["ingredientKnowledge"][number]["role"],
    colorId: text(row.color_id), ingredientStateIds: strings(row.ingredient_state_ids).sort(),
    platingComponentId: text(row.plating_component_id),
    nutritionPer100g: mapNutrition(record(row.nutrition_per_100g)),
    retention: record(row.retention) as CulinaryKnowledgeSourceV1["ingredientKnowledge"][number]["retention"],
    physicalModel: mapPhysical(record(row.physical_model)),
    governance: governance("cooking-lab-factual-source", factualFiles),
  })),
  seasonings: rows(input, "seasonings").map((row) => ({
    id: text(row.id), acidityPerG: number(row.acidity_per_g), aromaPerG: number(row.aroma_per_g),
    bitternessPerG: number(row.bitterness_per_g), heatSensitivity: number(row.heat_sensitivity),
    pungencyPerG: number(row.pungency_per_g), saltinessPerG: number(row.saltiness_per_g),
    sweetnessPerG: number(row.sweetness_per_g), umamiPerG: number(row.umami_per_g),
    governance: governance("cat-kitchen-calibration", calibrationFiles),
  })),
  transformationRules: rows(input, "transformation_rules").map((row) => ({
    id: text(row.id), inputStateIds: strings(row.input_state_ids).sort(),
    operationId: text(row.operation_id) === "cut" ? "slice" : text(row.operation_id),
    outputStateIds: strings(row.output_state_ids).sort(), engineCapabilityIds: strings(row.engine_capability_ids).sort(),
    governance: governance("cooking-lab-factual-source", factualFiles),
  })),
  flavorRelations: rows(input, "flavor_relations").map((row) => ({
    id: text(row.id), ingredientIds: strings(row.ingredient_ids).sort(),
    polarity: text(row.polarity) as CulinaryKnowledgeSourceV1["flavorRelations"][number]["polarity"],
    semanticCategory: text(row.semantic_category).replace("_", "-") as CulinaryKnowledgeSourceV1["flavorRelations"][number]["semanticCategory"],
    strength: number(row.strength), evidenceCode: text(row.evidence_code),
    governance: governance(text(row.semantic_category) === "cultural_cooccurrence" ? "cultural-cooccurrence" : "cat-kitchen-calibration", calibrationFiles),
  })),
  dishArchetypes: rows(input, "dish_archetypes").map((row) => ({
    id: text(row.id), archetype: text(row.archetype), cuisineId: text(row.cuisine_id),
    ingredientIds: strings(row.ingredient_ids).sort(), sequence: strings(row.sequence),
    platingComponentIds: strings(row.plating_component_ids).sort(), engineCapabilityIds: strings(row.engine_capability_ids).sort(),
    commentaryEvidenceIds: strings(row.commentary_evidence_ids).sort(), taste: record(row.taste) as CulinaryKnowledgeSourceV1["dishArchetypes"][number]["taste"],
    aroma: number(row.aroma), texture: number(row.texture),
    governance: governance("cat-kitchen-calibration", calibrationFiles),
  })),
  cuisines: rows(input, "cuisines").map((row) => ({ id: text(row.id), label: text(row.label), governance: governance("cat-kitchen-calibration", calibrationFiles) })),
  platingComponents: rows(input, "plating_components").map((row) => ({ id: text(row.id), shape: text(row.shape), scale: number(row.scale), governance: governance("cat-kitchen-calibration", calibrationFiles) })),
  engineCapabilities: rows(input, "engine_capabilities").map((row) => ({ id: text(row.id), supports: strings(row.supports).sort(), governance: governance("cat-kitchen-calibration", calibrationFiles) })),
  commentaryEvidence: rows(input, "commentary_evidence").map((row) => {
    const localization = record(row.localization);
    return { id: text(row.id), channel: text(row.channel) as "commentary" | "cat_reaction", localizationKey: text(row.localization_key), localization: { en: text(localization.en), zhCN: text(localization.zh_CN) }, governance: governance("cat-kitchen-calibration", calibrationFiles) };
  }),
};

for (const key of ["ingredientStates", "ingredientKnowledge", "seasonings", "transformationRules", "flavorRelations", "dishArchetypes", "cuisines", "platingComponents", "engineCapabilities", "commentaryEvidence"] as const) {
  source[key].sort((left, right) => left.id.localeCompare(right.id));
}
writeStable(SOURCE_PATH, source);
console.log(JSON.stringify({ source: SOURCE_PATH, reference: REFERENCE_PATH, sourceFiles }));

function governance(kind: CulinaryKnowledgeProvenanceKind, sourceFiles: string[]): CulinaryKnowledgeGovernanceV1 {
  return { recordStatus: "reviewed", reviewStatus: "reviewed", rightsStatus: "approved", compatibilityStatus: "compatible", reviewer: "cooking-lab-goal17-culinary-knowledge-review", rightsReviewer: "cooking-lab-goal17-rights-review", provenance: { kind, sourceRevision: AUDITED_BASE, sourceFiles, notes: "Reviewed minimum Goal 17 knowledge; Cat Kitchen owns gameplay formula weights and thresholds." } };
}
function rows(value: JsonRecord, key: string): JsonRecord[] { const result = value[key]; if (!Array.isArray(result)) throw new Error(`${key} must be an array`); return result as JsonRecord[]; }
function record(value: unknown): JsonRecord { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("expected object"); return value as JsonRecord; }
function text(value: unknown): string { if (typeof value !== "string") throw new Error("expected string"); return value; }
function number(value: unknown): number { if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("expected finite number"); return value; }
function strings(value: unknown): string[] { if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) throw new Error("expected string array"); return [...value] as string[]; }
function stripGovernance(row: JsonRecord): JsonRecord { return Object.fromEntries(Object.entries(row).filter(([key]) => key !== "governance")); }
function sourceFile(path: string, role: CulinaryKnowledgeSourceFileV1["role"]): CulinaryKnowledgeSourceFileV1 { return { path, sha256: sha256(readFileSync(resolve(path))), role }; }
function writeStable(path: string, value: unknown): void { const target = resolve(path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, stableJson(value)); }
function mapNutrition(value: JsonRecord) { return { carbohydrateG: number(value.carbohydrate_g), energyKcal: number(value.energy_kcal), fatG: number(value.fat_g), fiberG: number(value.fiber_g), proteinG: number(value.protein_g) }; }
function mapPhysical(value: JsonRecord) { return { aromaPotential: number(value.aroma_potential), baseAcidity: number(value.base_acidity), baseBitterness: number(value.base_bitterness), basePungency: number(value.base_pungency), baseSweetness: number(value.base_sweetness), baseUmami: number(value.base_umami), browningPotential: number(value.browning_potential), evaporationRate: number(value.evaporation_rate), fatFraction: number(value.fat_fraction), proteinFraction: number(value.protein_fraction), sugarFraction: number(value.sugar_fraction), thermalResponse: number(value.thermal_response), waterFraction: number(value.water_fraction) }; }
function restoreGoal16PhysicalCalibration(value: JsonRecord): void {
  for (const ingredient of rows(value, "ingredient_knowledge")) {
    const physical = record(ingredient.physical_model);
    const water = number(physical.water_fraction);
    const protein = number(physical.protein_fraction);
    const sugar = number(physical.sugar_fraction);
    const umami = number(physical.base_umami);
    physical.thermal_response = quantize(1 + protein * 0.8);
    physical.evaporation_rate = quantize(0.72 + water * 0.2);
    physical.browning_potential = quantize(Math.min(1, Math.max(0, 0.25 + protein + sugar)));
    physical.aroma_potential = quantize(text(ingredient.role) === "aromatic" ? 0.55 : 0.24 + umami);
  }
  for (const seasoning of rows(value, "seasonings")) {
    if (text(seasoning.id) === "salt" || text(seasoning.id) === "sugar") {
      seasoning.heat_sensitivity = 0.5;
    }
  }
}
function quantize(value: number): number { return Number(value.toFixed(6)); }
