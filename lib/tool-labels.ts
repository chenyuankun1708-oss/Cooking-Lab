export const toolLabels: Readonly<Record<string, string>> = Object.freeze({
  "baking-tray": "烤盘",
  blender: "搅拌机",
  colander: "滤篮",
  "cutting-board": "砧板",
  "frying-pan": "平底锅",
  "grill-pan": "烤纹锅",
  "heatproof-bowl": "耐热碗",
  "heatproof-plate": "耐热盘",
  knife: "刀",
  "mixing-bowl": "料理碗",
  oven: "烤箱",
  "rice-cooker": "电饭锅",
  saucepan: "汤锅",
  spatula: "锅铲",
  steamer: "蒸锅",
  tongs: "夹子",
});

const fallbackLabel = (value: string) => value.replace(/[-_]+/g, " ").trim();

export const getToolLabel = (tool: string) => toolLabels[tool] ?? fallbackLabel(tool);
