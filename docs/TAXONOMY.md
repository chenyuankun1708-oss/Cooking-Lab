# Taxonomy

最近更新：2026-09-05

## Goal

Recipe Taxonomy v2 的目标不是建立一部料理百科，而是为当前 100 道结构化菜谱及后续扩展提供：

- 清楚的 source of truth
- 可验证的 machine values
- 可过滤的结构字段
- 可展示的中英 labels
- 可扩展到 Web / Mobile / future data provider 的 shared contract

## Design rules

- Canonical source of truth: `recipe.taxonomy`
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
- `rice-cook` 表示“吸水焖熟主食及其配料”的过程语义，不等于设备本身；它可以由电饭锅承载，但 source of truth 仍然把设备和 technique 分开。

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

## Flavor boundary

Issue #29 将 Flavor 从 taxonomy 中独立为 `recipe.flavor`。这是有意的语义边界：

- taxonomy 回答“这是什么料理、来自哪里、用了什么做法”
- Flavor Profile 回答“这份具体配方吃起来怎样”

旧 `taxonomy.flavorProfile.tasteIds / characteristicIds` 已移除，不保留兼容双写。完整 schema、词汇、强度和推荐规则见 `docs/FLAVOR_MODEL.md`。

## Dietary and browse tags

### Static taxonomy

适合直接存进 recipe 的标签：

- `dietaryTagIds`
  - `vegan`
  - `vegetarian`
- `browseTagIds`
  - `one-pot`
  - `vegetable-rich`

### Derived attributes

不直接写回 recipe source，而是运行时根据营养或烹饪字段派生：

- `high-protein`
- `high-fiber`
- `quick`
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
- 涉及起源、传统、地区习惯等事实性文化主张时，必须有可对应的 provenance；否则只保留非历史性的现代 recipe context，或留空

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

- filter 继续按 cuisine / methods / tags 工作，并可独立消费 `recipe.flavor`
- recommendation 继续消费 cuisine、method、tag preference，并加入 Flavor soft preference
- 兼容层通过 `lib/taxonomy.ts` 从 taxonomy source of truth 派生旧交互所需语义

因此当前 UI 不需要先重写，taxonomy 也已经能成为唯一真实数据源。

## Legacy compatibility strategy

- Canonical: `recipe.taxonomy`
- Compatibility adapter: `lib/taxonomy.ts` 中的 cuisine / method / tag helper
- Deprecated: `recipe.cuisine`、`recipe.category`、`recipe.cooking.method`、`recipe.tags` 这类直接存回 recipe 的旧字段

新 recipe 不允许手工维护两套分类数据；旧交互若仍需要 legacy 语义，只能从 taxonomy 派生。

## Current dataset examples

### 番茄炒蛋

```ts
{
  taxonomy: {
    origin: { countryId: "china" },
    cuisine: { cuisineId: "chinese" },
    techniques: ["stir-fry"],
    mealType: { dishTypeId: "main-dish" },
    dietaryTagIds: ["vegetarian"],
  },
  flavor: {
    tastes: { salty: 1, sweet: 2, sour: 2, umami: 2 },
    aromaIds: ["tomato-rich"],
    textureIds: ["tender", "saucy"],
    characterIds: ["comforting", "rice-friendly"],
  },
}
```

`quick` 由 `cooking.totalTime` 派生，不写入 `browseTagIds`。

### 燕麦鸡蛋粥

```ts
{
  taxonomy: {
    cuisine: { cuisineId: "fusion" },
    techniques: ["boil"],
    mealType: {
      dishTypeId: "staple",
      mealOccasionIds: ["breakfast"],
    },
    dietaryTagIds: ["vegetarian"],
  },
  flavor: {
    tastes: { salty: 1, umami: 1 },
    textureIds: ["creamy", "silky"],
    characterIds: ["comforting", "warming"],
  },
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

## M6 Culinary Extensions

Issue #40 只增加首批 native CulinaryItem 实际需要的最小节点：UK、Morocco、Zhejiang、Fujian、Andalusia，以及 British、Moroccan、Zhejiang cuisine。更细的 dessert/tea/coffee/drink 形态保存在独立 `culinaryForms` registry；它们不回写或扩散成 Recipe legacy fields。

当真实内容需要新的 country、region、cuisine、form 或 serving context 时，先增加稳定 registry node 和 label，再允许 item 引用。不要从 UI 文案反向制造 taxonomy ID，也不要为了覆盖未来所有料理一次性建立全球 ontology。
