import type { Recipe, RecipeIngredient } from "@/types/recipe";
import type { Unit } from "@/types/ingredient";
import { additionalRecipes } from "./additional-recipes";

const ingredient = (ingredientId: string, amount: number, unit: Unit = "g", note?: string): RecipeIngredient => ({
  ingredientId,
  amount,
  unit,
  optional: false,
  ...(note ? { note } : {}),
});

const recipe = (value: Omit<Recipe, "id" | "dataQuality" | "nutrition" | "cost">): Recipe => ({
  ...value,
  id: value.slug,
  dataQuality: "demo-estimated",
  cost: { currency: "CNY", basis: "按静态食材参考价估算" },
});

const coreRecipes: Recipe[] = [
  recipe({
    slug: "tomato-scrambled-eggs",
    name: "番茄炒蛋",
    description: "分段处理鸡蛋和番茄，兼顾嫩度与自然酸甜汁水。",
    cuisine: "中式",
    category: "主菜",
    servings: 2,
    ingredients: [
      ingredient("egg", 3, "piece"), ingredient("tomato", 2, "piece"),
      ingredient("cooking-oil", 8), ingredient("salt", 1.5),
    ],
    cooking: { prepTime: 6, cookTime: 9, totalTime: 15, oil: 8, salt: 1.5, addedSugar: 0, difficulty: "easy", method: "炒" },
    tools: ["knife", "cutting-board", "mixing-bowl", "frying-pan"],
    tags: ["quick", "vegetarian", "no-added-sugar"],
    steps: [
      { order: 1, instruction: "番茄切成大小接近的块，鸡蛋充分打散。", duration: 4, heat: "none", why: "蛋液均匀可减少局部过熟；番茄切面增多有利于释放汁水。" },
      { order: 2, instruction: "锅烧热后加油，中火把鸡蛋炒至刚凝固，立即盛出。", duration: 3, heat: "medium", why: "鸡蛋离火后仍有余热，提前盛出能避免后续回锅时变老。" },
      { order: 3, instruction: "原锅炒软番茄，分次加盐调味，再倒回鸡蛋快速拌匀。", duration: 6, heat: "medium", why: "先让番茄形成酱汁，再回锅鸡蛋，可缩短鸡蛋二次受热时间；分次调味能降低过咸风险。" },
    ],
    principles: ["分段加热控制蛋白质凝固程度", "利用番茄自身水分形成酱汁"],
  }),
  recipe({
    slug: "lemon-chicken-breast",
    name: "柠檬煎鸡胸",
    description: "通过调整厚度、擦干表面和静置，改善鸡胸肉的上色与多汁度。",
    cuisine: "融合",
    category: "主菜",
    servings: 1,
    ingredients: [
      ingredient("chicken-breast", 200), ingredient("lemon", 0.5, "piece", "取汁并保留少量表皮屑"),
      ingredient("cooking-oil", 6), ingredient("salt", 1),
    ],
    cooking: { prepTime: 8, cookTime: 12, totalTime: 20, oil: 6, salt: 1, addedSugar: 0, difficulty: "easy", method: "煎" },
    tools: ["knife", "cutting-board", "frying-pan", "tongs"],
    tags: ["high-protein", "quick", "no-added-sugar"],
    steps: [
      { order: 1, instruction: "将鸡胸厚处片开至约 1.5 厘米厚，擦干后加盐。", duration: 5, heat: "none", why: "厚度均匀使中心同步升温；表面干燥可减少蒸发降温，更利于褐变。" },
      { order: 2, instruction: "热锅加油，中火煎至一面上色后翻面，降低火力煎熟。", duration: 9, heat: "medium", why: "先用较高温度形成香气，再降低火力，可减少外层过熟而中心尚未均匀升温。" },
      { order: 3, instruction: "离火静置 3 分钟，食用前淋柠檬汁并撒少量表皮屑。", duration: 3, heat: "none", why: "静置让汁液重新分布；柠檬在离火后加入可保留清新挥发香气。" },
    ],
    principles: ["控制厚度改善受热均匀性", "美拉德反应提供香气", "静置减少切开时汁液流失"],
  }),
  recipe({
    slug: "broccoli-chicken",
    name: "西兰花炒鸡胸",
    description: "用短时焯水协调西兰花与鸡肉不同的成熟速度。",
    cuisine: "中式",
    category: "主菜",
    servings: 2,
    ingredients: [
      ingredient("chicken-breast", 240), ingredient("broccoli", 300),
      ingredient("cooking-oil", 8), ingredient("salt", 1.6),
    ],
    cooking: { prepTime: 10, cookTime: 12, totalTime: 22, oil: 8, salt: 1.6, addedSugar: 0, difficulty: "easy", method: "炒" },
    tools: ["knife", "cutting-board", "saucepan", "frying-pan"],
    tags: ["high-protein", "vegetable-rich", "no-added-sugar"],
    steps: [
      { order: 1, instruction: "鸡胸逆纹切片并擦干；西兰花切成大小接近的小朵。", duration: 7, heat: "none", why: "逆纹切片可缩短肌纤维，大小一致则有助于同步熟化。" },
      { order: 2, instruction: "西兰花入沸水焯 60 秒，捞出充分沥干。", duration: 2, heat: "high", why: "预先焯水可缩短炒制时间；沥干能避免入锅后大量水汽降低锅温。" },
      { order: 3, instruction: "热锅加油炒熟鸡肉，再加入西兰花和盐快速翻匀。", duration: 8, heat: "medium", why: "先单独控制鸡肉熟度，再合炒蔬菜，可避免鸡肉夹生或西兰花过软。" },
    ],
    principles: ["预处理协调不同食材熟化速度", "减少表面水分以维持炒锅温度"],
  }),
  recipe({
    slug: "mushroom-tofu-rice",
    name: "蘑菇豆腐电饭锅饭",
    description: "让米饭吸水、豆腐加热和蘑菇释鲜在同一电饭锅程序中完成。",
    cuisine: "中式",
    category: "主食",
    servings: 2,
    ingredients: [
      ingredient("rice", 150), ingredient("tofu", 250), ingredient("mushroom", 180),
      ingredient("cooking-oil", 5), ingredient("salt", 1.5),
    ],
    cooking: { prepTime: 10, cookTime: 30, totalTime: 40, oil: 5, salt: 1.5, addedSugar: 0, difficulty: "easy", method: "电饭锅" },
    tools: ["knife", "cutting-board", "rice-cooker"],
    tags: ["one-pot", "vegan", "staple", "no-added-sugar"],
    steps: [
      { order: 1, instruction: "大米淘洗后按日常水量浸泡 10 分钟；蘑菇切片，豆腐切 2 厘米块。", duration: 10, heat: "none", why: "短时浸泡让米粒吸水更均匀；配料尺寸适中可减少焖制时碎裂。" },
      { order: 2, instruction: "米和水先入锅，表面铺蘑菇与豆腐，加入油和盐后启动煮饭程序。", duration: 27, heat: "medium", why: "配料铺在上层可避免干扰锅底温控，也让蒸汽温和加热豆腐。" },
      { order: 3, instruction: "程序结束后焖 5 分钟，再从锅底向上轻轻翻匀。", duration: 5, heat: "none", why: "焖置让锅内水分重新分布；最后翻匀可减少豆腐在烹饪过程中过度破碎。" },
    ],
    principles: ["蒸汽与吸水共同完成焖制", "利用静置平衡米饭内部水分"],
  }),
];

export const recipes: Recipe[] = [...coreRecipes, ...additionalRecipes];
