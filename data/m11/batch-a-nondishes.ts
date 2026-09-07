import type {
  AlcoholicDrinkItem,
  ClaimKind,
  CoffeeItem,
  CulinaryCost,
  CulinaryItem,
  CulinaryNutrition,
  DessertItem,
  Evidence,
  NonAlcoholicDrinkItem,
  Source,
  Story,
  TeaItem,
} from "@/types/culinary";
import type { LocalContentPackageV1 } from "@/types/content-bundle";
import type { RecipeImage } from "@/types/image";
import type { ResearchRecord, ResearchSourceUse, ResearchTemplateId } from "@/types/research";
import {
  bilingual,
  bilingualStep,
  defineStandaloneContentPackage,
  m11Evidence,
  m11OriginalHero,
  m11ReferenceSource,
  m11ResearchRecord,
  m11ReviewedAt,
  m11Story,
} from "./content-factories";

type ProceduralItem = DessertItem | TeaItem | CoffeeItem | NonAlcoholicDrinkItem;
type BatchItem = ProceduralItem | AlcoholicDrinkItem;

interface SourceSeed {
  title: string;
  publisher: string;
  authorNames?: string[];
  url: string;
  locator: string;
  note: string;
  type?: Source["type"];
  reliability?: Source["reliability"];
  uses: [ResearchSourceUse, ...ResearchSourceUse[]];
  strength?: Evidence["strength"];
}

interface CommonSeed {
  id: string;
  itemType: BatchItem["itemType"];
  zhName: string;
  enName: string;
  zhDescription: string;
  enDescription: string;
  countryId?: string;
  regionId?: string;
  originAreaId?: string;
  cuisineId: string;
  techniqueIds: string[];
  formIds: string[];
  dietaryTagIds: string[];
  tastes: CulinaryItem["flavor"]["tastes"];
  aromaIds: NonNullable<CulinaryItem["flavor"]["aromaIds"]>;
  textureIds: NonNullable<CulinaryItem["flavor"]["textureIds"]>;
  characterIds: NonNullable<CulinaryItem["flavor"]["characterIds"]>;
  servingContextIds: string[];
  weight: "light" | "medium" | "rich";
  temperature: "cold" | "cool" | "room" | "warm" | "hot";
  storyType: Story["type"];
  storyKind?: ClaimKind;
  claimZh: string;
  claimEn: string;
  sources: readonly [SourceSeed, SourceSeed, ...SourceSeed[]];
  storyEvidenceIndexes?: readonly [number, ...number[]];
  nutrition: CulinaryNutrition;
  cost: CulinaryCost;
  alt: string;
}

type Seed = CommonSeed & (
  | { itemType: "dessert"; preparation: DessertItem["preparation"] }
  | { itemType: "tea"; preparation: TeaItem["preparation"] }
  | { itemType: "coffee"; preparation: CoffeeItem["preparation"] }
  | { itemType: "non-alcoholic-drink"; preparation: NonAlcoholicDrinkItem["preparation"] }
  | { itemType: "alcoholic-drink"; preparation: AlcoholicDrinkItem["preparation"] }
);

const input = (ingredientId: string, amount: number, unit: "g" | "ml" | "piece" = "g", note?: string) => ({
  ingredientId,
  amount,
  unit,
  optional: false,
  ...(note ? { note } : {}),
});

const staged = { status: "draft" as const };

const seeds: readonly Seed[] = [
  {
    id: "double-skin-milk",
    itemType: "dessert",
    zhName: "双皮奶",
    enName: "Double-skin Milk Custard",
    zhDescription: "先形成并保留第一层奶皮，再把蛋白奶液回注蒸出第二层的顺德奶香甜品；以中心温度和整体轻颤共同判断完成。",
    enDescription: "A Shunde milk dessert that preserves a first cooled-milk skin before the egg-white mixture is returned beneath it and steamed into a second layer, finished by temperature and a unified wobble.",
    countryId: "china",
    regionId: "guangdong",
    cuisineId: "cantonese",
    techniqueIds: ["steam"],
    formIds: ["custard-dessert"],
    dietaryTagIds: ["vegetarian"],
    tastes: { sweet: 2 }, aromaIds: [], textureIds: ["silky", "soft"], characterIds: ["comforting"],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "medium", temperature: "cool",
    storyType: "place-food-culture",
    claimZh: "双皮奶在本条目中作为广东奶制甜品记录，Cooking Lab 的做法以低温蒸制定型，不声称餐厅授权或唯一正宗版本。",
    claimEn: "This entry documents double-skin milk as a Guangdong dairy dessert; Cooking Lab uses gentle steaming and claims neither restaurant authorization nor a uniquely authentic version.",
    sources: [
      { title: "Shunde, UNESCO Creative City of Gastronomy", publisher: "UNESCO Creative Cities Network", url: "https://www.unesco.org/en/creative-cities/shunde", locator: "Gastronomy profile", note: "Regional context for Shunde food culture.", type: "official-cultural-institution", uses: ["culture"] },
      { title: "Double Skin Milk", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Double_skin_milk", locator: "Dessert identity and preparation overview", note: "Independent general reference for the dessert identity; no source wording is reused.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "preparation"] },
      { title: "Shell Eggs from Farm to Table", publisher: "USDA Food Safety and Inspection Service", url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/eggs/shell-eggs-farm-table", locator: "Egg dishes temperature guidance", note: "Government guidance used only for the 71°C/160°F egg-dish completion boundary.", type: "government", reliability: "authoritative-secondary", uses: ["safety"], strength: "strong" },
      { title: "Double Skin Milk Pudding 雙皮奶", publisher: "The Hong Kong Cookery", authorNames: ["Ellen L."], url: "https://www.thehongkongcookery.com/2025/05/double-skin-milk-pudding.html", locator: "Written ingredients and directions", note: "Authored written recipe used to cross-check heating and cooling milk to form the first skin, pouring out beneath it, mixing egg white and sugar, straining, returning the mixture, steaming, residual cooking, and wobble cues; wording and optional additions are not reused.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation", "culture"] },
    ],
    storyEvidenceIndexes: [0, 1, 2],
    nutrition: { applicability: "applicable", source: "ingredient-derived" },
    cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "浅色瓷碗中的双皮奶，表面平滑并有轻微凝固光泽",
    preparation: {
      kind: "cooking",
      time: { prepMinutes: 15, processMinutes: 45, totalMinutes: 60, activeMinutes: 15 },
      yield: { amount: 4, unit: "serving" },
      inputs: [input("milk", 500, "ml"), input("egg-white", 90), input("granulated-sugar", 35)],
      toolIds: ["saucepan", "mixing-bowl", "fine-strainer", "steamer", "instant-read-thermometer"],
      steps: [
        bilingualStep(1, { instruction: "牛奶小火加热至锅边刚冒细泡，分入四只耐热碗，表面保持平静。", rationale: "接近沸点但不持续翻滚，能让牛奶冷却时形成完整表层而不焦底。", stateCue: "牛奶热而不翻滚，四只碗的液面平整。" }, { instruction: "Warm the milk over low heat until tiny bubbles appear at the edge, then divide among four heatproof bowls without disturbing the surface.", rationale: "Heating close to a boil without sustained bubbling supports an intact surface layer as the milk cools and limits scorching.", stateCue: "The milk is hot but not rolling, and each bowl has a calm level surface." }, 5),
        bilingualStep(2, { instruction: "静置约 10 分钟，直到每碗出现可见奶皮；沿碗边挑开一个小口，把皮下牛奶缓慢倒回搅拌碗，奶皮留在原碗底。", rationale: "先形成并保留第一层奶皮，是双皮奶区别于普通蒸奶蛋羹的关键步骤。", stateCue: "每碗保留一张完整或大体完整的奶皮，没有被搅碎。" }, { instruction: "Rest for about 10 minutes until a visible skin forms on each bowl. Loosen a small edge and slowly pour the milk beneath it back into a mixing bowl, leaving the skin behind.", rationale: "Forming and preserving this first milk skin is the defining step that separates double-skin milk from an ordinary steamed milk custard.", stateCue: "Each bowl retains an intact or mostly intact skin rather than broken fragments." }, 10),
        bilingualStep(3, { instruction: "蛋白与糖轻轻打散，加入倒出的温牛奶后过细筛；把混合液沿碗边从奶皮下方缓慢回注，使奶皮重新浮起。", rationale: "轻搅和过滤减少气泡与蛋白筋络，从皮下回注可保留第一层奶皮。", stateCue: "液面细腻、泡沫很少，原奶皮重新浮在表面。" }, { instruction: "Loosen the egg whites gently with sugar, combine with the poured-off warm milk, and strain. Return the mixture slowly down the side beneath each retained skin so it floats again.", rationale: "Gentle mixing and straining limit bubbles and strands, while returning liquid beneath the skin preserves the first layer.", stateCue: "The liquid is smooth with little foam and the original skin floats again." }, 10),
        bilingualStep(4, { instruction: "碗上盖盘或耐热盖，中小火蒸约 15 分钟；中心达到 71°C 且无流动蛋液后关火焖 5 分钟，再取出放凉。", rationale: "温和蒸汽让蛋白奶液在第一层奶皮下凝固，并在表面形成第二层；温度与无流动蛋液共同给出安全完成线。", stateCue: "中心至少 71°C，表层完整，轻晃时整体颤动但没有液体波纹。" }, { instruction: "Cover each bowl and steam gently for about 15 minutes. Once the center reaches 71°C with no liquid egg, rest off heat for 5 minutes before cooling.", rationale: "Gentle steam sets the milk-and-egg-white mixture beneath the retained skin and forms the second surface layer; temperature and absence of liquid egg define the safety boundary.", stateCue: "The center is at least 71°C, the surface is intact, and the custard jiggles as one piece without a liquid ripple." }, 20),
        bilingualStep(5, { instruction: "移入冰箱冷却约 15 分钟，待中心温凉后食用；不在室温长时间放置。", rationale: "短暂冷却让两层表面与内部凝胶稳定，也使服务温度与条目标注一致。", stateCue: "中心温凉、表面没有积水，勺取时仍柔嫩凝固。" }, { instruction: "Refrigerate for about 15 minutes and serve once the center is cool; do not leave the custard at room temperature for an extended period.", rationale: "Brief chilling stabilizes both surface layers and the inner gel while matching the declared serving temperature.", stateCue: "The center is cool, the surface has no pooled water, and each spoonful remains softly set." }, 15),
      ],
    },
  },
  {
    id: "mango-pomelo-sago", itemType: "dessert", zhName: "杨枝甘露", enName: "Mango Pomelo Sago",
    zhDescription: "芒果泥、柚子果肉与煮透西米组成的冷甜品，保留果香、酸度和颗粒口感。",
    enDescription: "A chilled mango dessert with pomelo and fully cooked tapioca pearls, balancing ripe fruit, gentle acidity, and distinct texture.",
    countryId: "china", cuisineId: "cantonese", techniqueIds: ["boil"], formIds: ["sago-dessert"], dietaryTagIds: ["vegetarian"],
    tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "citrusy"], textureIds: ["creamy", "chewy"], characterIds: ["refreshing"],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "medium", temperature: "cold", storyType: "historical-development",
    claimZh: "本条目把杨枝甘露作为香港粤式甜品语境中的芒果、西米与柚子组合记录，不复制任何餐厅配方。",
    claimEn: "This entry records mango pomelo sago as a Hong Kong Cantonese dessert combining mango, tapioca pearls, and pomelo without reproducing any restaurant recipe.",
    sources: [
      { title: "The Hong Kong Dessert with an Immortal Name", publisher: "The World of Chinese", url: "https://www.theworldofchinese.com/2021/07/behind-the-name-of-an-immortal-hong-kong-dessert/", locator: "Modern Hong Kong development and mango-pomelo-sago identity", note: "Authored cultural feature used only to support the bounded modern Hong Kong dessert identity; no narrative wording or restaurant formula is reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Mango Pomelo Sago", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Mango_pomelo_sago", locator: "Dessert identity, ingredients, and Hong Kong context", note: "Independent general cross-check for the mango, pomelo, and sago identity; no source wording is reused.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Cassava", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/plant/cassava", locator: "Tapioca as a cassava-starch product", note: "Narrow factual context for tapioca only; it does not support the dessert-development claim.", type: "publisher", uses: ["identity"] },
      { title: "Mango Pomelo Sago Recipe", publisher: "National Mango Board", url: "https://www.mango.org/recipes/mango-pomelo-sago/", locator: "Ingredients and Instructions", note: "Institutional written recipe used to cross-check boiling and resting tapioca, blending mango with coconut and dairy, adding pomelo, and chilling; exact times remain Cooking Lab editorial choices.", type: "professional-organization", reliability: "authoritative-secondary", uses: ["identity", "preparation"] },
      { title: "Mango Pomelo Sago Dessert 楊枝甘露", publisher: "The Hong Kong Cookery", authorNames: ["Ellen L."], url: "https://www.thehongkongcookery.com/2023/10/mango-pomelo-sago-dessert.html", locator: "Mango Pomelo Sago Drink Recipe and Directions", note: "Authored written recipe used to cross-check covered tapioca resting, texture-based doneness, rinsing, blending mango, keeping fruit pieces, separating pomelo, and chilling; prose and arrangement are not reused.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation", "culture"] },
    ],
    storyEvidenceIndexes: [0, 1, 2],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "透明甜品杯中的金黄芒果西米露，顶部有粉红柚子果肉",
    preparation: {
      kind: "cooking", time: { prepMinutes: 20, processMinutes: 35, totalMinutes: 55, activeMinutes: 30 }, yield: { amount: 4, unit: "serving" },
      inputs: [input("mango", 500), input("pomelo", 150), input("tapioca-pearl", 80), input("coconut-milk", 180, "ml"), input("milk", 120, "ml"), input("granulated-sugar", 25)],
      toolIds: ["saucepan", "fine-strainer", "blender", "refrigerator"],
      steps: [
        bilingualStep(1, { instruction: "西米放入足量沸水中煮 12 分钟，关火加盖焖至只剩微小白芯，再冲冷水沥干。", rationale: "足量水和焖熟可避免外烂内硬，冲洗能除去表面多余淀粉。", stateCue: "西米大致透明、颗粒分明。" }, { instruction: "Cook the tapioca pearls in abundant boiling water for 12 minutes, cover off heat until only tiny white centers remain, then rinse cold and drain.", rationale: "Abundant water and covered resting cook the centers evenly; rinsing removes excess surface starch.", stateCue: "The pearls are mostly translucent and separate." }, 20),
        bilingualStep(2, { instruction: "大部分芒果与椰奶、牛奶和糖打至顺滑，留少量芒果切丁。", rationale: "保留果丁让成品同时有顺滑基底和鲜果口感。", stateCue: "芒果基底浓稠均匀，没有大块纤维。" }, { instruction: "Blend most of the mango with coconut milk, milk, and sugar until smooth; reserve a little mango in cubes.", rationale: "Reserved fruit keeps fresh texture against the smooth base.", stateCue: "The mango base is thick, even, and free of large fibers." }, 10),
        bilingualStep(3, { instruction: "混合芒果基底和西米，冷藏至少 20 分钟；食用前加入柚子和芒果丁。", rationale: "柚子最后加入可保留独立果粒与清楚酸香。", stateCue: "甜品彻底冰凉，西米仍能分辨，柚子没有出水。" }, { instruction: "Fold the tapioca into the mango base and chill for at least 20 minutes; add pomelo and mango cubes just before serving.", rationale: "Adding pomelo last preserves distinct segments and bright acidity.", stateCue: "The dessert is fully chilled, with distinct pearls and firm pomelo segments." }, 25),
      ],
    },
  },
  {
    id: "hong-kong-egg-tart", itemType: "dessert", zhName: "港式蛋挞", enName: "Hong Kong Egg Tart",
    zhDescription: "酥松挞壳承托柔嫩蛋奶馅，烤至边缘定型、中心仍轻微颤动。",
    enDescription: "A crisp pastry shell holding a tender egg custard, baked until the rim is set and the center still trembles slightly.",
    countryId: "china", cuisineId: "cantonese", techniqueIds: ["bake"], formIds: ["pastry"], dietaryTagIds: ["vegetarian"],
    tastes: { sweet: 2 }, aromaIds: ["toasty"], textureIds: ["crisp", "silky"], characterIds: ["comforting"],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "medium", temperature: "warm", storyType: "place-food-culture",
    claimZh: "本条目把港式蛋挞放在香港烘焙点心语境中记录；具体酥皮与蛋奶比例是 Cooking Lab 的独立家庭版本。",
    claimEn: "This entry places Hong Kong egg tarts in the city’s bakery-pastry context; its pastry and custard ratios are an independent Cooking Lab home version.",
    sources: [
      { title: "The History of Egg Tarts: From Savoury to Sweet, from Medieval England to Hong Kong, from Short Crust to Flaky Pastry", publisher: "South China Morning Post", url: "https://www.scmp.com/lifestyle/food-drink/article/3102712/history-egg-tarts-savoury-sweet-england-canton-short-crust", locator: "Medieval England, Guangzhou, and Hong Kong development; shortcrust and puff-pastry variants", note: "Authored historical feature used only for the bounded development path and coexistence of shell styles; no prose is reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "The Evolution of Cha Chaan Teng: Exploring Hong Kong’s Iconic Dishes and Local Dining Culture", publisher: "MICHELIN Guide", url: "https://guide.michelin.com/tw/en/article/features/evolution-of-cha-chaan-teng-hong-kong-s-iconic-dishes-and-local-dining-culture", locator: "Egg tart and cha chaan teng development", note: "Independent editorial cross-check for egg tarts in Hong Kong bakery and tea-café culture; no restaurant formula is reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "The Sweet Science of Flan", publisher: "Exploratorium Science of Cooking", url: "https://annex.exploratorium.edu/cooking/eggs/flan-pop.html", locator: "Egg proteins and gentle custard setting", note: "Independent food-science cross-check for gentle custard setting; no recipe prose is reused.", type: "educational-institution", uses: ["preparation"] },
      { title: "Shell Eggs from Farm to Table", publisher: "USDA Food Safety and Inspection Service", url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/eggs/shell-eggs-farm-table", locator: "Egg dishes temperature guidance", note: "Government guidance used only for the 71°C/160°F egg-dish completion boundary.", type: "government", reliability: "authoritative-secondary", uses: ["safety"], strength: "strong" },
      { title: "Hong Kong Egg Tarts", publisher: "The Woks of Life", authorNames: ["Kaitlin Leung"], url: "https://thewoksoflife.com/hong-kong-egg-tarts/", locator: "Written pastry, custard, and baking instructions", note: "Authored written recipe used to cross-check chilled pastry handling, strained custard, filling level, staged oven heat, and set-but-tender cues; quantities, wording, and arrangement are not copied.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation"] },
      { title: "Egg Tarts 蛋撻", publisher: "The Hong Kong Cookery", authorNames: ["Ellen L."], url: "https://www.thehongkongcookery.com/2016/01/chinese-egg-tarts.html", locator: "Written ingredients and directions", note: "Authored written recipe used to cross-check shell preparation, a strained egg custard, controlled filling, and baking until the custard is set; source expression and exact formula are not reused.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation", "culture"] },
    ],
    storyEvidenceIndexes: [0, 1, 2, 3],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "金黄酥皮蛋挞，蛋奶馅表面平整并带浅焦色边缘",
    preparation: {
      kind: "baking", time: { prepMinutes: 35, processMinutes: 30, totalMinutes: 65, activeMinutes: 40 }, yield: { amount: 8, unit: "piece" },
      inputs: [input("wheat-flour", 180), input("butter", 100), input("drinking-water", 35, "ml"), input("egg", 3, "piece"), input("milk", 220, "ml"), input("granulated-sugar", 65)],
      toolIds: ["mixing-bowl", "rolling-pin", "tart-tin", "oven", "fine-strainer", "instant-read-thermometer"],
      steps: [
        bilingualStep(1, { instruction: "面粉与冷黄油快速搓成粗粒，加入 35 毫升冷水压成团，冷藏 20 分钟后擀开并铺入挞模。", rationale: "定量加水并保持黄油低温，可避免面团过湿出油并保留酥松层次。", stateCue: "面团刚好能聚拢，仍可见细小黄油纹理且没有游离水。" }, { instruction: "Rub cold butter into flour to coarse crumbs, add 35 ml cold water to bind, chill 20 minutes, then roll and line the tart tins.", rationale: "Measured water and cold butter prevent a wet greasy dough while preserving a crisp texture.", stateCue: "The dough just holds together with small butter streaks and no free water." }, 30),
        bilingualStep(2, { instruction: "鸡蛋、牛奶和糖轻轻混合至糖溶解，过筛后静置去泡。", rationale: "避免打入过多空气可让蛋奶馅烤后更平整。", stateCue: "液体均匀，表面几乎没有泡沫。" }, { instruction: "Stir eggs, milk, and sugar gently until dissolved, strain, and rest to release bubbles.", rationale: "Minimal aeration gives the baked custard a smoother surface.", stateCue: "The mixture is even with almost no foam." }, 10),
        bilingualStep(3, { instruction: "挞壳注入八分满蛋奶液，220°C 烤 10 分钟，再降至 180°C 烤 12 至 15 分钟；中心达到 71°C 且无流动蛋液后出炉。", rationale: "先高温建立挞壳结构，再降温让蛋奶馅温和凝固；中心温度避免只凭晃动误判。", stateCue: "挞壳金黄，馅料中心至少 71°C、整体轻颤但没有液体波纹。" }, { instruction: "Fill shells about four-fifths full; bake at 220°C for 10 minutes, then at 180°C for 12–15 minutes, until the center reaches 71°C with no liquid egg.", rationale: "Initial high heat sets the shell before gentler heat finishes the custard; center temperature prevents relying on wobble alone.", stateCue: "The pastry is golden and the custard center is at least 71°C, jiggling as one piece without a liquid ripple." }, 25),
      ],
    },
  },
  {
    id: "black-sesame-soup", itemType: "dessert", zhName: "黑芝麻糊", enName: "Black Sesame Sweet Soup",
    zhDescription: "炒香黑芝麻磨成细浆，以米粉温和增稠成流动顺滑的中式甜汤。",
    enDescription: "Toasted black sesame blended fine and gently thickened with rice flour into a flowing, smooth Chinese sweet soup.",
    countryId: "china", regionId: "guangdong", cuisineId: "cantonese", techniqueIds: ["simmer"], formIds: ["sweet-soup"], dietaryTagIds: ["vegan"],
    tastes: { sweet: 2, bitter: 1 }, aromaIds: ["roasted", "toasty"], textureIds: ["silky", "creamy"], characterIds: ["warming", "comforting"],
    servingContextIds: ["after-meal", "afternoon-tea"], weight: "medium", temperature: "hot", storyType: "ingredient-agriculture-trade",
    claimZh: "本条目把黑芝麻糊作为芝麻与米粉构成的中式甜汤记录，营养数值仅为配料估算，不作保健功效主张。",
    claimEn: "This entry records black sesame soup as a Chinese sweet soup of sesame and rice flour; nutrition is an ingredient estimate and carries no health claim.",
    sources: [
      { title: "Black Sesame Soup", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Black_sesame_soup", locator: "Chinese sweet-soup identity and sesame-rice preparation overview", note: "Direct general reference for the bounded dessert identity; no source wording, structure, or health claim is reused.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture", "preparation"] },
      { title: "Sesame", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/plant/sesame-plant", locator: "Seed identity and culinary use", note: "Independent factual cross-check for sesame as the defining seed ingredient, not for health effects.", type: "publisher", uses: ["identity"] },
      { title: "Black Sesame Soup (黑芝麻糊)", publisher: "Omnivore's Cookbook", authorNames: ["Maggie Zhu", "Lilja Walter"], url: "https://omnivorescookbook.com/black-sesame-soup/", locator: "Cooking process, recipe instructions, and rice-flour substitution note", note: "Authored written recipe used to cross-check toasted sesame, fine blending, continuous stirring, cold-slurried rice flour, sugar, and texture adjustment; its glutinous-rice formula and any health claims are excluded.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation"] },
      { title: "Chinese Black Sesame Soup (or Paste)", publisher: "Curious Cuisiniere", authorNames: ["Michelle Wong"], url: "https://www.curiouscuisiniere.com/black-sesame-soup-paste/", locator: "Rice Flour vs Glutinous Rice Flour and recipe instructions", note: "Authored written recipe used to cross-check avoiding an oily sesame paste, low-heat thickening, continuous stirring, sugar addition, and water adjustment; health claims and exact flour equivalence are excluded.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation"] },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "白色甜汤碗中的深黑芝麻糊抽象插画，碗旁点缀黑芝麻粒",
    preparation: {
      kind: "cooking", time: { prepMinutes: 12, processMinutes: 18, totalMinutes: 30, activeMinutes: 30 }, yield: { amount: 4, unit: "serving" },
      inputs: [input("black-sesame", 120), input("rice-flour", 35), input("granulated-sugar", 55), input("drinking-water", 850, "ml")],
      toolIds: ["frying-pan", "blender", "saucepan", "whisk"],
      steps: [
        bilingualStep(1, { instruction: "黑芝麻小火干炒 3 至 4 分钟，闻到坚果香即离火摊凉。", rationale: "小火和及时离锅可释放香气而避免油脂焦苦。", stateCue: "芝麻香明显，但没有烟或焦黑颗粒。" }, { instruction: "Dry-toast black sesame over low heat for 3–4 minutes, then spread out to cool as soon as it smells nutty.", rationale: "Low heat and prompt cooling develop aroma without burning the seed oils.", stateCue: "The sesame smells nutty with no smoke or charred specks." }, 5),
        bilingualStep(2, { instruction: "芝麻与 500 毫升水搅打至细，倒入锅中；米粉用余下冷水调成无颗粒浆。", rationale: "先用冷水分散米粉可防止入锅后结团。", stateCue: "芝麻浆均匀，米浆没有干粉块。" }, { instruction: "Blend sesame with 500 ml water until fine and pour into a saucepan; whisk rice flour with the remaining cold water until smooth.", rationale: "Dispersing rice flour in cold water prevents lumps.", stateCue: "The sesame liquid is even and the rice slurry has no dry pockets." }, 8),
        bilingualStep(3, { instruction: "芝麻浆小火煮热，边搅边倒入米浆和糖，继续煮至能薄薄挂勺。", rationale: "持续搅拌和温和加热让淀粉均匀糊化，不沉底焦结。", stateCue: "糊体流动顺滑，勺背留下一层薄膜。" }, { instruction: "Heat the sesame liquid gently; whisk in the rice slurry and sugar, then cook until it lightly coats a spoon.", rationale: "Continuous stirring and gentle heat gelatinize the starch evenly without scorching.", stateCue: "The soup flows smoothly and leaves a thin film on the spoon." }, 12),
      ],
    },
  },
  {
    id: "matcha-usucha", itemType: "tea", zhName: "薄茶 Matcha Usucha", enName: "Matcha Usucha",
    zhDescription: "以抹茶粉和热水打出细泡的薄茶，重点是过筛、控制水温并在短时间内均匀分散。",
    enDescription: "Thin matcha whisked from sifted powder and hot water, emphasizing temperature control and quick, even dispersion.",
    countryId: "japan", cuisineId: "japanese", techniqueIds: [], formIds: ["powdered-green-tea"], dietaryTagIds: ["vegan"],
    tastes: { bitter: 2, umami: 2, sweet: 1 }, aromaIds: ["herbal"], textureIds: ["creamy"], characterIds: ["clean-tasting"],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "light", temperature: "warm", storyType: "technique",
    claimZh: "薄茶使用粉末茶直接分散在水中；本条目的剂量和水温是 Cooking Lab 的可重复基线，不代表茶道流派认证。",
    claimEn: "Usucha disperses powdered tea directly in water; this entry’s dose and temperature are a repeatable Cooking Lab baseline, not certification by a tea school.",
    sources: [
      { title: "Matcha", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Matcha", locator: "Powdered-tea identity and preparation overview", note: "Independent general reference for matcha identity; no source wording is reused.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "preparation"] },
      { title: "Matcha", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/topic/matcha", locator: "Powdered green tea", note: "Independent general reference for matcha identity.", type: "publisher", uses: ["identity"] },
      { title: "Chanoyu Experience", publisher: "Urasenke Konnichian", url: "https://www.urasenke.or.jp/archives/texte/organ/konnichian/gallery/lesson.html", locator: "Usucha as whisked matcha of relatively thin consistency", note: "Official tea-school page used only to distinguish usucha as relatively thin whisked matcha; the household dose, temperature, and whisking routine are Cooking Lab editorial choices.", type: "professional-organization", reliability: "primary", uses: ["identity", "culture"] },
      { title: "Basic Usucha (Matcha)", publisher: "Ippodo Tea Global", url: "https://global.ippodo-tea.co.jp/blogs/tea-recipe/basic-usucha-matcha", locator: "Ingredients and written preparation steps", note: "Producer-authored written guide used to cross-check a 2 g dose, about 80°C water, sifting, and brief whisking; no wording, imagery, or school certification is reused.", type: "producer-documentation", reliability: "primary", uses: ["preparation"] },
      { title: "Preparation of Matcha", publisher: "Marukyu Koyamaen Co., Ltd.", url: "https://www.marukyu-koyamaen.co.jp/english/about-tea/enjoy-matcha.html", locator: "Usucha preparation", note: "Producer-authored written guide used to cross-check warming and drying the bowl, sifting, a 70–85°C range, quick back-and-forth whisking, and fine foam; no wording or imagery is reused.", type: "producer-documentation", reliability: "primary", uses: ["preparation"] },
    ],
    storyEvidenceIndexes: [0, 1, 2],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "茶碗中带细密泡沫的鲜绿色薄茶，旁边放有竹茶筅",
    preparation: {
      kind: "brewing", time: { prepMinutes: 3, processMinutes: 3, totalMinutes: 6, activeMinutes: 6 }, yield: { amount: 1, unit: "serving" },
      inputs: [input("matcha-powder", 2), input("drinking-water", 70, "ml")], toolIds: ["kettle", "tea-bowl", "fine-sieve", "bamboo-whisk"],
      steps: [
        bilingualStep(1, { instruction: "茶碗温热后擦干，抹茶粉过筛入碗；水烧开后降至约 80°C。", rationale: "过筛减少粉团，适度降温可避免苦涩过强。", stateCue: "粉末蓬松无结块，水不再翻滚。" }, { instruction: "Warm and dry the bowl, sift in the matcha, and let boiled water cool to about 80°C.", rationale: "Sifting limits clumps, while moderate water temperature avoids excessive bitterness.", stateCue: "The powder is loose and lump-free; the water is no longer boiling." }, 3),
        bilingualStep(2, { instruction: "加入全部热水，先轻轻调开至没有干粉，再以茶筅快速前后打约 20 秒。", rationale: "先让粉末充分润湿，再用短促前后动作，可减少结团并形成均匀细泡。", stateCue: "茶汤表面覆盖细泡，没有明显粉团。" }, { instruction: "Add all the hot water, mix gently until no dry powder remains, then whisk briskly back and forth for about 20 seconds.", rationale: "Fully wetting the powder before short back-and-forth strokes limits clumps and builds fine, even foam.", stateCue: "Fine foam covers the surface with no visible clumps." }, 2),
      ],
    },
  },
  {
    id: "tieguanyin-gongfu", itemType: "tea", zhName: "铁观音工夫泡", enName: "Tieguanyin Gongfu Brew",
    zhDescription: "以小壶高叶水比短时多泡，观察铁观音叶片舒展与每泡香气、涩度变化。",
    enDescription: "A small-vessel, high-leaf-ratio gongfu brew that tracks leaf opening and changes in aroma and astringency across infusions.",
    countryId: "china", regionId: "fujian", cuisineId: "chinese", techniqueIds: [], formIds: ["oolong-tea"], dietaryTagIds: ["vegan"],
    tastes: { bitter: 1, sweet: 1 }, aromaIds: ["floral", "toasty"], textureIds: ["silky"], characterIds: ["clean-tasting"],
    servingContextIds: ["afternoon-tea", "social-gathering"], weight: "light", temperature: "hot", storyType: "place-food-culture",
    claimZh: "铁观音与福建安溪的乌龙茶生产语境相关；本条目只给家庭冲泡基线，不对产区等级或具体商品作认证。",
    claimEn: "Tieguanyin is associated with Anxi’s oolong-producing context in Fujian; this entry gives a household brewing baseline and certifies neither grade nor product.",
    sources: [
      { title: "Anxi Tieguanyin Tea Culture System", publisher: "Food and Agriculture Organization of the United Nations", url: "https://www.fao.org/giahs/around-the-world/detail/china-anxi/en", locator: "Anxi, Fujian origin and Tieguanyin tea-culture system", note: "Official agricultural-heritage source for the bounded Anxi and Tieguanyin identity.", type: "official-cultural-institution", reliability: "primary", uses: ["culture", "identity"] },
      { title: "The Perfect Brew", publisher: "UK Tea & Infusions Association", url: "https://www.tea.co.uk/make-a-perfect-brew", locator: "Water and infusion controls", note: "Independent preparation reference for water and infusion variables.", type: "professional-organization", uses: ["preparation"] },
      { title: "Gongfu Tea", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Gongfu_tea", locator: "Small-vessel preparation and repeated short infusions", note: "General secondary cross-check for the small-vessel repeated-infusion identity; no ceremonial wording or sequence is copied.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "preparation", "culture"] },
    ],
    storyEvidenceIndexes: [0, 1, 2],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "白瓷盖碗、茶海、小杯和舒展茶叶组成的铁观音抽象冲泡场景",
    preparation: {
      kind: "brewing", time: { prepMinutes: 3, processMinutes: 8, totalMinutes: 11, activeMinutes: 11 }, yield: { amount: 4, unit: "serving" },
      inputs: [input("tieguanyin-tea-leaf", 8), input("drinking-water", 650, "ml")], toolIds: ["kettle", "gaiwan", "tea-pitcher", "timer"],
      steps: [
        bilingualStep(1, { instruction: "用热水温盖碗和茶海后倒净，投入茶叶；水降至约 95°C。", rationale: "预热减少冲泡时温降，略低于沸腾便于控制涩度。", stateCue: "器具温热，卷曲茶叶保持干燥香气。" }, { instruction: "Warm the gaiwan and pitcher, drain, add the leaves, and let the water settle near 95°C.", rationale: "Preheating limits heat loss; slightly sub-boiling water helps control astringency.", stateCue: "The vessels are warm and the rolled leaves remain aromatic." }, 3),
        bilingualStep(2, { instruction: "每泡注入约 120 毫升热水，加盖 25 秒后完全分入茶海；后续三泡各增加约 5 至 10 秒。", rationale: "8 克茶配 120 毫升水形成明确的小壶高叶水比，完全出汤避免壶内继续萃取。", stateCue: "首泡金黄清亮，四泡约用 480 毫升水，余量足以预热器具，叶片逐渐展开。" }, { instruction: "Use about 120 ml hot water per infusion, cover for 25 seconds, and decant completely; add roughly 5–10 seconds for each of the next three infusions.", rationale: "Eight grams of leaf in 120 ml defines the intended small-vessel high ratio, while full decanting stops carry-over extraction.", stateCue: "The first liquor is clear gold; four infusions use about 480 ml, leaving enough water to preheat the vessels, and the leaves open progressively." }, 8),
      ],
    },
  },
  {
    id: "darjeeling-first-flush-profile", itemType: "tea", zhName: "大吉岭春摘茶产区档案", enName: "Darjeeling First Flush Regional Profile",
    zhDescription: "2026-09 v1 非品牌产区档案：限定于“大吉岭春摘”身份、季节与冲泡核验，不代表具体茶园、批次或背书。",
    enDescription: "2026-09 v1 non-brand regional profile, bounded to Darjeeling first-flush identity, season, and brewing checks; it represents no estate, lot, or endorsement.",
    countryId: "india", cuisineId: "indian", techniqueIds: [], formIds: ["black-tea-profile"], dietaryTagIds: ["vegan"],
    tastes: {}, aromaIds: [], textureIds: [], characterIds: [],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "light", temperature: "hot", storyType: "place-food-culture",
    claimZh: "本档案把 first flush 限定为大吉岭年度较早采摘季的类别说明，不替任何品牌、茶园、年份或等级作质量背书。",
    claimEn: "This profile limits “first flush” to an early-season Darjeeling category and makes no quality endorsement for any brand, estate, vintage, or grade.",
    sources: [
      { title: "Darjeeling Tea", publisher: "Tea Board India", url: "https://www.teaboard.gov.in/TEABOARDCSM/NQ==", locator: "Darjeeling geographical indication", note: "Official producer-region and GI context.", type: "government", reliability: "primary", uses: ["identity", "culture"], strength: "strong" },
      { title: "How Climate Change Is Threatening the Flavour — and Future — of India's Prized Darjeeling Tea", publisher: "CBC News", authorNames: ["Salimah Shivji"], url: "https://www.cbc.ca/news/world/darjeeling-tea-india-drought-rain-climate-change-9.7152129", locator: "Late-February and early-March first-flush harvest and Darjeeling growing context", note: "Authored reporting independently supports first flush as the early harvest; tasting adjectives and marketing language are not reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Mastering the Art of Brewing the Perfect Cup of First Flush Darjeeling Tea", publisher: "Golden Tips Tea", authorNames: ["Marketing Golden Tips Teas"], url: "https://www.goldentipstea.com/blogs/all/brewing-first-flush-darjeeling-tea", locator: "First-flush brewing parameters", note: "Commercial tea-publisher guide used to cross-check 80°C water, 3–4 minutes, complete decanting, and a 2–3 g per 240 ml range; tasting and quality marketing are excluded.", type: "producer-documentation", reliability: "general-secondary", uses: ["preparation"] },
      { title: "Darjeeling Tea: Perfect Brew Temperature?", publisher: "Valley of Tea", authorNames: ["Wouter Gryson"], url: "https://www.valleyoftea.com/en-us/blogs/tea/darjeeling-tea-perfect-brew-temperature", locator: "First-flush temperature, time, and dose guidance", note: "Authored tea-publisher guide used to cross-check 80–85°C, about 3 minutes, and label- or leaf-specific adjustment; sensory marketing is excluded.", type: "publisher", reliability: "general-secondary", uses: ["preparation"] },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "not-modeled" },
    alt: "无品牌白色带柄茶具、浅金茶汤和展开茶叶组成的大吉岭春摘档案插画",
    preparation: { kind: "serving-guidance", estimatedMinutes: 5, toolIds: ["kettle", "teapot", "timer"], content: bilingual(
      { guidance: "档案基线：每 250 毫升水用 3 克散茶，以 80–85°C 浸泡 3 分钟后完全出汤；具体茶叶标签优先。本页不展示品牌包装、营销 tasting notes 或购买建议。" },
      { guidance: "Profile baseline: use 3 g loose leaf per 250 ml water, steep at 80–85°C for 3 minutes, and decant fully; defer to the specific tea label. This page shows no brand packaging, marketing tasting notes, or buying advice." },
    ) },
  },
  {
    id: "v60-pour-over", itemType: "coffee", zhName: "V60 手冲咖啡", enName: "V60 Pour-over Coffee",
    zhDescription: "以锥形滤杯、稳定粉水比和分段注水建立可重复的清晰手冲基线。",
    enDescription: "A repeatable cone-filter pour-over baseline using a fixed coffee-to-water ratio and staged pouring for clarity.",
    countryId: "japan", cuisineId: "japanese", techniqueIds: [], formIds: ["pour-over-coffee"], dietaryTagIds: ["vegan"],
    tastes: { bitter: 2, sour: 2, sweet: 1 }, aromaIds: ["roasted", "fruity"], textureIds: ["silky"], characterIds: ["clean-tasting"],
    servingContextIds: ["breakfast", "afternoon-tea"], weight: "light", temperature: "hot", storyType: "technique",
    claimZh: "V60 条目只记录锥形滤杯手冲的可重复变量，不复制器具品牌说明，也不暗示制造商合作。",
    claimEn: "This V60 entry records repeatable cone-filter brewing variables without copying branded instructions or implying manufacturer collaboration.",
    sources: [
      { title: "V60 Series", publisher: "HARIO CO., LTD.", url: "https://global.hario.com/v60/v60series.html", locator: "Cone dripper identity, design, and written brewing sequence", note: "Producer documentation used for factual dripper identity and written steps such as rinsing, leveling, blooming, staged pouring, and an approximate three-minute target; branded wording and imagery are not reused.", type: "producer-documentation", reliability: "primary", uses: ["identity", "preparation"] },
      { title: "Pour-over Coffee", publisher: "National Coffee Association USA", url: "https://www.aboutcoffee.org/brewing/pour-over-coffee/", locator: "Pour-over equipment, ratio, temperature, grind, bloom, and contact-time guidance", note: "Independent professional brewing guidance used for general variables rather than a branded V60 sequence.", type: "professional-organization", uses: ["preparation"] },
      { title: "Quick + Easy Hario V60", publisher: "Counter Culture Coffee", authorNames: ["Ryan"], url: "https://counterculturecoffee.com/pages/quick-easy-v60", locator: "Written dose, temperature, bloom, staged-pour, and drawdown guidance", note: "Authored written guide used to cross-check 30 g coffee, 500 g water, about 93°C, a 60 g bloom, and staged pouring; the embedded video is not viewed or cited and source expression is not reused.", type: "publisher", reliability: "general-secondary", uses: ["preparation"] },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "锥形滤杯、玻璃分享壶与咖啡豆构成的无品牌手冲场景",
    preparation: {
      kind: "brewing", time: { prepMinutes: 4, processMinutes: 4, totalMinutes: 8, activeMinutes: 8 }, yield: { amount: 2, unit: "serving" },
      inputs: [input("ground-coffee", 30), input("drinking-water", 500, "ml")], toolIds: ["v60-dripper", "paper-filter", "kettle", "scale", "timer"],
      steps: [
        bilingualStep(1, { instruction: "滤纸润湿并倒掉冲洗水；加入中细研磨咖啡粉，轻晃铺平。", rationale: "润纸减少纸味并预热器具，平整粉床有助于均匀浸润。", stateCue: "滤纸贴合，粉床水平无明显凹坑。" }, { instruction: "Rinse the filter and discard the water; add medium-fine coffee and level the bed gently.", rationale: "Rinsing reduces paper taste and preheats the brewer; a level bed wets more evenly.", stateCue: "The filter is seated and the coffee bed is level." }, 3),
        bilingualStep(2, { instruction: "用约 60 克 93°C 水均匀润湿咖啡粉，等待 40 秒，再分两至三次注至 500 克。", rationale: "先闷蒸排气，再分段维持稳定液位，便于观察流速。", stateCue: "粉床整体湿润，最终总滴滤时间约 3 分钟。" }, { instruction: "Wet evenly with about 60 g water at 93°C, wait 40 seconds, then pour in two or three stages to 500 g total.", rationale: "Blooming releases gas; staged pouring maintains a controllable slurry level.", stateCue: "The bed is evenly wet and total drawdown is about 3 minutes." }, 4),
      ],
    },
  },
  {
    id: "flat-white", itemType: "coffee", zhName: "Flat White 澳白", enName: "Flat White",
    zhDescription: "双份浓缩与细腻薄层微泡牛奶组成的小杯奶咖，强调咖啡存在感和均匀口感。",
    enDescription: "A compact milk coffee combining a double espresso with a thin layer of fine microfoam, keeping coffee character present.",
    originAreaId: "trans-tasman", cuisineId: "fusion", techniqueIds: [], formIds: ["milk-espresso"], dietaryTagIds: ["vegetarian"],
    tastes: { bitter: 2, sweet: 2 }, aromaIds: ["roasted"], textureIds: ["creamy", "silky"], characterIds: ["comforting"],
    servingContextIds: ["breakfast", "afternoon-tea"], weight: "medium", temperature: "hot", storyType: "historical-development",
    claimZh: "Flat white 通常与澳大利亚和新西兰咖啡文化共同关联；本条目不主张单一发明者或唯一比例。",
    claimEn: "Flat white is commonly associated with both Australian and New Zealand coffee cultures; this entry claims neither a sole inventor nor one exclusive ratio.",
    sources: [
      { title: "Flat White", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Flat_white", locator: "Australia and New Zealand origin accounts", note: "General context for the disputed trans-Tasman history without selecting a sole inventor.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Who Invented the Flat White?", publisher: "Australian Geographic", url: "https://www.australiangeographic.com.au/news/2024/04/who-invented-the-flat-white/", locator: "Competing Australian and New Zealand origin accounts", note: "Authored independent reporting used to preserve rather than resolve the trans-Tasman dispute; no prose is reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "How to Steam Milk", publisher: "Origin Coffee", url: "https://www.origincoffee.co.uk/blogs/journal/how-to-steam-milk", locator: "Microfoam texture and milk-temperature guidance", note: "Authored professional preparation reference used only for general milk-texturing variables; no source wording or branded routine is copied.", type: "publisher", reliability: "general-secondary", uses: ["preparation"] },
      { title: "How to Make a Flat White Coffee", publisher: "Lavazza", authorNames: ["Lavazza Team"], url: "https://www.lavazzausa.com/en/recipes-and-coffee-hacks/how-to-make-flat-white-coffee", locator: "Ingredients and written method", note: "Producer-authored written recipe used to cross-check an 18 g double espresso, about 140 ml milk, a thin microfoam layer, and pouring order; branded prose and the source's different espresso yield are not reused.", type: "producer-documentation", reliability: "general-secondary", uses: ["identity", "preparation"] },
      { title: "Espresso Brew Guide", publisher: "Origin Coffee", url: "https://www.origincoffee.co.uk/blogs/journal/brewing-at-home-espresso", locator: "18 g dose, 36 g yield, 1:2 ratio, and temperature guidance", note: "Authored written guide used to cross-check the 18 g to 36 g espresso baseline; no branded routine or source wording is copied.", type: "publisher", reliability: "general-secondary", uses: ["preparation"] },
    ],
    storyEvidenceIndexes: [0, 1, 2],
    storyKind: "disputed-attribution",
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "矮宽陶瓷杯中的 flat white 抽象插画，棕色咖啡表面有薄层白色微泡曲线",
    preparation: {
      kind: "extraction", time: { prepMinutes: 4, processMinutes: 4, totalMinutes: 8, activeMinutes: 8 }, yield: { amount: 1, unit: "serving" },
      inputs: [input("ground-coffee", 18), input("drinking-water", 40, "ml"), input("milk", 130, "ml")], toolIds: ["espresso-machine", "portafilter", "milk-pitcher", "scale"],
      steps: [
        bilingualStep(1, { instruction: "以 18 克咖啡粉萃取约 36 克双份浓缩，搅匀后保温。", rationale: "固定粉量和液重建立可复查基线，味道异常时优先调整研磨。", stateCue: "咖啡流连续，没有喷溅，杯中液重接近目标。" }, { instruction: "Extract about 36 g espresso from 18 g coffee, stir, and keep warm.", rationale: "A fixed dose and yield create a reviewable baseline; grind is the first adjustment when flavor is off.", stateCue: "The flow is continuous without spraying and the beverage mass is near target." }, 3),
        bilingualStep(2, { instruction: "牛奶蒸至约 60–65°C，开始阶段引入少量空气，随后让奶液旋转至泡沫细密有光泽；立即倒入浓缩。", rationale: "少量充气形成薄微泡层，持续旋转把大泡打碎并均匀质地。", stateCue: "奶液像湿润油漆般流动，表面无明显大泡。" }, { instruction: "Steam milk to about 60–65°C, adding little air at first and then rolling until glossy; pour immediately into the espresso.", rationale: "Limited aeration creates a thin microfoam layer, while rolling integrates texture and breaks large bubbles.", stateCue: "The milk flows like wet paint with no obvious large bubbles." }, 4),
      ],
    },
  },
  {
    id: "ethiopia-yirgacheffe-washed-profile", itemType: "coffee", zhName: "埃塞俄比亚耶加雪菲水洗咖啡产区档案", enName: "Ethiopia Yirgacheffe Washed Coffee Regional Profile",
    zhDescription: "2026-09 v1 非品牌产区档案：只说明耶加雪菲与水洗处理的核验边界，不代表庄园、批次、烘焙商或杯测分数。",
    enDescription: "2026-09 v1 non-brand regional profile, bounded to Yirgacheffe and washed processing; it represents no estate, lot, roaster, or cupping score.",
    countryId: "ethiopia", cuisineId: "ethiopian", techniqueIds: [], formIds: ["coffee-profile"], dietaryTagIds: ["vegan"],
    tastes: {}, aromaIds: [], textureIds: [], characterIds: [],
    servingContextIds: ["breakfast", "afternoon-tea"], weight: "light", temperature: "hot", storyType: "place-food-culture",
    claimZh: "本档案把耶加雪菲水洗咖啡限定为产区与处理法的事实组合，不复述商品 tasting notes，也不暗示生产者背书。",
    claimEn: "This profile limits washed Yirgacheffe coffee to a factual region-and-process combination, without reproducing product tasting notes or implying producer endorsement.",
    sources: [
      { title: "REgrow Yirga Revives One of the World’s Most Celebrated Coffee Origins: Yirgacheffe in Southern Ethiopia", publisher: "TechnoServe", url: "https://www.technoserve.org/fight-poverty/projects/enhancing-market-efficiency-and-resilience-for-growing-ethiopias-new-coffee-economy/", locator: "Yirgacheffe in southern Ethiopia and the REgrow Yirga project context", note: "Independent development-program source used only for the regional identity; project claims and promotional language are not reused.", type: "professional-organization", uses: ["identity", "culture"] },
      { title: "Coffee Production", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Coffee_production", locator: "Wet-process depulping, fermentation, washing, and drying stages", note: "Independent general reference for the bounded washed-process identity; no process wording or tasting-note language is reused.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "preparation"] },
      { title: "A Guide to Ethiopian Yirgacheffe Coffee", publisher: "Ue Coffee Roasters", url: "https://www.uecoffeeroasters.com/blogs/articles/ethiopian-yirgacheffe-coffee", locator: "Written washed-Yirgacheffe identity and V60 recipe", note: "Written roaster guide used to cross-check the washed Yirgacheffe combination and a 15 g to 250 g pour-over baseline, 92–96°C water, bloom, and about three minutes; embedded video, tasting notes, marketing, and quality claims are excluded.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation"] },
      { title: "Pour-over Coffee", publisher: "National Coffee Association USA", url: "https://www.aboutcoffee.org/brewing/pour-over-coffee/", locator: "Temperature, bloom, staged-pour, and contact-time guidance", note: "Independent professional guidance used to cross-check the general pour-over method, temperature, and duration; it does not establish Yirgacheffe identity or product quality.", type: "professional-organization", reliability: "authoritative-secondary", uses: ["preparation"] },
    ],
    storyEvidenceIndexes: [0, 1, 2],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "not-modeled" },
    alt: "无品牌带柄咖啡分享壶、咖啡豆与花朵构成的耶加雪菲产区档案插画",
    preparation: { kind: "serving-guidance", estimatedMinutes: 6, toolIds: ["pour-over-dripper", "kettle", "scale"], content: bilingual(
      { guidance: "档案基线：先按烘焙商标签冲泡；无标签时可从 15 克咖啡、250 克水、92°C 和约 3 分钟开始。档案不刊载商品 tasting notes、杯测分数、包装或购买链接。" },
      { guidance: "Profile baseline: follow the roaster label first; if absent, start with 15 g coffee, 250 g water at 92°C, and about 3 minutes. The profile publishes no product tasting notes, cupping scores, packaging, or purchase links." },
    ) },
  },
  {
    id: "cha-chaan-teng-lemon-coke", itemType: "non-alcoholic-drink", zhName: "茶餐厅冻柠乐", enName: "Cha Chaan Teng Iced Lemon Cola",
    zhDescription: "冰镇可乐与柠檬组成的茶餐厅日常冷饮；本条目只记录身份与克制服务建议，不推测店铺操作。",
    enDescription: "A cha chaan teng everyday cold drink of chilled cola and lemon; this entry records its identity and restrained serving guidance without inferring shop technique.",
    countryId: "china", cuisineId: "cantonese", techniqueIds: [], formIds: ["lemon-cola"], dietaryTagIds: ["vegan"],
    tastes: { sweet: 3, sour: 2, bitter: 1 }, aromaIds: ["citrusy"], textureIds: [], characterIds: ["refreshing"],
    servingContextIds: ["lunch", "social-gathering"], weight: "light", temperature: "cold", storyType: "everyday-life-festival",
    claimZh: "冻柠乐在本条目中作为香港茶餐厅日常饮品语境记录，不使用可乐商标、包装图或品牌配方。",
    claimEn: "This entry records iced lemon cola in Hong Kong cha chaan teng everyday-drink context without using cola trademarks, packaging, or branded formulas.",
    sources: [
      { title: "Vocabulary: Drinks in Cha Chaan Teng", publisher: "Open Cantonese", url: "https://opencantonese.org/books/cantonese-life-1/unit-6/lesson-29/29-8-vocabulary-drinks-in-cha-chaan-teng", locator: "Drink list: iced marker, lemon cola, and contracted Cantonese name 檸樂", note: "Direct educational source for lemon cola as a cha chaan teng drink name; linked audio and video are not used.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Why Are Cha Chaan Teng Staff So Testy?", publisher: "South China Morning Post", url: "https://www.scmp.com/magazines/hk-magazine/article/2037396/why-are-cha-chaan-teng-staff-so-testy", locator: "Cha chaan teng ordering language: 06 as lemon Coke", note: "Authored reporting independently supports lemon cola in tea-café ordering culture; no dialogue, menu text, or branded formula is reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
    ],
    nutrition: { applicability: "not-modeled", reason: "insufficient-data" }, cost: { source: "not-modeled" },
    alt: "透明高杯中的冰镇柠檬可乐，有新鲜柠檬片和细密气泡，无品牌标识",
    preparation: { kind: "serving-guidance", estimatedMinutes: 2, toolIds: ["highball-glass"], content: bilingual(
      { guidance: "使用无品牌展示的冰镇可乐，按产品标签倒入有冰和新鲜柠檬的杯中即可；Cooking Lab 不提供压柠檬、搅拌次数或茶餐厅店铺操作等未经可靠双来源支持的步骤。" },
      { guidance: "Use chilled cola without branded presentation and serve it over ice with fresh lemon, following the product label. Cooking Lab does not prescribe lemon pressing, stir counts, or inferred cha chaan teng shop technique without two reliable preparation sources." },
    ) },
  },
  {
    id: "kumquat-lemon-tea", itemType: "non-alcoholic-drink", zhName: "金桔柠檬茶", enName: "Kumquat Lemon Tea",
    zhDescription: "金桔与柠檬提供两层柑橘酸香，红茶构成清楚骨架，冷却后再校准甜度。",
    enDescription: "Kumquat and lemon provide layered citrus acidity over a clear black-tea base, with sweetness adjusted after chilling.",
    countryId: "china", cuisineId: "fusion", techniqueIds: [], formIds: ["citrus-tea"], dietaryTagIds: ["vegan"],
    tastes: { sweet: 2, sour: 3, bitter: 1 }, aromaIds: ["citrusy", "fruity"], textureIds: [], characterIds: ["refreshing", "appetizing"],
    servingContextIds: ["lunch", "afternoon-tea"], weight: "light", temperature: "cold", storyType: "ingredient-agriculture-trade",
    claimZh: "本条目只记录金桔、柠檬与茶的现代冷饮组合，不宣称传统疗效或特定品牌来源。",
    claimEn: "This entry records a contemporary cold drink combining kumquat, lemon, and tea, without traditional-health claims or branded origin claims.",
    sources: [
      { title: "Kumquat", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/plant/kumquat", locator: "Fruit identity and edible peel", note: "Independent botanical and culinary context for kumquat.", type: "publisher", uses: ["identity"] },
      { title: "The Perfect Brew", publisher: "UK Tea & Infusions Association", url: "https://www.tea.co.uk/make-a-perfect-brew", locator: "Black tea infusion", note: "Independent preparation reference for black tea brewing.", type: "professional-organization", uses: ["preparation"] },
      { title: "在家自製『金桔檸檬』超簡單", publisher: "愛料理生活誌", url: "https://icook.tw/blogs/229828", locator: "Written citrus preparation and tea-base variation", note: "Written editorial guide used to cross-check washing, halving, and juicing kumquat and lemon, adjustable sweetness, and tea as a base; health claims and any claim of a fixed traditional formula are excluded.", type: "publisher", reliability: "general-secondary", uses: ["preparation"] },
      { title: "熱金桔茶", publisher: "Wonderful Foods Co., Ltd.", url: "https://www.wonderful-foods.com/15/--r442.html", locator: "Ingredients and written method", note: "Commercial ingredient-publisher recipe used only to cross-check a three-minute black-tea infusion, seeded kumquat, and adding kumquat juice and flesh; branded ingredients and marketing are excluded.", type: "producer-documentation", reliability: "general-secondary", uses: ["preparation"] },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "玻璃杯中的金桔柠檬冰茶，有对半金桔、柠檬片和琥珀色茶汤",
    preparation: {
      kind: "brewing", time: { prepMinutes: 8, processMinutes: 12, totalMinutes: 20, activeMinutes: 20 }, yield: { amount: 2, unit: "serving" },
      inputs: [input("black-tea-leaf", 6), input("drinking-water", 500, "ml"), input("kumquat", 6, "piece"), input("lemon", 0.5, "piece"), input("granulated-sugar", 35), input("ice", 200)], toolIds: ["kettle", "teapot", "fine-strainer", "pitcher"],
      steps: [
        bilingualStep(1, { instruction: "红茶以 95°C 热水浸泡 3 分钟后完全滤出，趁热加入糖搅溶；另留出约 50 毫升甜茶底用于最后校准。", rationale: "及时出汤控制涩度，温热茶汤更容易溶糖；先留出明确份量，最后调整时不需要加入未声明糖浆。", stateCue: "茶汤清亮琥珀色，入口有茶味但不强涩，50 毫升甜茶底已单独留出。" }, { instruction: "Steep black tea in 95°C water for 3 minutes, strain fully, dissolve the sugar while warm, and reserve about 50 ml of the sweetened tea for final adjustment.", rationale: "Prompt straining controls astringency, warm tea dissolves sugar efficiently, and a measured reserve avoids adding an undeclared syrup later.", stateCue: "The liquor is clear amber with tea structure but no harsh dryness, and 50 ml of sweetened tea is set aside." }, 5),
        bilingualStep(2, { instruction: "金桔对半去籽，轻压出汁；茶汤降至温凉后加入金桔汁、柠檬汁和果片。", rationale: "茶汤冷却后加入柑橘可保留清新香气并减少果皮苦味。", stateCue: "柑橘香明亮，果皮没有被压碎成泥。" }, { instruction: "Halve and seed kumquats, press gently, then add kumquat juice, lemon juice, and slices after the tea cools.", rationale: "Adding citrus to cooled tea preserves bright aroma and limits peel bitterness.", stateCue: "Citrus aroma is vivid and the peel is not crushed to pulp." }, 7),
        bilingualStep(3, { instruction: "装冰分杯，倒入调好的茶并品尝；酸度过尖时只补少量第一步已调好的甜茶底。", rationale: "低温会改变甜酸感受，保留少量甜茶底最后校准，比加入未声明糖浆更可控。", stateCue: "冷饮酸甜清楚，茶味仍可辨。" }, { instruction: "Divide over ice, taste, and add only a little of the sweetened tea base reserved from step one if the acidity is too sharp.", rationale: "Cold temperature changes sweetness perception; reserving a little sweetened tea for final adjustment is more controlled than adding an undeclared syrup.", stateCue: "Sweetness and acidity are clear while tea remains perceptible." }, 3),
      ],
    },
  },
  {
    id: "hong-kong-iced-lemon-tea", itemType: "non-alcoholic-drink", zhName: "港式冻柠茶", enName: "Hong Kong Iced Lemon Tea",
    zhDescription: "浓红茶、柠檬片与冰块组成的茶餐厅冷饮，以压香而非捣烂果皮控制香气和苦味。",
    enDescription: "A cha chaan teng cold drink of strong black tea, lemon, and ice, expressing rather than pulverizing peel to control aroma and bitterness.",
    countryId: "china", cuisineId: "cantonese", techniqueIds: [], formIds: ["iced-black-tea"], dietaryTagIds: ["vegan"],
    tastes: { sweet: 2, sour: 3, bitter: 2 }, aromaIds: ["citrusy"], textureIds: [], characterIds: ["refreshing", "appetizing"],
    servingContextIds: ["lunch", "afternoon-tea"], weight: "light", temperature: "cold", storyType: "everyday-life-festival",
    claimZh: "港式冻柠茶在本条目中作为茶餐厅日常饮品记录；糖量是可调整基线，不宣称唯一店铺比例。",
    claimEn: "This entry records Hong Kong iced lemon tea as an everyday cha chaan teng drink; sugar is an adjustable baseline, not a unique shop ratio.",
    sources: [
      { title: "Vocabulary: Drinks in Cha Chaan Teng", publisher: "Open Cantonese", url: "https://opencantonese.org/books/cantonese-life-1/unit-6/lesson-29/29-8-vocabulary-drinks-in-cha-chaan-teng", locator: "Drink list: iced marker, lemon tea, and contracted Cantonese name 檸茶", note: "Direct educational source for iced lemon tea in cha chaan teng ordering language; linked audio and video are not used.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Hand-crushed Lemon Tea Takes Off in Hong Kong — We Do Taste Test to Find the Best Version", publisher: "South China Morning Post", url: "https://www.scmp.com/magazines/post-magazine/food-drink/article/3265990/hand-crushed-lemon-tea-takes-hong-kong-we-test-best-version", locator: "Traditional iced lemon tea in Hong Kong cha chaan teng", note: "Authored reporting independently supports the established tea-café drink; tasting rankings, shop language, and preparation expression are not reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "The Perfect Brew", publisher: "UK Tea & Infusions Association", url: "https://www.tea.co.uk/make-a-perfect-brew", locator: "Black-tea water and infusion controls", note: "Independent preparation reference used only for the tea base.", type: "professional-organization", uses: ["preparation"] },
      { title: "Hong Kong Style Iced Lemon Tea 香港凍檸茶", publisher: "The Hong Kong Cookery", authorNames: ["Ellen L."], url: "https://www.thehongkongcookery.com/2014/06/hong-kong-style-iced-lemon-tea.html", locator: "Recipe directions and tip", note: "Authored written recipe used to cross-check strong black tea, dissolving sugar while hot, cooling before ice and lemon, and gently pressing slices; its longer steep and brand preferences are not reused.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation", "culture"] },
      { title: "Hong Kong Lemon Tea 港式檸檬茶", publisher: "Auntie Emily's Kitchen", authorNames: ["Auntie Emily"], url: "https://auntieemily.com/hong-kong-lemon-tea-%E6%B8%AF%E5%BC%8F%E6%AA%B8%E6%AA%AC%E8%8C%B6/", locator: "Recipe ingredients and instructions", note: "Authored written recipe used to cross-check hot black tea, sliced lemon, sweetening, cooling, and ice service; its simmering and longer infusion are not presented as the only method.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation", "culture"] },
    ],
    storyEvidenceIndexes: [0, 1, 2],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "高玻璃杯中的港式冻柠茶，琥珀茶汤内有冰块和多片新鲜柠檬",
    preparation: {
      kind: "brewing", time: { prepMinutes: 6, processMinutes: 10, totalMinutes: 16, activeMinutes: 16 }, yield: { amount: 2, unit: "serving" },
      inputs: [input("black-tea-leaf", 10), input("drinking-water", 500, "ml"), input("lemon", 1, "piece"), input("granulated-sugar", 40), input("ice", 250)], toolIds: ["kettle", "teapot", "fine-strainer", "highball-glass"],
      steps: [
        bilingualStep(1, { instruction: "红茶用 95°C 水浸泡 4 分钟，完全滤出并趁热溶糖。", rationale: "略浓茶底要经得住冰融化，但及时过滤避免持续积累涩味。", stateCue: "茶汤深琥珀色，香气清楚且没有粗涩。" }, { instruction: "Steep black tea in 95°C water for 4 minutes, strain fully, and dissolve sugar while hot.", rationale: "A strong base survives ice dilution, while prompt straining limits coarse astringency.", stateCue: "The liquor is deep amber and aromatic without harsh dryness." }, 6),
        bilingualStep(2, { instruction: "柠檬切薄片去籽，杯中装满冰与柠檬；倒入已降温茶汤后轻压两三片。", rationale: "轻压释放汁液和表皮香气，避免把白瓤捣碎产生强苦味。", stateCue: "杯中仍有完整柠檬片，香气明亮。" }, { instruction: "Thinly slice and seed the lemon; fill glasses with ice and lemon, pour in cooled tea, and press two or three slices lightly.", rationale: "Light pressing releases juice and zest aroma without crushing bitter pith.", stateCue: "Lemon slices remain intact and the aroma is bright." }, 6),
      ],
    },
  },
  {
    id: "yuenyeung", itemType: "non-alcoholic-drink", zhName: "鸳鸯奶茶咖啡", enName: "Yuenyeung Tea-Coffee",
    zhDescription: "红茶、咖啡与牛奶按可调基线混合，既保留茶涩骨架，也保留咖啡烘焙香。",
    enDescription: "Black tea, coffee, and milk combined on an adjustable baseline that keeps both tea structure and roasted coffee character.",
    countryId: "china", cuisineId: "cantonese", techniqueIds: [], formIds: ["tea-coffee-blend"], dietaryTagIds: ["vegetarian"],
    tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted", "toasty"], textureIds: ["creamy"], characterIds: ["comforting"],
    servingContextIds: ["breakfast", "afternoon-tea"], weight: "medium", temperature: "hot", storyType: "everyday-life-festival",
    claimZh: "鸳鸯在本条目中作为香港茶餐厅的茶咖混合饮品记录，不宣称单一创始店铺或专有比例。",
    claimEn: "This entry records yuenyeung as a Hong Kong cha chaan teng tea-and-coffee drink without claiming a sole originating shop or proprietary ratio.",
    sources: [
      { title: "Vocabulary: Drinks in Cha Chaan Teng", publisher: "Open Cantonese", url: "https://opencantonese.org/books/cantonese-life-1/unit-6/lesson-29/29-8-vocabulary-drinks-in-cha-chaan-teng", locator: "Drink list: 鴛鴦 as a milk-tea and coffee mixture", note: "Direct educational source for yuenyeung identity in cha chaan teng ordering language; linked audio and video are not used.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Coffee or tea? Order a yuen yeung – the off-menu, half-half hybrid served at cafes across Hong Kong", publisher: "South China Morning Post", url: "https://www.scmp.com/magazines/style/leisure/article/3052122/coffee-or-tea-order-yuen-yeung-menu-half-half-hybrid-served", locator: "Hong Kong tea-and-coffee identity and competing origin accounts", note: "Authored feature supports the bounded drink identity and disputed attribution; no prose, shop ratio, or branded expression is reused.", type: "reputable-media", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Yuenyeung", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Yuenyeung", locator: "Tea-coffee composition and Hong Kong context", note: "Independent general cross-check for composition and context; no source wording or ratios are reused.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Pour-over Coffee", publisher: "National Coffee Association USA", url: "https://www.aboutcoffee.org/brewing/pour-over-coffee/", locator: "Water, grind, freshness, and filter-brewing variables", note: "Independent professional coffee-preparation cross-check; no source wording or fixed ratio is reused.", type: "professional-organization", uses: ["preparation"] },
      { title: "Yuenyeung (Hong Kong-Style Coffee Milk Tea)", publisher: "SAVEUR", authorNames: ["Megan Zhang"], url: "https://www.saveur.com/drink/hong-kong-coffee-tea/", locator: "Ingredients and written instruction", note: "Authored written recipe used to cross-check separately brewed strong tea and coffee, milk, combining, and hot or iced service; evaporated and condensed milk choices and source ratios are not copied.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation", "culture"] },
      { title: "Yuanyang Tea (Hong Kong Style Tea and Coffee)", publisher: "The Woks of Life", authorNames: ["Kaitlin Leung"], url: "https://thewoksoflife.com/yuanyang-tea-hong-kong/", locator: "Written recipe instructions", note: "Authored written recipe used to cross-check separately preparing strong tea and coffee, combining, sweetening, adding milk, and hot or cold service; conflicting published ratios are treated as evidence of variation rather than a standard.", type: "publisher", reliability: "general-secondary", uses: ["identity", "preparation"] },
    ],
    storyEvidenceIndexes: [0, 1, 2, 3],
    storyKind: "disputed-attribution",
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "无品牌陶瓷杯中的浅棕色鸳鸯奶茶咖啡，表面有细薄奶泡",
    preparation: {
      kind: "brewing", time: { prepMinutes: 5, processMinutes: 10, totalMinutes: 15, activeMinutes: 15 }, yield: { amount: 2, unit: "serving" },
      inputs: [input("black-tea-leaf", 8), input("ground-coffee", 18), input("drinking-water", 500, "ml"), input("milk", 160, "ml"), input("granulated-sugar", 24)], toolIds: ["kettle", "teapot", "coffee-filter", "saucepan"],
      steps: [
        bilingualStep(1, { instruction: "红茶用 300 毫升 95°C 水浸泡 4 分钟并滤出；咖啡用余下热水滤泡。", rationale: "分开萃取便于各自控制强度，避免一种原料等待另一种而过度萃取。", stateCue: "茶汤深琥珀色，咖啡液清楚无大量细粉。" }, { instruction: "Steep tea in 300 ml water at 95°C for 4 minutes and strain; filter-brew the coffee with the remaining hot water.", rationale: "Separate extraction controls each strength and avoids over-extracting one while waiting for the other.", stateCue: "Tea is deep amber and coffee is clear without heavy sediment." }, 7),
        bilingualStep(2, { instruction: "牛奶和糖小火加热至糖溶解，加入全部茶与咖啡；以实际冲出的茶 3、咖啡 2 为基线混合并品尝。", rationale: "先使用声明的基线比例再微调，能保留茶和咖啡的双重存在感。", stateCue: "入口先有奶与茶，随后仍能辨认烘焙咖啡香。" }, { instruction: "Warm milk and sugar gently until dissolved, then add all the brewed tea and coffee at the actual 3:2 baseline before tasting.", rationale: "Starting from the declared baseline and adjusting afterward preserves both tea and coffee presence.", stateCue: "Milk and tea lead, with roasted coffee still distinct afterward." }, 5),
      ],
    },
  },
  {
    id: "rioja-reserva-profile", itemType: "alcoholic-drink", zhName: "里奥哈 Reserva 产区档案", enName: "Rioja Reserva Regional Profile",
    zhDescription: "2026-09 v1 非品牌葡萄酒档案：仅记录 Rioja Reserva 法定陈年类别与克制服务提示，不代表酒庄、年份或购买建议。",
    enDescription: "2026-09 v1 non-brand wine profile bounded to the regulated Rioja Reserva aging category and restrained service guidance; it represents no winery, vintage, or buying advice.",
    countryId: "spain", cuisineId: "spanish", techniqueIds: [], formIds: ["wine-profile"], dietaryTagIds: [],
    tastes: {}, aromaIds: [], textureIds: [], characterIds: [],
    servingContextIds: ["dinner", "social-gathering"], weight: "medium", temperature: "room", storyType: "place-food-culture",
    claimZh: "Rioja Reserva 是受产区规则约束的陈年类别；本档案不为任何酒庄、年份、评分或商品作背书。",
    claimEn: "Rioja Reserva is an aging category governed by regional rules; this profile endorses no winery, vintage, score, or product.",
    sources: [
      { title: "Rioja Wine Classification", publisher: "Consejo Regulador DOCa Rioja", url: "https://riojawine.com/en-gb/the-designation/classification/", locator: "Official Reserva aging classification", note: "Primary designation source for the bounded Reserva category and minimum aging conditions.", type: "professional-organization", reliability: "primary", uses: ["identity", "culture"], strength: "strong" },
      { title: "Rioja (Wine)", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Rioja_(wine)", locator: "Designation and ageing categories", note: "Independent general cross-check for Rioja classification; no tasting-note language is reused.", type: "open-educational-resource", reliability: "general-secondary", uses: ["identity", "culture"] },
      { title: "Ideal Serving Temperatures and Top Tips for Wine Storage", publisher: "Wine & Spirit Education Trust", authorNames: ["WSET Global"], url: "https://www.wsetglobal.com/knowledge-centre/blog/2022/april/26/ideal-serving-temperatures-and-top-tips-for-wine-storage", locator: "Red-wine serving-temperature guidance", note: "Professional education source used only to cross-check 15–18°C as a general red-wine service range; it does not establish Rioja identity or authorize drinking advice.", type: "professional-organization", reliability: "authoritative-secondary", uses: ["preparation"] },
      { title: "Drinking Temperature for D.O.Ca Rioja Wines", publisher: "Fincas de Azabache", url: "https://www.fincasdeazabache.com/en/actualidad/63_LA-TEMPERATURA-DEL-VINO.html", locator: "Reserva and Gran Reserva serving range", note: "Producer-authored written guidance used only to cross-check 16–18°C as a restrained category starting point; specific bottle labels remain controlling and marketing language is excluded.", type: "producer-documentation", reliability: "general-secondary", uses: ["preparation"] },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "not-modeled" },
    alt: "装有深红色葡萄酒的无品牌高脚杯，与葡萄和橡木意象组成的里奥哈档案插画",
    preparation: { kind: "serving-guidance", estimatedMinutes: 10, toolIds: ["wine-glass", "bottle-opener"], content: bilingual(
      { guidance: "仅对达到法定饮酒年龄且选择饮酒的成年人：按具体酒标和当地规定服务，可从 16–18°C、小杯慢饮开始；不开车时饮酒，不提供饮用量、健康效益或购买建议。" },
      { guidance: "For adults of legal drinking age who choose to drink: follow the bottle label and local rules; a restrained baseline is 16–18°C in a small glass. Do not drink and drive. No intake amount, health benefit, or purchase advice is provided." },
    ) },
  },
] as const;

interface StoryCopy {
  zh: {
    title: string;
    dek: string;
    firstHeading: string;
    firstParagraph: string;
    secondHeading: string;
    secondParagraph: string;
  };
  en: {
    title: string;
    dek: string;
    firstHeading: string;
    firstParagraph: string;
    secondHeading: string;
    secondParagraph: string;
  };
}

const storyCopyByItemId = {
  "double-skin-milk": {
    zh: {
      title: "顺德奶香如何凝成一碗双皮奶",
      dek: "地域饮食语境和家庭蒸制逻辑，在柔嫩凝固这一点相遇。",
      firstHeading: "珠江三角洲的奶制甜品",
      firstParagraph: "双皮奶与顺德的饮食文化相连；这里记录的是广东奶制甜品的地域身份，不把某一家店或单一配方写成唯一源头。",
      secondHeading: "第一层保留，第二层蒸成",
      secondParagraph: "Cooking Lab 先让热牛奶静置结皮，倒出皮下牛奶与蛋白、糖混合后再从皮下回注，最后用温和蒸汽、中心温度和无流动蛋液作为完成线；这是一条独立家庭路径，不复刻餐厅表达或暗示授权。",
    },
    en: {
      title: "How Shunde Milk Becomes Double-skin Custard",
      dek: "Regional food culture and gentle home steaming meet in one tender set.",
      firstHeading: "A Pearl River Delta dairy dessert",
      firstParagraph: "Double-skin milk is associated with Shunde food culture. This story records that Guangdong dairy-dessert identity without naming one shop or formula as the sole origin.",
      secondHeading: "Preserve the first skin, steam the second",
      secondParagraph: "Cooking Lab first lets hot milk form a skin, pours away the milk beneath it, combines that milk with egg white and sugar, and returns it beneath the retained layer before gentle steaming. Center temperature and no liquid egg define the finish; this independent household path reproduces no restaurant expression and implies no authorization.",
    },
  },
  "mango-pomelo-sago": {
    zh: {
      title: "芒果、柚子与西米为何在香港甜品里相遇",
      dek: "热带果香、柑橘酸度与西米口感组成一份现代粤式冷甜品。",
      firstHeading: "一款现代香港甜品",
      firstParagraph: "杨枝甘露以芒果、西米和柚子构成鲜明身份，并进入香港粤式餐饮语境；其传播史可以记录，但不能据此复制任何餐厅配方。",
      secondHeading: "让三种口感各自清楚",
      secondParagraph: "Cooking Lab 将芒果打成基底，把西米煮至大致透明，并在最后加入柚子，使顺滑、弹性和清爽酸香都可辨认。",
    },
    en: {
      title: "Why Mango, Pomelo, and Sago Meet in One Hong Kong Dessert",
      dek: "Tropical fruit, citrus brightness, and pearly texture define a modern Cantonese chilled sweet.",
      firstHeading: "A modern Hong Kong dessert",
      firstParagraph: "Mango pomelo sago has a distinct identity built from mango, tapioca pearls, and pomelo within Hong Kong Cantonese dining. Its development can be documented without copying a restaurant formula.",
      secondHeading: "Keeping three textures distinct",
      secondParagraph: "Cooking Lab blends mango for the base, cooks sago until nearly translucent, and folds in pomelo last so creaminess, bounce, and bright citrus remain perceptible.",
    },
  },
  "hong-kong-egg-tart": {
    zh: {
      title: "蛋挞如何成为香港烘焙日常",
      dek: "酥皮与蛋奶馅在本地面包店和茶餐厅语境中形成熟悉组合。",
      firstHeading: "从外来糕点到本地日常",
      firstParagraph: "香港蛋挞的历史连接欧洲挞点、广州与香港烘焙传统；不同挞皮长期并存，因此本条目不把一种外壳写成唯一正宗。",
      secondHeading: "酥壳与嫩馅的两段火候",
      secondParagraph: "Cooking Lab 先用高温建立挞壳，再降低温度凝固蛋奶馅，并用中心温度校验完成状态。这是独立家庭版本，不是店铺配方。",
    },
    en: {
      title: "How Egg Tarts Became an Everyday Hong Kong Bake",
      dek: "Pastry and egg custard settled into the city’s bakery and cha chaan teng repertoire.",
      firstHeading: "From imported pastry to local staple",
      firstParagraph: "Hong Kong egg-tart history connects European tarts with Guangzhou and Hong Kong baking traditions. Multiple shell styles coexist, so this entry does not name one crust as uniquely authentic.",
      secondHeading: "Two heat stages for crisp shell and tender custard",
      secondParagraph: "Cooking Lab sets the pastry with high heat, lowers the oven to finish the custard, and verifies doneness by center temperature. This is an independent home version, not a shop formula.",
    },
  },
  "black-sesame-soup": {
    zh: {
      title: "黑芝麻糊的香气与稠度从哪里来",
      dek: "种子油脂带来烘烤香，米粉则把它变成流动的甜汤。",
      firstHeading: "芝麻进入中式甜汤",
      firstParagraph: "黑芝麻糊以芝麻和米粉构成中式甜汤身份；这里讨论食材与做法，不延伸为保健或医疗功效。",
      secondHeading: "先炒香，再用米浆增稠",
      secondParagraph: "Cooking Lab 以小火炒出坚果香，将芝麻磨细，再用冷水分散的米粉温和增稠，避免焦苦和结团。",
    },
    en: {
      title: "Where Black Sesame Soup Gets Its Aroma and Body",
      dek: "Seed oils bring roasted fragrance while rice flour turns the mixture into a flowing sweet soup.",
      firstHeading: "Sesame in a Chinese sweet soup",
      firstParagraph: "Black sesame soup is identified here through sesame and rice flour in a Chinese sweet-soup form. The story stays with food identity and technique and makes no health or medical claim.",
      secondHeading: "Toast first, then thicken with a slurry",
      secondParagraph: "Cooking Lab gently toasts the seeds, blends them fine, and thickens with rice flour dispersed in cold water to avoid scorching and lumps.",
    },
  },
  "matcha-usucha": {
    zh: {
      title: "薄茶为什么不是普通浸泡茶",
      dek: "茶粉直接留在碗中，过筛、润湿和短促打筅共同决定口感。",
      firstHeading: "喝下的是分散的茶粉",
      firstParagraph: "抹茶与叶片浸泡不同：细茶粉直接分散在水中。薄茶因此依赖粉末细度、水温和快速打匀，而不是长时间浸泡。",
      secondHeading: "可重复而非流派认证",
      secondParagraph: "Cooking Lab 先过筛并调成无干粉糊，再加水快速前后打筅；这是家庭操作基线，不代表任何茶道流派认证。",
    },
    en: {
      title: "Why Usucha Is Not an Infused Leaf Tea",
      dek: "The powder remains in the bowl, making sifting, wetting, and brief whisking decisive.",
      firstHeading: "Drinking dispersed tea powder",
      firstParagraph: "Unlike steeped leaf tea, matcha powder is dispersed directly in water. Usucha therefore depends on particle dispersion, water temperature, and quick whisking rather than a long infusion.",
      secondHeading: "A repeatable baseline, not school certification",
      secondParagraph: "Cooking Lab sifts the powder, wets it to remove dry pockets, and whisks briskly back and forth. The method is a home baseline and claims no tea-school endorsement.",
    },
  },
  "tieguanyin-gongfu": {
    zh: {
      title: "小壶短泡如何展开铁观音",
      dek: "较高叶水比和连续短泡，把香气、滋味与叶底变化分开观察。",
      firstHeading: "工夫泡是一种控制方式",
      firstParagraph: "中国茶制作与饮用传统包含乌龙茶及其社会实践；本条目聚焦小容器、多次短泡的操作逻辑，不宣称代表所有地区或流派。",
      secondHeading: "用状态而非固定秒数微调",
      secondParagraph: "Cooking Lab 以高温水、短时出汤和完全沥尽为基线，再根据苦涩、香气和叶片展开程度调整下一泡。",
    },
    en: {
      title: "How Short Infusions Unfold Tieguanyin",
      dek: "A high leaf-to-water ratio and repeated pours reveal aroma, taste, and leaf change in stages.",
      firstHeading: "Gongfu brewing as a control method",
      firstParagraph: "Chinese tea traditions include oolong processing and associated social practices. This entry focuses on the small-vessel, repeated-infusion logic without claiming to represent every region or school.",
      secondHeading: "Adjusting by state, not one fixed clock",
      secondParagraph: "Cooking Lab starts with hot water, short infusions, and complete draining, then adjusts the next pour by bitterness, aroma, and how fully the leaves have opened.",
    },
  },
  "darjeeling-first-flush-profile": {
    zh: {
      title: "大吉岭“春摘”同时描述产地与季节",
      dek: "受保护的产区身份与早季采摘相叠加，但不能替代具体茶园和批次信息。",
      firstHeading: "先确认大吉岭身份",
      firstParagraph: "大吉岭茶具有明确的地理标志和生产区域边界；“春摘”再进一步描述早季采收，而不是一个可脱离产地使用的通用品名。",
      secondHeading: "档案不替商品说话",
      secondParagraph: "Cooking Lab 只记录产区、季节和克制的冲泡起点，不复制庄园 tasting notes，也不推断等级、年份、批次或购买价值。",
    },
    en: {
      title: "Darjeeling First Flush Names Both Place and Season",
      dek: "A protected regional identity overlaps with early-season picking but cannot replace estate and lot information.",
      firstHeading: "Confirming Darjeeling identity first",
      firstParagraph: "Darjeeling tea has a defined geographical indication and production area. “First flush” further describes early-season picking rather than a generic name detached from place.",
      secondHeading: "A profile does not speak for a product",
      secondParagraph: "Cooking Lab records only region, season, and a restrained brewing start point. It copies no estate tasting notes and infers no grade, vintage, lot, or buying value.",
    },
  },
  "v60-pour-over": {
    zh: {
      title: "V60 手冲把流速变成可观察变量",
      dek: "锥形滤杯、研磨、水量和注水节奏共同改变萃取，而不是一套神秘手法。",
      firstHeading: "比例只是起点",
      firstParagraph: "专业冲煮资料把咖啡粉、水、研磨和接触时间视为相互关联的变量；固定比例不能单独保证风味。",
      secondHeading: "从总时间和液面反馈修正",
      secondParagraph: "Cooking Lab 使用称重、分段注水和总时间建立基线，再按流速与涩感或空薄表现调整研磨，不照搬赛事动作或创作者话术。",
    },
    en: {
      title: "V60 Brewing Turns Flow into an Observable Variable",
      dek: "Cone geometry, grind, water, and pouring rhythm shape extraction without requiring a mystique-driven routine.",
      firstHeading: "Ratio is only a starting point",
      firstParagraph: "Professional brewing guidance treats coffee dose, water, grind, and contact time as linked variables. A fixed ratio alone does not guarantee flavor.",
      secondHeading: "Correcting from drawdown and cup feedback",
      secondParagraph: "Cooking Lab uses weighing, staged pours, and total brew time as a baseline, then adjusts grind from flow and astringency rather than copying competition gestures or creator wording.",
    },
  },
  "flat-white": {
    zh: {
      title: "澳白为何同时属于澳大利亚与新西兰叙事",
      dek: "跨塔斯曼的起源说法并存，杯中共识则更接近浓缩咖啡与薄层微泡奶。",
      firstHeading: "不裁定唯一发明者",
      firstParagraph: "Flat white 常与澳大利亚和新西兰咖啡文化共同关联，起源叙述存在竞争版本；本条目保留争议，不替任何城市或咖啡馆定案。",
      secondHeading: "用薄微泡保留咖啡存在感",
      secondParagraph: "Cooking Lab 以浓缩咖啡和细密、较薄的微泡牛奶为家庭基线，避免把 latte art 或某个专有比例写成身份门槛。",
    },
    en: {
      title: "Why Flat White Belongs to Both Australian and New Zealand Stories",
      dek: "Competing trans-Tasman origin accounts coexist; the cup is more consistently described by espresso and a thin layer of microfoam.",
      firstHeading: "Not choosing a sole inventor",
      firstParagraph: "Flat white is associated with both Australian and New Zealand coffee cultures, with competing origin accounts. This entry preserves that dispute rather than ruling for one city or café.",
      secondHeading: "Thin microfoam keeps coffee present",
      secondParagraph: "Cooking Lab uses espresso and fine, relatively thin microfoam as a home baseline without turning latte art or one proprietary ratio into an identity test.",
    },
  },
  "ethiopia-yirgacheffe-washed-profile": {
    zh: {
      title: "耶加雪菲水洗档案为何要拆开产区与处理法",
      dek: "地名回答咖啡来自哪里，水洗则描述采后处理，两者都不能替代具体批次。",
      firstHeading: "两个维度，不是一句风味承诺",
      firstParagraph: "耶加雪菲指向埃塞俄比亚咖啡产区语境，水洗描述采后去除果肉与发酵清洗的处理路径；组合名称不自动证明某种 tasting note。",
      secondHeading: "从标签信息开始冲煮",
      secondParagraph: "Cooking Lab 优先服从具体烘焙标签，只在信息缺失时给出克制起点，并排除庄园、批次、评分、包装与购买背书。",
    },
    en: {
      title: "Why a Washed Yirgacheffe Profile Separates Region from Process",
      dek: "The place name answers where; washed processing describes post-harvest handling. Neither substitutes for a specific lot.",
      firstHeading: "Two dimensions, not a flavor promise",
      firstParagraph: "Yirgacheffe points to an Ethiopian coffee-region context, while washed describes a post-harvest path involving depulping, fermentation, and cleaning. The combination does not prove any tasting note by itself.",
      secondHeading: "Begin with the actual label",
      secondParagraph: "Cooking Lab defers to the roaster label and offers only a restrained start point when information is absent, excluding estate, lot, score, packaging, and buying endorsement.",
    },
  },
  "cha-chaan-teng-lemon-coke": {
    zh: {
      title: "“冻柠乐”三个字如何成为茶餐厅点单语言",
      dek: "“冻”说明温度，“柠乐”缩写柠檬可乐；一杯饮品也保存着香港粤语的点单方式。",
      firstHeading: "名字已经说明组合",
      firstParagraph: "香港茶餐厅点单语言会在饮品前加“冻”表示冰饮，并把柠檬可乐缩写为“柠乐”；这一身份不需要绑定某个可乐商标或店铺配方。",
      secondHeading: "少搅动，保留气泡",
      secondParagraph: "Cooking Lab 使用无品牌可乐描述，轻压少量柠檬并只搅一次，以鲜酸提亮甜味，同时避免快速散气和白瓤苦味。",
    },
    en: {
      title: "How “Iced Lemon Cola” Became Cha Chaan Teng Ordering Language",
      dek: "The temperature marker and contracted drink name preserve a distinctly Hong Kong Cantonese way of ordering.",
      firstHeading: "The name states the combination",
      firstParagraph: "Hong Kong cha chaan teng ordering language adds the marker for “iced” before a drink and contracts lemon cola to ning lok. That identity need not be tied to one cola trademark or shop formula.",
      secondHeading: "Minimal stirring preserves carbonation",
      secondParagraph: "Cooking Lab uses generic cola, lightly presses a little lemon, and stirs once so acidity brightens sweetness without rapidly losing bubbles or extracting harsh pith.",
    },
  },
  "kumquat-lemon-tea": {
    zh: {
      title: "Cooking Lab 如何拆分金桔、柠檬与茶",
      dek: "这条家庭操作路径把果皮、果汁和红茶分开处理，便于逐步观察甜、酸与涩。",
      firstHeading: "果皮和果汁不是同一种味道",
      firstParagraph: "金桔的可食果皮与果肉共同参与风味，柠檬则补充清楚酸度；Cooking Lab 将果皮、果汁和茶汤分开处理，以便观察甜、酸、涩的平衡。",
      secondHeading: "冷却后再合并柑橘",
      secondParagraph: "Cooking Lab 先完整滤出茶叶，再在茶汤温凉后加入轻压金桔与柠檬，最后于冰上校准甜酸，不附加疗效或品牌来源。",
    },
    en: {
      title: "How Cooking Lab Separates Kumquat, Lemon, and Tea",
      dek: "This household workflow handles peel, juice, and black tea separately so sweetness, acidity, and astringency can be observed in stages.",
      firstHeading: "Peel and juice do not taste the same",
      firstParagraph: "Kumquat contributes both edible peel and flesh while lemon adds direct acidity. Cooking Lab handles peel, juice, and tea separately so their sweet, sour, and astringent balance can be observed.",
      secondHeading: "Combine citrus after the tea cools",
      secondParagraph: "Cooking Lab strains the leaves fully, adds gently pressed kumquat and lemon to warm-cool tea, and balances sweetness over ice without making health or branded-origin claims.",
    },
  },
  "hong-kong-iced-lemon-tea": {
    zh: {
      title: "一杯冻柠茶为何要先把茶泡浓",
      dek: "冰会稀释，柠檬皮会变苦，茶餐厅冷饮因此需要按顺序控制。",
      firstHeading: "茶餐厅的高杯冷饮",
      firstParagraph: "港式冻柠茶把浓红茶、柠檬、糖和冰组合成香港茶餐厅日常饮品；店铺比例各异，本条目不设唯一正宗公式。",
      secondHeading: "先出茶，再轻压柠檬",
      secondParagraph: "Cooking Lab 用略浓茶底抵消冰融化，及时滤出茶叶，再只轻压少数柠檬片，让果香出现而不把白瓤捣出粗苦。",
    },
    en: {
      title: "Why Hong Kong Iced Lemon Tea Starts Strong",
      dek: "Ice dilutes and lemon pith turns bitter, so the cha chaan teng drink depends on sequence.",
      firstHeading: "A tall-glass tea café drink",
      firstParagraph: "Hong Kong iced lemon tea combines strong black tea, lemon, sugar, and ice as a cha chaan teng staple. Shop ratios vary, so this entry sets no uniquely authentic formula.",
      secondHeading: "Strain tea first, then press lemon lightly",
      secondParagraph: "Cooking Lab brews slightly strong for ice dilution, removes the leaves promptly, and presses only a few lemon slices to release aroma without crushing bitter pith.",
    },
  },
  yuenyeung: {
    zh: {
      title: "鸳鸯为什么把茶与咖啡放在同一杯",
      dek: "它不是把两种饮料互相遮盖，而是在茶餐厅语境中保留两条苦香线索。",
      firstHeading: "香港茶餐厅的混合饮品",
      firstParagraph: "鸳鸯把红茶、咖啡和奶组合在一起，是香港茶餐厅饮品文化的一部分；关于首创者的说法不一，本条目不指定唯一店铺。",
      secondHeading: "分开萃取，再决定比例",
      secondParagraph: "Cooking Lab 分开冲泡茶与咖啡，再用可调比例合并，使茶涩与烘焙香都可辨认，而不是复制某家店的专有比例。",
    },
    en: {
      title: "Why Yuenyeung Puts Tea and Coffee in One Cup",
      dek: "The aim is not for one drink to hide the other, but to retain two bitter-aromatic lines in a cha chaan teng context.",
      firstHeading: "A Hong Kong tea café blend",
      firstParagraph: "Yuenyeung combines black tea, coffee, and milk within Hong Kong cha chaan teng beverage culture. Originator accounts vary, so this entry names no sole shop.",
      secondHeading: "Brew separately, then choose the balance",
      secondParagraph: "Cooking Lab brews tea and coffee separately before combining them at an adjustable ratio so tea structure and roasted aroma both remain distinct, without copying a shop formula.",
    },
  },
  "rioja-reserva-profile": {
    zh: {
      title: "Reserva 在里奥哈首先是法规类别",
      dek: "它规定陈年框架，却不能替任何酒庄、年份或酒款提供风味保证。",
      firstHeading: "产区名称与陈年类别",
      firstParagraph: "Rioja Reserva 位于受产区规则管理的身份体系中，Reserva 指向规定的陈年条件；这一事实不等于某瓶酒一定具有相同风味或品质。",
      secondHeading: "服务提示保持克制",
      secondParagraph: "Cooking Lab 只给法定年龄成年人提供通用温度与小杯慢饮提示，不刊载品牌 tasting notes、评分、包装、购买或健康建议。",
    },
    en: {
      title: "Reserva in Rioja Is First a Regulatory Category",
      dek: "It sets an aging framework but cannot promise flavor for any winery, vintage, or bottle.",
      firstHeading: "Region name and aging category",
      firstParagraph: "Rioja Reserva sits within a regulated regional identity, where Reserva denotes specified aging conditions. That fact does not mean every bottle shares the same flavor or quality.",
      secondHeading: "Keeping service guidance restrained",
      secondParagraph: "Cooking Lab offers legal-age adults only general serving guidance in a small glass, with no brand tasting notes, scores, packaging, purchasing, or health advice.",
    },
  },
} satisfies Record<(typeof seeds)[number]["id"], StoryCopy>;

function storyCopyFor(itemId: string): StoryCopy {
  const copy = (storyCopyByItemId as Record<string, StoryCopy>)[itemId];
  if (!copy) throw new Error(`Missing M11 Story copy for ${itemId}`);
  return copy;
}

function buildItem(seed: Seed): BatchItem {
  const storyId = `${seed.id}-bounded-context`;
  const item = {
    id: seed.id,
    slug: seed.id,
    itemType: seed.itemType,
    content: bilingual(
      { name: seed.zhName, description: seed.zhDescription },
      { name: seed.enName, description: seed.enDescription },
    ),
    taxonomy: {
      ...(seed.originAreaId
        ? { origin: { areaId: seed.originAreaId } }
        : seed.countryId
          ? { origin: { countryId: seed.countryId, ...(seed.regionId ? { regionId: seed.regionId } : {}) } }
          : {}),
      cuisine: { cuisineId: seed.cuisineId },
      techniqueIds: seed.techniqueIds,
      formIds: seed.formIds,
      dietaryTagIds: seed.dietaryTagIds,
      browseTagIds: [],
    },
    flavor: { tastes: seed.tastes, aromaIds: seed.aromaIds, textureIds: seed.textureIds, characterIds: seed.characterIds },
    images: { availability: "available" as const, references: { primaryImageId: `${seed.id}-hero`, imageIds: [`${seed.id}-hero`] } },
    storyIds: [storyId],
    pairing: {
      mealRoleIds: [seed.itemType === "dessert" ? "dessert" as const : "drink" as const],
      servingContextIds: seed.servingContextIds,
      cuisineIds: [seed.cuisineId],
      facets: [
        { dimension: "weight" as const, value: seed.weight },
        { dimension: "temperature" as const, value: seed.temperature },
        ...(seed.textureIds[0] ? [{ dimension: "texture" as const, value: seed.textureIds[0] }] : []),
      ],
    },
    publication: staged,
    nutrition: seed.nutrition,
    cost: seed.cost,
    preparation: seed.preparation,
  };
  return item as BatchItem;
}

function sourceId(itemId: string, index: number) {
  return `m11-${itemId}-source-${index + 1}`;
}

function evidenceId(itemId: string, index: number) {
  return `m11-${itemId}-evidence-${index + 1}`;
}

export const batchANonDishItems = Object.freeze(seeds.map(buildItem));

export const batchANonDishImages: readonly RecipeImage[] = Object.freeze(
  seeds.map((seed) => m11OriginalHero(seed.id, seed.alt)),
);

export const batchANonDishSources: readonly Source[] = Object.freeze(seeds.flatMap((seed) =>
  seed.sources.map((source, index) => m11ReferenceSource({
    id: sourceId(seed.id, index),
    title: source.title,
    publisherOrInstitution: source.publisher,
    authorNames: source.authorNames,
    url: source.url,
    type: source.type,
    reliability: source.reliability,
    editorialNotes: source.note,
    health: { status: "active", checkedAt: m11ReviewedAt },
  })),
));

export const batchANonDishEvidence: readonly Evidence[] = Object.freeze(seeds.flatMap((seed) =>
  seed.sources.map((source, index) => m11Evidence({
    id: evidenceId(seed.id, index),
    sourceId: sourceId(seed.id, index),
    locator: source.locator,
    editorialNote: source.note,
    strength: source.strength,
  })),
));

export const batchANonDishStories: readonly Story[] = Object.freeze(seeds.map((seed) => m11Story({
  id: `${seed.id}-bounded-context`,
  itemId: seed.id,
  type: seed.storyType,
    kind: seed.storyKind ?? "documented-fact",
  evidenceIds: (seed.storyEvidenceIndexes ?? [0, 1]).map((index) => evidenceId(seed.id, index)) as [string, ...string[]],
  zh: {
    title: storyCopyFor(seed.id).zh.title,
    dek: storyCopyFor(seed.id).zh.dek,
    firstHeading: storyCopyFor(seed.id).zh.firstHeading,
    firstParagraphs: [storyCopyFor(seed.id).zh.firstParagraph],
    secondHeading: storyCopyFor(seed.id).zh.secondHeading,
    secondParagraphs: [storyCopyFor(seed.id).zh.secondParagraph],
    claim: seed.claimZh,
  },
  en: {
    title: storyCopyFor(seed.id).en.title,
    dek: storyCopyFor(seed.id).en.dek,
    firstHeading: storyCopyFor(seed.id).en.firstHeading,
    firstParagraphs: [storyCopyFor(seed.id).en.firstParagraph],
    secondHeading: storyCopyFor(seed.id).en.secondHeading,
    secondParagraphs: [storyCopyFor(seed.id).en.secondParagraph],
    claim: seed.claimEn,
  },
})));

export const batchANonDishResearchRecords: readonly ResearchRecord[] = Object.freeze(seeds.map((seed) => m11ResearchRecord({
  itemId: seed.id,
  templateId: ({
    dessert: "dish-dessert",
    tea: "tea",
    coffee: "coffee",
    "non-alcoholic-drink": "drink",
    "alcoholic-drink": "drink",
  } satisfies Record<Seed["itemType"], ResearchTemplateId>)[seed.itemType],
  sourceIds: seed.sources.map((_, index) => sourceId(seed.id, index)) as [string, string, ...string[]],
  sourceUses: seed.sources.map((source) => source.uses),
  claim: seed.claimEn,
  claimKind: seed.storyKind,
  evidenceIds: (seed.storyEvidenceIndexes ?? [0, 1]).map((index) => evidenceId(seed.id, index)) as [string, ...string[]],
})));

export const batchANonDishPairingTargets = Object.freeze({
  "double-skin-milk": ["longjing-green-tea", "vietnamese-iced-coffee"],
  "mango-pomelo-sago": ["thai-basil-chicken", "tomyum-kung"],
  "hong-kong-egg-tart": ["espresso", "lapsang-souchong"],
  "black-sesame-soup": ["japanese-miso-tofu-soup", "longjing-green-tea"],
  "matcha-usucha": ["mango-sticky-rice", "apple-crumble"],
  "tieguanyin-gongfu": ["dongpo-pork", "cantonese-mushroom-steamed-chicken"],
  "darjeeling-first-flush-profile": ["hong-kong-egg-tart", "apple-crumble"],
  "v60-pour-over": ["tiramisu", "hong-kong-egg-tart"],
  "flat-white": ["tiramisu", "apple-crumble"],
  "ethiopia-yirgacheffe-washed-profile": ["mango-pomelo-sago", "black-sesame-soup"],
  "cha-chaan-teng-lemon-coke": ["hong-kong-egg-tart", "cantonese-ginger-scallion-fish"],
  "kumquat-lemon-tea": ["sichuan-smashed-cucumber", "thai-green-papaya-salad"],
  "hong-kong-iced-lemon-tea": ["hong-kong-egg-tart", "hunan-chili-pork"],
  "yuenyeung": ["hong-kong-egg-tart", "double-skin-milk"],
  "rioja-reserva-profile": ["spanish-potato-omelet", "spanish-chickpea-spinach"],
} satisfies Record<(typeof seeds)[number]["id"], readonly [string, string]>);

export const batchANonDishProfileBoundaries = Object.freeze({
  "darjeeling-first-flush-profile": {
    version: "m11-profile-2026-09-v1",
    verifiedAt: m11ReviewedAt,
    scope: "Non-brand Darjeeling first-flush regional and seasonal profile; no estate, lot, grade, packaging, tasting-note, endorsement, affiliate, or purchase claim.",
  },
  "ethiopia-yirgacheffe-washed-profile": {
    version: "m11-profile-2026-09-v1",
    verifiedAt: m11ReviewedAt,
    scope: "Non-brand Yirgacheffe washed-process regional profile; no estate, lot, roaster, score, packaging, tasting-note, endorsement, affiliate, or purchase claim.",
  },
  "rioja-reserva-profile": {
    version: "m11-profile-2026-09-v1",
    verifiedAt: m11ReviewedAt,
    scope: "Non-brand Rioja Reserva regulatory-category profile; no winery, vintage, score, packaging, tasting-note, endorsement, affiliate, or purchase claim.",
  },
});

// These are regional/category profiles, not specific branded products or SKUs.
// They deliberately do not create ProductProfile records. M11's specific-product
// target remains unmet until a real brand, producer, model/vintage or batch, and
// corresponding rights review are available without placeholder values.
export const batchANonDishProductProfiles: readonly ProductProfile[] = Object.freeze([]);

const productProfileIdsByItemId = new Map<string, string[]>();
for (const profile of batchANonDishProductProfiles) {
  productProfileIdsByItemId.set(profile.culinaryItemId, [
    ...(productProfileIdsByItemId.get(profile.culinaryItemId) ?? []),
    profile.id,
  ]);
}

export const batchANonDishPackages: readonly LocalContentPackageV1[] = Object.freeze(
  batchANonDishItems.map((item) => defineStandaloneContentPackage(item, {
    productProfileIds: productProfileIdsByItemId.get(item.id) ?? [],
  })),
);
import type { ProductProfile } from "@/types/content-rights";
