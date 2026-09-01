export interface Nutrition { calories: number; protein: number; fat: number; saturatedFat: number; carbs: number; sugar: number; addedSugar: number; fiber: number; sodium: number }
export const emptyNutrition = (): Nutrition => ({ calories:0, protein:0, fat:0, saturatedFat:0, carbs:0, sugar:0, addedSugar:0, fiber:0, sodium:0 });
