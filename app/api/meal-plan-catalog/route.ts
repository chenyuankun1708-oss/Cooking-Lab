import { getPublishedMealPlanCatalog } from "@/data/published-meal-plans";
import { isSupportedLocale } from "@/lib/localization";
import { mealPlanMaxItems } from "@/types/meal-plan";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as unknown;
    if (!isCatalogRequest(body)) return errorResponse();
    const catalog = getPublishedMealPlanCatalog(body.locale, body.itemIds);
    if (catalog.buildItems.length !== body.itemIds.length) return errorResponse();
    return Response.json(catalog, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return errorResponse();
  }
}

function isCatalogRequest(value: unknown): value is { locale: "zh-CN" | "en"; itemIds: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (!isSupportedLocale(String(candidate.locale))) return false;
  if (!Array.isArray(candidate.itemIds) || !candidate.itemIds.length || candidate.itemIds.length > mealPlanMaxItems) return false;
  if (!candidate.itemIds.every((itemId) => typeof itemId === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(itemId))) return false;
  return new Set(candidate.itemIds).size === candidate.itemIds.length;
}

function errorResponse(): Response {
  return Response.json({ error: "invalid-meal-plan-catalog-request" }, { status: 400 });
}
