import {
  batchADishContentPackages,
  batchADishEvidence,
  batchADishImages,
  batchADishItems,
  batchADishResearchRecords,
  batchADishSources,
  batchADishStories,
} from "./batch-a-dishes";
import {
  batchANonDishEvidence,
  batchANonDishImages,
  batchANonDishItems,
  batchANonDishPackages,
  batchANonDishResearchRecords,
  batchANonDishSources,
  batchANonDishStories,
} from "./batch-a-nondishes";
import { m11BatchAItemIds } from "./portfolio";

export const m11BatchAItems = Object.freeze([...batchADishItems, ...batchANonDishItems]);
export const m11BatchAImages = Object.freeze([...batchADishImages, ...batchANonDishImages]);
export const m11BatchASources = Object.freeze([...batchADishSources, ...batchANonDishSources]);
export const m11BatchAEvidence = Object.freeze([...batchADishEvidence, ...batchANonDishEvidence]);
export const m11BatchAStories = Object.freeze([...batchADishStories, ...batchANonDishStories]);
export const m11BatchAResearchRecords = Object.freeze([...batchADishResearchRecords, ...batchANonDishResearchRecords]);
export const m11BatchAContentPackages = Object.freeze([...batchADishContentPackages, ...batchANonDishPackages]);

const actualIds = m11BatchAItems.map((item) => item.id).sort();
const expectedIds = [...m11BatchAItemIds].sort();
if (actualIds.join("\0") !== expectedIds.join("\0")) {
  throw new Error("M11 Batch A content does not match the committed portfolio contract");
}
