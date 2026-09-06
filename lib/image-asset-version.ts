import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RecipeImage } from "@/types/image";

export interface ImageAssetVersion {
  imageId: string;
  sha256: string;
}

export function createImageAssetVersions(images: readonly RecipeImage[]): ImageAssetVersion[] {
  return images
    .filter((image) => image.delivery === "local")
    .map((image) => ({
      imageId: image.id,
      sha256: createHash("sha256")
        .update(readFileSync(resolve(process.cwd(), "public", image.src.replace(/^\//, ""))))
        .digest("hex"),
    }))
    .sort((left, right) => left.imageId.localeCompare(right.imageId));
}
