export const culinaryKnowledgeSourceSchemaId = "cooking-lab-culinary-knowledge-source-v1" as const;
export const culinaryKnowledgeSnapshotSchemaId = "cooking-lab-culinary-knowledge-snapshot-v1" as const;
export const culinaryKnowledgeManifestSchemaId = "cooking-lab-culinary-knowledge-manifest-v1" as const;

export type CulinaryKnowledgeProvenanceKind =
  | "cooking-lab-factual-source"
  | "cat-kitchen-calibration"
  | "cultural-cooccurrence";

export interface CulinaryKnowledgeSourceFileV1 {
  path: string;
  sha256: string;
  role:
    | "ingredient-catalog"
    | "operation-catalog"
    | "nutrition-dataset"
    | "rights-registry"
    | "cat-kitchen-goal16-fixture";
}

export interface CulinaryKnowledgeGovernanceV1 {
  recordStatus: "reviewed";
  reviewStatus: "reviewed";
  rightsStatus: "approved";
  compatibilityStatus: "compatible";
  reviewer: "cooking-lab-goal17-culinary-knowledge-review";
  rightsReviewer: "cooking-lab-goal17-rights-review";
  provenance: {
    kind: CulinaryKnowledgeProvenanceKind;
    sourceRevision: string;
    sourceFiles: string[];
    notes: string;
  };
}

export interface CulinaryKnowledgeSourceV1 {
  schemaId: typeof culinaryKnowledgeSourceSchemaId;
  schemaVersion: 1;
  sourceKind: "goal17-calibration";
  snapshotId: string;
  sourceRevision: string;
  sourceAuditSha: string;
  physicalContentVersion: string;
  owner: "Cooking Lab";
  recordStatus: "reviewed";
  reviewStatus: "reviewed";
  rightsStatus: "approved";
  compatibilityStatus: "compatible";
  sourceFiles: CulinaryKnowledgeSourceFileV1[];
  ingredientStates: Array<{ id: string; description: string; governance: CulinaryKnowledgeGovernanceV1 }>;
  ingredientKnowledge: Array<{
    id: string;
    role: "aromatic" | "fat" | "fruit" | "liquid" | "produce" | "protein" | "seasoning" | "starch";
    colorId: string;
    ingredientStateIds: string[];
    platingComponentId: string;
    nutritionPer100g: { carbohydrateG: number; energyKcal: number; fatG: number; fiberG: number; proteinG: number };
    retention: Record<"carbohydrate" | "energy" | "fat" | "fiber" | "protein", number>;
    physicalModel: {
      aromaPotential: number;
      baseAcidity: number;
      baseBitterness: number;
      basePungency: number;
      baseSweetness: number;
      baseUmami: number;
      browningPotential: number;
      evaporationRate: number;
      fatFraction: number;
      proteinFraction: number;
      sugarFraction: number;
      thermalResponse: number;
      waterFraction: number;
    };
    governance: CulinaryKnowledgeGovernanceV1;
  }>;
  seasonings: Array<{
    id: string;
    acidityPerG: number;
    aromaPerG: number;
    bitternessPerG: number;
    heatSensitivity: number;
    pungencyPerG: number;
    saltinessPerG: number;
    sweetnessPerG: number;
    umamiPerG: number;
    governance: CulinaryKnowledgeGovernanceV1;
  }>;
  transformationRules: Array<{ id: string; inputStateIds: string[]; operationId: string; outputStateIds: string[]; engineCapabilityIds: string[]; governance: CulinaryKnowledgeGovernanceV1 }>;
  flavorRelations: Array<{ id: string; ingredientIds: string[]; polarity: "association" | "complement" | "clash"; semanticCategory: "physical" | "cultural-cooccurrence"; strength: number; evidenceCode: string; governance: CulinaryKnowledgeGovernanceV1 }>;
  dishArchetypes: Array<{
    id: string;
    archetype: string;
    cuisineId: string;
    ingredientIds: string[];
    sequence: string[];
    platingComponentIds: string[];
    engineCapabilityIds: string[];
    commentaryEvidenceIds: string[];
    taste: { acidity: number; pungency: number; sweetness: number; umami: number };
    aroma: number;
    texture: number;
    governance: CulinaryKnowledgeGovernanceV1;
  }>;
  cuisines: Array<{ id: string; label: string; governance: CulinaryKnowledgeGovernanceV1 }>;
  platingComponents: Array<{ id: string; shape: string; scale: number; governance: CulinaryKnowledgeGovernanceV1 }>;
  engineCapabilities: Array<{ id: string; supports: string[]; governance: CulinaryKnowledgeGovernanceV1 }>;
  commentaryEvidence: Array<{ id: string; channel: "commentary" | "cat_reaction"; localizationKey: string; localization: { en: string; zhCN: string }; governance: CulinaryKnowledgeGovernanceV1 }>;
}

export interface CulinaryKnowledgeSnapshotV1 extends Omit<CulinaryKnowledgeSourceV1, "schemaId"> {
  schemaId: typeof culinaryKnowledgeSnapshotSchemaId;
  compiledSnapshotId: string;
  sourceSha256: string;
}

export interface CulinaryKnowledgeManifestV1 {
  schemaId: typeof culinaryKnowledgeManifestSchemaId;
  schemaVersion: 1;
  snapshotId: string;
  sourcePath: string;
  sourceSha256: string;
  compiledSnapshotPath: string;
  compiledSnapshotSha256: string;
  sourceRevision: string;
  sourceFiles: CulinaryKnowledgeSourceFileV1[];
  counts: Record<"ingredientStates" | "ingredientKnowledge" | "seasonings" | "transformationRules" | "flavorRelations" | "dishArchetypes" | "cuisines" | "platingComponents" | "engineCapabilities" | "commentaryEvidence", number>;
}
