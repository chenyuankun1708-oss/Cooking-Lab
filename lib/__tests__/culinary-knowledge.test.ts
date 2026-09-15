import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertSourceFileHashes,
  compileCulinaryKnowledgeSnapshot,
  culinaryKnowledgeSourcePath,
} from "@/lib/culinary-knowledge";
import {
  parseCulinaryKnowledgeManifest,
  parseCulinaryKnowledgeSource,
  parseGameArtifactPath,
} from "@/lib/culinary-knowledge-runtime-schema";
import { stableJson } from "@/lib/stable-json";
import type { CulinaryKnowledgeSourceV1 } from "@/types/culinary-knowledge";

const hostileConformancePath = "game-data/culinary-knowledge/goal17-hostile-conformance.json";

function source(): CulinaryKnowledgeSourceV1 {
  return parseCulinaryKnowledgeSource(
    JSON.parse(readFileSync(culinaryKnowledgeSourcePath, "utf8")) as unknown,
  );
}

function removeProvenanceSourceFile(value: unknown, sourcePath: string): void {
  if (Array.isArray(value)) {
    for (const entry of value) removeProvenanceSourceFile(entry, sourcePath);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (
    Array.isArray(record.sourceFiles)
    && record.sourceFiles.every((entry) => typeof entry === "string")
  ) {
    record.sourceFiles = record.sourceFiles.filter((entry) => entry !== sourcePath);
  }
  for (const entry of Object.values(record)) removeProvenanceSourceFile(entry, sourcePath);
}

describe("Goal 17 reviewed Culinary Knowledge snapshot", () => {
  it("rejects every applicable shared hostile conformance case", () => {
    const corpus = JSON.parse(readFileSync(hostileConformancePath, "utf8")) as {
      schemaId: string;
      schemaVersion: number;
      expectedDecision: string;
      cases: Array<{ id: string; target: string }>;
    };
    expect(corpus).toMatchObject({
      schemaId: "cooking-lab-goal17-hostile-conformance-v1",
      schemaVersion: 1,
      expectedDecision: "reject",
    });
    expect(corpus.cases).toHaveLength(15);
    for (const testCase of corpus.cases) {
      if (testCase.target === "cat_snapshot") continue;
      if (testCase.target === "manifest") {
        const manifest = compileCulinaryKnowledgeSnapshot(source()).manifest;
        if (testCase.id === "negative_manifest_count") manifest.counts.ingredientKnowledge = -1;
        else if (testCase.id === "invalid_manifest_source_revision") manifest.sourceRevision = "invalid";
        else if (testCase.id === "duplicate_manifest_source_role") {
          manifest.sourceFiles[0].role = manifest.sourceFiles[1].role;
        } else throw new Error(`Unhandled manifest conformance case: ${testCase.id}`);
        expect(() => parseCulinaryKnowledgeManifest(manifest), testCase.id).toThrow();
        continue;
      }
      const invalid = structuredClone(source());
      if (testCase.id === "missing_required_source_role") {
        const removed = invalid.sourceFiles.find((entry) => entry.role === "nutrition-dataset");
        if (!removed) throw new Error("Missing nutrition fixture");
        invalid.sourceFiles = invalid.sourceFiles.filter((entry) => entry !== removed);
        removeProvenanceSourceFile(invalid, removed.path);
      } else if (testCase.id === "duplicate_required_source_role") {
        invalid.sourceFiles[0].role = invalid.sourceFiles[1].role;
      } else if (testCase.id === "negative_nutrition") {
        invalid.ingredientKnowledge[0].nutritionPer100g.energyKcal = -1;
      } else if (testCase.id === "negative_seasoning") {
        invalid.seasonings[0].saltinessPerG = -1;
      } else if (testCase.id === "negative_thermal_response") {
        invalid.ingredientKnowledge[0].physicalModel.thermalResponse = -1;
      } else if (testCase.id === "unary_flavor_relation") {
        invalid.flavorRelations[0].ingredientIds = [invalid.flavorRelations[0].ingredientIds[0]];
      } else if (testCase.id === "duplicate_flavor_relation") {
        const ingredientId = invalid.flavorRelations[0].ingredientIds[0];
        invalid.flavorRelations[0].ingredientIds = [ingredientId, ingredientId];
      } else if (testCase.id === "unknown_transformation_operation") {
        invalid.transformationRules[0].operationId = "unknown" as never;
      } else if (testCase.id === "unknown_engine_support") {
        invalid.engineCapabilities[0].supports[0] = "unknown";
      } else throw new Error(`Unhandled source conformance case: ${testCase.id}`);
      expect(() => parseCulinaryKnowledgeSource(invalid), testCase.id).toThrow();
    }
  });

  it("validates the committed authoring source and every pinned source hash", () => {
    const value = source();
    expect(value.ingredientKnowledge).toHaveLength(20);
    expect(value.dishArchetypes).toHaveLength(10);
    expect(
      value.dishArchetypes.every((archetype) => !("threshold" in archetype)),
    ).toBe(true);
    expect(value.sourceFiles).toHaveLength(5);
    expect(() => assertSourceFileHashes(value.sourceFiles)).not.toThrow();
  });

  it("keeps identity thresholds outside Cooking Lab knowledge", () => {
    const invalid = structuredClone(source()) as unknown as Record<string, unknown>;
    const archetypes = invalid.dishArchetypes as Array<Record<string, unknown>>;
    archetypes[0].threshold = 0.71;
    expect(() => parseCulinaryKnowledgeSource(invalid)).toThrow(/unexpected property/);
  });

  it("compiles byte-stable snapshot and manifest content", () => {
    const left = compileCulinaryKnowledgeSnapshot(source());
    const right = compileCulinaryKnowledgeSnapshot(source());
    expect(stableJson(left)).toBe(stableJson(right));
    expect(left.snapshot.physicalContentVersion).toBe("goal16-calibration-v1");
    expect(left.manifest.counts).toMatchObject({
      ingredientKnowledge: 20,
      dishArchetypes: 10,
      flavorRelations: 15,
    });
  });

  it("fails closed for placeholder, missing and mismatched source hashes", () => {
    const placeholder = structuredClone(source());
    placeholder.sourceFiles[0].sha256 = "1".repeat(64);
    expect(() => parseCulinaryKnowledgeSource(placeholder)).toThrow(/placeholder/);

    const missing = structuredClone(source());
    missing.sourceFiles[0].path = "game-data/culinary-knowledge/missing.json";
    expect(() => assertSourceFileHashes(missing.sourceFiles)).toThrow(/missing/);

    const mismatch = structuredClone(source());
    mismatch.sourceFiles[0].sha256 = "0".repeat(64);
    expect(() => assertSourceFileHashes(mismatch.sourceFiles)).toThrow(/mismatch/);
  });

  it("requires exactly one of every governed source role", () => {
    const missingRole = structuredClone(source());
    const nutritionPath = missingRole.sourceFiles.find(
      (entry) => entry.role === "nutrition-dataset",
    )?.path;
    expect(nutritionPath).toBeDefined();
    missingRole.sourceFiles = missingRole.sourceFiles.filter(
      (entry) => entry.role !== "nutrition-dataset",
    );
    removeProvenanceSourceFile(missingRole, nutritionPath as string);
    expect(() => parseCulinaryKnowledgeSource(missingRole)).toThrow(/exactly one.*required role/);

    const duplicateRole = structuredClone(source());
    duplicateRole.sourceFiles[0].role = duplicateRole.sourceFiles[1].role;
    expect(() => parseCulinaryKnowledgeSource(duplicateRole)).toThrow(/exactly one.*required role/);

    const compiled = compileCulinaryKnowledgeSnapshot(source());
    compiled.manifest.sourceFiles = duplicateRole.sourceFiles;
    expect(() => parseCulinaryKnowledgeManifest(compiled.manifest)).toThrow(
      /exactly one.*required role/,
    );
  });

  it("rejects unsafe paths, duplicate IDs and unknown references", () => {
    expect(() => parseGameArtifactPath("../Cooking Lab/source.json")).toThrow(/must not contain/);

    const duplicate = structuredClone(source());
    duplicate.ingredientKnowledge.push(structuredClone(duplicate.ingredientKnowledge[0]));
    expect(() => parseCulinaryKnowledgeSource(duplicate)).toThrow(/sorted unique/);

    const unknown = structuredClone(source());
    unknown.flavorRelations[0].ingredientIds[0] = "missing";
    expect(() => parseCulinaryKnowledgeSource(unknown)).toThrow(/unknown id/);

    const unaryRelation = structuredClone(source());
    unaryRelation.flavorRelations[0].ingredientIds = [
      unaryRelation.flavorRelations[0].ingredientIds[0],
    ];
    expect(() => parseCulinaryKnowledgeSource(unaryRelation)).toThrow(/exactly two distinct/);

    const unknownCapabilitySupport = structuredClone(source());
    unknownCapabilitySupport.engineCapabilities[0].supports[0] = "unknown_support";
    expect(() => parseCulinaryKnowledgeSource(unknownCapabilitySupport)).toThrow(/expected one of/);
  });

  it("rejects unreviewed, rights-unapproved and incompatible records", () => {
    for (const [key, value] of [
      ["reviewStatus", "draft"],
      ["rightsStatus", "unapproved"],
      ["compatibilityStatus", "incompatible"],
    ] as const) {
      const invalid = structuredClone(source()) as unknown as Record<string, unknown>;
      const rows = invalid.ingredientKnowledge as Array<Record<string, unknown>>;
      const governance = rows[0].governance as Record<string, unknown>;
      governance[key] = value;
      expect(() => parseCulinaryKnowledgeSource(invalid)).toThrow();
    }
  });

  it("rejects non-finite and over-precision numeric data", () => {
    const nonFinite = structuredClone(source());
    nonFinite.ingredientKnowledge[0].physicalModel.waterFraction = Number.NaN;
    expect(() => parseCulinaryKnowledgeSource(nonFinite)).toThrow(/finite/);

    const overPrecise = structuredClone(source());
    overPrecise.ingredientKnowledge[0].physicalModel.waterFraction = 0.1234567;
    expect(() => parseCulinaryKnowledgeSource(overPrecise)).toThrow(/six decimal/);
  });

  it("rejects negative physical, nutrition and seasoning quantities", () => {
    const negativeNutrition = structuredClone(source());
    negativeNutrition.ingredientKnowledge[0].nutritionPer100g.energyKcal = -1;
    expect(() => parseCulinaryKnowledgeSource(negativeNutrition)).toThrow(/non-negative/);

    const negativeThermalResponse = structuredClone(source());
    negativeThermalResponse.ingredientKnowledge[0].physicalModel.thermalResponse = -0.1;
    expect(() => parseCulinaryKnowledgeSource(negativeThermalResponse)).toThrow(/non-negative/);

    const negativeSeasoning = structuredClone(source());
    negativeSeasoning.seasonings[0].saltinessPerG = -0.1;
    expect(() => parseCulinaryKnowledgeSource(negativeSeasoning)).toThrow(/non-negative/);
  });

  it("requires a Git revision in the compiled manifest", () => {
    const compiled = compileCulinaryKnowledgeSnapshot(source());
    compiled.manifest.sourceRevision = "not-a-git-revision";
    expect(() => parseCulinaryKnowledgeManifest(compiled.manifest)).toThrow(
      /40-character Git SHA/,
    );

    const negativeCount = compileCulinaryKnowledgeSnapshot(source()).manifest;
    negativeCount.counts.ingredientKnowledge = -1;
    expect(() => parseCulinaryKnowledgeManifest(negativeCount)).toThrow(/non-negative integer/);
  });

  it("keeps cultural co-occurrence distinct from physical complement", () => {
    const cultural = structuredClone(source());
    cultural.flavorRelations[0].semanticCategory = "cultural-cooccurrence";
    cultural.flavorRelations[0].polarity = "association";
    expect(() => parseCulinaryKnowledgeSource(cultural)).toThrow(/provenance/);

    cultural.flavorRelations[0].governance.provenance.kind = "cultural-cooccurrence";
    cultural.flavorRelations[0].polarity = "complement";
    expect(() => parseCulinaryKnowledgeSource(cultural)).toThrow(/cannot claim physical/);
  });
});
