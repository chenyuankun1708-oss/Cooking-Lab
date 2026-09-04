# Content Strategy

最近更新：2026-09-03

## M5 内容目标

当前数据集已从 30 道扩展到 100 道结构化菜谱，形成第一版可审计的料理世界地图。

M5 的内容目标不是“随便再加 70 道菜”，而是把数据集扩展成一个更像“小型世界料理地图”的结构化内容体系。

当前总量：100 道 structured recipes。最终 coverage 见 docs/RECIPE_COVERAGE.md。

## 当前内容缺口

当前数据已经覆盖多种核心技法，但整体仍明显偏向 MVP 验证用途：

- 菜系分布较粗
- 地域层次不足
- 国际覆盖面不足
- 料理故事、文化背景与图像系统尚未建立
- 目录和详情页仍主要靠结构字段，而不是内容世界感驱动

## 100 Recipe Coverage Direction

以下配比是 M5 的规划目标，不是一次性刚性约束：

- 中国地方 / 家常料理：约 40
- 欧洲料理：约 18
- 日本 / 韩国：约 12
- 东南亚：约 12
- 美洲 / 墨西哥等：约 8
- 印度 / 中东等：约 5
- 现代沙拉 / 早餐 / 跨文化：约 5

允许在数据整理阶段根据：

- ingredient coverage
- technique balance
- content quality
- cultural reliability

做小幅调整，但整体目标仍应保持“约 100 道，且具有世界料理覆盖感”。

## Technique Coverage

M5 数据扩充时，至少要保证以下核心技法有代表性覆盖：

- 煎
- 炒
- 蒸
- 煮
- 炖
- 焖
- 烤
- 汤
- 凉拌
- 烩
- rice cooker / 电饭锅
- 其他必要核心家庭技法

扩充 recipe 时，不应只按菜名数量堆叠，而要检查：

- technique coverage
- ingredient diversity
- meal type balance
- weeknight practicality
- discoverability in UI

## Recipe Taxonomy v2

M5 需要从当前粗粒度的 `cuisine` 升级到更可扩展的 taxonomy，但不能为了整齐而强行让每道菜都填满所有层级。当前 v2 已采用：

- `origin?: { countryId; regionId? }`
- `cuisine: { cuisineId; subCuisineId? }`
- `techniques: string[]`
- `mealType: { dishTypeId; mealOccasionIds? }`
- `flavorProfile?: { tasteIds?; characteristicIds? }`
- `dietaryTagIds?: string[]`
- `browseTagIds?: string[]`

这套结构的核心判断是：

- `country / region` 与 `cuisine / subCuisine` 分离建模
- `dishType` 与 `meal occasion` 分离建模
- `soup` 归入 dish type，不再把“汤”当 technique
- `rice-cooker` 归入 tool，`rice-cook` 才是 technique
- 只保留当前 30 recipes 与近期 100 recipes 扩展真的会使用的 taxonomy 项

- `country / region / cuisine / subCuisine` 只在有可靠依据时填写
- 不是每道菜都必须拥有四级完整地域链
- 避免把所有语义都塞进一个 `tags` 数组
- taxonomy 必须可校验、可迁移、可回退，并能通过 helper 继续兼容当前 filter / recommendation 语义

### Static vs derived attributes

以下标签适合作为静态 taxonomy 保存：

- `dietaryTagIds`：例如 `vegan`、`vegetarian`
- `browseTagIds`：例如 `one-pot`、`vegetable-rich`

以下语义更适合作为运行时派生值，不直接写死进 recipe 数据：

- `high-protein`
- `high-fiber`
- `quick`
- `low-oil`
- `no-added-sugar`

原因是这类结论依赖营养计算或烹饪字段，一旦配方变动，硬编码 tag 很容易过期。

## Cultural Metadata

Recipe 当前使用轻量 optional 结构：

- `summary`
- `originNote`
- `traditionalContext`
- `modernContext`
- `sources?`

用途包括：

- 历史故事
- 菜名来源
- 地域背景
- 传统吃法
- 传统版本与现代家庭版本差异

要求：

- 全部为 optional
- 结构清晰
- 没有可靠依据就留空
- 不虚构历史
- 不为了内容丰富而制造“文化感”

### Provenance strategy

`sources` 使用轻量 reference 对象记录最少必要来源字段：

- `title`
- `url?`
- `publisher?`
- `accessedAt?`

目标不是建立 citation engine，而是避免未来在 recipe detail 上出现无法追溯的文化说明。当前 30 道菜只对少数低争议、容易确认语境的菜品给出 cultural metadata 示例，其余留空。

## Recipe Detail v2 Content Surface

未来详情页内容面建议包含：

- hero image
- recipe name
- country / region / cuisine
- 一句话简介
- time / difficulty / nutrition / cost
- 这道菜
- story / origin
- 为什么这样做
- cooking science
- ingredients
- steps
- tools
- variations
- substitutions（future-ready）
- related recipes

当前 M5 只定义这些内容面，不在本轮全部开发。

Taxonomy 详细约定、label strategy 与示例见新增的 `docs/TAXONOMY.md`。

## Image System v1

M5 必须引入真实料理视觉系统，但本轮只定义 schema 和原则，不批量下载或生成图片。

最小目标：

- 每道菜未来可拥有 `heroImage`

未来扩展：

- `ingredientImages`
- `stepImages`
- `finishedDishImages`

建议的共享 schema 方向：

```ts
interface ImageAsset {
  id: string;
  entityType: "recipe" | "ingredient" | "step";
  entityId: string;
  role: "hero" | "finished-dish" | "ingredient" | "step";
  src: string;
  alt: string;
  source: "self-shot" | "open-license" | "licensed-stock" | "ai-generated" | "partner-provided";
  author?: string;
  license?: string;
  attribution?: string;
  originalUrl?: string;
  width?: number;
  height?: number;
  aspectRatio?: "4:3" | "3:2" | "1:1" | "16:9";
  blurDataURL?: string;
}
```

### 图片原则

- 新鲜
- 自然
- 明亮
- 有食欲
- 食材纹理清楚
- 自然光优先
- 少量摆盘
- 不油腻
- 不过度滤镜
- 不使用明显低质量 stock / watermark 图片

### 版权原则

不得：

- 直接从 Google 图片搜索结果复制进项目

允许来源：

- 自己拍摄
- 明确允许使用的开放授权图片
- 合法图库
- AI-generated
- 明确获得授权的图片

必须保留：

- source
- author
- license
- attribution（在适用时）

## Data Expansion Quality Rules

当 M5 推进 30 -> 100 时，新增 recipe 必须继续满足：

- ingredient references valid
- nutrition / cost calculations valid
- slug unique
- taxonomy fields structurally valid
- cooking `why` explanations present
- story / origin 只有在可靠时出现
- no fake historical claims

## 推荐的执行顺序

1. 先定义 taxonomy v2
2. 再制定 recipe coverage map
3. 再扩充 recipe dataset
4. 并行建立 image schema 和素材管线
5. 最后在消费者 Web 重设计中统一展示

这样可以避免先堆大量内容，再回头做 schema 返工。
