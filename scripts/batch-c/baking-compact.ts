import type { DraftRecipe, PortionSpec, OpSpec } from "../recipe-database-build";
import type { FlavorProfile } from "@/types/flavor";

/**
 * Compact config-driven batch C drafts.
 * Each recipe is one config row; category templates expand them into full
 * DraftRecipe structures (validated operation contracts).
 */

type P = { id: string; g: number }; // ingredient + grams
interface Row {
  slug: string;
  cuisine: string;
  flavor: FlavorProfile;
  ps: P[]; // portions in order (role inferred: seasoning set below)
  seasoning?: string[]; // ingredient ids that are seasoning role
  ovenC?: number; // bake temperature
  bakeMs?: number;
  contexts?: string[];
  item?: "dish" | "dessert";
  servings?: number;
  yieldCount?: number;
  custard?: boolean; // adds custard step (lemon tart style)
  dry?: number[]; // dry-ingredient indexes (0-based) for first mix
  wet?: number[]; // wet-ingredient indexes (0-based) for the wet whisk
}

const g = (id: string, grams: number): P => ({ id, g: grams });

/** Standard bake flow: dry mix → wet whisk → combine → bake → remove → serve. */
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
    state: (["milk", "heavy-cream", "buttermilk", "evaporated-milk", "usda-canola-oil", "extra-virgin-olive-oil", "drinking-water", "sour-cream", "coconut-milk", "molasses", "applesauce", "honey", "ginger-ale", "orange-juice", "cranberry-juice", "pineapple-juice", "tomato-juice"].includes(p.id) ? ("liquid" as const) : undefined),
  }));
  // liquid portions with ml conversion if available
  const mlIngredients = new Set(["milk", "heavy-cream", "buttermilk", "evaporated-milk", "usda-canola-oil", "extra-virgin-olive-oil", "drinking-water", "sour-cream", "coconut-milk", "soy-milk"]);
  for (const p of portions) {
    if (mlIngredients.has(p.id)) {
      p.unit = "ml";
      p.conversionId = `${p.id}:ml:weight-v1`;
    }
  }
  const ops: OpSpec[] = [];
  ops.push({ op: "mix", inputs: dryIdx.length ? dryIdx : [0], durationMs: 30000, params: { strength: 0.3 } });
  if (wetIdx.length) ops.push({ op: "whisk", inputs: wetIdx, durationMs: 60000, params: { strength: 0.5 } });
  // Final combine: bind EVERY portion so nothing is orphaned (validator requires
  // each portion to enter at least one operation).
  const allIdx = row.ps.map((_, i) => i);
  ops.push({ op: "mix", inputs: allIdx, durationMs: 30000, params: { strength: 0.35 }, targets: [{ dimension: "structural-integrity", minimum: 0.65, unit: "normalized" }] });
  if (row.custard) {
    ops.push({ op: "strain", inputs: [], durationMs: 15000 });
    ops.push({ op: "assemble", inputs: [], durationMs: 30000 });
  }
  ops.push({ op: "bake", inputs: [], waitMs: row.bakeMs ?? 1800000, params: { temperatureC: row.ovenC ?? 180 }, targets: [{ dimension: "doneness", minimum: 0.95, unit: "normalized" }, { dimension: "browning", minimum: 0.4, maximum: 0.65, unit: "normalized" }], equipment: "oven" });
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

export const bakingCompact: Row[] = [
  // ---- pies & tarts (10) ----
  { slug: "french-apple-tart", cuisine: "french", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["crisp", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 200), g("butter", 100), g("granulated-sugar", 30), g("usda-apple", 600), g("powdered-sugar", 20)], seasoning: ["granulated-sugar", "powdered-sugar"],
    ovenC: 190, bakeMs: 2400000, contexts: ["after-meal", "afternoon-tea"], dry: [0, 2], wet: [1] },
  { slug: "coconut-cream-pie", cuisine: "american", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["creamy", "crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 180), g("butter", 90), g("cream-of-coconut", 300), g("milk", 300), g("granulated-sugar", 80), g("egg", 100), g("shredded-coconut", 60)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1800000, contexts: ["after-meal"], dry: [0, 4], wet: [2, 3, 5] },
  { slug: "banana-cream-pie", cuisine: "american", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity"], textureIds: ["creamy", "soft"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 180), g("butter", 90), g("usda-banana", 300), g("milk", 400), g("granulated-sugar", 70), g("egg", 100), g("heavy-cream", 150)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1500000, contexts: ["after-meal"], dry: [0, 4], wet: [2, 3, 5] },
  { slug: "cherry-lattice-tart", cuisine: "western", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["crisp", "juicy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("dark-cherries", 500), g("granulated-sugar", 100), g("lemon", 15)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 2400000, contexts: ["after-meal", "social-gathering"], dry: [0], wet: [1] },
  { slug: "french-silk-pie", cuisine: "american", flavor: { tastes: { sweet: 4, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["silky", "creamy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 180), g("butter", 190), g("dark-chocolate", 200), g("granulated-sugar", 100), g("egg", 100), g("heavy-cream", 150)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1500000, contexts: ["after-meal"], dry: [0], wet: [2, 3, 4, 5] },
  { slug: "key-lime-pie", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 3 }, aromaIds: ["citrusy"], textureIds: ["creamy"], characterIds: ["refreshing"] },
    ps: [g("wheat-flour", 180), g("butter", 90), g("evaporated-milk", 400), g("granulated-sugar", 120), g("lime", 90), g("egg", 150)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 900000, contexts: ["after-meal"], dry: [0, 3], wet: [2, 4, 5] },
  { slug: "buttermilk-pie", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 1 }, textureIds: ["creamy", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("butter", 100), g("buttermilk", 300), g("granulated-sugar", 200), g("egg", 150), g("usda-vanilla", 4)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 3000000, contexts: ["after-meal"], dry: [0, 3], wet: [1, 2, 4] },
  { slug: "shoofly-pie", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["chewy", "crisp"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 220), g("molasses", 200), g("brown-sugar", 150), g("butter", 100), g("drinking-water", 120), g("baking-soda", 3)], seasoning: ["brown-sugar"],
    ovenC: 200, bakeMs: 2400000, contexts: ["after-meal"], dry: [0, 2], wet: [1, 3, 4] },
  { slug: "tarte-tatin", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["tender", "juicy"], characterIds: ["comforting"] },
    ps: [g("usda-apple", 700), g("granulated-sugar", 150), g("butter", 180), g("wheat-flour", 200)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 2100000, contexts: ["after-meal"], dry: [3], wet: [2] },
  { slug: "ganache-tart", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["silky"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 180), g("butter", 90), g("dark-chocolate", 250), g("heavy-cream", 250), g("granulated-sugar", 30)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1500000, contexts: ["after-meal"], dry: [0, 4], wet: [1] },
  // ---- cakes (12) ----
  { slug: "red-velvet-cake", cuisine: "american", flavor: { tastes: { sweet: 3 }, aromaIds: ["roasted"], textureIds: ["soft", "creamy"], characterIds: ["comforting"] },
    ps: [g("cake-flour", 250), g("granulated-sugar", 250), g("butter", 120), g("egg", 150), g("buttermilk", 240), g("usda-cocoa", 15), g("baking-soda", 5), g("cream-cheese", 200)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1800000, contexts: ["after-meal", "social-gathering"], dry: [0, 5, 6], wet: [2, 3, 4] },
  { slug: "black-forest-cake", cuisine: "western", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted", "fruity"], textureIds: ["soft", "creamy", "juicy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("granulated-sugar", 200), g("egg", 200), g("dark-chocolate", 100), g("butter", 100), g("dark-cherries", 400), g("heavy-cream", 300)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 2100000, contexts: ["after-meal"], dry: [0, 3], wet: [2, 4] },
  { slug: "opera-cake", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["silky", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("almond-flour", 100), g("egg", 200), g("granulated-sugar", 150), g("butter", 200), g("dark-chocolate", 200), g("brewed-espresso", 100), g("wheat-flour", 60)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 1500000, contexts: ["after-meal", "afternoon-tea"], dry: [0, 6, 2], wet: [1] },
  { slug: "victoria-sponge", cuisine: "british", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["soft", "creamy"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 200), g("butter", 200), g("granulated-sugar", 200), g("egg", 200), g("usda-baking-powder", 8), g("heavy-cream", 200), g("strawberry", 300)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1500000, contexts: ["afternoon-tea", "after-meal"], dry: [0, 4, 2], wet: [1, 3] },
  { slug: "hummingbird-cake", cuisine: "american", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "toasty"], textureIds: ["soft", "chewy"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 250), g("granulated-sugar", 200), g("egg", 150), g("usda-canola-oil", 150), g("usda-banana", 200), g("mango", 150), g("pecan", 100), g("cream-cheese", 200)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 2400000, contexts: ["after-meal"], dry: [0, 1], wet: [2, 3] },
  { slug: "chiffon-cake", cuisine: "western", flavor: { tastes: { sweet: 2 }, textureIds: ["soft", "silky"], characterIds: ["light", "comforting"] },
    ps: [g("cake-flour", 180), g("egg", 250), g("granulated-sugar", 150), g("usda-canola-oil", 90), g("drinking-water", 110), g("cream-of-tartar", 3)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 3300000, contexts: ["afternoon-tea", "after-meal"], dry: [0, 2, 5], wet: [1, 3, 4] },
  { slug: "flourless-chocolate-cake", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 3 }, aromaIds: ["roasted"], textureIds: ["creamy", "silky"], characterIds: ["comforting", "hearty"] },
    ps: [g("dark-chocolate", 300), g("butter", 200), g("egg", 250), g("granulated-sugar", 150)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 2400000, contexts: ["after-meal"], dry: [3], wet: [2] },
  { slug: "olive-oil-citrus-cake", cuisine: "italian", flavor: { tastes: { sweet: 2, sour: 1 }, aromaIds: ["citrusy"], textureIds: ["soft", "tender"], characterIds: ["light", "refreshing"] },
    ps: [g("wheat-flour", 250), g("extra-virgin-olive-oil", 200), g("granulated-sugar", 200), g("egg", 200), g("lemon", 60), g("usda-baking-powder", 10)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 2700000, contexts: ["afternoon-tea", "after-meal"], dry: [0, 2, 5], wet: [1, 3, 4] },
  { slug: "tres-leches-cake", cuisine: "mexican", flavor: { tastes: { sweet: 4 }, textureIds: ["soft", "creamy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("granulated-sugar", 200), g("egg", 200), g("butter", 100), g("evaporated-milk", 200), g("heavy-cream", 200), g("sweetened-condensed-milk", 200)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 1800000, contexts: ["after-meal"], dry: [0, 1], wet: [2, 3] },
  { slug: "coconut-cake", cuisine: "american", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["soft", "creamy"], characterIds: ["comforting", "light"] },
    ps: [g("cake-flour", 250), g("butter", 200), g("granulated-sugar", 250), g("egg", 200), g("coconut-milk", 200), g("shredded-coconut", 100), g("cream-cheese", 200)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 2100000, contexts: ["after-meal"], dry: [0, 2], wet: [1, 3, 4] },
  { slug: "marble-cake", cuisine: "western", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted"], textureIds: ["soft", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 200), g("granulated-sugar", 200), g("egg", 200), g("milk", 120), g("usda-cocoa", 30), g("usda-baking-powder", 10)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 3000000, contexts: ["afternoon-tea"], dry: [0, 2, 5, 6], wet: [1, 3, 4] },
  { slug: "classic-cupcakes", cuisine: "american", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "creamy"], characterIds: ["comforting", "light"] },
    ps: [g("cake-flour", 200), g("butter", 150), g("granulated-sugar", 180), g("egg", 150), g("milk", 150), g("usda-baking-powder", 8), g("heavy-cream", 200)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1200000, servings: 12, yieldCount: 12, contexts: ["social-gathering", "afternoon-tea"], dry: [0, 2, 5], wet: [1, 3, 4] },
  // ---- cookies & biscuits (11) ----
  { slug: "chocolate-chip-cookies", cuisine: "american", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted", "toasty"], textureIds: ["chewy", "crisp"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 200), g("brown-sugar", 150), g("granulated-sugar", 50), g("egg", 100), g("semisweet-chocolate-chips", 250), g("baking-soda", 4)], seasoning: ["brown-sugar", "granulated-sugar"],
    ovenC: 180, bakeMs: 600000, servings: 24, yieldCount: 24, contexts: ["afternoon-tea", "social-gathering"], dry: [0, 2, 3, 6], wet: [1, 4] },
  { slug: "gingerbread", cuisine: "western", flavor: { tastes: { sweet: 3, spicy: 2 }, aromaIds: ["spiced"], textureIds: ["chewy", "soft"], characterIds: ["warming", "comforting"] },
    ps: [g("wheat-flour", 300), g("molasses", 200), g("butter", 100), g("brown-sugar", 100), g("egg", 50), g("baking-soda", 5), g("cinnamon", 6), g("ginger", 4)], seasoning: ["brown-sugar"],
    ovenC: 175, bakeMs: 3000000, contexts: ["social-gathering"], dry: [0, 3, 5, 6, 7], wet: [1, 2, 4] },
  { slug: "snowball-cookies", cuisine: "mexican", flavor: { tastes: { sweet: 3 }, textureIds: ["crisp", "tender"], characterIds: ["light", "comforting"] },
    ps: [g("butter", 200), g("powdered-sugar", 80), g("wheat-flour", 200), g("usda-vanilla", 4), g("walnut", 80), g("salt", 1)], seasoning: ["powdered-sugar"],
    ovenC: 160, bakeMs: 900000, servings: 24, yieldCount: 24, contexts: ["afternoon-tea", "social-gathering"], dry: [1, 2, 4, 5], wet: [0, 3] },
  { slug: "florentines", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 1 }, textureIds: ["crisp", "chewy"], characterIds: ["light"] },
    ps: [g("usda-butter", 60), g("granulated-sugar", 150), g("semisweet-chocolate-chips", 150), g("almond-flour", 80), g("heavy-cream", 60), g("salt", 1)], seasoning: ["granulated-sugar"],
    ovenC: 160, bakeMs: 600000, servings: 20, yieldCount: 20, contexts: ["afternoon-tea"], dry: [1, 3, 5], wet: [0, 4] },
  { slug: "shortbread-earl-grey", cuisine: "british", flavor: { tastes: { sweet: 2 }, aromaIds: ["floral"], textureIds: ["crisp", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("butter", 200), g("powdered-sugar", 80), g("wheat-flour", 280), g("black-tea-leaf", 6), g("salt", 1)], seasoning: ["powdered-sugar"],
    ovenC: 160, bakeMs: 1500000, servings: 24, yieldCount: 24, contexts: ["afternoon-tea"], dry: [1, 2, 3, 4], wet: [0] },
  { slug: "cranberry-biscotti", cuisine: "italian", flavor: { tastes: { sweet: 2, sour: 2 }, textureIds: ["crisp", "chewy"], characterIds: ["light", "comforting"] },
    ps: [g("wheat-flour", 300), g("granulated-sugar", 180), g("egg", 150), g("butter", 60), g("raisin", 150), g("usda-baking-powder", 8)], seasoning: ["granulated-sugar"],
    ovenC: 170, bakeMs: 1500000, servings: 30, yieldCount: 30, contexts: ["afternoon-tea", "social-gathering"], dry: [0, 1, 5], wet: [2, 3] },
  { slug: "linzer-cookies", cuisine: "western", flavor: { tastes: { sweet: 3, sour: 1 }, textureIds: ["crisp", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 200), g("granulated-sugar", 100), g("egg", 100), g("almond-flour", 100), g("raspberry", 150)], seasoning: ["granulated-sugar"],
    ovenC: 175, bakeMs: 600000, servings: 24, yieldCount: 24, contexts: ["afternoon-tea", "social-gathering"], dry: [0, 2, 4], wet: [1, 3] },
  { slug: "honey-madeleines", cuisine: "french", flavor: { tastes: { sweet: 2 }, aromaIds: ["toasty", "floral"], textureIds: ["soft", "tender"], characterIds: ["light", "comforting"] },
    ps: [g("wheat-flour", 120), g("egg", 150), g("granulated-sugar", 100), g("butter", 120), g("usda-honey", 30), g("lemon", 6)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 480000, servings: 12, yieldCount: 12, contexts: ["afternoon-tea"], dry: [0, 2], wet: [1, 3, 4, 5] },
  { slug: "rugelach", cuisine: "western", flavor: { tastes: { sweet: 3 }, textureIds: ["tender", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 200), g("cream-cheese", 200), g("butter", 150), g("granulated-sugar", 80), g("raspberry", 100), g("walnut", 80)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 1500000, servings: 24, yieldCount: 24, contexts: ["afternoon-tea", "social-gathering"], dry: [0, 3, 5], wet: [1, 2] },
  { slug: "coconut-macaroons", cuisine: "western", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["chewy", "crisp"], characterIds: ["light"] },
    ps: [g("shredded-coconut", 300), g("sweetened-condensed-milk", 200), g("egg", 100), g("usda-vanilla", 4), g("salt", 1)], seasoning: [],
    ovenC: 170, bakeMs: 900000, servings: 20, yieldCount: 20, contexts: ["afternoon-tea", "after-meal"], dry: [0, 4], wet: [1, 2] },
  { slug: "drop-biscuits", cuisine: "american", flavor: { tastes: { salty: 1, sweet: 1 }, textureIds: ["crisp", "tender"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 250), g("butter", 100), g("buttermilk", 300), g("usda-baking-powder", 10), g("salt", 4)], seasoning: [],
    ovenC: 220, bakeMs: 720000, servings: 10, yieldCount: 10, contexts: ["dinner"], dry: [0, 3, 4], wet: [1, 2] },
  // ---- viennoiserie & others (10) ----
  { slug: "croissants", cuisine: "french", flavor: { tastes: { sweet: 1, salty: 1 }, aromaIds: ["toasty"], textureIds: ["crisp", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 500), g("butter", 280), g("milk", 130), g("granulated-sugar", 50), g("active-dry-yeast", 8), g("salt", 10)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 900000, servings: 8, yieldCount: 8, contexts: ["breakfast"], dry: [0, 3, 4, 5], wet: [2] },
  { slug: "danish-pastry", cuisine: "french", flavor: { tastes: { sweet: 2 }, textureIds: ["crisp", "tender"], characterIds: ["light", "comforting"] },
    ps: [g("wheat-flour", 450), g("butter", 250), g("milk", 150), g("egg", 100), g("granulated-sugar", 60), g("active-dry-yeast", 7), g("cream-cheese", 200)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 900000, servings: 10, yieldCount: 10, contexts: ["breakfast", "afternoon-tea"], dry: [0, 4, 5], wet: [2, 3] },
  { slug: "chocolate-babka", cuisine: "western", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted", "toasty"], textureIds: ["chewy", "soft"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 400), g("butter", 150), g("milk", 120), g("egg", 150), g("granulated-sugar", 80), g("active-dry-yeast", 7), g("dark-chocolate", 200), g("cocoa-powder", 30)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 2100000, servings: 10, yieldCount: 10, contexts: ["breakfast", "afternoon-tea"], dry: [0, 4, 5], wet: [1, 2, 3] },
  { slug: "pain-au-chocolat", cuisine: "french", flavor: { tastes: { sweet: 2, bitter: 1 }, textureIds: ["crisp", "tender"], characterIds: ["light", "comforting"] },
    ps: [g("wheat-flour", 400), g("butter", 240), g("milk", 120), g("granulated-sugar", 40), g("active-dry-yeast", 7), g("dark-chocolate", 150), g("salt", 8)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 900000, servings: 8, yieldCount: 8, contexts: ["breakfast"], dry: [0, 3, 4, 6], wet: [2] },
  { slug: "kouign-amann", cuisine: "french", flavor: { tastes: { sweet: 4, salty: 1 }, aromaIds: ["toasty"], textureIds: ["crisp", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 400), g("butter", 260), g("drinking-water", 200), g("granulated-sugar", 200), g("active-dry-yeast", 7), g("salt", 8)], seasoning: ["granulated-sugar"],
    ovenC: 190, bakeMs: 1500000, servings: 8, yieldCount: 8, contexts: ["afternoon-tea"], dry: [0, 3, 4, 5], wet: [2] },
  { slug: "sticky-buns", cuisine: "american", flavor: { tastes: { sweet: 4 }, aromaIds: ["toasty", "roasted"], textureIds: ["chewy", "soft"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 400), g("butter", 120), g("milk", 180), g("egg", 100), g("brown-sugar", 150), g("active-dry-yeast", 7), g("pecan", 80), g("cinnamon", 5)], seasoning: ["brown-sugar"],
    ovenC: 180, bakeMs: 1500000, servings: 10, yieldCount: 10, contexts: ["breakfast"], dry: [0, 4, 5, 6, 7], wet: [1, 2, 3] },
  { slug: "popovers", cuisine: "american", flavor: { tastes: { salty: 1 }, textureIds: ["crisp", "soft"], characterIds: ["light"] },
    ps: [g("wheat-flour", 200), g("milk", 300), g("egg", 200), g("butter", 30), g("salt", 3)], seasoning: [],
    ovenC: 220, bakeMs: 2400000, servings: 6, yieldCount: 6, contexts: ["breakfast", "dinner"], dry: [0, 4], wet: [1, 2, 3] },
  { slug: "dutch-baby", cuisine: "american", flavor: { tastes: { sweet: 2 }, textureIds: ["crisp", "soft"], characterIds: ["light", "comforting"] },
    ps: [g("wheat-flour", 120), g("milk", 240), g("egg", 200), g("butter", 40), g("granulated-sugar", 30), g("lemon", 10)], seasoning: ["granulated-sugar"],
    ovenC: 220, bakeMs: 1200000, servings: 4, yieldCount: 4, contexts: ["breakfast"], dry: [0, 4], wet: [1, 2, 3] },
  { slug: "clafoutis", cuisine: "french", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity", "toasty"], textureIds: ["soft", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("dark-cherries", 400), g("wheat-flour", 100), g("milk", 250), g("egg", 150), g("granulated-sugar", 100), g("butter", 30)], seasoning: ["granulated-sugar"],
    ovenC: 180, bakeMs: 2400000, contexts: ["after-meal"], dry: [1, 4], wet: [2, 3] },
  { slug: "classic-waffles", cuisine: "american", flavor: { tastes: { sweet: 2, salty: 1 }, textureIds: ["crisp", "tender"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 250), g("milk", 350), g("egg", 150), g("butter", 80), g("granulated-sugar", 30), g("usda-baking-powder", 10), g("salt", 3)], seasoning: ["granulated-sugar"],
    ovenC: 200, bakeMs: 240000, servings: 6, yieldCount: 6, contexts: ["breakfast"], dry: [0, 4, 5, 6], wet: [1, 2, 3] },
];

export function buildBakingDrafts(): DraftRecipe[] {
  return bakingCompact.map(bakeFlow);
}
