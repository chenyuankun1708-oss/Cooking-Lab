# Architecture

## 当前分层

当前仓库仍遵循：

`app/components`（UI） -> application helpers / page composition -> `lib`（领域逻辑与适配） -> `data`（本地 TypeScript 数据） -> `types`（共享契约）

这条主线在 M0-M4 阶段是成立的，也是后续 M5 继续保持的基本边界。

## 当前模块状态

- `types/`：共享的 Ingredient、Recipe、Nutrition、Recommendation 契约
- `data/`：本地静态 demo 数据
- `lib/unit-conversion.ts`：单位换算纯函数
- `lib/nutrition.ts`：营养估算引擎
- `lib/cost.ts`：成本估算引擎
- `lib/recommendation.ts`：规则推荐、评分、解释与部分 application helper
- `types/taxonomy.ts`：taxonomy v2 与 cultural metadata 契约
- `data/taxonomy.ts`：machine value registry 与中英 label source
- `lib/taxonomy.ts`：taxonomy helper、兼容派生标签与展示适配
- `lib/display-labels.ts`：稳定 machine value 的展示映射
- `lib/formatters.ts`：展示层估算文案和精度格式
- `lib/recipe-detail.ts`：详情页 view model 聚合
- `lib/*validation*.ts`：静态数据校验
- `lib/ingredient-repository.ts`：数据来源抽象
- `app/`：Next.js 路由、metadata 与页面组合
- `components/`：Web UI 组件

## M5 架构审计

### 现在已经可以被未来 Web + Mobile 复用的部分

以下模块目前基本保持 framework-independent，可视为未来 `Cooking Core` 的种子：

- `types/*`
- `data/*`
- `lib/unit-conversion.ts`
- `lib/nutrition.ts`
- `lib/cost.ts`
- `lib/ingredient-repository.ts`
- `lib/ingredient-validation.ts`
- `lib/recipe-validation.ts`
- `lib/dataset-validation.ts`
- `lib/recommendation.ts` 中偏领域的硬限制、软偏好、评分和解释逻辑

这些模块当前没有依赖 React、Next.js、DOM 或 Tailwind，是未来抽离共享核心时最自然的保留对象。

### 当前主要耦合点

#### 1. `lib/recipe-detail.ts` 是 Web view-model 适配层

它目前同时承担：

- slug 查找
- 调用营养与成本引擎
- machine-value label fallback
- 时间 / 营养 / 成本的最终展示格式化
- 详情页 warning 组装

这使它更接近“Web 详情页适配器”，而不是纯领域 core。M5 之后如果要支持 Mobile，推荐把这一层明确视作 application/view-model，而不是继续往里塞更多 shared domain responsibility。

#### 2. `components/recipe-discovery.tsx` 直接驱动推荐体验

当前首页发现体验只有一个真正的 client component，这是好事；但它也意味着：

- 筛选 UI
- application criteria state
- recommendation helper 调用
- 当前首页的工具式 IA

被集中在一个组件中。

这对 MVP 是合理的，但 M5 要重做首页体验时，推荐把“用户表达条件 -> 生成 criteria -> 调用 shared recommendation -> 组织视图模型”这条链条拆得更清楚，避免消费者体验重设计时被旧工作台式布局绑住。

#### 3. 内容 schema 正在从 MVP 粒度升级，但图像与更广覆盖仍未完成

Issue #17 已把 taxonomy v2 放进 framework-independent 层，但 M5 内容域仍有未完成部分：

- 没有图片 schema
- cultural metadata 目前只在少量 recipe 上示例性使用
- taxonomy registry 目前只覆盖现有 30 道菜与近期扩展必需值，不是完整世界料理百科

这意味着内容域已经脱离“只有 `cuisine` / `tags` / `method`”的 MVP 状态，但距离 100+ recipes 与图片系统仍有后续工作。

### 当前前端边界

- `app/` 与 `components/` 依赖 Next.js、React、Link、Metadata 和 CSS class，是明确的 Web-only 层
- `lib/site.ts`、`components/beta-note.tsx`、`components/site-footer.tsx` 等是当前 Web 站点品牌与公共文案层，不应被误认为共享 core

## M5 目标架构方向

长期目标不是“把 Next.js 项目扩成更大的 Next.js 项目”，而是让 Web 成为多个客户端之一：

```text
Web App
        \
         Cooking Core
        /
Mobile App
```

未来的 `Cooking Core` 应包含：

- Recipe domain
- Ingredient domain
- Nutrition engine
- Cost engine
- Recommendation engine
- Unit conversion
- Taxonomy
- Shared types
- Content metadata schema
- Image asset schema

这些能力都不应依赖：

- React
- Next.js
- DOM
- 浏览器 API
- Tailwind

## M5 新增领域的放置原则

### Taxonomy v2

Taxonomy 的 schema、validation、registry 与 fallback/compatibility helper 应定义在 `types/`、`data/` 与 `lib/` 的 framework-independent 层，而不是放进页面组件或 UI 文案中。当前已采用：

- `types/taxonomy.ts` 保存契约
- `data/taxonomy.ts` 保存 registry 与 localized labels
- `lib/taxonomy.ts` 提供 recommendation/filter/detail page 所需的派生 helper

这样可以在不改动 UI filter contract 的前提下，让 taxonomy 成为真正的 source of truth。

### Image system

图片 metadata、来源与 license 记录属于共享内容模型，不应只存在于前端组件 props 里。

### Story / cultural context

这类内容字段应作为 optional structured metadata 存在；是否显示、如何显示，是 Web / Mobile 自己的事情。

### Household extension points

未来 Household 不应直接从页面状态长出来，而应以独立领域对象进入 shared core。M5 只记录扩展边界，不建设数据库或账号系统。

## 近中期迁移建议

### 现在不做的事

- 不因为目录美观就立刻迁移到 monorepo
- 不为了“App-ready”先重写全部 import path
- 不把所有 `lib/` 立刻拆成多个 package

### 现在应该做的事

- 新增 schema 时优先保持纯 TypeScript、无框架依赖
- taxonomy / provenance / cultural metadata 优先落在 shared core 种子层，再由 Web 详情页做轻量 view-model 适配
- 把 Web-specific view model 适配层和纯领域逻辑在文档与代码上区分开
- 避免在 `app/` 或 `components/` 中新增不可复用的业务规则
- 为未来 `apps/web` + `apps/mobile` / `packages/core` 的迁移留下清晰边界

## 何时再评估 monorepo

只有在出现以下信号时，才建议正式迁移：

- 已开始建设第二个真实客户端（例如 React Native / Expo）
- shared core 的发布或复用已经成为持续痛点
- Web 端 view-model 与 core 边界已经足够清晰
- M5 的 taxonomy / image / content schema 已经稳定，值得沉淀为 package

在这些条件出现之前，当前单仓库继续演进是更稳妥的选择。
