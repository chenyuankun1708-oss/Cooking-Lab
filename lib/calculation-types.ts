export type CalculationWarningCode =
  | "MISSING_INGREDIENT"
  | "UNIT_CONVERSION"
  | "INVALID_NUTRITION"
  | "INVALID_PRICE"
  | "NON_FINITE_RESULT";

export interface CalculationWarning {
  ingredientId: string;
  code: CalculationWarningCode;
  message: string;
}
