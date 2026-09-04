# Recipe Similarity

最近更新：2026-09-05

## Purpose

Recipe similarity 回答“做完或喜欢这道菜后，还有哪些料理在味道、主食材和做法上值得继续探索”。它不回答用户当前食材、时间、预算或营养条件是否满足，因此不复用 Recommendation Engine 的 eligibility 或 score。

## Pairwise Audit

当前 10 道 published Recipe 的人工校准关系如下：

- 番茄炒蛋、番茄罗勒意面和普罗旺斯炖蔬菜共享番茄、酸甜鲜味、番茄浓香与酱汁感。
- 麻婆豆腐与味噌豆腐汤共享豆腐、鲜味和发酵香，但料理形态明显不同，因此是有意义但不应过强的关系。
- 味噌豆腐汤与越南牛肉米粉汤共享汤润、暖意和小火煮制。
- 韩式拌饭与泰式罗勒鸡共享鲜辣、开胃和炒制特征。
- 番茄罗勒意面与越南牛肉米粉汤都是面食，并共享煮、小火煮制和部分香草鲜味。
- 川味拍黄瓜与鹰嘴豆泥共享酸香、清爽、蒜香和冷拌，但主食材与质地差异很大，因此只保留为弱邻近。

同国家、同为主菜、做饭时间接近，或共同使用盐、油、蒜，不能单独形成有意义的相似关系。

## Architecture

`lib/recipe-similarity.ts` 是 framework-independent core。它接受 target、任意候选 Recipe 与 Ingredient metadata，不读取 React、Next.js 或 raw/published 数据源。`lib/recipe-similarity-display.ts` 把结构化 signals 转为自然中文理由；`components/similar-recipe-card.tsx` 只负责 Web 展示。

公开详情页只把 `getPublishedRecipes()` 传给 core。Similarity module 本身不知道 publication 状态，因此可以被未来客户端或编辑工具复用，同时不会绕过 #30 的公开边界。

## Dimensions And Weights

| 维度 | 权重 | 作用 |
| --- | ---: | --- |
| Flavor | 0.42 | canonical taste 强度与 aroma / texture / character overlap |
| Ingredient | 0.33 | 有意义的主食材 exact match 与少量 family match |
| Cuisine | 0.10 | subCuisine / cuisine / region / country 的辅助关系 |
| Technique | 0.10 | canonical technique exact overlap |
| Dish type | 0.05 | 同为汤、主食、凉菜等弱辅助 |

权重总和固定为 1，并由测试保护。Flavor 与 Ingredient 占 0.75，避免 cuisine 或 dish type 主导结果。时间不参与 similarity。

## Flavor Similarity

Taste 使用强度加权 Jaccard：对六种基础味累加 `min(left, right) / max(left, right)`，因此共同缺失的 taste 不会制造相似度，`spicy 3` 与 `spicy 0` 也会形成明确差异。Aroma、texture、character 使用 Dice overlap，再以 `0.50 / 0.20 / 0.15 / 0.15` 合成 Flavor dimension。

## Ingredient Semantics

Ingredient category 已足以支持第一版，不扩展 Ingredient schema：

- `seasoning` 与 `oil` 完全不进入主食材相似度。
- 蒜、姜、葱、洋葱、鲜椒、香草、香茅和柑橘等常见 supporting/aromatic ingredient 不作为主食材信号；它们的味道影响已经由 Flavor Profile 表达。
- protein / grain 权重最高，dairy 与实质性 vegetable 次之。
- exact ingredient match 强于 family match。
- family 只覆盖当前确有价值的 `chicken / pork / fish / legume / rice / noodle`，例如鸡胸与鸡腿、干面与米粉；不建立大而泛化的 ontology。

## Ranking And Threshold

`rankSimilarRecipes()`：

- 排除 target 本身
- 按 slug 去重并保留第一个候选
- 不修改输入数组或 Recipe
- 先按 similarity 降序，再按 slug 字典序稳定 tie-break
- 默认最多返回 4 道
- 默认 threshold 为 `0.28`

`0.28` 来自当前 10 道公开料理的 pairwise editorial calibration，不是科学边界。它保留了味噌汤与越南米粉汤、拌饭与泰式罗勒鸡等合理弱邻近，同时排除了只因中国来源、盐油蒜或同为主菜产生的低价值关系。未来 published set 扩大后应重新人工审计，而不是机械维持当前阈值。

## Explanation

Core 返回 score、五维 breakdown 和 machine-readable signals；公开 UI 不展示数值。Display adapter 最多选择两个高价值信号，优先级为主食材或 family、Flavor、distinctive technique/cuisine。当前可生成“同样以番茄为主”“都有鲜味与发酵香”“同样汤润暖乎乎”“同样酸香清爽”等自然理由，不使用相似度、匹配度或推荐系统术语，也不把 dish type 当作主要文案。

## Product Behavior

详情页在步骤、原理、估算和可选文化语境之后展示该区域，不打断做饭正文。达到阈值的结果不足 3 道时只显示实际结果并使用“还可以试试这些”；没有结果时整段隐藏。移动端自然单列，较宽屏幕为 2 列或最多 4 列，不使用横向 carousel。

## Limitations

- 当前只有 10 道 published Recipe，多数 target 只有 1–3 个可靠邻近。
- Ingredient family 是刻意保持很小的编辑映射，不代表完整食材 ontology。
- Similarity 是内容发现启发式，不是营养、文化真实性或用户偏好结论。
- 新 Recipe 进入 published set 后需要重新打印排名并做人工 pairwise audit。
