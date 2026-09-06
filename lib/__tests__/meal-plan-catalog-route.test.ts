import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/meal-plan-catalog/route";
import type { MealPlanCatalog } from "@/data/published-meal-plans";
import { mealPlanMaxItems } from "@/types/meal-plan";

describe("meal plan catalog route", () => {
  it("returns only requested published planning data", async () => {
    const response = await POST(request({ locale: "en", itemIds: ["home-mapo-tofu"] }));
    const catalog = await response.json() as MealPlanCatalog;

    expect(response.status).toBe(200);
    expect(catalog.buildItems.map((item) => item.id)).toEqual(["home-mapo-tofu"]);
    expect(Object.keys(catalog.itemLabels)).toEqual(["home-mapo-tofu"]);
    expect(Object.keys(catalog.taskLabels).every((id) => id.startsWith("home-mapo-tofu:"))).toBe(true);
    expect(Object.keys(catalog.stepMetadata)).toEqual(["home-mapo-tofu"]);
    expect(response.headers.get("cache-control")).toBe("private, no-store");

    const zhResponse = await POST(request({ locale: "zh-CN", itemIds: ["home-mapo-tofu"] }));
    const zhCatalog = await zhResponse.json() as MealPlanCatalog;
    expect(zhCatalog.itemLabels["home-mapo-tofu"].name).not.toBe(catalog.itemLabels["home-mapo-tofu"].name);
  });

  it("fails closed for unpublished, duplicate or oversized requests", async () => {
    expect((await POST(request({ locale: "en", itemIds: ["not-published"] }))).status).toBe(400);
    expect((await POST(request({ locale: "en", itemIds: ["home-mapo-tofu", "home-mapo-tofu"] }))).status).toBe(400);
    expect((await POST(request({
      locale: "en",
      itemIds: Array.from({ length: mealPlanMaxItems + 1 }, (_, index) => `item-${index}`),
    }))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/meal-plan-catalog", { method: "POST", body: "{" }))).status).toBe(400);
  });
});

function request(body: unknown): Request {
  return new Request("http://localhost/api/meal-plan-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
