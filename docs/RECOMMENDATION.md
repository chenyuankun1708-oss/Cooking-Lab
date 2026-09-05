# Recommendation Rules

Cooking Lab 的推荐系统是完全本地、确定性且可解释的规则引擎。它先判断料理是否可推荐，再对可推荐料理计算软偏好得分；高分不能抵消硬限制失败。

## Hard Constraints

以下条件不满足时，结果标记为 `eligible: false`，并通过 `hardFailures` 保留结构化原因：

- `maxTime`：整道菜的 `totalTime` 不超过分钟上限。
- `maxCalories`：Nutrition Engine 的完整结果换算为每份后不超过 kcal 上限。
- `minProtein`：完整营养结果的每份蛋白质达到克数下限。
- `maxOil`、`maxSalt`、`maxAddedSugar`：Recipe 中整道显式用量除以 `servings` 后，不超过每份克数上限。
- `maxCost`：Cost Engine 的完整结果换算为每份后不超过人民币预算。
- `availableTools`：用户一旦声明可用厨具，集合必须覆盖菜谱所需的全部厨具。

涉及营养或成本的计算若 `complete: false`，相关硬限制不能通过，也不能将部分结果当成可靠的 0。

## Soft Preferences

软偏好不排除料理，只影响合格结果的顺序：

- `availableIngredients`：必需食材的加权匹配度。
- `preferredCuisine`：菜系是否相同。
- `preferredTags`：所选标签的匹配比例，允许部分匹配。
- `preferredMethods`：料理技法是否属于所选集合。
- `flavorPreferences`：将清淡、鲜辣、酸爽、浓郁、焦香、暖乎乎等用户语言映射为结构化 Flavor 目标，再比较基础味强度距离与 aroma / texture / character signals。

`minProtein` 保持“最低”这一明确的用户语义，因此仍是硬限制；偏好高蛋白但不要求下限时可使用 `high-protein` 标签。

Flavor 始终是 soft preference。即使没有完全命中所选口味，只要料理满足硬限制，它仍可保留在结果中；Flavor 不能抵消时间、厨具、营养或预算失败。

## Ingredient Fit

只有 `optional !== true` 的食材参与匹配。基础权重集中在 `INGREDIENT_CATEGORY_WEIGHTS`：protein、vegetable、grain、dairy 为 1；seasoning 与 oil 为 0.25。这样缺少少量盐或油不会与缺少核心蛋白质产生相同扣分。

`ingredientFit = 已有必需食材权重之和 / 全部必需食材权重之和`

结果同时保留未加权的 `availableRequired / totalRequired`、加权分子分母，以及只包含稳定 ID 与可选类别的 `missingIngredients`。显示名称由 locale-aware adapter 解析；可选食材不影响 fit 或缺失列表。

## Score

权重集中定义于 `RECOMMENDATION_WEIGHTS`：

- ingredient fit：0.50
- cuisine：0.20
- tags：0.15
- methods：0.10
- flavor：0.20

每个已启用维度先得到 0–1 分数：`score = Σ(dimension score × weight) / Σ(active weight) × 100`，最终显示为整数。未启用任何软偏好时，中性分数为 100，表示料理满足全部已启用硬限制，而不是声称它是绝对最佳选择。

`scoreBreakdown` 为每个启用维度返回 score、weight 和 contribution。具体权重不会暴露为 UI 控件，也不会散落在组件中。

## Ordering

排序固定为：eligible 优先 → score 降序 → ingredient fit 降序 → total time 升序 → recipe ID 升序。相同输入始终得到相同分数和顺序，不使用随机数。

## Explanations and Excluded Results

每个 evaluation 提供结构化 `hardFailures`、`missingIngredients`、`missingTools`、`ingredientMatch` 与 `scoreBreakdown`。core 不保存本地化名称、matched/unmatched 句子或 `explanation`；`lib/recommendation-display.ts` 根据这些 machine values 确定性生成 `zh-CN / en` 说明。

`RuleRecommendationEngine.rank()` 保留 eligible 与 excluded 两类 evaluation，便于测试和未来诊断；`discoverRecipes()` 只把 eligible 结果交给首页。条件冲突导致零结果时，UI 根据已启用的硬条件提供放宽方向，不用违反限制的菜谱填充。

## Current Limitations

- 权重来自当前 MVP 产品判断，尚未经过用户研究或线上行为校准。
- 食材重要性只能使用现有粗粒度 category；未建模替代食材、库存数量或采购难度。
- 工具仍是二元可行性约束，尚未建模可替代工具。
- 100 道 recipe 的 Flavor Profile 是基于当前配方的人工编辑判断，尚未经过用户研究或感官实验校准。
- 营养、价格、时间和单位换算仍是 `demo-estimated`，不是医学或实时市场数据。
