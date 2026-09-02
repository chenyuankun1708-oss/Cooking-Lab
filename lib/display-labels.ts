export const toolLabels: Record<string, string> = {
  blender: "搅拌机",
  colander: "滤篮",
  "cutting-board": "砧板",
  "frying-pan": "平底锅",
  knife: "刀",
  "mixing-bowl": "料理碗",
  oven: "烤箱",
  "rice-cooker": "电饭锅",
  saucepan: "汤锅",
  spatula: "锅铲",
  steamer: "蒸锅",
  tongs: "夹子",
};

export const tagLabels: Record<string, string> = {
  "high-fiber": "高纤维",
  "high-protein": "高蛋白",
  "no-added-sugar": "无添加糖",
  "one-pot": "一锅完成",
  quick: "快手",
  vegan: "纯素",
  "vegetable-rich": "蔬菜丰富",
  vegetarian: "蛋奶素",
};

export const heatLabels: Record<string, string> = {
  low: "小火",
  medium: "中火",
  high: "大火",
};

export const difficultyLabels: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "较难",
};

export const unitLabels: Record<string, string> = {
  g: "克",
  kg: "千克",
  ml: "毫升",
  piece: "个",
  tsp: "茶匙",
  tbsp: "汤匙",
};

export const getToolLabel = (tool: string) => toolLabels[tool] ?? tool;
export const getTagLabel = (tag: string) => tagLabels[tag] ?? tag;
export const getHeatLabel = (heat: string | undefined) => heat ? heatLabels[heat] : undefined;
export const getUnitLabel = (unit: string) => unitLabels[unit] ?? unit;
export const getDifficultyLabel = (difficulty: string) => difficultyLabels[difficulty] ?? difficulty;
