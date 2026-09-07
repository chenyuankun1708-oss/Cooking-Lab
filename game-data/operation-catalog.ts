import catalog from "./operations.json";
import {
  gameOperationCatalogVersion,
  type GameOperationDefinitionV1,
} from "@/types/game-recipe";

if (catalog.version !== gameOperationCatalogVersion) {
  throw new Error(`Unsupported game operation catalog version: ${catalog.version}`);
}

export const gameOperationCatalog = Object.freeze(
  catalog.operations as readonly GameOperationDefinitionV1[],
);

export const gameOperationById = new Map(gameOperationCatalog.map((operation) => [operation.id, operation]));
