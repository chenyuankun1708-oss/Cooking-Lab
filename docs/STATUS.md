# Status

最近更新：2026-09-05

## 当前阶段

Cooking Lab Public Beta v0.1 已上线，M5 消费者 Web 重设计已合并，当前进入 M5.1 `Product Naturalization & Content Quality`。

Production URL：
[https://cooking-lab-pied.vercel.app](https://cooking-lab-pied.vercel.app)

## 已确认的真实状态

- GitHub PR #14 已于 2026-09-03 merge 到 `main`
- GitHub Issue #7 已于 2026-09-03 自动关闭
- GitHub PR #22 已于 2026-09-03 merge 到 `main`
- GitHub Issue #16 已于 2026-09-03 closed
- GitHub PR #26 已于 2026-09-05 merge 到 `main`
- GitHub Issue #20 已关闭
- GitHub PR #27 已于 2026-09-05 merge 到 `main`
- GitHub Issue #21 已关闭
- GitHub PR #33 已于 2026-09-05 merge 到 `main`
- GitHub Issue #29 已关闭
- GitHub PR #34 已于 2026-09-05 merge 到 `main`
- GitHub Issue #30 已关闭
- GitHub PR #35 已于 2026-09-05 merge 到 `main`
- GitHub Issue #31 已关闭
- GitHub Epic #28 与 Issue #32 当前 open
- Issue #32 工作分支为 `feature/issue-32-living-homepage-hero`
- `main` 已包含最新 Public Beta 代码
- Production 已通过 Vercel 部署并可访问
- 当前 M0-M4 已完成
- M5 已启动

## 已完成能力

- Next.js / TypeScript / Tailwind Web 应用骨架
- Ingredient、Recipe、Nutrition、Recommendation 类型系统
- 73 种 `demo-estimated` 食材与 100 道结构化菜谱
- Unit Conversion、Nutrition Engine、Cost Engine 与 Dataset Validation
- 硬限制 + 软偏好的确定性 Recommendation Engine
- 首页即时料理决策、已发布目录、稳定 slug 详情页
- Public Beta disclaimer、404、反馈入口和基础 metadata
- 已上线的 Public Beta 生产环境

## 当前架构审计结论

Issue #18 shared core audit 已完成代码侧最小调整：

- `lib/recipe-detail.ts` 现在只返回原始数值、machine values 与可序列化 application data
- `lib/recipe-detail-display.ts` 承担当前 Web 的中文 label、单位与估算文案
- 新增 guard tests，防止候选 shared core 引入 React、Next.js、DOM 或样式依赖
- 新增 serialization tests，覆盖 recipe detail 与 recommendation 公开结果
- 保留当前单仓库结构；完整审计见 `docs/SHARED_CORE.md`

### 当前优势

- 大多数领域逻辑仍是框架无关的 TypeScript 模块
- Recommendation、Nutrition、Cost、Validation 与 Repository 没有依赖 React 或 Next.js
- 当前静态数据和 repository 结构仍允许后续更换数据来源

### 当前耦合点

- `app/` 与 `components/` 是纯 Web 展示层；首页推荐已经改为 progressive disclosure，不再使用固定 dashboard sidebar
- `components/recipe-discovery.tsx` 只负责 criteria state 与展示，继续消费原有 deterministic recommendation helper
- recipe detail 已拆为 framework-independent application model 与 Web display adapter
- image asset schema、license registry 与 Web adapter 已建立，当前已有 10 张逐张核验的 seed hero assets
- cultural metadata 目前只在少量 recipe 上示例性使用

### M5 约束

- 新增 taxonomy、image schema、content metadata、future household extension points 时，优先放入 framework-independent 的 types / lib 层
- 不为“未来 Mobile”立刻做大规模目录迁移或 monorepo 重构
- 只有在第二客户端或明显的共享包维护痛点出现后，再评估 `apps/ + packages/` 迁移

## 本轮 M5 规划产物

- 更新 `docs/PRODUCT.md`
- 更新 `docs/ROADMAP.md`
- 更新 `docs/STATUS.md`
- 更新 `docs/ARCHITECTURE.md`
- 新增 `docs/BRAND_BRIEF.md`
- 新增 `docs/CONTENT_STRATEGY.md`
- 新增 `docs/TAXONOMY.md`
- 已建立 M5 Epic 与分拆 Issues：`#15` - `#21`

## Issue #16 当前产物

Issue #16 `[M5] Define brand and visual design system` 当前已在品牌规划分支中形成以下文档产物：

- 新增 `docs/BRAND_DIRECTIONS.md`
  - 当前 Production 视觉审计
  - A / B / C 三套品牌与视觉方向
  - Naming exploration
  - Design token proposal v0.1
  - Homepage wireframes
  - Recipe Card v2 / Recipe Detail v2 方向
  - Photography direction
  - IP / character direction
- 更新 `docs/BRAND_BRIEF.md`
- 新增 repo-level `DESIGN.md` 作为后续 UI / UX 实现的设计基线

当前方向已确认，不再停留在“待用户从 A / B / C 中选择”的状态。

### 已确认方向

- Visual direction：`Fresh Editorial 70% + Modern Culinary Lab 30%`
- Working brand：`Cooking Lab`
- Naming status：deferred until after M5 visual prototype / redesign
- Photography：editorial food-first 为主，modern culinary studio 为辅
- Character / mascot：长期可能性保留，但 M5 当前不做 visual mascot implementation

这意味着 Issue #16 已从“提出可选方案”进入“方向已确认并可供后续重设计引用”的收口状态，但尚未进入最终 UI 实装。

## Issue #17 当前产物

当前分支 `feature/issue-17-recipe-taxonomy-v2` 已完成 taxonomy v2 的核心实现与 30 道现有 recipe 迁移，主要包括：

- 新增 `types/taxonomy.ts`
  - origin / cuisine / subCuisine
  - techniques
  - dish type / meal occasion
  - flavor profile
  - dietary / browse tags
  - optional cultural metadata
  - lightweight provenance references
- 新增 `data/taxonomy.ts`
  - stable machine values
  - `zh-CN` / `en` labels
  - registry-based lookup
- 新增 `lib/taxonomy.ts`
  - label resolution
  - compatibility helpers for filters and recommendation
  - derived tag strategy for `high-protein` / `low-oil` 等运行时标签
- 全量迁移当前 30 道 recipe 到 `taxonomy` source of truth
- 更新 recipe detail / card 展示以消费新 taxonomy
- 新增 `docs/TAXONOMY.md`
- 新增 taxonomy / validation / compatibility tests

这意味着 M5 的 taxonomy、label strategy 和 cultural metadata contract 已经有了独立 schema，但 image system 与 30 -> 100 数据扩充仍是后续工作。

### Hardening update

在当前 PR review / hardening 阶段，已进一步确认并收紧：

- `recipe.taxonomy` 是唯一 canonical source of truth
- `quick` 改为由 `totalTime` 派生，不再静态维护
- `high-protein / high-fiber / low-oil / no-added-sugar` 继续保持 derived attributes
- 对无 provenance 的文化性断言做了删除或降级为现代 recipe context
- 详情页只保留最小 taxonomy 适配，不把所有新字段直接铺成 sidebar 信息卡

## Issue #19 当前产物

PR #25 已将数据集扩展到 100 道 recipe，并完成时间与家庭可执行性 hardening：

- `totalTime` 现在明确覆盖食材声明状态之后的主动操作与必要等待
- 干扁豆、熟鹰嘴豆、熟黑豆、熟米饭使用不同稳定 ID，避免营养、重量和时间语义混用
- 清除了 10 道 recipe 的隐藏干豆/冷饭前置步骤，并补齐相关 tools 与步骤顺序
- 30 / 45 / 60 分钟 recommendation 场景均只返回可在声明时间内完成的 recipe

## Issue #20 当前产物

PR #26 已建立 Recipe Image System 基础并 merge 到 `main`：

- `types/image.ts` 定义 framework-independent image、source、license、focal point 与 AI provenance
- `data/recipe-images.ts` 集中维护可用图片与版权 metadata，Recipe 只保存可选 `heroImageId`
- validation 拒绝悬空引用、非法路径、空 hero alt、缺失 CC attribution 及 NC / ND / unknown / prohibited 授权
- Web 使用 Next/Image adapter，detail hero preload、card lazy loading，并在无图或加载失败时保持稳定 fallback
- 当前不加入来源未经核验的 sample asset；100 张 hero images 作为后续独立 content batches
- 完整策略与逐张素材工作流见 `docs/IMAGE_SYSTEM.md`

## Issue #21 当前产物

PR #27 已合并并完成：

- Food-first 首页与真实料理 hero
- 今晚灵感、菜系探索和技法探索内容层级
- Primary / Secondary / Advanced 渐进式推荐条件
- 以菜名、描述和推荐理由为主的 Recipe Card v2
- URL 驱动、服务器端执行的 taxonomy 目录筛选
- 取消 sticky metric sidebar 的 Recipe Detail v2
- 10 张来自 Wikimedia Commons、授权和 attribution 完整的 seed images
- 保持 recommendation、nutrition、cost、taxonomy 与 shared-core 边界不变

## Issue #29 当前产物

PR #33 已合并并建立 M5.1 Flavor 与自然语言基线：

- `recipe.flavor` 取代旧 `taxonomy.flavorProfile`，成为唯一 canonical Flavor source
- 100 道 recipe 完成保守 Flavor Profile 迁移
- 基础味使用 `0–4` 编辑强度，香气、口感与饮食感受使用克制的稳定词汇
- 清淡、鲜辣、酸爽、浓郁、焦香、暖乎乎作为 deterministic soft preferences 进入推荐
- 时间按照真实 100 道分布映射为轻松快手、日常料理、慢慢做、值得等待，精确分钟继续保留
- 首页、目录、卡片和详情页移除匹配百分比、数据库计数 CTA、重复“为什么这样做？”与主要区域 Beta 说明框

## Issue #30 当前产物

PR #34 已合并并建立 Recipe publishing 与 quality gate：

- 100 道 structured recipes 全部保留，publication status 明确区分 `draft / reviewed / published`
- 技术 eligibility 与编辑发布状态分离，只有 `published` 且通过校验的 Recipe 可公开
- 初始 published set 为 10 道已有合法 hero 的 Recipe；静态详情页参数同为 10
- 10 道公开 Recipe 已逐道深化为 4–6 个真实步骤，补齐 sensory cues、doneness、调味时机和失败预防
- Homepage、catalog、recommendation、taxonomy options、detail lookup 与 SSG 统一消费 `data/published-recipes.ts`
- 未发布 slug 不生成静态详情，直接进入公开路由时返回 404

## Issue #31 当前产物

PR #35 已合并并建立 deterministic similar-recipe discovery：

- `lib/recipe-similarity.ts` 与 Recommendation Engine 完全分离，返回可序列化 score、五维 breakdown 与 signals
- Flavor / Ingredient 权重合计 0.75；cuisine、technique 与 dish type 只作辅助，时间不参与
- salt / oil / seasoning 与常见 aromatic ingredient 不计入主食材 overlap；只保留六个有实际用途的 ingredient family
- 默认 `0.28` threshold 来自当前 10 道 published Recipe 的 pairwise editorial calibration
- Recipe Detail 末尾只展示达到阈值的 1–4 道 published Recipe；结果不足时不填充低质量卡片
- Similar Recipe card 只展示图片、料理名、Flavor、自然理由和人类时间，不暴露 similarity score

## Issue #32 当前产物

当前分支已完成 Living Editorial Hero 实现，PR 待创建：

- `data/homepage.ts` 集中维护五道 published Hero recipe 与短 editorial line，顺序固定且不伪装个性化
- Server homepage 构建只含展示字段的 Hero view model，小型 client carousel 不读取 raw recipes 或 filesystem
- 自动轮换为 7 秒，图片使用 700 ms crossfade；previous、next 与五个 indicator 均为 44 px button
- hover、focus 与 document hidden 暂停 timer，手动操作后重新计时；reduced motion 禁用自动轮换并移除视觉 transition
- 只有首张 LCP 图片 preload，初始仅准备当前和下一张图片，后续随轮换逐张挂载
- active recipe link、alt、Flavor、human time、source、author、license 与 attribution 随 slide 一致更新
- 375 / 390 / 768 / 1024 / 1440 五个断点已逐张检查 crop、对比度、稳定高度与控制位置

## 当前产品缺口

- 100 道菜已形成第一版料理世界地图，但文化 provenance 与更深 region coverage 仍需持续审核
- 当前只有 10 / 100 道 recipe 有已审核 hero image；其余 90 道保留为 draft，不进入公开 UI
- 更深的文化 provenance 和地域覆盖仍需作为内容审核持续推进
- Household、个人口味和长期陪伴能力仍只有方向，没有 schema

## 下一步

1. 完成 Issue #32 最终验证、PR 创建与 review。
2. #32 merge 后执行一次 Product Owner Review，观察真实首页节奏、图片加载与 editorial set。
3. Epic #28 在 Product Owner Review 前保持 open，不开始新的 implementation Issue。
