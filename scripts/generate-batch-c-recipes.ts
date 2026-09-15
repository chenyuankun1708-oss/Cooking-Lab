import { writeRecipes } from "./recipe-database-build";
import { buildBakingDrafts } from "./batch-c/baking-compact";
import { buildBartendingDrafts } from "./batch-c/bartending-compact";
import { buildDessertDrafts } from "./batch-c/dessert-compact";

/**
 * Batch C: 136 database recipes (43 baking, 52 bartending, 41 dessert)
 * reaching the 250-entry milestone (issue #109).
 *
 * Source mix: knowledge-base ai-assisted drafts, plus StarChefs
 * structure-adapted entries (web-curated sourceNotes with attribution —
 * see the adapted slugs below).
 */
const options = {
  generatorVersion: "m13-database-batch-c-1",
  sourceNotes: "Knowledge-base authored draft for the recipe database batch C; not eligible for Web publication or game export without full independent review.",
  accessedAt: "2026-09-14",
  allowOverwrite: true, // batch C files are deterministic; regeneration overwrites its own output
};

const drafts = [
  ...buildBakingDrafts(),
  ...buildBartendingDrafts(),
  ...buildDessertDrafts(),
];

const count = writeRecipes(drafts, options);
process.stdout.write(`Generated ${count} batch-C database recipes\n`);
