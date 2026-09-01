# Data Model

## Ingredient

包含稳定 `id`、名称/别名、类别、每 100g 营养、默认单位、非重量单位近似克重、每 100g 静态参考价和标签。价格是 demo 估算，不代表城市或实时市场价格。

## Recipe

包含标识、描述、菜系/类别、份数、结构化食材用量、可选营养快照、烹饪时间/油盐糖/难度/技法、厨具、成本元数据、标签、步骤和原理。每一步有 `instruction` 与关键差异字段 `why`。

## Nutrition

字段为 calories、protein、fat、saturatedFat、carbs、sugar、addedSugar、fiber、sodium。基础算法为 `Σ(食材克重 / 100 × 每100g营养)`。首期不模拟烹饪损耗、吸油率、沥水、品牌差异和个体可食部，结果不是医学级精度。

## Cost

按食材克重与静态每 100g 参考价相乘并汇总，UI 四舍五入显示“预计 ¥N”。未来价格来源应通过独立 provider/repository 注入。

## Recommendation

输入 `RecommendationCriteria`，输出带 `score`、匹配项、不匹配项和解释的 `RecommendationResult`。当前规则引擎按启用条件等权计算，后续应通过用户研究调整权重与硬约束策略。
