import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "@/lib/stable-json";
import { createGameRecipeArtifactVersion } from "@/lib/game-recipe-validation";
import type { GameRecipeV1 } from "@/types/game-recipe";

/**
 * Fixes the 7 batch A tag violations and refreshes artifact versions:
 * - classic-mojito: cuisineIds ["cuban"] -> ["fusion"] (cuban is not in the Web taxonomy registry)
 * - classic-mojito / classic-shirley-temple / dark-and-stormy: drop the invalid "afternoon" serving context
 * - chocolate-mousse / creme-brulee / espresso-martini: characterIds "rich" -> "hearty"
 */
/** Replaces the invalid "rich" character id with the legal "hearty" equivalent (string-level fix). */
function replaceRichCharacter(recipe: GameRecipeV1): void {
  const flavor = recipe.database?.flavor;
  if (!flavor) return;
  const characters = flavor.characterIds as unknown as string[] | undefined;
  if (characters?.includes("rich")) {
    flavor.characterIds = characters.map((id) => (id === "rich" ? "hearty" : id)) as never;
  }
}

/** Replaces the invalid "moist" texture id with the legal "tender" equivalent. */
function replaceMoistTexture(recipe: GameRecipeV1): void {
  const flavor = recipe.database?.flavor;
  if (!flavor) return;
  const textures = flavor.textureIds as unknown as string[] | undefined;
  if (textures?.includes("moist")) {
    flavor.textureIds = textures.map((id) => (id === "moist" ? "tender" : id)) as never;
  }
}

const fixes: Record<string, (recipe: GameRecipeV1) => void> = {
  "classic-mojito": (recipe) => {
    const tags = recipe.database!.tags;
    if (tags.cuisineIds?.includes("cuban")) {
      tags.cuisineIds = tags.cuisineIds.map((id) => (id === "cuban" ? "fusion" : id));
    }
    if (tags.servingContextIds?.includes("afternoon")) {
      tags.servingContextIds = tags.servingContextIds.filter((id) => id !== "afternoon");
    }
  },
  "classic-shirley-temple": (recipe) => {
    const tags = recipe.database!.tags;
    if (tags.servingContextIds?.includes("afternoon")) {
      tags.servingContextIds = tags.servingContextIds.filter((id) => id !== "afternoon");
    }
  },
  "dark-and-stormy": (recipe) => {
    const tags = recipe.database!.tags;
    if (tags.servingContextIds?.includes("afternoon")) {
      tags.servingContextIds = tags.servingContextIds.filter((id) => id !== "afternoon");
    }
  },
  "chocolate-mousse": replaceRichCharacter,
  "creme-brulee": replaceRichCharacter,
  "espresso-martini": replaceRichCharacter,
  "banana-oat-muffins": replaceMoistTexture,
  "chocolate-chip-banana-bread": replaceMoistTexture,
};

let fixed = 0;
for (const [slug, apply] of Object.entries(fixes)) {
  const path = resolve(process.cwd(), "game-data/source/recipes", `${slug}.json`);
  const recipe = JSON.parse(readFileSync(path, "utf8")) as GameRecipeV1;
  apply(recipe);
  // Refresh artifact version and scenario baselines (payload changed).
  recipe.artifactVersion = createGameRecipeArtifactVersion(recipe);
  for (const scenario of recipe.scenarios) scenario.baselineArtifactVersion = recipe.artifactVersion;
  writeFileSync(path, stableJson(recipe), "utf8");
  fixed += 1;
}
process.stdout.write(`Fixed ${fixed} recipes\n`);
