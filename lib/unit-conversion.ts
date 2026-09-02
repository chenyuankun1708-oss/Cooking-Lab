import type { Ingredient, Unit } from "@/types/ingredient";

export type UnitConversionErrorCode = "INVALID_AMOUNT" | "UNSUPPORTED_UNIT" | "MISSING_UNIT_WEIGHT" | "INVALID_UNIT_WEIGHT" | "NON_FINITE_RESULT";

export class UnitConversionError extends Error {
  constructor(public readonly code: UnitConversionErrorCode, message: string) {
    super(message);
    this.name = "UnitConversionError";
  }
}

const supportedUnits = new Set<Unit>(["g", "kg", "ml", "piece", "tsp", "tbsp"]);

export function toGrams(amount: number, unit: Unit, ingredient: Ingredient): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new UnitConversionError("INVALID_AMOUNT", "用量必须是正有限数");
  }
  if (!supportedUnits.has(unit)) {
    throw new UnitConversionError("UNSUPPORTED_UNIT", `不支持的单位: ${String(unit)}`);
  }
  if (unit === "g") return amount;
  if (unit === "kg") {
    const grams = amount * 1000;
    if (!Number.isFinite(grams)) throw new UnitConversionError("NON_FINITE_RESULT", "kg 到克的换算结果超出有限数范围");
    return grams;
  }

  const unitWeight = ingredient.approximateUnitWeight?.[unit];
  if (unitWeight === undefined) {
    throw new UnitConversionError("MISSING_UNIT_WEIGHT", `${ingredient.name} 缺少 ${unit} 到克的近似换算数据`);
  }
  if (!Number.isFinite(unitWeight) || unitWeight <= 0) {
    throw new UnitConversionError("INVALID_UNIT_WEIGHT", `${ingredient.name} 的 ${unit} 近似克重必须是正有限数`);
  }
  const grams = amount * unitWeight;
  if (!Number.isFinite(grams)) throw new UnitConversionError("NON_FINITE_RESULT", `${ingredient.name} 的单位换算结果超出有限数范围`);
  return grams;
}
