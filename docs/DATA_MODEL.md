# Data Model

## Ingredient

包含稳定 `id`、名称/别名、类别、每 100g 营养、默认单位、非重量单位近似克重、每 100g 静态参考价和标签。价格是 demo 估算，不代表城市或实时市场价格。

- `id` 使用稳定的英文 kebab-case，名称和别名仅用于展示与搜索。
- `nutritionPer100g` 所有字段均为非负有限数；当前值是用于产品验证的公开常识级估算，不代表特定品牌、产地、烹饪状态或医学建议。
- `estimatedPricePer100g` 是静态人民币参考值，用于验证成本计算；不代表实时行情或特定地区售价。
- `dataQuality` 当前固定为 `demo-estimated`，让上层明确这些数据不能按生产级精度解释。
- `piece`、`ml`、`tsp`、`tbsp` 通过 `approximateUnitWeight` 换算为克。同一种食材的大小、密度和量具会产生偏差，因此只展示适度精度。
- 使用非重量默认单位的食材必须提供对应近似克重。数据校验同时检查重复 ID/名称、非法营养值、非法价格和无效换算重量。

## Recipe

包含标识、描述、菜系/类别、份数、结构化食材用量、可选营养快照、烹饪时间/油盐糖/难度/技法、厨具、成本元数据、标签、步骤和原理。每一步有 `instruction` 与关键差异字段 `why`。

## Nutrition

字段为 calories、protein、fat、saturatedFat、carbs、sugar、addedSugar、fiber、sodium。基础算法为 `Σ(食材克重 / 100 × 每100g营养)`。首期不模拟烹饪损耗、吸油率、沥水、品牌差异和个体可食部，结果不是医学级精度。

## Cost

按食材克重与静态每 100g 参考价相乘并汇总，UI 四舍五入显示“预计 ¥N”。未来价格来源应通过独立 provider/repository 注入。

## Recommendation

输入 `RecommendationCriteria`，输出带 `score`、匹配项、不匹配项和解释的 `RecommendationResult`。当前规则引擎按启用条件等权计算，后续应通过用户研究调整权重与硬约束策略。
