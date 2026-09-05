import type { CulinaryItem } from "@/types/culinary";
import { nativeDessertItems } from "./items-desserts";
import { nativeDishItems } from "./items-dishes";
import { nativeDrinkItems } from "./items-drinks";

export const nativeCulinaryItems = [
  ...nativeDishItems,
  ...nativeDessertItems,
  ...nativeDrinkItems,
] as const satisfies readonly CulinaryItem[];
