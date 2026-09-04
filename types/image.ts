export const recipeImageRoles = ["hero", "thumbnail", "step", "ingredient", "editorial"] as const;
export type RecipeImageRole = (typeof recipeImageRoles)[number];

export const recipeImageSources = [
  "self-created",
  "public-domain",
  "open-license",
  "licensed-stock",
  "ai-generated",
  "partner-provided",
  "other-permitted",
] as const;
export type RecipeImageSource = (typeof recipeImageSources)[number];

export const recipeImageLicenses = [
  "self-created",
  "public-domain",
  "cc0",
  "cc-by",
  "cc-by-sa",
  "cc-by-nc",
  "cc-by-nd",
  "cc-by-nc-sa",
  "cc-by-nc-nd",
  "unsplash-license",
  "pexels-license",
  "pixabay-content-license",
  "other-permitted",
  "unknown",
  "prohibited",
] as const;
export type RecipeImageLicense = (typeof recipeImageLicenses)[number];

export type RecipeImageAspectRatio = "3:2" | "4:3" | "16:9" | "1:1";
export type RecipeImageDelivery = "local" | "remote";

export interface RecipeImageFocalPoint {
  x: number;
  y: number;
}

export interface AiImageProvenance {
  generator: string;
  promptVersion: string;
  createdAt: string;
}

export interface RecipeImage {
  id: string;
  src: string;
  alt: string;
  role: RecipeImageRole;
  delivery: RecipeImageDelivery;
  width?: number;
  height?: number;
  aspectRatio: RecipeImageAspectRatio;
  focalPoint?: RecipeImageFocalPoint;
  source: RecipeImageSource;
  sourceUrl?: string;
  author?: string;
  license: RecipeImageLicense;
  licenseUrl?: string;
  attribution?: string;
  ai?: AiImageProvenance;
}
