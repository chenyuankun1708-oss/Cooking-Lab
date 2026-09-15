import { createContentVersion } from "./content-version";
import type { LocSourceRegistryV1 } from "@/types/loc-recipe-source";

export function createLocSourceRegistrySliceVersion(
  registry: LocSourceRegistryV1,
  documentIds: Iterable<string>,
): string {
  const ids = [...new Set(documentIds)].sort();
  const documentsById = new Map(registry.documents.map((document) => [document.documentId, document]));
  const documents = ids.map((id) => {
    const document = documentsById.get(id);
    if (!document) throw new Error(`LOC source registry is missing document ${id}`);
    return document;
  });
  return createContentVersion({
    schemaVersion: registry.schemaVersion,
    provider: registry.provider,
    rightsStatement: registry.rightsStatement,
    documents,
  });
}
