# Architecture

## 分层

`app/components`（UI）→ 应用组合逻辑 → `lib`（领域引擎与抽象）→ `data`（本地 TypeScript 数据）。页面只负责展示与交互，不承载计算公式或评分规则。

## 模块

- `types/`：Recipe、Ingredient、Nutrition、Recommendation 契约。
- `data/`：第一阶段静态 demo 数据。
- `lib/unit-conversion.ts`：常用单位转克。
- `lib/nutrition.ts`：按食材重量汇总营养。
- `lib/cost.ts`：按静态参考价估算成本。
- `lib/recommendation.ts`：实现透明规则评分的可替换接口。
- `lib/ingredient-repository.ts`：隔离数据来源。

## 数据流

UI 获取 Recipe → repository 提供 Ingredient → engines 计算展示值/推荐解释 → UI 格式化为适度精度。引擎返回 warnings，让缺失或不可换算数据可见，而非静默制造结果。

## 扩展方向

未来可新增异步 repository/application service，将本地数据替换为 Supabase/PostgreSQL/API；也可新增实现 `RecommendationEngine` 的 AI 适配器。上层页面不应依赖具体存储或评分实现。数据库、用户系统和 AI 在验证需求前不实现。
