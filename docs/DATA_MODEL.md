# Data Model

## Ingredient

包含稳定 `id`、名称/别名、类别、每 100g 营养、默认单位、非重量单位近似克重、每 100g 静态参考价和标签。价格是 demo 估算，不代表城市或实时市场价格。

- `id` 使用稳定的英文 kebab-case，名称和别名仅用于展示与搜索。
- `nutritionPer100g` 所有字段均为非负有限数；当前值是用于产品验证的公开常识级估算，不代表特定品牌、产地、烹饪状态或医学建议。
- `estimatedPricePer100g` 是静态人民币参考值，用于验证成本计算；不代表实时行情或特定地区售价。
- `dataQuality` 当前固定为 `demo-estimated`，让上层明确这些数据只用于产品与计算逻辑验证，不能按生产级精度解释。未来可通过 repository/provider 换成经过溯源和审核的数据集，而不改变上层计算接口。
- `piece`、`ml`、`tsp`、`tbsp` 通过 `approximateUnitWeight` 换算为克。同一种食材的大小、密度和量具会产生偏差，因此只展示适度精度。
- 使用非重量默认单位的食材必须提供对应近似克重。数据校验同时检查重复 ID/名称、非法营养值、非法价格和无效换算重量。
- 当前类别是面向 MVP 筛选的粗粒度烹饪分类；例如豆类归入 `protein`、块茎归入 `vegetable` 并使用 `staple` 标签。若后续需要食品学分类或多维筛选，应另行升级 schema，而不是改变现有类别含义。
- 当前食材集覆盖 Issue #2 已明确的主要类别，但最终完整覆盖仍需在生成并审核约 30 道菜谱时，通过悬空 Ingredient ID 校验再次确认。

## Recipe

包含标识、描述、菜系/类别、份数、结构化食材用量、可选营养快照、烹饪时间/油盐糖/难度/技法、厨具、成本元数据、标签、步骤和原理。每一步有 `instruction` 与关键差异字段 `why`。

- 当前静态数据要求 `id` 与唯一 kebab-case `slug` 一致；Ingredient 引用必须存在，且用量必须能通过现有单位系统换算为克。
- `cuisine` 使用 `中式`、`西式`、`融合`；`category` 使用 `主菜`、`主食`、`汤`、`凉菜`、`早餐`、`配菜`。
- `cooking.method` 使用稳定集合：`煎`、`炒`、`蒸`、`煮`、`炖`、`焖`、`烤`、`汤`、`凉拌`、`电饭锅`。工具与标签使用 kebab-case，供后续筛选逻辑使用。
- `cooking.oil`、`salt`、`addedSugar` 是配方级显式用量，并由校验器与食材明细核对；当前 30 道菜未使用添加糖食材，因此 `addedSugar` 为 0。
- `nutrition` 不存储在静态 Recipe 中，营养和成本分别由 Nutrition Engine 与 Cost Engine 根据食材用量计算。
- Recipe 数据仍标记为 `demo-estimated`。步骤和 `why` 已完成人工可读性检查，但时间、营养和成本仍用于产品验证，不是专业餐饮、医学或实时价格数据。

## Nutrition

字段为 calories、protein、fat、saturatedFat、carbs、sugar、addedSugar、fiber、sodium。基础算法为 `Σ(食材克重 / 100 × 每100g营养)`。首期不模拟烹饪损耗、吸油率、沥水、品牌差异和个体可食部，结果不是医学级精度。

## Cost

按食材克重与静态每 100g 参考价相乘并汇总，UI 四舍五入显示“预计 ¥N”。未来价格来源应通过独立 provider/repository 注入。

## Recommendation

输入 `RecommendationCriteria`，输出带 `score`、匹配项、不匹配项和解释的 `RecommendationResult`。当前规则引擎按启用条件等权计算，后续应通过用户研究调整权重与硬约束策略。
