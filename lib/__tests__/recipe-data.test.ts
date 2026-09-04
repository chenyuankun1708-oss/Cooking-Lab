import { describe, expect, it } from "vitest";
import { ingredients } from "@/data/ingredients";
import { recipeImages } from "@/data/recipe-images";
import { recipes } from "@/data/recipes";
import { recipeFlavorProfiles } from "@/data/recipe-flavors";
import type { Recipe } from "@/types/recipe";
import { calculateCost } from "../cost";
import { cuisines, getTaxonomyLabel, techniques } from "@/data/taxonomy";
import { validateDataset } from "../dataset-validation";
import { localIngredientRepository as repository } from "../ingredient-repository";
import { calculateNutrition } from "../nutrition";
import { validateRecipes } from "../recipe-validation";

describe("recipe dataset", () => {
  it("contains the planned recipes without dangling ingredient references", () => {
    expect(recipes).toHaveLength(100);
    expect(validateRecipes(recipes, ingredients)).toEqual([]);
    expect(validateDataset(ingredients, recipes, recipeImages)).toEqual([]);
  });

  it("gives every recipe one canonical, serializable Flavor Profile", () => {
    expect(Object.keys(recipeFlavorProfiles)).toHaveLength(100);
    expect(recipes.every((recipe) => recipeFlavorProfiles[recipe.slug] === recipe.flavor)).toBe(true);
    expect(recipes.every((recipe) => Object.keys(recipe.flavor.tastes).length > 0)).toBe(true);
    expect(() => JSON.stringify(recipes.map((recipe) => recipe.flavor))).not.toThrow();
  });

  it("covers the planned cooking methods and stable metadata values", () => {
    const techniqueIds = new Set(recipes.flatMap((recipe) => recipe.taxonomy.techniques));
    for (const techniqueId of ["pan-fry", "stir-fry", "steam", "boil", "simmer", "stew", "braise", "roast", "dress", "rice-cook", "sear", "bake", "blanch", "poach", "grill", "cold-mix"]) {
      expect(techniqueIds.has(techniqueId), `missing technique ${techniqueId}`).toBe(true);
    }
    expect(new Set(recipes.map((recipe) => recipe.taxonomy.cuisine.cuisineId)).size).toBeGreaterThanOrEqual(8);
    expect([...techniqueIds].every((id) => Boolean(techniques[id]))).toBe(true);
    expect([...new Set(recipes.map((recipe) => recipe.taxonomy.cuisine.cuisineId))].every((id) => Boolean(cuisines[id]))).toBe(true);
  });

  it("keeps recipe.taxonomy as the canonical source and reserves quick as a derived browse tag", () => {
    expect(recipes.every((recipe) => "taxonomy" in recipe)).toBe(true);
    expect(recipes.every((recipe) => !("cuisine" in recipe) && !("category" in recipe) && !("tags" in recipe))).toBe(true);
    expect(recipes.every((recipe) => recipe.taxonomy.browseTagIds?.includes("quick") !== true)).toBe(true);
    const forbidden = new Set(["high-protein", "high-fiber", "low-oil", "low-salt", "low-calorie", "no-added-sugar"]);
    expect(recipes.every((recipe) => (recipe.taxonomy.browseTagIds ?? []).every((tag) => !forbidden.has(tag)))).toBe(true);
  });

  it("resolves taxonomy machine values through localized labels", () => {
    expect(getTaxonomyLabel("cuisines", "chinese", "zh-CN")).toBe("中式");
    expect(getTaxonomyLabel("cuisines", "chinese", "en")).toBe("Chinese");
    expect(getTaxonomyLabel("techniques", "stir-fry", "zh-CN")).toBe("炒");
    expect(getTaxonomyLabel("mealOccasions", "breakfast", "zh-CN")).toBe("早餐");
  });

  it("covers the MVP protein and staple ingredient groups", () => {
    const used = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((item) => item.ingredientId)));
    for (const id of [
      "chicken-breast", "chicken-thigh", "beef-lean", "pork-tenderloin", "salmon", "shrimp",
      "egg", "tofu", "dry-lentil", "rice", "noodles", "potato", "sweet-potato", "oats",
    ]) {
      expect(used.has(id), `unused required ingredient ${id}`).toBe(true);
    }
  });

  it("uses every ingredient and maintains broad coverage without hard quotas", () => {
    const used = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((item) => item.ingredientId)));
    expect(ingredients.slice(30).every((ingredient) => used.has(ingredient.id))).toBe(true);
    expect(new Set(recipes.map((recipe) => recipe.taxonomy.origin?.countryId).filter(Boolean)).size).toBeGreaterThanOrEqual(15);
    expect(new Set(recipes.map((recipe) => recipe.taxonomy.cuisine.cuisineId)).size).toBeGreaterThanOrEqual(20);
    expect(new Set(recipes.flatMap((recipe) => recipe.taxonomy.techniques)).size).toBeGreaterThanOrEqual(15);
    expect(recipes.filter((recipe) => recipe.taxonomy.dietaryTagIds?.includes("vegan")).length).toBeGreaterThanOrEqual(15);
    expect(recipes.filter((recipe) => recipe.cooking.totalTime <= 30).length).toBeGreaterThanOrEqual(25);
    expect(recipes.filter((recipe) => recipe.cooking.difficulty !== "easy").length).toBeGreaterThanOrEqual(15);
  });

  it("keeps time-sensitive ingredient states explicit", () => {
    const ingredientIds = new Set(ingredients.map((item) => item.id));
    const usedIds = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((item) => item.ingredientId)));
    expect([...ingredientIds]).toEqual(expect.arrayContaining(["dry-lentil", "cooked-chickpea", "cooked-black-bean", "cooked-rice"]));
    expect(["lentil", "chickpea", "black-bean"].some((id) => ingredientIds.has(id))).toBe(false);
    expect([...usedIds]).toEqual(expect.arrayContaining(["dry-lentil", "cooked-chickpea", "cooked-black-bean", "cooked-rice"]));
    const friedRice = recipes.find((recipe) => recipe.slug === "korean-kimchi-fried-rice");
    expect(friedRice?.ingredients.find((item) => item.ingredientId === "cooked-rice")?.note).toContain("冷却");
  });

  it("rejects implausibly short recipes that declare slow dry legumes", () => {
    const cookedChickpea = ingredients.find((item) => item.id === "cooked-chickpea")!;
    const dryChickpea = { ...cookedChickpea, id: "dry-chickpea", name: "干鹰嘴豆", aliases: ["鹰嘴豆干"] };
    const source = recipes.find((recipe) => recipe.slug === "indian-chana-masala-home")!;
    const recipe: Recipe = {
      ...source,
      id: "short-dry-chickpea",
      slug: "short-dry-chickpea",
      ingredients: source.ingredients.map((item) => item.ingredientId === "cooked-chickpea"
        ? { ...item, ingredientId: "dry-chickpea" }
        : item),
    };
    expect(validateRecipes([recipe], [...ingredients, dryChickpea])).toContainEqual({
      recipeId: recipe.id,
      field: "cooking.totalTime",
      message: "dry-chickpea 必须把浸泡和煮制计入总时间，不能短于 120 分钟",
    });
  });

  it("passes a cross-regional quality sample of 15 new recipes", () => {
    const sample = [
      "home-mapo-tofu", "chaoshan-fish-congee", "northwest-cumin-lamb",
      "french-ratatouille", "spanish-potato-omelet", "greek-salad",
      "japanese-oyakodon", "korean-bibimbap-home", "korean-glass-noodle-stir-fry",
      "thai-green-papaya-salad", "vietnamese-beef-noodle-soup-home", "filipino-chicken-adobo-home",
      "mexican-black-bean-tacos", "indian-chana-masala-home", "lebanese-hummus-plate",
    ].map((slug) => recipes.find((recipe) => recipe.slug === slug));
    expect(sample.every(Boolean)).toBe(true);
    expect(sample.every((recipe) => recipe!.ingredients.length >= 3 && recipe!.steps.length >= 3 &&
      recipe!.steps.every((step, index) => step.order === index + 1 && step.instruction.trim() && step.why.trim()) &&
      recipe!.tools.length > 0 && recipe!.principles.length > 0)).toBe(true);
  });

  it("calculates complete nutrition and cost estimates for every recipe", () => {
    for (const recipe of recipes) {
      const nutrition = calculateNutrition(recipe.ingredients, repository);
      const cost = calculateCost(recipe.ingredients, repository);
      expect(nutrition.warnings, recipe.slug).toEqual([]);
      expect(cost.warnings, recipe.slug).toEqual([]);
      expect(Object.values(nutrition.total).every((value) => Number.isFinite(value) && value >= 0), recipe.slug).toBe(true);
      expect(Number.isFinite(cost.estimated) && cost.estimated >= 0, recipe.slug).toBe(true);
    }
  });

  it("reports structural, reference and cooking consistency errors", () => {
    const invalid = {
      ...recipes[0], id: recipes[1].id, slug: recipes[1].slug, servings: 0,
      ingredients: [{ ingredientId: "missing", amount: -1, unit: "cup", optional: false }],
      cooking: { ...recipes[0].cooking, prepTime: -1, oil: 99 },
      cost: { currency: "CNY", basis: "" },
      tools: ["Bad Tool"],
      steps: [{ order: 2, instruction: "", why: "" }],
      flavor: {
        tastes: { salty: 5, mystery: 2 },
        aromaIds: ["garlicky", "garlicky", "missing-aroma"],
        characterIds: ["light", "hearty"],
      },
      taxonomy: {
        ...recipes[0].taxonomy,
        cuisine: { cuisineId: "missing-cuisine", subCuisineId: "guangfu" },
        origin: { countryId: "china", regionId: "valencia" },
        techniques: ["stir-fry", "missing-technique", "stir-fry"],
        mealType: { dishTypeId: "missing-dish-type", mealOccasionIds: ["breakfast", "breakfast", "missing-meal"] },
        dietaryTagIds: ["vegan", "missing-dietary"],
        browseTagIds: ["quick", "missing-browse"],
      },
      culture: {
        summary: "",
        sources: [{ title: "", url: "", publisher: "", accessedAt: "" }],
      },
    } as unknown as Recipe;
    const messages = validateRecipes([recipes[1], invalid], ingredients).map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining([
      "Recipe ID 重复", "Slug 重复", "份数必须是正有限数", "不存在的食材 ID: missing",
      "食材用量必须是正有限数", "单位不在当前 schema 中", "烹饪数值必须是非负有限数", "用油字段与食材明细不一致",
      "成本元数据不完整", "工具必须是非空 kebab-case 列表",
      "步骤序号必须从 1 连续递增", "步骤说明不能为空", "步骤原理不能为空",
      "菜系 ID 不在 taxonomy registry 中", "子菜系与父级菜系不匹配", "地域与所属国家不匹配",
      "technique 列表不能重复", "存在未注册的 technique ID", "料理类型 ID 不在 taxonomy registry 中",
      "meal occasion 列表不能重复", "存在未注册的 meal occasion ID", "taste intensity 必须是 0–4 的整数",
      "未知 taste ID: mystery", "aromaIds 不能重复", "aromaIds 存在未知 ID: missing-aroma",
      "不兼容的 flavor character: light / hearty", "taxonomy.dietaryTagIds 存在未注册的 ID",
      "taxonomy.browseTagIds 存在未注册的 ID", "quick 必须由 totalTime 派生，不应静态维护",
      "文化元数据不能为空字符串", "文化元数据来源标题不能为空",
    ]));
  });
});
