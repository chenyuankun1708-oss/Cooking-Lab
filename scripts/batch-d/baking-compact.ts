import type { DraftRecipe, PortionSpec, OpSpec } from "../recipe-database-build";
import type { FlavorProfile } from "@/types/flavor";

/**
 * Batch D baking drafts (85 recipes) — config-driven like batch C.
 */

type P = { id: string; g: number };
const g = (id: string, grams: number): P => ({ id, g: grams });

interface Row {
  slug: string;
  cuisine: string;
  flavor: FlavorProfile;
  ps: P[];
  seasoning?: string[];
  ovenC?: number;
  bakeMs?: number;
  contexts?: string[];
  item?: "dish" | "dessert";
  servings?: number;
  yieldCount?: number;
  dry?: number[];
  wet?: number[];
  stovetop?: boolean; // pan-fry flow instead of oven
}

/** Standard bake flow: dry mix → wet whisk → combine (all) → bake → remove → serve. */
function bakeFlow(row: Row): DraftRecipe {
  const slug = row.slug;
  const itemType = row.item ?? "dessert";
  const servings = row.servings ?? 8;
  const dryIdx = row.dry ?? [];
  const wetIdx = row.wet ?? [];
  const portions: PortionSpec[] = row.ps.map((p) => ({
    id: p.id,
    grams: p.g,
    amount: p.g,
    unit: "g" as const,
    conversionId: "si:g:v1",
    role: row.seasoning?.includes(p.id) ? ("seasoning" as const) : ("main" as const),
    state: (["milk", "heavy-cream", "buttermilk", "evaporated-milk", "usda-canola-oil", "extra-virgin-olive-oil", "drinking-water", "sour-cream", "coconut-milk", "molasses", "applesauce", "dulce-de-leche", "creme-fraiche"].includes(p.id) ? ("liquid" as const) : undefined),
  }));
  const mlIds = new Set(["milk", "heavy-cream", "buttermilk", "evaporated-milk", "usda-canola-oil", "extra-virgin-olive-oil", "drinking-water", "sour-cream", "coconut-milk"]);
  for (const p of portions) {
    if (mlIds.has(p.id)) {
      p.unit = "ml";
      p.conversionId = `${p.id}:ml:weight-v1`;
    }
  }
  const ops: OpSpec[] = [];
  ops.push({ op: "mix", inputs: dryIdx.length ? dryIdx : [0], durationMs: 30000, params: { strength: 0.3 } });
  if (wetIdx.length) ops.push({ op: "whisk", inputs: wetIdx, durationMs: 60000, params: { strength: 0.5 } });
  const allIdx = row.ps.map((_, i) => i);
  ops.push({ op: "mix", inputs: allIdx, durationMs: 30000, params: { strength: 0.35 }, targets: [{ dimension: "structural-integrity", minimum: 0.65, unit: "normalized" }] });
  if (row.stovetop) {
    ops.push({ op: "pan-fry", inputs: [], durationMs: 300000, params: { temperatureC: 185 }, targets: [{ dimension: "browning", minimum: 0.4, maximum: 0.65, unit: "normalized" }, { dimension: "doneness", minimum: 0.95, unit: "normalized" }], equipment: "frying-pan" });
  } else {
    ops.push({ op: "bake", inputs: [], waitMs: row.bakeMs ?? 1800000, params: { temperatureC: row.ovenC ?? 180 }, targets: [{ dimension: "doneness", minimum: 0.95, unit: "normalized" }, { dimension: "browning", minimum: 0.4, maximum: 0.65, unit: "normalized" }], equipment: "oven" });
  }
  ops.push({ op: "remove", inputs: [], durationMs: 5000 });
  ops.push({ op: "serve", inputs: [], durationMs: 5000 });
  return {
    slug,
    itemType,
    servings,
    yieldAmount: row.yieldCount ?? servings,
    yieldUnit: "piece",
    simulationProfile: "requires-cat-kitchen-v2",
    categoryTags: itemType === "dessert" ? ["baking", "dessert"] : ["baking"],
    cuisineIds: [row.cuisine],
    mealRoleIds: itemType === "dessert" ? ["dessert"] : ["side"],
    servingContextIds: row.contexts ?? ["after-meal"],
    flavor: row.flavor,
    portions,
    ops,
  };
}

const rows: Row[] = [
  // ================= breads (15) =================
  { slug: "pullman-loaf", cuisine: "french", flavor: { tastes: { sweet: 1, salty: 1 }, aromaIds: ["toasty"], textureIds: ["soft", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 450), g("milk", 270), g("butter", 60), g("granulated-sugar", 40), g("active-dry-yeast", 6), g("salt", 9)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2100000, item: "dish", dry: [0, 4, 5], wet: [1] },
  { slug: "potato-bread", cuisine: "american", flavor: { tastes: { sweet: 1, salty: 1 }, textureIds: ["soft", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 400), g("potato-starch", 100), g("milk", 240), g("butter", 50), g("granulated-sugar", 30), g("active-dry-yeast", 6), g("salt", 8)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 1800000, item: "dish", dry: [0, 1, 4, 5, 6], wet: [2] },
  { slug: "olive-bread", cuisine: "italian", flavor: { tastes: { salty: 2 }, aromaIds: ["herbal", "toasty"], textureIds: ["chewy", "crisp"], characterIds: ["comforting", "appetizing"] },
    ps: [g("wheat-flour", 450), g("drinking-water", 320), g("extra-virgin-olive-oil", 40), g("kalamata-olive", 120), g("active-dry-yeast", 5), g("salt", 10)], seasoning: [],
    ovenC: 230, bakeMs: 1500000, item: "dish", dry: [0, 4, 5], wet: [1] },
  { slug: "fougasse", cuisine: "french", flavor: { tastes: { salty: 1 }, aromaIds: ["herbal", "toasty"], textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 400), g("drinking-water", 300), g("extra-virgin-olive-oil", 50), g("active-dry-yeast", 5), g("salt", 9)], seasoning: [],
    ovenC: 240, bakeMs: 900000, item: "dish", dry: [0, 3, 4], wet: [1] },
  { slug: "lavash-crackers", cuisine: "western", flavor: { tastes: { salty: 2 }, textureIds: ["crisp"], characterIds: ["light"] },
    ps: [g("wheat-flour", 250), g("drinking-water", 120), g("extra-virgin-olive-oil", 40), g("salt", 5), g("sesame-oil", 8)], seasoning: [],
    ovenC: 220, bakeMs: 480000, item: "dish", servings: 12, yieldCount: 12, dry: [0, 3], wet: [1] },
  { slug: "irish-soda-bread", cuisine: "british", flavor: { tastes: { salty: 1, sour: 1 }, aromaIds: ["toasty"], textureIds: ["crisp", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 400), g("buttermilk", 350), g("baking-soda", 6), g("salt", 6), g("raisin", 100)], seasoning: [],
    ovenC: 200, bakeMs: 2400000, item: "dish", dry: [0, 2, 3], wet: [1] },
  { slug: "beer-bread", cuisine: "american", flavor: { tastes: { salty: 1, bitter: 1 }, aromaIds: ["toasty"], textureIds: ["chewy", "crisp"], characterIds: ["hearty"] },
    ps: [g("wheat-flour", 400), g("ginger-ale", 300), g("granulated-sugar", 50), g("usda-baking-powder", 12), g("salt", 5)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 3000000, item: "dish", dry: [0, 2, 3, 4], wet: [1] },
  { slug: "cottage-loaf", cuisine: "british", flavor: { tastes: { salty: 1 }, textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 500), g("drinking-water", 330), g("butter", 30), g("active-dry-yeast", 5), g("salt", 10)], seasoning: [],
    ovenC: 220, bakeMs: 2400000, item: "dish", dry: [0, 3, 4], wet: [1] },
  { slug: "banana-yeast-bread", cuisine: "american", flavor: { tastes: { sweet: 2 }, aromaIds: ["fruity", "toasty"], textureIds: ["soft"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 350), g("usda-banana", 250), g("milk", 150), g("butter", 50), g("granulated-sugar", 60), g("active-dry-yeast", 6), g("salt", 6)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 2400000, item: "dish", dry: [0, 4, 5, 6], wet: [2] },
  { slug: "pretzels-soft", cuisine: "western", flavor: { tastes: { salty: 3 }, aromaIds: ["toasty"], textureIds: ["chewy", "crisp"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 450), g("drinking-water", 260), g("butter", 40), g("brown-sugar", 20), g("active-dry-yeast", 5), g("salt", 10)], seasoning: ["brown-sugar"],
    ovenC: 220, bakeMs: 900000, item: "dish", servings: 8, yieldCount: 8, dry: [0, 3, 4, 5], wet: [1] },
  { slug: "anpan", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "chewy"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 300), g("milk", 180), g("butter", 40), g("granulated-sugar", 40), g("active-dry-yeast", 5), g("salt", 4), g("red-bean-paste", 250)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 720000, item: "dish", servings: 8, yieldCount: 8, dry: [0, 3, 4, 5], wet: [1] },
  { slug: "melon-pan", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["crisp", "soft"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 300), g("milk", 150), g("butter", 80), g("granulated-sugar", 80), g("active-dry-yeast", 5), g("salt", 4)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 720000, item: "dish", servings: 8, yieldCount: 8, dry: [0, 3, 4, 5], wet: [1] },
  { slug: "concha", cuisine: "mexican", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 400), g("milk", 200), g("butter", 100), g("granulated-sugar", 90), g("active-dry-yeast", 7), g("salt", 5)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 900000, item: "dish", servings: 10, yieldCount: 10, dry: [0, 3, 4, 5], wet: [1] },
  { slug: "bolillo-rolls", cuisine: "mexican", flavor: { tastes: { salty: 1 }, textureIds: ["crisp", "soft"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 450), g("drinking-water", 260), g("lard", 30), g("granulated-sugar", 15), g("active-dry-yeast", 6), g("salt", 9)], seasoning: ["granulated-sugar"],
    ovenC: 220, bakeMs: 900000, item: "dish", servings: 10, yieldCount: 10, dry: [0, 3, 4, 5], wet: [1] },
  { slug: "brioche-feuilletee", cuisine: "french", flavor: { tastes: { sweet: 3 }, textureIds: ["crisp"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 400), g("butter", 250), g("milk", 130), g("granulated-sugar", 70), g("active-dry-yeast", 7), g("salt", 8)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 1200000, item: "dish", servings: 8, yieldCount: 8, dry: [0, 3, 4, 5], wet: [2] },
  // ================= cakes (18) =================
  { slug: "carrot-sheet-cake", cuisine: "american", flavor: { tastes: { sweet: 3, spicy: 1 }, aromaIds: ["spiced", "fruity"], textureIds: ["soft", "creamy"], characterIds: ["comforting", "warming"] },
    ps: [g("wheat-flour", 250), g("granulated-sugar", 200), g("usda-carrot", 250), g("egg", 150), g("usda-canola-oil", 150), g("cinnamon", 5), g("cream-cheese", 200)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 2400000, dry: [0, 1, 5], wet: [2, 3, 4] },
  { slug: "spice-cake", cuisine: "american", flavor: { tastes: { sweet: 3, spicy: 2 }, aromaIds: ["spiced"], textureIds: ["soft"], characterIds: ["warming", "comforting"] },
    ps: [g("wheat-flour", 250), g("brown-sugar", 200), g("butter", 120), g("egg", 150), g("molasses", 80), g("cinnamon", 5), g("ginger", 3)], seasoning: ["brown-sugar"],
    ovenC: 175, bakeMs: 2100000, dry: [0, 1, 5, 6], wet: [2, 3, 4] },
  { slug: "applesauce-cake", cuisine: "american", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "spiced"], textureIds: ["soft", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("applesauce", 250), g("brown-sugar", 150), g("egg", 100), g("butter", 80), g("cinnamon", 4)], seasoning: ["brown-sugar"],
    ovenC: 175, bakeMs: 3000000, dry: [0, 2, 5], wet: [1, 3, 4] },
  { slug: "pound-cake-lemon", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["citrusy"], textureIds: ["soft", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 220), g("butter", 220), g("granulated-sugar", 220), g("egg", 200), g("lemon", 40)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 3300000, dry: [0, 2], wet: [1, 3, 4] },
  { slug: "marble-pound-cake", cuisine: "western", flavor: { tastes: { sweet: 3, bitter: 1 }, textureIds: ["soft", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 220), g("butter", 200), g("granulated-sugar", 200), g("egg", 200), g("usda-cocoa", 25)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 3000000, dry: [0, 2, 4], wet: [1, 3] },
  { slug: "coffee-cake", cuisine: "american", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted", "spiced"], textureIds: ["soft", "crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 120), g("granulated-sugar", 150), g("egg", 100), g("sour-cream", 200), g("brown-sugar", 80), g("cinnamon", 5)], seasoning: ["granulated-sugar", "brown-sugar"],
    ovenC: 175, bakeMs: 2400000, contexts: ["breakfast", "afternoon-tea"], dry: [0, 2, 5, 6], wet: [1, 3, 4] },
  { slug: "upside-down-cake", cuisine: "american", flavor: { tastes: { sweet: 4, sour: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["soft", "chewy"], characterIds: ["comforting"] },
    ps: [g("canned-pineapple", 300), g("wheat-flour", 200), g("butter", 120), g("brown-sugar", 120), g("egg", 150), g("usda-baking-powder", 8)], seasoning: ["brown-sugar"],
    ovenC: 175, bakeMs: 2400000, dry: [1, 3, 5], wet: [2, 4] },
  { slug: "funfetti-cake", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["soft", "creamy"], characterIds: ["light", "comforting"] },
    ps: [g("cake-flour", 240), g("butter", 180), g("granulated-sugar", 220), g("egg", 180), g("milk", 180), g("usda-vanilla", 5)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1800000, contexts: ["social-gathering", "after-meal"], dry: [0, 2], wet: [1, 3, 4, 5] },
  { slug: "lemon-drizzle-cake", cuisine: "british", flavor: { tastes: { sweet: 3, sour: 3 }, aromaIds: ["citrusy"], textureIds: ["soft", "saucy"], characterIds: ["refreshing", "light"] },
    ps: [g("wheat-flour", 220), g("butter", 200), g("granulated-sugar", 200), g("egg", 200), g("lemon", 60), g("powdered-sugar", 80)], seasoning: ["granulated-sugar", "powdered-sugar"],
    ovenC: 175, bakeMs: 2700000, contexts: ["afternoon-tea"], dry: [0, 2, 5], wet: [1, 3, 4] },
  { slug: "bundes-torte", cuisine: "western", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted", "fruity"], textureIds: ["soft", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 200), g("dark-chocolate", 200), g("butter", 200), g("granulated-sugar", 180), g("egg", 200), g("apricot-brandy", 30)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 2400000, dry: [0, 2], wet: [1, 3, 4, 5] },
  { slug: "torta-caprese", cuisine: "italian", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["chewy", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("almond-flour", 200), g("dark-chocolate", 250), g("butter", 200), g("granulated-sugar", 180), g("egg", 200)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 2400000, dry: [0, 3], wet: [1, 2, 4] },
  { slug: "castagnaccio", cuisine: "italian", flavor: { tastes: { sweet: 2 }, aromaIds: ["roasted"], textureIds: ["chewy"], characterIds: ["hearty", "comforting"] },
    ps: [g("usda-corn-flour", 300), g("raisin", 60), g("walnut", 90), g("extra-virgin-olive-oil", 60), g("drinking-water", 450)], seasoning: [],
    ovenC: 200, bakeMs: 1800000, dry: [0, 1], wet: [3, 4] },
  { slug: "basque-burnt-cheesecake", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted", "toasty"], textureIds: ["creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("cream-cheese", 680), g("granulated-sugar", 180), g("egg", 250), g("heavy-cream", 300), g("almond-flour", 25)], seasoning: ["granulated-sugar"],
    ovenC: 220, bakeMs: 2700000, dry: [1, 4], wet: [0, 2, 3] },
  { slug: "souffle-rolls-cake", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "silky"], characterIds: ["light", "comforting"] },
    ps: [g("cake-flour", 80), g("egg", 240), g("granulated-sugar", 80), g("milk", 60), g("heavy-cream", 200)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1200000, dry: [0, 2], wet: [1, 3] },
  { slug: "castella", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["soft", "tender"], characterIds: ["light", "comforting"] },
    ps: [g("wheat-flour", 150), g("egg", 250), g("granulated-sugar", 150), g("usda-honey", 30), g("milk", 30)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 3000000, dry: [0, 2], wet: [1, 3, 4] },
  { slug: "banana-chiffon", cuisine: "western", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity"], textureIds: ["soft", "silky"], characterIds: ["light"] },
    ps: [g("cake-flour", 160), g("usda-banana", 200), g("egg", 200), g("granulated-sugar", 130), g("usda-canola-oil", 60), g("usda-baking-powder", 5)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 3000000, dry: [0, 2, 5], wet: [1, 3, 4] },
  { slug: "gateau-yogurt-cake", cuisine: "french", flavor: { tastes: { sweet: 2, sour: 1 }, textureIds: ["soft", "tender"], characterIds: ["light", "refreshing"] },
    ps: [g("wheat-flour", 180), g("usda-yogurt", 250), g("granulated-sugar", 130), g("egg", 150), g("butter", 80), g("usda-baking-powder", 8)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 2700000, dry: [0, 2, 5], wet: [1, 3, 4] },
  { slug: "semolina-cake", cuisine: "western", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["chewy", "soft"], characterIds: ["comforting"] },
    ps: [g("usda-corn-flour", 150), g("granulated-sugar", 150), g("egg", 150), g("butter", 120), g("usda-baking-powder", 8)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 2400000, dry: [0, 1, 4], wet: [2, 3] },
  { slug: "opera-cream-cake-roll", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["soft", "creamy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 100), g("egg", 250), g("granulated-sugar", 130), g("butter", 150), g("dark-chocolate", 150), g("instant-coffee", 8)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 720000, dry: [0, 2, 5], wet: [1, 3, 4] },
  // ================= cookies & bars (18) =================
  { slug: "snickerdoodles", cuisine: "american", flavor: { tastes: { sweet: 3 }, aromaIds: ["spiced"], textureIds: ["soft", "crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 280), g("butter", 200), g("granulated-sugar", 150), g("egg", 100), g("cinnamon", 8), g("cream-of-tartar", 4)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 600000, servings: 24, yieldCount: 24, contexts: ["afternoon-tea", "social-gathering"], dry: [0, 2, 4, 5], wet: [1, 3] },
  { slug: "peanut-butter-cookies", cuisine: "american", flavor: { tastes: { sweet: 3, salty: 1 }, textureIds: ["chewy", "crisp"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 220), g("roasted-peanut", 150), g("butter", 150), g("brown-sugar", 150), g("egg", 100), g("granulated-sugar", 80)], seasoning: ["brown-sugar", "granulated-sugar"],
    ovenC: 180, bakeMs: 600000, servings: 24, yieldCount: 24, dry: [0, 3, 5], wet: [1, 2, 4] },
  { slug: "oatmeal-chocolate-chip-cookies", cuisine: "american", flavor: { tastes: { sweet: 3, bitter: 1 }, textureIds: ["chewy", "crisp"], characterIds: ["comforting"] },
    ps: [g("usda-oats", 250), g("wheat-flour", 150), g("butter", 200), g("brown-sugar", 150), g("semisweet-chocolate-chips", 200), g("egg", 100)], seasoning: ["brown-sugar"],
    ovenC: 180, bakeMs: 600000, servings: 24, yieldCount: 24, dry: [0, 1, 3], wet: [2, 4, 5] },
  { slug: "white-chocolate-macadamia-cookies", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["chewy", "crisp"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 250), g("butter", 200), g("brown-sugar", 150), g("white-chocolate", 180), g("pecan", 120), g("egg", 100)], seasoning: ["brown-sugar"],
    ovenC: 180, bakeMs: 600000, servings: 24, yieldCount: 24, dry: [0, 2], wet: [1, 3, 4, 5] },
  { slug: "thumbprint-cookies", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity"], textureIds: ["tender", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 200), g("granulated-sugar", 80), g("egg", 50), g("raspberry", 120), g("usda-vanilla", 4)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 900000, servings: 24, yieldCount: 24, dry: [0, 2], wet: [1, 3, 5] },
  { slug: "pizzelle", cuisine: "italian", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["crisp"], characterIds: ["light"] },
    ps: [g("wheat-flour", 250), g("egg", 200), g("butter", 150), g("granulated-sugar", 150), g("usda-vanilla", 4)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 300000, servings: 24, yieldCount: 24, contexts: ["afternoon-tea", "social-gathering"], dry: [0, 3], wet: [1, 2, 4] },
  { slug: "krumkake", cuisine: "western", flavor: { tastes: { sweet: 3 }, textureIds: ["crisp"], characterIds: ["light"] },
    ps: [g("wheat-flour", 200), g("butter", 150), g("granulated-sugar", 150), g("egg", 150), g("milk", 100), g("cinnamon", 3)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 300000, servings: 24, yieldCount: 24, dry: [0, 2, 5], wet: [1, 3, 4] },
  { slug: "rosettes", cuisine: "western", flavor: { tastes: { sweet: 2 }, textureIds: ["crisp"], characterIds: ["light"] },
    ps: [g("wheat-flour", 150), g("egg", 100), g("milk", 200), g("granulated-sugar", 40), g("powdered-sugar", 30)], seasoning: ["granulated-sugar", "powdered-sugar"],
    ovenC: 190, bakeMs: 240000, servings: 20, yieldCount: 20, stovetop: true, dry: [0, 3, 4], wet: [1, 2] },
  { slug: "brandy-snaps", cuisine: "british", flavor: { tastes: { sweet: 3, spicy: 1 }, aromaIds: ["gingery"], textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 120), g("butter", 100), g("brown-sugar", 150), g("molasses", 100), g("ginger", 5)], seasoning: ["brown-sugar"],
    ovenC: 180, bakeMs: 480000, servings: 20, yieldCount: 20, dry: [0, 1, 2, 4], wet: [3] },
  { slug: "lemon-bars", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 4 }, aromaIds: ["citrusy"], textureIds: ["tender", "saucy"], characterIds: ["refreshing", "light"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("granulated-sugar", 250), g("egg", 150), g("lemon", 100)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1500000, servings: 16, yieldCount: 16, dry: [0, 2], wet: [1, 3, 4] },
  { slug: "lime-bars", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 4 }, aromaIds: ["citrusy"], textureIds: ["tender", "saucy"], characterIds: ["refreshing"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("granulated-sugar", 250), g("egg", 150), g("lime", 100)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1500000, servings: 16, yieldCount: 16, dry: [0, 2], wet: [1, 3, 4] },
  { slug: "pecan-bars", cuisine: "american", flavor: { tastes: { sweet: 4, salty: 1 }, aromaIds: ["roasted", "toasty"], textureIds: ["chewy", "crisp"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 200), g("butter", 120), g("brown-sugar", 180), g("pecan", 250), g("egg", 100)], seasoning: ["brown-sugar"],
    ovenC: 175, bakeMs: 1500000, servings: 16, yieldCount: 16, dry: [0, 2], wet: [1, 3, 4] },
  { slug: "blondies", cuisine: "american", flavor: { tastes: { sweet: 4 }, aromaIds: ["toasty"], textureIds: ["chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("butter", 180), g("brown-sugar", 250), g("egg", 150), g("semisweet-chocolate-chips", 120)], seasoning: ["brown-sugar"],
    ovenC: 175, bakeMs: 1500000, servings: 16, yieldCount: 16, dry: [0, 2], wet: [1, 3, 4] },
  { slug: "brownies-fudge", cuisine: "american", flavor: { tastes: { sweet: 4, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["chewy", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("dark-chocolate", 250), g("butter", 200), g("granulated-sugar", 250), g("egg", 200), g("wheat-flour", 100), g("usda-cocoa", 30)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1500000, servings: 16, yieldCount: 16, dry: [2, 4, 5], wet: [0, 1, 3] },
  { slug: "seven-layer-bars", cuisine: "american", flavor: { tastes: { sweet: 4, salty: 1 }, textureIds: ["chewy", "crisp"], characterIds: ["comforting", "hearty"] },
    ps: [g("butter", 120), g("granulated-sugar", 100), g("brown-sugar", 100), g("shredded-coconut", 100), g("semisweet-chocolate-chips", 150), g("walnut", 100)], seasoning: ["granulated-sugar", "brown-sugar"],
    ovenC: 175, bakeMs: 900000, servings: 16, yieldCount: 16, dry: [1, 2, 3, 4, 5], wet: [0] },
  { slug: "nanaimo-bars", cuisine: "western", flavor: { tastes: { sweet: 4 }, textureIds: ["creamy", "crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 100), g("butter", 200), g("granulated-sugar", 100), g("usda-cocoa", 30), g("instant-coffee", 20), g("semisweet-chocolate-chips", 150)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 900000, servings: 16, yieldCount: 16, dry: [0, 2, 3, 4], wet: [1, 5] },
  { slug: "shortbread-petticoat-tails", cuisine: "british", flavor: { tastes: { sweet: 2 }, textureIds: ["crisp", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 300), g("butter", 200), g("granulated-sugar", 90), g("salt", 2)], seasoning: ["granulated-sugar"],
    ovenC: 160, bakeMs: 1800000, servings: 16, yieldCount: 16, contexts: ["afternoon-tea"], dry: [0, 2, 3], wet: [1] },
  { slug: "anzac-biscuits", cuisine: "british", flavor: { tastes: { sweet: 3, salty: 1 }, aromaIds: ["toasty", "floral"], textureIds: ["chewy", "crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 150), g("usda-oats", 150), g("shredded-coconut", 100), g("butter", 150), g("brown-sugar", 150), g("molasses", 40)], seasoning: ["brown-sugar"],
    ovenC: 160, bakeMs: 720000, servings: 24, yieldCount: 24, dry: [0, 1, 2, 4], wet: [3, 5] },
  // ================= pastries, pies & tarts (16) =================
  { slug: "galette-rustic-apple", cuisine: "french", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["crisp", "tender"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("usda-apple", 500), g("granulated-sugar", 80), g("cinnamon", 3)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 2400000, dry: [0, 3, 4], wet: [1] },
  { slug: "plum-galette", cuisine: "french", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["crisp", "juicy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("dark-cherries", 400), g("granulated-sugar", 80), g("almond-flour", 50)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 2400000, dry: [0, 3, 4], wet: [1] },
  { slug: "rustic-pear-tart", cuisine: "french", flavor: { tastes: { sweet: 2, sour: 1 }, aromaIds: ["fruity"], textureIds: ["tender", "juicy"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("asian-pear", 400), g("granulated-sugar", 60), g("almond-flour", 50)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2400000, dry: [0, 3, 4], wet: [1] },
  { slug: "fig-frangipane-tart", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["fruity", "roasted"], textureIds: ["tender", "creamy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("butter", 100), g("almond-flour", 150), g("granulated-sugar", 100), g("egg", 100), g("fig", 300)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2400000, dry: [0, 3], wet: [1, 2, 4] },
  { slug: "frangipane-pear-tart", cuisine: "french", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity"], textureIds: ["tender", "creamy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("butter", 100), g("almond-flour", 150), g("granulated-sugar", 100), g("egg", 100), g("asian-pear", 350)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2400000, dry: [0, 3], wet: [1, 2, 4] },
  { slug: "mississippi-mud-pie", cuisine: "american", flavor: { tastes: { sweet: 4, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["creamy", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 200), g("butter", 120), g("dark-chocolate", 200), g("usda-cocoa", 40), g("granulated-sugar", 200), g("heavy-cream", 200), g("usda-honey", 60)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1800000, dry: [0, 3, 4], wet: [1, 2, 5] },
  { slug: "chess-pie", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["creamy", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 150), g("butter", 100), g("granulated-sugar", 300), g("egg", 150), g("usda-cornstarch", 20), g("milk", 100)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 2700000, dry: [0, 2, 4], wet: [1, 3, 5] },
  { slug: "vinegar-pie", cuisine: "american", flavor: { tastes: { sweet: 4, sour: 1 }, textureIds: ["creamy", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 150), g("butter", 100), g("granulated-sugar", 280), g("egg", 150), g("usda-cornstarch", 20), g("lemon", 30)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 3000000, dry: [0, 2, 4], wet: [1, 3] },
  { slug: "sugar-cream-pie", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 150), g("butter", 100), g("granulated-sugar", 250), g("heavy-cream", 350), g("usda-cornstarch", 20)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 3000000, dry: [0, 2, 4], wet: [1, 3] },
  { slug: "grape-jelly-pie", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["saucy", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("butter", 120), g("dark-cherries", 400), g("granulated-sugar", 150)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2400000, dry: [0, 3], wet: [1] },
  { slug: "shaker-lemon-pie", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 4 }, aromaIds: ["citrusy"], textureIds: ["tender", "saucy"], characterIds: ["refreshing"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("lemon", 400), g("granulated-sugar", 250), g("egg", 150)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2700000, dry: [0, 3], wet: [1, 2, 4] },
  { slug: "apple-turnovers", cuisine: "western", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "toasty"], textureIds: ["crisp", "saucy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 350), g("butter", 250), g("usda-apple", 400), g("granulated-sugar", 100), g("cinnamon", 3)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 1800000, servings: 8, yieldCount: 8, dry: [0, 3, 4], wet: [1] },
  { slug: "strudel-apple", cuisine: "western", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["crisp", "saucy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("usda-apple", 600), g("granulated-sugar", 100), g("raisin", 60), g("almond-flour", 50)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2400000, dry: [0, 3], wet: [1] },
  { slug: "kolacky", cuisine: "western", flavor: { tastes: { sweet: 3 }, textureIds: ["tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("cream-cheese", 200), g("butter", 200), g("granulated-sugar", 60), g("guava-paste", 150)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1500000, servings: 24, yieldCount: 24, dry: [0, 3], wet: [1, 2] },
  { slug: "hand-pies-cherry", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["crisp", "saucy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 300), g("butter", 200), g("dark-cherries", 400), g("granulated-sugar", 100), g("usda-cornstarch", 20)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 1800000, servings: 8, yieldCount: 8, dry: [0, 3, 4], wet: [1] },
  { slug: "empanadas-apple", cuisine: "mexican", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "spiced"], textureIds: ["crisp", "saucy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 350), g("lard", 150), g("usda-apple", 400), g("brown-sugar", 100), g("cinnamon", 4)], seasoning: ["brown-sugar"],
    ovenC: 190, bakeMs: 1800000, servings: 12, yieldCount: 12, dry: [0, 3, 4], wet: [1] },
  // ================= international & savory bakes (18) =================
  { slug: "baklava", cuisine: "western", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral", "roasted"], textureIds: ["crisp", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 300), g("walnut", 300), g("pistachio", 150), g("butter", 200), g("usda-honey", 150), g("cinnamon", 3)], seasoning: [],
    ovenC: 175, bakeMs: 2700000, servings: 24, yieldCount: 24, dry: [0, 1, 2, 5], wet: [3, 4] },
  { slug: "kanafeh", cuisine: "western", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral", "roasted"], textureIds: ["crisp", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 200), g("ricotta", 400), g("butter", 150), g("usda-honey", 120), g("pistachio", 100)], seasoning: [],
    ovenC: 190, bakeMs: 2400000, servings: 12, yieldCount: 12, dry: [0, 3], wet: [1, 2, 4] },
  { slug: "basbousa", cuisine: "western", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral"], textureIds: ["soft", "saucy"], characterIds: ["comforting"] },
    ps: [g("usda-corn-flour", 100), g("usda-yogurt", 250), g("butter", 120), g("granulated-sugar", 180), g("shredded-coconut", 60)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1800000, servings: 16, yieldCount: 16, dry: [0, 4], wet: [2, 3] },
  { slug: "maamoul", cuisine: "western", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["tender", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 300), g("usda-corn-flour", 100), g("butter", 200), g("date-fruit", 300), g("powdered-sugar", 50), g("usda-vanilla", 4)], seasoning: ["powdered-sugar"],
    ovenC: 175, bakeMs: 1500000, servings: 24, yieldCount: 24, dry: [0, 1, 4], wet: [2] },
  { slug: "gulab-jamun", cuisine: "indian", flavor: { tastes: { sweet: 4 }, textureIds: ["soft", "saucy"], characterIds: ["comforting", "warming"] },
    ps: [g("milk-powder", 200), g("wheat-flour", 50), g("butter", 60), g("usda-yogurt", 30), g("granulated-sugar", 200), g("cinnamon", 3)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 900000, servings: 20, yieldCount: 20, stovetop: true, dry: [0, 1, 3, 5], wet: [2] },
  { slug: "churros", cuisine: "mexican", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("drinking-water", 250), g("butter", 50), g("granulated-sugar", 100), g("cinnamon", 5), g("salt", 2)], seasoning: ["granulated-sugar", "cinnamon"],
    ovenC: 200, bakeMs: 600000, servings: 12, yieldCount: 12, stovetop: true, dry: [0, 3, 4, 5], wet: [1, 2] },
  { slug: "sopapillas", cuisine: "mexican", flavor: { tastes: { sweet: 2, salty: 1 }, textureIds: ["crisp", "soft"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 300), g("lard", 60), g("drinking-water", 180), g("usda-baking-powder", 8), g("salt", 4), g("usda-honey", 80)], seasoning: [],
    ovenC: 200, bakeMs: 600000, servings: 12, yieldCount: 12, stovetop: true, dry: [0, 3, 4], wet: [1, 2] },
  { slug: "beignets", cuisine: "french", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["soft", "crisp"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 300), g("milk", 200), g("egg", 100), g("butter", 60), g("granulated-sugar", 40), g("active-dry-yeast", 7), g("powdered-sugar", 60)], seasoning: ["granulated-sugar", "powdered-sugar"],
    ovenC: 190, bakeMs: 900000, servings: 16, yieldCount: 16, stovetop: true, dry: [0, 4, 5, 6], wet: [1, 2, 3] },
  { slug: "scallion-pancake-baked", cuisine: "chinese", flavor: { tastes: { salty: 2 }, aromaIds: ["garlicky", "toasty"], textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 300), g("drinking-water", 200), g("sesame-oil", 30), g("garlic", 40), g("salt", 5)], seasoning: [],
    ovenC: 210, bakeMs: 900000, item: "dish", servings: 6, yieldCount: 6, dry: [0, 4], wet: [1] },
  { slug: "cong-you-bing", cuisine: "chinese", flavor: { tastes: { salty: 2 }, aromaIds: ["toasty", "garlicky"], textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 300), g("drinking-water", 200), g("sesame-oil", 40), g("garlic", 50), g("salt", 5)], seasoning: [],
    ovenC: 200, bakeMs: 900000, item: "dish", servings: 6, yieldCount: 6, stovetop: true, dry: [0, 4], wet: [1] },
  { slug: "paratha", cuisine: "indian", flavor: { tastes: { salty: 1 }, aromaIds: ["toasty"], textureIds: ["crisp", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 300), g("drinking-water", 180), g("butter", 80), g("salt", 4)], seasoning: [],
    ovenC: 200, bakeMs: 600000, item: "dish", servings: 6, yieldCount: 6, stovetop: true, dry: [0, 3], wet: [1] },
  { slug: "biscuits-and-gravy-biscuits", cuisine: "american", flavor: { tastes: { salty: 2 }, textureIds: ["crisp", "tender"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 300), g("butter", 120), g("buttermilk", 300), g("usda-baking-powder", 12), g("salt", 5)], seasoning: [],
    ovenC: 230, bakeMs: 600000, item: "dish", servings: 8, yieldCount: 8, dry: [0, 3, 4], wet: [1, 2], contexts: ["breakfast"] },
  { slug: "hushpuppies", cuisine: "american", flavor: { tastes: { salty: 1, sweet: 1 }, textureIds: ["crisp", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("usda-corn-flour", 200), g("wheat-flour", 100), g("egg", 100), g("buttermilk", 200), g("garlic", 30), g("baking-soda", 4)], seasoning: [],
    ovenC: 190, bakeMs: 600000, item: "dish", servings: 12, yieldCount: 12, stovetop: true, dry: [0, 1, 5], wet: [2, 3] },
  { slug: "corn-pudding-baked", cuisine: "american", flavor: { tastes: { sweet: 2, salty: 1 }, textureIds: ["soft", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("usda-corn", 300), g("egg", 200), g("heavy-cream", 200), g("granulated-sugar", 40), g("butter", 40), g("salt", 3)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 2700000, item: "dish", dry: [3, 5], wet: [0, 1, 2, 4] },
  { slug: "dressing-bread-cubes", cuisine: "american", flavor: { tastes: { salty: 2 }, aromaIds: ["herbal"], textureIds: ["crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 400), g("butter", 60), g("drinking-water", 260), g("active-dry-yeast", 5), g("salt", 8), g("fresh-rosemary", 4)], seasoning: [],
    ovenC: 200, bakeMs: 600000, item: "dish", dry: [0, 3, 4, 5], wet: [2], contexts: ["dinner"] },
  { slug: "fruitcake", cuisine: "british", flavor: { tastes: { sweet: 4 }, aromaIds: ["fruity", "spiced"], textureIds: ["chewy", "soft"], characterIds: ["hearty", "warming"] },
    ps: [g("wheat-flour", 250), g("butter", 200), g("brown-sugar", 200), g("egg", 200), g("raisin", 200), g("candied-peel", 100), g("cinnamon", 4), g("peach-brandy", 60)], seasoning: ["brown-sugar"],
    ovenC: 150, bakeMs: 5400000, servings: 16, yieldCount: 16, dry: [0, 2, 6], wet: [1, 3, 7] },
  { slug: "stollen", cuisine: "western", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "spiced"], textureIds: ["chewy", "soft"], characterIds: ["comforting", "warming"] },
    ps: [g("wheat-flour", 400), g("butter", 200), g("granulated-sugar", 100), g("egg", 150), g("raisin", 150), g("candied-peel", 80), g("marzipan", 150), g("active-dry-yeast", 7)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 3300000, servings: 12, yieldCount: 12, dry: [0, 2, 6, 7], wet: [1, 3] },
  { slug: "panettone", cuisine: "italian", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "floral"], textureIds: ["soft", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 450), g("butter", 200), g("granulated-sugar", 150), g("egg", 250), g("raisin", 150), g("candied-peel", 100), g("active-dry-yeast", 10)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 3000000, servings: 12, yieldCount: 12, dry: [0, 2, 6], wet: [1, 3] },
];

export function buildBakingDrafts(): DraftRecipe[] {
  return rows.map(bakeFlow);
}
