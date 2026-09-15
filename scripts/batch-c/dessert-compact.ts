import type { DraftRecipe, PortionSpec, OpSpec } from "../recipe-database-build";
import type { FlavorProfile } from "@/types/flavor";

/**
 * Batch C dessert drafts (~35 recipes): Asian sweet soups and dumplings,
 * Japanese wagashi, Korean hangwa, Southeast Asian kuih and Western classics
 * (10 of them adapted from StarChefs structure references).
 */

type P = { id: string; g: number };
const g = (id: string, grams: number): P => ({ id, g: grams });

type Flow = "simmer" | "steam" | "chill" | "boil" | "assemble";

interface DessertRow {
  slug: string;
  cuisine: string;
  flavor: FlavorProfile;
  ps: P[];
  flow: Flow;
  contexts?: string[];
  servings?: number;
  yieldMl?: number;
  hot?: boolean;
}

const rows: DessertRow[] = [
  // ================= Chinese sweet soups (10) =================
  { slug: "mung-bean-soup", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["brothy", "soft"], characterIds: ["refreshing", "comforting"] },
    ps: [g("mung-bean", 200), g("drinking-water", 1200), g("granulated-sugar", 80)], flow: "simmer", yieldMl: 1000 },
  { slug: "grass-jelly-dessert", cuisine: "chinese", flavor: { tastes: { sweet: 3, bitter: 1 }, textureIds: ["soft", "silky"], characterIds: ["refreshing", "light"] },
    ps: [g("grass-jelly", 250), g("evaporated-milk", 100), g("granulated-sugar", 40), g("drinking-water", 50)], flow: "assemble" },
  { slug: "black-sesame-soup", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, aromaIds: ["roasted"], textureIds: ["silky"], characterIds: ["warming", "comforting"] },
    ps: [g("black-sesame-paste", 120), g("glutinous-rice-flour", 40), g("drinking-water", 700), g("granulated-sugar", 60)], flow: "simmer", yieldMl: 700, hot: true },
  { slug: "almond-tea-dessert", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["silky"], characterIds: ["warming", "comforting"] },
    ps: [g("almond-flour", 100), g("drinking-water", 600), g("granulated-sugar", 50)], flow: "simmer", yieldMl: 600, hot: true },
  { slug: "walnut-soup", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, aromaIds: ["roasted"], textureIds: ["creamy"], characterIds: ["warming", "comforting"] },
    ps: [g("walnut", 150), g("glutinous-rice-flour", 30), g("drinking-water", 700), g("granulated-sugar", 50)], flow: "simmer", yieldMl: 700, hot: true },
  { slug: "stewed-asian-pear", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["juicy", "tender"], characterIds: ["warming", "comforting"] },
    ps: [g("asian-pear", 550), g("granulated-sugar", 40), g("drinking-water", 500), g("dried-longan", 20)], flow: "simmer", yieldMl: 800, hot: true },
  { slug: "jiuniang-tangyuan", cuisine: "chinese", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fermented"], textureIds: ["soft", "chewy"], characterIds: ["warming", "comforting"] },
    ps: [g("glutinous-rice-flour", 150), g("drinking-water", 700), g("granulated-sugar", 40), g("dried-longan", 30)], flow: "boil", yieldMl: 800 },
  { slug: "purple-sweet-potato-soup", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy", "brothy"], characterIds: ["warming", "comforting"] },
    ps: [g("purple-sweet-potato", 400), g("drinking-water", 800), g("granulated-sugar", 50)], flow: "simmer", yieldMl: 900 },
  { slug: "papaya-snow-fungus-soup", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["brothy", "silky"], characterIds: ["refreshing", "comforting"] },
    ps: [g("papaya", 500), g("snow-fungus", 20), g("drinking-water", 1000), g("granulated-sugar", 50)], flow: "simmer", yieldMl: 1000 },
  { slug: "black-glutinous-rice-dessert", cuisine: "malaysian", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy", "chewy"], characterIds: ["warming", "comforting"] },
    ps: [g("black-glutinous-rice", 200), g("coconut-milk", 200), g("palm-sugar", 60), g("drinking-water", 600)], flow: "simmer", yieldMl: 800 },
  // ================= Chinese puddings & cakes (6) =================
  { slug: "red-bean-pudding-cake", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "chewy"], characterIds: ["comforting"] },
    ps: [g("red-bean-paste", 300), g("glutinous-rice-flour", 150), g("drinking-water", 200), g("granulated-sugar", 60)], flow: "steam" },
  { slug: "water-chestnut-cake", cuisine: "cantonese", flavor: { tastes: { sweet: 3 }, textureIds: ["crisp", "chewy"], characterIds: ["refreshing", "light"] },
    ps: [g("water-chestnut", 300), g("usda-cornstarch", 100), g("granulated-sugar", 150), g("drinking-water", 700)], flow: "simmer" },
  { slug: "mango-grass-jelly-combo", cuisine: "cantonese", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity"], textureIds: ["soft", "silky"], characterIds: ["refreshing"] },
    ps: [g("mango", 300), g("grass-jelly", 200), g("evaporated-milk", 100), g("granulated-sugar", 30)], flow: "assemble" },
  { slug: "osmanthus-lotus-root", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["crisp", "tender"], characterIds: ["refreshing", "light"] },
    ps: [g("hawthorn", 50), g("osmanthus-dried", 5), g("granulated-sugar", 100), g("drinking-water", 800)], flow: "simmer", yieldMl: 700 },
  { slug: "double-layer-milk-pudding", cuisine: "cantonese", flavor: { tastes: { sweet: 2 }, textureIds: ["silky", "soft"], characterIds: ["light", "comforting"] },
    ps: [g("milk", 400), g("egg", 100), g("granulated-sugar", 30)], flow: "steam" },
  { slug: "salted-egg-yolk-lava-bun-filling", cuisine: "cantonese", flavor: { tastes: { sweet: 3, salty: 2 }, aromaIds: ["roasted"], textureIds: ["creamy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("salted-egg-yolk", 100), g("sweetened-condensed-milk", 60), g("butter", 40), g("milk-powder", 30)], flow: "steam" },
  // ================= Japanese wagashi (7) =================
  { slug: "daifuku", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "chewy"], characterIds: ["light", "comforting"] },
    ps: [g("shiratama-flour", 200), g("drinking-water", 200), g("granulated-sugar", 60), g("red-bean-paste", 300)], flow: "steam" },
  { slug: "dorayaki", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["soft", "creamy"], characterIds: ["comforting", "light"] },
    ps: [g("wheat-flour", 150), g("egg", 150), g("granulated-sugar", 80), g("usda-honey", 30), g("drinking-water", 60), g("red-bean-paste", 300)], flow: "chill" },
  { slug: "yokan", cuisine: "japanese", flavor: { tastes: { sweet: 4 }, textureIds: ["chewy", "silky"], characterIds: ["light", "comforting"] },
    ps: [g("red-bean-paste", 400), g("agar-powder", 8), g("granulated-sugar", 100), g("drinking-water", 300)], flow: "chill" },
  { slug: "mizu-shingen-mochi", cuisine: "japanese", flavor: { tastes: { sweet: 2 }, textureIds: ["silky", "soft"], characterIds: ["light", "refreshing"] },
    ps: [g("agar-powder", 5), g("drinking-water", 300), g("kinako", 20), g("brown-sugar", 60)], flow: "chill" },
  { slug: "warabi-mochi", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "silky"], characterIds: ["light"] },
    ps: [g("usda-cornstarch", 100), g("granulated-sugar", 60), g("drinking-water", 300), g("kinako", 25)], flow: "chill" },
  { slug: "sweet-potato-yaki", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, aromaIds: ["roasted"], textureIds: ["soft", "creamy"], characterIds: ["warming", "comforting"] },
    ps: [g("usda-sweet-potato", 500), g("butter", 40), g("granulated-sugar", 60), g("heavy-cream", 50), g("egg", 30)], flow: "steam" },
  { slug: "matcha-shiratama-parfait", cuisine: "japanese", flavor: { tastes: { sweet: 2, bitter: 1 }, aromaIds: ["herbal"], textureIds: ["soft", "chewy", "creamy"], characterIds: ["light", "refreshing"] },
    ps: [g("shiratama-flour", 120), g("drinking-water", 100), g("matcha-powder", 8), g("red-bean-paste", 150), g("usda-vanilla", 3)], flow: "steam" },
  // ================= Korean (3) =================
  { slug: "songpyeon", cuisine: "korean", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["chewy", "soft"], characterIds: ["comforting", "light"] },
    ps: [g("glutinous-rice-flour", 300), g("drinking-water", 200), g("salt", 3), g("red-bean-paste", 200), g("black-sesame-paste", 40)], flow: "steam" },
  { slug: "yakgwa", cuisine: "korean", flavor: { tastes: { sweet: 4 }, aromaIds: ["gingery", "floral"], textureIds: ["crisp", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 300), g("sesame-oil", 40), g("usda-honey", 80), g("junmai-sake-generic", 30), g("ginger", 10), g("cinnamon", 3)], flow: "chill" },
  { slug: "sikhye", cuisine: "korean", flavor: { tastes: { sweet: 3 }, aromaIds: ["fermented"], textureIds: ["brothy"], characterIds: ["refreshing", "light"] },
    ps: [g("usda-white-rice", 200), g("drinking-water", 1500), g("granulated-sugar", 80), g("dried-longan", 30)], flow: "simmer", yieldMl: 1200 },
  // ================= Southeast Asian (6) =================
  { slug: "bubur-cha-cha", cuisine: "malaysian", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral", "fruity"], textureIds: ["creamy", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("purple-sweet-potato", 200), g("sago-pearls", 60), g("coconut-milk", 400), g("palm-sugar", 60), g("pandan-leaf", 4)], flow: "simmer", yieldMl: 900 },
  { slug: "cendol", cuisine: "malaysian", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral"], textureIds: ["chewy", "brothy"], characterIds: ["refreshing", "hearty"] },
    ps: [g("sago-pearls", 80), g("coconut-milk", 300), g("palm-sugar", 80), g("pandan-leaf", 4), g("drinking-water", 300), g("ice", 100)], flow: "chill", yieldMl: 700 },
  { slug: "three-color-ice", cuisine: "vietnamese", flavor: { tastes: { sweet: 4 }, textureIds: ["creamy", "chewy"], characterIds: ["refreshing", "hearty"] },
    ps: [g("mung-bean", 100), g("red-bean-paste", 150), g("coconut-milk", 300), g("granulated-sugar", 60), g("ice", 150), g("drinking-water", 400)], flow: "chill", yieldMl: 800 },
  { slug: "pandan-chiffon-pancakes", cuisine: "thai", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["soft", "creamy"], characterIds: ["light", "comforting"] },
    ps: [g("wheat-flour", 200), g("coconut-milk", 250), g("egg", 200), g("granulated-sugar", 60), g("pandan-leaf", 10)], flow: "chill" },
  { slug: "thai-roti-glai", cuisine: "thai", flavor: { tastes: { sweet: 4 }, aromaIds: ["toasty"], textureIds: ["crisp", "chewy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 250), g("drinking-water", 200), g("sweetened-condensed-milk", 80), g("butter", 50), g("egg", 100)], flow: "chill" },
  { slug: "kuih-koci", cuisine: "malaysian", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["chewy", "creamy"], characterIds: ["light", "comforting"] },
    ps: [g("glutinous-rice-flour", 250), g("coconut-milk", 200), g("pandan-leaf", 6), g("red-bean-paste", 200), g("salt", 2)], flow: "steam" },
  // ================= Western & StarChefs-adapted (9) =================
  { slug: "rice-pudding", cuisine: "british", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy", "soft"], characterIds: ["comforting", "warming"] },
    ps: [g("usda-white-rice", 150), g("milk", 800), g("granulated-sugar", 80), g("cinnamon", 3)], flow: "simmer", yieldMl: 900 },
  { slug: "eton-mess", cuisine: "british", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity"], textureIds: ["crisp", "creamy"], characterIds: ["light", "refreshing"] },
    ps: [g("strawberry", 400), g("heavy-cream", 300), g("granulated-sugar", 50), g("usda-vanilla", 4)], flow: "assemble" },
  { slug: "profiterole-tower", cuisine: "french", flavor: { tastes: { sweet: 3 }, aromaIds: ["roasted"], textureIds: ["crisp", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 250), g("butter", 150), g("egg", 300), g("heavy-cream", 400), g("granulated-sugar", 100), g("dark-chocolate", 150)], flow: "chill" },
  { slug: "affogato", cuisine: "italian", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["creamy"], characterIds: ["light", "comforting"] },
    ps: [g("brewed-espresso", 60), g("usda-vanilla", 3), g("heavy-cream", 100), g("granulated-sugar", 20)], flow: "assemble" },
  { slug: "cassata-siciliana", cuisine: "italian", flavor: { tastes: { sweet: 4 }, aromaIds: ["fruity", "roasted"], textureIds: ["creamy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("ricotta", 500), g("granulated-sugar", 120), g("semisweet-chocolate-chips", 100), g("candied-peel", 60), g("pistachio", 50)], flow: "chill" },
  { slug: "rum-baba", cuisine: "french", flavor: { tastes: { sweet: 4, bitter: 1 }, aromaIds: ["roasted", "fruity"], textureIds: ["soft", "saucy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 300), g("egg", 200), g("butter", 100), g("granulated-sugar", 60), g("active-dry-yeast", 7), g("drinking-water", 100), g("dark-rum-80", 60)], flow: "chill" },
  { slug: "caramelized-brioche-toast", cuisine: "french", flavor: { tastes: { sweet: 4 }, aromaIds: ["toasty", "roasted"], textureIds: ["crisp", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 200), g("butter", 60), g("brown-sugar", 60), g("heavy-cream", 100), g("egg", 100), g("cinnamon", 3)], flow: "chill" },
  { slug: "trifle-classic", cuisine: "british", flavor: { tastes: { sweet: 4 }, aromaIds: ["fruity"], textureIds: ["creamy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("strawberry", 400), g("heavy-cream", 300), g("mascarpone", 250), g("granulated-sugar", 60)], flow: "chill" },
  { slug: "charred-pineapple-upside-down-cake", cuisine: "american", flavor: { tastes: { sweet: 4, bitter: 1 }, aromaIds: ["roasted", "fruity"], textureIds: ["soft", "tender"], characterIds: ["comforting", "hearty"] },
    ps: [g("canned-pineapple", 400), g("wheat-flour", 200), g("butter", 120), g("brown-sugar", 150), g("egg", 150), g("usda-baking-powder", 8)], flow: "chill" },
];

function dessertFlow(row: DessertRow): DraftRecipe {
  const servings = row.servings ?? 4;
  const portions: PortionSpec[] = row.ps.map((p) => ({
    id: p.id,
    grams: p.g,
    amount: p.g,
    unit: "g" as const,
    conversionId: "si:g:v1",
    role: (["granulated-sugar", "salt", "brown-sugar", "palm-sugar", "cinnamon", "ginger", "osmanthus-dried", "matcha-powder", "kinako", "agar-powder", "pandan-leaf", "baking-soda"].includes(p.id) ? "seasoning" : "main") as never,
    state: (["milk", "coconut-milk", "heavy-cream", "evaporated-milk", "drinking-water", "condensed-milk", "sweetened-condensed-milk", "dark-rum-80", "brewed-espresso"].includes(p.id) ? "liquid" : undefined),
  }));
  const mlIds = new Set(["milk", "coconut-milk", "heavy-cream", "evaporated-milk", "drinking-water", "dark-rum-80", "brewed-espresso"]);
  for (const p of portions) {
    if (mlIds.has(p.id)) {
      p.unit = "ml";
      p.conversionId = `${p.id}:ml:weight-v1`;
    }
  }
  const ops: OpSpec[] = [];
  const allIdx = row.ps.map((_, i) => i);
  if (row.flow === "simmer") {
    ops.push({ op: "add", inputs: allIdx, durationMs: 30000, params: { quantityG: Math.round(row.ps.reduce((s, p) => s + p.g, 0)) } });
    ops.push({ op: "set-heat", durationMs: 30000, params: { temperatureC: 100 }, heat: { kind: "qualitative", descriptorId: "boil", sourceFactId: "" }, equipment: "saucepan" });
    ops.push({ op: "simmer", inputs: [], waitMs: 2700000, params: { temperatureC: 95 }, targets: [{ dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "saucepan" });
    ops.push({ op: "stir", inputs: [], durationMs: 30000, params: { strength: 0.3 } });
  } else if (row.flow === "steam") {
    ops.push({ op: "mix", inputs: allIdx, durationMs: 120000, params: { strength: 0.5 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] });
    ops.push({ op: "steam", inputs: [], waitMs: 1800000, params: { temperatureC: 100 }, targets: [{ dimension: "doneness", minimum: 0.95, unit: "normalized" }], equipment: "steamer" });
    ops.push({ op: "remove", inputs: [], durationMs: 5000 });
  } else if (row.flow === "boil") {
    ops.push({ op: "mix", inputs: allIdx.filter((i) => row.ps[i].id !== "glutinous-rice-flour"), durationMs: 60000, params: { strength: 0.4 } });
    ops.push({ op: "boil", inputs: [], waitMs: 600000, params: { temperatureC: 100 }, targets: [{ dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "saucepan" });
    ops.push({ op: "remove", inputs: [], durationMs: 5000 });
  } else if (row.flow === "chill") {
    ops.push({ op: "mix", inputs: allIdx, durationMs: 120000, params: { strength: 0.5 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] });
    if (row.hot) {
      ops.push({ op: "simmer", inputs: [], waitMs: 900000, params: { temperatureC: 90 }, targets: [{ dimension: "doneness", minimum: 0.85, unit: "normalized" }], equipment: "saucepan" });
    }
    ops.push({ op: "chill", inputs: [], waitMs: 10800000, params: { temperatureC: 4 }, targets: [{ dimension: "structural-integrity", minimum: 0.75, unit: "normalized" }] });
  } else {
    // assemble
    ops.push({ op: "chill", inputs: allIdx, waitMs: 3600000, params: { temperatureC: 4 } });
    ops.push({ op: "assemble", inputs: [], durationMs: 60000 });
  }
  ops.push({ op: "serve", inputs: [], durationMs: 5000 });
  return {
    slug: row.slug,
    itemType: "dessert" as const,
    servings,
    yieldAmount: row.yieldMl ?? servings,
    yieldUnit: row.yieldMl ? ("ml" as const) : ("piece" as const),
    simulationProfile: "requires-cat-kitchen-v2" as const,
    categoryTags: ["dessert" as const],
    cuisineIds: [row.cuisine],
    mealRoleIds: ["dessert" as const],
    servingContextIds: row.contexts ?? ["after-meal", "afternoon-tea"],
    flavor: row.flavor,
    portions,
    ops,
  };
}

export function buildDessertDrafts(): DraftRecipe[] {
  return rows.map(dessertFlow);
}
