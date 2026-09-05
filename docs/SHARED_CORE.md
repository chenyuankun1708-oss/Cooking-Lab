# Shared Core Audit

最近更新：2026-09-04

## Scope

Issue #18 只审计未来 Web、Mobile 与 API 的共享边界，并做最小必要调整。本轮不迁移 monorepo、不创建 Mobile app、不重写推荐系统，也不开始 #19、#20 或 #21。

## Audit Map

### Shared Domain / Core

- types/: ingredient、recipe、nutrition、recommendation、taxonomy 契约
- data/: 当前本地 ingredient、recipe、taxonomy 数据集与 registry
- lib/unit-conversion.ts: 单位换算与结构化领域错误
- lib/nutrition.ts: 营养估算
- lib/cost.ts: 成本估算
- lib/taxonomy.ts: stable taxonomy 查询与 derived attributes
- lib/tool-labels.ts: framework-independent 的厨具 machine value 与 label lookup
- lib/*validation*.ts: ingredient、recipe、dataset 校验
- lib/ingredient-repository.ts: ingredient 数据访问抽象

这些模块不得依赖 React、Next.js、DOM、浏览器状态或样式模块。

### Application Layer

- lib/recommendation.ts: 排序、约束、评分、发现 use case
- lib/recipe-detail.ts: 查找 recipe，并聚合 ingredient、nutrition、cost 与 warning 的纯数据 detail model

Application 输出必须由 plain object、array、string、number、boolean 与可选值组成，允许未来客户端直接消费或序列化。

### Web Adapter

- lib/recipe-detail-display.ts: 将 detail model 转成当前详情页需要的 locale-aware label 与格式化字符串
- lib/display-labels.ts: 当前 Web 使用的双语单位、难度等显示映射，并兼容 re-export tool label helper
- lib/formatters.ts: 当前 Web 的时间、营养、成本与质量文案
- app/、components/: Next.js 路由、metadata、React state、markup 与样式

### Data Access

当前数据仍是本地 TypeScript dataset。Ingredient 已通过 repository 注入 calculation/application 层；recipe lookup 仍接受可替换的 recipe collection。只有在远程数据源或第二客户端带来真实维护压力时，才新增 recipe repository。

## Findings And Decisions

- lib/recipe-detail.ts 原先混合数值聚合与“15 分钟”“预计 ¥12.5”等 Web 文案；现已拆成 buildRecipeDetail() 与 buildRecipeDetailDisplay()。
- Nutrition、cost、unit conversion、taxonomy 与 validation 没有 framework coupling，无需移动文件。
- Recommendation engine 不依赖 React 或 Next.js，权重集中、输入输出可序列化。Issue #42 已移除 core 中的中文 explanation 和显示名称，改由 locale-aware display adapter 生成说明。
- Taxonomy registry 与 locale label lookup 是 framework-independent 数据能力；Web formatter 继续独立存在，不引入 i18n framework。
- 内部使用 Map、Set 与 UnitConversionError 不构成跨客户端问题；公开 calculation、detail 与 recommendation 结果保持 plain data。

## Guardrails

- 新领域规则不得进入 app/ 或 components/。
- Shared core 文件不得 import React、Next.js、DOM 或 CSS。
- Web 文案和单位格式不得写入 calculation result。
- 新客户端应消费 canonical recipe/taxonomy 与 application result，不复制 scoring 或 calculation 逻辑。
- 新增跨边界结果时，必须能安全 JSON serialize。

## Future Target

当前继续使用单一 Next.js repository。出现以下信号后再评估 apps/web、apps/mobile 与 packages/core：

- 已正式开始第二个客户端；
- shared code 需要独立发布或版本管理；
- Web adapter 与 application contract 已稳定；
- taxonomy、image 与 content schema 已足够成熟。

在这些信号出现前，目录迁移带来的 churn 高于收益。
