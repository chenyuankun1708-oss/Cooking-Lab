import type { Recipe } from "@/types/recipe";
import { additionalRecipes } from "./additional-recipes";
import { chinaExpansionRecipes } from "./recipes-china";
import { europeExpansionRecipes } from "./recipes-europe";
import { eastAsiaExpansionRecipes } from "./recipes-east-asia";
import { southeastAsiaExpansionRecipes } from "./recipes-southeast-asia";
import { globalExpansionRecipes } from "./recipes-global";
import { buildRecipe } from "./recipe-factories";

const coreRecipes: Recipe[] = [
  buildRecipe({
    slug: "tomato-scrambled-eggs",
    name: "番茄炒蛋",
    description: "分段处理鸡蛋和番茄，兼顾嫩度与自然酸甜汁水。",
    heroImageId: "tomato-scrambled-eggs-hero",
    publication: { status: "published" },
    taxonomy: {
      countryId: "china",
      cuisineId: "chinese",
      techniqueIds: ["stir-fry"],
      dishTypeId: "main-dish",
      dietaryTagIds: ["vegetarian"],
    },
    servings: 2,
    ingredients: [
      ["egg", 3, "piece"],
      ["tomato", 2, "piece"],
      ["cooking-oil", 8],
      ["salt", 1.5],
    ],
    prep: 6,
    cook: 9,
    oil: 8,
    salt: 1.5,
    tools: ["knife", "cutting-board", "mixing-bowl", "frying-pan"],
    steps: [
      ["番茄去蒂后切成约 2 厘米块；鸡蛋打入碗中，加入少量盐搅至蛋清蛋黄完全融合。", "番茄大小接近更容易同步出汁；蛋液充分混合可减少局部蛋白过早凝固。"],
      ["锅烧热后加油，转中火倒入蛋液；边缘凝固、中心仍有光泽时，用锅铲推成大块并立即盛出。", "鸡蛋离火后仍会继续熟化，在中心尚湿润时盛出，回锅后才不会变干。", "medium"],
      ["原锅放入番茄和剩余盐，中火翻炒；番茄边缘塌软、锅底出现持续冒泡的红色汁水时转小火。", "盐能帮助番茄释放水分，先把汁水炒出来，成品不必额外加水也能裹住鸡蛋。", "medium"],
      ["倒回鸡蛋，轻轻翻拌 20 至 30 秒；蛋块均匀裹汁且中心不再流动时立即关火。", "最后只做短时复热，既让味道结合，也避免鸡蛋在番茄汁中久煮变硬。", "low"],
    ],
    principles: ["分段加热控制蛋白质凝固程度", "利用番茄自身水分形成酱汁"],
  }),
  buildRecipe({
    slug: "lemon-chicken-breast",
    name: "柠檬煎鸡胸",
    description: "通过调整厚度、擦干表面和静置，改善鸡胸肉的上色与多汁度。",
    taxonomy: {
      cuisineId: "fusion",
      techniqueIds: ["pan-fry"],
      dishTypeId: "main-dish",
    },
    culture: {
      summary: "这是一道面向工作日晚餐的现代轻食鸡胸做法，强调清爽调味而不是厚重酱汁。",
      modernContext: "它适合 Cooking Lab 当前“可解释推荐 + 工作日晚餐”场景，也贴近未来国际化内容面。",
    },
    servings: 1,
    ingredients: [
      ["chicken-breast", 200],
      ["lemon", 0.5, "piece", "取汁并保留少量表皮屑"],
      ["cooking-oil", 6],
      ["salt", 1],
    ],
    prep: 8,
    cook: 12,
    oil: 6,
    salt: 1,
    tools: ["knife", "cutting-board", "frying-pan", "tongs"],
    steps: [
      ["将鸡胸厚处片开至约 1.5 厘米厚，擦干后加盐。", "厚度均匀使中心同步升温；表面干燥可减少蒸发降温，更利于褐变。"],
      ["热锅加油，中火煎至一面上色后翻面，降低火力煎熟。", "先用较高温度形成香气，再降低火力，可减少外层过熟而中心尚未均匀升温。", "medium"],
      ["离火静置 3 分钟，食用前淋柠檬汁并撒少量表皮屑。", "静置让汁液重新分布；柠檬在离火后加入可保留清新挥发香气。"],
    ],
    principles: ["控制厚度改善受热均匀性", "美拉德反应提供香气", "静置减少切开时汁液流失"],
  }),
  buildRecipe({
    slug: "broccoli-chicken",
    name: "西兰花炒鸡胸",
    description: "用短时焯水协调西兰花与鸡肉不同的成熟速度。",
    taxonomy: {
      countryId: "china",
      cuisineId: "chinese",
      techniqueIds: ["stir-fry"],
      dishTypeId: "main-dish",
      browseTagIds: ["vegetable-rich"],
    },
    servings: 2,
    ingredients: [
      ["chicken-breast", 240],
      ["broccoli", 300],
      ["cooking-oil", 8],
      ["salt", 1.6],
    ],
    prep: 10,
    cook: 12,
    oil: 8,
    salt: 1.6,
    tools: ["knife", "cutting-board", "saucepan", "frying-pan"],
    steps: [
      ["鸡胸逆纹切片并擦干；西兰花切成大小接近的小朵。", "逆纹切片可缩短肌纤维，大小一致则有助于同步熟化。"],
      ["西兰花入沸水焯 60 秒，捞出充分沥干。", "预先焯水可缩短炒制时间；沥干能避免入锅后大量水汽降低锅温。", "high"],
      ["热锅加油炒熟鸡肉，再加入西兰花和盐快速翻匀。", "先单独控制鸡肉熟度，再合炒蔬菜，可避免鸡肉夹生或西兰花过软。", "medium"],
    ],
    principles: ["预处理协调不同食材熟化速度", "减少表面水分以维持炒锅温度"],
  }),
  buildRecipe({
    slug: "mushroom-tofu-rice",
    name: "蘑菇豆腐电饭锅饭",
    description: "让米饭吸水、豆腐加热和蘑菇释鲜在同一电饭锅程序中完成。",
    taxonomy: {
      countryId: "china",
      cuisineId: "chinese",
      techniqueIds: ["rice-cook"],
      dishTypeId: "staple",
      dietaryTagIds: ["vegan"],
      browseTagIds: ["one-pot"],
    },
    culture: {
      summary: "这道电饭锅饭用单次吸水焖熟的流程，把主食和配菜整合进同一锅里。",
      modernContext: "它体现了 Cooking Lab 想保留的“实用料理科学”一面：用设备逻辑解释为什么能一次熟成。",
    },
    servings: 2,
    ingredients: [
      ["rice", 150],
      ["tofu", 250],
      ["mushroom", 180],
      ["cooking-oil", 5],
      ["salt", 1.5],
    ],
    prep: 10,
    cook: 30,
    oil: 5,
    salt: 1.5,
    tools: ["knife", "cutting-board", "rice-cooker"],
    steps: [
      ["大米淘洗后按日常水量浸泡 10 分钟；蘑菇切片，豆腐切 2 厘米块。", "短时浸泡让米粒吸水更均匀；配料尺寸适中可减少焖制时碎裂。"],
      ["米和水先入锅，表面铺蘑菇与豆腐，加入油和盐后启动煮饭程序。", "配料铺在上层可避免干扰锅底温控，也让蒸汽温和加热豆腐。", "medium"],
      ["程序结束后焖 5 分钟，再从锅底向上轻轻翻匀。", "焖置让锅内水分重新分布；最后翻匀可减少豆腐在烹饪过程中过度破碎。"],
    ],
    principles: ["蒸汽与吸水共同完成焖制", "利用静置平衡米饭内部水分"],
  }),
];

export const recipes: Recipe[] = [...coreRecipes, ...additionalRecipes, ...chinaExpansionRecipes, ...europeExpansionRecipes, ...eastAsiaExpansionRecipes, ...southeastAsiaExpansionRecipes, ...globalExpansionRecipes];
