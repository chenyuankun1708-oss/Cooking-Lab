# Architecture

## 当前分层

当前仓库仍遵循：

`app/components`（UI） -> application helpers / page composition -> `lib`（领域逻辑与适配） -> `data`（本地 TypeScript 数据） -> `types`（共享契约）

这条主线在 M0-M4 阶段是成立的，也是后续 M5 继续保持的基本边界。

## 当前模块状态

- `types/`：共享的 Ingredient、Recipe、Nutrition、Recommendation 契约
- `types/culinary.ts`：M6 CulinaryItem discriminated union，以及 Story、Source、Evidence、Translation 与 Pairing contracts
- `types/research.ts`：source catalog、research decisions、considered claims 与 ResearchRecord contract
- `lib/culinary-item-adapter.ts`：现有 Recipe 到 DishItem 的只读渐进迁移 adapter
- `lib/culinary-validation.ts` / `lib/culinary-publishing.ts`：framework-independent schema 与 item-type publishing skeleton
- `lib/research-validation.ts`：framework-independent source catalog / research registry validation 与 deterministic reference collection
- `data/research/`：非生产的 evaluated source catalog 与三个 workflow exercises
- `data/`：本地静态 demo 数据
- `lib/unit-conversion.ts`：单位换算纯函数
- `lib/nutrition.ts`：营养估算引擎
- `lib/cost.ts`：成本估算引擎
- `lib/recommendation.ts`：规则推荐、评分、解释与部分 application helper
- `lib/recipe-exploration.ts`：目录搜索与 taxonomy/time 组合过滤的纯 application helper
- `types/flavor.ts`：framework-independent Flavor Profile、稳定 ID 与 preference contract
- `data/flavor.ts`：Flavor vocabulary、localized labels 与用户偏好映射
- `data/recipe-flavors.ts`：100 道 recipe 的 canonical Flavor Profile 数据
- `lib/flavor.ts` / `lib/flavor-validation.ts`：确定性评分、描述与 validation
- `lib/cooking-time.ts`：精确分钟到自然时间分组的集中 presentation helper
- `types/taxonomy.ts`：taxonomy v2 与 cultural metadata 契约
- `data/taxonomy.ts`：machine value registry 与中英 label source
- `lib/taxonomy.ts`：taxonomy helper、兼容派生标签与展示适配
- `lib/display-labels.ts`：稳定 machine value 的展示映射
- `lib/formatters.ts`：展示层估算文案和精度格式
- `lib/recipe-detail.ts`：framework-independent 的详情 use case 与数值聚合
- `lib/recipe-detail-display.ts`：当前 Web 详情页的 label 与展示格式适配
- `lib/recipe-publishing.ts`：framework-independent publication eligibility 与可见性规则
- `lib/recipe-similarity.ts`：独立于 Recommendation 的 deterministic Recipe similarity、breakdown 与 signals
- `lib/recipe-similarity-display.ts`：把 similarity signals 转为当前 Web 使用的 `zh-CN / en` 自然理由
- `lib/homepage-hero.ts`：把 published Recipe、Flavor、human time 与 image metadata 组合为可序列化 Hero view model
- `lib/homepage-hero-rotation.ts`：与 React 无关的 index、wrap、timing 与 auto-rotation policy
- `data/published-recipes.ts`：当前 Web 的唯一公开 Recipe adapter，并负责本地 hero 文件存在性注入
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
- Flavor schema、scoring、validation 与自然时间分组

这些模块当前没有依赖 React、Next.js、DOM 或 Tailwind，是未来抽离共享核心时最自然的保留对象。

### 当前主要耦合点

#### 1. Recipe detail 已拆分 application 与 Web display

`lib/recipe-detail.ts` 负责 slug 查找、ingredient lookup、营养/成本聚合和 warning，返回 machine values 与原始数值。`lib/recipe-detail-display.ts` 才负责“分钟”“预计 ¥”等当前 Web 文案、单位 label 和 taxonomy label。

未来 Mobile 可以直接消费 application model，或建立自己的 display adapter，不需要复用 Web 字符串。

#### 2. 首页交互保持小型 client boundaries

`app/[locale]/page.tsx` 继续是 Server Component。它从 locale-filtered published data 构建 Hero view model 和推荐数据，只把五道可序列化 Hero item 传给 `components/home-hero-carousel.tsx`；该 client component 只负责 active index、timer、visibility、reduced motion 和 controls，不 import raw recipes、filesystem validation 或 100 道数据。

`components/recipe-discovery.tsx` 是另一个局部 client boundary。它负责把交互输入组装成 `RecommendationCriteria` 并调用 application helper，但评分、硬限制、营养和成本计算仍全部留在 `lib/`。

- 筛选 UI
- application criteria state
- recommendation helper 调用
- 当前首页的 progressive disclosure 状态
- Living Hero 的轻量轮换状态

被集中在一个组件中。

目录探索不复用这条 client boundary。`/recipes` 通过 URL 参数和 `lib/recipe-exploration.ts` 在服务器端按 taxonomy、Flavor 与时间过滤，保持 SSR 优势，也没有复制 source of truth。

#### 3. Flavor 与 taxonomy 分离

`recipe.taxonomy` 继续是来源、菜系、技法、料理类型和用餐场景的 canonical source。`recipe.flavor` 是具体配方感官描述的 canonical source。两者没有 compatibility 双写；Web 通过 `lib/flavor.ts` 和 `lib/cooking-time.ts` 取得展示语言，推荐引擎直接消费可序列化 profile。

#### 4. 内容 schema 已进入 100 道菜与 seed image 阶段

Issue #17 到 #21 已把 taxonomy、100 道菜与 image registry 放进 framework-independent 层。当前仍有未完成部分：

- 只有 10 道 recipe 具备已审核 hero image 并进入公开集合，其他 90 道保留为 draft
- cultural metadata 目前只在少量 recipe 上示例性使用
- taxonomy registry 只覆盖当前数据集需要的稳定语义，不追求成为完整世界料理百科

这意味着内容域已经脱离“只有 `cuisine` / `tags` / `method`”的 MVP 状态，但距离 100+ recipes 与图片系统仍有后续工作。

#### 5. Structured data 与 public data 分离

`data/recipes.ts` 保留全部 100 道内容数据，用于 validation、coverage 和后续编辑。`lib/recipe-publishing.ts` 纯粹评估技术 eligibility，`recipe.publication.status` 记录独立的人工编辑决定；只有两者同时通过的 Recipe 才由 `data/published-recipes.ts` 暴露。

公开依赖方向为：

`app/components -> data/published-recipes.ts -> lib/recipe-publishing.ts -> recipes/images/ingredients`

Homepage、catalog、recommendation input、taxonomy option counts、detail lookup 与 SSG params 不再直接读取 raw `recipes`。本地文件检查留在 Node data adapter，通过回调注入纯 eligibility helper，因此核心发布规则仍可被未来客户端复用。

Recipe Detail 的相近料理遵循同一公开边界：页面把 `getPublishedRecipes()` 显式传入纯 `rankSimilarRecipes()`，similarity core 不 import raw recipes、published adapter 或 Recommendation Engine。Core 返回可序列化 score、dimension breakdown 和 signals；Web display adapter 与轻量 card 才负责中文理由、图片和布局。

Living Hero 同样不绕过公开边界：`data/homepage.ts` 只保存少量 slug 与 editorial line，`buildHomeHeroItems()` 对 published 状态、重复 slug 与 hero image 做 fail-fast 检查。初始 item 与轮换顺序固定，因此 SSR、hydration 和 LCP 都可预测。

### 当前前端边界

- `app/` 与 `components/` 依赖 Next.js、React、Link、Metadata 和 CSS class，是明确的 Web-only 层
- `lib/site.ts`、`components/site-footer.tsx` 等是当前 Web 站点品牌与公共文案层，不应被误认为共享 core

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

图片 metadata、来源与 license 记录属于共享内容模型，不应只存在于前端组件 props 里。当前采用：

- `types/image.ts`：可序列化图片契约
- `data/recipe-images.ts`：可用图片 registry 与版权 metadata source of truth
- `Recipe.heroImageId?`：Recipe 到 hero 的稳定引用
- `lib/recipe-images.ts` / `lib/image-validation.ts`：framework-independent lookup、fallback data 与 validation
- `components/recipe-image.tsx`：Web-only Next/Image adapter

本地静态资产是 M5 默认交付方式；远程 CDN 与 domain allowlist 在出现真实需求后再配置。完整规则见 `docs/IMAGE_SYSTEM.md`。

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

完整模块地图、guardrails 与迁移触发条件见 `docs/SHARED_CORE.md`。

## M6 Culinary Knowledge Boundary

Issue #38 在不改变 Web runtime 的前提下增加下一代 domain 边界：

```text
Current Web -> published Recipe adapter -> current engines
                         |
                         +-> read-only CulinaryItem adapter

Future clients -> application repositories -> CulinaryItem / Story / Evidence
                                           -> existing Flavor/Nutrition/Cost engines
```

`Recipe` 仍是当前 100 条数据和 10 条公开内容的 source of truth。`CulinaryItem` 不成为第二份静态数据，也不要求现有页面双读；adapter 只进行可验证投影。Story Claim、Evidence 与 Source 使用 ID reference 保持实体生命周期独立，Source 通过 URL/DOI/ISBN/archive/physical citation locator 与持久化方式解耦。Translation 使用 locale entry，不让 locale 进入字段名。

Provenance traversal 只有一条明确路径：`CulinaryItem.storyIds -> Story.claims -> Evidence -> Source`。没有泛化的 `item.evidenceIds`；当且仅当后续出现 Story 之外的明确 field assertion 用例时，再引入最小 ItemClaim，而不是建立模糊的 knowledge graph。

Persistence 明确停在 port/adapter 边界：domain 接收和返回普通可序列化 TypeScript 值；未来数据库 schema、ORM model、filesystem 检查和 Web formatting 都属于外层 adapter。当前没有足够 use case 定义稳定 repository 方法，因此本 Issue 记录边界但不制造空接口或引入基础设施。完整决策与迁移矩阵见 `docs/CULINARY_KNOWLEDGE_MODEL.md`。

Issue #39 在此边界内增加人工/半自动 research pipeline，不改变运行时依赖方向：

```text
Evaluated source catalog -> ResearchRecord -> reviewed Source/Evidence
                                             -> Draft Story Claim
                                             -> existing Culinary publishing traversal
```

ResearchRecord 是 decision history，不是 production knowledge node。Source Registry、Evidence Registry 和 publishable Story 仍保持独立生命周期。Validator 可以检查 locator、rights metadata、重复与断裂引用；可信度、历史解释、版权歧义、文化措辞和最终发布必须人工决定。当前没有网络请求、scheduler、crawler、database 或 CMS。流程细节见 `docs/CONTENT_RESEARCH.md`，版权与 link-rot policy 见 `docs/SOURCE_POLICY.md`。

## M6 Unified Culinary Library

Issue #40 第一次在兼容架构上加入 native production content：

```text
getPublishedRecipes() -> Recipe adapter --+
                                         +-> candidates -> publishing gate -> getPublishedCulinaryItems()
data/culinary/items/* --------------------+
        |                    |             |
        +-> images           +-> Story -> Evidence -> Source
        +-> ingredients / Flavor / taxonomy / pairing
```

`data/culinary/` 按 item type 和 provenance concern 拆分，避免单个巨型 data file。`lib/culinary-library-validation.ts` 负责跨 item 的 ID/slug 唯一性和 public filtering；`lib/culinary-publishing.ts` 按类型验证 preparation、nutrition/cost、图片与可达 provenance。filesystem 检查仍由 `data/published-culinary-items.ts` 通过回调注入，domain 不 import Node filesystem。

统一 repository 当前包含 10 个 adapted Recipe 和 16 个 native item。现有 homepage、catalog、detail、recommendation、similarity 与 SSG 不切换读取源，因此 #40 没有造成双维护，也没有提前实施 #41 Story UI、#42 visual/bilingual experience 或 #43 Meal Engine。

## M6 Story Experience Boundary

Issue #41 在统一 public boundary 上增加独立阅读路径，同时保持 domain、application 与 Web 分层：

```text
Story / Evidence / Source registries
          + published CulinaryItems
                    |
                    v
      story publishing + view-model helpers
                    |
                    v
       Server routes and presentation components
```

`lib/story-publishing.ts` 负责 Story publication、reviewed translation 与 Story -> CulinaryItem / Evidence / Source 完整性。`lib/story-experience.ts`、`lib/culinary-routes.ts` 和 `lib/culinary-detail.ts` 是 framework-independent application helpers；`data/published-stories.ts` 在服务器端组合 registry 并只输出 consumer view model。React 不读取 raw Evidence/Source，consumer source 不包含 reliability、rights、health、strength、IDs 或 editorial notes。

Canonical route 由内容来源决定：adapted Recipe 继续使用 `/recipes/[slug]`，native CulinaryItem 使用 `/culinary/[slug]`，Story 使用 `/stories/[slug]`。`/culinary` 只生成 16 个 native static params，不为 Recipe 建立重复 URL；Recommendation、Recipe similarity 与现有 Recipe catalog 仍不改 source。详细体验与关联规则见 `docs/STORY_EXPERIENCE.md`。

## M6 Localized Web Boundary

Issue #42 将所有公开页面移动到 `app/[locale]`，只支持 canonical `zh-CN / en`。旧无 locale 路由位于 `app/(legacy)`，仅服务器重定向到默认中文 URL；domain ID 与 slug 不变，canonical/hreflang 由 route metadata 生成。

`lib/messages.ts` 负责 UI chrome，`data/localization/*` 负责 reviewed public editorial copy，taxonomy/Flavor/tool/unit helper 负责稳定 ID 到 label 的解析。公开英文不走中文 fallback；未完成翻译的内容不会进入英文 public output。Recommendation 与 Similarity core 只返回可序列化结构数据，人类语言分别由 display adapter 生成，因此 shared core 不再拼中文句子。

字典和 editorial copy 在服务器端解析，现有 client JS 边界没有扩大，也没有引入 i18n dependency。完整 route、coverage、fallback 与 metadata 规则见 `docs/LOCALIZATION.md`。
