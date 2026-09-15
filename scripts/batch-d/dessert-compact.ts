import type { DraftRecipe, PortionSpec, OpSpec } from "../recipe-database-build";
import type { FlavorProfile } from "@/types/flavor";

/**
 * Batch D dessert drafts (73 recipes): Asian sweets, puddings, custards,
 * frozen and fruit desserts — config-driven (same flow as batch C).
 */

type P = { id: string; g: number };
const g = (id: string, grams: number): P => ({ id, g: grams });

type Flow = "simmer" | "steam" | "chill" | "boil" | "assemble" | "freeze";

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
  // ================= Chinese & Cantonese sweet soups (14) =================
  { slug: "tangyuan-black-sesame", cuisine: "chinese", flavor: { tastes: { sweet: 4 }, aromaIds: ["roasted"], textureIds: ["chewy", "soft"], characterIds: ["warming", "comforting"] },
    ps: [g("glutinous-rice-flour", 200), g("drinking-water", 160), g("black-sesame-paste", 100), g("granulated-sugar", 40), g("ginger", 10)], flow: "boil", yieldMl: 800 },
  { slug: "tangyuan-peanut", cuisine: "chinese", flavor: { tastes: { sweet: 4 }, aromaIds: ["roasted"], textureIds: ["chewy", "soft"], characterIds: ["warming", "comforting"] },
    ps: [g("glutinous-rice-flour", 200), g("drinking-water", 160), g("roasted-peanut", 100), g("brown-sugar", 50), g("ginger", 10)], flow: "boil", yieldMl: 800 },
  { slug: "tangyuan-red-bean", cuisine: "chinese", flavor: { tastes: { sweet: 4 }, textureIds: ["chewy", "soft"], characterIds: ["warming", "comforting"] },
    ps: [g("glutinous-rice-flour", 200), g("drinking-water", 160), g("red-bean-paste", 120), g("brown-sugar", 50), g("ginger", 10)], flow: "boil", yieldMl: 800 },
  { slug: "gui-hua-tang-ou", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["crisp", "tender"], characterIds: ["refreshing", "light"] },
    ps: [g("osmanthus-dried", 5), g("granulated-sugar", 80), g("drinking-water", 800), g("glutinous-rice-flour", 60)], flow: "simmer", yieldMl: 700 },
  { slug: "hong-dou-sha-tang", cuisine: "chinese", flavor: { tastes: { sweet: 4 }, textureIds: ["brothy", "soft"], characterIds: ["warming", "comforting"] },
    ps: [g("red-bean-paste", 250), g("drinking-water", 900), g("brown-sugar", 40), g("dried-longan", 30), g("usda-orange", 10)], flow: "simmer", yieldMl: 900, hot: true },
  { slug: "qing-dun-bing-tang-yan", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["silky", "brothy"], characterIds: ["refreshing", "light"] },
    ps: [g("snow-fungus", 15), g("asian-pear", 300), g("granulated-sugar", 50), g("drinking-water", 900), g("dried-longan", 20)], flow: "simmer", yieldMl: 900 },
  { slug: "mu-gua-xue-er-tang", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["brothy", "silky"], characterIds: ["refreshing", "comforting"] },
    ps: [g("papaya", 400), g("snow-fungus", 15), g("drinking-water", 800), g("granulated-sugar", 50)], flow: "simmer", yieldMl: 900 },
  { slug: "hai-di-yi-zhu", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy", "chewy"], characterIds: ["comforting"] },
    ps: [g("purple-sweet-potato", 200), g("taro", 150), g("sago-pearls", 40), g("coconut-milk", 300), g("granulated-sugar", 50)], flow: "simmer", yieldMl: 800 },
  { slug: "yang-zhi-gan-lu-mango", cuisine: "cantonese", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "floral"], textureIds: ["creamy", "chewy"], characterIds: ["refreshing", "comforting"] },
    ps: [g("mango", 350), g("grapefruit-juice", 100), g("sago-pearls", 50), g("coconut-milk", 200), g("evaporated-milk", 100), g("granulated-sugar", 40)], flow: "chill", yieldMl: 800 },
  { slug: "cha-shao-bing-tang-lu", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["crisp", "tender"], characterIds: ["refreshing"] },
    ps: [g("purple-sweet-potato", 300), g("drinking-water", 500), g("granulated-sugar", 50), g("osmanthus-dried", 3)], flow: "simmer", yieldMl: 700 },
  { slug: "lian-zi-bai-he-tang", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["brothy", "soft"], characterIds: ["refreshing", "comforting"] },
    ps: [g("lotus-seed", 100), g("dried-longan", 30), g("goji-berry", 10), g("granulated-sugar", 50), g("drinking-water", 1000)], flow: "simmer", yieldMl: 900 },
  { slug: "bing-tang-xue-li-pudding", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["juicy", "tender"], characterIds: ["refreshing", "light"] },
    ps: [g("asian-pear", 500), g("granulated-sugar", 40), g("dried-longan", 15), g("drinking-water", 300)], flow: "steam" },
  { slug: "yin-er-mu-gua-tang", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["brothy", "silky"], characterIds: ["refreshing", "comforting"] },
    ps: [g("papaya", 350), g("snow-fungus", 15), g("drinking-water", 900), g("granulated-sugar", 45)], flow: "simmer", yieldMl: 900 },
  { slug: "nan-gua-tang-yuan-tang", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "brothy"], characterIds: ["warming", "comforting"] },
    ps: [g("pumpkin-puree", 250), g("glutinous-rice-flour", 200), g("drinking-water", 600), g("brown-sugar", 40), g("ginger", 8)], flow: "boil", yieldMl: 800 },
  // ================= puddings & custards (14) =================
  { slug: "caramel-creme-brulee-variant", cuisine: "french", flavor: { tastes: { sweet: 4, bitter: 1 }, aromaIds: ["roasted", "toasty"], textureIds: ["creamy", "crisp"], characterIds: ["comforting", "hearty"] },
    ps: [g("heavy-cream", 480), g("egg", 100), g("granulated-sugar", 90), g("usda-vanilla", 8)], flow: "chill" },
  { slug: "panna-cotta-classic", cuisine: "italian", flavor: { tastes: { sweet: 3 }, textureIds: ["silky", "creamy"], characterIds: ["light", "comforting"] },
    ps: [g("heavy-cream", 400), g("milk", 100), g("granulated-sugar", 60), g("gelatin-powder", 10), g("usda-vanilla", 4)], flow: "chill" },
  { slug: "panna-cotta-mango", cuisine: "italian", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity"], textureIds: ["silky", "creamy"], characterIds: ["refreshing", "light"] },
    ps: [g("heavy-cream", 300), g("milk", 100), g("granulated-sugar", 50), g("gelatin-powder", 8), g("mango", 200)], flow: "chill" },
  { slug: "flan-classic", cuisine: "spanish", flavor: { tastes: { sweet: 4 }, textureIds: ["silky", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("sweetened-condensed-milk", 400), g("evaporated-milk", 300), g("egg", 200), g("granulated-sugar", 100)], flow: "chill" },
  { slug: "flan-coconut", cuisine: "spanish", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral"], textureIds: ["silky", "creamy"], characterIds: ["comforting", "light"] },
    ps: [g("sweetened-condensed-milk", 300), g("coconut-milk", 300), g("egg", 200), g("granulated-sugar", 80)], flow: "chill" },
  { slug: "purin-japanese", cuisine: "japanese", flavor: { tastes: { sweet: 4 }, aromaIds: ["roasted"], textureIds: ["silky", "soft"], characterIds: ["comforting", "light"] },
    ps: [g("milk", 400), g("egg", 150), g("granulated-sugar", 100), g("usda-vanilla", 4)], flow: "chill" },
  { slug: "milk-jelly-ginger", cuisine: "chinese", flavor: { tastes: { sweet: 2, spicy: 1 }, aromaIds: ["gingery"], textureIds: ["silky", "soft"], characterIds: ["warming", "comforting"] },
    ps: [g("milk", 500), g("ginger", 25), g("granulated-sugar", 30)], flow: "steam" },
  { slug: "steamed-egg-custard-sweet", cuisine: "chinese", flavor: { tastes: { sweet: 2 }, textureIds: ["silky", "soft"], characterIds: ["light", "comforting"] },
    ps: [g("egg", 150), g("milk", 300), g("granulated-sugar", 30)], flow: "steam" },
  { slug: "bread-pudding-classic", cuisine: "british", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["soft", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("wheat-flour", 200), g("milk", 500), g("egg", 200), g("granulated-sugar", 80), g("butter", 40), g("raisin", 60)], flow: "chill" },
  { slug: "rice-pudding-coconut", cuisine: "thai", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral"], textureIds: ["creamy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("usda-white-rice", 150), g("coconut-milk", 400), g("granulated-sugar", 60), g("salt", 2), g("mango", 200)], flow: "simmer", yieldMl: 800 },
  { slug: "tapioca-pudding", cuisine: "western", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy", "chewy"], characterIds: ["comforting"] },
    ps: [g("sago-pearls", 80), g("milk", 500), g("granulated-sugar", 60), g("egg", 50)], flow: "chill", yieldMl: 600 },
  { slug: "lemon-posset", cuisine: "british", flavor: { tastes: { sweet: 3, sour: 4 }, aromaIds: ["citrusy"], textureIds: ["silky", "creamy"], characterIds: ["refreshing", "light"] },
    ps: [g("heavy-cream", 500), g("granulated-sugar", 120), g("lemon", 60)], flow: "chill" },
  { slug: "chocolate-pots-de-creme", cuisine: "french", flavor: { tastes: { sweet: 3, bitter: 3 }, aromaIds: ["roasted"], textureIds: ["silky", "creamy"], characterIds: ["comforting", "hearty"] },
    ps: [g("dark-chocolate", 200), g("heavy-cream", 300), g("egg", 100), g("granulated-sugar", 40)], flow: "chill" },
  { slug: "coffee-jelly", cuisine: "japanese", flavor: { tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted"], textureIds: ["silky", "soft"], characterIds: ["refreshing", "light"] },
    ps: [g("instant-coffee", 15), g("drinking-water", 500), g("granulated-sugar", 60), g("agar-powder", 8), g("heavy-cream", 100)], flow: "chill", yieldMl: 600 },
  { slug: "annin-tofu", cuisine: "chinese", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["silky", "soft"], characterIds: ["light", "refreshing"] },
    ps: [g("almond-flour", 100), g("drinking-water", 600), g("gelatin-powder", 12), g("granulated-sugar", 60), g("milk", 100)], flow: "chill", yieldMl: 700 },
  // ================= wagashi & Asian sweets (16) =================
  { slug: "sakura-mochi", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, aromaIds: ["floral"], textureIds: ["chewy", "soft"], characterIds: ["light", "refreshing"] },
    ps: [g("glutinous-rice-flour", 200), g("drinking-water", 200), g("granulated-sugar", 60), g("red-bean-paste", 250)], flow: "steam" },
  { slug: "kashiwa-mochi", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "soft"], characterIds: ["comforting", "light"] },
    ps: [g("glutinous-rice-flour", 200), g("drinking-water", 200), g("red-bean-paste", 200), g("miso", 15)], flow: "steam" },
  { slug: "hanami-dango", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy"], characterIds: ["light", "refreshing"] },
    ps: [g("shiratama-flour", 200), g("drinking-water", 180), g("granulated-sugar", 50), g("matcha-powder", 5), g("black-sesame-paste", 15)], flow: "steam" },
  { slug: "kuri-kinton", cuisine: "japanese", flavor: { tastes: { sweet: 4 }, aromaIds: ["toasty"], textureIds: ["creamy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("usda-sweet-potato", 500), g("granulated-sugar", 120), g("taro", 80), g("usda-honey", 20)], flow: "simmer" },
  { slug: "zunda-mochi", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "creamy"], characterIds: ["comforting", "light"] },
    ps: [g("shiratama-flour", 180), g("drinking-water", 160), g("mung-bean", 150), g("granulated-sugar", 50)], flow: "steam" },
  { slug: "amanatto", cuisine: "japanese", flavor: { tastes: { sweet: 4 }, textureIds: ["chewy"], characterIds: ["light"] },
    ps: [g("red-bean-paste", 300), g("granulated-sugar", 200), g("drinking-water", 200)], flow: "simmer" },
  { slug: "karukan", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, aromaIds: ["toasty"], textureIds: ["soft", "tender"], characterIds: ["light", "comforting"] },
    ps: [g("rice-flour", 200), g("taro", 100), g("granulated-sugar", 150), g("drinking-water", 150)], flow: "steam" },
  { slug: "uiro", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "silky"], characterIds: ["light"] },
    ps: [g("rice-flour", 150), g("granulated-sugar", 120), g("drinking-water", 300), g("matcha-powder", 4)], flow: "chill", yieldMl: 500 },
  { slug: "suama", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "soft"], characterIds: ["light"] },
    ps: [g("glutinous-rice-flour", 200), g("granulated-sugar", 120), g("drinking-water", 180)], flow: "steam" },
  { slug: "gyuhi", cuisine: "japanese", flavor: { tastes: { sweet: 4 }, textureIds: ["chewy", "soft"], characterIds: ["light", "comforting"] },
    ps: [g("glutinous-rice-flour", 150), g("granulated-sugar", 100), g("drinking-water", 150), g("usda-honey", 30)], flow: "steam" },
  { slug: "kakigori-strawberry", cuisine: "japanese", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["crisp", "saucy"], characterIds: ["refreshing", "light"] },
    ps: [g("strawberry", 250), g("granulated-sugar", 60), g("sweetened-condensed-milk", 60), g("ice", 300)], flow: "assemble" },
  { slug: "mitsumame", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "brothy"], characterIds: ["refreshing", "light"] },
    ps: [g("agar-powder", 8), g("drinking-water", 500), g("granulated-sugar", 80), g("red-bean-paste", 100), g("usda-orange", 80)], flow: "chill", yieldMl: 600 },
  { slug: "anmitsu", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["chewy", "saucy"], characterIds: ["refreshing", "light"] },
    ps: [g("agar-powder", 8), g("drinking-water", 400), g("granulated-sugar", 60), g("red-bean-paste", 120), g("usda-orange", 60)], flow: "chill", yieldMl: 500 },
  { slug: "yokan-mizu", cuisine: "japanese", flavor: { tastes: { sweet: 4 }, textureIds: ["silky", "soft"], characterIds: ["light", "refreshing"] },
    ps: [g("red-bean-paste", 300), g("agar-powder", 6), g("granulated-sugar", 80), g("drinking-water", 400)], flow: "chill", yieldMl: 600 },
  { slug: "ame-manju", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "chewy"], characterIds: ["comforting"] },
    ps: [g("wheat-flour", 150), g("glutinous-rice-flour", 50), g("baking-soda", 2), g("brown-sugar", 80), g("red-bean-paste", 150), g("drinking-water", 120)], flow: "steam" },
  { slug: "kuro-mame", cuisine: "japanese", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "brothy"], characterIds: ["warming", "comforting"] },
    ps: [g("mung-bean", 150), g("granulated-sugar", 100), g("drinking-water", 600), g("salt", 1)], flow: "simmer", yieldMl: 600 },
  // ================= Korean & Southeast Asian (11) =================
  { slug: "hotteok", cuisine: "korean", flavor: { tastes: { sweet: 4 }, aromaIds: ["toasty"], textureIds: ["chewy", "crisp"], characterIds: ["comforting", "warming"] },
    ps: [g("wheat-flour", 250), g("drinking-water", 180), g("active-dry-yeast", 4), g("brown-sugar", 80), g("cinnamon", 4), g("walnut", 30)], flow: "chill" },
  { slug: "dasik", cuisine: "korean", flavor: { tastes: { sweet: 3 }, textureIds: ["tender", "crisp"], characterIds: ["light", "comforting"] },
    ps: [g("rice-flour", 100), g("milk-powder", 50), g("usda-honey", 80), g("black-sesame-paste", 30)], flow: "assemble" },
  { slug: "jeungpyeon", cuisine: "korean", flavor: { tastes: { sweet: 2, sour: 1 }, aromaIds: ["fermented"], textureIds: ["soft", "tender"], characterIds: ["light", "refreshing"] },
    ps: [g("rice-flour", 250), g("junmai-sake-generic", 60), g("granulated-sugar", 60), g("drinking-water", 200)], flow: "steam" },
  { slug: "sulgitteok", cuisine: "korean", flavor: { tastes: { sweet: 2 }, textureIds: ["chewy", "soft"], characterIds: ["comforting", "light"] },
    ps: [g("glutinous-rice-flour", 250), g("junmai-sake-generic", 50), g("usda-honey", 30), g("dried-longan", 30), g("date-fruit", 30)], flow: "steam" },
  { slug: "bingsu-pat", cuisine: "korean", flavor: { tastes: { sweet: 4 }, textureIds: ["crisp", "creamy"], characterIds: ["refreshing", "light"] },
    ps: [g("ice", 300), g("milk", 200), g("red-bean-paste", 150), g("granulated-sugar", 40), g("sweetened-condensed-milk", 50)], flow: "freeze" },
  { slug: "hoppang", cuisine: "korean", flavor: { tastes: { sweet: 3 }, textureIds: ["soft", "tender"], characterIds: ["comforting", "warming"] },
    ps: [g("wheat-flour", 300), g("milk", 180), g("granulated-sugar", 50), g("active-dry-yeast", 5), g("red-bean-paste", 200)], flow: "steam" },
  { slug: "kuih-lapis", cuisine: "malaysian", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral"], textureIds: ["chewy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("rice-flour", 200), g("tapioca-starch", 100), g("coconut-milk", 300), g("granulated-sugar", 200), g("pandan-extract", 5)], flow: "steam" },
  { slug: "onde-onde", cuisine: "malaysian", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral"], textureIds: ["chewy", "saucy"], characterIds: ["comforting", "light"] },
    ps: [g("glutinous-rice-flour", 250), g("pandan-extract", 4), g("drinking-water", 150), g("palm-sugar", 80), g("shredded-coconut", 100)], flow: "boil" },
  { slug: "pulut-inti", cuisine: "malaysian", flavor: { tastes: { sweet: 4 }, aromaIds: ["floral"], textureIds: ["chewy", "saucy"], characterIds: ["comforting", "hearty"] },
    ps: [g("black-glutinous-rice", 200), g("coconut-milk", 200), g("palm-sugar", 80), g("salt", 2), g("pandan-leaf", 3)], flow: "steam" },
  { slug: "tab-tim-grob", cuisine: "thai", flavor: { tastes: { sweet: 4 }, textureIds: ["crisp", "creamy"], characterIds: ["refreshing", "light"] },
    ps: [g("water-chestnut", 250), g("tapioca-starch", 80), g("coconut-milk", 300), g("granulated-sugar", 80), g("jackfruit", 100), g("ice", 100)], flow: "chill", yieldMl: 700 },
  { slug: "ruam-mit", cuisine: "thai", flavor: { tastes: { sweet: 4 }, textureIds: ["chewy", "creamy", "crisp"], characterIds: ["refreshing", "hearty"] },
    ps: [g("tapioca-starch", 60), g("sago-pearls", 40), g("coconut-milk", 300), g("palm-sugar", 70), g("mango", 100), g("ice", 120)], flow: "chill", yieldMl: 700 },
  // ================= Western & frozen (14) =================
  { slug: "apple-brown-betty", cuisine: "american", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["soft", "crisp"], characterIds: ["comforting", "warming"] },
    ps: [g("usda-apple", 500), g("wheat-flour", 150), g("butter", 100), g("brown-sugar", 100), g("cinnamon", 3)], flow: "chill" },
  { slug: "apple-charlotte", cuisine: "french", flavor: { tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["crisp", "soft"], characterIds: ["comforting"] },
    ps: [g("usda-apple", 600), g("wheat-flour", 200), g("butter", 120), g("granulated-sugar", 80)], flow: "chill" },
  { slug: "pear-charlotte", cuisine: "french", flavor: { tastes: { sweet: 3 }, aromaIds: ["fruity"], textureIds: ["crisp", "soft"], characterIds: ["comforting", "light"] },
    ps: [g("asian-pear", 500), g("wheat-flour", 200), g("butter", 120), g("granulated-sugar", 70)], flow: "chill" },
  { slug: "banana-foster-sauce", cuisine: "american", flavor: { tastes: { sweet: 4 }, aromaIds: ["roasted", "fruity"], textureIds: ["saucy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("usda-banana", 300), g("butter", 60), g("brown-sugar", 100), g("dark-rum-80", 30), g("usda-honey", 20)], flow: "simmer" },
  { slug: "peaches-halves-grilled", cuisine: "american", flavor: { tastes: { sweet: 4, sour: 1 }, aromaIds: ["fruity", "roasted"], textureIds: ["juicy", "tender"], characterIds: ["refreshing", "comforting"] },
    ps: [g("peach", 400), g("butter", 40), g("brown-sugar", 60), g("usda-honey", 20)], flow: "chill" },
  { slug: "poached-pears", cuisine: "french", flavor: { tastes: { sweet: 3 }, textureIds: ["tender", "brothy"], characterIds: ["light", "comforting"] },
    ps: [g("asian-pear", 500), g("dry-white-wine", 400), g("granulated-sugar", 100), g("lemon", 20), g("cinnamon", 3)], flow: "simmer", yieldMl: 800 },
  { slug: "compote-stone-fruit", cuisine: "western", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["saucy", "soft"], characterIds: ["refreshing"] },
    ps: [g("dark-cherries", 300), g("peach", 200), g("granulated-sugar", 80), g("lemon", 15)], flow: "simmer", yieldMl: 600 },
  { slug: "macerated-berries", cuisine: "western", flavor: { tastes: { sweet: 2, sour: 2 }, aromaIds: ["fruity"], textureIds: ["juicy", "saucy"], characterIds: ["refreshing", "light"] },
    ps: [g("strawberry", 250), g("raspberry", 150), g("blackberry-liqueur", 20), g("granulated-sugar", 50)], flow: "chill" },
  { slug: "berry-summer-pudding", cuisine: "british", flavor: { tastes: { sweet: 3, sour: 2 }, aromaIds: ["fruity"], textureIds: ["soft", "saucy"], characterIds: ["refreshing", "light"] },
    ps: [g("strawberry", 300), g("raspberry", 200), g("wheat-flour", 200), g("granulated-sugar", 100), g("blackberry-liqueur", 15)], flow: "chill" },
  { slug: "granita-lemon", cuisine: "italian", flavor: { tastes: { sweet: 2, sour: 4 }, aromaIds: ["citrusy"], textureIds: ["crisp"], characterIds: ["refreshing", "light"] },
    ps: [g("lemon", 120), g("drinking-water", 400), g("granulated-sugar", 100)], flow: "freeze", yieldMl: 500 },
  { slug: "granita-coffee", cuisine: "italian", flavor: { tastes: { sweet: 2, bitter: 3 }, aromaIds: ["roasted"], textureIds: ["crisp"], characterIds: ["light", "refreshing"] },
    ps: [g("instant-coffee", 20), g("drinking-water", 500), g("granulated-sugar", 80)], flow: "freeze", yieldMl: 500 },
  { slug: "semifreddo-vanilla", cuisine: "italian", flavor: { tastes: { sweet: 3 }, textureIds: ["creamy", "silky"], characterIds: ["light", "comforting"] },
    ps: [g("heavy-cream", 400), g("egg", 100), g("granulated-sugar", 100), g("usda-vanilla", 6)], flow: "freeze" },
  { slug: "zuccotto", cuisine: "italian", flavor: { tastes: { sweet: 3, bitter: 1 }, aromaIds: ["roasted"], textureIds: ["creamy", "soft"], characterIds: ["comforting", "hearty"] },
    ps: [g("mascarpone", 400), g("heavy-cream", 200), g("granulated-sugar", 100), g("dark-chocolate", 100), g("candied-peel", 40)], flow: "freeze" },
  { slug: "zabaglione", cuisine: "italian", flavor: { tastes: { sweet: 3 }, aromaIds: ["roasted"], textureIds: ["creamy", "silky"], characterIds: ["warming", "comforting"] },
    ps: [g("egg", 120), g("granulated-sugar", 80), g("cream-sherry", 80)], flow: "simmer", yieldMl: 300, hot: true },
  { slug: "ba-bao-fan", cuisine: "chinese", flavor: { tastes: { sweet: 4 }, aromaIds: ["fruity", "floral"], textureIds: ["chewy", "soft"], characterIds: ["warming", "comforting"] },
    ps: [g("glutinous-rice-flour", 300), g("red-bean-paste", 200), g("granulated-sugar", 80), g("date-fruit", 40), g("goji-berry", 15), g("dried-longan", 30), g("lotus-seed", 30), g("lard", 20), g("osmanthus-dried", 3)], flow: "steam" },
];

function dessertFlow(row: DessertRow): DraftRecipe {
  const servings = row.servings ?? 4;
  const portions: PortionSpec[] = row.ps.map((p) => ({
    id: p.id,
    grams: p.g,
    amount: p.g,
    unit: "g" as const,
    conversionId: "si:g:v1",
    role: (["granulated-sugar", "salt", "brown-sugar", "palm-sugar", "cinnamon", "ginger", "osmanthus-dried", "matcha-powder", "kinako", "agar-powder", "pandan-leaf", "pandan-extract", "usda-honey", "miso", "baking-soda", "instant-coffee", "dried-longan", "goji-berry", "powdered-sugar", "blackberry-liqueur", "dark-rum-80", "marsala? sherry", "dry-white-wine", "junmai-sake-generic", "port-wine"].includes(p.id) ? ("seasoning" as const) : ("main" as const)),
    state: (["milk", "coconut-milk", "heavy-cream", "evaporated-milk", "drinking-water", "sweetened-condensed-milk", "condensed-milk", "dry-white-wine", "port-wine", "junmai-sake-generic", "grapefruit-juice"].includes(p.id) ? ("liquid" as const) : undefined),
  }));
  const mlIds = new Set(["milk", "coconut-milk", "heavy-cream", "evaporated-milk", "drinking-water", "sweetened-condensed-milk", "dry-white-wine", "port-wine", "junmai-sake-generic", "grapefruit-juice"]);
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
    ops.push({ op: "mix", inputs: allIdx, durationMs: 60000, params: { strength: 0.4 } });
    ops.push({ op: "boil", inputs: [], waitMs: 600000, params: { temperatureC: 100 }, targets: [{ dimension: "doneness", minimum: 0.9, unit: "normalized" }], equipment: "saucepan" });
    ops.push({ op: "remove", inputs: [], durationMs: 5000 });
  } else if (row.flow === "freeze") {
    ops.push({ op: "mix", inputs: allIdx, durationMs: 120000, params: { strength: 0.5 }, targets: [{ dimension: "structural-integrity", minimum: 0.7, unit: "normalized" }] });
    ops.push({ op: "freeze", inputs: [], waitMs: 14400000, params: { temperatureC: -18 }, targets: [{ dimension: "structural-integrity", minimum: 0.8, unit: "normalized" }] });
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
