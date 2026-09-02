# Architecture

## 分层

`app/components`（UI）→ 应用组合逻辑 → `lib`（领域引擎与抽象）→ `data`（本地 TypeScript 数据）。页面只负责展示与交互，不承载计算公式或评分规则。

## 模块

- `types/`：Recipe、Ingredient、Nutrition、Recommendation 契约。
- `data/`：第一阶段静态 demo 数据。
- `lib/unit-conversion.ts`：常用单位转克。
- `lib/nutrition.ts`：按食材重量汇总营养。
- `lib/cost.ts`：按静态参考价估算成本。
- `lib/recommendation.ts`：实现透明硬条件、解释、稳定排序与发现结果筛选的可替换接口。
- `lib/formatters.ts`：集中处理营养、成本与时间的估算展示精度。
- `lib/ingredient-repository.ts`：隔离数据来源。
- `lib/ingredient-validation.ts`、`lib/recipe-validation.ts`：检查单类实体与跨字段数据规则。
- `lib/dataset-validation.ts`：在测试/build-time 组合完整静态数据集校验。

## 数据流

客户端筛选状态 → recommendation/application helper → repository 与 nutrition/cost engines → 排序后的 Recipe 结果 → UI formatter 与卡片。引擎返回 warnings，让缺失或不可换算数据可见，而非静默制造结果；涉及营养或成本的硬条件只接受完整计算结果。

## 领域职责与错误边界

- Unit Conversion 是底层纯函数：合法输入返回克数；非法 amount、未知单位、缺失/非法近似克重或溢出通过 `UnitConversionError` 抛出稳定错误 code。
- Nutrition Engine 与 Cost Engine 逐项调用 Unit Conversion。它们允许部分计算，但必须返回结构化 warnings 和 `complete: false`；有效累计值不会被 NaN/Infinity 污染。
- Engine 保留领域计算精度并只返回数字、currency/basis、estimated/complete 和 warnings。展示文案与小数格式属于 UI/应用组合层。
- Ingredient Repository 只提供 `getById` 与只读 `list` 数据访问，不承担校验、换算、营养或价格规则。当前本地实现使用 Map 查找，未来可替换数据来源而不改变 engine。
- Validators 负责静态数据输入质量，Engine 仍对运行时输入防御性检查。前者阻止坏数据进入构建，后者保证动态调用可预测失败。
- 当前页面消费已经通过完整数据集校验的静态数据。未来引入动态来源时，应用层必须检查 engine 的 `complete/warnings`，不能把不完整结果直接显示为 0。

## 扩展方向

未来可新增异步 repository/application service，将本地数据替换为 API；也可新增实现 `RecommendationEngine` 的适配器。上层页面不应依赖具体存储或评分实现。数据库、用户系统和 AI 不在当前 M1 范围内。
