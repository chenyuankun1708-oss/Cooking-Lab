import catalog from "./operations.json";
import { parseGameOperationCatalog } from "@/lib/game-data-runtime-schema";

const parsedCatalog = parseGameOperationCatalog(catalog, "game-data/operations.json");

export const gameOperationCatalog = Object.freeze(
  parsedCatalog.operations,
);

export const gameOperationById = new Map(gameOperationCatalog.map((operation) => [operation.id, operation]));
