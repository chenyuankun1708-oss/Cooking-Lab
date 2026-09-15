import type { DraftRecipe, PortionSpec, OpSpec } from "../recipe-database-build";
import type { FlavorProfile } from "@/types/flavor";

/**
 * Batch D bartending drafts (85 recipes) — IBA classics, tiki, sours and
 * international standards, config-driven (same flow as batch C).
 */

type P = { id: string; g: number };
const g = (id: string, grams: number): P => ({ id, g: grams });

interface CocktailRow {
  slug: string;
  cuisine: string;
  flavor: FlavorProfile;
  ps: P[];
  method: "build" | "shake" | "stir" | "blend";
  garnish?: string;
  contexts?: string[];
  nonAlcoholic?: boolean;
  hot?: boolean;
}

const rows: CocktailRow[] = [
  // ================= sours & daisies (16) =================
  { slug: "whiskey-sour-bourbon", cuisine: "american", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["appetizing", "warming"] },
    ps: [g("bourbon-80", 47), g("lemon", 22), g("simple-syrup", 15)], method: "shake", contexts: ["after-meal", "social-gathering"] },
  { slug: "new-york-sour", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 2, bitter: 1 }, textureIds: ["silky"], characterIds: ["appetizing", "hearty"] },
    ps: [g("bourbon-80", 45), g("lemon", 22), g("simple-syrup", 12), g("port-wine", 15)], method: "shake", contexts: ["after-meal", "aperitif"] },
  { slug: "gin-sour", cuisine: "american", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["refreshing"] },
    ps: [g("gin-80", 47), g("lemon", 22), g("simple-syrup", 15)], method: "shake", contexts: ["aperitif", "social-gathering"] },
  { slug: "rum-sour", cuisine: "western", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("dark-rum-80", 47), g("lime", 25), g("simple-syrup", 15)], method: "shake", contexts: ["after-meal"] },
  { slug: "scotch-sour", cuisine: "british", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["warming", "appetizing"] },
    ps: [g("scotch-80", 47), g("lemon", 22), g("simple-syrup", 15), g("orange-bitters", 1)], method: "shake", contexts: ["after-meal"] },
  { slug: "brandy-sour", cuisine: "french", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["appetizing", "warming"] },
    ps: [g("brandy-80", 47), g("lemon", 22), g("simple-syrup", 15), g("orange-bitters", 1)], method: "shake", contexts: ["after-meal"] },
  { slug: "pisco-sour-classic", cuisine: "peruvian", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("pisco", 50), g("lime", 28), g("simple-syrup", 20), g("egg", 30)], method: "shake", contexts: ["aperitif"] },
  { slug: "amaretto-sour-classic", cuisine: "italian", flavor: { tastes: { sour: 2, sweet: 3 }, textureIds: ["silky"], characterIds: ["comforting", "refreshing"] },
    ps: [g("amaretto-80", 42), g("bourbon-80", 14), g("lemon", 25), g("simple-syrup", 8)], method: "shake", contexts: ["after-meal"] },
  { slug: "margarita-golden", cuisine: "mexican", flavor: { tastes: { sour: 3, sweet: 2, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("tequila-blanco-80", 42), g("orange-liqueur-80", 15), g("lime", 20), g("agave-syrup", 8)], method: "shake", contexts: ["aperitif", "social-gathering"] },
  { slug: "daiquiri-strawberry", cuisine: "fusion", flavor: { tastes: { sour: 2, sweet: 3 }, aromaIds: ["fruity"], textureIds: ["silky"], characterIds: ["refreshing", "light"] },
    ps: [g("white-rum-80", 47), g("lime", 22), g("simple-syrup", 15), g("strawberry", 80)], method: "blend", contexts: ["social-gathering", "afternoon-tea"] },
  { slug: "daiquiri-banana", cuisine: "fusion", flavor: { tastes: { sour: 2, sweet: 3 }, aromaIds: ["fruity"], textureIds: ["creamy"], characterIds: ["refreshing", "light"] },
    ps: [g("white-rum-80", 47), g("lime", 22), g("simple-syrup", 15), g("usda-banana", 100)], method: "blend", contexts: ["social-gathering"] },
  { slug: "sidecar-classic", cuisine: "french", flavor: { tastes: { sour: 2, sweet: 2 }, textureIds: ["silky"], characterIds: ["warming", "appetizing"] },
    ps: [g("brandy-80", 47), g("orange-liqueur-80", 20), g("lemon", 20)], method: "shake", contexts: ["after-meal", "aperitif"] },
  { slug: "between-the-sheets-classic", cuisine: "french", flavor: { tastes: { sour: 2, sweet: 2 }, textureIds: ["silky"], characterIds: ["warming", "appetizing"] },
    ps: [g("brandy-80", 28), g("white-rum-80", 28), g("orange-liqueur-80", 18), g("lemon", 15)], method: "shake", contexts: ["after-meal"] },
  { slug: "margarita-tommy", cuisine: "mexican", flavor: { tastes: { sour: 3, sweet: 1, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("tequila-blanco-80", 47), g("lime", 28), g("agave-syrup", 14)], method: "shake", contexts: ["aperitif"] },
  { slug: "cosmopolitan-classic", cuisine: "american", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["silky"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 38), g("orange-liqueur-80", 12), g("cranberry-juice", 30), g("lime", 15)], method: "shake", contexts: ["social-gathering", "aperitif"] },
  { slug: "lemon-drop", cuisine: "american", flavor: { tastes: { sour: 3, sweet: 3 }, aromaIds: ["citrusy"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 38), g("orange-liqueur-80", 12), g("lemon", 25), g("powdered-sugar", 8)], method: "shake", contexts: ["social-gathering", "after-meal"] },
  // ================= highballs & simple (18) =================
  { slug: "highball-classic", cuisine: "british", flavor: { tastes: { bitter: 1, sweet: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("scotch-80", 42), g("ginger-ale", 120)], method: "build", contexts: ["social-gathering", "aperitif"] },
  { slug: "moscow-mule-classic", cuisine: "american", flavor: { tastes: { spicy: 1, sweet: 1, sour: 1 }, aromaIds: ["gingery"], textureIds: ["crisp"], characterIds: ["refreshing"] },
    ps: [g("vodka-80", 42), g("lime", 15), g("ginger-beer", 100)], method: "build", garnish: "lime", contexts: ["social-gathering", "aperitif"] },
  { slug: "dark-and-stormy-classic", cuisine: "british", flavor: { tastes: { spicy: 1, sweet: 2 }, aromaIds: ["gingery"], textureIds: ["crisp"], characterIds: ["refreshing", "hearty"] },
    ps: [g("dark-rum-80", 50), g("lime", 10), g("ginger-beer", 100)], method: "build", garnish: "lime", contexts: ["social-gathering"] },
  { slug: "rum-and-coke", cuisine: "western", flavor: { tastes: { sweet: 2, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "hearty"] },
    ps: [g("white-rum-80", 47), g("cola", 100), g("lime", 8)], method: "build", garnish: "lime", contexts: ["social-gathering"] },
  { slug: "jack-and-coke", cuisine: "american", flavor: { tastes: { sweet: 2, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "hearty"] },
    ps: [g("bourbon-80", 47), g("cola", 100)], method: "build", contexts: ["social-gathering"] },
  { slug: "seven-and-seven", cuisine: "american", flavor: { tastes: { sweet: 1, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing"] },
    ps: [g("vodka-80", 42), g("lemon", 10), g("ginger-ale", 100)], method: "build", contexts: ["social-gathering"] },
  { slug: "vodka-soda", cuisine: "american", flavor: { tastes: { sour: 1 }, textureIds: ["crisp"], characterIds: ["clean-tasting", "light"] },
    ps: [g("vodka-80", 42), g("club-soda", 150), g("lime", 8)], method: "build", garnish: "lime", contexts: ["social-gathering", "aperitif"] },
  { slug: "gin-soda", cuisine: "british", flavor: { tastes: { bitter: 1 }, textureIds: ["crisp"], characterIds: ["clean-tasting", "light"] },
    ps: [g("gin-80", 42), g("club-soda", 150), g("lime", 8)], method: "build", garnish: "lime", contexts: ["aperitif"] },
  { slug: "tequila-soda", cuisine: "mexican", flavor: { tastes: { sour: 1 }, textureIds: ["crisp"], characterIds: ["clean-tasting", "light"] },
    ps: [g("tequila-blanco-80", 42), g("club-soda", 150), g("lime", 8)], method: "build", garnish: "lime", contexts: ["aperitif", "social-gathering"] },
  { slug: "whiskey-ginger", cuisine: "american", flavor: { tastes: { sweet: 1, spicy: 1 }, aromaIds: ["gingery"], textureIds: ["crisp"], characterIds: ["refreshing", "warming"] },
    ps: [g("bourbon-80", 42), g("ginger-ale", 120)], method: "build", contexts: ["social-gathering"] },
  { slug: "americano-classic", cuisine: "italian", flavor: { tastes: { bitter: 2, sweet: 2 }, textureIds: ["crisp"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("campari", 27), g("sweet-vermouth", 27), g("club-soda", 60)], method: "build", garnish: "usda-orange", contexts: ["aperitif"] },
  { slug: "campari-soda", cuisine: "italian", flavor: { tastes: { bitter: 3, sweet: 1 }, textureIds: ["crisp"], characterIds: ["appetizing", "clean-tasting"] },
    ps: [g("campari", 47), g("club-soda", 100)], method: "build", contexts: ["aperitif"] },
  { slug: "campari-orange", cuisine: "italian", flavor: { tastes: { bitter: 3, sweet: 2 }, aromaIds: ["citrusy"], characterIds: ["appetizing", "refreshing"] },
    ps: [g("campari", 47), g("orange-juice", 100)], method: "build", contexts: ["aperitif"] },
  { slug: "sherry-cobbler", cuisine: "spanish", flavor: { tastes: { sweet: 1 }, textureIds: ["crisp"], characterIds: ["appetizing", "warming"] },
    ps: [g("dry-sherry", 60), g("dry-vermouth", 20), g("orange-bitters", 1)], method: "stir", contexts: ["aperitif"] },
  { slug: "port-tonic", cuisine: "portuguese", flavor: { tastes: { sweet: 2, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("port-wine", 60), g("club-soda", 90), g("lime", 8)], method: "build", contexts: ["aperitif", "social-gathering"] },
  { slug: "vermouth-tonic", cuisine: "spanish", flavor: { tastes: { bitter: 2, sweet: 1 }, textureIds: ["crisp"], characterIds: ["appetizing", "light"] },
    ps: [g("sweet-vermouth", 60), g("club-soda", 90), g("usda-orange", 10)], method: "build", garnish: "usda-orange", contexts: ["aperitif"] },
  { slug: "wine-spritzer", cuisine: "western", flavor: { tastes: { sour: 1, sweet: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("dry-white-wine", 90), g("club-soda", 60)], method: "build", contexts: ["lunch", "social-gathering"] },
  { slug: "kalimotxo", cuisine: "spanish", flavor: { tastes: { sweet: 2, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "hearty"] },
    ps: [g("port-wine", 90), g("cola", 90)], method: "build", contexts: ["social-gathering"] },
  { slug: "tinto-de-verano", cuisine: "spanish", flavor: { tastes: { sweet: 1, bitter: 1 }, textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("port-wine", 90), g("ginger-ale", 90)], method: "build", contexts: ["social-gathering", "lunch"] },
  { slug: "michelada", cuisine: "mexican", flavor: { tastes: { salty: 2, sour: 2, spicy: 2 }, aromaIds: ["tomato-rich"], textureIds: ["crisp"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("ginger-ale", 200), g("tomato-juice", 60), g("lime", 15), g("hot-sauce", 4), g("celery-salt", 2)], method: "build", garnish: "celery", contexts: ["lunch", "social-gathering"] },
  // ================= stirred & spirit-forward (16) =================
  { slug: "manhattan-classic", cuisine: "american", flavor: { tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted"], characterIds: ["warming", "hearty"] },
    ps: [g("bourbon-80", 47), g("sweet-vermouth", 25), g("angostura-bitters", 2)], method: "stir", garnish: "usda-orange", contexts: ["after-meal", "aperitif"] },
  { slug: "manhattan-dry", cuisine: "american", flavor: { tastes: { bitter: 2, sweet: 1 }, aromaIds: ["roasted"], characterIds: ["warming", "appetizing"] },
    ps: [g("bourbon-80", 47), g("dry-vermouth", 25), g("orange-bitters", 1)], method: "stir", contexts: ["after-meal"] },
  { slug: "perfect-manhattan", cuisine: "american", flavor: { tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted"], characterIds: ["warming", "hearty"] },
    ps: [g("bourbon-80", 47), g("sweet-vermouth", 12), g("dry-vermouth", 12), g("angostura-bitters", 2)], method: "stir", garnish: "usda-orange", contexts: ["after-meal"] },
  { slug: "rob-roy", cuisine: "british", flavor: { tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted"], characterIds: ["warming", "hearty"] },
    ps: [g("scotch-80", 47), g("sweet-vermouth", 25), g("angostura-bitters", 2)], method: "stir", garnish: "usda-orange", contexts: ["after-meal"] },
  { slug: "martini-classic", cuisine: "american", flavor: { tastes: { bitter: 2 }, characterIds: ["clean-tasting", "appetizing"] },
    ps: [g("gin-80", 57), g("dry-vermouth", 12)], method: "stir", garnish: "usda-orange", contexts: ["aperitif"] },
  { slug: "martini-vodka", cuisine: "american", flavor: { tastes: { bitter: 1 }, characterIds: ["clean-tasting", "light"] },
    ps: [g("vodka-80", 57), g("dry-vermouth", 12)], method: "stir", garnish: "usda-orange", contexts: ["aperitif"] },
  { slug: "gibson", cuisine: "american", flavor: { tastes: { bitter: 2 }, characterIds: ["clean-tasting", "appetizing"] },
    ps: [g("gin-80", 57), g("dry-vermouth", 12)], method: "stir", contexts: ["aperitif", "lunch"] },
  { slug: "negroni-classic", cuisine: "italian", flavor: { tastes: { bitter: 3, sweet: 2 }, characterIds: ["appetizing", "warming"] },
    ps: [g("gin-80", 28), g("campari", 28), g("sweet-vermouth", 28)], method: "stir", garnish: "usda-orange", contexts: ["aperitif", "after-meal"] },
  { slug: "boulevardier-classic", cuisine: "french", flavor: { tastes: { bitter: 3, sweet: 2 }, characterIds: ["warming", "hearty"] },
    ps: [g("bourbon-80", 33), g("campari", 27), g("sweet-vermouth", 27)], method: "stir", garnish: "usda-orange", contexts: ["after-meal", "aperitif"] },
  { slug: "old-fashioned-classic", cuisine: "american", flavor: { tastes: { sweet: 1, bitter: 2 }, characterIds: ["warming", "comforting"] },
    ps: [g("bourbon-80", 57), g("simple-syrup", 6), g("angostura-bitters", 2)], method: "stir", garnish: "usda-orange", contexts: ["after-meal"] },
  { slug: "old-fashioned-rye", cuisine: "american", flavor: { tastes: { sweet: 1, bitter: 2, spicy: 1 }, characterIds: ["warming", "hearty"] },
    ps: [g("bourbon-80", 57), g("simple-syrup", 6), g("angostura-bitters", 2)], method: "stir", garnish: "usda-orange", contexts: ["after-meal"] },
  { slug: "sazerac-classic", cuisine: "american", flavor: { tastes: { bitter: 2, sweet: 2, spicy: 1 }, aromaIds: ["herbal"], characterIds: ["warming", "comforting"] },
    ps: [g("bourbon-80", 50), g("simple-syrup", 8), g("peychauds-bitters", 2), g("absinthe", 3)], method: "stir", garnish: "lemon", contexts: ["after-meal"] },
  { slug: "manhattan-black", cuisine: "american", flavor: { tastes: { bitter: 3, sweet: 2 }, aromaIds: ["roasted"], characterIds: ["warming", "hearty"] },
    ps: [g("bourbon-80", 47), g("sweet-vermouth", 25), g("blackstrap-rum", 8), g("angostura-bitters", 2)], method: "stir", contexts: ["after-meal"] },
  { slug: "rob-roy-perfect", cuisine: "british", flavor: { tastes: { sweet: 2, bitter: 2 }, characterIds: ["warming", "hearty"] },
    ps: [g("scotch-80", 47), g("sweet-vermouth", 12), g("dry-vermouth", 12), g("angostura-bitters", 2)], method: "stir", contexts: ["after-meal"] },
  { slug: "old-fashioned-apple", cuisine: "american", flavor: { tastes: { sweet: 2, bitter: 1 }, aromaIds: ["fruity"], characterIds: ["warming", "comforting"] },
    ps: [g("apple-brandy", 47), g("simple-syrup", 6), g("angostura-bitters", 2)], method: "stir", contexts: ["after-meal"] },
  { slug: "old-fashioned-blackstrap", cuisine: "american", flavor: { tastes: { sweet: 2, bitter: 2 }, characterIds: ["warming", "hearty"] },
    ps: [g("bourbon-80", 47), g("blackstrap-rum", 12), g("angostura-bitters", 2)], method: "stir", garnish: "usda-orange", contexts: ["after-meal"] },
  // ================= tiki & tropical (16) =================
  { slug: "mai-tai-classic", cuisine: "fusion", flavor: { tastes: { sweet: 2, sour: 2, bitter: 2 }, aromaIds: ["fruity", "roasted"], characterIds: ["refreshing", "hearty"] },
    ps: [g("white-rum-80", 42), g("blackstrap-rum", 14), g("orange-liqueur-80", 12), g("orgeat-syrup", 20), g("lime", 22)], method: "shake", garnish: "fresh-mint", contexts: ["social-gathering", "after-meal"] },
  { slug: "zombie-classic", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 2, bitter: 2 }, aromaIds: ["fruity", "spiced"], characterIds: ["hearty", "warming"] },
    ps: [g("white-rum-80", 42), g("dark-rum-80", 42), g("blackstrap-rum", 14), g("lime", 22), g("falernum", 14), g("grenadine-syrup", 10), g("angostura-bitters", 2)], method: "shake", contexts: ["social-gathering"] },
  { slug: "hurricane-classic", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing", "hearty"] },
    ps: [g("dark-rum-80", 42), g("white-rum-80", 21), g("passion-fruit-syrup", 40), g("orange-juice", 30), g("lime", 15), g("grenadine-syrup", 8)], method: "shake", contexts: ["social-gathering"] },
  { slug: "painkiller-classic", cuisine: "fusion", flavor: { tastes: { sweet: 4 }, textureIds: ["creamy"], characterIds: ["refreshing", "comforting"] },
    ps: [g("dark-rum-80", 47), g("cream-of-coconut", 30), g("pineapple-juice", 90), g("orange-juice", 30)], method: "build", garnish: "usda-orange", contexts: ["social-gathering"] },
  { slug: "scorpion", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing", "hearty"] },
    ps: [g("dark-rum-80", 42), g("brandy-80", 21), g("orange-liqueur-80", 21), g("orange-juice", 60), g("lemon", 22)], method: "blend", contexts: ["social-gathering"] },
  { slug: "fog-cutter", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 2, bitter: 1 }, aromaIds: ["fruity", "floral"], characterIds: ["refreshing", "hearty"] },
    ps: [g("gin-80", 21), g("white-rum-80", 42), g("brandy-80", 21), g("orange-liqueur-80", 14), g("orgeat-syrup", 20), g("lemon", 22)], method: "shake", contexts: ["social-gathering"] },
  { slug: "hawaiian-rockefeller", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing"] },
    ps: [g("vodka-80", 42), g("passion-fruit-syrup", 20), g("orange-juice", 40), g("lime", 15)], method: "shake", contexts: ["social-gathering"] },
  { slug: "blue-hawaii", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 2 }, textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 33), g("blue-curacao-80", 14), g("pineapple-juice", 90), g("lime", 15)], method: "blend", contexts: ["social-gathering", "afternoon-tea"] },
  { slug: "bahama-mama", cuisine: "fusion", flavor: { tastes: { sweet: 4, sour: 1 }, aromaIds: ["fruity"], characterIds: ["refreshing", "hearty"] },
    ps: [g("dark-rum-80", 28), g("white-rum-80", 28), g("orange-juice", 40), g("pineapple-juice", 40), g("grenadine-syrup", 8)], method: "shake", contexts: ["social-gathering"] },
  { slug: "maitai-guava", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing"] },
    ps: [g("white-rum-80", 47), g("guava-paste", 20), g("lime", 22), g("orange-liqueur-80", 10)], method: "shake", contexts: ["social-gathering", "after-meal"] },
  { slug: "royal-hawaiian", cuisine: "fusion", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy"], characterIds: ["comforting", "light"] },
    ps: [g("gin-80", 33), g("cream-of-coconut", 20), g("pineapple-juice", 60), g("sweet-vermouth", 14)], method: "shake", contexts: ["after-meal", "social-gathering"] },
  { slug: "pina-colada-classic", cuisine: "fusion", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy"], characterIds: ["refreshing", "comforting"] },
    ps: [g("white-rum-80", 47), g("cream-of-coconut", 30), g("pineapple-juice", 90)], method: "blend", contexts: ["social-gathering", "after-meal"] },
  { slug: "banana-daiquiri-frozen", cuisine: "fusion", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["creamy"], characterIds: ["refreshing", "light"] },
    ps: [g("white-rum-80", 47), g("usda-banana", 100), g("lime", 20), g("simple-syrup", 10)], method: "blend", contexts: ["social-gathering"] },
  { slug: "coffee-cocktail", cuisine: "fusion", flavor: { tastes: { sweet: 3, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["creamy"], characterIds: ["warming", "comforting"] },
    ps: [g("dark-rum-80", 33), g("coffee-liqueur-80", 21), g("heavy-cream", 30), g("simple-syrup", 6)], method: "shake", contexts: ["after-meal"] },
  { slug: "spanish-coffee", cuisine: "spanish", flavor: { tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["creamy"], characterIds: ["warming", "comforting"] },
    ps: [g("brandy-80", 38), g("coffee-liqueur-80", 14), g("brewed-espresso", 60), g("brown-sugar", 8)], method: "build", contexts: ["after-meal"], hot: true },
  { slug: "california-lemonade", cuisine: "american", flavor: { tastes: { sour: 3, sweet: 2 }, textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 42), g("lemon", 25), g("simple-syrup", 15), g("grenadine-syrup", 6), g("club-soda", 60)], method: "shake", contexts: ["social-gathering", "afternoon-tea"] },
  // ================= floral, herbal & modern (19) =================
  { slug: "elderflower-collins", cuisine: "british", flavor: { tastes: { sweet: 2, sour: 2 }, aromaIds: ["floral"], characterIds: ["refreshing", "light"] },
    ps: [g("gin-80", 38), g("elderflower-liqueur", 21), g("lemon", 20), g("club-soda", 60)], method: "build", contexts: ["afternoon-tea", "aperitif"] },
  { slug: "elderflower-martini", cuisine: "british", flavor: { tastes: { sweet: 2 }, aromaIds: ["floral"], characterIds: ["light", "appetizing"] },
    ps: [g("gin-80", 47), g("elderflower-liqueur", 21)], method: "stir", garnish: "lemon", contexts: ["aperitif"] },
  { slug: "french-martini", cuisine: "french", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity"], textureIds: ["silky"], characterIds: ["light", "appetizing"] },
    ps: [g("vodka-80", 38), g("raspberry-liqueur", 12), g("pineapple-juice", 45)], method: "shake", contexts: ["aperitif", "after-meal"] },
  { slug: "appletini", cuisine: "american", flavor: { tastes: { sour: 2, sweet: 3 }, aromaIds: ["fruity"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 38), g("apple-brandy", 21), g("simple-syrup", 8), g("lemon", 15)], method: "shake", contexts: ["aperitif", "social-gathering"] },
  { slug: "espresso-martini-classic", cuisine: "british", flavor: { tastes: { bitter: 2, sweet: 2 }, aromaIds: ["roasted"], textureIds: ["silky"], characterIds: ["appetizing", "hearty"] },
    ps: [g("vodka-80", 28), g("coffee-liqueur-80", 21), g("brewed-espresso", 30), g("simple-syrup", 6)], method: "shake", contexts: ["after-meal"] },
  { slug: "yuzu-gin-tonic", cuisine: "japanese", flavor: { tastes: { sour: 2, bitter: 1 }, aromaIds: ["citrusy", "floral"], textureIds: ["crisp"], characterIds: ["refreshing", "clean-tasting"] },
    ps: [g("gin-80", 42), g("yuzushu", 21), g("club-soda", 100)], method: "build", contexts: ["aperitif", "social-gathering"] },
  { slug: "umeshu-soda", cuisine: "japanese", flavor: { tastes: { sweet: 2, sour: 1 }, aromaIds: ["fruity"], textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("yuzushu", 45), g("club-soda", 90)], method: "build", contexts: ["afternoon-tea", "aperitif"] },
  { slug: "midori-sour", cuisine: "japanese", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], characterIds: ["refreshing", "light"] },
    ps: [g("midori", 42), g("vodka-80", 14), g("lemon", 25), g("simple-syrup", 6)], method: "shake", contexts: ["social-gathering"] },
  { slug: "shochu-highball", cuisine: "japanese", flavor: { tastes: { bitter: 1 }, textureIds: ["crisp"], characterIds: ["clean-tasting", "light"] },
    ps: [g("shochu", 42), g("club-soda", 120), g("lime", 8)], method: "build", garnish: "lime", contexts: ["aperitif", "social-gathering"] },
  { slug: "soju-highball", cuisine: "korean", flavor: { tastes: { sour: 1, sweet: 1 }, textureIds: ["crisp"], characterIds: ["clean-tasting", "light"] },
    ps: [g("soju", 42), g("ginger-ale", 100), g("lime", 10)], method: "build", contexts: ["social-gathering"] },
  { slug: "soju-yogurt", cuisine: "korean", flavor: { tastes: { sweet: 2, sour: 2 }, textureIds: ["creamy"], characterIds: ["light", "refreshing"] },
    ps: [g("soju", 33), g("usda-yogurt", 60), g("simple-syrup", 10), g("club-soda", 30)], method: "shake", contexts: ["social-gathering", "after-meal"] },
  { slug: "honey-gin-sour", cuisine: "western", flavor: { tastes: { sour: 2, sweet: 3 }, aromaIds: ["floral"], textureIds: ["silky"], characterIds: ["refreshing"] },
    ps: [g("gin-80", 42), g("usda-honey", 20), g("lemon", 22)], method: "shake", contexts: ["aperitif"] },
  { slug: "lavender-gin-fizz", cuisine: "western", flavor: { tastes: { sour: 2, sweet: 2 }, aromaIds: ["floral"], textureIds: ["silky"], characterIds: ["refreshing", "light"] },
    ps: [g("gin-80", 38), g("usda-honey", 4), g("lemon", 20), g("simple-syrup", 15), g("egg", 30), g("club-soda", 45)], method: "shake", contexts: ["afternoon-tea", "aperitif"] },
  { slug: "cucumber-gin-tonic", cuisine: "british", flavor: { tastes: { bitter: 1 }, textureIds: ["crisp"], characterIds: ["clean-tasting", "refreshing"] },
    ps: [g("gin-80", 42), g("cucumber", 60), g("club-soda", 120), g("lime", 10)], method: "build", garnish: "cucumber", contexts: ["aperitif", "social-gathering"] },
  { slug: "basil-smash", cuisine: "western", flavor: { tastes: { sour: 2, sweet: 2 }, aromaIds: ["herbal"], textureIds: ["silky"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("gin-80", 47), g("basil-fresh", 12), g("lemon", 22), g("simple-syrup", 15)], method: "shake", contexts: ["aperitif", "social-gathering"] },
  { slug: "chartreuse-daisy", cuisine: "french", flavor: { tastes: { sour: 2, sweet: 2, bitter: 2 }, aromaIds: ["herbal"], characterIds: ["refreshing", "appetizing"] },
    ps: [g("green-chartreuse", 28), g("brandy-80", 21), g("lemon", 20), g("grenadine-syrup", 8)], method: "shake", contexts: ["after-meal"] },
  { slug: "benedictine-cocktail", cuisine: "french", flavor: { tastes: { sweet: 2, bitter: 1 }, aromaIds: ["herbal", "spiced"], characterIds: ["warming", "comforting"] },
    ps: [g("benedictine", 47), g("brandy-80", 21)], method: "stir", contexts: ["after-meal"] },
  { slug: "horses-neck", cuisine: "american", flavor: { tastes: { bitter: 2 }, textureIds: ["crisp"], characterIds: ["appetizing", "light"] },
    ps: [g("bourbon-80", 42), g("ginger-ale", 120), g("angostura-bitters", 2)], method: "build", garnish: "lemon", contexts: ["aperitif", "afternoon-tea"] },
  { slug: "arizona-blossom", cuisine: "american", flavor: { tastes: { sweet: 2, sour: 2 }, aromaIds: ["floral"], characterIds: ["refreshing", "light"] },
    ps: [g("vodka-80", 42), g("st-germain", 14), g("grapefruit-juice", 60), g("lime", 10)], method: "shake", contexts: ["aperitif", "social-gathering"] },
];

function cocktailFlow(row: CocktailRow): DraftRecipe {
  const portions: PortionSpec[] = row.ps.map((p) => ({
    id: p.id,
    grams: p.g,
    amount: p.g,
    unit: "g" as const,
    conversionId: "si:g:v1",
    role: (["simple-syrup", "granulated-sugar", "salt", "black-pepper", "orange-bitters", "angostura-bitters", "peychauds-bitters", "agave-syrup", "grenadine-syrup", "worcestershire-sauce", "hot-sauce", "celery-salt", "usda-honey", "powdered-sugar", "brown-sugar", "basil-fresh", "dried-lavender"].includes(p.id) ? "seasoning" : "main") as never,
    state: (["tomato-juice", "orange-juice", "cranberry-juice", "pineapple-juice", "ginger-beer", "ginger-ale", "club-soda", "heavy-cream", "milk", "drinking-water", "cola", "dry-white-wine", "dry-red-wine", "brewed-espresso", "usda-yogurt", "grapefruit-juice"].includes(p.id) ? ("liquid" as const) : undefined),
  }));
  const mlIds = new Set(["tomato-juice", "orange-juice", "cranberry-juice", "pineapple-juice", "ginger-beer", "ginger-ale", "club-soda", "heavy-cream", "milk", "drinking-water", "cola", "dry-white-wine", "dry-red-wine", "brewed-espresso", "grapefruit-juice"]);
  for (const p of portions) {
    if (mlIds.has(p.id)) {
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
