# Taxonomy

最近更新：2026-09-04

## Goal

Recipe Taxonomy v2 的目标不是建立一部料理百科，而是为当前 30 道菜和未来约 100 道结构化菜谱提供：

- 清楚的 source of truth
- 可验证的 machine values
- 可过滤的结构字段
- 可展示的中英 labels
- 可扩展到 Web / Mobile / future data provider 的 shared contract

## Design rules

- country / region 与 cuisine / subCuisine 分离
- technique、dish type、meal occasion 分离
- static taxonomy 与 derived attributes 分离
- 有可靠依据才填；不确定就留空
- machine value 用稳定英文 ID，UI label 走 registry
- registry 只覆盖当前真实需要的值，不追求百科完整

## Geography and cuisine

### Why they are separate

同一国家可以有多个 cuisine tradition；同一 cuisine 也可能跨多个地方传播。为了避免把不同概念塞进一个字段，当前模型拆成：

```ts
origin?: {
  countryId: string;
  regionId?: string;
}

cuisine: {
  cuisineId: string;
  subCuisineId?: string;
}
```

这允许：

- 只知道国家时只填 `countryId`
- 只知道 cuisine tradition 时只填 `cuisineId`
- 可靠时再补 `regionId` 或 `subCuisineId`

### Illustrative examples

这些例子用于说明层级，不代表当前数据集一定已经收录对应 recipe：

| Meaning | Geography | Cuisine |
| --- | --- | --- |
| 广东家常菜 | `countryId: "china"` + `regionId: "guangdong"` | `cuisineId: "cantonese"` + `subCuisineId: "guangfu"` |
| 西班牙瓦伦西亚风味 | `countryId: "spain"` + `regionId: "valencia"` | `cuisineId: "spanish"` + `subCuisineId: "valencian"` |
| 泰北风味 | `countryId: "thailand"` + `regionId: "northern-thailand"` | `cuisineId: "thai"` + `subCuisineId: "northern-thai"` |

## Techniques

`techniques` 表示烹饪动作、热传递方式或成菜过程，不再把“什么场景吃”或“用什么设备”混进去。

当前 registry：

- `pan-fry`
- `stir-fry`
- `steam`
- `boil`
- `simmer`
- `stew`
- `braise`
- `roast`
- `dress`
- `rice-cook`

### Important corrections from v1

- “汤”不再是 technique，而是 `dishTypeId = "soup"`
- “早餐”不再是 category，而是 `mealOccasionIds = ["breakfast"]`
- “电饭锅”不再既是 technique 又是 tool
  - tool: `rice-cooker`
  - technique: `rice-cook`

## Dish type and meal context

这两个维度在 v2 明确拆开：

```ts
mealType: {
  dishTypeId: string;
  mealOccasionIds?: string[];
}
```

### dishTypeId

- `main-dish`
- `staple`
- `soup`
- `cold-dish`
- `side-dish`

### mealOccasionIds

- `breakfast`
- `lunch`
- `dinner`

这样同一道菜可以是：

- `dishTypeId = "staple"`
- `mealOccasionIds = ["breakfast"]`

而不会被错误地压扁成“早餐”这一种混合概念。

## Flavor profile

当前 flavor 采用轻量双层结构：

```ts
flavorProfile?: {
  tasteIds?: string[];
  characteristicIds?: string[];
}
```

### tasteIds

- `savory`
- `umami`
- `tangy`
- `sweet`
- `fresh`

### characteristicIds

- `light`
- `comforting`
- `saucy`
- `hearty`
- `brothy`
- `crisp`
- `tender`

这不是完整 flavor ontology，只是让用户能理解、数据能稳定标注、推荐系统未来能消费。

## Dietary and browse tags

### Static taxonomy

适合直接存进 recipe 的标签：

- `dietaryTagIds`
  - `vegan`
  - `vegetarian`
- `browseTagIds`
  - `quick`
  - `one-pot`
  - `vegetable-rich`

### Derived attributes

不直接写回 recipe source，而是运行时根据营养或烹饪字段派生：

- `high-protein`
- `high-fiber`
- `low-oil`
- `no-added-sugar`
- `staple`
- `breakfast`

原因很简单：配方一改，这些结论就可能变化。

## Label strategy

taxonomy ID 和展示文案分离：

```ts
interface TaxonomyNode {
  id: string;
  label: {
    "zh-CN": string;
    en: string;
  };
  parentId?: string;
}
```

当前策略：

- data 层保存 registry
- helper 层负责 label lookup
- UI 不直接硬编码 `Guangdong` / `Cantonese` / `stir-fry`

这已经为未来 `zh-CN` / `en` 切换留好了空间，但本轮不引入完整 i18n framework。

## Cultural metadata

Recipe 可选内容结构：

```ts
culture?: {
  summary?: string;
  originNote?: string;
  traditionalContext?: string;
  modernContext?: string;
  sources?: RecipeReference[];
}
```

使用原则：

- optional
- structured enough for UI
- low-claim, low-drama
- 没有可靠依据就留空

当前只在少数低争议 recipe 上示例性使用，不追求 30/30 全覆盖。

## Provenance

轻量来源结构：

```ts
interface RecipeReference {
  title: string;
  url?: string;
  publisher?: string;
  accessedAt?: string;
}
```

它解决的是“这段 cultural note 依据来自哪里”，不是“建立学术引文系统”。

## Compatibility

为了不破坏当前产品：

- filter 继续按 cuisine / methods / tags 工作
- recommendation 继续消费 cuisine preference、method preference、tag preference
- 兼容层通过 `lib/taxonomy.ts` 从 taxonomy source of truth 派生旧交互所需语义

因此当前 UI 不需要先重写，taxonomy 也已经能成为唯一真实数据源。

## Current dataset examples

### 番茄炒蛋

```ts
taxonomy: {
  origin: { countryId: "china" },
  cuisine: { cuisineId: "chinese" },
  techniques: ["stir-fry"],
  mealType: { dishTypeId: "main-dish" },
  flavorProfile: {
    tasteIds: ["savory", "tangy"],
    characteristicIds: ["saucy", "tender"],
  },
  dietaryTagIds: ["vegetarian"],
  browseTagIds: ["quick"],
}
```

### 燕麦鸡蛋粥

```ts
taxonomy: {
  cuisine: { cuisineId: "fusion" },
  techniques: ["boil"],
  mealType: {
    dishTypeId: "staple",
    mealOccasionIds: ["breakfast"],
  },
  flavorProfile: {
    tasteIds: ["savory"],
    characteristicIds: ["comforting", "hearty"],
  },
  dietaryTagIds: ["vegetarian"],
}
```

### 未来欧洲 / 东南亚扩展示例

这些只是 schema 示例，不是当前 recipe 承诺：

```ts
taxonomy: {
  origin: { countryId: "spain", regionId: "valencia" },
  cuisine: { cuisineId: "spanish", subCuisineId: "valencian" },
  techniques: ["simmer"],
  mealType: { dishTypeId: "main-dish" },
}

taxonomy: {
  origin: { countryId: "thailand", regionId: "northern-thailand" },
  cuisine: { cuisineId: "thai", subCuisineId: "northern-thai" },
  techniques: ["stir-fry"],
  mealType: { dishTypeId: "main-dish" },
}
```
