import type { DraftRecipe, PortionSpec, OpSpec } from "../recipe-database-build";
import type { FlavorProfile } from "@/types/flavor";

/**
 * Batch C bartending drafts (45 recipes) — IBA classics and modern
 * standards, config-driven. Every cocktail follows the chill/build/shake
 * contracts validated in batches A/B (engine-v2 coverage via chill).
 */

type P = { id: string; g: number; ml?: boolean };
const g = (id: string, grams: number): P => ({ id, g: grams });

interface CocktailRow {
  slug: string;
  cuisine: string;
  flavor: FlavorProfile;
  ps: P[];
  method: "build" | "shake" | "stir" | "blend";
  garnish?: string; // ingredient id for garnish step
  contexts?: string[];
  nonAlcoholic?: boolean;
  hot?: boolean;
}

const rows: CocktailRow[] = [
  // ================= IBA NEW ERA & CLASSICS =================
  { slug: "bloody-mary", cuisine: "american", flavor: { tastes: { salty: 2, sour: 2, spicy: 1, umami: 1 }, aromaIds: ["peppery"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("vodka-80", 42), g("tomato-juice", 90), g("lemon", 15), g("worcestershire-sauce", 3), g("hot-sauce", 3), g("horseradish", 3), g("celery-salt", 1), g("black-pepper", 0.5)],
    method: "build", garnish: "celery", contexts: ["lunch", "social-gathering"] },
  { slug: "screwdriver", cuisine: "american", flavor: { tastes: { sweet: 2, sour: 1 }, aromaIds: ["citrusy"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 42), g("orange-juice", 120)], method: "build", garnish: "usda-orange", contexts: ["social-gathering", "lunch"] },
  { slug: "tequila-mule", cuisine: "mexican", flavor: { tastes: { spicy: 1, sweet: 1, sour: 1 }, aromaIds: ["gingery"], textureIds: ["crisp"], characterIds: ["refreshing"] },
    ps: [g("tequila-blanco-80", 42), g("lime", 15), g("ginger-beer", 100)], method: "build", garnish: "lime", contexts: ["social-gathering", "aperitif"] },
  { slug: "tom-collins", cuisine: "british", flavor: { tastes: { sour: 3, sweet: 2 }, aromaIds: ["citrusy"], textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("gin-80", 42), g("lemon", 25), g("simple-syrup", 15), g("club-soda", 60)], method: "build", garnish: "lemon", contexts: ["afternoon-tea", "social-gathering"] },
  { slug: "gin-fizz", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "light"] },
    ps: [g("gin-80", 42), g("lemon", 22), g("simple-syrup", 15), g("egg", 30), g("club-soda", 60)], method: "shake", contexts: ["social-gathering", "aperitif"] },
  { slug: "aviation", cuisine: "french", flavor: { tastes: { sour: 2, sweet: 2 }, aromaIds: ["floral"], textureIds: ["silky"], characterIds: ["light", "refreshing"] },
    ps: [g("gin-80", 42), g("blackberry-liqueur", 15), g("raspberry-liqueur", 7), g("lemon", 22)], method: "shake", contexts: ["aperitif", "after-meal"] },
  { slug: "sazerac", cuisine: "american", flavor: { tastes: { bitter: 2, sweet: 2 }, aromaIds: ["herbal"], characterIds: ["warming", "comforting"] },
    ps: [g("bourbon-80", 50), g("simple-syrup", 8), g("orange-bitters", 1), g("absinthe", 3)], method: "stir", garnish: "lemon", contexts: ["after-meal"] },
  { slug: "vesper", cuisine: "british", flavor: { tastes: { bitter: 2 }, characterIds: ["clean-tasting", "appetizing"] },
    ps: [g("gin-80", 57), g("vodka-80", 14), g("dry-white-wine", 8)], method: "stir", garnish: "lemon", contexts: ["aperitif"] },
  { slug: "last-word", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 2, bitter: 2 }, aromaIds: ["herbal"], textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("gin-80", 21), g("green-chartreuse", 21), g("raspberry-liqueur", 21), g("lime", 21)], method: "shake", contexts: ["after-meal", "social-gathering"] },
  { slug: "bees-knees", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 3 }, aromaIds: ["floral", "citrusy"], textureIds: ["silky"], characterIds: ["refreshing", "light"] },
    ps: [g("gin-80", 42), g("usda-honey", 21), g("lemon", 22)], method: "shake", contexts: ["aperitif", "after-meal"] },
  { slug: "gold-rush", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 2 }, textureIds: ["silky"], characterIds: ["warming", "appetizing"] },
    ps: [g("bourbon-80", 47), g("usda-honey", 21), g("lemon", 22)], method: "shake", contexts: ["after-meal", "social-gathering"] },
  { slug: "southside", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 2 }, aromaIds: ["herbal", "citrusy"], textureIds: ["silky"], characterIds: ["refreshing", "light"] },
    ps: [g("gin-80", 47), g("fresh-mint", 8), g("lime", 22), g("simple-syrup", 15)], method: "shake", contexts: ["aperitif", "social-gathering"] },
  { slug: "paper-plane", cuisine: "american", flavor: { tastes: { sour: 3, sweet: 2, bitter: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("bourbon-80", 21), g("aperitif-wine", 21), g("orange-liqueur-80", 21), g("lemon", 21)], method: "shake", contexts: ["after-meal", "aperitif"] },
  { slug: "naked-and-famous", cuisine: "fusion", flavor: { tastes: { sour: 2, sweet: 2, bitter: 2, spicy: 1 }, textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("scotch-80", 21), g("aperitif-wine", 21), g("raspberry-liqueur", 21), g("lime", 21)], method: "shake", contexts: ["after-meal"] },
  { slug: "boulevardier", cuisine: "french", flavor: { tastes: { bitter: 3, sweet: 2 }, aromaIds: ["roasted"], characterIds: ["warming", "hearty"] },
    ps: [g("bourbon-80", 33), g("campari", 27), g("sweet-vermouth", 26)], method: "stir", garnish: "usda-orange", contexts: ["after-meal", "aperitif"] },
  { slug: "twentieth-century", cuisine: "british", flavor: { tastes: { sour: 2, sweet: 2, bitter: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "light"] },
    ps: [g("gin-80", 42), g("white-creme-de-cacao", 21), g("lemon", 15), g("dark-cocoa-70", 2)], method: "shake", contexts: ["after-meal", "aperitif"] },
  { slug: "tipperary", cuisine: "british", flavor: { tastes: { bitter: 2, sweet: 2 }, aromaIds: ["herbal"], characterIds: ["warming", "comforting"] },
    ps: [g("irish-cream-34", 42), g("sweet-vermouth", 26), g("green-chartreuse", 21)], method: "stir", contexts: ["after-meal"] },
  { slug: "champs-elysees", cuisine: "french", flavor: { tastes: { bitter: 2, sweet: 2 }, aromaIds: ["herbal"], characterIds: ["appetizing", "warming"] },
    ps: [g("brandy-80", 42), g("yellow-chartreuse", 14), g("orange-bitters", 1), g("simple-syrup", 4)], method: "stir", contexts: ["after-meal"] },
  { slug: "white-russian", cuisine: "american", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy", "silky"], characterIds: ["comforting", "warming"] },
    ps: [g("vodka-80", 47), g("coffee-liqueur-80", 21), g("heavy-cream", 30)], method: "build", contexts: ["after-meal", "social-gathering"] },
  { slug: "black-russian", cuisine: "american", flavor: { tastes: { sweet: 2, bitter: 2 }, characterIds: ["warming", "hearty"] },
    ps: [g("vodka-80", 47), g("coffee-liqueur-80", 21)], method: "build", contexts: ["after-meal"] },
  { slug: "mudslide", cuisine: "american", flavor: { tastes: { sweet: 4 }, aromaIds: ["roasted"], textureIds: ["creamy", "silky"], characterIds: ["comforting", "hearty"] },
    ps: [g("vodka-80", 21), g("coffee-liqueur-80", 21), g("irish-cream-34", 21), g("heavy-cream", 30)], method: "shake", contexts: ["after-meal"] },
  { slug: "brandy-alexander", cuisine: "british", flavor: { tastes: { sweet: 4 }, aromaIds: ["roasted"], textureIds: ["creamy", "silky"], characterIds: ["comforting", "warming"] },
    ps: [g("brandy-80", 33), g("dark-cocoa-70", 15), g("heavy-cream", 33)], method: "shake", contexts: ["after-meal"] },
  { slug: "grasshopper", cuisine: "american", flavor: { tastes: { sweet: 4 }, aromaIds: ["herbal"], textureIds: ["creamy", "silky"], characterIds: ["comforting", "light"] },
    ps: [g("raspberry-liqueur", 21), g("white-creme-de-menthe", 21), g("heavy-cream", 21)], method: "shake", contexts: ["after-meal"] },
  { slug: "golden-cadillac", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["creamy"], characterIds: ["comforting"] },
    ps: [g("irish-cream-34", 21), g("galliano", 7), g("heavy-cream", 42)], method: "shake", contexts: ["after-meal"] },
  { slug: "stinger", cuisine: "american", flavor: { tastes: { sweet: 2 }, aromaIds: ["herbal"], characterIds: ["warming", "light"] },
    ps: [g("brandy-80", 47), g("white-creme-de-menthe", 21)], method: "stir", contexts: ["after-meal"] },
  { slug: "rusty-nail", cuisine: "british", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["herbal"], characterIds: ["warming", "hearty"] },
    ps: [g("scotch-80", 47), g("drambuie", 21)], method: "build", contexts: ["after-meal"] },
  { slug: "godfather", cuisine: "american", flavor: { tastes: { sweet: 2, bitter: 1 }, aromaIds: ["roasted"], characterIds: ["warming", "hearty"] },
    ps: [g("scotch-80", 47), g("amaretto-80", 21)], method: "build", contexts: ["after-meal"] },
  { slug: "between-the-sheets", cuisine: "french", flavor: { tastes: { sour: 2, sweet: 2, bitter: 1 }, textureIds: ["silky"], characterIds: ["warming", "appetizing"] },
    ps: [g("brandy-80", 28), g("white-rum-80", 28), g("orange-liqueur-80", 21), g("lemon", 15)], method: "shake", contexts: ["after-meal", "aperitif"] },
  { slug: "hotel-nacional", cuisine: "mexican", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("white-rum-80", 42), g("peach-schnapps", 14), g("raspberry-liqueur", 14), g("lime", 15), g("simple-syrup", 7)], method: "shake", contexts: ["after-meal", "social-gathering"] },
  { slug: "mary-pickford", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity"], characterIds: ["refreshing", "light"] },
    ps: [g("white-rum-80", 47), g("pineapple-juice", 60), g("grenadine-syrup", 6), g("lime", 7)], method: "shake", contexts: ["social-gathering", "aperitif"] },
  { slug: "el-diablo", cuisine: "mexican", flavor: { tastes: { sweet: 2, sour: 2, spicy: 1 }, aromaIds: ["fruity", "gingery"], textureIds: ["crisp"], characterIds: ["refreshing"] },
    ps: [g("tequila-blanco-80", 42), g("blackberry-liqueur", 14), g("lime", 15), g("ginger-beer", 60)], method: "build", contexts: ["social-gathering"] },
  { slug: "oaxaca-old-fashioned", cuisine: "mexican", flavor: { tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted", "herbal"], characterIds: ["warming", "comforting"] },
    ps: [g("tequila-blanco-80", 42), g("blackstrap-rum", 7), g("agave-syrup", 7), g("orange-bitters", 1)], method: "stir", garnish: "usda-orange", contexts: ["after-meal"] },
  { slug: "mai-tai", cuisine: "fusion", flavor: { tastes: { sweet: 2, sour: 2, bitter: 2 }, aromaIds: ["fruity", "roasted"], characterIds: ["refreshing", "hearty"] },
    ps: [g("white-rum-80", 42), g("blackstrap-rum", 14), g("orange-liqueur-80", 14), g("orgeat-syrup", 21), g("lime", 22)], method: "shake", garnish: "fresh-mint", contexts: ["social-gathering", "after-meal"] },
  { slug: "hurricane", cuisine: "american", flavor: { tastes: { sweet: 4, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing", "hearty"] },
    ps: [g("dark-rum-80", 42), g("white-rum-80", 21), g("passion-fruit-syrup", 42), g("orange-juice", 30), g("lemon", 15)], method: "shake", contexts: ["social-gathering"] },
  { slug: "planters-punch", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 3 }, aromaIds: ["fruity"], characterIds: ["refreshing", "hearty"] },
    ps: [g("dark-rum-80", 57), g("orange-juice", 30), g("pineapple-juice", 30), g("lemon", 22), g("grenadine-syrup", 10)], method: "shake", contexts: ["social-gathering", "afternoon-tea"] },
  { slug: "painkiller", cuisine: "fusion", flavor: { tastes: { sweet: 4 }, aromaIds: ["fruity", "floral"], textureIds: ["creamy"], characterIds: ["refreshing", "comforting"] },
    ps: [g("white-rum-80", 47), g("cream-of-coconut", 30), g("pineapple-juice", 90), g("orange-juice", 30)], method: "build", garnish: "usda-orange", contexts: ["social-gathering", "after-meal"] },
  { slug: "sex-on-the-beach", cuisine: "american", flavor: { tastes: { sweet: 4, sour: 1 }, aromaIds: ["fruity"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 33), g("peach-schnapps", 28), g("orange-juice", 60), g("cranberry-juice", 60)], method: "build", contexts: ["social-gathering"] },
  { slug: "fuzzy-navel", cuisine: "american", flavor: { tastes: { sweet: 4 }, aromaIds: ["fruity"], characterIds: ["refreshing", "light"] },
    ps: [g("peach-schnapps", 38), g("orange-juice", 90)], method: "build", contexts: ["social-gathering", "afternoon-tea"] },
  { slug: "madras", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing"] },
    ps: [g("vodka-80", 38), g("cranberry-juice", 60), g("orange-juice", 60)], method: "build", contexts: ["social-gathering"] },
  { slug: "sea-breeze", cuisine: "american", flavor: { tastes: { sweet: 2, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 38), g("cranberry-juice", 90), g("grapefruit-juice", 90)], method: "build", contexts: ["social-gathering", "lunch"] },
  { slug: "greyhound", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 1 }, aromaIds: ["citrusy"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 42), g("orange-juice", 120)], method: "build", contexts: ["breakfast", "social-gathering"] },
  { slug: "salty-dog", cuisine: "american", flavor: { tastes: { sour: 2, salty: 2 }, aromaIds: ["citrusy"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("vodka-80", 42), g("orange-juice", 120), g("salt", 2)], method: "build", contexts: ["lunch", "social-gathering"] },
  { slug: "hot-toddy", cuisine: "british", flavor: { tastes: { sweet: 2, sour: 1, bitter: 1 }, aromaIds: ["floral", "gingery"], textureIds: ["brothy"], characterIds: ["warming", "comforting"] },
    ps: [g("scotch-80", 42), g("usda-honey", 21), g("lemon", 15), g("drinking-water", 150)], method: "build", garnish: "cinnamon", contexts: ["after-meal"], hot: true },
  { slug: "eggnog-classic", cuisine: "american", flavor: { tastes: { sweet: 4 }, textureIds: ["creamy", "silky"], characterIds: ["comforting", "warming"] },
    ps: [g("bourbon-80", 30), g("dark-rum-80", 15), g("milk", 90), g("heavy-cream", 30), g("egg", 30), g("granulated-sugar", 12)], method: "shake", garnish: "cinnamon", contexts: ["social-gathering", "after-meal"] },
  { slug: "blue-lagoon", cuisine: "french", flavor: { tastes: { sweet: 3, sour: 2 }, textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 38), g("blue-curacao-80", 14), g("lemon", 30)], method: "build", contexts: ["social-gathering", "afternoon-tea"] },
  { slug: "pisco-sour", cuisine: "peruvian", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("pisco", 47), g("lime", 30), g("simple-syrup", 21), g("egg", 30)], method: "shake", contexts: ["aperitif", "social-gathering"] },
  { slug: "caipirinha", cuisine: "portuguese", flavor: { tastes: { sour: 2, sweet: 2 }, aromaIds: ["citrusy"], textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("cachaca", 57), g("lime", 30), g("granulated-sugar", 12)], method: "build", garnish: "lime", contexts: ["social-gathering", "aperitif"] },
  { slug: "daiquiri-classic", cuisine: "fusion", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("white-rum-80", 57), g("lime", 25), g("simple-syrup", 17)], method: "shake", contexts: ["aperitif", "social-gathering"] },
  { slug: "americano", cuisine: "italian", flavor: { tastes: { bitter: 2, sweet: 2 }, textureIds: ["crisp"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("campari", 27), g("sweet-vermouth", 27), g("club-soda", 60)], method: "build", garnish: "usda-orange", contexts: ["aperitif"] },
  // ================= StarChefs-adapted (web-curated) =================
  { slug: "umeshu-highball", cuisine: "japanese", flavor: { tastes: { sweet: 2, sour: 1, bitter: 1 }, aromaIds: ["fruity", "roasted"], textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("raspberry-liqueur", 42), g("scotch-80", 14), g("pineapple-juice", 22), g("lemon", 6), g("orange-bitters", 1), g("ginger-ale", 60)], method: "build", garnish: "usda-orange", contexts: ["aperitif", "social-gathering"] },
  { slug: "charred-pineapple-margarita", cuisine: "mexican", flavor: { tastes: { sour: 3, sweet: 2, bitter: 1 }, aromaIds: ["citrusy", "roasted"], textureIds: ["crisp"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("tequila-blanco-80", 42), g("orange-liqueur-80", 15), g("pineapple-juice", 30), g("lime", 15), g("salt", 2)], method: "shake", garnish: "lime", contexts: ["aperitif", "social-gathering"] },
  { slug: "carrot-pisco-sour", cuisine: "peruvian", flavor: { tastes: { sour: 2, sweet: 2 }, aromaIds: ["herbal"], textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("pisco", 42), g("ginger-ale", 60), g("lime", 22), g("simple-syrup", 15), g("egg", 30), g("carrot", 40)], method: "shake", contexts: ["aperitif"] },
];

function cocktailFlow(row: CocktailRow): DraftRecipe {
  const portions: PortionSpec[] = row.ps.map((p) => ({
    id: p.id,
    grams: p.g,
    amount: p.g,
    unit: "g" as const,
    conversionId: "si:g:v1",
    role: (["simple-syrup", "granulated-sugar", "salt", "black-pepper", "orange-bitters", "agave-syrup", "grenadine-syrup", "worcestershire-sauce", "hot-sauce", "celery-salt", "usda-honey"].includes(p.id) ? "seasoning" : "main") as never,
    state: (["tomato-juice", "orange-juice", "cranberry-juice", "pineapple-juice", "ginger-beer", "ginger-ale", "club-soda", "heavy-cream", "milk", "drinking-water"].includes(p.id) ? "liquid" : undefined),
  }));
  const mlIds = new Set(["tomato-juice", "orange-juice", "cranberry-juice", "pineapple-juice", "ginger-beer", "ginger-ale", "club-soda", "heavy-cream", "milk", "drinking-water"]);
  for (const p of portions) {
    if (mlIds.has(p.id) && p.unit === "g") {
      p.unit = "ml";
      p.conversionId = `${p.id}:ml:weight-v1`;
    }
  }
  const ops: OpSpec[] = [];
  if (row.hot) {
    ops.push({ op: "brew", inputs: row.ps.map((_, i) => i), waitMs: 240000, params: { temperatureC: 90 }, targets: [{ dimension: "aroma", minimum: 0.5, unit: "normalized" }], equipment: "kettle" });
    ops.push({ op: "stir", inputs: [], durationMs: 20000, params: { strength: 0.4 } });
  } else {
    ops.push({ op: "chill", inputs: [], waitMs: 300000, params: { temperatureC: -18 } });
    ops.push({ op: "add", inputs: row.ps.map((_, i) => i), durationMs: 10000, params: { quantityG: Math.round(row.ps.reduce((s, p) => s + p.g, 0)) } });
    if (row.method === "shake" || row.method === "blend") {
      ops.push({ op: "mix", inputs: [], durationMs: 15000, params: { strength: 0.85 } });
      ops.push({ op: "strain", inputs: [], durationMs: 10000 });
    } else {
      ops.push({ op: "stir", inputs: [], durationMs: 15000, params: { strength: 0.4 }, targets: [{ dimension: "structural-integrity", minimum: 0.45, unit: "normalized" }] });
    }
  }
  const garnishPortion = row.garnish ? row.ps.findIndex((p) => p.id === row.garnish) : -1;
  ops.push({ op: "garnish", inputs: garnishPortion >= 0 ? [garnishPortion] : [], durationMs: 8000 });
  ops.push({ op: "serve", inputs: [], durationMs: 5000 });
  const totalMl = row.ps.reduce((s, p) => s + p.g, 0);
  return {
    slug: row.slug,
    itemType: row.nonAlcoholic ? ("non-alcoholic-drink" as const) : ("alcoholic-drink" as const),
    servings: 1,
    yieldAmount: Math.max(60, Math.round(totalMl / 10) * 10),
    yieldUnit: "ml" as const,
    simulationProfile: "requires-cat-kitchen-v2" as const,
    categoryTags: ["bartending" as const],
    cuisineIds: [row.cuisine],
    mealRoleIds: ["drink" as const],
    servingContextIds: row.contexts ?? ["social-gathering"],
    flavor: row.flavor,
    portions,
    ops,
  };
}

export function buildBartendingDrafts(): DraftRecipe[] {
  return rows.map(cocktailFlow);
}
