import { describe, expect, it } from "vitest";
import { evaluatedSourceCatalog } from "@/data/research/evaluated-sources";
import {
  researchExerciseEvidence,
  researchExercises,
  researchExerciseSources,
} from "@/data/research/research-exercises";
import type { Source } from "@/types/culinary";
import type { ResearchRecord } from "@/types/research";
import { validateSource } from "../culinary-validation";
import {
  collectResearchRecordReferences,
  validateResearchRegistry,
  validateSourceCatalog,
} from "../research-validation";

const registry = {
  sources: researchExerciseSources,
  evidence: researchExerciseEvidence,
  records: researchExercises,
};

describe("content research and provenance", () => {
  it("validates the evaluated real-resource catalog deterministically", () => {
    expect(evaluatedSourceCatalog).toHaveLength(11);
    expect(validateSourceCatalog(evaluatedSourceCatalog)).toEqual([]);
    expect(validateSourceCatalog(evaluatedSourceCatalog)).toEqual(validateSourceCatalog(evaluatedSourceCatalog));
  });

  it("validates three migrated research exercises and their source graph", () => {
    expect(researchExercises).toHaveLength(3);
    expect(validateResearchRegistry(registry)).toEqual([]);
  });

  it("requires a valid subject and explicit uses on every accepted source", () => {
    const espresso = researchExercises[2];
    const invalidRecord = {
      ...espresso,
      id: "invalid-contract-record",
      subject: { type: "person", id: "" },
      sourceDecisions: espresso.sourceDecisions.map((decision, index) => (
        decision.disposition === "accepted" && index === 0
          ? { ...decision, uses: [] }
          : decision
      )),
    } as unknown as ResearchRecord;

    expect(validateResearchRegistry({ ...registry, records: [invalidRecord] })).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityId: "invalid-contract-record", field: "subject.type" }),
      expect.objectContaining({ entityId: "invalid-contract-record", field: "subject.id" }),
      expect.objectContaining({ entityId: "invalid-contract-record", field: "sourceDecisions.0.uses" }),
    ]));
  });

  it.each(["publication-candidate", "closed"] as const)(
    "requires two independent accepted sources for %s records",
    (status) => {
      const dongpo = researchExercises[0];
      const invalidRecord = {
        ...dongpo,
        id: `${status}-single-source-record`,
        status,
      } satisfies ResearchRecord;

      expect(validateResearchRegistry({ ...registry, records: [invalidRecord] })).toContainEqual(
        expect.objectContaining({
          entityId: `${status}-single-source-record`,
          field: "sourceDecisions",
          message: "Publication candidate 或 closed ResearchRecord 必须接受至少两个独立 Source",
        }),
      );
    },
  );

  it("collects only accepted sources and referenced evidence in registry order", () => {
    const espresso = researchExercises.find(({ id }) => id === "espresso-development-exercise")!;
    expect(collectResearchRecordReferences(espresso, registry)).toEqual({
      sources: [researchExerciseSources[2], researchExerciseSources[3]],
      evidence: [researchExerciseEvidence[3], researchExerciseEvidence[4]],
    });
  });

  it("supports URL, DOI, ISBN, archive, and physical Source locators", () => {
    const base: Omit<Source, "id" | "locators"> = {
      type: "book",
      title: "Retrievable source",
      publisherOrInstitution: "Example institution",
      authorNames: ["Example Author"],
      rights: { status: "reference-only", notes: "Facts only." },
      health: { status: "active", checkedAt: "2026-09-05" },
      reliability: "primary",
      editorialNotes: "Locator contract fixture.",
    };
    const sources: Source[] = [
      { ...base, id: "url-locator", locators: [{ kind: "url", url: "https://example.org/source", accessedAt: "2026-09-05" }] },
      { ...base, id: "doi-locator", type: "journal", locators: [{ kind: "doi", doi: "10.1234/example.2026" }] },
      { ...base, id: "isbn-locator", locators: [{ kind: "isbn", isbn: "978-1-4028-9462-6" }] },
      { ...base, id: "archive-locator", type: "archive", locators: [{ kind: "archive", identifier: "MS-42", collection: "Food Papers", holdingInstitution: "Example Archive" }] },
      { ...base, id: "physical-locator", locators: [{ kind: "physical-citation", citation: "Example Author, Retrievable source, 1927" }] },
    ];
    expect(sources.flatMap(validateSource)).toEqual([]);
  });

  it("requires complete open-license obligations and source health metadata", () => {
    const source: Source = {
      ...researchExerciseSources[0],
      id: "open-source-fixture",
      rights: {
        status: "open-license",
        licenseId: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        attribution: "Example Author, Example Work, CC BY-SA 4.0",
        adaptationStatus: "adapted",
        shareAlikeRequired: true,
        notes: "Adaptation must retain the same license.",
      },
    };
    expect(validateSource(source)).toEqual([]);

    const incomplete = {
      ...source,
      id: "incomplete-open-source",
      rights: { ...source.rights, attribution: "", licenseUrl: "http://example.org/license" },
      health: { status: "moved", checkedAt: "not-a-date" },
    } as Source;
    expect(validateSource(incomplete)).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "rights" }),
      expect.objectContaining({ field: "rights.attribution" }),
      expect.objectContaining({ field: "health.checkedAt" }),
      expect.objectContaining({ field: "health.notes" }),
    ]));
  });

  it("rejects duplicate references, missing evidence, and broken source references", () => {
    const dongpo = researchExercises[0];
    const invalidRecord = {
      ...dongpo,
      id: "invalid-research-record",
      sourceDecisions: [dongpo.sourceDecisions[0], dongpo.sourceDecisions[0]],
      claims: [{
        ...dongpo.claims[0],
        evidenceIds: ["missing-evidence", "missing-evidence"],
      }],
    } as ResearchRecord;
    const brokenEvidence = {
      ...researchExerciseEvidence[0],
      id: "broken-source-evidence",
      sourceId: "missing-source",
    };
    const issues = validateResearchRegistry({
      sources: researchExerciseSources,
      evidence: [...researchExerciseEvidence, brokenEvidence],
      records: [...researchExercises, invalidRecord],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityId: "invalid-research-record", field: "sourceDecisions.1.id" }),
      expect.objectContaining({ entityId: "invalid-research-record", field: "sourceDecisions.1.sourceId" }),
      expect.objectContaining({ entityId: "invalid-research-record", field: "claims.0.evidenceIds", message: "Evidence reference 不能重复" }),
      expect.objectContaining({ entityId: "invalid-research-record", field: "claims.0.evidenceIds", message: "不存在的 Evidence ID: missing-evidence" }),
      expect.objectContaining({ entityId: "broken-source-evidence", field: "sourceId" }),
    ]));
  });
});
