export const isNonNegativeFinite = (value: number): boolean => Number.isFinite(value) && value >= 0;
export const isPositiveFinite = (value: number): boolean => Number.isFinite(value) && value > 0;
export const isSlug = (value: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
