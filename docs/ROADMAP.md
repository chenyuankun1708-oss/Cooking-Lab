# Roadmap

最近更新：2026-09-08

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
- M5 Content, Brand & Experience: completed
- M5.1 Product Naturalization & Content Quality: completed
- M6 Culinary Knowledge Platform: completed
- M7 Decision Continuity & Meal Reliability: completed
- M9 Unified Culinary Experience & Content Expansion: completed
- M10 Commercial-ready Content Rights / Provenance / Attribution Gate: completed
- M11 From Decision to Table: completed under revised 50-item closeout scope

## 当前阶段：M12–M13 游戏料理数据库与 500+ 可发行库

GitHub tracking：M12 Epic `#100`（Issues `#101-#105`），M13 Epic `#106`（Issues `#107-#112`）。

- M12 建立与 Web 完全隔离的逐料理 JSON、量化食材、原子操作 DAG、营养 provenance、错误 mutation、`game-commercial-ready` 门禁和确定性 Godot/SQLite 导出。
- 当前 Web 50 项已迁移为 draft，不继承 Web rights/review，也不把演示营养表示为 USDA 数据。
- M13 使用 record-level USDA CC0 子集与第一方确定性公式按 120 → 250 → 500+ 容量门禁扩充；不恢复视频路线，不导入第三方菜谱表达。
- 520 条游戏专用候选已生成但保持 draft。完成真正独立的 review 与风险等价类 sampling QA 前，exportable 数量为 0。
- Web 继续公开中英文各 50 项；游戏内容不会自动晋升到 Web。

完整合同见 `docs/GAME_DATA_ARCHITECTURE.md` 与 `docs/GAME_PUBLISHING_GOVERNANCE.md`。

## 已完成：M11 从决定到上桌

GitHub tracking：Epic `#87`，Issues `#88-#94`。

- 已建立 `MealPlanV1`、确定性购物合并、最早可用设备时间线、追加/替换分离的安全 URL codec、V0 migration 与版本化 localStorage。
- 已增加双语 `/{locale}/plan`、推荐/详情/Pairing 入口、首页继续计划、详情章节导航、相似料理和双主题视觉基础。
- 当前 50 项已通过逐项 package module 进入 repository，并建立独立提交的 deterministic manifest 与 `content:audit`。
- M10.1 已建立显式 derivation、AI 输入与服务条款链、独立 agent attestation、risk-based sampling 和 fail-closed CI；agent review 保留真实 actor/run/context，不能表示为 human approval、料理实测或法律意见。
- Product Director 将 50 → 120、12 个产品档案、剩余餐厅重构与 Batch A/B 延期。公开库保持双语各 50 项，35 个 Batch A 候选只保留为未发布审计记录，不计作权利或内容审查 PASS。
- M11 未采用视频路线，不观看或总结视频，也不保存 timestamp、字幕、转录、截图、下载或外部媒体记录。

完整边界与收口决定见 `docs/M11_DECISION_TO_TABLE.md`。后续内容扩充不是正在执行的 Roadmap 项目；只有 Product Director 启动新 Goal 后才会恢复。

M4 已结束于“可公开访问的 Public Beta 成功上线”，不再停留在 deployment-ready 状态。

## 已完成的 M5 / M5.1

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

当前已完成 100 道 recipe、76 种 Recipe ingredient、16 种 technique 与 20 个 country 状态的覆盖；Issue #40 另增加 29 种只服务 native CulinaryItem 的食材，M10.1 图片/料理一致性修订补入烤花生、鲜香菇、白花椰菜和牛油果，repository 合计 106 种。Recipe 基线见 `docs/RECIPE_COVERAGE.md`。

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

Issue #31 建立独立 deterministic Recipe similarity：Flavor 与主食材为主要维度，cuisine、technique 和 dish type 只作辅助；详情页在正文末尾展示通过编辑阈值的少量 published Recipe 和自然理由。它不复用 Recommendation score，不扩大 published set，也不提前实现 #32 Living Hero。

Issue #32 已通过 PR #36 合并：五道 published Recipe 以固定编辑顺序、自然文案、Flavor 和 human time 呈现；自动轮换克制且支持手动控制、暂停、页面可见性与 reduced motion。M5.1 Epic #28 已关闭。

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

## 已完成：M6 Culinary Knowledge Platform

GitHub tracking：Epic `#37`，基础架构 `#38`，Content Research / Source & Provenance `#39`，Culinary Library expansion `#40`。

Issue #38 先建立 Culinary Knowledge Model 与低风险 migration architecture：shared base + 六类 discriminated union、不同 preparation semantics、Story/Claim、Source/Evidence、locale Translation、Pairing signals 和 item-type publication。当前 Recipe 通过 adapter 保持兼容，不做 100 条 big-bang rewrite。

Issue #39 在 #38 contract 上建立可重复的人工/半自动研究链：evaluated source catalog、rights policy、source health、ResearchRecord、八类研究模板和三个真实 mini exercises。它只验证研究到 publication candidate 的基础设施，不发布新内容，也不引入 crawler、scheduler、database、CMS 或 Story UI。

Issue #40 已实现第一批跨类型 production portfolio：16 个 native CulinaryItem 与 10 个 adapted published Recipe 组成 26 项统一公开 repository，覆盖六种 item type、七种 preparation kind、14 个 country ID、6 个可追溯 Story 和 26 张合格 hero。

Issue #41 建立紧凑 `/stories`、六篇 `/stories/[slug]` 阅读页和 16 个 native `/culinary/[slug]` 最小详情页。Recipe 继续使用原 canonical route；Story related exploration 采用 published-only deterministic signals，来源 UI 不暴露编辑内部 provenance。它不提前实现 #42 双语/全站视觉体验或 #43 Meal Engine。

Issue #42 建立 `zh-CN / en` locale route、strict reviewed public translation、双语 Recommendation/Similarity presentation 与 canonical/hreflang metadata。10 道 published Recipe、16 个 native CulinaryItem 和 6 篇 Story 全部覆盖英文；90 道 draft Recipe 保持不变。视觉以更亮 Hero、语义 surface、紧凑首页/目录和 Story/饮品层级继续演进，没有引入 i18n dependency、字体或动画库。

Issue #43 建立 deterministic Pairing / Meal Composition：固定 anchor、独立 pair/meal score、四个受当前内容支撑的模板、准备负担、partial nutrition/cost、默认无酒精与双语静态消费页。内容 audit 明确不开放四道式和独立 side 模板，并把 starter、side、dessert 与无酒精晚餐饮品缺口记录到 `docs/PAIRING_CONTENT_GAPS.md`。

M6 已完成；M7 随后修复了 Discovery、Recipe、Pairing、返回与 locale switch 之间的 Decision Context 连续性，并使整餐 time/tools 约束、partial/empty 与显式 relaxation 达到内部验证门槛。

Epic #37 的 knowledge model、source/provenance、跨类型 library、Story、双语体验与 Pairing/Meal Engine 已按依赖顺序完成实现。数据库、CMS、自动抓取、weekly planner、shopping list 和 Mobile app 仍不由 M6 前置实施。

## 已取消：M8 Bounded External Validation

GitHub tracking：Epic `#60`，研究协议 `#61`，双语参与入口 `#62`，真实目标用户验证 `#63`，证据综合与方向决策 `#64`；清理工作为 `#67`。

Product Director 在任何参与者联系、session 或数据产生之前取消并取代了 M8。Cooking Lab 当前阶段不招募参与者、不执行真人研究，也不继续建设研究流程。已上线但只服务该研究的 validation 页面、Footer 入口与专用反馈表单由 Issue #67 撤下。

M7 的 `ready for bounded external validation` 只保留为 readiness 结论，不代表下一阶段必须执行用户研究。M8 没有产生外部用户证据或产品方向结论；清理完成后不自动启动新的产品 Goal。

## 已完成：M10 Commercial-ready Content Rights / Provenance / Attribution Gate

GitHub tracking：Epic `#78`，current-library migration `#79`，unified Production gate `#80`，public bilingual disclosure `#81`，final QA / independent rights review `#82`，model and policy baseline `#83`。

M10 已通过 PR #84 完成并于 2026-09-06 merge。当前 50 项的 identity、preparation、Story、nutrition、cost、image 与 product-profile 已进入同一权利门禁；全量无 grandfathering 审计、稳定 blocked reason code、build/CI gate、双语来源与署名 UI、全站政策页、独立 code review 和独立 content-rights review 均已完成。merge 后 main CI、Vercel Production deployment、双语 Production smoke 与 100 个详情页 regression verification 均通过。

500+ 内容批量生产、多个 Story、详情章节导航、Taste UI 大升级、M11 与其他新 Goal 均未启动，是否进入后续阶段由 Product Director 决定。任何未来餐厅授权、酒类推广或大规模数据库导入仍需专业律师 checkpoint。
