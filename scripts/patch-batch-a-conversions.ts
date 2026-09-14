import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";

/** Adds missing conversion records for existing catalog ingredients referenced by batch A. */
const path = resolve(process.cwd(), "game-data/source/ingredients.json");
const catalog = JSON.parse(readFileSync(path, "utf8")) as {
  conversionRecords: Array<{ recordId: string; unit: string; gramsPerUnit: number; ingredientId?: string; basis: string; provenanceId: string }>;
};
const have = new Set(catalog.conversionRecords.map((r) => r.recordId));

const records: Array<[string, string, number, string, string]> = [
  ["usda-baking-powder:tsp:weight-v1", "tsp", 4.6, "usda-baking-powder", "cooking-lab-editorial-nutrition-usda-baking-powder"],
  ["usda-vanilla:tsp:weight-v1", "tsp", 4.2, "usda-vanilla", "cooking-lab-editorial-nutrition-usda-vanilla"],
  ["usda-honey:tbsp:weight-v1", "tbsp", 21, "usda-honey", "cooking-lab-editorial-nutrition-usda-honey"],
  ["usda-banana:piece:weight-v1", "piece", 120, "usda-banana", "cooking-lab-editorial-nutrition-usda-banana"],
  ["lemon:tsp:weight-v1", "tsp", 5, "lemon", "cooking-lab-editorial-nutrition-lemon"],
  ["lime:tbsp:weight-v1", "tbsp", 15, "lime", "cooking-lab-editorial-nutrition-lime"],
];

let added = 0;
for (const [recordId, unit, gramsPerUnit, ingredientId, provenanceId] of records) {
  if (have.has(recordId)) continue;
  catalog.conversionRecords.push({
    recordId,
    unit,
    gramsPerUnit,
    ingredientId,
    basis: "Cooking Lab editorial estimate unit weight; database batch A.",
    provenanceId,
  });
  added += 1;
}
writeFileSync(path, stableJson(catalog), "utf8");
process.stdout.write(`Added ${added} conversion records\n`);
