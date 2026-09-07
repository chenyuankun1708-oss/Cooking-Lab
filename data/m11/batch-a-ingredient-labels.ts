// These labels are scoped to the standalone Batch A translation path. Keeping
// them out of the legacy registry avoids silently changing previously reviewed
// M10 English artifacts that happen to use the same ingredient IDs.
export const m11BatchAEnglishIngredientLabels = Object.freeze({
  "black-pepper": "black pepper",
  broccoli: "broccoli",
  "chicken-breast": "chicken breast",
  "cooked-rice": "cooked rice",
  "corn-tortilla": "corn tortillas",
  kimchi: "kimchi",
  paprika: "paprika",
  potato: "potatoes",
  salmon: "salmon",
} satisfies Readonly<Record<string, string>>);
