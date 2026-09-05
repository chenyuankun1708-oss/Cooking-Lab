import { mealConstraintIds, type MealConstraintId } from "@/types/pairing";

export const mealConstraintRelaxationQueryKey = "relaxMeal";

export function parseMealConstraintRelaxations(params: URLSearchParams): MealConstraintId[] {
  const allowed = new Set<string>(mealConstraintIds);
  const selected = new Set(
    params.getAll(mealConstraintRelaxationQueryKey).filter((value): value is MealConstraintId => allowed.has(value)),
  );
  return mealConstraintIds.filter((id) => selected.has(id));
}

export function appendMealConstraintRelaxations(
  query: URLSearchParams,
  relaxedConstraintIds: readonly MealConstraintId[],
): URLSearchParams {
  const result = new URLSearchParams(query);
  result.delete(mealConstraintRelaxationQueryKey);
  const selected = new Set(relaxedConstraintIds);
  mealConstraintIds.forEach((id) => {
    if (selected.has(id)) result.append(mealConstraintRelaxationQueryKey, id);
  });
  return result;
}
