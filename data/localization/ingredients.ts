import type { SupportedLocale } from "@/types/localization";

const englishIngredientLabels: Readonly<Record<string, string>> = Object.freeze({
  apple: "apple", "bell-pepper": "bell pepper", "black-tea-leaf": "black tea leaves",
  "brewed-espresso": "brewed espresso", butter: "butter", cardamom: "cardamom", carrot: "carrot",
  cilantro: "cilantro", cinnamon: "cinnamon", clove: "clove", "cocoa-powder": "cocoa powder",
  "coconut-milk": "coconut milk", "cooked-chickpea": "cooked chickpeas", cucumber: "cucumber",
  cumin: "cumin", "dried-hibiscus": "dried hibiscus", "drinking-water": "water", egg: "eggs",
  eggplant: "eggplant", "extra-virgin-olive-oil": "extra-virgin olive oil", feta: "feta",
  "fish-sauce": "fish sauce", "fresh-basil": "fresh basil", "fresh-chili": "fresh chili",
  "fresh-mint": "fresh mint", galangal: "galangal", garlic: "garlic", ginger: "ginger",
  "glutinous-rice": "glutinous rice", gochujang: "gochujang", "granulated-sugar": "granulated sugar",
  "ground-coffee": "ground coffee", "gunpowder-green-tea-leaf": "gunpowder green tea",
  ice: "ice", "kalamata-olive": "Kalamata olives", "ladyfinger-biscuit": "ladyfingers",
  "lapsang-souchong-tea-leaf": "Lapsang Souchong tea", lemon: "lemon", lemongrass: "lemongrass",
  lime: "lime", "longjing-tea-leaf": "Longjing tea leaves", "makrut-lime-leaf": "makrut lime leaves",
  mango: "mango", mascarpone: "mascarpone", milk: "milk", miso: "miso", mushroom: "mushrooms",
  oats: "oats", onion: "onion", oregano: "oregano", pasta: "pasta", "pork-belly": "pork belly",
  "pork-tenderloin": "lean pork", rice: "rice", "rice-noodles": "rice noodles", salt: "salt",
  scallion: "scallions", "sesame-paste": "sesame paste", "shaoxing-wine": "Shaoxing wine",
  shrimp: "shrimp", "soy-sauce": "soy sauce", spinach: "spinach",
  "sweetened-condensed-milk": "sweetened condensed milk", tomato: "tomatoes", tofu: "tofu",
  vinegar: "vinegar", "wheat-flour": "wheat flour", yogurt: "plain yogurt", zucchini: "zucchini",
  "beef-lean": "lean beef", "chicken-thigh": "chicken thighs", "chili-bean-paste": "chili bean paste",
  "cooking-oil": "cooking oil",
});

export function getIngredientLabel(id: string, zhLabel: string | undefined, locale: SupportedLocale): string {
  if (locale === "zh-CN") return zhLabel ?? `未知食材（${id}）`;
  return englishIngredientLabels[id] ?? id.replaceAll("-", " ");
}

export function hasReviewedEnglishIngredientLabel(id: string): boolean {
  return Boolean(englishIngredientLabels[id]);
}
