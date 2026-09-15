import { writeRecipes } from "./recipe-database-build";
import { buildBakingDrafts } from "./batch-d/baking-compact";
import { buildBartendingDrafts } from "./batch-d/bartending-compact";
import { buildDessertDrafts } from "./batch-d/dessert-compact";

/**
 * Batch D: 244 database recipes (86 baking, 87 bartending, 71 dessert)
 * reaching the 500-entry milestone — the Epic #106 final capacity gate
 * (issue #110, `game-data:audit --minimum-database=500`).
 */
const options = {
  generatorVersion: "m13-database-batch-d-1",
  sourceNotes: "Knowledge-base authored draft for the recipe database batch D; not eligible for Web publication or game export without full independent review.",
  accessedAt: "2026-09-15",
  allowOverwrite: true, // batch D files are deterministic; regeneration overwrites its own output
};

const drafts = [
  ...buildBakingDrafts(),
  ...buildBartendingDrafts(),
  ...buildDessertDrafts(),
];

const count = writeRecipes(drafts, options);
process.stdout.write(`Generated ${count} batch-D database recipes\n`);
