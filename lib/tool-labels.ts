import type { SupportedLocale } from "@/types/localization";

export const toolLabels: Readonly<Record<string, string>> = Object.freeze({
  "baking-tray": "烤盘",
  "baking-dish": "烤皿",
  blender: "搅拌机",
  colander: "滤篮",
  "coffee-filter": "咖啡滤器",
  "cutting-board": "砧板",
  "frying-pan": "平底锅",
  "fine-strainer": "细滤网",
  "espresso-machine": "意式咖啡机",
  gaiwan: "盖碗",
  glass: "玻璃杯",
  "grill-pan": "烤纹锅",
  "heavy-pot": "厚底锅",
  "heatproof-bowl": "耐热碗",
  "heatproof-plate": "耐热盘",
  knife: "刀",
  kettle: "烧水壶",
  "milk-pitcher": "拉花奶缸",
  "mixing-bowl": "料理碗",
  oven: "烤箱",
  "phin-filter": "越南滴漏壶",
  pitcher: "冷水壶",
  portafilter: "咖啡机手柄",
  "pour-over-dripper": "手冲滤杯",
  refrigerator: "冰箱",
  "rice-cooker": "电饭锅",
  "sake-cup": "清酒杯",
  saucepan: "汤锅",
  scale: "电子秤",
  "small-saucepan": "小汤锅",
  "soup-pot": "汤锅",
  "square-dish": "方形盛皿",
  spatula: "锅铲",
  steamer: "蒸锅",
  teapot: "茶壶",
  timer: "计时器",
  tongs: "夹子",
  "v60-dripper": "V60 滤杯",
  whisk: "打蛋器",
  "bottle-opener": "开瓶器",
  "paper-filter": "滤纸",
  "wine-glass": "酒杯",
});

const fallbackLabel = (value: string) => value.replace(/[-_]+/g, " ").trim();

const englishToolLabels: Readonly<Record<string, string>> = Object.freeze({
  "baking-tray": "baking tray", "baking-dish": "baking dish", blender: "blender", colander: "colander",
  "coffee-filter": "coffee filter", "cutting-board": "cutting board", "frying-pan": "frying pan", "fine-strainer": "fine strainer",
  "espresso-machine": "espresso machine", gaiwan: "gaiwan", glass: "glass", "grill-pan": "grill pan",
  "heavy-pot": "heavy pot", "heatproof-bowl": "heatproof bowl", "heatproof-plate": "heatproof plate",
  knife: "knife", kettle: "kettle", "milk-pitcher": "milk pitcher", "mixing-bowl": "mixing bowl", oven: "oven", "phin-filter": "phin filter",
  pitcher: "pitcher", portafilter: "portafilter", "pour-over-dripper": "pour-over dripper", refrigerator: "refrigerator", "rice-cooker": "rice cooker",
  "sake-cup": "sake cup", saucepan: "saucepan", scale: "scale", "small-saucepan": "small saucepan",
  "soup-pot": "soup pot", "square-dish": "square dish", spatula: "spatula", steamer: "steamer",
  teapot: "teapot", timer: "timer", tongs: "tongs", "v60-dripper": "V60 dripper", whisk: "whisk",
  "bottle-opener": "bottle opener", "paper-filter": "paper filter", "wine-glass": "wine glass",
});

export const getToolLabel = (tool: string, locale: SupportedLocale = "zh-CN") =>
  locale === "zh-CN" ? toolLabels[tool] ?? fallbackLabel(tool) : englishToolLabels[tool] ?? fallbackLabel(tool);
