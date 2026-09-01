import type { Ingredient, Unit } from "@/types/ingredient";
export class UnitConversionError extends Error {}
export function toGrams(amount:number,unit:Unit,ingredient:Ingredient):number {
  if(!Number.isFinite(amount)||amount<0) throw new UnitConversionError("用量必须是非负有限数值");
  if(unit==="g") return amount;
  if(unit==="kg") return amount*1000;
  const weight=ingredient.approximateUnitWeight?.[unit];
  if(weight===undefined) throw new UnitConversionError(`${ingredient.name} 缺少 ${unit} 到克的换算数据`);
  return amount*weight;
}
