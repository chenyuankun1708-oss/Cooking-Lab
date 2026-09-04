# Roadmap

最近更新：2026-09-05

## 当前发布状态

- 当前版本：Cooking Lab Public Beta v0.1
- Production URL：[https://cooking-lab-pied.vercel.app](https://cooking-lab-pied.vercel.app)
- `Cooking Lab` 继续作为工程名 / working title 使用

## 已完成阶段

- M0 Product Foundation: completed
- M1 Data & Calculation Engine: completed
- M2 Web MVP: completed
- M3 Recommendation Engine: completed
- M4 Public Beta readiness: completed

M4 已结束于“可公开访问的 Public Beta 成功上线”，不再停留在 deployment-ready 状态。

## 当前阶段

### M5 Content, Brand & Experience

M5 的核心目标是把当前可运行、可解释、可部署的料理产品，升级为一个更适合真实消费者持续使用的内容与体验产品。

这一阶段重点不是堆功能，而是补足四类能力：

- Content：从 30 道菜走向约 100 道结构化菜谱，并建立更完整的料理内容世界
- Brand：明确消费者产品的品牌气质、命名方向与视觉方向
- Experience：把当前工具型界面升级为更有食欲和发现感的 Web 体验
- App-ready Architecture：让新领域能力保持可被未来 Mobile client 复用

## M5 工作流

GitHub tracking:

- Epic: `#15`
- A Brand: `#16`
- B Taxonomy: `#17`
- F Shared core audit: `#18`
- C 30 -> 100 recipes: `#19`
- D Image system: `#20`
- E Consumer Web redesign: `#21`

### A. Brand and visual design system

定义品牌方向、视觉关键词、设计原则、首页和详情页方向，但不在这一阶段拍板最终品牌名。

### B. Recipe Taxonomy v2 and cultural metadata

定义 `country / region / cuisine / subCuisine` 及相关内容元数据，让菜谱不再只停留在“中式 / 西式 / 融合”的粗粒度分类。

### C. Expand structured recipe dataset from 30 to 100

在 taxonomy 稳定后，扩展内容覆盖面，形成一个更像“小型世界料理地图”的结构化数据集。

当前已完成 100 道 recipe、73 种 ingredient、16 种 technique 与 20 个 country 状态的覆盖；详细基线见 `docs/RECIPE_COVERAGE.md`。

### D. Recipe image system and visual asset pipeline

建立合法可追溯的图片 schema、来源管理和前端图片策略，为 hero image 和未来内容视觉打底。

当前已建立 shared image contract、集中 license registry、validation、Next/Image adapter 与稳定 fallback。真实 100-image coverage 保留为后续独立 content batches，不在 schema Issue 中批量抓取。

### E. Consumer Web experience redesign

在品牌、图片和内容方向稳定后，重做首页、卡片、目录和详情页体验，但继续保留确定性推荐引擎。

Issue #21 当前已完成代码实现：food-first 首页、渐进式推荐条件、视觉优先卡片、taxonomy 驱动的服务器端目录探索、editorial detail v2，以及 10 张已核验授权的 seed images。完成验证与 PR review 后，M5 的主要 Web 交付即可收口。

### M5.1 Product Naturalization & Content Quality

GitHub tracking：Epic `#28`，Flavor & Human Language `#29`，后续 Recipe Quality `#30`、Similar Recipes `#31`、Living Hero `#32`。

Issue #29 已完成并通过 PR #33 合并：canonical Flavor Profile、自然时间语言、Flavor-aware deterministic recommendation 和现有页面语言自然化已经进入 `main`。

Issue #30 建立 Recipe publishing gate 并完成初始内容深化：保留 100 道 structured recipes，先公开 10 道经图片和人工内容审校的 Recipe；首页、目录、推荐、详情与 SSG 全部基于统一 public source。Similar Recipes 与 Living Hero 继续分别留给 #31 / #32，本 Issue 不提前实现。

### F. Shared core audit for future mobile app

审计当前耦合边界，约束后续 M5 工作避免把新领域能力写死在 Next.js 或 React 里。

当前实现进度：

- 已完成 shared core / application / Web adapter / data 的模块审计
- 已将 recipe detail 的纯数据聚合与 Web display formatting 分离
- 已增加 framework coupling 与 JSON serialization guard tests
- 保持单仓库，不提前迁移 monorepo 或创建 Mobile app

## 推荐依赖关系

1. A 与 B 可以并行开始。
2. F 可以在 M5 前期独立推进，不阻塞其他内容工作。
3. B 完成后，再推进 C 的 30 -> 100 数据扩展。
4. A 与 B 足够稳定后，再推进 D 的图片 schema 和素材管线。
5. A、D 与足够成熟的内容数据准备好后，再推进 E 的消费者 Web 重设计。

## M5 之后

以下方向保留在后续阶段，不属于当前 M5 规划之外的直接交付：

- Pantry quantities 与库存数量建模
- 用户账号与保存偏好
- Household 偏好建模
- Weekly meal planner
- Shopping list
- substitutions
- 更真实的营养数据来源
- 更真实的价格来源
- 饮食记录
- AI cooking companion
- Native app

这些方向会受 M5 的 taxonomy、内容、品牌和架构决策影响，但不会在本轮一次性实现。
