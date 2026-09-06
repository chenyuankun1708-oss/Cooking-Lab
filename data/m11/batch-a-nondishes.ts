import type {
  AlcoholicDrinkItem,
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
import type { ResearchRecord, ResearchTemplateId } from "@/types/research";
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
  url: string;
  locator: string;
  note: string;
  type?: Source["type"];
  reliability?: Source["reliability"];
}

interface CommonSeed {
  id: string;
  itemType: BatchItem["itemType"];
  zhName: string;
  enName: string;
  zhDescription: string;
  enDescription: string;
  countryId: string;
  regionId?: string;
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
  claimZh: string;
  claimEn: string;
  sources: [SourceSeed, SourceSeed];
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

const published = { status: "published" as const };

const seeds: readonly Seed[] = [
  {
    id: "double-skin-milk",
    itemType: "dessert",
    zhName: "双皮奶",
    enName: "Double-skin Milk Custard",
    zhDescription: "以牛奶、蛋白和少量糖蒸成的顺滑奶香甜品；以轻晃时中心仍有细微颤动为完成判断。",
    enDescription: "A gently steamed milk-and-egg-white custard with restrained sweetness, finished when the center still has a slight wobble.",
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
      { title: "Shunde, UNESCO Creative City of Gastronomy", publisher: "UNESCO Creative Cities Network", url: "https://www.unesco.org/en/creative-cities/shunde", locator: "Gastronomy profile", note: "Regional context for Shunde food culture.", type: "official-cultural-institution" },
      { title: "Double Skin Milk", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Double_skin_milk", locator: "Dessert identity and preparation overview", note: "Independent general reference for the dessert identity; no source wording is reused.", type: "open-educational-resource", reliability: "general-secondary" },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" },
    cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "浅色瓷碗中的双皮奶，表面平滑并有轻微凝固光泽",
    preparation: {
      kind: "cooking",
      time: { prepMinutes: 15, processMinutes: 35, totalMinutes: 50, activeMinutes: 25 },
      yield: { amount: 4, unit: "serving" },
      inputs: [input("milk", 500, "ml"), input("egg-white", 90), input("granulated-sugar", 35)],
      toolIds: ["saucepan", "mixing-bowl", "fine-strainer", "steamer"],
      steps: [
        bilingualStep(1, { instruction: "牛奶加糖小火加热至糖溶解、锅边刚冒细泡，离火放至温热。", rationale: "避免沸腾可减少乳膜破裂和焦底。", stateCue: "糖粒消失，牛奶仍平静。" }, { instruction: "Warm the milk and sugar over low heat until dissolved and tiny bubbles appear at the edge; remove from the heat and cool until warm.", rationale: "Avoiding a boil limits scorching and keeps the milk surface calm.", stateCue: "No sugar crystals remain and the milk is not bubbling." }, 8),
        bilingualStep(2, { instruction: "蛋白轻轻打散，与温牛奶混合后过细筛，分入四只耐热碗。", rationale: "少量搅动和过滤可减少大气泡与蛋白筋络。", stateCue: "液面细腻，几乎没有可见泡沫。" }, { instruction: "Loosen the egg whites gently, combine with the warm milk, strain, and divide among four heatproof bowls.", rationale: "Gentle mixing and straining reduce large bubbles and egg-white strands.", stateCue: "The surface is smooth with almost no visible foam." }, 7),
        bilingualStep(3, { instruction: "碗上盖盘或耐热盖，中小火蒸约 15 分钟，关火焖 5 分钟后取出放凉。", rationale: "遮盖和温和蒸汽有助于形成均匀细嫩的凝胶。", stateCue: "边缘已定型，中心轻晃仍有小幅颤动。" }, { instruction: "Cover each bowl, steam gently for about 15 minutes, then rest off heat for 5 minutes before cooling.", rationale: "Covering and gentle steam promote an even, tender set.", stateCue: "The edges are set and the center retains a slight wobble." }, 20),
      ],
    },
  },
  {
    id: "mango-pomelo-sago", itemType: "dessert", zhName: "杨枝甘露", enName: "Mango Pomelo Sago",
    zhDescription: "芒果泥、柚子果肉与煮透西米组成的冷甜品，保留果香、酸度和颗粒口感。",
    enDescription: "A chilled mango dessert with pomelo and fully cooked tapioca pearls, balancing ripe fruit, gentle acidity, and distinct texture.",
    countryId: "china", regionId: "guangdong", cuisineId: "cantonese", techniqueIds: ["boil"], formIds: ["sago-dessert"], dietaryTagIds: ["vegetarian"],
    tastes: { sweet: 3, sour: 1 }, aromaIds: ["fruity", "citrusy"], textureIds: ["creamy", "chewy"], characterIds: ["refreshing"],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "medium", temperature: "cold", storyType: "historical-development",
    claimZh: "本条目把杨枝甘露作为香港粤式甜品语境中的芒果、西米与柚子组合记录，不复制任何餐厅配方。",
    claimEn: "This entry records mango pomelo sago as a Hong Kong Cantonese dessert combining mango, tapioca pearls, and pomelo without reproducing any restaurant recipe.",
    sources: [
      { title: "Hong Kong Food Culture", publisher: "Hong Kong Tourism Board", url: "https://www.discoverhongkong.com/eng/explore/dining.html", locator: "Local dining and dessert context", note: "Official destination context for Hong Kong dessert culture.", type: "official-cultural-institution" },
      { title: "Tapioca", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/plant/cassava", locator: "Cassava starch and tapioca", note: "Independent factual context for tapioca as a cassava starch product.", type: "publisher" },
    ],
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
    countryId: "china", regionId: "guangdong", cuisineId: "cantonese", techniqueIds: ["bake"], formIds: ["pastry"], dietaryTagIds: ["vegetarian"],
    tastes: { sweet: 2 }, aromaIds: ["toasty"], textureIds: ["crisp", "silky"], characterIds: ["comforting"],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "medium", temperature: "warm", storyType: "historical-development",
    claimZh: "港式蛋挞的公开叙述只记录其香港烘焙与茶餐厅语境，不把葡式蛋挞或任何店铺版本当作同一配方。",
    claimEn: "The public account places Hong Kong egg tarts in the city’s bakery and cha chaan teng context without treating Portuguese tarts or any shop formula as the same recipe.",
    sources: [
      { title: "A Guide to Hong Kong-style Egg Tarts", publisher: "South China Morning Post", url: "https://www.scmp.com/lifestyle/food-drink", locator: "Hong Kong bakery culture", note: "Editorial context for Hong Kong-style bakery foods.", type: "reputable-media", reliability: "general-secondary" },
      { title: "Custards", publisher: "Exploratorium Science of Cooking", url: "https://annex.exploratorium.edu/cooking/eggs/index.html", locator: "Egg proteins and custard setting", note: "Independent food-science cross-check for gentle custard setting.", type: "educational-institution" },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "金黄酥皮蛋挞，蛋奶馅表面平整并带浅焦色边缘",
    preparation: {
      kind: "baking", time: { prepMinutes: 35, processMinutes: 30, totalMinutes: 65, activeMinutes: 45 }, yield: { amount: 8, unit: "piece" },
      inputs: [input("wheat-flour", 180), input("butter", 100), input("egg", 3, "piece"), input("milk", 220, "ml"), input("granulated-sugar", 65)],
      toolIds: ["mixing-bowl", "rolling-pin", "tart-tin", "oven", "fine-strainer"],
      steps: [
        bilingualStep(1, { instruction: "面粉与冷黄油快速搓成粗粒，加少量冷水压成团，冷藏 20 分钟后擀开并铺入挞模。", rationale: "保持黄油低温可减少面团出油并形成酥松层次。", stateCue: "面团能聚拢但仍可见细小黄油纹理。" }, { instruction: "Rub cold butter into flour to coarse crumbs, bind with a little cold water, chill 20 minutes, then roll and line the tart tins.", rationale: "Keeping the butter cold limits greasiness and preserves a crisp texture.", stateCue: "The dough holds together while small butter streaks remain visible." }, 30),
        bilingualStep(2, { instruction: "鸡蛋、牛奶和糖轻轻混合至糖溶解，过筛后静置去泡。", rationale: "避免打入过多空气可让蛋奶馅烤后更平整。", stateCue: "液体均匀，表面几乎没有泡沫。" }, { instruction: "Stir eggs, milk, and sugar gently until dissolved, strain, and rest to release bubbles.", rationale: "Minimal aeration gives the baked custard a smoother surface.", stateCue: "The mixture is even with almost no foam." }, 10),
        bilingualStep(3, { instruction: "挞壳注入八分满蛋奶液，220°C 烤 10 分钟，再降至 180°C 烤 12 至 15 分钟。", rationale: "先高温建立挞壳结构，再降温让蛋奶馅温和凝固。", stateCue: "挞壳金黄，馅料边缘定型而中心轻颤。" }, { instruction: "Fill shells about four-fifths full; bake at 220°C for 10 minutes, then at 180°C for 12–15 minutes.", rationale: "Initial high heat sets the shell before gentler heat finishes the custard.", stateCue: "The pastry is golden; custard edges are set and centers wobble slightly." }, 25),
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
      { title: "Sesame", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/plant/sesame-plant", locator: "Seed uses", note: "Independent botanical and food-use context for sesame.", type: "publisher" },
      { title: "Chinese Desserts", publisher: "Hong Kong Tourism Board", url: "https://www.discoverhongkong.com/eng/explore/dining.html", locator: "Traditional dessert context", note: "Official destination context for Cantonese sweet soups.", type: "official-cultural-institution" },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "白瓷碗中的深黑色芝麻糊，质地顺滑并带细微光泽",
    preparation: {
      kind: "cooking", time: { prepMinutes: 12, processMinutes: 18, totalMinutes: 30, activeMinutes: 25 }, yield: { amount: 4, unit: "serving" },
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
      { title: "Matcha", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Matcha", locator: "Powdered-tea identity and preparation overview", note: "Independent general reference for matcha identity; no source wording is reused.", type: "open-educational-resource", reliability: "general-secondary" },
      { title: "Matcha", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/topic/matcha", locator: "Powdered green tea", note: "Independent general reference for matcha identity.", type: "publisher" },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "茶碗中带细密泡沫的鲜绿色薄茶，旁边放有竹茶筅",
    preparation: {
      kind: "brewing", time: { prepMinutes: 3, processMinutes: 3, totalMinutes: 6, activeMinutes: 6 }, yield: { amount: 1, unit: "serving" },
      inputs: [input("matcha-powder", 2), input("drinking-water", 70, "ml")], toolIds: ["kettle", "tea-bowl", "fine-sieve", "bamboo-whisk"],
      steps: [
        bilingualStep(1, { instruction: "茶碗温热后擦干，抹茶粉过筛入碗；水烧开后降至约 80°C。", rationale: "过筛减少粉团，适度降温可避免苦涩过强。", stateCue: "粉末蓬松无结块，水不再翻滚。" }, { instruction: "Warm and dry the bowl, sift in the matcha, and let boiled water cool to about 80°C.", rationale: "Sifting limits clumps, while moderate water temperature avoids excessive bitterness.", stateCue: "The powder is loose and lump-free; the water is no longer boiling." }, 3),
        bilingualStep(2, { instruction: "先加少量水调成无干粉糊，再加余水，以茶筅快速前后打约 20 秒。", rationale: "先调糊能让粉末充分润湿，短促前后动作比绕圈更易形成均匀细泡。", stateCue: "茶汤表面覆盖细泡，没有明显粉团。" }, { instruction: "Add a little water and mix to a lump-free paste; add the rest and whisk briskly back and forth for about 20 seconds.", rationale: "Pre-wetting disperses the powder; short back-and-forth strokes build fine, even foam.", stateCue: "Fine foam covers the surface with no visible clumps." }, 2),
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
      { title: "Tieguanyin Tea Culture", publisher: "UNESCO Intangible Cultural Heritage", url: "https://ich.unesco.org/en/RL/traditional-tea-processing-techniques-and-associated-social-practices-in-china-01884", locator: "Oolong and associated tea practices", note: "Official cultural context for Chinese tea processing and practice.", type: "official-cultural-institution" },
      { title: "Tea Preparation", publisher: "UK Tea & Infusions Association", url: "https://www.tea.co.uk/make-a-perfect-brew", locator: "Water and infusion controls", note: "Independent preparation reference for water and infusion variables.", type: "professional-organization" },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "白瓷盖碗、茶海和小杯中的金黄铁观音茶汤，叶片已舒展",
    preparation: {
      kind: "brewing", time: { prepMinutes: 3, processMinutes: 8, totalMinutes: 11, activeMinutes: 10 }, yield: { amount: 4, unit: "serving" },
      inputs: [input("tieguanyin-tea-leaf", 8), input("drinking-water", 500, "ml")], toolIds: ["kettle", "gaiwan", "tea-pitcher", "timer"],
      steps: [
        bilingualStep(1, { instruction: "用热水温盖碗和茶海后倒净，投入茶叶；水降至约 95°C。", rationale: "预热减少冲泡时温降，略低于沸腾便于控制涩度。", stateCue: "器具温热，卷曲茶叶保持干燥香气。" }, { instruction: "Warm the gaiwan and pitcher, drain, add the leaves, and let the water settle near 95°C.", rationale: "Preheating limits heat loss; slightly sub-boiling water helps control astringency.", stateCue: "The vessels are warm and the rolled leaves remain aromatic." }, 3),
        bilingualStep(2, { instruction: "注水后加盖 25 秒，完全分入茶海；后续每泡增加约 5 至 10 秒。", rationale: "完全出汤可避免壶内继续萃取，逐泡延长补偿叶片可溶物下降。", stateCue: "首泡金黄清亮，后续叶片逐渐展开。" }, { instruction: "Cover for 25 seconds after pouring, then decant completely; add about 5–10 seconds for later infusions.", rationale: "Full decanting stops carry-over extraction; gradual extensions compensate as the leaves give less.", stateCue: "The first liquor is clear gold and the leaves open over later infusions." }, 7),
      ],
    },
  },
  {
    id: "darjeeling-first-flush-profile", itemType: "tea", zhName: "大吉岭春摘茶产区档案", enName: "Darjeeling First Flush Regional Profile",
    zhDescription: "2026-09 v1 非品牌产区档案：限定于“大吉岭春摘”身份、季节与冲泡核验，不代表具体茶园、批次或背书。",
    enDescription: "2026-09 v1 non-brand regional profile, bounded to Darjeeling first-flush identity, season, and brewing checks; it represents no estate, lot, or endorsement.",
    countryId: "india", cuisineId: "indian", techniqueIds: [], formIds: ["black-tea-profile"], dietaryTagIds: ["vegan"],
    tastes: { bitter: 1, sweet: 1 }, aromaIds: ["floral", "fruity"], textureIds: ["silky"], characterIds: ["light", "clean-tasting"],
    servingContextIds: ["afternoon-tea", "after-meal"], weight: "light", temperature: "hot", storyType: "place-food-culture",
    claimZh: "本档案把 first flush 限定为大吉岭年度较早采摘季的类别说明，不替任何品牌、茶园、年份或等级作质量背书。",
    claimEn: "This profile limits “first flush” to an early-season Darjeeling category and makes no quality endorsement for any brand, estate, vintage, or grade.",
    sources: [
      { title: "Darjeeling Tea", publisher: "Tea Board India", url: "https://www.teaboard.gov.in/TEABOARDCSM/NQ==", locator: "Darjeeling geographical indication", note: "Official producer-region and GI context.", type: "government", reliability: "primary" },
      { title: "Darjeeling Tea", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/topic/tea-beverage", locator: "Tea origins and production", note: "Independent general tea-production context.", type: "publisher" },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "not-modeled" },
    alt: "无品牌白色茶杯中的浅金色大吉岭茶汤，旁边是展开的春摘茶叶",
    preparation: { kind: "serving-guidance", estimatedMinutes: 5, toolIds: ["kettle", "teapot", "timer"], content: bilingual(
      { guidance: "档案基线：每 250 毫升水用 3 克散茶，约 90°C 浸泡 3 分钟后完全出汤；先按具体茶叶标签调整。本页不展示品牌包装、营销 tasting notes 或购买建议。" },
      { guidance: "Profile baseline: use 3 g loose leaf per 250 ml water, steep near 90°C for 3 minutes, and decant fully; defer to the specific tea label. This page shows no brand packaging, marketing tasting notes, or buying advice." },
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
      { title: "Coffee Brewing Control Chart", publisher: "Specialty Coffee Association", url: "https://sca.coffee/research/coffee-standards", locator: "Brewing standards", note: "Professional reference for brew ratio and extraction variables.", type: "professional-organization" },
      { title: "Coffee Brewing", publisher: "National Coffee Association USA", url: "https://www.ncausa.org/About-Coffee/How-to-Brew-Coffee", locator: "Water, grind, and freshness", note: "Independent consumer brewing guidance.", type: "professional-organization" },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "锥形滤杯中正在分段注水的手冲咖啡，玻璃分享壶内有清亮咖啡液",
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
    countryId: "australia", cuisineId: "australian", techniqueIds: [], formIds: ["milk-espresso"], dietaryTagIds: ["vegetarian"],
    tastes: { bitter: 2, sweet: 2 }, aromaIds: ["roasted"], textureIds: ["creamy", "silky"], characterIds: ["comforting"],
    servingContextIds: ["breakfast", "afternoon-tea"], weight: "medium", temperature: "hot", storyType: "historical-development",
    claimZh: "Flat white 通常与澳大利亚和新西兰咖啡文化共同关联；本条目不主张单一发明者或唯一比例。",
    claimEn: "Flat white is commonly associated with both Australian and New Zealand coffee cultures; this entry claims neither a sole inventor nor one exclusive ratio.",
    sources: [
      { title: "Flat White", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Flat_white", locator: "Australia and New Zealand origin accounts", note: "General context for the disputed trans-Tasman history without selecting a sole inventor.", type: "open-educational-resource", reliability: "general-secondary" },
      { title: "Espresso and Milk", publisher: "Specialty Coffee Association", url: "https://sca.coffee/research/coffee-standards", locator: "Espresso and milk preparation standards", note: "Independent professional preparation reference.", type: "professional-organization" },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "小陶瓷杯中的 flat white，表面是薄而细密的白色微泡牛奶",
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
    tastes: { sour: 2, bitter: 1, sweet: 1 }, aromaIds: ["floral", "fruity"], textureIds: ["silky"], characterIds: ["light", "clean-tasting"],
    servingContextIds: ["breakfast", "afternoon-tea"], weight: "light", temperature: "hot", storyType: "place-food-culture",
    claimZh: "本档案把耶加雪菲水洗咖啡限定为产区与处理法的事实组合，不复述商品 tasting notes，也不暗示生产者背书。",
    claimEn: "This profile limits washed Yirgacheffe coffee to a factual region-and-process combination, without reproducing product tasting notes or implying producer endorsement.",
    sources: [
      { title: "Coffee Production in Ethiopia", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Coffee_production_in_Ethiopia", locator: "Regional production overview", note: "General secondary context for Ethiopian coffee regions; no tasting-note language is reused.", type: "open-educational-resource", reliability: "general-secondary" },
      { title: "Coffee Processing", publisher: "World Coffee Research", url: "https://worldcoffeeresearch.org/resources", locator: "Post-harvest processing resources", note: "Independent research context for washed coffee processing.", type: "professional-organization" },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "not-modeled" },
    alt: "无品牌白杯中的清亮手冲咖啡，旁边放有未标识产商的烘焙咖啡豆",
    preparation: { kind: "serving-guidance", estimatedMinutes: 6, toolIds: ["pour-over-dripper", "kettle", "scale"], content: bilingual(
      { guidance: "档案基线：先按烘焙商标签冲泡；无标签时可从 15 克咖啡、250 克水、92°C 和约 3 分钟开始。档案不刊载商品 tasting notes、杯测分数、包装或购买链接。" },
      { guidance: "Profile baseline: follow the roaster label first; if absent, start with 15 g coffee, 250 g water at 92°C, and about 3 minutes. The profile publishes no product tasting notes, cupping scores, packaging, or purchase links." },
    ) },
  },
  {
    id: "cha-chaan-teng-lemon-coke", itemType: "non-alcoholic-drink", zhName: "茶餐厅冻柠乐", enName: "Cha Chaan Teng Iced Lemon Cola",
    zhDescription: "冰镇可乐加入压香柠檬片的茶餐厅风格冷饮，重点是保留气泡并控制果皮苦味。",
    enDescription: "A cha chaan teng-style cold drink of iced cola and expressed lemon slices, preserving carbonation while controlling peel bitterness.",
    countryId: "china", regionId: "guangdong", cuisineId: "cantonese", techniqueIds: [], formIds: ["carbonated-tea-drink"], dietaryTagIds: ["vegan"],
    tastes: { sweet: 3, sour: 2, bitter: 1 }, aromaIds: ["citrusy"], textureIds: [], characterIds: ["refreshing"],
    servingContextIds: ["lunch", "social-gathering"], weight: "light", temperature: "cold", storyType: "everyday-life-festival",
    claimZh: "冻柠乐在本条目中作为香港茶餐厅日常饮品语境记录，不使用可乐商标、包装图或品牌配方。",
    claimEn: "This entry records iced lemon cola in Hong Kong cha chaan teng everyday-drink context without using cola trademarks, packaging, or branded formulas.",
    sources: [
      { title: "Hong Kong Cha Chaan Teng Culture", publisher: "Hong Kong Tourism Board", url: "https://www.discoverhongkong.com/eng/explore/dining.html", locator: "Cha chaan teng dining", note: "Official destination context for cha chaan teng drinks.", type: "official-cultural-institution" },
      { title: "Carbonated Beverages", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/topic/soft-drink", locator: "Carbonation and soft drinks", note: "Independent general reference for carbonated soft drinks.", type: "publisher" },
    ],
    nutrition: { applicability: "not-modeled", reason: "insufficient-data" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "透明高杯中的冰镇柠檬可乐，有新鲜柠檬片和细密气泡，无品牌标识",
    preparation: {
      kind: "mixing", time: { prepMinutes: 5, processMinutes: 2, totalMinutes: 7, activeMinutes: 7 }, yield: { amount: 1, unit: "serving" },
      inputs: [input("cola", 300, "ml"), input("lemon", 0.5, "piece"), input("ice", 150)], toolIds: ["highball-glass", "bar-spoon"],
      steps: [
        bilingualStep(1, { instruction: "柠檬洗净切薄片，去籽；杯中装满新鲜冰块并贴杯壁放入柠檬。", rationale: "去籽减少意外苦味，足量冰能快速降温而少稀释。", stateCue: "冰块坚实，柠檬片没有厚白瓤。" }, { instruction: "Wash and thinly slice the lemon, remove seeds, fill a glass with fresh ice, and place lemon along the wall.", rationale: "Removing seeds limits stray bitterness; abundant ice chills quickly with less dilution.", stateCue: "The ice is solid and lemon slices carry little thick white pith." }, 4),
        bilingualStep(2, { instruction: "沿杯壁缓慢倒入冰镇可乐，轻压两片柠檬并只搅一次，立即饮用。", rationale: "少量压香和极少搅动可释放柠檬油，同时保留更多气泡。", stateCue: "杯中仍有连续细泡，柠檬香清楚但不苦。" }, { instruction: "Pour chilled cola slowly down the glass, press two lemon slices lightly, stir once, and serve immediately.", rationale: "Light expression and minimal stirring release citrus aroma while preserving carbonation.", stateCue: "Fine bubbles remain active and lemon aroma is clear without harsh bitterness." }, 2),
      ],
    },
  },
  {
    id: "kumquat-lemon-tea", itemType: "non-alcoholic-drink", zhName: "金桔柠檬茶", enName: "Kumquat Lemon Tea",
    zhDescription: "金桔与柠檬提供两层柑橘酸香，红茶构成清楚骨架，冷却后再校准甜度。",
    enDescription: "Kumquat and lemon provide layered citrus acidity over a clear black-tea base, with sweetness adjusted after chilling.",
    countryId: "china", regionId: "guangdong", cuisineId: "cantonese", techniqueIds: [], formIds: ["citrus-tea"], dietaryTagIds: ["vegan"],
    tastes: { sweet: 2, sour: 3, bitter: 1 }, aromaIds: ["citrusy", "fruity"], textureIds: [], characterIds: ["refreshing", "appetizing"],
    servingContextIds: ["lunch", "afternoon-tea"], weight: "light", temperature: "cold", storyType: "ingredient-agriculture-trade",
    claimZh: "本条目只记录金桔、柠檬与茶的现代冷饮组合，不宣称传统疗效或特定品牌来源。",
    claimEn: "This entry records a contemporary cold drink combining kumquat, lemon, and tea, without traditional-health claims or branded origin claims.",
    sources: [
      { title: "Kumquat", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/plant/kumquat", locator: "Fruit identity and edible peel", note: "Independent botanical and culinary context for kumquat.", type: "publisher" },
      { title: "Tea Preparation", publisher: "UK Tea & Infusions Association", url: "https://www.tea.co.uk/make-a-perfect-brew", locator: "Black tea infusion", note: "Independent preparation reference for black tea brewing.", type: "professional-organization" },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "玻璃杯中的金桔柠檬冰茶，有对半金桔、柠檬片和琥珀色茶汤",
    preparation: {
      kind: "brewing", time: { prepMinutes: 8, processMinutes: 12, totalMinutes: 20, activeMinutes: 15 }, yield: { amount: 2, unit: "serving" },
      inputs: [input("black-tea-leaf", 6), input("drinking-water", 500, "ml"), input("kumquat", 6, "piece"), input("lemon", 0.5, "piece"), input("granulated-sugar", 35), input("ice", 200)], toolIds: ["kettle", "teapot", "fine-strainer", "pitcher"],
      steps: [
        bilingualStep(1, { instruction: "红茶以 95°C 热水浸泡 3 分钟后完全滤出，趁热加入糖搅溶。", rationale: "及时出汤控制涩度，温热茶汤更容易溶糖。", stateCue: "茶汤清亮琥珀色，入口有茶味但不强涩。" }, { instruction: "Steep black tea in 95°C water for 3 minutes, strain fully, and dissolve sugar while warm.", rationale: "Prompt straining controls astringency; warm tea dissolves sugar efficiently.", stateCue: "The liquor is clear amber with tea structure but no harsh dryness." }, 5),
        bilingualStep(2, { instruction: "金桔对半去籽，轻压出汁；茶汤降至温凉后加入金桔汁、柠檬汁和果片。", rationale: "茶汤冷却后加入柑橘可保留清新香气并减少果皮苦味。", stateCue: "柑橘香明亮，果皮没有被压碎成泥。" }, { instruction: "Halve and seed kumquats, press gently, then add kumquat juice, lemon juice, and slices after the tea cools.", rationale: "Adding citrus to cooled tea preserves bright aroma and limits peel bitterness.", stateCue: "Citrus aroma is vivid and the peel is not crushed to pulp." }, 7),
        bilingualStep(3, { instruction: "装冰分杯，倒入调好的茶并品尝；酸度过尖时只加少量糖浆调整。", rationale: "低温会改变甜酸感受，最后校准比预先加重甜度更可控。", stateCue: "冷饮酸甜清楚，茶味仍可辨。" }, { instruction: "Divide over ice, taste, and add only a little syrup if the acidity is too sharp.", rationale: "Cold temperature changes sweetness perception, so final adjustment is more controlled.", stateCue: "Sweetness and acidity are clear while tea remains perceptible." }, 3),
      ],
    },
  },
  {
    id: "hong-kong-iced-lemon-tea", itemType: "non-alcoholic-drink", zhName: "港式冻柠茶", enName: "Hong Kong Iced Lemon Tea",
    zhDescription: "浓红茶、柠檬片与冰块组成的茶餐厅冷饮，以压香而非捣烂果皮控制香气和苦味。",
    enDescription: "A cha chaan teng cold drink of strong black tea, lemon, and ice, expressing rather than pulverizing peel to control aroma and bitterness.",
    countryId: "china", regionId: "guangdong", cuisineId: "cantonese", techniqueIds: [], formIds: ["iced-black-tea"], dietaryTagIds: ["vegan"],
    tastes: { sweet: 2, sour: 3, bitter: 2 }, aromaIds: ["citrusy"], textureIds: [], characterIds: ["refreshing", "appetizing"],
    servingContextIds: ["lunch", "afternoon-tea"], weight: "light", temperature: "cold", storyType: "everyday-life-festival",
    claimZh: "港式冻柠茶在本条目中作为茶餐厅日常饮品记录；糖量是可调整基线，不宣称唯一店铺比例。",
    claimEn: "This entry records Hong Kong iced lemon tea as an everyday cha chaan teng drink; sugar is an adjustable baseline, not a unique shop ratio.",
    sources: [
      { title: "Hong Kong Cha Chaan Teng Culture", publisher: "Hong Kong Tourism Board", url: "https://www.discoverhongkong.com/eng/explore/dining.html", locator: "Tea restaurant drinks", note: "Official cultural context for Hong Kong tea restaurants.", type: "official-cultural-institution" },
      { title: "Tea", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/topic/tea-beverage", locator: "Black tea preparation", note: "Independent tea identity and preparation context.", type: "publisher" },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "高玻璃杯中的港式冻柠茶，琥珀茶汤内有冰块和多片新鲜柠檬",
    preparation: {
      kind: "brewing", time: { prepMinutes: 6, processMinutes: 10, totalMinutes: 16, activeMinutes: 13 }, yield: { amount: 2, unit: "serving" },
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
    countryId: "china", regionId: "guangdong", cuisineId: "cantonese", techniqueIds: [], formIds: ["tea-coffee-blend"], dietaryTagIds: ["vegetarian"],
    tastes: { sweet: 2, bitter: 2 }, aromaIds: ["roasted", "toasty"], textureIds: ["creamy"], characterIds: ["comforting"],
    servingContextIds: ["breakfast", "afternoon-tea"], weight: "medium", temperature: "hot", storyType: "everyday-life-festival",
    claimZh: "鸳鸯在本条目中作为香港茶餐厅的茶咖混合饮品记录，不宣称单一创始店铺或专有比例。",
    claimEn: "This entry records yuenyeung as a Hong Kong cha chaan teng tea-and-coffee drink without claiming a sole originating shop or proprietary ratio.",
    sources: [
      { title: "Hong Kong Food Culture", publisher: "Hong Kong Tourism Board", url: "https://www.discoverhongkong.com/eng/explore/dining.html", locator: "Cha chaan teng beverage culture", note: "Official destination context for Hong Kong cafe beverages.", type: "official-cultural-institution" },
      { title: "Coffee Preparation", publisher: "National Coffee Association USA", url: "https://www.ncausa.org/About-Coffee/How-to-Brew-Coffee", locator: "Brewing variables", note: "Independent coffee preparation cross-check.", type: "professional-organization" },
    ],
    nutrition: { applicability: "applicable", source: "ingredient-derived" }, cost: { source: "ingredient-derived", currency: "CNY" },
    alt: "无品牌陶瓷杯中的浅棕色鸳鸯奶茶咖啡，表面有细薄奶泡",
    preparation: {
      kind: "brewing", time: { prepMinutes: 5, processMinutes: 10, totalMinutes: 15, activeMinutes: 13 }, yield: { amount: 2, unit: "serving" },
      inputs: [input("black-tea-leaf", 8), input("ground-coffee", 18), input("drinking-water", 500, "ml"), input("milk", 160, "ml"), input("granulated-sugar", 24)], toolIds: ["kettle", "teapot", "coffee-filter", "saucepan"],
      steps: [
        bilingualStep(1, { instruction: "红茶用 300 毫升 95°C 水浸泡 4 分钟并滤出；咖啡用余下热水滤泡。", rationale: "分开萃取便于各自控制强度，避免一种原料等待另一种而过度萃取。", stateCue: "茶汤深琥珀色，咖啡液清楚无大量细粉。" }, { instruction: "Steep tea in 300 ml water at 95°C for 4 minutes and strain; filter-brew the coffee with the remaining hot water.", rationale: "Separate extraction controls each strength and avoids over-extracting one while waiting for the other.", stateCue: "Tea is deep amber and coffee is clear without heavy sediment." }, 7),
        bilingualStep(2, { instruction: "牛奶和糖小火加热至糖溶解，加入茶与咖啡；先按茶 2、咖啡 1 的体积比例混合并品尝。", rationale: "先用基线比例再微调，能保留茶和咖啡的双重存在感。", stateCue: "入口先有奶与茶，随后仍能辨认烘焙咖啡香。" }, { instruction: "Warm milk and sugar gently until dissolved, add tea and coffee, and begin near a 2:1 tea-to-coffee volume ratio before tasting.", rationale: "A baseline ratio followed by adjustment preserves both tea and coffee presence.", stateCue: "Milk and tea lead, with roasted coffee still distinct afterward." }, 5),
      ],
    },
  },
  {
    id: "rioja-reserva-profile", itemType: "alcoholic-drink", zhName: "里奥哈 Reserva 产区档案", enName: "Rioja Reserva Regional Profile",
    zhDescription: "2026-09 v1 非品牌葡萄酒档案：仅记录 Rioja Reserva 法定陈年类别与克制服务提示，不代表酒庄、年份或购买建议。",
    enDescription: "2026-09 v1 non-brand wine profile bounded to the regulated Rioja Reserva aging category and restrained service guidance; it represents no winery, vintage, or buying advice.",
    countryId: "spain", cuisineId: "spanish", techniqueIds: [], formIds: ["wine-profile"], dietaryTagIds: ["vegan"],
    tastes: { sour: 2, bitter: 1 }, aromaIds: ["fruity", "toasty"], textureIds: ["silky"], characterIds: [],
    servingContextIds: ["dinner", "social-gathering"], weight: "medium", temperature: "room", storyType: "place-food-culture",
    claimZh: "Rioja Reserva 是受产区规则约束的陈年类别；本档案不为任何酒庄、年份、评分或商品作背书。",
    claimEn: "Rioja Reserva is an aging category governed by regional rules; this profile endorses no winery, vintage, score, or product.",
    sources: [
      { title: "Rioja Wine", publisher: "Consejo Regulador DOCa Rioja", url: "https://riojawine.com/en/", locator: "Official ageing-classification information", note: "Primary designation source for the bounded Reserva category.", type: "professional-organization", reliability: "primary" },
      { title: "Rioja (Wine)", publisher: "Wikipedia contributors", url: "https://en.wikipedia.org/wiki/Rioja_(wine)", locator: "Designation and ageing categories", note: "Independent general cross-check for Rioja classification; no tasting-note language is reused.", type: "open-educational-resource", reliability: "general-secondary" },
    ],
    nutrition: { applicability: "not-modeled", reason: "out-of-scope" }, cost: { source: "not-modeled" },
    alt: "无酒标醒酒器和小杯中的深红色里奥哈风格葡萄酒，不出现品牌包装",
    preparation: { kind: "serving-guidance", estimatedMinutes: 10, toolIds: ["wine-glass", "bottle-opener"], content: bilingual(
      { guidance: "仅对达到法定饮酒年龄且选择饮酒的成年人：按具体酒标和当地规定服务，可从 16–18°C、小杯慢饮开始；不开车时饮酒，不提供饮用量、健康效益或购买建议。" },
      { guidance: "For adults of legal drinking age who choose to drink: follow the bottle label and local rules; a restrained baseline is 16–18°C in a small glass. Do not drink and drive. No intake amount, health benefit, or purchase advice is provided." },
    ) },
  },
] as const;

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
      origin: { countryId: seed.countryId, ...(seed.regionId ? { regionId: seed.regionId } : {}) },
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
    publication: published,
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
    url: source.url,
    type: source.type,
    reliability: source.reliability,
    editorialNotes: source.note,
  })),
));

export const batchANonDishEvidence: readonly Evidence[] = Object.freeze(seeds.flatMap((seed) =>
  seed.sources.map((source, index) => m11Evidence({
    id: evidenceId(seed.id, index),
    sourceId: sourceId(seed.id, index),
    locator: source.locator,
    editorialNote: source.note,
  })),
));

export const batchANonDishStories: readonly Story[] = Object.freeze(seeds.map((seed) => m11Story({
  id: `${seed.id}-bounded-context`,
  itemId: seed.id,
  type: seed.storyType,
  kind: "documented-fact",
  evidenceIds: [evidenceId(seed.id, 0), evidenceId(seed.id, 1)],
  zh: {
    title: `${seed.zhName}：可核验的内容边界`,
    dek: "把身份、制作或服务方法与来源边界分开记录。",
    firstHeading: "来源支持的范围",
    firstParagraphs: [seed.claimZh],
    secondHeading: "Cooking Lab 的处理",
    secondParagraphs: ["本条目使用独立双语表达和可观察完成状态；来源只用于事实核对，不复制原文结构、图片、包装或营销描述。"],
    claim: seed.claimZh,
  },
  en: {
    title: `${seed.enName}: a verifiable editorial boundary`,
    dek: "Identity, preparation or service, and source limits are recorded separately.",
    firstHeading: "What the sources support",
    firstParagraphs: [seed.claimEn],
    secondHeading: "Cooking Lab treatment",
    secondParagraphs: ["The entry uses independent bilingual expression and observable completion cues. Sources are factual references only; their wording, structure, imagery, packaging, and marketing copy are not reproduced."],
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
  sourceIds: [sourceId(seed.id, 0), sourceId(seed.id, 1)],
  claim: seed.claimEn,
  evidenceIds: [evidenceId(seed.id, 0), evidenceId(seed.id, 1)],
})));

export const batchANonDishPackages: readonly LocalContentPackageV1[] = Object.freeze(
  batchANonDishItems.map(defineStandaloneContentPackage),
);

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
