import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertSourceFileHashes,
  compileCulinaryKnowledgeSnapshot,
  culinaryKnowledgeSourcePath,
} from "@/lib/culinary-knowledge";
import {
  parseCulinaryKnowledgeSource,
  parseGameArtifactPath,
} from "@/lib/culinary-knowledge-runtime-schema";
import { stableJson } from "@/lib/stable-json";
import type { CulinaryKnowledgeSourceV1 } from "@/types/culinary-knowledge";

function source(): CulinaryKnowledgeSourceV1 {
  return parseCulinaryKnowledgeSource(
    JSON.parse(readFileSync(culinaryKnowledgeSourcePath, "utf8")) as unknown,
  );
}

describe("Goal 17 reviewed Culinary Knowledge snapshot", () => {
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

  it("rejects unsafe paths, duplicate IDs and unknown references", () => {
    expect(() => parseGameArtifactPath("../Cooking Lab/source.json")).toThrow(/must not contain/);

    const duplicate = structuredClone(source());
    duplicate.ingredientKnowledge.push(structuredClone(duplicate.ingredientKnowledge[0]));
    expect(() => parseCulinaryKnowledgeSource(duplicate)).toThrow(/sorted unique/);

    const unknown = structuredClone(source());
    unknown.flavorRelations[0].ingredientIds[0] = "missing";
    expect(() => parseCulinaryKnowledgeSource(unknown)).toThrow(/unknown id/);
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
