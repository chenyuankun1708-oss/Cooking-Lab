# Status

最近更新：2026-09-04

## 当前阶段

Cooking Lab Public Beta v0.1 已上线，当前进入 M5 `Content, Brand & Experience` 的规划、品牌定义与架构审计阶段。

Production URL：
[https://cooking-lab-pied.vercel.app](https://cooking-lab-pied.vercel.app)

## 已确认的真实状态

- GitHub PR #14 已于 2026-09-03 merge 到 `main`
- GitHub Issue #7 已于 2026-09-03 自动关闭
- `main` 已包含最新 Public Beta 代码
- Production 已通过 Vercel 部署并可访问
- 当前 M0-M4 已完成
- M5 已启动

## 已完成能力

- Next.js / TypeScript / Tailwind Web 应用骨架
- Ingredient、Recipe、Nutrition、Recommendation 类型系统
- 30 种 `demo-estimated` 食材与 30 道结构化菜谱
- Unit Conversion、Nutrition Engine、Cost Engine 与 Dataset Validation
- 硬限制 + 软偏好的确定性 Recommendation Engine
- 首页即时料理决策、全量目录、稳定 slug 详情页
- Public Beta disclaimer、404、反馈入口和基础 metadata
- 已上线的 Public Beta 生产环境

## 当前架构审计结论

### 当前优势

- 大多数领域逻辑仍是框架无关的 TypeScript 模块
- Recommendation、Nutrition、Cost、Validation 与 Repository 没有依赖 React 或 Next.js
- 当前静态数据和 repository 结构仍允许后续更换数据来源

### 当前耦合点

- `app/` 与 `components/` 是纯 Web 展示层，但首页交互当前高度依赖工具式筛选布局
- `components/recipe-discovery.tsx` 直接消费 recommendation helper，适合当前 MVP，但未来首页重设计时需要更清晰的 application adapter
- `lib/recipe-detail.ts` 同时承担数据读取、计算聚合、machine-value 映射和展示格式化，已经偏向 Web view-model，而非纯共享 core
- taxonomy、image asset、story / cultural context 等 M5 新领域目前尚无独立 schema

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

这意味着 M5 已经从“只有 roadmap”推进到“已有可供用户选择的品牌与视觉决策包”，但尚未进入最终 UI 实装。

## 当前产品缺口

- 当前 30 道菜仍不足以形成真正的内容型产品
- 菜系分类仍然过粗
- 缺少真实料理图像系统
- 首页和详情页仍明显带有工具 / dashboard / engineering demo 气质
- Household、个人口味和长期陪伴能力仍只有方向，没有 schema

## 下一步

1. 由用户选择 A / B / C 或混合方向，并确认命名探索收敛路径。
2. 启动或继续推进 M5 Issue B（Taxonomy）与 Issue F（App-ready architecture audit）。
3. 在 taxonomy 稳定后再推进 30 -> 100 的结构化 recipe 扩充。
4. 在品牌方向、摄影原则和图片系统足够稳定后推进消费者 Web 重设计。
